// src/components/CircuitAnalyzer.tsx

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getNodeLabels } from '../lib/netlist';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalyzeTraceData,
  WaveformType,
} from '../lib/types';
import { useStore } from '../store';
import { ScopeCanvas, type ScopeTrace } from './ScopeCanvas';

const TIME_DIVS = [0.5, 1, 2, 5, 10, 20, 50, 100];
const SPEED_OPTIONS = [
  { value: 0.001, label: '0.001x' },
  { value: 0.002, label: '0.002x' },
  { value: 0.005, label: '0.005x' },
  { value: 0.01, label: '0.01x' },
  { value: 0.02, label: '0.02x' },
  { value: 0.05, label: '0.05x' },
  { value: 0.1, label: '0.1x' },
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
];

// Distinct colors for probes — avoids blue (#60a5fa) and green (#4ade80)
// which are reserved for IN/OUT. Ordered for maximum visual separation.
const TRACE_COLORS = [
  '#f59e0b', // amber
  '#e879f9', // fuchsia
  '#2dd4bf', // teal
  '#fb923c', // orange
  '#a78bfa', // purple
  '#f472b6', // pink
  '#ef4444', // red
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#d946ef', // magenta
  '#84cc16', // lime
  '#f97316', // dark orange
  '#8b5cf6', // violet
  '#14b8a6', // emerald
  '#ec4899', // hot pink
  '#a3e635', // yellow-green
];

const SWEEP_COLORS = [
  '#ef4444', // 0%   red
  '#f59e0b', // 25%  amber
  '#22c55e', // 50%  green
  '#3b82f6', // 75%  blue
  '#a855f7', // 100% purple
];

