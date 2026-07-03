class_name City
extends Node2D
## Endless procedural Queens, NYC: brick blocks, water towers, fire escapes,
## and the elevated 7-train trestle. Also owns the web anchor points.

const STREET_Y := 760.0
const TRESTLE_DECK_Y := 470.0

const BRICKS := [
	Color("8a4a3a"), Color("6e4636"), Color("7a5a44"),
	Color("5d5048"), Color("94604a"), Color("665142"),
]

var rng := RandomNumberGenerator.new()
var next_x := -600.0
var anchors: Array[Vector2] = []
var anchor_goo: Array[bool] = []   # kept in sync with anchors
var pieces: Array[Node2D] = []
var buildings_since_trestle := 0


func _init() -> void:
	rng.seed = 20260703


func _process(_delta: float) -> void:
	queue_redraw()   # venom goo blobs animate with the level


## Venom zone check — keep the 550 m level math in sync with villains.gd.
func _gooed(x: float) -> bool:
	return Villains.zone_type(x) == 2 and rng.randf() < 0.35


func _add_anchor(a: Vector2, goo: bool) -> void:
	anchors.append(a)
	anchor_goo.append(goo)


func ensure_generated(up_to_x: float) -> void:
	while next_x < up_to_x:
		if buildings_since_trestle >= rng.randi_range(6, 9):
			_spawn_trestle()
			buildings_since_trestle = 0
		else:
			_spawn_building()
			buildings_since_trestle += 1


func prune(before_x: float) -> void:
	while pieces.size() > 0 and pieces[0].position.x + 900.0 < before_x:
		pieces[0].queue_free()
		pieces.remove_at(0)
	while anchors.size() > 0 and anchors[0].x + 900.0 < before_x:
		anchors.remove_at(0)
		anchor_goo.remove_at(0)


## Best web anchor for a player at p: ahead and above, favoring a ~45 degree rope.
## Always returns something so the input never feels dead.
func get_anchor(p: Vector2) -> Vector2:
	var best := Vector2.ZERO
	var best_score := -1.0e20
	for i in range(anchors.size()):
		if anchor_goo[i]:
			continue   # venom goo: web won't stick
		var a := anchors[i]
		var dx := a.x - p.x
		var dy := a.y - p.y   # negative = above us
		if dx < 90.0 or dx > 780.0 or dy > -90.0:
			continue
		var score := -absf(dx - 380.0) - absf(-dy - 380.0) * 0.8
		if score > best_score:
			best_score = score
			best = a
	if best_score > -1.0e19:
		return best
	return Vector2(p.x + 430.0, maxf(p.y - 460.0, -160.0))


## Roof height of the building under x (for the title-screen perch).
func roof_at(x: float) -> float:
	for p in pieces:
		if p is Building and x >= p.position.x and x <= p.position.x + p.w:
			return p.roof
	return 420.0


## First building at or past x (MJ spawns, safe roofs).
func building_after(x: float) -> Building:
	for p in pieces:
		if p is Building and p.position.x >= x:
			return p
	return null


func _draw() -> void:
	# venom goo dripping from blocked anchors
	var goo := Color("14101c")
	for i in range(anchors.size()):
		if not anchor_goo[i]:
			continue
		var a := anchors[i]
		draw_circle(a, 9.0, goo)
		draw_rect(Rect2(a.x - 3.0, a.y, 6.0, 18.0), goo)
		draw_rect(Rect2(a.x + 6.0, a.y, 4.0, 11.0), goo)


func _spawn_building() -> void:
	var w := rng.randf_range(190.0, 390.0)
	var roof := rng.randf_range(150.0, 470.0)
	var b := Building.new()
	b.w = w
	b.roof = roof
	b.brick = BRICKS[rng.randi_range(0, BRICKS.size() - 1)]
	b.seed_val = rng.randi()
	b.has_tower = rng.randf() < 0.38
	b.has_escape = rng.randf() < 0.3
	b.position = Vector2(next_x, 0.0)
	add_child(b)
	pieces.append(b)
	_add_anchor(Vector2(next_x + 14.0, roof), _gooed(next_x))
	_add_anchor(Vector2(next_x + w - 14.0, roof), _gooed(next_x))
	if b.has_tower:
		_add_anchor(Vector2(next_x + w * 0.5, roof - 96.0), _gooed(next_x))
	next_x += w + rng.randf_range(55.0, 150.0)


