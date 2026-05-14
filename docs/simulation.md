# Simulation

How circuits become SPICE netlists, how they run, and the long list of
ngspice quirks that will silently break things if you ignore them.

> **READ THIS BEFORE TOUCHING `src/lib/netlist.ts` OR ADDING A SPICE
> MODEL.** The eecircuit-engine WASM is a trimmed ngspice build and
> several constructs that work in standard ngspice fail here.

## End-to-end pipeline

The full path from a `.wav` file the user picked in the sidebar to the
output buffer they hear:

```
+-----------------------------------------------------------+
| 1. Sample source                                          |
|    /public/samples/<name>.wav  (or uploaded local WAV)    |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 2. Browser audio decode                                   |
|    AudioPipeline.fetch() + decodeAudioData()              |
|    -> Float32Array input buffer @ 44.1 kHz                |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 3. Optional input trim                                    |
|    Waveform selection keeps only the chosen region        |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 4. Main-thread request                                    |
|    App.tsx posts SimulateRequest to simulation worker     |
|    with: nodes, edges, inputBuffer, inputSampleRate       |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 5. Netlist compilation in worker                          |
|    compileNetlist(...)   src/lib/netlist.ts               |
|    - downsample input to SPICE_SAMPLE_RATE = 10 kHz       |
|    - build PWL source: Vin pos neg PWL(t0 v0 t1 v1 ...)   |
|    - inline only the device models the circuit uses       |
|    - emit Rprobe so the output net always has a load      |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 6. SPICE simulation                                       |
|    EECircuitEngine.run()  src/lib/engines/eecircuit.ts    |
|    - ngspice WASM transient analysis                      |
|    -> variable-step trace: time[] + outputVoltage[]       |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 7. Audio reconstruction                                   |
|    voltageToAudioBuffer()  src/lib/audio/audio-convert.ts |
|    - linear-interpolate SPICE output back to 44.1 kHz     |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| 8. Output buffer                                          |
|    Float32Array stored as outputBuffer in Zustand         |
+-----------------------------------------------------------+
                   |                           |
                   v                           v
+--------------------------------+   +--------------------------------+
| 9a. Visual result              |   | 9b. Audible result             |
|     Waveform display overlays  |   |     AudioPipeline.playBuffer() |
|     input vs output            |   |     plays simulated output     |
+--------------------------------+   +--------------------------------+
```

`SPICE_SAMPLE_RATE` is 10 kHz. The compiler builds a piecewise-linear
voltage source from the audio buffer and the engine runs a full
transient analysis through it.

## eecircuit-engine compatibility

### `POLY()` on E/F elements is not supported

Throws `XSPICE is required to run the 'poly' option`. Replace with
standard elements:

- `EGND 99 0 POLY(2) (3,0) (4,0) 0 .5 .5` → `EGND 99 4 3 4 0.5`
  (midpoint via single E element).
- `FB POLY(5) vs1..vs5 0 c1..c5` → five individual F elements summing at
  the same nodes.
- `EOS POLY(1) nc+ nc- offset gain` → E element + series voltage source
  for the offset.
- `F POLY(1) Vname dc_offset gain` → F element + parallel DC current
  source.

### `1G` suffix not recognised — use `1000Meg`

### `SharedArrayBuffer` is required

`runSim()` hangs forever without Cross-Origin Isolation. The Vite dev
server is configured with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If simulation hangs without error, check
`typeof SharedArrayBuffer !== 'undefined'` in the worker.

### Open circuits cause a hang

A netlist with only a voltage source and no passive load hangs
`runSim()`. Always include `Rprobe ${outputNode} 0 1000Meg` in compiled
netlists.

### Floating `audiin`/`audiout` neg handles cause a singular matrix

The `Vin` source connects `inputPos` → `inputNeg`, and `Rprobe` connects
`outputPos` → `outputNeg`. If neither neg handle is wired to ground,
those nets have no DC path to net 0 and ngspice fails with
`singular matrix`. This especially happens when a coupling capacitor
(DC-blocking) sits between the input and the rest of the circuit.
Always wire audiin/audiout neg handles to a ground node. The
`makeCircuit` test helper in `src/test/simulation/setup.ts` does this
automatically.

### SPICE element naming

The first letter of an element name determines its type (`D`=diode,
`R`=resistor, `C`=capacitor, etc.). Pot labels like `DIST` produce
element names `DISTa` / `DISTb` — ngspice reads the leading `D` as a
diode and fails. The netlist compiler always prefixes pot split-
resistors with `R`.

### Adding new op-amp subcircuit models

Before adding a new `.SUBCKT` to `src/lib/models/`, scan it for `POLY(`
and replace as described above. The TL072 and LM741 in the file are
already converted and serve as reference.
