// Client-side speech synthesis & sound effects helper for Brightly Home Lesson
import { VoiceTone } from '../types';

export class TeacherSpeechEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  public static isSpeaking = false;
  private static listeners: Set<(isSpeaking: boolean, text: string) => void> = new Set();
  private static currentText = '';

  public static addListener(cb: (isSpeaking: boolean, text: string) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private static notify(speaking: boolean, text = '') {
    this.isSpeaking = speaking;
    this.currentText = text;
    this.listeners.forEach(cb => cb(speaking, text));
  }

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

    try {
      this.synth.cancel(); // cancel any ongoing speech

      let cleanText = text
        .replace(/[*_#•]/g, ' ')
        .replace(/\n+/g, '. ')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      // Phonics Mode Transformation (clear syllable spacing and enunciation pauses)
      if (voiceTone === 'phonics') {
        cleanText = cleanText
          .replace(/(\d+)\/(\d+)/g, '$1 over $2') // e.g. 1/2 -> 1 over 2
          .replace(/([A-Z]\))/g, '$1 ')
          .replace(/(=)/g, ' equals ')
          .replace(/(\+)/g, ' plus ')
          .replace(/(-)/g, ' minus ')
          .replace(/(×|\*)/g, ' multiplied by ')
          .replace(/(÷)/g, ' divided by ');
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      if (voiceTone === 'phonics') {
        // Phonics Voice: slightly slower for crisp enunciation & syllable articulation
        utterance.rate = 0.82;
        utterance.pitch = voicePreference === 'female' ? 1.18 : 1.05;
      } else {
        // Normal Nigerian Teacher Voice: warm, natural pedagogical pace
        utterance.rate = 0.93;
        utterance.pitch = voicePreference === 'female' ? 1.05 : 0.95;
      }

      // Find best English voice matching tone
      const voices = this.synth.getVoices();
      
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (voiceTone === 'phonics') {
        // Phonics prefers clear RP British or International English
        selectedVoice = voices.find(v => (v.lang.includes('GB') || v.lang.includes('UK') || v.name.toLowerCase().includes('enunciation') || v.name.toLowerCase().includes('natural')) && (voicePreference ? (voicePreference === 'female' ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('hazel') || v.name.toLowerCase().includes('susan') : true) : true)) ||
          voices.find(v => v.lang.includes('GB') || v.lang.includes('UK')) ||
          voices.find(v => v.lang.startsWith('en')) || null;
      } else {
        // Normal Nigerian teacher voice prefers Nigerian English or standard African/English voice
        selectedVoice = voices.find(v => v.lang.includes('NG') || v.name.toLowerCase().includes('nigeria') || v.name.toLowerCase().includes('african')) ||
          voices.find(v => v.lang.includes('GB') || v.lang.includes('UK')) ||
          voices.find(v => v.lang.startsWith('en')) || null;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.notify(true, cleanText);
      };

      utterance.onend = () => {
        this.notify(false, '');
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.notify(false, '');
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available', e);
      this.notify(false, '');
      if (onEnd) onEnd();
    }
  }

  public static stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
      this.notify(false, '');
    }
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

