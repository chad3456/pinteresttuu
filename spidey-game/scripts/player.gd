class_name Player
extends Node2D
## Web-swinging hero: manual pendulum physics on a Node2D.
## While attached, position is constrained to the rope circle and the
## outward radial velocity is removed — the classic swing integrator.

const GRAVITY := 2300.0
const PUMP := 380.0          # tangential push while swinging
const MAX_SPEED := 2500.0
const RELEASE_BOOST := 1.05
const AIR_DRAG := 0.06

var velocity := Vector2.ZERO
var attached := false
var anchor := Vector2.ZERO
var rope_len := 0.0
var pose_angle := 0.0


func reset(pos: Vector2) -> void:
	position = pos
	velocity = Vector2.ZERO
	attached = false
	pose_angle = 0.0
	queue_redraw()


func attach(a: Vector2) -> void:
	anchor = a
	rope_len = clampf(position.distance_to(a), 150.0, 780.0)
	# never let the arc bottom dip into the street — webs are forgiving,
	# falling without one is not
	var floor_len := (City.STREET_Y - 60.0) - a.y
	rope_len = minf(rope_len, maxf(150.0, floor_len))
	attached = true
	if velocity.length() < 220.0:
		velocity += Vector2(340.0, -260.0)   # first leap off the roof


func release() -> void:
	if not attached:
		return
	attached = false
	velocity = (velocity * RELEASE_BOOST).limit_length(MAX_SPEED)


func step(delta: float) -> void:
	velocity.y += GRAVITY * delta
	if attached:
		var tangent := (position - anchor).orthogonal().normalized()
		if tangent.dot(velocity) < 0.0:
			tangent = -tangent
		velocity += tangent * PUMP * delta
	else:
		velocity -= velocity * AIR_DRAG * delta
	velocity = velocity.limit_length(MAX_SPEED)
	position += velocity * delta
	if attached:
		var d := position - anchor
		if d.length() > rope_len:
			var rn := d.normalized()
			position = anchor + rn * rope_len
			var vr := velocity.dot(rn)
			if vr > 0.0:
				velocity -= rn * vr
	# lean into the motion
	var target_angle := clampf(velocity.x * 0.00035, -0.9, 0.9)
	if attached:
		target_angle = (anchor - position).angle() + PI * 0.5
		target_angle = clampf(target_angle, -1.1, 1.1)
	pose_angle = lerp_angle(pose_angle, target_angle, minf(1.0, delta * 10.0))
	queue_redraw()


func _draw() -> void:
	var red := Color("c8232c")
	var red_d := red.darkened(0.25)
	var blue := Color("1f3a93")
	draw_set_transform(Vector2.ZERO, pose_angle, Vector2.ONE)
	# trailing legs
	var kick := clampf(velocity.length() / MAX_SPEED, 0.2, 1.0)
	draw_line(Vector2(-2.0, 10.0), Vector2(-14.0 - 10.0 * kick, 30.0), blue, 7.0)
	draw_line(Vector2(4.0, 10.0), Vector2(-4.0 - 16.0 * kick, 34.0), blue.darkened(0.2), 7.0)
	# torso
	draw_rect(Rect2(-9.0, -14.0, 18.0, 27.0), red)
	draw_rect(Rect2(-9.0, 2.0, 18.0, 11.0), blue)
	# arms: web arm up when attached, else both trailing
	if attached:
		draw_line(Vector2(0.0, -10.0), Vector2(12.0, -26.0), red_d, 6.0)
		draw_line(Vector2(-2.0, -6.0), Vector2(-16.0, 8.0), red_d, 6.0)
	else:
		draw_line(Vector2(0.0, -8.0), Vector2(16.0, 2.0), red_d, 6.0)
		draw_line(Vector2(-2.0, -8.0), Vector2(-16.0, 4.0), red_d, 6.0)
	# head with big white eyes (original minimal mask, no emblem)
	draw_circle(Vector2(2.0, -22.0), 9.5, red)
	var eye := PackedVector2Array([
		Vector2(4.0, -26.0), Vector2(10.5, -23.5), Vector2(4.5, -20.5),
	])
	draw_polygon(eye, PackedColorArray([Color.WHITE]))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func hand_point() -> Vector2:
	return position + Vector2(12.0, -26.0).rotated(pose_angle)