const WAVEFORMS: Array<{ value: WaveformType; label: string }> = [
  { value: 'sine', label: 'Sine' },
  { value: 'square', label: 'Square' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Sawtooth' },
];

type AnalyzeTrace = {
  node: string;
  label: string;
  color: string;
  values: Float32Array;
  enabled: boolean;
};

type Tab = 'analyze' | 'scope';

type Props = {
  outputBuffer: Float32Array | null;
  simulatedInput: Float32Array | null;
  onClose: () => void;
};

export function CircuitAnalyzer({
  outputBuffer,
  simulatedInput,
  onClose,
}: Props) {
  const { nodes, edges, sweepResults, sweepNodeId } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      sweepResults: s.sweepResults,
      sweepNodeId: s.sweepNodeId,
    })),
  );

  const [tab, setTab] = useState<Tab>('analyze');

  // Signal generator settings
  const [waveform, setWaveform] = useState<WaveformType>('sine');
  const [frequency, setFrequency] = useState(1000);
  const [amplitude, setAmplitude] = useState(1.0);
  const [duration, setDuration] = useState(0.05);

  // Analysis state
  const [status, setStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analyzeTraces, setAnalyzeTraces] = useState<Array<AnalyzeTrace>>([]);

  // Scope tab state
  const [showScopeInput, setShowScopeInput] = useState(true);
  const [showScopeOutput, setShowScopeOutput] = useState(true);
  const [showSweepTraces, setShowSweepTraces] = useState<
    Record<number, boolean>
  >({});

  // Shared oscilloscope state
  const [timeDivIdx, setTimeDivIdx] = useState(1);
  const [running, setRunning] = useState(true);
  const [showProbes, setShowProbes] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(0);
  const MIN_CANVAS_HEIGHT = 192;
  const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  // Resize drag handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - e.clientY;
      setCanvasHeight(
        Math.max(MIN_CANVAS_HEIGHT, dragRef.current.startH + delta),
      );
    }
    function onMouseUp() {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const timeDiv = TIME_DIVS[timeDivIdx];
  const speed = SPEED_OPTIONS[speedIdx].value;

  // Worker management
  const workerRef = useRef<Worker | null>(null);
  /** Incremented on every analysis request; stale results are discarded. */
  const analysisGenRef = useRef(0);

  const createWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = new Worker(
      new URL('../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    );
  }, []);

  useEffect(() => {
    createWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, [createWorker]);

  // Node labels for display
  const nodeLabels = useMemo(() => getNodeLabels(nodes, edges), [nodes, edges]);

  const handleAnalyze = useCallback(() => {
    // Terminate the previous worker to free any in-flight WASM allocations,
    // then create a fresh one. This prevents stale results from arriving.
    createWorker();
    const worker = workerRef.current;
    if (!worker) return;

    const gen = ++analysisGenRef.current;
    setStatus('running');
    setError(null);

    worker.onmessage = (e: MessageEvent<AnalyzeResponse>) => {
      // Discard results from a superseded analysis run
      if (gen !== analysisGenRef.current) return;
      const msg = e.data;
      if (msg.type === 'result') {
        setStatus('idle');
        let otherIdx = 0;
        const newTraces: Array<AnalyzeTrace> = msg.traces.map(
          (t: AnalyzeTraceData) => {
            const label = nodeLabels.get(t.node) ?? t.node;
            const isIn = label.includes('[IN]') || label === 'Input';
            const isOut = label.includes('[OUT]') || label === 'Output';
            let color: string;
            if (isIn) color = '#60a5fa';
            else if (isOut) color = '#4ade80';
            else color = TRACE_COLORS[otherIdx++ % TRACE_COLORS.length];
            return {
              node: t.node,
              label,
              color,
              values: t.values,
              enabled: isIn || isOut,
            };
          },
        );
        setAnalyzeTraces(newTraces);
      } else {
        setStatus('error');
        setError(msg.message);
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      if (gen !== analysisGenRef.current) return;
      setStatus('error');
      setError(e.message ?? 'Worker crashed');
    };

    const request: AnalyzeRequest = {
      type: 'analyze',
      nodes,
      edges,
      duration,
      frequency,
      amplitude,
      waveform,
    };
    worker.postMessage(request);
  }, [
    nodes,
    edges,
    duration,
    frequency,
    amplitude,
    waveform,
    nodeLabels,
    createWorker,
  ]);

  const handleAnalyzeRef = useRef(handleAnalyze);
  handleAnalyzeRef.current = handleAnalyze;

  // Auto-run on mount and whenever circuit or signal settings change (debounced)
  // biome-ignore lint/correctness/useExhaustiveDependencies: ref avoids stale closure
  useEffect(() => {
    const timer = setTimeout(() => handleAnalyzeRef.current(), 250);
    return () => clearTimeout(timer);
  }, [waveform, frequency, amplitude, duration, nodes, edges]);

  const toggleTrace = useCallback((node: string) => {
    setAnalyzeTraces((prev) =>
      prev.map((t) => (t.node === node ? { ...t, enabled: !t.enabled } : t)),
    );
  }, []);

  // --- Build active traces + yScale for the current tab ---

  const enabledAnalyzeTraces = analyzeTraces.filter((t) => t.enabled);

  const analyzeScopeTraces: Array<ScopeTrace> = useMemo(
    () =>
      enabledAnalyzeTraces.map((t) => ({ color: t.color, values: t.values })),
    [enabledAnalyzeTraces],
  );

  const sweepPotLabel = useMemo(() => {
    if (!sweepNodeId) return null;
    const pot = nodes.find((n) => n.id === sweepNodeId);
    return pot?.data.label ?? null;
  }, [sweepNodeId, nodes]);

  const scopeTraces: Array<ScopeTrace> = useMemo(() => {
    const t: Array<ScopeTrace> = [];
    if (showScopeInput && simulatedInput)
      t.push({ color: '#60a5fa', values: simulatedInput });
    if (showScopeOutput && outputBuffer)
      t.push({ color: '#4ade80', values: outputBuffer });
    for (let i = 0; i < sweepResults.length; i++) {
      if (showSweepTraces[i]) {
        t.push({
          color: SWEEP_COLORS[i % SWEEP_COLORS.length],
          values: sweepResults[i].outputBuffer,
        });
      }
    }
    return t;
  }, [
    outputBuffer,
    simulatedInput,
    showScopeInput,
    showScopeOutput,
    sweepResults,
    showSweepTraces,
  ]);

  const activeTraces = tab === 'analyze' ? analyzeScopeTraces : scopeTraces;

  const yScale = useMemo(() => {
    let peak = 0;
    for (const t of activeTraces) {
      for (let i = 0; i < t.values.length; i++) {
        const abs = Math.abs(t.values[i]);
        if (abs > peak) peak = abs;
      }
    }
    const padded = Math.max(peak, 0.01) + 0.25;
    const nice = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
    return nice.find((n) => n >= padded) ?? padded;
  }, [activeTraces]);

  const hasSweepEnabled = Object.values(showSweepTraces).some(Boolean);
  const emptyMessage =
    tab === 'scope' && !outputBuffer && !simulatedInput && !hasSweepEnabled
      ? 'Run a simulation to see waveforms'
      : undefined;

  const timeDivLabel = timeDiv >= 1000 ? `${timeDiv / 1000}s` : `${timeDiv}ms`;

  const freqOptions = [100, 200, 440, 500, 1000, 2000, 5000];
  const ampOptions = [0.1, 0.5, 1.0, 2.0, 5.0];
  const durationOptions = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5];

  const hasScopeData = outputBuffer || simulatedInput;

  return (
    <div className="flex flex-col bg-[#080c08] border-t border-[#1a2e1a] flex-shrink-0">
      {/* Resize handle */}
      <div
        className="h-1.5 cursor-ns-resize hover:bg-[#1e3a1e] transition-colors flex items-center justify-center"
        onMouseDown={(e) => {
          e.preventDefault();
          dragRef.current = { startY: e.clientY, startH: canvasHeight };
          document.body.style.cursor = 'ns-resize';
          document.body.style.userSelect = 'none';
        }}
        onDoubleClick={() => setCanvasHeight(MIN_CANVAS_HEIGHT)}
      >
        <div className="w-8 h-0.5 rounded bg-[#2a4a2a]" />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 pt-0.5 pb-1.5 border-b border-[#1a2e1a] flex-wrap">
        {/* Tab switcher */}
        <div className="flex rounded border border-[#1a2e1a] overflow-hidden">
          <button
            type="button"
            onClick={() => setTab('analyze')}
            className={`text-[10px] font-mono px-2 py-0.5 transition-colors ${
              tab === 'analyze'
                ? 'bg-[#1a2e1a] text-[#4ade80]'
                : 'text-[#4a7a4a] hover:text-[#6a9a6a]'
            }`}
          >
            Analyze
          </button>
          <button
            type="button"
            onClick={() => setTab('scope')}
            className={`text-[10px] font-mono px-2 py-0.5 transition-colors ${
              tab === 'scope'
                ? 'bg-[#1a2e1a] text-[#4ade80]'
                : 'text-[#4a7a4a] hover:text-[#6a9a6a]'
            }`}
          >
            Scope
          </button>
        </div>

        <div className="w-px h-4 bg-[#1a2e1a]" />

        {/* Analyze-specific controls */}
        {tab === 'analyze' && (
          <>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
                Wave
              </span>
              <select
                value={waveform}
                onChange={(e) => setWaveform(e.target.value as WaveformType)}
                className="bg-[#0c140c] border border-[#1e3a1e] text-[#4ade80] text-xs font-mono px-1.5 py-0.5 rounded"
              >
                {WAVEFORMS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-px h-4 bg-[#1a2e1a]" />

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
                Freq
              </span>
              <select
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="bg-[#0c140c] border border-[#1e3a1e] text-[#4ade80] text-xs font-mono px-1.5 py-0.5 rounded"
              >
                {freqOptions.map((f) => (
                  <option key={f} value={f}>
                    {f >= 1000 ? `${f / 1000}kHz` : `${f}Hz`}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-px h-4 bg-[#1a2e1a]" />

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
                Amp
              </span>
              <select
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="bg-[#0c140c] border border-[#1e3a1e] text-[#4ade80] text-xs font-mono px-1.5 py-0.5 rounded"
              >
                {ampOptions.map((a) => (
                  <option key={a} value={a}>
                    {a >= 1 ? `${a}V` : `${a * 1000}mV`}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-px h-4 bg-[#1a2e1a]" />

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
                Dur
              </span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-[#0c140c] border border-[#1e3a1e] text-[#4ade80] text-xs font-mono px-1.5 py-0.5 rounded"
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>
                    {d >= 1 ? `${d}s` : `${d * 1000}ms`}
                  </option>
                ))}
              </select>
            </div>

            {status === 'running' && (
              <span className="text-[10px] text-amber-400 font-mono animate-pulse">
                Analyzing…
              </span>
            )}

            {error && (
              <span className="text-xs text-red-400 font-mono truncate max-w-48">
                {error}
              </span>
            )}
          </>
        )}

        {/* Scope-specific controls */}
        {tab === 'scope' && (
          <>
            <button
              type="button"
              onClick={() => setShowScopeInput((v) => !v)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                showScopeInput
                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                  : 'text-gray-600 border border-gray-700 hover:text-gray-400'
              }`}
              disabled={!simulatedInput}
            >
              Input
            </button>
            <button
              type="button"
              onClick={() => setShowScopeOutput((v) => !v)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                showScopeOutput
                  ? 'bg-green-950 text-green-400 border border-green-800'
                  : 'text-gray-600 border border-gray-700 hover:text-gray-400'
              }`}
              disabled={!outputBuffer}
            >
              Output
            </button>
            {sweepResults.length > 0 && (
              <>
                <div className="w-px h-4 bg-[#1a2e1a]" />
                <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
                  {sweepPotLabel ?? 'Sweep'}
                </span>
                {sweepResults.map((sr, i) => {
                  const pct = `${Math.round(sr.position * 100)}%`;
                  const on = !!showSweepTraces[i];
                  const color = SWEEP_COLORS[i % SWEEP_COLORS.length];
                  return (
                    <button
                      key={sr.position}
                      type="button"
                      onClick={() =>
                        setShowSweepTraces((prev) => ({
                          ...prev,
                          [i]: !prev[i],
                        }))
                      }
                      className={`text-xs font-mono px-2 py-0.5 rounded transition-colors border ${
                        on
                          ? 'border-opacity-60 bg-opacity-20'
                          : 'text-gray-600 border-gray-700 hover:text-gray-400'
                      }`}
                      style={
                        on
                          ? {
                              color,
                              borderColor: color,
                              backgroundColor: `${color}20`,
                            }
                          : undefined
                      }
                    >
                      {pct}
                    </button>
                  );
                })}
              </>
            )}
            {!hasScopeData && sweepResults.length === 0 && (
              <span className="text-[10px] text-[#4a7a4a] font-mono">
                Run a simulation first
              </span>
            )}
          </>
        )}

        <div className="flex-1" />

        {/* Shared scope controls */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
            Time/Div
          </span>
          <button
            type="button"
            onClick={() => setTimeDivIdx((i) => Math.max(0, i - 1))}
            disabled={timeDivIdx === 0}
            className="text-[#4ade80] hover:text-[#86efac] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[#4ade80] font-mono text-xs w-14 text-center">
            {timeDivLabel}
          </span>
          <button
            type="button"
            onClick={() =>
              setTimeDivIdx((i) => Math.min(TIME_DIVS.length - 1, i + 1))
            }
            disabled={timeDivIdx === TIME_DIVS.length - 1}
            className="text-[#4ade80] hover:text-[#86efac] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="w-px h-4 bg-[#1a2e1a]" />

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider">
            Speed
          </span>
          <button
            type="button"
            onClick={() => setSpeedIdx((i) => Math.max(0, i - 1))}
            disabled={speedIdx === 0}
            className="text-[#4ade80] hover:text-[#86efac] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[#4ade80] font-mono text-xs w-12 text-center">
            {SPEED_OPTIONS[speedIdx].label}
          </span>
          <button
            type="button"
            onClick={() =>
              setSpeedIdx((i) => Math.min(SPEED_OPTIONS.length - 1, i + 1))
            }
            disabled={speedIdx === SPEED_OPTIONS.length - 1}
            className="text-[#4ade80] hover:text-[#86efac] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="w-px h-4 bg-[#1a2e1a]" />

        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="text-[#4ade80] hover:text-[#86efac] transition-colors"
          aria-label={running ? 'Pause' : 'Resume'}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Probe row (analyze tab only) */}
      {tab === 'analyze' && analyzeTraces.length > 0 && (
        <div className="border-b border-[#1a2e1a]">
          <button
            type="button"
            onClick={() => setShowProbes((v) => !v)}
            className="flex items-center gap-1 px-3 py-0.5 text-[10px] text-[#4a7a4a] font-mono uppercase tracking-wider hover:text-[#6a9a6a] transition-colors w-full"
          >
            <ChevronDown
              size={10}
              className={`transition-transform ${showProbes ? '' : '-rotate-90'}`}
            />
            Probes ({enabledAnalyzeTraces.length}/{analyzeTraces.length})
          </button>
          {showProbes && (
            <div className="flex flex-wrap gap-1 px-3 pb-1.5">
              {analyzeTraces.map((t) => (
                <button
                  key={t.node}
                  type="button"
                  onClick={() => toggleTrace(t.node)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors border ${
                    t.enabled
                      ? 'border-opacity-60 bg-opacity-20'
                      : 'border-gray-700 text-gray-600 hover:text-gray-400'
                  }`}
                  style={
                    t.enabled
                      ? {
                          color: t.color,
                          borderColor: t.color,
                          backgroundColor: `${t.color}20`,
                        }
                      : undefined
                  }
                >
                  {t.label || t.node}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared scope canvas */}
      <ScopeCanvas
        traces={activeTraces}
        yScale={yScale}
        timeDiv={timeDiv}
        speed={speed}
        running={running}
        height={canvasHeight}
        emptyMessage={emptyMessage}
        onPause={() => setRunning(false)}
      />
    </div>
  );
}
