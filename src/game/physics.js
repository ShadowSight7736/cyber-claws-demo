// JUMP_FORCE / GRAVITY = frames-to-peak.  -11 / 0.18 ≈ 61 frames ≈ 1 s @ 60 fps.
export const GRAVITY          = 0.18;
export const TERMINAL_VY      = 10;
export const MAX_SPEED        = 3.6;
export const ACCELERATION     = 0.28;   // slow build-up to max (~13 frames)
export const FRICTION         = 0.80;
export const JUMP_FORCE       = -9.0;
export const DOUBLE_JUMP_FORCE = -8.5;
export const DASH_FORCE       = 9.0;
export const DASH_DURATION    = 14;
export const DASH_COOLDOWN    = 50;
export const HOVER_DURATION   = 120;   // 2 s @ 60 fps
export const SHIELD_DURATION  = 120;   // 2 s
export const SHIELD_COOLDOWN  = 900;   // 15 s

// Applied once per frame BEFORE updatePlayer (never inside updatePlayer).
export function applyGravity(entity) {
  if (entity.isDashing) return;
  entity.vy += GRAVITY;
  if (entity.vy > TERMINAL_VY) entity.vy = TERMINAL_VY;
}
