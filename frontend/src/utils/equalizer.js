/**
 * Web Audio API Equalizer
 * Provides 3-band EQ (Bass, Mids, Treble) using BiquadFilterNodes
 */

class Equalizer {
  constructor(audioContext, audioElement) {
    this.audioContext = audioContext;
    this.audioElement = audioElement;
    this.source = null;
    this.bassFilter = null;
    this.midsFilter = null;
    this.trebleFilter = null;
    this.gainNode = null;
    this.isConnected = false;

    this.init();
  }

  init() {
    if (!this.audioContext || !this.audioElement) return;

    try {
      // Create source from audio element
      if (!this.source) {
        this.source = this.audioContext.createMediaElementAudioSource(this.audioElement);
      }

      // Create filters
      this.bassFilter = this.audioContext.createBiquadFilter();
      this.bassFilter.type = "lowshelf";
      this.bassFilter.frequency.value = 200; // 200Hz for bass
      this.bassFilter.gain.value = 0;

      this.midsFilter = this.audioContext.createBiquadFilter();
      this.midsFilter.type = "peaking";
      this.midsFilter.frequency.value = 1000; // 1kHz for mids
      this.midsFilter.Q.value = 0.5;
      this.midsFilter.gain.value = 0;

      this.trebleFilter = this.audioContext.createBiquadFilter();
      this.trebleFilter.type = "highshelf";
      this.trebleFilter.frequency.value = 3000; // 3kHz for treble
      this.trebleFilter.gain.value = 0;

      // Output gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1;

      // Connect: source -> bass -> mids -> treble -> gain -> destination
      this.source.connect(this.bassFilter);
      this.bassFilter.connect(this.midsFilter);
      this.midsFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isConnected = true;
    } catch (error) {
      console.error("Failed to initialize equalizer:", error);
      this.isConnected = false;
    }
  }

  /**
   * Set bass level (-20 to +20 dB)
   */
  setBass(value) {
    if (this.bassFilter) {
      this.bassFilter.gain.value = Math.max(-20, Math.min(20, value));
    }
  }

  /**
   * Set mids level (-20 to +20 dB)
   */
  setMids(value) {
    if (this.midsFilter) {
      this.midsFilter.gain.value = Math.max(-20, Math.min(20, value));
    }
  }

  /**
   * Set treble level (-20 to +20 dB)
   */
  setTreble(value) {
    if (this.trebleFilter) {
      this.trebleFilter.gain.value = Math.max(-20, Math.min(20, value));
    }
  }

  /**
   * Apply multiple EQ settings at once
   */
  setEQ(settings) {
    if (settings.bass !== undefined) this.setBass(settings.bass);
    if (settings.mids !== undefined) this.setMids(settings.mids);
    if (settings.treble !== undefined) this.setTreble(settings.treble);
  }

  /**
   * Reset EQ to flat
   */
  reset() {
    this.setBass(0);
    this.setMids(0);
    this.setTreble(0);
  }

  /**
   * Get current EQ values
   */
  getEQ() {
    return {
      bass: this.bassFilter?.gain.value || 0,
      mids: this.midsFilter?.gain.value || 0,
      treble: this.trebleFilter?.gain.value || 0,
    };
  }

  /**
   * Disconnect equalizer
   */
  disconnect() {
    if (this.isConnected) {
      try {
        this.source?.disconnect();
        this.bassFilter?.disconnect();
        this.midsFilter?.disconnect();
        this.trebleFilter?.disconnect();
        this.gainNode?.disconnect();
        this.isConnected = false;
      } catch (error) {
        console.error("Error disconnecting equalizer:", error);
      }
    }
  }

  /**
   * Reconnect after disconnect
   */
  reconnect() {
    if (!this.isConnected) {
      this.init();
    }
  }

  /**
   * Check if equalizer is properly connected
   */
  isActive() {
    return this.isConnected;
  }
}

export { Equalizer };
