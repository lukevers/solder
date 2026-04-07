// src/App.tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import { Toolbar }         from './components/Toolbar'
import { SchematicCanvas } from './components/SchematicCanvas'
import { Inspector }       from './components/Inspector'
import { WaveformDisplay } from './components/WaveformDisplay'
import { AudioControls }   from './components/AudioControls'
import { StatusBar }       from './components/StatusBar'
import { useStore }        from './store'
import { useShallow }      from 'zustand/react/shallow'
import { AudioPipeline }   from './audio/pipeline'
import { compileNetlist }  from './lib/netlist'
import type { SimulateResponse } from './lib/types'

export default function App() {
  const {
    nodes, edges, outputBuffer,
    audioSource, volume, playing,
    setSimulationStatus, setOutputBuffer, setSimulationError,
    setPlaying,
  } = useStore(useShallow((s) => ({
    nodes:                s.nodes,
    edges:                s.edges,
    outputBuffer:         s.outputBuffer,
    audioSource:          s.audioSource,
    volume:               s.volume,
    playing:              s.playing,
    setSimulationStatus:  s.setSimulationStatus,
    setOutputBuffer:      s.setOutputBuffer,
    setSimulationError:   s.setSimulationError,
    setPlaying:           s.setPlaying,
  })))

  const workerRef    = useRef<Worker | null>(null)
  const pipelineRef  = useRef<AudioPipeline | null>(null)
  const inputBufRef  = useRef<Float32Array>(new Float32Array(2048))
  const [inputSnapshot, setInputSnapshot] = useState<Float32Array | null>(null)

  // Refs so audio callbacks can read current circuit without stale closures
  const nodesRef  = useRef(nodes)
  const edgesRef  = useRef(edges)
  const playingRef = useRef(playing)
  // Prevents flooding the worker — only one simulation in flight at a time
  const simInFlightRef = useRef(false)

  useEffect(() => { nodesRef.current = nodes },   [nodes])
  useEffect(() => { edgesRef.current = edges },   [edges])
  useEffect(() => { playingRef.current = playing }, [playing])

  // Send one buffer to the worker; called both manually and from the capture loop
  const postToWorker = useCallback((buf: Float32Array) => {
    if (!workerRef.current || simInFlightRef.current) return
    try {
      const netlist = compileNetlist(nodesRef.current, edgesRef.current, buf, 44100)
      simInFlightRef.current = true
      setSimulationStatus('running')
      workerRef.current.postMessage(
        { type: 'simulate', netlist, inputBuffer: buf },
        [buf.buffer]
      )
    } catch (err) {
      simInFlightRef.current = false
      setSimulationStatus('error')
      setSimulationError(err instanceof Error ? err.message : String(err))
    }
  }, [setSimulationStatus, setSimulationError])

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data
      simInFlightRef.current = false
      if (msg.type === 'result') {
        setSimulationStatus('idle')
        setOutputBuffer(msg.outputBuffer)
        pipelineRef.current?.scheduleOutput(msg.outputBuffer)
        // Auto-queue the next buffer if still playing
        if (playingRef.current) {
          const next = inputBufRef.current
          inputBufRef.current = new Float32Array(2048)
          setInputSnapshot(new Float32Array(next))
          postToWorker(next)
        }
      } else {
        setSimulationStatus('error')
        setSimulationError(msg.message)
      }
    }
    workerRef.current.onerror = (e: ErrorEvent) => {
      simInFlightRef.current = false
      setSimulationStatus('error')
      setSimulationError(e.message ?? 'Worker crashed')
    }
    return () => { workerRef.current?.terminate() }
  }, [setSimulationStatus, setOutputBuffer, setSimulationError, postToWorker])

  // Initialize audio pipeline
  useEffect(() => {
    const pipeline = new AudioPipeline()
    pipelineRef.current = pipeline
    pipeline.init(volume)
    return () => { pipeline.destroy() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync volume changes
  useEffect(() => {
    pipelineRef.current?.setVolume(volume)
  }, [volume])

  // Start/stop audio capture when playing state or source changes
  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline) return

    pipeline.stop()
    simInFlightRef.current = false
    if (!playing) return

    function onInputBuffer(buf: Float32Array) {
      inputBufRef.current = buf
    }

    function onError(err: unknown) {
      setSimulationError(err instanceof Error ? err.message : String(err))
      setSimulationStatus('error')
      setPlaying(false)
    }

    if (audioSource.type === 'sample') {
      pipeline.loadSample(audioSource.name)
        .then(() => pipeline.startSampleCapture(audioSource.name, onInputBuffer))
        .catch(onError)
    } else {
      pipeline.startLiveCapture(onInputBuffer).catch(onError)
    }
  }, [playing, audioSource, setSimulationError, setSimulationStatus, setPlaying])

  // Manual simulate: kick off the loop (or send a one-shot if not playing)
  const handleSimulate = useCallback(() => {
    const buf = inputBufRef.current
    inputBufRef.current = new Float32Array(2048)
    setInputSnapshot(new Float32Array(buf))
    postToWorker(buf)
  }, [postToWorker])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar onSimulate={handleSimulate} />

      <div className="flex flex-1 overflow-hidden">
        <SchematicCanvas />

        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Waveform</div>
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
  )
}
