# Example Circuits

Solder ships with a set of starter circuits accessible from the
**Examples** panel in the toolbar. They are roughly split into two
groups: foundational building blocks and complete guitar pedals.

Every example includes inline sticky notes explaining what each section
does, so they double as a tutorial.

## Building blocks (`src/examples/circuits/`)

| Circuit | What it teaches |
|---|---|
| **Low-pass filter** | RC filter, cutoff frequency, how a capacitor to ground shapes treble. |
| **High-pass filter** | Series capacitor as DC block and bass roll-off. |
| **Gain stage** | Non-inverting op-amp gain, bias network for single-supply operation. |
| **Soft clipping** | Diodes-to-ground in the feedback loop — the basis of "smooth" overdrive. |
| **Hard clipping** | Diodes-to-ground after the gain stage — the basis of "harsh" distortion. |
| **Volume pot** | A simple potentiometer as a passive voltage divider. |

Start with the filters if you want to understand how component values
shape the sound. The clipping examples are the cleanest introductions
to how diodes generate harmonics.

## Pedals (`src/examples/pedals/`)

| Pedal | Notes |
|---|---|
| **ProCo RAT** | LM308 distortion classic — high-gain op-amp into hard-clipping diodes. |
| **MXR Distortion+** | LM741 op-amp into asymmetric clipping; the original "distortion" pedal recipe. |
| **Fuzz Face** | Two PNP germanium transistors in a feedback loop — the messiest, most temperamental sound here, by design. |

## Adding a new example

If you want to contribute a new bundled circuit, see
[`ui-patterns.md`](ui-patterns.md#writing-example-circuits) for the
handle-direction, op-amp positioning, and bias-network conventions —
getting them wrong produces invisible edges (React Flow error #008) or
visually misaligned schematics.
