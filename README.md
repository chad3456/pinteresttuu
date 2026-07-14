> Also in this repo: [`fractal-codex/`](fractal-codex/) — a Chrome extension
> that draws a never-before-seen Da Vinci–style fractal folio on every new tab.

# WaveSense — WiFi Spatial Sensing

Turn ordinary WiFi into a spatial intelligence system: detect people, measure
breathing and heart rate, track movement, spot falls, and monitor a room —
through walls, in the dark, with no cameras or wearables. Just physics.

Modeled on [ruvnet/ruview](https://github.com/ruvnet/ruview) (MIT), which does
this with $8 ESP32 sensors reading WiFi Channel State Information (CSI). This
app implements the same sensing pipeline as one self-contained web page: it
ships with a physics-faithful CSI simulator (like RuView's demo mode) and
accepts a live ESP32 CSI stream over WebSocket for real hardware.

## Try it

Open `index.html` in any modern browser. No build step, no dependencies, no
server, no network requests.

## Privacy — no memory, no data collection

- **No storage of any kind**: no cookies, no localStorage, no IndexedDB. Every
  buffer is RAM for the current tab and vanishes on close/refresh.
- **No network**: the page makes zero requests. The only optional connection is
  a WebSocket *you* initiate to *your own* sensor, and nothing received is
  stored or forwarded.
- **No cameras, no wearables, no accounts.**

## The physics

WiFi measures the channel per OFDM subcarrier (56 of them here, at 5.18 GHz).
A chest rising ~5 mm with breath lengthens the reflected path, shifting each
subcarrier's phase by 2π·Δd/λ — and λ ≈ 58 mm, so breathing swings the
received amplitude measurably. The heartbeat adds a ~0.4 mm ripple on top.
Walking sweeps the path by centimetres per frame and decorrelates the channel
entirely. The simulator models all of this: static multipath, per-person
reflection paths, through-wall attenuation (~9 dB per transit), and noise.

## The pipeline (runs on simulated *and* live CSI)

1. **Ingest** — 50 Hz frames × 3 links × 56 subcarriers, decimated to 10 Hz
   ring buffers.
2. **Motion** — frame-to-frame decorrelation, scale-free: gait moves the path
   a large fraction of λ per 20 ms frame, breathing ~0.02 mm, so the first
   difference separates locomotion from vitals cleanly.
3. **Aggregation** — top-12 subcarriers by variance, z-scored and sign-aligned
   so anti-phase subcarriers don't cancel.
4. **Coherence gating** — a real body drives the selected subcarriers
   *together*; noise leaves them uncorrelated. Kills false vitals in empty
   rooms.
5. **Vitals** — Hann-windowed 1024-pt FFT, band peaks (respiration
   0.08–0.55 Hz, heart 0.75–2.2 Hz) with sub-bin parabolic interpolation,
   breathing-harmonic rejection in the heart band.
6. **Presence** — motion or coherent vitals, with hysteresis.
7. **People count** — distinct respiration peaks (harmonics and leakage
   shoulders rejected), +1 for a walker who masks their own peak.
8. **Fall watch** — motion spike followed by stillness.
9. **Localization** — per-link dynamic energy matched against a path-loss grid
   model; coarse, honest, and computed without ever seeing coordinates.

The detections you see are *earned*: the estimator only consumes the same
amplitude frames a real sensor would produce. In verification runs it recovers
breathing rate within ±0.1 BPM and heart rate within ±2 BPM of the simulated
ground truth, keeps empty rooms (even at high noise) presence-free, and places
a resting person within ~1 m.

## Scenarios

Empty room · one person resting · sleeping · walking (vitals correctly refuse
to read during locomotion) · two people (two spectral peaks) · fall test.
Toggle the interior wall to watch SNR drop while presence and breathing hold.
Crank the noise slider to stress the detectors. "Show ground truth" overlays
the simulator's real positions against the pipeline's estimates.

## Live hardware (optional)

Flash the [ruvnet/ruview](https://github.com/ruvnet/ruview) ESP32-S3 CSI
firmware, run its sensing server, and point the Live Sensor panel at it —
frames are JSON `{"a":[…56 amplitudes]}` (or a bare array) over WebSocket, fed
into the identical pipeline.
