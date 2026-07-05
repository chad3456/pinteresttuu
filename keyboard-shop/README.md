# KEEBSMITH — 3D Custom Keyboard Shop

A fully client-side 3D keyboard e-commerce demo built with **Three.js** and
**GSAP (GreenSock)**. Open `index.html` in any browser — one self-contained
file, both libraries inlined, no build step, no network.

## Everything is procedural

- **Geometry**: keycaps are tapered boxes generated per key width and cached;
  the case is a rounded-rect `ExtrudeGeometry` with bevel; the coiled cable is
  a `TubeGeometry` along a Catmull-Rom curve; the plate, floor and glow plane
  are generated too. No model files anywhere.
- **Shaders**: keycaps use a custom GLSL `ShaderMaterial` — two-light diffuse
  + specular, fresnel rim, per-key legend textures mixed onto the top face,
  vertical color gradient, and an **iridescent mode** (view-angle hue shift)
  for the Oil Slick set. The underglow is a second shader with breathe and
  rainbow-wave modes on a shared time uniform.
- **GSAP**: the keycap assemble cascade (staggered back-out drop-in on every
  layout change), camera fly-tos between Show/Top/Low presets, hero → 
  configurator transition, price count-ups, cart bumps, drawer and toast
  motion.

## Fully customizable

Layouts (Macro 16 / Ortho 48 / Compact 60 with exact ANSI widths), five case
colors, six keycap colorways, three switch acoustics (each with its own
synthesized click — Linear thock, Tactile two-stage, Clicky tick), underglow
modes, and camera presets. Live price updates with every choice.

## And it types

Type on your real keyboard and the 3D board presses the matching keys with
sound. Click any keycap to try a switch. Drag to orbit. Cart, checkout and
order toast complete the (demo) shop loop — no real charges, obviously.
