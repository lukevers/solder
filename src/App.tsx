import { ChevronRight, Maximize2, Repeat, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AudioControls } from './components/AudioControls';
import { CircuitAnalyzer } from './components/CircuitAnalyzer';
import { ExamplesPanel } from './components/ExamplesPanel';
import { Inspector } from './components/Inspector';
import { PedalPanel } from './components/PedalPanel';
import { SchematicCanvas } from './components/SchematicCanvas';
import { StatusBar } from './components/StatusBar';
import { SweepResults } from './components/SweepResults';
import { Toolbar } from './components/Toolbar';
import {
  WaveformDisplay,
  type WaveformSelection,
} from './components/WaveformDisplay';
import { WaveformModal } from './components/WaveformModal';
import { WelcomeModal } from './components/WelcomeModal';
import {
  deleteLocalSample as deletePersistedLocalSample,
  getLocalSampleBuffer,
  listLocalSamples,
  saveLocalSample,
} from './lib/audio/local-sample-store';
import { AudioPipeline } from './lib/audio/pipeline';
import {
  AUDIO_SOURCE_TYPE,
  type SimulateRequest,
  type SimulateResponse,
  SWEEP_POSITIONS,
  WORKER_MESSAGE_TYPE,
} from './lib/simulation-types';
import { useStore } from './store';
import { SIMULATION_STATUS, SWEEP_STATUS } from './store/constants';
import {
  useAudioActions,
  useAudioState,
  useCircuitState,
  useHistoryActions,
  useSimulationActions,
  useSimulationState,
  useSweepActions,
  useSweepState,
  useViewportState,
  useWelcomeState,
} from './store/hooks';

