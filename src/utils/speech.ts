// Client-side speech synthesis & sound effects helper for Brightly Home Lesson
import { VoiceTone } from '../types';

export class TeacherSpeechEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  public static isSpeaking = false;
  private static listeners: Set<(isSpeaking: boolean, text: string) => void> = new Set();
  public static currentText = '';

  // Queue state for chunked sentence reading
  private static chunkQueue: string[] = [];
  private static currentChunkIndex = 0;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static keepAliveTimer: any = null;
  private static currentOnEndCallback: (() => void) | null = null;
  private static currentVoicePreference?: 'female' | 'male';
  private static currentVoiceTone: VoiceTone = 'nigerian_teacher';

  public static addListener(cb: (isSpeaking: boolean, text: string) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private static notify(speaking: boolean, text = '') {
    this.isSpeaking = speaking;
    this.currentText = text;
    this.listeners.forEach(cb => cb(speaking, text));
  }

  /**
   * Split a large paragraph into natural, readable sentence chunks
   * so the browser's speech synthesis engine never times out or drops words.
   */
  private static splitIntoChunks(rawText: string, voiceTone: VoiceTone): string[] {
    let clean = rawText
      .replace(/[*_#•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (voiceTone === 'phonics') {
      clean = clean
        .replace(/(\d+)\/(\d+)/g, '$1 over $2') // e.g. 1/2 -> 1 over 2
        .replace(/([A-Z]\))/g, '$1 ')
        .replace(/(=)/g, ' equals ')
        .replace(/(\+)/g, ' plus ')
        .replace(/(-)/g, ' minus ')
        .replace(/(×|\*)/g, ' multiplied by ')
        .replace(/(÷)/g, ' divided by ');
    }

    // Split on sentence punctuation: periods, exclamation marks, question marks, semicolons
    const rawSegments = clean.split(/(?<=[.?!;:])\s+/);
    const chunks: string[] = [];

    for (const segment of rawSegments) {
      const s = segment.trim();
      if (!s) continue;

      // If a sentence is very long (over 140 chars), break it on commas or clauses
      if (s.length > 140) {
        const subParts = s.split(/(?<=[,])\s+/);
        let buffer = '';
        for (const sub of subParts) {
          if ((buffer + ' ' + sub).trim().length > 140) {
            if (buffer.trim()) chunks.push(buffer.trim());
            buffer = sub;
          } else {
            buffer = buffer ? `${buffer}, ${sub}` : sub;
          }
        }
        if (buffer.trim()) chunks.push(buffer.trim());
      } else {
        chunks.push(s);
      }
    }

    return chunks.length > 0 ? chunks : [clean];
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

    // Cancel existing speech and timers
    this.stop();

    const chunks = this.splitIntoChunks(text, voiceTone);
    if (chunks.length === 0 || !chunks[0]) {
      if (onEnd) onEnd();
      return;
    }

    this.chunkQueue = chunks;
    this.currentChunkIndex = 0;
    this.currentOnEndCallback = onEnd || null;
    this.currentVoicePreference = voicePreference;
    this.currentVoiceTone = voiceTone;

    this.startKeepAlive();
    this.playNextChunk();
  }

  private static playNextChunk() {
    if (!this.synth) return;

    if (this.currentChunkIndex >= this.chunkQueue.length) {
      // Completed all sentences in the phase
      this.clearKeepAlive();
      this.notify(false, '');
      const cb = this.currentOnEndCallback;
      this.currentOnEndCallback = null;
      if (cb) cb();
      return;
    }

    const chunkText = this.chunkQueue[this.currentChunkIndex];
    this.currentChunkIndex += 1;

    try {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      this.activeUtterance = utterance; // Prevent garbage collection in V8

      // Explicitly set language tag so browser/OS synthesizer invokes Nigerian English acoustic model
      if (this.currentVoiceTone === 'phonics') {
        utterance.lang = 'en-GB';
        utterance.rate = 0.84;
        utterance.pitch = this.currentVoicePreference === 'female' ? 1.15 : 1.05;
      } else {
        // Normal Voice (authentic Nigerian teacher accent, cadence, and warmth)
        utterance.lang = 'en-NG';
        utterance.rate = 0.95;
        utterance.pitch = this.currentVoicePreference === 'female' ? 1.02 : 0.95;
      }

      // Voice selection
      const voices = this.synth.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;
      const isFemale = this.currentVoicePreference === 'female';

      if (this.currentVoiceTone === 'phonics') {
        selectedVoice = voices.find(v => (v.lang.includes('GB') || v.lang.includes('UK') || v.name.toLowerCase().includes('enunciation') || v.name.toLowerCase().includes('natural')) && (isFemale ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('hazel') || v.name.toLowerCase().includes('susan') : true)) ||
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
        // Fallback to Commonwealth English with en-NG phonetic hint
        voices.find(v => v.lang.includes('GB') || v.lang.includes('UK') || v.lang.includes('ZA')) ||
        voices.find(v => v.lang.startsWith('en')) || null;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.notify(true, chunkText);
      };

      utterance.onend = () => {
        // Read the next chunk automatically without pause
        this.playNextChunk();
      };

      utterance.onerror = (e) => {
        console.warn('Utterance error or interrupt:', e);
        // Continue to next chunk instead of dying completely
        this.playNextChunk();
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech chunk playback error:', err);
      this.playNextChunk();
    }
  }

  /**
   * Browser keep-alive mechanism to prevent Chrome from silently pausing
   * speech synthesis after 10-15 seconds.
   */
  private static startKeepAlive() {
    this.clearKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.isSpeaking && this.synth) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 9000);
  }

  private static clearKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  public static stop() {
    this.clearKeepAlive();
    this.chunkQueue = [];
    this.currentChunkIndex = 0;
    this.currentOnEndCallback = null;
    this.activeUtterance = null;

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.notify(false, '');
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


