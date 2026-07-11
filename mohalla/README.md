# MOHALLA — The Little Errand Town

A cozy Indian town you explore like a tiny open-world game, built with
**Three.js + GSAP** in one self-contained HTML file. Open `index.html` in any
browser — both libraries are inlined, no build step, no network.

## The idea

You are the neighbourhood's helping hand. A neighbour hands you something —
a hand-written *chitthi* (letter), a hot kettle of chai, a warm tiffin,
medicines from the clinic, Dadi's spectacles — and you carry it across the
lanes to whoever needs it. Follow the glowing marker, press **E** to collect,
press **E** again to deliver, and watch the *good deeds* count climb. Small
chores, big smiles.

## The town

A warm, low-poly *mohalla* laid out around a central **chowk** with a well and
a big peepal tree: a **mandir** with a stepped shikhara to the north, a
**chai tapri** and a **sabzi market** with striped canopies, a **kirana store**
and a **clinic**, and lanes of painted flat-roof houses — awnings, shutters,
rooftop water tanks and *rangoli* at every doorstep. Street lamps, trees and a
couple of unbothered cows fill it in. Eleven named neighbours stand at their
places, each with a floating name label.

## Three ways to get around

- **On foot** — camera-relative WASD, **SHIFT** to run.
- **Bicycle** — parked by the chowk; walk up and press **F** to hop on. Faster,
  with a pedalling rider and spinning wheels.
- **Auto-rickshaw** — the classic yellow-and-green three-wheeler. Fastest ride
  in town. Press **F** near it to climb in, **F** again to hop out.

## Controls

- **W A S D / arrows** move · **SHIFT** run
- **F** hop on / off the nearest ride
- **E** collect / deliver at the glowing marker
- **drag** to look · **scroll / pinch** to zoom
- Phones: virtual joystick + on-screen **E** and ride buttons

## Under the hood

Warm afternoon lighting with PCF soft shadows and image-based lighting from a
gradient sky, a custom GLSL bloom + ACES tone-mapping post pass, procedural
canvas textures (packed earth, striped canopies, rangoli, name labels),
AABB collision resolution against every building, an always-on minimap with a
pulsing destination marker, and a two-stage errand loop that never runs out.
Capped delta-time and guarded WebGL init so it doesn't fall over.
