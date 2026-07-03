class_name Villains
extends Node2D
## Level hazards: the Vulture (telegraphed dives), Doc Ock arms and Venom
## tendrils. step() returns true on the frame the player gets caught.
## Keep the zone math in sync with city.gd and main.gd (LEVEL_M = 550).

const HIT_RADIUS_VULTURE := 42.0
const TENT_HALF_WIDTH := 26.0

var vulture: VultureNode
var tents: Array[TentNode] = []
var hz_next_x := 1200.0
var hz_rng := RandomNumberGenerator.new()


func _ready() -> void:
	vulture = VultureNode.new()
	vulture.position = Vector2(-2000.0, 250.0)
	add_child(vulture)


func reset() -> void:
	for t in tents:
		t.queue_free()
	tents.clear()
	hz_next_x = 1200.0
	vulture.position = Vector2(-2000.0, 250.0)
	vulture.amt = 0.0
	vulture.t = 0.0


static func zone_type(x: float) -> int:
	return int(maxf(0.0, x / 50.0) / 550.0) % 3


static func zone_cycle(meters: float) -> int:
	return int(maxf(0.0, meters) / 550.0) / 3


func step(delta: float, p: Vector2, invulnerable: bool, meters: int, cam_x: float) -> bool:
	var hit := false
	var typ := zone_type(p.x)
	var speedup := 1.0 + float(zone_cycle(float(meters))) * 0.25
	# --- vulture: hovers as telegraph, only the dive hurts ---
	vulture.t += delta
	var want := 1.0 if (typ == 0 and meters > 90) else 0.0
	vulture.amt += (want - vulture.amt) * minf(1.0, delta * 1.5)
	if vulture.amt > 0.02:
		var dive := pow(maxf(0.0, sin(vulture.t * 0.9 * speedup)), 3.0)
		vulture.dive = dive
		var target := Vector2(
			p.x + 380.0 + sin(vulture.t * 0.6) * 120.0,
			140.0 + dive * 320.0 + sin(vulture.t * 1.5) * 50.0
		)
		vulture.position.x += (target.x - vulture.position.x) * minf(1.0, delta * 1.1 * speedup)
		vulture.position.y += (target.y - vulture.position.y) * minf(1.0, delta * 2.0)
		vulture.position.y += (1.0 - vulture.amt) * -300.0 * delta
		if not invulnerable and vulture.amt > 0.6 and dive > 0.3 \
				and p.distance_to(vulture.position) < HIT_RADIUS_VULTURE:
			hit = true
	else:
		vulture.position.x = p.x - 2200.0
	vulture.queue_redraw()
	# --- tentacles spawn ahead by zone ---
	while hz_next_x < cam_x + 2400.0:
		var zt := zone_type(hz_next_x)
		if zt == 1:
			_spawn_tent(hz_next_x, hz_rng.randf_range(280.0, 480.0), 0.9 * speedup, false)
		elif zt == 2:
			_spawn_tent(hz_next_x, hz_rng.randf_range(200.0, 380.0), 1.5 * speedup, true)
		hz_next_x += 420.0 if zt == 0 else hz_rng.randf_range(340.0, 560.0) / speedup
	while tents.size() > 0 and tents[0].position.x < cam_x - 1400.0:
		tents[0].queue_free()
		tents.remove_at(0)
	for t in tents:
		t.ph += delta * t.sp
		t.cur = t.h * (0.3 + 0.7 * absf(sin(t.ph)))
		t.queue_redraw()
		if not invulnerable and absf(p.x - t.position.x) < TENT_HALF_WIDTH \
				and p.y > City.STREET_Y - t.cur - 20.0:
			hit = true
	return hit


func _spawn_tent(x: float, h: float, sp: float, black: bool) -> void:
	var t := TentNode.new()
	t.position = Vector2(x, 0.0)
	t.h = h
	t.sp = sp
	t.black = black
	t.ph = hz_rng.randf() * 6.0
	add_child(t)
	tents.append(t)


