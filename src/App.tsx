// src/App.tsx
import { Toolbar }         from './components/Toolbar'
import { SchematicCanvas } from './components/SchematicCanvas'
import { Inspector }       from './components/Inspector'
import { WaveformDisplay } from './components/WaveformDisplay'
import { AudioControls }   from './components/AudioControls'
import { StatusBar }       from './components/StatusBar'
import { useStore }        from './store'

export default function App() {
  const { outputBuffer } = useStore((s) => ({
    outputBuffer: s.outputBuffer,
  }))

  // Placeholder simulate handler — wired to real worker in Task 14
  function handleSimulate() {
    console.log('Simulate clicked — worker not yet wired')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar onSimulate={handleSimulate} />

      <div className="flex flex-1 overflow-hidden">
        <SchematicCanvas />

        {/* Right panel */}
        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Waveform</div>
            <WaveformDisplay
              inputBuffer={null}
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
