extends Node2D
## Spidey Swing: Queens — game manager.
## One input everywhere: press = shoot web, release = let go.
## Works with touch, mouse and keyboard identically.

enum State { TITLE, PLAYING, DEAD }

const SAVE_PATH := "user://spidey_swing.cfg"
const START_POS := Vector2(60.0, 380.0)

var state: int = State.TITLE
var score := 0
var best := 0
var died_at_ms := 0

var city: City
var player: Player
var hud: Hud
var camera: Camera2D
var web_line: Line2D
var trail: Line2D
var trail_points: Array[Vector2] = []


func _ready() -> void:
	_build_sky()
	_build_parallax()

	city = City.new()
	add_child(city)

	trail = Line2D.new()
	trail.width = 10.0
	var tg := Gradient.new()
	tg.offsets = PackedFloat32Array([0.0, 1.0])
	tg.colors = PackedColorArray([Color(1, 1, 1, 0.0), Color(0.75, 0.85, 1.0, 0.4)])
	trail.gradient = tg
	add_child(trail)

	web_line = Line2D.new()
	web_line.width = 4.0
	web_line.default_color = Color(0.95, 0.95, 0.98, 0.95)
	web_line.visible = false
	add_child(web_line)

	player = Player.new()
	player.z_index = 5
	add_child(player)

	camera = Camera2D.new()
	add_child(camera)
	camera.make_current()

	hud = Hud.new()
	add_child(hud)

	best = _load_best()
	_reset()


func _build_sky() -> void:
	var layer := CanvasLayer.new()
	layer.layer = -110
	add_child(layer)
	var tex := GradientTexture2D.new()
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 0.55, 0.82, 1.0])
	g.colors = PackedColorArray([
		Color("1b1e3d"), Color("41355f"), Color("b96b4e"), Color("f0a96b"),
	])
	tex.gradient = g
	tex.fill_from = Vector2(0.0, 0.0)
	tex.fill_to = Vector2(0.0, 1.0)
	var rect := TextureRect.new()
	rect.texture = tex
	rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rect.stretch_mode = TextureRect.STRETCH_SCALE
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(rect)


func _build_parallax() -> void:
	var bg := ParallaxBackground.new()
	add_child(bg)
	var far := ParallaxLayer.new()
	far.motion_scale = Vector2(0.12, 0.03)
	far.motion_mirroring = Vector2(2400.0, 0.0)
	bg.add_child(far)
	far.add_child(City.FarSkyline.new())
	var mid := ParallaxLayer.new()
	mid.motion_scale = Vector2(0.35, 0.07)
	mid.motion_mirroring = Vector2(2000.0, 0.0)
	bg.add_child(mid)
	mid.add_child(City.MidSkyline.new())


func _reset() -> void:
	score = 0
	trail_points.clear()
	trail.clear_points()
	web_line.visible = false
	city.ensure_generated(START_POS.x + 2400.0)
	var perch := Vector2(START_POS.x, city.roof_at(START_POS.x) - 34.0)
	player.reset(perch)
	camera.position = perch + Vector2(260.0, -140.0)
	camera.zoom = Vector2.ONE
	state = State.TITLE
	hud.mode_title(best)


func _unhandled_input(event: InputEvent) -> void:
	var pressed := false
	var released := false
	if event is InputEventScreenTouch:
		pressed = event.pressed
		released = not event.pressed
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		pressed = event.pressed
		released = not event.pressed
	elif event is InputEventKey and event.keycode == KEY_SPACE and not event.echo:
		pressed = event.pressed
		released = not event.pressed
	if pressed:
		_on_press()
	elif released:
		_on_release()


func _on_press() -> void:
	match state:
		State.TITLE:
			state = State.PLAYING
			hud.mode_playing()
			player.attach(city.get_anchor(player.position))
			web_line.visible = true
		State.PLAYING:
			player.attach(city.get_anchor(player.position))
			web_line.visible = true
		State.DEAD:
			if Time.get_ticks_msec() - died_at_ms > 450:
				_reset()
				_on_press()   # same tap starts the next run — no double-tap


func _on_release() -> void:
	if state == State.PLAYING:
		player.release()
		web_line.visible = false


func _physics_process(delta: float) -> void:
	match state:
		State.PLAYING:
			_tick_playing(delta)
		State.TITLE:
			pass
		State.DEAD:
			pass


func _tick_playing(delta: float) -> void:
	city.ensure_generated(camera.position.x + 2200.0)
	city.prune(camera.position.x - 2600.0)
	player.step(delta)

	if player.attached:
		web_line.points = PackedVector2Array([player.hand_point(), player.anchor])

	trail_points.append(player.position)
	if trail_points.size() > 26:
		trail_points.remove_at(0)
	trail.points = PackedVector2Array(trail_points)

	var meters := int(player.position.x / 50.0)
	if meters > score:
		score = meters
	hud.set_score(score, maxi(best, score))

	# camera: lookahead + speed zoom
	var look := clampf(player.velocity.x * 0.12, 0.0, 380.0)
	var target := Vector2(
		player.position.x + 240.0 + look,
		clampf(player.position.y - 130.0, -240.0, 480.0)
	)
	var k := 1.0 - exp(-6.0 * delta)
	camera.position = camera.position.lerp(target, k)
	var speed_f := clampf(player.velocity.length() / 2500.0, 0.0, 1.0)
	var z := lerpf(1.0, 0.8, speed_f)
	camera.zoom = camera.zoom.lerp(Vector2(z, z), k)

	if player.position.y > City.STREET_Y - 16.0:
		_die()


func _die() -> void:
	state = State.DEAD
	died_at_ms = Time.get_ticks_msec()
	web_line.visible = false
	player.position.y = City.STREET_Y - 16.0
	var new_best := score > best
	if new_best:
		best = score
		_save_best()
	hud.mode_dead(score, best, new_best)


func _load_best() -> int:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) == OK:
		return int(cfg.get_value("save", "best", 0))
	return 0


func _save_best() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("save", "best", best)
	cfg.save(SAVE_PATH)
