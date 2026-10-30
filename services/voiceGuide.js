// src/services/voiceGuide.js

export const ROUTE_AUDIO_MAP = {
  "/": "/audio/welcome.mp3",
  "/auth": "/audio/auth.mp3",
  "/questions/personal": "/audio/questions_personal.mp3",
  "/questions/hypertension": "/audio/questions_hypertension.mp3",
  "/questions/diabetes": "/audio/questions_diabetes.mp3",
  "/handwash": "/audio/handwash.mp3",
  "/instructions/1": "/audio/instruction_scale.mp3",
  // "/instructions/2": "/audio/instruction_ppg.mp3",
  "/instructions/3": "/audio/instruction_bp.mp3",
  "/payment": "/audio/payment.mp3",
  "/processing": "/audio/processing.mp3",
  // Fallbacks if dynamic TTS is not ready:
  "/results": "/audio/results.mp3",
  "/receipt": "/audio/receipt.mp3",
};

class VoiceGuideManager {
  constructor() {
    this.currentAudio = null;
    this.isEnabled = true;
  }

  setEnabled(enabled) {
    this.isEnabled = Boolean(enabled);
    if (!this.isEnabled) {
      this.stop();
    }
  }

  getEnabled() {
    return this.isEnabled;
  }

  /**
   * Plays either the dynamically generated audio from sessionStorage or falls back to static files.
   * @param {string} pathname 
   */
  playForRoute(pathname) {
    this.stop();

    if (!this.isEnabled) return;

    // 1. Check for dynamic audio generated for Results & Receipt screens
    if (pathname.includes("/results")) {
      const dynamicResults = sessionStorage.getItem("tts_results_audio");
      if (dynamicResults) {
        this.playAudioSource(dynamicResults);
        return;
      }
    }

    if (pathname.includes("/receipt")) {
      const dynamicReceipt = sessionStorage.getItem("tts_receipt_audio");
      if (dynamicReceipt) {
        this.playAudioSource(dynamicReceipt);
        return;
      }
    }

    // 2. Fall back to static route audio
    const staticSrc = ROUTE_AUDIO_MAP[pathname];
    if (staticSrc) {
      this.playAudioSource(staticSrc);
    }
  }

  playCustom(audioSource) {
    this.stop();
    if (!this.isEnabled || !audioSource) return;
    this.playAudioSource(audioSource);
  }

  playAudioSource(src) {
    try {
      this.currentAudio = new Audio(src);

      this.currentAudio.onended = () => {
        this.currentAudio = null;
      };

      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`[voiceGuide] Playback prevented for ${src.slice(0, 40)}:`, err.message);
        });
      }
    } catch (err) {
      console.error("[voiceGuide] Error loading audio:", err);
    }
  }

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (err) {
        console.warn("[voiceGuide] Failed to stop audio:", err);
      } finally {
        this.currentAudio = null;
      }
    }
  }
}

export const voiceGuide = new VoiceGuideManager();
export default voiceGuide;