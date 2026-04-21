import { ChevronRight, Maximize2, Repeat, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { AudioPipeline } from './audio/pipeline';
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
import {
  type SimulateRequest,
  type SimulateResponse,
  SWEEP_POSITIONS,
} from './lib/types';
import { useStore } from './store';

export default function App() {
  const {
    nodes,
    edges,
    outputBuffer,
    volume,
    playing,
    audioSource,
    simulationDuration,
    inputFrequency,
    inputAmplitude,
    setSimulationStatus,
    setOutputBuffer,
    clearOutputBuffer,
    setSimulationError,
    setPlaying,
    undo,
    redo,
    sweepResults,
    sweepStatus,
    sweepPlayingIndex,
    requestSweep,
    addSweepResult,
    completeSweep,
    failSweep,
    clearSweep,
    setSweepPlayingIndex,
    simulatedInput,
    setSimulatedInput,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      outputBuffer: s.outputBuffer,
      volume: s.volume,
      playing: s.playing,
      audioSource: s.audioSource,
      simulationDuration: s.simulationDuration,
      inputFrequency: s.inputFrequency,
      inputAmplitude: s.inputAmplitude,
      setSimulationStatus: s.setSimulationStatus,
      setOutputBuffer: s.setOutputBuffer,
      clearOutputBuffer: s.clearOutputBuffer,
      setSimulationError: s.setSimulationError,
      setPlaying: s.setPlaying,
      undo: s.undo,
      redo: s.redo,
      sweepResults: s.sweepResults,
      sweepStatus: s.sweepStatus,
      sweepPlayingIndex: s.sweepPlayingIndex,
      requestSweep: s.requestSweep,
      addSweepResult: s.addSweepResult,
      completeSweep: s.completeSweep,
      failSweep: s.failSweep,
      clearSweep: s.clearSweep,
      setSweepPlayingIndex: s.setSweepPlayingIndex,
      simulatedInput: s.simulatedInput,
      setSimulatedInput: s.setSimulatedInput,
    })),
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showWaveformModal, setShowWaveformModal] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [sourceBuffer, setSourceBuffer] = useState<Float32Array | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [selection, setSelection] = useState<WaveformSelection | null>(null);
  const [looping, setLooping] = useState(false);
  const [waveformOpen, setWaveformOpen] = useState(true);
  const [waveformTooltip, setWaveformTooltip] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const loopingRef = useRef(false);
  const pendingInputRef = useRef<Float32Array | null>(null);

  const viewResetKey = useStore((s) => s.viewResetKey);
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

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data;
      if (msg.type === 'result') {
        const elapsed =
          simStartRef.current != null
            ? (performance.now() - simStartRef.current) / 1000
            : undefined;
        simStartRef.current = null;
        setSimulationStatus('idle');
        setOutputBuffer(msg.outputBuffer, elapsed);
        setSimulatedInput(pendingInputRef.current);
        pendingInputRef.current = null;
      } else {
        setSimulationStatus('error');
        setSimulationError(msg.message);
      }
    };
    workerRef.current.onerror = (e: ErrorEvent) => {
      setSimulationStatus('error');
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
  ]);

  // Initialize audio pipeline
  // biome-ignore lint/correctness/useExhaustiveDependencies: init runs once on mount
  useEffect(() => {
    let cancelled = false;
    const pipeline = new AudioPipeline();
    pipelineRef.current = pipeline;
    pipeline.init(volume).then(() => {
      if (!cancelled) {
        setSourceBuffer(null);
      }
    });
    return () => {
      cancelled = true;
      pipeline.destroy();
    };
  }, []);

  // Load sample and update sourceBuffer whenever audioSource changes
  useEffect(() => {
    setSelection(null);
    if (audioSource.type !== 'sample') {
      setSourceBuffer(null);
      return;
    }
    const name = audioSource.name;
    let cancelled = false;
    const pipeline = pipelineRef.current;
    if (!pipeline) {
      return;
    }
    pipeline.loadSample(name).then(() => {
      if (!cancelled) {
        setSourceBuffer(pipeline.getSampleData(name));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [audioSource]);

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

  const handlePlayOriginal = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(true);
  }, [setPlaying]);

  const handlePlayOutput = useCallback(() => {
    setPlayingOriginal(false);
    setPlaying(true);
  }, [setPlaying]);

  const handleStop = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(false);
  }, [setPlaying]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(false);
    clearOutputBuffer();
    setSimulatedInput(null);
    setSelection(null);
  }, [setPlaying, clearOutputBuffer, setSimulatedInput]);

  const handleSimulate = useCallback(() => {
    if (!workerRef.current) {
      return;
    }
    try {
      setSimulationStatus('running');
      simStartRef.current = performance.now();
      const pipeline = pipelineRef.current;
      let inputBuffer: Float32Array | undefined;
      let inputSampleRate: number | undefined;
      let duration = simulationDuration;
      if (audioSource.type === 'sample' && pipeline) {
        const data = pipeline.getSampleData(audioSource.name);
        if (data) {
          const sel = selectionRef.current;
          if (sel) {
            const startSample = Math.floor(sel.start * data.length);
            const endSample = Math.floor(sel.end * data.length);
            inputBuffer = new Float32Array(
              data.subarray(startSample, endSample),
            );
          } else {
            inputBuffer = data;
          }
          inputSampleRate = pipeline.getSampleRate();
          duration = inputBuffer.length / inputSampleRate;
        }
      }
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
      setSimulationStatus('error');
      setSimulationError(err instanceof Error ? err.message : String(err));
    }
  }, [
    setSimulationStatus,
    setSimulationError,
    audioSource,
    simulationDuration,
    inputFrequency,
    inputAmplitude,
  ]);

  const handleSweep = useCallback(
    (nodeId: string) => {
      // Terminate any previous sweep workers
      for (const w of sweepWorkersRef.current) {
        w.terminate();
      }
      sweepWorkersRef.current = [];

      requestSweep(nodeId);

      const pipeline = pipelineRef.current;
      let inputBuffer: Float32Array | undefined;
      let inputSampleRate: number | undefined;
      let duration = simulationDuration;
      if (audioSource.type === 'sample' && pipeline) {
        const data = pipeline.getSampleData(audioSource.name);
        if (data) {
          const sel = selectionRef.current;
          if (sel) {
            const startSample = Math.floor(sel.start * data.length);
            const endSample = Math.floor(sel.end * data.length);
            inputBuffer = new Float32Array(
              data.subarray(startSample, endSample),
            );
          } else {
            inputBuffer = data;
          }
          inputSampleRate = pipeline.getSampleRate();
          duration = inputBuffer.length / inputSampleRate;
        }
      }

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
          if (msg.type === 'result') {
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
      requestSweep,
      addSweepResult,
      completeSweep,
      failSweep,
      audioSource,
      simulationDuration,
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
            {sweepResults.length > 0 || sweepStatus === 'running' ? (
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
            <AudioControls />
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
    </div>
  );
}
