# Audio

Sample loading, playback, and persistence for user-uploaded WAVs.

## Pipeline (`src/lib/audio/pipeline.ts`)

Web Audio API integration. Loads `.wav` samples from `/public/samples/`
and exposes `getSampleData(name)` to get raw `Float32Array` data.

## Browser audio policy

- Do **not** create `AudioContext` on app mount. Browsers will warn and
  may leave the context suspended until the user interacts with the
  page.
- Initialize or resume audio only after a user gesture (pointer/key
  press, or the click that starts playback/simulation).
- If a feature depends on decoded sample audio, make that action await
  audio initialization and sample loading instead of assuming the
  pipeline is ready during initial render.

## Local sample persistence

User-uploaded WAVs live in IndexedDB via
`src/lib/audio/local-sample-store.ts`, **not** in Zustand's persisted
localStorage payload.

- Persist only lightweight metadata and the selected `audioSource` in
  the Zustand store. Do not try to serialize raw WAV bytes into the
  store — localStorage caps at ~5 MB per origin.
- Restore the sidebar sample list from IndexedDB on boot, but decode
  audio lazily on selection / playback / simulation so refreshes stay
  cheap.

## Output reconstruction

After SPICE finishes, the variable-step output is interpolated back to
44 100 Hz by `voltageToAudioBuffer` in `src/lib/audio/audio-convert.ts`.
The result is stored as `outputBuffer` in Zustand and played by
`AudioPipeline.playBuffer()`.

For the full simulation chain, see [simulation.md](simulation.md).
