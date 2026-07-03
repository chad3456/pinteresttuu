class_name Hud
extends CanvasLayer
## Score, prompts, title and game-over screens. All controls ignore the
## mouse so the whole screen stays one big swing button.

var score_label: Label
var best_label: Label
var msg_label: Label
var sub_label: Label
var dim: ColorRect


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
	sub_label.text = "HOLD anywhere (or SPACE) to shoot a web — release to fly\nunofficial fan game"


func mode_playing() -> void:
	dim.visible = false
	score_label.visible = true
	best_label.visible = true
	msg_label.visible = false
	sub_label.visible = false


func mode_dead(score: int, best: int, new_best: bool) -> void:
	dim.visible = true
	msg_label.visible = true
	msg_label.text = "SPLAT.\n" + str(score) + " m"
	sub_label.visible = true
	if new_best:
		sub_label.text = "NEW BEST! even the pigeons applauded\ntap to swing again"
	else:
		sub_label.text = "best " + str(best) + " m — the streets of Queens forgive you\ntap to swing again"