func _spawn_trestle() -> void:
	var span := rng.randf_range(620.0, 820.0)
	var t := Trestle.new()
	t.span = span
	t.seed_val = rng.randi()
	t.has_train = rng.randf() < 0.75
	t.position = Vector2(next_x, 0.0)
	add_child(t)
	pieces.append(t)
	var x := next_x + 30.0
	while x < next_x + span - 20.0:
		_add_anchor(Vector2(x, TRESTLE_DECK_Y - 26.0), _gooed(x))
		x += 130.0
	next_x += span + rng.randf_range(60.0, 130.0)


## ------------------------------------------------------------------
class Building extends Node2D:
	var w := 240.0
	var roof := 300.0
	var brick := Color("8a4a3a")
	var seed_val := 0
	var has_tower := false
	var has_escape := false

	func _draw() -> void:
		var r := RandomNumberGenerator.new()
		r.seed = seed_val
		var h := City.STREET_Y - roof
		# face + shaded side
		draw_rect(Rect2(0.0, roof, w, h), brick)
		draw_rect(Rect2(w - 16.0, roof, 16.0, h), brick.darkened(0.28))
		# parapet
		draw_rect(Rect2(-4.0, roof - 8.0, w + 8.0, 10.0), brick.darkened(0.35))
		# windows
		var lit := Color("ffd9a0")
		var dark := Color(0.08, 0.07, 0.1, 0.85)
		var cols := int(w / 46.0)
		var rows := int(h / 60.0)
		for cx in range(cols):
			for cy in range(rows):
				var wx := 18.0 + float(cx) * 46.0
				var wy := roof + 22.0 + float(cy) * 60.0
				if wx + 26.0 > w - 18.0:
					continue
				var c := lit if r.randf() < 0.34 else dark
				draw_rect(Rect2(wx, wy, 26.0, 34.0), c)
		# fire escape zigzag
		if has_escape:
			var fx := w * 0.28
			var fy := roof + 26.0
			var steps := int((h - 60.0) / 52.0)
			for i in range(steps):
				draw_line(Vector2(fx, fy), Vector2(fx + 34.0, fy + 26.0), Color(0.1, 0.1, 0.12), 3.0)
				draw_line(Vector2(fx + 34.0, fy + 26.0), Vector2(fx, fy + 52.0), Color(0.1, 0.1, 0.12), 3.0)
				fy += 52.0
		# rooftop: AC box + iconic NYC water tower
		draw_rect(Rect2(w * 0.12, roof - 26.0, 34.0, 20.0), Color(0.32, 0.3, 0.3))
		if has_tower:
			var tx := w * 0.5
			var legs := Color(0.14, 0.11, 0.09)
			draw_line(Vector2(tx - 22.0, roof), Vector2(tx - 16.0, roof - 44.0), legs, 4.0)
			draw_line(Vector2(tx + 22.0, roof), Vector2(tx + 16.0, roof - 44.0), legs, 4.0)
			draw_rect(Rect2(tx - 26.0, roof - 92.0, 52.0, 48.0), Color("5d4632"))
			draw_rect(Rect2(tx - 26.0, roof - 92.0, 52.0, 6.0), Color("4a3828"))
			var cone := PackedVector2Array([
				Vector2(tx - 30.0, roof - 92.0),
				Vector2(tx, roof - 116.0),
				Vector2(tx + 30.0, roof - 92.0),
			])
			draw_polygon(cone, PackedColorArray([Color("3d2f22")]))


