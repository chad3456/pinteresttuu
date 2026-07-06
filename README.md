# Art Rewind — The Westward Museum

An interactive time machine for Western art, in the style of "rewind" websites
like Opera's Web Rewind (web-rewind.com): hold a control and time spools
backwards, then release to land in a curated stop on the timeline.

Here, the timeline is 19,000 years of Western art. Thirteen gallery rooms run
from the cave walls of Lascaux (17,000 BC) through Classical Antiquity, the
Gothic centuries, the Renaissance, the Baroque, Rococo, Romanticism,
Impressionism, Post-Impressionism, Cubism, Abstract Expressionism, and Pop Art
to the digital present (2026).

## Try it

Open `index.html` in any modern browser. No build step, no dependencies, no
network requests — the whole museum is one self-contained file.

## Interactions

- **Hold `SPACE`** (or press-and-hold the ◀◀ Rewind button, tap-and-hold on
  mobile) to travel back in time. The year counter spins, eras flash past,
  and a synthesized tape-rewind whoosh plays. Release to land in the nearest
  gallery room.
- **Hold `F`** (or ▶▶ Forward) to travel toward the present.
- **`←` / `→`** step one room at a time.
- **Timeline scrubber** along the bottom — click any year to jump straight to
  that room.
- **Click any painting** to open its museum wall label (title, date, medium,
  and a note on the era's technique).
- **Sound toggle** in the top bar. All audio is synthesized live with the Web
  Audio API — there are no audio files.

## The collection

Every painting is an original study rendered live in `<canvas>`, in the
technique of its era — spray-stencilled hands, slip-painted terracotta,
gold-leaf punchwork, one-point perspective, chiaroscuro, impressionist dabs,
pointillist dots, drip painting, Ben-Day dots, and pixel sorting. A per-visit
seed means no two visits paint exactly alike. Each room also dresses the
gallery in its era: palette, frame style (rock face, stone, gilt, float
frame), and wall text.

Respects `prefers-reduced-motion`. Works on desktop and mobile.

## Also in this repo

- [`shashn/`](shashn/) — **Shashn**, a satirical political strategy board
  game for 3–5 players (pass-and-play, single self-contained HTML file).
