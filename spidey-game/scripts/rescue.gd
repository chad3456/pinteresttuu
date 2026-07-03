class_name Rescue
extends Node2D
## MJ rescue loop: she waits on a rooftop, you swing close to pick her up,
## then carry her to the green safe roof for a distance bonus.
## step() returns: 0 nothing · 1 picked up · 2 delivered.

const PICKUP_RADIUS := 95.0
const DELIVER_RADIUS := 130.0
const CARRY_DIST := 12500.0

enum MJState { NONE, WAITING, CARRIED }

var state: int = MJState.NONE
var mj_pos := Vector2.ZERO
var next_at_x := 16000.0
var safe_x := 0.0
var safe_b: City.Building = null
var saved := 0
var city: City
var rng := RandomNumberGenerator.new()


func _init(city_ref: City) -> void:
	city = city_ref


func _process(_delta: float) -> void:
	queue_redraw()


func reset() -> void:
	state = MJState.NONE
	next_at_x = 16000.0
	saved = 0
	safe_b = null


func carrying() -> bool:
	return state == MJState.CARRIED


func snatch(player_x: float) -> void:
	state = MJState.NONE
	next_at_x = player_x + rng.randf_range(14000.0, 20000.0)


func safe_meters_left(player_x: float) -> int:
	return maxi(0, int(ceil((safe_x - player_x) / 50.0)))


func step(p: Vector2, cam_x: float) -> int:
	match state:
		MJState.NONE:
			if city.next_x > next_at_x + 400.0:
				var b := city.building_after(next_at_x)
				if b != null:
					state = MJState.WAITING
					mj_pos = Vector2(b.position.x + b.w * 0.5, b.roof - 16.0)
		MJState.WAITING:
			if mj_pos.x < cam_x - 1200.0:
				state = MJState.NONE
				next_at_x = p.x + rng.randf_range(9000.0, 14000.0)
			elif p.distance_to(mj_pos) < PICKUP_RADIUS:
				state = MJState.CARRIED
				safe_x = p.x + CARRY_DIST
				safe_b = null
				return 1
		MJState.CARRIED:
			if safe_b == null:
				safe_b = city.building_after(safe_x)
			if safe_b != null:
				var s := Vector2(safe_b.position.x + safe_b.w * 0.5, safe_b.roof)
				if p.distance_to(s) < DELIVER_RADIUS:
					state = MJState.NONE
					saved += 1
					next_at_x = p.x + rng.randf_range(12000.0, 18000.0)
					return 2
	return 0


func _draw() -> void:
	var font := ThemeDB.fallback_font
	var ms := float(Time.get_ticks_msec())
	if state == MJState.WAITING:
		var bob := sin(ms / 300.0) * 3.0
		var m := mj_pos + Vector2(0.0, bob)
		# beacon ring
		var pr := 18.0 + sin(ms / 240.0) * 6.0
		draw_arc(m + Vector2(0.0, -8.0), pr + 16.0, 0.0, TAU, 32,
			Color(1.0, 0.55, 0.67, 0.8), 3.0)
		# figure: jeans, white top, red hair, waving
		draw_rect(Rect2(m.x - 5.0, m.y - 2.0, 10.0, 16.0), Color("3a5da8"))
		draw_rect(Rect2(m.x - 5.0, m.y - 14.0, 10.0, 13.0), Color("f0ece0"))
		var wave := absf(sin(ms / 160.0)) * 6.0
		draw_line(m + Vector2(4.0, -10.0), m + Vector2(13.0, -22.0 - wave), Color("f0ece0"), 4.0)
		draw_circle(m + Vector2(0.0, -20.0), 6.0, Color("e8cba6"))
		draw_circle(m + Vector2(-1.0, -24.0), 6.5, Color("c9452c"))
		draw_rect(Rect2(m.x - 7.0, m.y - 24.0, 4.0, 12.0), Color("c9452c"))
		draw_string(font, m + Vector2(-40.0, -44.0), "HELP!",
			HORIZONTAL_ALIGNMENT_CENTER, 80.0, 14, Color(1.0, 0.85, 0.54))
	elif state == MJState.CARRIED and safe_b != null:
		var s := Vector2(safe_b.position.x + safe_b.w * 0.5, safe_b.roof)
		# beacon column + pulsing ring on the safe roof
		for i in range(8):
			var a := 0.35 * (1.0 - float(i) / 8.0)
			draw_rect(Rect2(s.x - 34.0, s.y - 32.0 * float(i + 1), 68.0, 32.0),
				Color(0.47, 1.0, 0.67, a * 0.35))
		var pr2 := 20.0 + sin(ms / 200.0) * 8.0
		draw_arc(s + Vector2(0.0, -14.0), pr2, 0.0, TAU, 32, Color(0.47, 1.0, 0.67, 0.9), 4.0)
		draw_string(font, s + Vector2(-60.0, -286.0), "SAFE ROOF",
			HORIZONTAL_ALIGNMENT_CENTER, 120.0, 15, Color(0.56, 1.0, 0.69))
