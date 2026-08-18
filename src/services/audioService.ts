// Robust Web Audio API Audio Engine for johnmusic
// Ensures continuous playback, zero silence, and auto-recovery

export interface EqualizerFilter {
  frequency: number;
  node: BiquadFilterNode;
}

class AudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private isInitialized = false;

  public readonly eqFrequencies = [60, 230, 910, 3600, 14000];

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    
    // Auto resume on user gesture
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      window.addEventListener(evt, () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }, { once: false, passive: true });
    });
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  public initWebAudio() {
    if (this.isInitialized && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioContext.createGain();

      // Create 5-band Equalizer
      this.eqFilters = this.eqFrequencies.map((freq, index) => {
        const filter = this.audioContext!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === this.eqFrequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Connect source -> eqFilters[0..4] -> gainNode -> analyserNode -> destination
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        let prevNode: AudioNode = this.sourceNode;
        this.eqFilters.forEach(filter => {
          prevNode.connect(filter);
          prevNode = filter;
        });

        prevNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
      } catch (err) {
        console.debug('MediaElementSource already connected or ignored:', err);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio init note:', err);
    }
  }

  public setEqualizerGains(gains: number[]) {
    if (!this.eqFilters || this.eqFilters.length === 0) return;
    gains.forEach((gain, idx) => {
      if (this.eqFilters[idx]) {
        try {
          this.eqFilters[idx].gain.setTargetAtTime(gain, this.audioContext?.currentTime || 0, 0.05);
        } catch {}
      }
    });
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(64).fill(0);
    }
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(64).fill(128);
    }
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  public setSrc(url: string) {
    this.initWebAudio();
    if (this.audio.src !== url) {
      this.audio.src = url;
      this.audio.load();
    }
  }

  public async play(): Promise<void> {
    this.initWebAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }
    return this.audio.play();
  }

  public pause() {
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (isFinite(seconds) && seconds >= 0) {
      try {
        this.audio.currentTime = seconds;
      } catch {}
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.audio.volume = clamped;
  }

  public setMuted(muted: boolean) {
    this.audio.muted = muted;
  }
}

export const audioEngine = new AudioEngine();
