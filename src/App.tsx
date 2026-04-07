// src/App.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AudioPipeline } from './audio/pipeline';
import { AudioControls } from './components/AudioControls';
import { Inspector } from './components/Inspector';
import { SchematicCanvas } from './components/SchematicCanvas';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { WaveformDisplay } from './components/WaveformDisplay';
import { compileNetlist } from './lib/netlist';
import type { SimulateResponse } from './lib/types';
import { useStore } from './store';

export default function App() {
	const {
		nodes,
		edges,
		outputBuffer,
		audioSource,
		volume,
		playing,
		setSimulationStatus,
		setOutputBuffer,
		setSimulationError,
		setPlaying,
	} = useStore(
		useShallow((s) => ({
			nodes: s.nodes,
			edges: s.edges,
			outputBuffer: s.outputBuffer,
			audioSource: s.audioSource,
			volume: s.volume,
			playing: s.playing,
			setSimulationStatus: s.setSimulationStatus,
			setOutputBuffer: s.setOutputBuffer,
			setSimulationError: s.setSimulationError,
			setPlaying: s.setPlaying,
		})),
	);

	const workerRef = useRef<Worker | null>(null);
	const pipelineRef = useRef<AudioPipeline | null>(null);
	const inputBufRef = useRef<Float32Array>(new Float32Array(2048));
	const [inputSnapshot, setInputSnapshot] = useState<Float32Array | null>(null);

	// Refs so audio callbacks can read current circuit without stale closures
	const nodesRef = useRef(nodes);
	const edgesRef = useRef(edges);
	// One simulation in flight at a time — prevents flooding the worker
	const simInFlightRef = useRef(false);
	// Tracks whether continuous playback is active, so status isn't toggled per-buffer
	const playingRef = useRef(playing);

	useEffect(() => {
		nodesRef.current = nodes;
	}, [nodes]);
	useEffect(() => {
		edgesRef.current = edges;
	}, [edges]);
	useEffect(() => {
		playingRef.current = playing;
	}, [playing]);

	// Send one buffer to the worker
	const postToWorker = useCallback(
		(buf: Float32Array) => {
			if (!workerRef.current || simInFlightRef.current) return;
			try {
				const netlist = compileNetlist(
					nodesRef.current,
					edgesRef.current,
					buf,
					44100,
				);
				simInFlightRef.current = true;
				if (!playingRef.current) setSimulationStatus('running');
				workerRef.current.postMessage(
					{ type: 'simulate', netlist, inputBuffer: buf },
					[buf.buffer],
				);
			} catch (err) {
				simInFlightRef.current = false;
				setSimulationStatus('error');
				setSimulationError(err instanceof Error ? err.message : String(err));
			}
		},
		[setSimulationStatus, setSimulationError],
	);

	// Initialize worker
	useEffect(() => {
		workerRef.current = new Worker(
			new URL('./workers/simulation.worker.ts', import.meta.url),
			{ type: 'module' },
		);
		workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
			const msg = e.data;
			simInFlightRef.current = false;
			if (msg.type === 'result') {
				if (!playingRef.current) setSimulationStatus('idle');
				setOutputBuffer(msg.outputBuffer);
				pipelineRef.current?.scheduleOutput(msg.outputBuffer);
			} else {
				setSimulationStatus('error');
				setSimulationError(msg.message);
			}
		};
		workerRef.current.onerror = (e: ErrorEvent) => {
			simInFlightRef.current = false;
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

	// Start/stop audio capture when playing state or source changes
	useEffect(() => {
		const pipeline = pipelineRef.current;
		if (!pipeline) return;

		pipeline.stop();
		simInFlightRef.current = false;
		if (!playing) {
			setSimulationStatus('idle');
			return;
		}
		setSimulationStatus('running');

		// Called at ~46ms intervals by the ScriptProcessorNode.
		// Triggers one simulation per chunk — rate-limited by the onaudioprocess clock.
		function onInputBuffer(buf: Float32Array) {
			inputBufRef.current = buf;
			const simBuf = buf;
			inputBufRef.current = new Float32Array(2048);
			setInputSnapshot(new Float32Array(simBuf));
			postToWorker(simBuf);
		}

		function onError(err: unknown) {
			setSimulationError(err instanceof Error ? err.message : String(err));
			setSimulationStatus('error');
			setPlaying(false);
		}

		if (audioSource.type === 'sample') {
			pipeline
				.loadSample(audioSource.name)
				.then(() =>
					pipeline.startSampleCapture(audioSource.name, onInputBuffer),
				)
				.catch(onError);
		} else {
			pipeline.startLiveCapture(onInputBuffer).catch(onError);
		}
	}, [
		playing,
		audioSource,
		postToWorker,
		setSimulationError,
		setSimulationStatus,
		setPlaying,
	]);

	// Manual simulate: kick off a one-shot (useful when not playing)
	const handleSimulate = useCallback(() => {
		const buf = inputBufRef.current;
		inputBufRef.current = new Float32Array(2048);
		setInputSnapshot(new Float32Array(buf));
		postToWorker(buf);
	}, [postToWorker]);

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<Toolbar onSimulate={handleSimulate} />

			<div className="flex flex-1 overflow-hidden">
				<SchematicCanvas />

				<div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
					<Inspector />
					<div className="border-t border-gray-800" />
					<div className="p-3">
						<div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
							Waveform
						</div>
						<WaveformDisplay
							inputBuffer={inputSnapshot}
							outputBuffer={outputBuffer}
						/>
					</div>
					<div className="border-t border-gray-800" />
					<AudioControls />
				</div>
			</div>

			<StatusBar />
		</div>
	);
}
