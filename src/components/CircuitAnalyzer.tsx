import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
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
  '#14b8a6', // 50%  teal
  '#a855f7', // 75%  purple
  '#ec4899', // 100% pink
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
};

export function CircuitAnalyzer({ outputBuffer, simulatedInput }: Props) {
  const {
    nodes,
    edges,
    sweepResults,
    sweepNodeId,
    simulationStatus,
    sweepStatus,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      sweepResults: s.sweepResults,
      sweepNodeId: s.sweepNodeId,
      simulationStatus: s.simulationStatus,
      sweepStatus: s.sweepStatus,
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
      if (!dragRef.current) {
        return;
      }
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

  // Stable fingerprint that ignores position/measured/selected changes —
  // only reacts to topology (ids, types, data) and edge connectivity.
  const circuitKey = useMemo(() => {
    const nk = nodes
      .map((n) => `${n.id}:${n.type}:${JSON.stringify(n.data)}`)
      .join('|');
    const ek = edges
      .map(
        (e) => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`,
      )
      .join('|');
    return `${nk}||${ek}`;
  }, [nodes, edges]);

  const handleAnalyze = useCallback(() => {
    // Terminate the previous worker to free any in-flight WASM allocations,
    // then create a fresh one. This prevents stale results from arriving.
    createWorker();
    const worker = workerRef.current;
    if (!worker) {
      return;
    }

    const gen = ++analysisGenRef.current;
    setStatus('running');
    setError(null);

    worker.onmessage = (e: MessageEvent<AnalyzeResponse>) => {
      // Discard results from a superseded analysis run
      if (gen !== analysisGenRef.current) {
        return;
      }
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
            if (isIn) {
              color = '#60a5fa';
            } else if (isOut) {
              color = '#4ade80';
            } else {
              color = TRACE_COLORS[otherIdx++ % TRACE_COLORS.length];
            }
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
      if (gen !== analysisGenRef.current) {
        return;
      }
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

  // Auto-run on mount and whenever circuit or signal settings change (debounced).
  // Uses circuitKey instead of nodes/edges so position-only moves don't re-trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ref avoids stale closure; circuitKey replaces nodes/edges
  useEffect(() => {
    const timer = setTimeout(() => handleAnalyzeRef.current(), 250);
    return () => clearTimeout(timer);
  }, [waveform, frequency, amplitude, duration, circuitKey]);

  const toggleTrace = useCallback((node: string) => {
    setAnalyzeTraces((prev) =>
      prev.map((t) => (t.node === node ? { ...t, enabled: !t.enabled } : t)),
    );
  }, []);

  // --- Build active traces + yScale for the current tab ---

  const enabledAnalyzeTraces = useMemo(
    () => analyzeTraces.filter((t) => t.enabled),
    [analyzeTraces],
  );

  const analyzeScopeTraces: Array<ScopeTrace> = useMemo(
    () =>
      enabledAnalyzeTraces.map((t) => ({ color: t.color, values: t.values })),
    [enabledAnalyzeTraces],
  );

  const sweepPotLabel = useMemo(() => {
    if (!sweepNodeId) {
      return null;
    }
    const pot = nodes.find((n) => n.id === sweepNodeId);
    return pot?.data.label ?? null;
  }, [sweepNodeId, nodes]);

  const scopeTraces: Array<ScopeTrace> = useMemo(() => {
    const t: Array<ScopeTrace> = [];
    if (showScopeInput && simulatedInput) {
      t.push({ color: '#60a5fa', values: simulatedInput });
    }
    if (showScopeOutput && outputBuffer) {
      t.push({ color: '#4ade80', values: outputBuffer });
    }
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
        if (abs > peak) {
          peak = abs;
        }
      }
    }
    const padded = Math.max(peak, 0.01) + 0.25;
    const nice = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
    return nice.find((n) => n >= padded) ?? padded;
  }, [activeTraces]);

  const hasSweepEnabled = Object.values(showSweepTraces).some(Boolean);
  const isSimulating =
    simulationStatus === 'running' || sweepStatus === 'running';
  const hasNoScopeData = !outputBuffer && !simulatedInput && !hasSweepEnabled;
  const scopeEmpty = tab === 'scope' && hasNoScopeData;
  const analyzeEmpty = tab === 'analyze' && activeTraces.length === 0;
  const emptyMessage =
    isSimulating && (scopeEmpty || analyzeEmpty)
      ? 'Simulating…'
      : scopeEmpty
        ? 'Run a simulation to see waveforms'
        : undefined;

  const timeDivLabel = timeDiv >= 1000 ? `${timeDiv / 1000}s` : `${timeDiv}ms`;

  const freqOptions = [100, 200, 440, 500, 1000, 2000, 5000];
  const ampOptions = [0.1, 0.5, 1.0, 2.0, 5.0];
  const durationOptions = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5];

  return (
    <div className="flex flex-shrink-0 flex-col border-[#1a2e1a] border-t bg-[#080c08]">
      {/* Resize handle */}
      <div
        className="flex h-1.5 cursor-ns-resize items-center justify-center transition-colors hover:bg-[#1e3a1e]"
        onMouseDown={(e) => {
          e.preventDefault();
          dragRef.current = { startY: e.clientY, startH: canvasHeight };
          document.body.style.cursor = 'ns-resize';
          document.body.style.userSelect = 'none';
        }}
        onDoubleClick={() => setCanvasHeight(MIN_CANVAS_HEIGHT)}
      >
        <div className="h-0.5 w-8 rounded bg-[#2a4a2a]" />
      </div>

      {/* Top row: tab switcher, time/div, speed, scope toggles, pause, close */}
      <div className="flex flex-wrap items-center justify-between pt-0.5 pr-1 pb-2 pl-3 sm:justify-start sm:gap-2 sm:pr-3 md:gap-4">
        <div className="flex overflow-hidden rounded border border-[#1a2e1a]">
          <button
            type="button"
            onClick={() => setTab('analyze')}
            className={`px-2 py-0.5 font-mono text-[10px] transition-colors ${
              tab === 'analyze'
                ? 'bg-[#1a2e1a] text-[#4ade80]'
                : 'text-[#4a7a4a] hover:text-[#6a9a6a]'
            }`}
          >
            Scope
          </button>
          <button
            type="button"
            onClick={() => setTab('scope')}
            className={`px-2 py-0.5 font-mono text-[10px] transition-colors ${
              tab === 'scope'
                ? 'bg-[#1a2e1a] text-[#4ade80]'
                : 'text-[#4a7a4a] hover:text-[#6a9a6a]'
            }`}
          >
            Sim.
          </button>
        </div>

        <div className="flex flex-1 items-center justify-evenly sm:justify-start sm:gap-2 md:gap-4">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
              Time/Div
            </span>
            <button
              type="button"
              onClick={() => setTimeDivIdx((i) => Math.max(0, i - 1))}
              disabled={timeDivIdx === 0}
              className="text-[#4ade80] transition-colors hover:text-[#86efac] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="w-14 text-center font-mono text-[#4ade80] text-xs">
              {timeDivLabel}
            </span>
            <button
              type="button"
              onClick={() =>
                setTimeDivIdx((i) => Math.min(TIME_DIVS.length - 1, i + 1))
              }
              disabled={timeDivIdx === TIME_DIVS.length - 1}
              className="text-[#4ade80] transition-colors hover:text-[#86efac] disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
              Speed
            </span>
            <button
              type="button"
              onClick={() => setSpeedIdx((i) => Math.max(0, i - 1))}
              disabled={speedIdx === 0}
              className="text-[#4ade80] transition-colors hover:text-[#86efac] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="w-12 text-center font-mono text-[#4ade80] text-xs">
              {SPEED_OPTIONS[speedIdx].label}
            </span>
            <button
              type="button"
              onClick={() =>
                setSpeedIdx((i) => Math.min(SPEED_OPTIONS.length - 1, i + 1))
              }
              disabled={speedIdx === SPEED_OPTIONS.length - 1}
              className="text-[#4ade80] transition-colors hover:text-[#86efac] disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="pr-2 text-[#4ade80] transition-colors hover:text-[#86efac]"
          aria-label={running ? 'Pause' : 'Resume'}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {/* Bottom row: analyze dropdowns (only when analyze tab active) */}
      {tab === 'analyze' && (
        <div className="flex items-center justify-between overflow-x-auto border-[#1a2e1a] border-b pr-1 pb-1.5 pl-3 sm:justify-start sm:gap-1.5 md:gap-4">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
              Wave
            </span>
            <select
              value={waveform}
              onChange={(e) => setWaveform(e.target.value as WaveformType)}
              className="rounded border border-[#1e3a1e] bg-[#0c140c] px-1.5 py-0.5 font-mono text-[#4ade80] text-xs"
            >
              {WAVEFORMS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
              Freq
            </span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="rounded border border-[#1e3a1e] bg-[#0c140c] px-1.5 py-0.5 font-mono text-[#4ade80] text-xs"
            >
              {freqOptions.map((f) => (
                <option key={f} value={f}>
                  {f >= 1000 ? `${f / 1000}kHz` : `${f}Hz`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
              Amp
            </span>
            <select
              value={amplitude}
              onChange={(e) => setAmplitude(Number(e.target.value))}
              className="rounded border border-[#1e3a1e] bg-[#0c140c] px-1.5 py-0.5 font-mono text-[#4ade80] text-xs"
            >
              {ampOptions.map((a) => (
                <option key={a} value={a}>
                  {a >= 1 ? `${a}V` : `${a * 1000}mV`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
              Dur
            </span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="rounded border border-[#1e3a1e] bg-[#0c140c] px-1.5 py-0.5 font-mono text-[#4ade80] text-xs"
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {d >= 1 ? `${d}s` : `${d * 1000}ms`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sim-specific controls row */}
      {tab === 'scope' && (
        <div className="flex flex-wrap items-center gap-1.5 border-[#1a2e1a] border-b pr-1 pb-1.5 pl-3 sm:gap-2 md:gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowScopeInput((v) => !v)}
              className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                showScopeInput
                  ? 'border border-blue-800 bg-blue-950 text-blue-400'
                  : 'border border-gray-700 text-gray-600 hover:text-gray-400'
              }`}
              disabled={!simulatedInput}
            >
              Input
            </button>
            <button
              type="button"
              onClick={() => setShowScopeOutput((v) => !v)}
              className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                showScopeOutput
                  ? 'border border-green-800 bg-green-950 text-green-400'
                  : 'border border-gray-700 text-gray-600 hover:text-gray-400'
              }`}
              disabled={!outputBuffer}
            >
              Output
            </button>
          </div>
          {sweepResults.length > 0 && (
            <>
              <span className="font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider">
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
                    className={`rounded border px-2 py-0.5 font-mono text-xs transition-colors ${
                      on
                        ? 'border-opacity-60 bg-opacity-20'
                        : 'border-gray-700 text-gray-600 hover:text-gray-400'
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
        </div>
      )}

      {/* Probe row (analyze tab only) */}
      {tab === 'analyze' && analyzeTraces.length > 0 && (
        <div className="border-[#1a2e1a] border-b">
          <button
            type="button"
            onClick={() => setShowProbes((v) => !v)}
            className="flex w-full items-center gap-1 px-3 py-0.5 font-mono text-[#4a7a4a] text-[10px] uppercase tracking-wider transition-colors hover:text-[#6a9a6a]"
          >
            <ChevronDown
              size={10}
              className={`transition-transform ${showProbes ? '' : '-rotate-90'}`}
            />
            Probes ({enabledAnalyzeTraces.length}/{analyzeTraces.length})
            {status === 'running' && (
              <span className="ml-1 animate-pulse text-amber-400">
                Analyzing…
              </span>
            )}
            {error && (
              <span className="ml-1 max-w-48 truncate text-red-400">
                {error}
              </span>
            )}
          </button>
          {showProbes && (
            <div className="flex flex-wrap gap-1 px-3 pb-1.5">
              {analyzeTraces.map((t) => (
                <button
                  key={t.node}
                  type="button"
                  onClick={() => toggleTrace(t.node)}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
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
