// src/App.tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import { Toolbar }         from './components/Toolbar'
import { SchematicCanvas } from './components/SchematicCanvas'
import { Inspector }       from './components/Inspector'
import { WaveformDisplay } from './components/WaveformDisplay'
import { AudioControls }   from './components/AudioControls'
import { StatusBar }       from './components/StatusBar'
import { useStore }        from './store'
import { AudioPipeline }   from './audio/pipeline'
import { compileNetlist }  from './lib/netlist'
import type { SimulateResponse } from './lib/types'

export default function App() {
  const {
    nodes, edges, outputBuffer,
    audioSource, volume, playing,
    setSimulationStatus, setOutputBuffer, setSimulationError,
    setPlaying,
  } = useStore((s) => ({
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
  }))

  const workerRef   = useRef<Worker | null>(null)
  const pipelineRef = useRef<AudioPipeline | null>(null)
  // Keep a ref to the latest input buffer so Simulate can use it
  const inputBufRef = useRef<Float32Array>(new Float32Array(2048))
  const [inputSnapshot, setInputSnapshot] = useState<Float32Array | null>(null)

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data
      if (msg.type === 'result') {
        setSimulationStatus('idle')
        setOutputBuffer(msg.outputBuffer)
        pipelineRef.current?.scheduleOutput(msg.outputBuffer)
      } else {
        setSimulationStatus('error')
        setSimulationError(msg.message)
      }
    }
    workerRef.current.onerror = (e: ErrorEvent) => {
      setSimulationStatus('error')
      setSimulationError(e.message ?? 'Worker crashed')
    }
    return () => { workerRef.current?.terminate() }
  }, [setSimulationStatus, setOutputBuffer, setSimulationError])

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
    if (!playing) return

    function onInputBuffer(buf: Float32Array) {
      inputBufRef.current = buf
    }

    if (audioSource.type === 'sample') {
      pipeline.loadSample(audioSource.name).then(() => {
        pipeline.startSampleCapture(audioSource.name, onInputBuffer)
      })
    } else {
      pipeline.startLiveCapture(onInputBuffer)
    }
  }, [playing, audioSource])

  const handleSimulate = useCallback(() => {
    if (!workerRef.current) return
    try {
      const buf = inputBufRef.current
      setInputSnapshot(new Float32Array(buf))  // copy before transfer
      inputBufRef.current = new Float32Array(2048)   // replace FIRST
      const netlist = compileNetlist(nodes, edges, buf, 44100)
      setSimulationStatus('running')
      workerRef.current.postMessage(
        { type: 'simulate', netlist, inputBuffer: buf },
        [buf.buffer]
      )
    } catch (err) {
      setSimulationStatus('error')
      setSimulationError(err instanceof Error ? err.message : String(err))
    }
  }, [nodes, edges, setSimulationStatus, setSimulationError])

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