## ------------------------------------------------------------------
class Trestle extends Node2D:
	var span := 700.0
	var seed_val := 0
	var has_train := false
	var train_t := 0.0

	func _process(delta: float) -> void:
		if has_train:
			train_t += delta * 0.22
			if train_t > 1.6:
				train_t = -0.6
			queue_redraw()

	func _draw() -> void:
		var deck_y := City.TRESTLE_DECK_Y
		var steel := Color("2f4a3d")   # weathered 7-line green
		var steel_d := steel.darkened(0.3)
		# columns down to the street
		var x := 40.0
		while x < span:
			draw_rect(Rect2(x - 9.0, deck_y, 18.0, City.STREET_Y - deck_y), steel_d)
			draw_line(Vector2(x - 26.0, City.STREET_Y), Vector2(x, deck_y + 30.0), steel_d, 5.0)
			draw_line(Vector2(x + 26.0, City.STREET_Y), Vector2(x, deck_y + 30.0), steel_d, 5.0)
			x += 170.0
		# deck, girder and railing
		draw_rect(Rect2(0.0, deck_y - 6.0, span, 26.0), steel)
		draw_rect(Rect2(0.0, deck_y + 12.0, span, 8.0), steel_d)
		var gx := 0.0
		while gx < span:
			draw_line(Vector2(gx, deck_y - 6.0), Vector2(gx + 20.0, deck_y + 20.0), steel_d, 3.0)
			gx += 20.0
		draw_line(Vector2(0.0, deck_y - 22.0), Vector2(span, deck_y - 22.0), steel_d, 3.0)
		# the 7 train rattling past (generic silver cars)
		if has_train and train_t >= -0.2 and train_t <= 1.2:
			var tx := span * train_t
			for car in range(3):
				var cx := tx - float(car) * 118.0
				draw_rect(Rect2(cx, deck_y - 58.0, 108.0, 38.0), Color("b8bcc2"))
				draw_rect(Rect2(cx, deck_y - 58.0, 108.0, 8.0), Color("8f949c"))
				for wnd in range(4):
					draw_rect(Rect2(cx + 10.0 + float(wnd) * 25.0, deck_y - 48.0, 16.0, 14.0), Color("2a3138"))


## ------------------------------------------------------------------
## Far parallax: Manhattan skyline across the river + Queensboro bridge.
class FarSkyline extends Node2D:
	func _draw() -> void:
		var sil := Color(0.22, 0.2, 0.32, 1.0)
		var r := RandomNumberGenerator.new()
		r.seed = 7
		var x := 0.0
		while x < 2400.0:
			var w := r.randf_range(60.0, 150.0)
			var h := r.randf_range(120.0, 330.0)
			draw_rect(Rect2(x, 620.0 - h, w, h), sil)
			if r.randf() < 0.2:
				draw_rect(Rect2(x + w * 0.35, 620.0 - h - 26.0, w * 0.3, 26.0), sil)
			x += w + r.randf_range(12.0, 50.0)
		# Queensboro bridge silhouette
		var by := 560.0
		draw_line(Vector2(1300.0, by), Vector2(2000.0, by), sil, 8.0)
		for tower_x in [1450.0, 1850.0]:
			draw_rect(Rect2(tower_x - 12.0, by - 130.0, 24.0, 130.0), sil)
			draw_line(Vector2(tower_x, by - 130.0), Vector2(tower_x - 150.0, by), sil, 4.0)
			draw_line(Vector2(tower_x, by - 130.0), Vector2(tower_x + 150.0, by), sil, 4.0)


## Mid parallax: Queens rowhouses, smokestacks — and the Unisphere.
class MidSkyline extends Node2D:
	func _draw() -> void:
		var sil := Color(0.3, 0.24, 0.28, 1.0)
		var r := RandomNumberGenerator.new()
		r.seed = 11
		var x := 0.0
		while x < 2000.0:
			var w := r.randf_range(90.0, 200.0)
			var h := r.randf_range(70.0, 190.0)
			draw_rect(Rect2(x, 700.0 - h, w, h), sil)
			if r.randf() < 0.25:
				draw_rect(Rect2(x + w - 26.0, 700.0 - h - 40.0, 14.0, 40.0), sil)
			x += w + r.randf_range(6.0, 30.0)
		# the Unisphere, Flushing Meadows
		var c := Vector2(1500.0, 520.0)
		var rad := 84.0
		draw_arc(c, rad, 0.0, TAU, 48, sil, 5.0)
		draw_arc(c, rad * 0.62, 0.0, TAU, 40, sil, 3.0)
		for i in range(3):
			var ry := rad * (0.35 + 0.3 * float(i))
			draw_arc(Vector2(c.x, c.y), ry, 0.0, TAU, 40, sil, 2.0)
		draw_line(c + Vector2(-30.0, rad), c + Vector2(-52.0, rad + 34.0), sil, 6.0)
		draw_line(c + Vector2(30.0, rad), c + Vector2(52.0, rad + 34.0), sil, 6.0)
		draw_line(c + Vector2(0.0, rad), c + Vector2(0.0, rad + 38.0), sil, 6.0)
