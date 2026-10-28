export const ROUTE_AUDIO_MAP = {
  // "/": "/audio/welcome.wav",
  // "/auth": "/audio/auth.wav",
  // "/questions/personal": "/audio/questions_personal.wav",
  // "/questions/hypertension": "/audio/questions_hypertension.wav",
  // "/questions/diabetes": "/audio/questions_diabetes.wav",
  // "/handwash": "/audio/handwash.wav",
  // "/instructions/1": "/audio/instruction_bp.wav",
  // "/instructions/2": "/audio/instruction_ppg.wav",
  // "/instructions/3": "/audio/instruction_scale.wav",
  // "/payment": "/audio/payment.wav",
  // "/processing": "/audio/processing.wav",
  // "/results": "/audio/results.wav",
  // "/receipt": "/audio/receipt.wav",
};

class VoiceGuideManager {
  constructor() {
    this.currentAudio = null;
    this.isEnabled = true;
  }

  /**
   * Enable or disable voice instructions globally.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.isEnabled = Boolean(enabled);
    if (!this.isEnabled) {
      this.stop();
    }
  }

  /**
   * Check if voice guidance is enabled.
   * @returns {boolean}
   */
  getEnabled() {
    return this.isEnabled;
  }

  /**
   * Plays the audio associated with a given pathname.
   * @param {string} pathname - e.g. "/auth" or "/questions/personal"
   */
  playForRoute(pathname) {
    this.stop();

    if (!this.isEnabled) return;

    const audioSrc = ROUTE_AUDIO_MAP[pathname];
    if (!audioSrc) return;

    this.playAudioSource(audioSrc);
  }

  /**
   * Plays an audio file directly from a URL or Blob object URL (e.g. from Gemini TTS).
   * @param {string} audioUrl
   */
  playCustom(audioUrl) {
    this.stop();

    if (!this.isEnabled || !audioUrl) return;

    this.playAudioSource(audioUrl);
  }

  /**
   * Internal helper to load and play an audio stream.
   * @private
   */
  playAudioSource(src) {
    try {
      this.currentAudio = new Audio(src);

      // Listeners for proper lifecycle handling
      this.currentAudio.onended = () => {
        this.currentAudio = null;
      };

      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy or user cancellation
          console.warn(
            `[voiceGuide] Audio playback prevented for ${src}:`,
            err.message,
          );
        });
      }
    } catch (err) {
      console.error("[voiceGuide] Error loading audio:", err);
    }
  }

  /**
   * Immediately silences and unloads the active audio clip.
   */
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

// Export a singleton instance for use across the entire application
export const voiceGuide = new VoiceGuideManager();
export default voiceGuide;
