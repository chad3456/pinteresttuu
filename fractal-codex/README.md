# Codice dei Frattali — Da Vinci Fractal Folios

A Chrome extension. Every new tab draws a **living fractal folio that has
never existed before**, in the manner of Leonardo's notebooks — and the folio
answers your hand:

- **The fractal follows the cursor.** The composition leans toward it, the
  nearest deluge eddy is drawn into its wake, the sunflower rosette drifts
  under it, the fern bows to it.
- **The cursor rewrites the equation.** Your hand literally holds the
  constants: moving it bends the wind in the tree's branching rule, turns the
  Julia constant *c* around the cardioid, detunes the golden angle, tightens
  the spiral of every eddy. The live equation is shown lower-left and its
  numbers change as you move.
- **An enchanted quotation.** Each folio carries a quote from a great author
  in cursive script, hidden in the paper. Words kindle with a golden flash as
  the cursor passes over them — ink surfacing on a charmed page — with wand
  sparkles trailing the hand. Left alone, the page finishes writing itself.

## The six studies

Each tab is seeded with 128 bits from `crypto.getRandomValues`, then drawn as
one of six studies (2¹²⁸ possible folios — no repetition, ever):

- **l'Albero** — a tree obeying Leonardo's rule (child cross-sections sum to
  the parent's: w² = Σwᵢ²); cursor = wind and vigor.
- **il Diluvio** — recursive log-spiral eddies, r(θ) = r₀·e^(−kθ), with braided
  crests; cursor sets k and pulls the nearest vortex.
- **il Girasole** — golden-angle phyllotaxis θₙ = n·137.5°, rₙ = c√n; cursor
  detunes the angle and carries the rosette.
- **le Proporzioni** — recursive Vitruvian polygon construction; the cursor is
  the compass, its bearing sets the twist of every generation.
- **la Mandorla** — a Julia set, zₙ₊₁ = zₙ² + c, rendered as a sepia wash
  etching; the cursor holds c itself.
- **la Felce** — a four-map affine IFS fern, stippled point by point; cursor
  shears the fronds like wind.

## No-repeat guarantees

- **Fractals:** seeded from fresh cryptographic entropy per tab — the same
  folio cannot occur twice.
- **Equations:** the equation signature of each folio is kept in a rolling
  list of 60; a new folio that would collide re-seeds itself. So an equation
  you've seen won't reappear for at least 60 new tabs.
- **Quotes:** ~130 quotations drawn from the Iliad and the Odyssey (Butler and
  Pope's public-domain translations), the Bhagavad Gita (with verse numbers),
  Nietzsche's *Human, All Too Human*, Dostoevsky's *Crime and Punishment*,
  *The Brothers Karamazov* and *The Idiot* (Garnett translation), the *Maxims*
  of François de La Rochefoucauld, the Shiva Purana, and the Chanakya Niti —
  plus a handful of other classical voices. Every quote is attributed to its
  author *and* work; each is used once, and only when the whole library is
  exhausted does the cycle restart.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and choose this `fractal-codex` folder
4. Open a new tab and move your hand across the page

## Use

- **Nuovo folio** (or `N`) — draw a fresh folio
- **Salva** (or `S`) — download the folio as a PNG
- Resizing redraws the *same* folio for the new size

## Privacy — no data collection

Zero permissions, zero network requests, zero analytics, zero cookies.
The only thing kept (in this extension's own localStorage, on your device,
never transmitted) are three tiny rotation lists that make the no-repeat
promises possible: the last 60 equation signatures, the indices of quotes
already shown, and the last few styles used. Nothing about you, your
browsing, or your tabs is recorded — and clearing site data for the
extension resets the rotations harmlessly.