export default function App() {
  const { nodes, edges } = useCircuitState();
  const {
    outputBuffer,
    simulationDuration,
    simulatedInput,
    inputFrequency,
    inputAmplitude,
  } = useSimulationState();
  const {
    setSimulationStatus,
    setOutputBuffer,
    clearOutputBuffer,
    setSimulationError,
    setSimulatedInput,
  } = useSimulationActions();
  const { audioSource, volume, playing } = useAudioState();
  const {
    setAudioSource,
    setLocalSamples,
    addLocalSample,
    removeLocalSample,
    setPlaying,
  } = useAudioActions();
  const { undo, redo } = useHistoryActions();
  const { sweepResults, sweepStatus, sweepPlayingIndex } = useSweepState();
  const { hasSeenWelcome, setHasSeenWelcome } = useWelcomeState();
  const {
    requestSweep,
    addSweepResult,
    completeSweep,
    failSweep,
    clearSweep,
    setSweepPlayingIndex,
  } = useSweepActions();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showWaveformModal, setShowWaveformModal] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [sourceBuffer, setSourceBuffer] = useState<Float32Array | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [selection, setSelection] = useState<WaveformSelection | null>(null);
  const [looping, setLooping] = useState(false);
  const [waveformOpen, setWaveformOpen] = useState(true);
  const [waveformTooltip, setWaveformTooltip] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const loopingRef = useRef(false);
  const pendingInputRef = useRef<Float32Array | null>(null);

  /**
   * Convert the selected audio source into the
   * cache key used by `AudioPipeline`.
   *
   * Bundled samples use their filename stem while
   * local uploads use a generated UUID.
   */
  const getAudioSourceKey = useCallback(
    (source = audioSource) => {
      return source.type === AUDIO_SOURCE_TYPE.sample ? source.name : source.id;
    },
    [audioSource],
  );

  const { viewResetKey } = useViewportState();
  const viewResetKeyRef = useRef(viewResetKey);
  useEffect(() => {
    // Skip the initial render
    if (viewResetKeyRef.current === viewResetKey) {
      return;
    }
    viewResetKeyRef.current = viewResetKey;
    setPlaying(false);
    setPlayingOriginal(false);
    setSelection(null);
  }, [viewResetKey, setPlaying]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Skip when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        const { selectedNodeId, nodes, rotateNode } = useStore.getState();
        if (!selectedNodeId) {
          return;
        }
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (!node) {
          return;
        }
        const cur = node.rotation ?? 0;
        const next = e.shiftKey ? (cur - 90 + 360) % 360 : (cur + 90) % 360;
        rotateNode(selectedNodeId, next);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const workerRef = useRef<Worker | null>(null);
  const sweepWorkersRef = useRef<Array<Worker>>([]);
  const pipelineRef = useRef<AudioPipeline | null>(null);
  const simStartRef = useRef<number | null>(null);

  // Refs so callbacks read current values without stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectionRef = useRef(selection);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  useEffect(() => {
    loopingRef.current = looping;
  }, [looping]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  /**
   * Show the onboarding modal automatically for first-time visitors.
   *
   * The persisted store flag survives refreshes, while the actual open/close
   * UI state remains local to the app shell so the toolbar can reopen it
   * without affecting persistence.
   */
  useEffect(() => {
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, [hasSeenWelcome]);

  /**
   * Clear the current waveform selection from
   * both React state and the mutable ref used by
   * simulation/playback callbacks.
   *
   * Several callbacks read selectionRef.current
   * synchronously. Clearing only the state leaves
   * a short window where those callbacks can
   * still use a stale slice of the source audio.
   */
  const clearSelection = useCallback(() => {
    selectionRef.current = null;
    setSelection(null);
  }, []);

  /**
   * Lazily create the AudioContext after a user
   * gesture.
   *
   * Browsers block auto-starting audio on page
   * load, so we defer initialization until the
   * user interacts with the app.
   */
  const initializeAudio = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (!pipeline) {
      return null;
    }

    await pipeline.init(volume);
    setAudioReady(true);
    return pipeline;
  }, [volume]);

  /**
   * Ensure the currently-selected sample is
   * decoded and cached before an action needs it.
   *
   * This keeps simulation and playback working
   * even when the very first user gesture is the
   * button click that requested audio.
   */
  const ensureSelectedSampleLoaded = useCallback(async () => {
    const pipeline = await initializeAudio();
    if (!pipeline) {
      return null;
    }

    if (audioSource.type === AUDIO_SOURCE_TYPE.sample) {
      await pipeline.loadSample(audioSource.name);
    } else if (!pipeline.hasSample(getAudioSourceKey())) {
      const persistedBuffer = await getLocalSampleBuffer(getAudioSourceKey());

      if (!persistedBuffer) {
        throw new Error(
          `Local sample "${audioSource.name}" could not be found in persisted storage.`,
        );
      }

      await pipeline.loadArrayBufferSample(
        getAudioSourceKey(),
        persistedBuffer,
      );
    }

    const buffer = pipeline.getSampleData(getAudioSourceKey());
    setSourceBuffer(buffer);
    return buffer;
  }, [audioSource, getAudioSourceKey, initializeAudio]);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data;
      if (msg.type === WORKER_MESSAGE_TYPE.result) {
        const elapsed =
          simStartRef.current != null
            ? (performance.now() - simStartRef.current) / 1000
            : undefined;
        simStartRef.current = null;
        setSimulationStatus(SIMULATION_STATUS.idle);
        setOutputBuffer(msg.outputBuffer, elapsed);
        setSimulatedInput(pendingInputRef.current);
        clearSelection();
        pendingInputRef.current = null;
      } else {
        setSimulationStatus(SIMULATION_STATUS.error);
        setSimulationError(msg.message);
      }
    };
    workerRef.current.onerror = (e: ErrorEvent) => {
      setSimulationStatus(SIMULATION_STATUS.error);
      setSimulationError(e.message ?? 'Worker crashed');
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, [
    setSimulationStatus,
    setOutputBuffer,
    setSimulationError,
    setSimulatedInput,
    clearSelection,
  ]);

  // Initialize audio pipeline container once on mount.
  useEffect(() => {
    const pipeline = new AudioPipeline();
    pipelineRef.current = pipeline;

    return () => {
      pipeline.destroy();
      pipelineRef.current = null;
    };
  }, []);

  /**
   * Restore persisted local-sample metadata from
   * IndexedDB on boot.
   *
   * We hydrate only the sidebar list here. WAV
   * bytes remain on disk until the user actually
   * selects or simulates a local sample.
   */
  useEffect(() => {
    let cancelled = false;

    void listLocalSamples()
      .then((samples) => {
        if (!cancelled) {
          setLocalSamples(samples);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalSamples([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setLocalSamples]);

  /**
   * Prime the audio pipeline on the first user
   * gesture so the browser allows the context to
   * start without warnings.
   */
  useEffect(() => {
    if (audioReady) {
      return;
    }

    function onFirstGesture() {
      void initializeAudio();
    }

    window.addEventListener('pointerdown', onFirstGesture, { passive: true });
    window.addEventListener('keydown', onFirstGesture);

    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, [audioReady, initializeAudio]);

  /**
   * Load the selected sample and invalidate any
   * derived simulation state when the input
   * source changes.
   *
   * Simulated output is tied to the previously
   * selected source audio, so keeping it around
   * after a source switch shows stale results and
   * mismatched waveform overlays.
   */
  useEffect(() => {
    clearOutputBuffer();
    clearSelection();

    if (!audioReady) {
      setSourceBuffer(null);
      return;
    }

    const key = getAudioSourceKey();
    let cancelled = false;
    const pipeline = pipelineRef.current;

    if (!pipeline) {
      return;
    }

    const loadPromise =
      audioSource.type === AUDIO_SOURCE_TYPE.sample
        ? pipeline.loadSample(audioSource.name)
        : pipeline.hasSample(key)
          ? Promise.resolve()
          : getLocalSampleBuffer(key).then((persistedBuffer) => {
              if (!persistedBuffer) {
                throw new Error(
                  `Local sample "${audioSource.name}" could not be found in persisted storage.`,
                );
              }

              return pipeline.loadArrayBufferSample(key, persistedBuffer);
            });

    loadPromise
      .then(() => {
        if (!cancelled) {
          setSourceBuffer(pipeline.getSampleData(key));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSimulationError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    audioReady,
    audioSource,
    clearSelection,
    clearOutputBuffer,
    getAudioSourceKey,
    setSimulationError,
  ]);

  // Sync volume changes
  useEffect(() => {
    pipelineRef.current?.setVolume(volume);
  }, [volume]);

  // Unified playback effect — only one of playing/playingOriginal is true at a time
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) {
      return;
    }

    function playWithLoop(buf: Float32Array, onStop: () => void) {
      const onEnded = () => {
        if (loopingRef.current) {
          pipeline!.playBuffer(buf, onEnded);
        } else {
          onStop();
        }
      };
      pipeline!.playBuffer(buf, onEnded);
    }

    if (playing && outputBuffer) {
      playWithLoop(outputBuffer, () => setPlaying(false));
    } else if (playingOriginal && sourceBuffer) {
      const sel = selectionRef.current;
      if (sel) {
        const start = Math.floor(sel.start * sourceBuffer.length);
        const end = Math.floor(sel.end * sourceBuffer.length);
        const sliced = new Float32Array(sourceBuffer.subarray(start, end));
        playWithLoop(sliced, () => setPlayingOriginal(false));
      } else {
        playWithLoop(sourceBuffer, () => setPlayingOriginal(false));
      }
    } else {
      pipeline.stopPlayback();
    }
  }, [playing, playingOriginal, outputBuffer, sourceBuffer, setPlaying]);

  const handlePlayOriginal = useCallback(async () => {
    const inputBuffer = await ensureSelectedSampleLoaded();
    if (!inputBuffer) {
      return;
    }

    setPlaying(false);
    setPlayingOriginal(true);
  }, [ensureSelectedSampleLoaded, setPlaying]);

  const handlePlayOutput = useCallback(async () => {
    const pipeline = await initializeAudio();
    if (!pipeline) {
      return;
    }

    setPlayingOriginal(false);
    setPlaying(true);
  }, [initializeAudio, setPlaying]);

  const handleStop = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(false);
  }, [setPlaying]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(false);
    clearOutputBuffer();
    setSimulatedInput(null);
    clearSelection();
  }, [setPlaying, clearOutputBuffer, clearSelection, setSimulatedInput]);

  /**
   * Dismiss the onboarding modal and persist that the user has already seen
   * the first-run guide.
   */
  const handleCloseWelcomeModal = useCallback(() => {
    setShowWelcomeModal(false);

    if (!hasSeenWelcome) {
      setHasSeenWelcome(true);
    }
  }, [hasSeenWelcome, setHasSeenWelcome]);

  /**
   * Extract the input audio buffer from the
   * current audio source and waveform selection.
   *
   * Returns the buffer, its sample rate, and the
   * effective duration. When no sample data is
   * available, returns the defaults so a SIN
   * test tone is used instead.
   *
   * Once an output waveform is visible we ignore
   * any previous selection, because the UI is now
   * showing the simulated slice rather than the
   * full source waveform. Reusing a hidden
   * selection here makes later simulations and
   * playback look arbitrarily truncated.
   */
  const extractInputBuffer = useCallback(() => {
    const pipeline = pipelineRef.current;

    if (!pipeline) {
      return {
        inputBuffer: undefined as Float32Array | undefined,
        inputSampleRate: undefined as number | undefined,
        duration: simulationDuration,
      };
    }

    const data = pipeline.getSampleData(getAudioSourceKey());

    if (!data) {
      return {
        inputBuffer: undefined as Float32Array | undefined,
        inputSampleRate: undefined as number | undefined,
        duration: simulationDuration,
      };
    }

    const sel = outputBuffer ? null : selectionRef.current;
    let inputBuffer: Float32Array;

    if (sel) {
      const startSample = Math.floor(sel.start * data.length);
      const endSample = Math.floor(sel.end * data.length);
      inputBuffer = new Float32Array(data.subarray(startSample, endSample));
    } else {
      inputBuffer = data;
    }

    const inputSampleRate = pipeline.getSampleRate();
    const duration = inputBuffer.length / inputSampleRate;

    return { inputBuffer, inputSampleRate, duration };
  }, [getAudioSourceKey, outputBuffer, simulationDuration]);

  const handleSimulate = useCallback(async () => {
    if (!workerRef.current) {
      return;
    }

    try {
      if (
        audioSource.type === AUDIO_SOURCE_TYPE.sample ||
        audioSource.type === AUDIO_SOURCE_TYPE.localSample
      ) {
        await ensureSelectedSampleLoaded();
      }

      setSimulationStatus(SIMULATION_STATUS.running);
      simStartRef.current = performance.now();

      const { inputBuffer, inputSampleRate, duration } = extractInputBuffer();

      const request: SimulateRequest = {
        type: 'simulate',
        nodes: nodesRef.current,
        edges: edgesRef.current,
        duration,
        frequency: inputFrequency,
        amplitude: inputAmplitude,
        inputBuffer,
        inputSampleRate,
      };

      pendingInputRef.current = inputBuffer
        ? new Float32Array(inputBuffer)
        : null;
      workerRef.current.postMessage(request);
    } catch (err) {
      setSimulationStatus(SIMULATION_STATUS.error);
      setSimulationError(err instanceof Error ? err.message : String(err));
    }
  }, [
    audioSource.type,
    ensureSelectedSampleLoaded,
    setSimulationStatus,
    setSimulationError,
    extractInputBuffer,
    inputFrequency,
    inputAmplitude,
  ]);

  const handleSweep = useCallback(
    async (nodeId: string) => {
      // Terminate any previous sweep workers
      for (const w of sweepWorkersRef.current) {
        w.terminate();
      }

      sweepWorkersRef.current = [];

      requestSweep(nodeId);

      if (
        audioSource.type === AUDIO_SOURCE_TYPE.sample ||
        audioSource.type === AUDIO_SOURCE_TYPE.localSample
      ) {
        await ensureSelectedSampleLoaded();
      }

      const { inputBuffer, inputSampleRate, duration } = extractInputBuffer();

      let completed = 0;
      let failed = false;
      const total = SWEEP_POSITIONS.length;

      for (const position of SWEEP_POSITIONS) {
        const worker = new Worker(
          new URL('./workers/simulation.worker.ts', import.meta.url),
          { type: 'module' },
        );
        sweepWorkersRef.current.push(worker);

        // Clone nodes with the target pot's position overridden
        const sweepNodes = nodesRef.current.map((n) =>
          n.id === nodeId && n.type === 'pot'
            ? { ...n, data: { ...n.data, position } }
            : n,
        );

        worker.onmessage = (e: MessageEvent<SimulateResponse>) => {
          if (failed) {
            return;
          }
          const msg = e.data;
          if (msg.type === WORKER_MESSAGE_TYPE.result) {
            addSweepResult({ position, outputBuffer: msg.outputBuffer });
            completed++;
            if (completed === total) {
              completeSweep();
              for (const w of sweepWorkersRef.current) {
                w.terminate();
              }
              sweepWorkersRef.current = [];
            }
          } else {
            failed = true;
            failSweep(msg.message);
            for (const w of sweepWorkersRef.current) {
              w.terminate();
            }
            sweepWorkersRef.current = [];
          }
        };

        worker.onerror = (e: ErrorEvent) => {
          if (failed) {
            return;
          }
          failed = true;
          failSweep(e.message ?? 'Sweep worker crashed');
          for (const w of sweepWorkersRef.current) {
            w.terminate();
          }
          sweepWorkersRef.current = [];
        };

        const request: SimulateRequest = {
          type: 'simulate',
          nodes: sweepNodes,
          edges: edgesRef.current,
          duration,
          frequency: inputFrequency,
          amplitude: inputAmplitude,
          inputBuffer: inputBuffer ? new Float32Array(inputBuffer) : undefined,
          inputSampleRate,
        };
        worker.postMessage(request);
      }
    },
    [
      audioSource.type,
      requestSweep,
      addSweepResult,
      completeSweep,
      failSweep,
      ensureSelectedSampleLoaded,
      extractInputBuffer,
      inputFrequency,
      inputAmplitude,
    ],
  );

  // Handle sweep playback
  useEffect(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline) {
      return;
    }
    if (sweepPlayingIndex != null && sweepResults[sweepPlayingIndex]) {
      const buf = sweepResults[sweepPlayingIndex].outputBuffer;
      pipeline.playBuffer(buf, () => setSweepPlayingIndex(null));
    }
  }, [sweepPlayingIndex, sweepResults, setSweepPlayingIndex]);

  /**
   * Decode and register a user-selected WAV file
   * as a runtime-only sample option.
   *
   * Successful uploads become the active input
   * source immediately so the user can preview or
   * simulate them without extra clicks.
   */
  const handleUploadLocalSample = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.wav')) {
        setSimulationError('Only .wav files are supported for local uploads.');
        return;
      }

      try {
        const pipeline = await initializeAudio();
        if (!pipeline) {
          return;
        }

        const id = crypto.randomUUID();
        const data = await file.arrayBuffer();

        const sample = {
          id,
          name: file.name.replace(/\.wav$/i, ''),
        };

        await saveLocalSample({
          ...sample,
          data: data.slice(0),
        });

        await pipeline.loadArrayBufferSample(id, data);
        addLocalSample(sample);
        setAudioSource({
          type: AUDIO_SOURCE_TYPE.localSample,
          id: sample.id,
          name: sample.name,
        });
        setSourceBuffer(pipeline.getSampleData(sample.id));
        clearSelection();
      } catch (err) {
        setSimulationError(
          err instanceof Error
            ? `Failed to load WAV file: ${err.message}`
            : `Failed to load WAV file: ${String(err)}`,
        );
      }
    },
    [
      addLocalSample,
      clearSelection,
      initializeAudio,
      setAudioSource,
      setSimulationError,
    ],
  );

  /**
   * Remove a user-uploaded sample from both the
   * runtime store and the decoded audio cache.
   *
   * If the deleted sample is currently selected,
   * the store falls back to the bundled guitar
   * sample.
   */
  const handleRemoveLocalSample = useCallback(
    async (id: string) => {
      setPlaying(false);
      setPlayingOriginal(false);
      await deletePersistedLocalSample(id);
      pipelineRef.current?.removeSample(id);
      removeLocalSample(id);
    },
    [removeLocalSample, setPlaying],
  );

  // Clean up sweep workers on unmount
  useEffect(() => {
    return () => {
      for (const w of sweepWorkersRef.current) {
        w.terminate();
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar
        onSimulate={handleSimulate}
        onOpenWelcome={() => setShowWelcomeModal(true)}
        onToggleExamples={() => setShowExamples((v) => !v)}
        showExamples={showExamples}
        onPlayOriginal={handlePlayOriginal}
        onPlayOutput={handlePlayOutput}
        onStop={handleStop}
        playingOriginal={playingOriginal}
        hasSourceBuffer={sourceBuffer !== null}
        onToggleAnalyzer={() => setShowAnalyzer((v) => !v)}
        showAnalyzer={showAnalyzer}
      />

      <div className="flex flex-1 overflow-hidden">
        {showExamples && <ExamplesPanel />}
        <SchematicCanvas />

        <div className="relative flex-shrink-0 self-stretch">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="absolute top-3 -left-5 z-10 flex h-8 w-5 items-center justify-center rounded-l border border-gray-800 border-r-0 bg-gray-900 text-gray-500 transition-colors hover:text-gray-300"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <ChevronRight
              size={12}
              className={`transition-transform duration-150 ${sidebarOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {sidebarOpen && (
          <div className="flex w-52 flex-shrink-0 flex-col overflow-y-auto border-gray-800 border-l bg-gray-900">
            <PedalPanel onSweep={handleSweep} />
            <Inspector onSweep={handleSweep} />
            <div className="border-gray-800 border-t" />
            {sweepResults.length > 0 || sweepStatus === SWEEP_STATUS.running ? (
              <SweepResults
                results={sweepResults}
                status={sweepStatus}
                playingIndex={sweepPlayingIndex}
                onPlay={(i) => {
                  setPlaying(false);
                  setPlayingOriginal(false);
                  pipelineRef.current?.stopPlayback();
                  setSweepPlayingIndex(i);
                }}
                onStop={() => {
                  pipelineRef.current?.stopPlayback();
                  setSweepPlayingIndex(null);
                }}
                onClear={clearSweep}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setWaveformOpen((o) => !o)}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-500 text-xs uppercase tracking-wider transition-colors hover:text-gray-300"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        className={`transition-transform duration-150 ${waveformOpen ? '' : '-rotate-90'}`}
                      >
                        <path
                          d="M1 3 L5 7 L9 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Waveform
                    </button>
                    <div
                      className="relative"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setWaveformTooltip({
                          x: rect.left,
                          y: rect.bottom + 6,
                        });
                      }}
                      onMouseLeave={() => setWaveformTooltip(null)}
                    >
                      <div className="flex h-4 w-4 cursor-help select-none items-center justify-center rounded-full border border-gray-600 text-[10px] text-gray-500 leading-none">
                        i
                      </div>
                      {waveformTooltip &&
                        createPortal(
                          <div
                            className="pointer-events-none fixed z-[9999] w-52 rounded border border-gray-600 bg-gray-800 p-2.5 font-sans text-gray-300 text-xs shadow-xl"
                            style={{
                              left: Math.min(
                                waveformTooltip.x,
                                window.innerWidth - 220,
                              ),
                              top: waveformTooltip.y,
                            }}
                          >
                            Click and drag on the waveform to select a region.
                            Only the selected portion will be used as the input
                            for simulation.
                          </div>,
                          document.body,
                        )}
                    </div>
                  </div>
                  {waveformOpen && (sourceBuffer || outputBuffer) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlaying(false);
                        setPlayingOriginal(false);
                        setShowWaveformModal(true);
                      }}
                      className="px-3 text-gray-500 transition-colors hover:text-gray-200"
                      aria-label="Expand waveform"
                    >
                      <Maximize2 size={13} />
                    </button>
                  )}
                </div>
                {waveformOpen && (
                  <div className="px-3 pb-3">
                    <WaveformDisplay
                      inputBuffer={outputBuffer ? simulatedInput : sourceBuffer}
                      outputBuffer={outputBuffer}
                      selection={outputBuffer ? null : selection}
                      onSelectionChange={
                        outputBuffer ? undefined : setSelection
                      }
                    />
                    {(sourceBuffer || outputBuffer) && (
                      <div className="mt-2 flex overflow-hidden rounded border border-gray-700">
                        <button
                          type="button"
                          onClick={() => setLooping((v) => !v)}
                          className={`flex flex-1 items-center justify-center gap-1 py-1 font-mono text-xs transition-colors ${
                            looping
                              ? 'bg-blue-950 text-blue-400'
                              : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
                          }`}
                          aria-label={looping ? 'Disable loop' : 'Enable loop'}
                        >
                          <Repeat size={10} /> Loop
                        </button>
                        <div className="w-px bg-gray-700" />
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={!outputBuffer && !selection}
                          className="flex flex-1 items-center justify-center gap-1 bg-gray-800 py-1 font-mono text-gray-500 text-xs transition-colors hover:enabled:bg-gray-700 hover:enabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="border-gray-800 border-t" />
            <AudioControls
              onUploadLocalSample={handleUploadLocalSample}
              onRemoveLocalSample={handleRemoveLocalSample}
            />
          </div>
        )}
      </div>

      {showAnalyzer && (
        <CircuitAnalyzer
          outputBuffer={outputBuffer}
          simulatedInput={simulatedInput}
        />
      )}
      <StatusBar />
      {showWaveformModal && (
        <WaveformModal
          inputBuffer={outputBuffer ? simulatedInput : sourceBuffer}
          outputBuffer={outputBuffer}
          pipeline={pipelineRef.current}
          selection={outputBuffer ? null : selection}
          onSelectionChange={outputBuffer ? undefined : setSelection}
          looping={looping}
          onToggleLoop={() => setLooping((v) => !v)}
          onClose={() => setShowWaveformModal(false)}
        />
      )}
      <WelcomeModal open={showWelcomeModal} onClose={handleCloseWelcomeModal} />
    </div>
  );
}
