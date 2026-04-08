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
import type { SimulateRequest, SimulateResponse } from './lib/types';
import { useStore } from './store';

export default function App() {
  const {
    nodes,
    edges,
    outputBuffer,
    volume,
    playing,
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
        setSimulationStatus('idle');
        setOutputBuffer(msg.outputBuffer);
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
    const pipeline = new AudioPipeline();
    pipelineRef.current = pipeline;
    pipeline.init(volume);
    return () => {
      pipeline.destroy();
    };
  }, []);

  // Sync volume changes
  useEffect(() => {
    pipelineRef.current?.setVolume(volume);
  }, [volume]);

  // Play/stop output buffer when `playing` state changes
  useEffect(() => {
    if (playing && outputBuffer) {
      pipelineRef.current?.playBuffer(outputBuffer, () => setPlaying(false));
    } else {
      pipelineRef.current?.stopPlayback();
    }
  }, [playing, outputBuffer, setPlaying]);

  const handleSimulate = useCallback(() => {
    if (!workerRef.current) return;
    try {
      setSimulationStatus('running');
      const request: SimulateRequest = {
        type: 'simulate',
        nodes: nodesRef.current,
        edges: edgesRef.current,
        duration: simulationDuration,
        frequency: inputFrequency,
        amplitude: inputAmplitude,
      };
      workerRef.current.postMessage(request);
    } catch (err) {
      setSimulationStatus('error');
      setSimulationError(err instanceof Error ? err.message : String(err));
    }
  }, [
    setSimulationStatus,
    setSimulationError,
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
      />

      <div className="flex flex-1 overflow-hidden">
        {showExamples && <ExamplesPanel />}
        <SchematicCanvas />

        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <PedalPanel />
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Waveform
            </div>
            <WaveformDisplay inputBuffer={null} outputBuffer={outputBuffer} />
          </div>
          <div className="border-t border-gray-800" />
          <AudioControls />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
