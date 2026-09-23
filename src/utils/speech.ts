// Client-side robust speech synthesis & sound effects helper for Brightly Home Lesson
import { VoiceTone } from '../types';

// Global retention set to prevent V8 / Chromium garbage collection of active utterances
declare global {
  interface Window {
    __brightlyActiveUtterances?: Set<SpeechSynthesisUtterance>;
  }
}

if (typeof window !== 'undefined') {
  window.__brightlyActiveUtterances = window.__brightlyActiveUtterances || new Set();
}

export class TeacherSpeechEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  public static isSpeaking = false;
  private static listeners: Set<(isSpeaking: boolean, text: string) => void> = new Set();
  public static currentText = '';

  // Queue state for chunked sentence reading
  private static chunkQueue: string[] = [];
  private static currentChunkIndex = 0;
  private static currentSessionId = 0;
  private static currentOnEndCallback: (() => void) | null = null;
  private static currentVoicePreference?: 'female' | 'male';
  private static currentVoiceTone: VoiceTone = 'nigerian_teacher';
  private static watchdogTimer: any = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];

  static {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          this.cachedVoices = window.speechSynthesis.getVoices() || [];
        } catch (e) {
          // ignore
        }
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  public static addListener(cb: (isSpeaking: boolean, text: string) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private static notify(speaking: boolean, text = '') {
    this.isSpeaking = speaking;
    this.currentText = text;
    this.listeners.forEach((cb) => {
      try {
        cb(speaking, text);
      } catch (err) {
        console.error('Speech listener error:', err);
      }
    });
  }

  /**
   * Split text into clean, compact, natural sentence chunks (<120 chars each)
   * so that the browser's speech synthesis engine never hits the 15-second cutoff
   * and never freezes midway.
   */
  private static splitIntoChunks(rawText: string, voiceTone: VoiceTone): string[] {
    let clean = rawText
      .replace(/[*_#•`~]/g, ' ')
      .replace(/₦\s*(\d[\d,]*)/g, '$1 Naira') // e.g. ₦1,000 -> 1,000 Naira
      .replace(/(\d+)\/(\d+)/g, '$1 over $2') // e.g. 1/2 -> 1 over 2
      .replace(/\s+/g, ' ')
      .trim();

    if (voiceTone === 'phonics') {
      clean = clean
        .replace(/([A-Z]\))/g, '$1 ')
        .replace(/(=)/g, ' equals ')
        .replace(/(\+)/g, ' plus ')
        .replace(/(-)/g, ' minus ')
        .replace(/(×|\*)/g, ' multiplied by ')
        .replace(/(÷)/g, ' divided by ');
    }

    // Protect common abbreviations and decimals from premature split
    const protectedText = clean
      .replace(/(Mr|Mrs|Ms|Dr|Prof|Pri|No|e\.g|i\.e)\./gi, '$1_DOT_')
      .replace(/(\d+)\.(\d+)/g, '$1_DECIMAL_$2');

    // Split on sentence terminators: . ? ! ; : or newlines
    const rawSentences = protectedText.split(/(?<=[.?!;:\n])\s+/);
    const chunks: string[] = [];

    for (const rawSentence of rawSentences) {
      let sentence = rawSentence
        .replace(/_DOT_/g, '.')
        .replace(/_DECIMAL_/g, '.')
        .trim();

      if (!sentence) continue;

      // If a sentence is long, break it into natural clauses on commas or conjunctions
      if (sentence.length > 110) {
        // Split on comma or clause boundary
        const clauses = sentence.split(/(?<=[,])\s+/);
        let currentSub = '';

        for (const clause of clauses) {
          const trimmedClause = clause.trim();
          if (!trimmedClause) continue;

          if ((currentSub + ' ' + trimmedClause).trim().length > 110) {
            if (currentSub.trim()) {
              chunks.push(currentSub.trim());
            }
            currentSub = trimmedClause;
          } else {
            currentSub = currentSub ? `${currentSub} ${trimmedClause}` : trimmedClause;
          }
        }

        if (currentSub.trim()) {
          // If still excessively long, split by words
          if (currentSub.length > 130) {
            const words = currentSub.split(' ');
            let wordBuf = '';
            for (const w of words) {
              if ((wordBuf + ' ' + w).trim().length > 100) {
                if (wordBuf.trim()) chunks.push(wordBuf.trim());
                wordBuf = w;
              } else {
                wordBuf = wordBuf ? `${wordBuf} ${w}` : w;
              }
            }
            if (wordBuf.trim()) chunks.push(wordBuf.trim());
          } else {
            chunks.push(currentSub.trim());
          }
        }
      } else {
        chunks.push(sentence);
      }
    }

    return chunks.filter((c) => c.length > 0);
  }

  /**
   * Starts reading the queued sentence chunks sequentially.
   */
  public static speak(
    text: string, 
    onEnd?: () => void, 
    voicePreference?: 'female' | 'male',
    voiceTone: VoiceTone = 'nigerian_teacher'
  ) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    // Advance session ID to immediately cancel and discard any in-flight chunks
    const sessionId = ++this.currentSessionId;

    // Clear previous queues and halt active speech
    this.stopInternal(false);

    const chunks = this.splitIntoChunks(text, voiceTone);
    if (chunks.length === 0) {
      this.notify(false, '');
      if (onEnd) onEnd();
      return;
    }

    this.chunkQueue = chunks;
    this.currentChunkIndex = 0;
    this.currentOnEndCallback = onEnd || null;
    this.currentVoicePreference = voicePreference;
    this.currentVoiceTone = voiceTone;

    // Ensure audio synthesizer is not stuck in paused state
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch (e) {
      // ignore
    }

    this.startWatchdog(sessionId);
    this.playNextChunk(sessionId);
  }

  /**
   * Plays the next chunk in the queue for the matching sessionId.
   */
  private static playNextChunk(sessionId: number) {
    if (!this.synth || sessionId !== this.currentSessionId) return;

    if (this.currentChunkIndex >= this.chunkQueue.length) {
      // Entire text has completed
      this.clearWatchdog();
      this.notify(false, '');
      const cb = this.currentOnEndCallback;
      this.currentOnEndCallback = null;
      if (cb) {
        try {
          cb();
        } catch (e) {
          console.error('Speech onEnd callback error:', e);
        }
      }
      return;
    }

    const chunkText = this.chunkQueue[this.currentChunkIndex];
    this.currentChunkIndex += 1;

    try {
      const utterance = new SpeechSynthesisUtterance(chunkText);

      // Retain utterance in global Set to prevent V8 garbage collection mid-speech
      if (typeof window !== 'undefined' && window.__brightlyActiveUtterances) {
        window.__brightlyActiveUtterances.add(utterance);
      }

      // Configure voice settings
      if (this.currentVoiceTone === 'phonics') {
        utterance.lang = 'en-GB';
        utterance.rate = 0.86;
        utterance.pitch = this.currentVoicePreference === 'female' ? 1.12 : 1.02;
      } else {
        // Normal Voice (Nigerian English accent, cadence, and warmth)
        utterance.lang = 'en-NG';
        utterance.rate = 0.94;
        utterance.pitch = this.currentVoicePreference === 'female' ? 1.02 : 0.96;
      }

      // Voice selection
      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.synth.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;
      const isFemale = this.currentVoicePreference === 'female';

      if (this.currentVoiceTone === 'phonics') {
        selectedVoice = voices.find(v => 
          (v.lang.includes('GB') || v.lang.includes('UK') || v.name.toLowerCase().includes('enunciation') || v.name.toLowerCase().includes('natural')) &&
          (isFemale ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('hazel') : true)
        ) ||
        voices.find(v => v.lang.includes('GB') || v.lang.includes('UK')) ||
        voices.find(v => v.lang.startsWith('en')) || null;
      } else {
        // Normal Voice: Prioritize authentic Nigerian English (en-NG) and African voices
        selectedVoice = voices.find(v => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          const isNigerian = l.includes('en-ng') || l.includes('en_ng') || l === 'ng' || n.includes('nigeria') || n.includes('african');
          if (!isNigerian) return false;
          if (isFemale) {
            return n.includes('female') || n.includes('adeola') || n.includes('nkechi') || n.includes('funke') || !n.includes('male');
          } else {
            return n.includes('male') || n.includes('chidi') || n.includes('babatunde') || n.includes('emeka');
          }
        }) ||
        voices.find(v => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.includes('en-ng') || l.includes('en_ng') || n.includes('nigeria') || n.includes('african');
        }) ||
        voices.find(v => v.lang.includes('GB') || v.lang.includes('UK') || v.lang.includes('ZA')) ||
        voices.find(v => v.lang.startsWith('en')) || null;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      let hasFiredEnd = false;

      utterance.onstart = () => {
        if (sessionId !== this.currentSessionId) return;
        this.notify(true, chunkText);
      };

      utterance.onend = () => {
        if (hasFiredEnd) return;
        hasFiredEnd = true;

        if (typeof window !== 'undefined' && window.__brightlyActiveUtterances) {
          window.__brightlyActiveUtterances.delete(utterance);
        }

        if (sessionId !== this.currentSessionId) return;

        // Small inter-chunk breathing gap (40ms) allows browser audio buffers to flush cleanly
        setTimeout(() => {
          if (sessionId === this.currentSessionId) {
            this.playNextChunk(sessionId);
          }
        }, 40);
      };

      utterance.onerror = (e) => {
        if (hasFiredEnd) return;
        hasFiredEnd = true;

        if (typeof window !== 'undefined' && window.__brightlyActiveUtterances) {
          window.__brightlyActiveUtterances.delete(utterance);
        }

        // If session was replaced or cancelled, quietly exit
        if (sessionId !== this.currentSessionId || e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }

        console.warn('Utterance error encountered, advancing to next chunk:', e.error);
        setTimeout(() => {
          if (sessionId === this.currentSessionId) {
            this.playNextChunk(sessionId);
          }
        }, 40);
      };

      // Unpause if stuck
      if (this.synth.paused) {
        this.synth.resume();
      }

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech chunk dispatch error:', err);
      setTimeout(() => {
        if (sessionId === this.currentSessionId) {
          this.playNextChunk(sessionId);
        }
      }, 40);
    }
  }

  /**
   * Watchdog timer that monitors speech synthesis health.
   * Unlike older code, this NEVER calls pause() on active speech.
   * It only calls resume() if the browser has unexpectedly paused speech synthesis.
   */
  private static startWatchdog(sessionId: number) {
    this.clearWatchdog();
    this.watchdogTimer = setInterval(() => {
      if (sessionId !== this.currentSessionId) {
        this.clearWatchdog();
        return;
      }
      if (this.isSpeaking && this.synth) {
        if (this.synth.paused) {
          try {
            this.synth.resume();
          } catch (e) {
            // ignore
          }
        }
      }
    }, 2000);
  }

  private static clearWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private static stopInternal(notifyChange = true) {
    this.clearWatchdog();
    this.chunkQueue = [];
    this.currentChunkIndex = 0;
    this.currentOnEndCallback = null;

    if (typeof window !== 'undefined' && window.__brightlyActiveUtterances) {
      window.__brightlyActiveUtterances.clear();
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }

    if (notifyChange) {
      this.notify(false, '');
    }
  }

  public static stop() {
    this.currentSessionId += 1;
    this.stopInternal(true);
  }

  public static playSuccessChime() {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.08);
        osc.stop(audioCtx.currentTime + index * 0.08 + 0.35);
      });
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }
}
