// src/App.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AudioPipeline } from './audio/pipeline';
import { AudioControls } from './components/AudioControls';
import { ExamplesPanel } from './components/ExamplesPanel';
import { Inspector } from './components/Inspector';
import { PedalPanel } from './components/PedalPanel';
import { SchematicCanvas } from './components/SchematicCanvas';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { WaveformDisplay } from './components/WaveformDisplay';
import { WaveformModal } from './components/WaveformModal';
import type { SimulateRequest, SimulateResponse } from './lib/types';
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
    setSimulationError,
    setPlaying,
    undo,
    redo,
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
      setSimulationError: s.setSimulationError,
      setPlaying: s.setPlaying,
      undo: s.undo,
      redo: s.redo,
    })),
  );

  const [showExamples, setShowExamples] = useState(false);
  const [showWaveformModal, setShowWaveformModal] = useState(false);
  const [sourceBuffer, setSourceBuffer] = useState<Float32Array | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const workerRef = useRef<Worker | null>(null);
  const pipelineRef = useRef<AudioPipeline | null>(null);
  const simStartRef = useRef<number | null>(null);

  // Refs so callbacks read current values without stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data;
      if (msg.type === 'result') {
        const elapsed = simStartRef.current != null
          ? (performance.now() - simStartRef.current) / 1000
          : undefined;
        simStartRef.current = null;
        setSimulationStatus('idle');
        setOutputBuffer(msg.outputBuffer, elapsed);
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
  }, [setSimulationStatus, setOutputBuffer, setSimulationError]);

  // Initialize audio pipeline
  // biome-ignore lint/correctness/useExhaustiveDependencies: init runs once on mount
  useEffect(() => {
    let cancelled = false;
    const pipeline = new AudioPipeline();
    pipelineRef.current = pipeline;
    pipeline.init(volume).then(() => {
      if (!cancelled) setSourceBuffer(null);
    });
    return () => {
      cancelled = true;
      pipeline.destroy();
    };
  }, []);

  // Load sample and update sourceBuffer whenever audioSource changes
  useEffect(() => {
    if (audioSource.type !== 'sample') {
      setSourceBuffer(null);
      return;
    }
    const name = audioSource.name;
    let cancelled = false;
    const pipeline = pipelineRef.current;
    if (!pipeline) return;
    pipeline.loadSample(name).then(() => {
      if (!cancelled) setSourceBuffer(pipeline.getSampleData(name));
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
    if (!pipeline) return;
    if (playing && outputBuffer) {
      pipeline.playBuffer(outputBuffer, () => setPlaying(false));
    } else if (playingOriginal && sourceBuffer) {
      pipeline.playBuffer(sourceBuffer, () => setPlayingOriginal(false));
    } else {
      pipeline.stopPlayback();
    }
  }, [playing, playingOriginal, outputBuffer, sourceBuffer, setPlaying]);

  const handlePlayOriginal = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(true);
  }, [setPlaying]);

  const handleStop = useCallback(() => {
    setPlaying(false);
    setPlayingOriginal(false);
  }, [setPlaying]);

  const handleSimulate = useCallback(() => {
    if (!workerRef.current) return;
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
          inputBuffer = data;
          inputSampleRate = pipeline.getSampleRate();
          duration = data.length / inputSampleRate;
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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar
        onSimulate={handleSimulate}
        onToggleExamples={() => setShowExamples((v) => !v)}
        showExamples={showExamples}
        onPlayOriginal={handlePlayOriginal}
        onStop={handleStop}
        playingOriginal={playingOriginal}
        hasSourceBuffer={sourceBuffer !== null}
      />

      <div className="flex flex-1 overflow-hidden">
        {showExamples && <ExamplesPanel />}
        <SchematicCanvas />

        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <PedalPanel />
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Waveform</span>
              {(sourceBuffer || outputBuffer) && (
                <button
                  type="button"
                  onClick={() => setShowWaveformModal(true)}
                  className="text-gray-500 hover:text-gray-200 transition-colors"
                  aria-label="Expand waveform"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M1 5V1h4M8 1h4v4M12 8v4H8M5 12H1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            <WaveformDisplay inputBuffer={sourceBuffer} outputBuffer={outputBuffer} />
          </div>
          <div className="border-t border-gray-800" />
          <AudioControls />
        </div>
      </div>

      <StatusBar />
      {showWaveformModal && (
        <WaveformModal
          inputBuffer={sourceBuffer}
          outputBuffer={outputBuffer}
          onClose={() => setShowWaveformModal(false)}
        />
      )}
    </div>
  );
}
