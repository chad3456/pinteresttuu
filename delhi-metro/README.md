# DILLI UNDERGROUND — Delhi Metro, Live in 3D

A living 3D map of the Delhi Metro built with **Three.js + GSAP** in one
self-contained HTML file. Open `index.html` in any browser — no build step,
no network, everything inlined.

## What you're looking at

All ten DMRC line services drawn in light across a night-time Delhi —
**232 stations, ~324 km**: Red, Yellow, Blue (+ Vaishali branch), Green
(+ Kirti Nagar branch), Violet, Pink, Magenta, Grey and the Airport Express,
from Samaypur Badli to Millennium City Centre, Brigadier Hoshiar Singh to
Noida Electronic City, Kashmere Gate to Raja Nahar Singh. Interchanges are
the bright discs; the Yamuna glows blue through the sprawl; landmark pins
(India Gate, Red Fort, Qutub Minar…) keep you oriented.

## The hustle is real(istic)

- The HUD clock runs on **real Indian Standard Time** — the map opens at
  whatever time it actually is in Delhi right now.
- Trains run on the published **peak (≈2–4 min) and off-peak (≈5–7 min)
  headways** per line: watch the fleet swell at 8–11 AM and 5–8:30 PM
  (the RUSH HOUR badge lights up), thin out after lunch, and stop entirely
  when service closes around midnight.
- Station **crowd halos** breathe with the time of day — interchanges like
  Rajiv Chowk and Kashmere Gate burn brightest at rush hour.
- Fast-forward the whole day at **60× or 600×** to feel the city's pulse.

## Explore

- **Drag** to orbit, **scroll / pinch** to zoom
- **Click a station** — name, lines, interchange info
- **Click a train** — ride the cab, with the next station called out live
- **Tap lines in the legend** to isolate the corridor you care about

## Honesty notes

Built from public DMRC network facts. Station positions are approximate
(hand-placed geography, not survey data); train movements are **simulated**
from published headways and an average ~38 km/h schedule speed — DMRC does
not publish a public real-time train feed. Not an official DMRC service.

## Under the hood

CatmullRom tube geometry per line with additive under-glow, custom GLSL
bloom + ACES tone-mapping, instanced low-poly city blocks that thicken
toward the centre, ~1,400 window-light particles, raycast picking for
stations and trains, distance-faded name labels, and a stateless train
scheduler (position is a pure function of sim-time), so the clock can jump
or fast-forward with zero drift.
