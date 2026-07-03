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
the pavement, a soft air cushion near the street buys you a beat to react, and
if a villain cuts your web while you're still holding, a new one auto-fires.
Falling without a web is not forgiving. Score is distance plus rescue bonuses;
best run is saved locally.

## Rescue MJ

MJ waves for help from a rooftop (pink beacon). Swing within reach and she
grabs on; carry her ~250 m to the glowing **green safe roof** to deliver her
for a **+100 m bonus**. Take a villain hit while carrying and she's snatched —
and if you fall with her aboard, the game-over screen will let you know
exactly how she feels about it.

## Villain levels

The run rotates through three villain zones every 550 m, each with its own
sky tint, intro banner, and hazard — then the cycle repeats faster:

1. **THE VULTURE** — a winged silhouette shadows you from above. Hovering is
   the telegraph; when the talons flare red, he dives, and the dive is what
   cuts your web.
2. **DOC OCK** — mechanical arms rise from the street on a rhythm, claws
   snapping at swing height. Time your arcs between them.
3. **VENOM** — black goo coats some anchors (webs won't stick — routes
   shrink) while symbiote tendrils lash up from below, faster than Ock's arms.

A villain hit never kills directly: it cuts your web and knocks you — losing
MJ if she's aboard. The street does the rest if you don't recover.

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
