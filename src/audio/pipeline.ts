// src/audio/pipeline.ts

const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 2048;

type OnInputBuffer = (buf: Float32Array) => void;

export class AudioPipeline {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sampleBuffers = new Map<string, AudioBuffer>();
  private sampleOffset = 0;
  private stream: MediaStream | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private onInputBuffer: OnInputBuffer | null = null;
  private nextPlayTime = 0;
  private activeSource: AudioBufferSourceNode | null = null;

  async init(volume: number): Promise<void> {
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(this.ctx.destination);
  }

  setVolume(volume: number): void {
    if (this.gainNode) this.gainNode.gain.value = volume;
  }

  async loadSample(name: string): Promise<void> {
    if (!this.ctx) throw new Error('Pipeline not initialized');
    if (this.sampleBuffers.has(name)) return;
    const res = await fetch(`/samples/${name}.wav`);
    if (!res.ok)
      throw new Error(`Failed to load sample "${name}": HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
    this.sampleBuffers.set(name, audioBuf);
  }

  /**
   * Start capturing input from a pre-loaded sample in a loop.
   * Calls onInputBuffer each time a new 2048-sample chunk is ready.
   */
  startSampleCapture(name: string, onInputBuffer: OnInputBuffer): void {
    if (!this.ctx) throw new Error('Pipeline not initialized');
    this.ctx.resume();
    const buf = this.sampleBuffers.get(name);
    if (!buf) throw new Error(`Sample "${name}" not loaded`);

    this.onInputBuffer = onInputBuffer;
    this.sampleOffset = 0;

    // Use a ScriptProcessorNode to drive the callback at buffer boundaries
    this.scriptNode = this.ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    this.scriptNode.onaudioprocess = () => {
      if (!buf || !this.onInputBuffer) return;
      const chunk = new Float32Array(BUFFER_SIZE);
      const channelData = buf.getChannelData(0);
      for (let i = 0; i < BUFFER_SIZE; i++) {
        chunk[i] = channelData[this.sampleOffset % channelData.length];
        this.sampleOffset++;
      }
      this.onInputBuffer(chunk);
    };
    // Connect to destination silently (script processor needs to be in graph)
    const silentGain = this.ctx.createGain();
    this.silentGain = silentGain;
    silentGain.gain.value = 0;
    this.scriptNode.connect(silentGain);
    silentGain.connect(this.ctx.destination);
  }

  /** Start capturing from the microphone/live input. */
  async startLiveCapture(onInputBuffer: OnInputBuffer): Promise<void> {
    if (!this.ctx) throw new Error('Pipeline not initialized');
    await this.ctx.resume();
    this.onInputBuffer = onInputBuffer;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.mediaSource = this.ctx.createMediaStreamSource(this.stream);
    this.scriptNode = this.ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    this.scriptNode.onaudioprocess = (e) => {
      if (!this.onInputBuffer) return;
      const chunk = new Float32Array(BUFFER_SIZE);
      chunk.set(e.inputBuffer.getChannelData(0));
      this.onInputBuffer(chunk);
    };
    this.mediaSource.connect(this.scriptNode);
    const silentGain = this.ctx.createGain();
    this.silentGain = silentGain;
    silentGain.gain.value = 0;
    this.scriptNode.connect(silentGain);
    silentGain.connect(this.ctx.destination);
  }

  /** Queue a processed output buffer for playback. */
  scheduleOutput(outputBuffer: Float32Array): void {
    if (!this.ctx || !this.gainNode) return;
    this.ctx.resume();
    const audioBuffer = this.ctx.createBuffer(
      1,
      outputBuffer.length,
      this.ctx.sampleRate,
    );
    audioBuffer.copyToChannel(outputBuffer, 0);
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const now = this.ctx.currentTime;
    // Schedule ahead by one buffer to allow for simulation latency
    const bufferDuration = BUFFER_SIZE / this.ctx.sampleRate;
    if (this.nextPlayTime < now + bufferDuration) {
      this.nextPlayTime = now + bufferDuration;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += bufferDuration;
  }

  /** Play a pre-simulated output buffer once. Calls onEnded when playback finishes naturally. */
  playBuffer(buffer: Float32Array, onEnded?: () => void): void {
    if (!this.ctx || !this.gainNode) return;
    void this.ctx.resume();
    this.stopPlayback();
    const audioBuffer = this.ctx.createBuffer(
      1,
      buffer.length,
      this.ctx.sampleRate,
    );
    audioBuffer.copyToChannel(buffer, 0);
    this.activeSource = this.ctx.createBufferSource();
    this.activeSource.buffer = audioBuffer;
    this.activeSource.connect(this.gainNode);
    if (onEnded) {
      this.activeSource.onended = () => {
        this.activeSource = null;
        onEnded();
      };
    }
    this.activeSource.start();
  }

  /** Stop batch playback if currently playing. */
  stopPlayback(): void {
    if (this.activeSource) {
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
    this.scriptNode?.disconnect();
    this.scriptNode = null;
    this.mediaSource?.disconnect();
    this.mediaSource = null;
    this.silentGain?.disconnect();
    this.silentGain = null;
    this.stream?.getTracks().forEach((t) => {
      t.stop();
    });
    this.stream = null;
    this.onInputBuffer = null;
    this.nextPlayTime = 0;
  }

  destroy(): void {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
