// Robust Nigerian Teacher Speech Synthesis & Audio Engine for Brightly Home Lesson
import { VoiceTone } from '../types';

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

  // Active HTML5 Audio playback for Gemini TTS
  private static activeAudio: HTMLAudioElement | null = null;
  private static blobCache: Map<string, string> = new Map();
  private static currentSessionId = 0;
  private static currentOnEndCallback: (() => void) | null = null;

  // Browser SpeechSynthesis fallback state
  private static chunkQueue: string[] = [];
  private static currentChunkIndex = 0;
  private static currentVoicePreference?: 'female' | 'male';
  private static currentVoiceTone: VoiceTone = 'nigerian_teacher';
  private static watchdogTimer: any = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static ttsClientBackoffUntil = 0;

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
   * Cleans text to ensure natural teacher delivery:
   * Replaces symbols, expands Naira, fractions, and strips out phase timings.
   */
  private static cleanTextForSpeech(rawText: string, voiceTone: VoiceTone): string {
    let clean = rawText
      .replace(/[*_#•`~]/g, ' ')
      .replace(/₦\s*(\d[\d,]*)/g, '$1 Naira') // e.g. ₦1,000 -> 1,000 Naira
      .replace(/(\d+)\/(\d+)/g, '$1 over $2') // e.g. 1/2 -> 1 over 2
      .replace(/\s+/g, ' ')
      .trim();

    // Replace Mr. and Mrs. with Mr and Mrs
    clean = clean
      .replace(/\bMr\.\s*/g, 'Mr ')
      .replace(/\bMrs\.\s*/g, 'Mrs ');

    // Teacher should not say out structural phase timings (e.g. 'Phase 1: 3 Mins', '5 mins')
    clean = clean
      .replace(/\bPhase\s*\d+\s*:?\s*/gi, '')
      .replace(/\b\d+\s*(mins?|minutes?)\b\.?\s*/gi, '')
      .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s*(mins?|minutes?)\b\.?\s*/gi, '')
      .replace(/\b\d+-minute\b/gi, '')
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

    return clean;
  }

  /**
   * Helper to convert base64 to Blob URL
   */
  private static base64ToBlobUrl(base64: string, mimeType = 'audio/wav'): string {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Main entry point to speak text.
   * Prioritizes Gemini-powered authentic Nigerian Teacher Voice via /api/tts.
   * Falls back seamlessly to browser SpeechSynthesis if offline.
   */
  public static speak(
    text: string,
    onEnd?: () => void,
    voicePreference?: 'female' | 'male',
    voiceTone: VoiceTone = 'nigerian_teacher',
    teacherName?: string
  ) {
    if (typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    const sessionId = ++this.currentSessionId;
    this.stopInternal(false);

    const clean = this.cleanTextForSpeech(text, voiceTone);
    if (!clean) {
      this.notify(false, '');
      if (onEnd) onEnd();
      return;
    }

    this.currentVoicePreference = voicePreference;
    this.currentVoiceTone = voiceTone;
    this.currentOnEndCallback = onEnd || null;

    // Immediately notify UI that the teacher has begun preparing / speaking
    this.notify(true, clean);

    const cacheKey = `${voiceTone}-${voicePreference || 'female'}-${clean}`;

    // 1. Check client-side memory cache for instantaneous 0ms playback
    if (this.blobCache.has(cacheKey)) {
      const blobUrl = this.blobCache.get(cacheKey)!;
      this.playAudioBlob(blobUrl, sessionId, onEnd, clean);
      return;
    }

    // 2. If TTS quota or backoff is currently active, use browser speech synthesis directly
    if (Date.now() < TeacherSpeechEngine.ttsClientBackoffUntil) {
      this.speakBrowserFallback(clean, sessionId, onEnd, voicePreference, voiceTone);
      return;
    }

    // 3. Fetch from /api/tts for genuine Nigerian Teacher voice synthesis
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        gender: voicePreference || 'female',
        voiceTone,
        teacherName
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`TTS server returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // If session changed while request was in-flight, discard
        if (sessionId !== this.currentSessionId) return;

        if (data.success && data.audioBase64) {
          const blobUrl = this.base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
          this.blobCache.set(cacheKey, blobUrl);
          this.playAudioBlob(blobUrl, sessionId, onEnd, clean);
        } else {
          // If server reported quota or fallback, back off client network requests
          if (data.quotaExceeded) {
            TeacherSpeechEngine.ttsClientBackoffUntil = Date.now() + 60000;
          }
          this.speakBrowserFallback(clean, sessionId, onEnd, voicePreference, voiceTone);
        }
      })
      .catch(() => {
        // Seamlessly use client synthesis if network or server unavailable
        if (sessionId === this.currentSessionId) {
          this.speakBrowserFallback(clean, sessionId, onEnd, voicePreference, voiceTone);
        }
      });
  }

  /**
   * Plays the audio blob via HTML5 Audio element
   */
  private static playAudioBlob(
    blobUrl: string,
    sessionId: number,
    onEnd: (() => void) | undefined,
    text: string
  ) {
    try {
      const audio = new Audio(blobUrl);
      this.activeAudio = audio;

      audio.onplay = () => {
        if (sessionId !== this.currentSessionId) {
          audio.pause();
          return;
        }
        this.notify(true, text);
      };

      audio.onended = () => {
        if (sessionId !== this.currentSessionId) return;
        this.activeAudio = null;
        this.notify(false, '');
        if (onEnd) {
          try {
            onEnd();
          } catch (e) {
            console.error('TTS onEnd callback error:', e);
          }
        }
      };

      audio.onerror = (e) => {
        console.warn('Audio playback error, falling back to browser synthesis:', e);
        if (sessionId === this.currentSessionId) {
          this.activeAudio = null;
          this.speakBrowserFallback(text, sessionId, onEnd, this.currentVoicePreference, this.currentVoiceTone);
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy or user gesture requirement
          console.warn('Audio play promise rejected:', err);
          if (sessionId === this.currentSessionId) {
            this.speakBrowserFallback(text, sessionId, onEnd, this.currentVoicePreference, this.currentVoiceTone);
          }
        });
      }
    } catch (err) {
      console.warn('Failed to initialize Audio element:', err);
      this.speakBrowserFallback(text, sessionId, onEnd, this.currentVoicePreference, this.currentVoiceTone);
    }
  }

  /**
   * Browser SpeechSynthesis fallback with optimized Nigerian teacher cadence
   */
  private static speakBrowserFallback(
    text: string,
    sessionId: number,
    onEnd: (() => void) | undefined,
    voicePreference?: 'female' | 'male',
    voiceTone: VoiceTone = 'nigerian_teacher'
  ) {
    if (!this.synth) {
      this.notify(false, '');
      if (onEnd) onEnd();
      return;
    }

    const chunks = this.splitIntoChunks(text);
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

  private static splitIntoChunks(clean: string): string[] {
    const protectedText = clean
      .replace(/(Mr|Mrs|Ms|Dr|Prof|Pri|No|e\.g|i\.e)\./gi, '$1_DOT_')
      .replace(/(\d+)\.(\d+)/g, '$1_DECIMAL_$2');

    const rawSentences = protectedText.split(/(?<=[.?!;:\n])\s+/);
    const chunks: string[] = [];

    for (const rawSentence of rawSentences) {
      const sentence = rawSentence
        .replace(/_DOT_/g, '.')
        .replace(/_DECIMAL_/g, '.')
        .trim();
      if (!sentence) continue;

      if (sentence.length > 120) {
        const clauses = sentence.split(/(?<=[,])\s+/);
        let currentSub = '';

        for (const clause of clauses) {
          const trimmedClause = clause.trim();
          if (!trimmedClause) continue;

          if ((currentSub + ' ' + trimmedClause).trim().length > 110) {
            if (currentSub.trim()) chunks.push(currentSub.trim());
            currentSub = trimmedClause;
          } else {
            currentSub = currentSub ? `${currentSub} ${trimmedClause}` : trimmedClause;
          }
        }
        if (currentSub.trim()) chunks.push(currentSub.trim());
      } else {
        chunks.push(sentence);
      }
    }

    return chunks.filter((c) => c.length > 0);
  }

  private static playNextChunk(sessionId: number) {
    if (!this.synth || sessionId !== this.currentSessionId) return;

    if (this.currentChunkIndex >= this.chunkQueue.length) {
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

      if (typeof window !== 'undefined' && window.__brightlyActiveUtterances) {
        window.__brightlyActiveUtterances.add(utterance);
      }

      const isFemale = this.currentVoicePreference === 'female';

      if (this.currentVoiceTone === 'phonics') {
        utterance.lang = 'en-GB';
        utterance.rate = 0.86;
        utterance.pitch = isFemale ? 1.12 : 1.02;
      } else {
        // Nigerian teacher voice: Natural Nigerian English cadence, warm and encouraging
        utterance.lang = 'en-NG';
        utterance.rate = 0.94;
        utterance.pitch = isFemale ? 1.02 : 0.96;
      }

      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.synth.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (this.currentVoiceTone === 'phonics') {
        selectedVoice = voices.find(v =>
          (v.lang.includes('GB') || v.lang.includes('UK')) &&
          (isFemale ? v.name.toLowerCase().includes('female') : true)
        ) || voices.find(v => v.lang.startsWith('en')) || null;
      } else {
        // Nigerian voice: Prioritize authentic Nigerian English (en-NG) and African voices
        selectedVoice = voices.find(v => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.includes('en-ng') || l.includes('en_ng') || l === 'ng' || n.includes('nigeria') || n.includes('african');
        }) ||
        voices.find(v => {
          const l = v.lang.toLowerCase();
          return l.includes('en-gh') || l.includes('en-za');
        }) ||
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

        if (sessionId !== this.currentSessionId || e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }

        setTimeout(() => {
          if (sessionId === this.currentSessionId) {
            this.playNextChunk(sessionId);
          }
        }, 40);
      };

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

    // Stop active HTML5 audio
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.activeAudio = null;
    }

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
