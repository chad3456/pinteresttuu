# ALEXANDRIA CITY — The Walkable Library

A 3D open-world library you explore like a game, built with Three.js + GSAP
in one self-contained HTML file. Open `index.html` in any browser.

## The city

Six genre districts laid out so kindred shelves are neighbors — Philosophy
beside Science, Science above Fiction, Fiction beside Adventure, Poetry under
Philosophy, History over Adventure. Each district has bookshelf towers
(procedural shelf textures), a glowing district sign, street lamps, trees,
benches — and floating **book lecterns**, one per title.

## The books

26 public-domain classics (Plato, Marcus Aurelius, Nietzsche, Darwin,
Einstein, Austen, Melville, Shelley, Dostoevsky, Verne, Dumas, Whitman,
Homer, Machiavelli, Du Bois, and more). Walk up to a lectern and press
**E** — the complete text streams live from Project Gutenberg into a clean
paginated paper reader with a progress bar and your page remembered per book.
Buttons link to Gutenberg's **EPUB** download and all other formats for each
title. If the network is unavailable (e.g. inside a sandbox), the reader
shows a graceful fallback with an outbound link instead of failing.

## Controls

- **W A S D / arrows** walk · **SHIFT** run — GTA-style, camera-relative
- **drag** to orbit the camera · **scroll / pinch** to zoom
- **E** read at a lectern · **← →** turn pages · **Esc** close
- Phones: virtual joystick + drag-look + on-screen **E** button
- Always-on minimap with district colors, book dots and your heading

## Built to not fall over

Capped delta-time, AABB collision resolution against 77 colliders, cached
book downloads, guarded fetches with multi-URL fallback, WebGL-failure
message, input clearing on blur, and a randomized-input stability wander in
the automated test suite. No build step, no external requests except the
books themselves.