static func _quad(p0: Vector2, p1: Vector2, p2: Vector2, n: int) -> PackedVector2Array:
	var out := PackedVector2Array()
	for i in range(n + 1):
		var u := float(i) / float(n)
		out.append(p0.lerp(p1, u).lerp(p1.lerp(p2, u), u))
	return out


## ------------------------------------------------------------------
class VultureNode extends Node2D:
	var t := 0.0
	var amt := 0.0
	var dive := 0.0

	func _draw() -> void:
		if amt < 0.03:
			return
		var a := clampf(amt, 0.0, 1.0)
		var flap := sin(t * 9.0) * 0.5
		var wing := Color(0.17, 0.29, 0.18, a)
		# each wing: bezier top edge back to the shoulder
		for s in [-1.0, 1.0]:
			var pts := Villains._quad(
				Vector2.ZERO,
				Vector2(60.0 * s, -30.0 - 40.0 * flap),
				Vector2(120.0 * s, -10.0 - 70.0 * flap), 8)
			var back := Villains._quad(
				Vector2(120.0 * s, -10.0 - 70.0 * flap),
				Vector2(70.0 * s, 10.0),
				Vector2(16.0 * s, 12.0), 6)
			pts.append_array(back)
			draw_polygon(pts, PackedColorArray([wing]))
		draw_circle(Vector2(0.0, 4.0), 16.0, Color(0.24, 0.36, 0.23, a))
		draw_circle(Vector2(14.0, -2.0), 7.0, Color(0.85, 0.82, 0.76, a))
		var beak := PackedVector2Array([
			Vector2(20.0, -3.0), Vector2(30.0, 0.0), Vector2(20.0, 2.0)])
		draw_polygon(beak, PackedColorArray([Color(0.91, 0.73, 0.24, a)]))
		draw_circle(Vector2(15.0, -4.0), 2.0, Color(0.79, 0.17, 0.17, a))
		var hot := dive > 0.3
		var talon := Color(1.0, 0.29, 0.24, a) if hot else Color(0.91, 0.73, 0.24, a)
		var tw := 5.0 if hot else 3.0
		draw_line(Vector2(-4.0, 14.0), Vector2(-7.0, 28.0), talon, tw)
		draw_line(Vector2(4.0, 14.0), Vector2(7.0, 28.0), talon, tw)
		if hot:
			draw_arc(Vector2(0.0, 8.0), 30.0, 0.0, TAU, 24, Color(1.0, 0.31, 0.24, 0.5 * a), 2.0)


## ------------------------------------------------------------------
class TentNode extends Node2D:
	var h := 300.0
	var sp := 1.0
	var ph := 0.0
	var black := false
	var cur := 0.0

	func _draw() -> void:
		var col := Color("14101c") if black else Color("3a3d45")
		var hi := Color("4a2a6e") if black else Color("6e7480")
		var segs := 6
		var prev := Vector2(0.0, City.STREET_Y)
		var tip := prev
		for i in range(1, segs + 1):
			var yy := City.STREET_Y - cur * float(i) / float(segs)
			var sway := sin(ph * 2.0 + float(i)) * 10.0 * float(i) / float(segs)
			tip = Vector2(sway, yy)
			draw_line(prev, tip, col, 14.0 - 1.6 * float(i))
			prev = tip
		if black:
			draw_circle(tip, 10.0, col)
			draw_circle(tip + Vector2(-3.0, -2.0), 2.5, hi)
			draw_circle(tip + Vector2(3.0, -2.0), 2.5, hi)
		else:
			draw_arc(tip, 11.0, 0.4, 2.7, 14, hi, 4.0)
			draw_line(tip + Vector2(-9.0, -4.0), tip + Vector2(-14.0, -14.0), hi, 4.0)
			draw_line(tip + Vector2(9.0, -4.0), tip + Vector2(14.0, -14.0), hi, 4.0)
			draw_circle(tip, 3.0, Color(0.79, 0.17, 0.17))
