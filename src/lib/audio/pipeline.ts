import { SAMPLE_RATE } from '../constants';

/**
 * Web Audio API integration layer.
 *
 * Handles output playback and sample loading for
 * the waveform/simulation UI.
 *
 * Lifecycle:
 *   1. new AudioPipeline()
 *   2. await init(volume)
 *   3. await loadSample('name')
 *   4. getSampleData('name') → Float32Array
 *   5. playBuffer(outputBuffer) for playback
 */
export class AudioPipeline {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sampleBuffers = new Map<string, AudioBuffer>();
  private activeSource: AudioBufferSourceNode | null = null;
  private playbackStartTime = 0;
  private playbackOffset = 0;
  private playbackDuration = 0;
  private initPromise: Promise<void> | null = null;

  async init(volume: number): Promise<void> {
    this.initPromise = this._init(volume);
    return this.initPromise;
  }

  private async _init(volume: number): Promise<void> {
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(this.ctx.destination);
  }

  /**
   * Wait for init to complete before proceeding.
   *
   * Call this before any operation that requires
   * the AudioContext to be ready.
   */
  async ready(): Promise<void> {
    await this.initPromise;
  }

  getSampleData(name: string): Float32Array | null {
    const buf = this.sampleBuffers.get(name);
    return buf ? buf.getChannelData(0) : null;
  }

  getSampleRate(): number {
    return this.ctx?.sampleRate ?? SAMPLE_RATE;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  async loadSample(name: string): Promise<void> {
    await this.ready();
    if (!this.ctx) {
      return; // destroyed before init resolved
    }

    if (this.sampleBuffers.has(name)) {
      return;
    }

    const res = await fetch(`/samples/${name}.wav`);
    if (!res.ok) {
      throw new Error(`Failed to load sample "${name}": HTTP ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
    this.sampleBuffers.set(name, audioBuf);
  }

  /**
   * Play a pre-simulated output buffer once.
   *
   * Calls `onEnded` when playback finishes
   * naturally (not when stopped manually).
   */
  playBuffer(buffer: Float32Array, onEnded?: () => void): void {
    if (!this.ctx || !this.gainNode) {
      return;
    }

    void this.ctx.resume();
    this.stopPlayback();

    const audioBuffer = this.ctx.createBuffer(
      1,
      buffer.length,
      this.ctx.sampleRate,
    );

    audioBuffer.copyToChannel(buffer as Float32Array<ArrayBuffer>, 0);

    this.activeSource = this.ctx.createBufferSource();
    this.activeSource.buffer = audioBuffer;
    this.activeSource.connect(this.gainNode);
    this.activeSource.onended = () => {
      this.activeSource = null;
      onEnded?.();
    };

    this.playbackStartTime = this.ctx.currentTime;
    this.playbackOffset = 0;
    this.playbackDuration = buffer.length / this.ctx.sampleRate;
    this.activeSource.start();
  }

  /**
   * Play a pre-simulated buffer starting at
   * the given offset in seconds.
   *
   * Used for resume-from-position playback when
   * the user clicks on the waveform display.
   */
  playBufferFrom(
    buffer: Float32Array,
    offsetSeconds: number,
    onEnded?: () => void,
  ): void {
    if (!this.ctx || !this.gainNode) {
      return;
    }

    void this.ctx.resume();
    this.stopPlayback();

    const sampleRate = this.ctx.sampleRate;
    const totalDuration = buffer.length / sampleRate;
    const clampedOffset = Math.max(0, Math.min(offsetSeconds, totalDuration));
    const offsetSamples = Math.floor(clampedOffset * sampleRate);

    if (offsetSamples >= buffer.length) {
      onEnded?.();
      return;
    }

    const audioBuffer = this.ctx.createBuffer(
      1,
      buffer.length - offsetSamples,
      sampleRate,
    );

    audioBuffer.copyToChannel(
      new Float32Array(buffer.subarray(offsetSamples)),
      0,
    );

    this.activeSource = this.ctx.createBufferSource();
    this.activeSource.buffer = audioBuffer;
    this.activeSource.connect(this.gainNode);
    this.activeSource.onended = () => {
      this.activeSource = null;
      onEnded?.();
    };

    this.playbackStartTime = this.ctx.currentTime;
    this.playbackOffset = clampedOffset;
    this.playbackDuration = totalDuration;
    this.activeSource.start();
  }

  /**
   * Returns the current playback position as a
   * fraction (0–1), or null if not playing.
   *
   * Used by the waveform display to draw the
   * playback cursor.
   */
  getPlaybackFraction(): number | null {
    if (!this.ctx || !this.activeSource) {
      return null;
    }

    const elapsed = this.ctx.currentTime - this.playbackStartTime;
    const currentTime = this.playbackOffset + elapsed;
    if (currentTime >= this.playbackDuration) {
      return null;
    }

    return currentTime / this.playbackDuration;
  }

  /**
   * Stop playback if currently playing.
   *
   * Silently ignores the call if nothing is
   * playing. Does not trigger the onEnded
   * callback.
   */
  stopPlayback(): void {
    if (this.activeSource) {
      this.activeSource.onended = null;
      try {
        this.activeSource.stop();
      } catch {
        // Ignore if already stopped
      }
      this.activeSource = null;
    }
  }

  stop(): void {
    this.stopPlayback();
    void this.ctx?.suspend();
  }

  destroy(): void {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
