# Codice dei Frattali — Da Vinci Fractal Folios

A Chrome extension. Every new tab you open draws a **fractal folio that has
never existed before** — and renders it in the manner of Leonardo's notebooks:
iron-gall ink with the tremor of a real hand, red-chalk construction lines,
aged parchment with water stains and foxing, left-handed hatching, mirrored
codex handwriting, and a folio number in the corner.

## The four studies

Each tab is seeded with 128 bits of fresh entropy (`crypto.getRandomValues`),
then drawn as one of four fractal studies Leonardo actually pursued:

- **l'Albero** — a branching tree obeying Leonardo's own rule from the
  *Trattato della Pittura*: the cross-sections of child branches sum to the
  parent's (w₁² + w₂² = w²).
- **il Diluvio** — recursive water: logarithmic-spiral eddies that shed
  smaller counter-rotating eddies from their rims, with braided crest strokes,
  as in the Windsor deluge drawings.
- **il Girasole** — phyllotaxis at the golden angle (137.5°), framed by the
  golden-rectangle subdivision and its spiral, with smaller rosettes recurring
  along the spiral's path.
- **le Proporzioni** — a Vitruvian compass-and-straightedge fractal: circle
  and square, then a regular polygon whose chords breed a smaller rotated
  polygon, again and again, with compass pricks at every vertex.

Even the marginalia are unique: the mirror script is generated stroke by
stroke from the same seed. With 2¹²⁸ possible folios, no two tabs — yours or
anyone else's, ever — will draw the same page.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and choose this `fractal-codex` folder
4. Open a new tab

## Use

- **Nuovo folio** button (or press `N`) — draw a fresh folio in place
- **Salva** button (or press `S`) — download the folio as a PNG
- Resizing the window redraws the *same* folio for the new size

## Privacy — no memory, no data collection

- **Zero permissions** — the manifest requests none.
- **Zero network** — the extension makes no requests of any kind.
- **Zero storage** — no cookies, no localStorage, no IndexedDB, no history of
  past folios. Each seed lives only in its tab and dies with it. If you love
  a folio, save the PNG — nothing else will ever remember it.
