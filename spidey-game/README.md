# Spidey Swing: Queens

A web-swinging game set over an endless, procedurally generated Queens, NYC —
built as a **Godot 4 project**, with a mechanics-identical **browser preview**
included. Unofficial fan project: all code and art here are original; not
affiliated with or endorsed by Marvel.

## One input, every device

Press = shoot a web. Release = let go. That's the whole control scheme,
and it's identical everywhere:

- **Phone / tablet** — touch and hold anywhere on the screen
- **Laptop / desktop** — hold the left mouse button or SPACE

The web auto-aims at the best anchor ahead and above you (roof corners,
water-tower tops, the elevated-train deck), so there is no aiming to learn.
Swing physics is a classic constrained pendulum: while attached your position
is held to the rope circle and outward radial velocity is removed; a tangential
"pump" adds swing energy, and releasing at the top of the upswing flings you.
Webs are forgiving — the rope auto-shortens so an arc can never drag you into
the pavement. Falling without a web is not forgiving. Score is distance;
best run is saved locally.

## Queens, NYC

The skyline is generated from Queens landmarks and textures: brick rowhouse
blocks with lit windows and fire escapes, rooftop water towers, the elevated
**7-train trestle** with a train rattling past, and — in the parallax
distance — the **Unisphere** of Flushing Meadows, the **Queensboro Bridge**,
and the Manhattan skyline across the river, all under a dusk gradient.
Everything is drawn in code; there are no image assets.

## Running the Godot version

1. Install [Godot 4.2+](https://godotengine.org/download) (any platform).
2. Open Godot → **Import** → select this folder's `project.godot`.
3. Press **F5** (Run Project).

Export presets for Android/iOS/HTML5 work out of the box — the project uses
the `gl_compatibility` renderer and `canvas_items` stretch with `expand`
aspect, so it scales to any resolution and orientation.

Project layout:

```
project.godot          engine config (input, stretch, renderer)
main.tscn              single-node scene; everything is built in code
scripts/main.gd        game manager: states, input, camera, sky, parallax
scripts/player.gd      swing physics + the hand-drawn hero
scripts/city.gd        procedural Queens + web anchors + 7-train trestle
scripts/hud.gd         score, title, game-over overlays
```

## Browser preview (no install)

Open `web/index.html` in any browser — phone or desktop. It is a faithful
JavaScript port of the same tuning constants and generation code, kept so the
game can be play-tested anywhere Godot isn't installed.
