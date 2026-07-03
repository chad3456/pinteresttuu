class_name Hud
extends CanvasLayer
## Score, prompts, title and game-over screens. All controls ignore the
## mouse so the whole screen stays one big swing button.

var score_label: Label
var best_label: Label
var msg_label: Label
var sub_label: Label
var dim: ColorRect
var lvl_label: Label
var mj_label: Label
var carry_label: Label
var banner_label: Label
var banner_sub: Label
var banner_t := 0.0
var root_ctl: Control
var pops: Array = []   # [{label, t}]


func _ready() -> void:
	layer = 10
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	dim = ColorRect.new()
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.02, 0.02, 0.06, 0.45)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(dim)

	score_label = _mk_label(root, 56, Color.WHITE)
	score_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	score_label.offset_top = 18.0
	score_label.offset_bottom = 90.0

	best_label = _mk_label(root, 20, Color(1.0, 0.85, 0.5))
	best_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	best_label.offset_top = 86.0
	best_label.offset_bottom = 120.0

	msg_label = _mk_label(root, 64, Color.WHITE)
	msg_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	msg_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	msg_label.offset_bottom = -60.0

	sub_label = _mk_label(root, 24, Color(0.85, 0.9, 1.0))
	sub_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	sub_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	sub_label.offset_top = 150.0

	root_ctl = root

	lvl_label = _mk_label(root, 20, Color(0.87, 0.91, 1.0))
	lvl_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	lvl_label.position = Vector2(16.0, 20.0)

	mj_label = _mk_label(root, 18, Color(1.0, 0.56, 0.66))
	mj_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	mj_label.position = Vector2(16.0, 52.0)

	carry_label = _mk_label(root, 18, Color(0.56, 1.0, 0.69))
	carry_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	carry_label.offset_top = -56.0
	carry_label.offset_bottom = -22.0
	carry_label.visible = false

	banner_label = _mk_label(root, 58, Color.WHITE)
	banner_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	banner_label.offset_top = 150.0
	banner_label.offset_bottom = 230.0
	banner_label.visible = false

	banner_sub = _mk_label(root, 20, Color(1.0, 0.85, 0.54))
	banner_sub.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	banner_sub.offset_top = 226.0
	banner_sub.offset_bottom = 266.0
	banner_sub.visible = false


func _process(delta: float) -> void:
	if banner_t > 0.0:
		banner_t -= delta
		var a := clampf(banner_t / 0.4, 0.0, 1.0)
		banner_label.modulate = Color(1, 1, 1, a)
		banner_sub.modulate = Color(1, 1, 1, a)
		if banner_t <= 0.0:
			banner_label.visible = false
			banner_sub.visible = false
	for i in range(pops.size() - 1, -1, -1):
		var p: Dictionary = pops[i]
		p.t -= delta
		var l: Label = p.label
		l.position.y -= delta * 26.0
		l.modulate = Color(1, 1, 1, clampf(p.t / 0.5, 0.0, 1.0))
		if p.t <= 0.0:
			l.queue_free()
			pops.remove_at(i)


func show_banner(text: String, hint: String) -> void:
	banner_label.text = text
	banner_sub.text = hint
	banner_label.visible = true
	banner_sub.visible = true
	banner_t = 2.4


func popup(text: String, color: Color) -> void:
	var l := _mk_label(root_ctl, 24, color)
	l.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	l.offset_top = 300.0 + float(pops.size()) * 36.0
	l.offset_bottom = l.offset_top + 40.0
	pops.append({"label": l, "t": 2.2})


func set_level(lvl_num: int, lvl_name: String) -> void:
	lvl_label.text = "LV " + str(lvl_num) + " · " + lvl_name


func set_mj(saved: int) -> void:
	mj_label.text = "MJ ♥ " + str(saved)


func set_carry(meters_left: int) -> void:
	carry_label.visible = meters_left >= 0
	if meters_left >= 0:
		carry_label.text = "CARRYING MJ — green roof in " + str(meters_left) + " m"


func _mk_label(parent: Control, size: int, color: Color) -> Label:
	var l := Label.new()
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color(0.05, 0.05, 0.12, 0.9))
	l.add_theme_constant_override("outline_size", 10)
	parent.add_child(l)
	return l


func set_score(s: int, best: int) -> void:
	score_label.text = str(s) + " m"
	best_label.text = "BEST " + str(best) + " m"


func mode_title(best: int) -> void:
	dim.visible = true
	score_label.visible = false
	best_label.visible = true
	best_label.text = "BEST " + str(best) + " m"
	msg_label.visible = true
	msg_label.text = "SPIDEY SWING\nQUEENS · NYC"
	sub_label.visible = true
	sub_label.text = "HOLD anywhere (or SPACE) to shoot a web — release to fly\nrescue MJ · survive VULTURE, DOC OCK and VENOM\nunofficial fan game"
	lvl_label.visible = false
	mj_label.visible = false
	carry_label.visible = false


func mode_playing() -> void:
	dim.visible = false
	score_label.visible = true
	best_label.visible = true
	msg_label.visible = false
	sub_label.visible = false
	lvl_label.visible = true
	mj_label.visible = true


func mode_dead(score: int, best: int, new_best: bool, was_carrying: bool, saved: int) -> void:
	dim.visible = true
	msg_label.visible = true
	msg_label.text = "SPLAT.\n" + str(score) + " m"
	sub_label.visible = true
	carry_label.visible = false
	var line1 := "NEW BEST! even the pigeons applauded" if new_best \
		else "best " + str(best) + " m — the streets of Queens forgive you"
	var line2 := ""
	if was_carrying:
		line2 = "\nMJ is fine. She took the stairs. She's disappointed."
	elif saved > 0:
		line2 = "\nMJ rescued ×" + str(saved) + " — Queens thanks you"
	sub_label.text = line1 + line2 + "\ntap to swing again"
