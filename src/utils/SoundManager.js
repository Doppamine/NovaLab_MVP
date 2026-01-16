class SoundManager {
  constructor() {
    this.context = null;
    this.buffers = {};
    this.engineSource = null;
    this.masterGain = null;
    this.isMuted = false;
    this.currentSessionId = null; // Track the current session
    this.snapUrl = '/sounds/snap.mp3';
    this.engineUrl = '/sounds/engine.mp3';
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  async loadBuffer(url) {
    if (this.buffers[url]) return this.buffers[url];

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers[url] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound: ${url}`, error);
      return null;
    }
  }

  async playSnap() {
    if (this.isMuted) return;
    this.init();

    const buffer = await this.loadBuffer(this.snapUrl);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 0.9 + Math.random() * 0.2;

    const gainNode = this.context.createGain();
    gainNode.gain.value = 0.4;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(0);
  }

  async startEngine() {
    // Generate a unique session ID for THIS start attempt
    const sessionId = Date.now() + Math.random();
    console.log('🔊 startEngine called, sessionId:', sessionId);

    // If there's already a session, stop it first
    if (this.currentSessionId !== null) {
      console.log('🔊 Session already exists, stopping it');
      this.stopEngine();
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Set THIS session as current
    this.currentSessionId = sessionId;
    console.log('🔊 Session set:', sessionId);

    if (this.isMuted) {
      this.currentSessionId = null;
      return;
    }

    this.init();

    const buffer = await this.loadBuffer(this.engineUrl);
    if (!buffer) {
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }
      return;
    }

    // CRITICAL: Check if THIS session is still current after async load!
    if (this.currentSessionId !== sessionId) {
      console.log('🔊 Session', sessionId, 'is stale, current is', this.currentSessionId, '- ABORTING');
      return;
    }

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.1;
    this.masterGain.connect(this.context.destination);

    this.engineSource = this.context.createBufferSource();
    this.engineSource.buffer = buffer;
    this.engineSource.loop = true;
    this.engineSource.connect(this.masterGain);

    this.engineSource.start(0);
    console.log('🔊 Engine STARTED for session:', sessionId);
  }

  setEnginePitch(speedRatio) {
    if (!this.engineSource || !this.context || this.currentSessionId === null) return;

    const minRate = 0.8;
    const maxRate = 2.0;
    const targetRate = minRate + (speedRatio * (maxRate - minRate));

    const t = this.context.currentTime;
    this.engineSource.playbackRate.setTargetAtTime(targetRate, t, 0.1);

    const minVol = 0.1;
    const maxVol = 0.3;
    const targetVol = minVol + (speedRatio * (maxVol - minVol));
    this.masterGain.gain.setTargetAtTime(targetVol, t, 0.1);
  }

  stopEngine() {
    console.log('🔊 stopEngine called, session:', this.currentSessionId);

    if (this.currentSessionId === null) {
      console.log('🔊 No active session');
      return;
    }

    // Clear session FIRST - this will cause any pending startEngine to abort
    this.currentSessionId = null;
    console.log('🔊 Session cleared');

    if (this.engineSource) {
      try {
        this.engineSource.stop();
        this.engineSource.disconnect();
        console.log('🔊 Source stopped');
      } catch (e) {
        console.log('🔊 Source error:', e.message);
      }
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
        console.log('🔊 Gain disconnected');
      } catch (e) {
        console.log('🔊 Gain error:', e.message);
      }
    }

    this.engineSource = null;
    this.masterGain = null;

    console.log('🔊 FULLY STOPPED');
  }
}

export default new SoundManager();
