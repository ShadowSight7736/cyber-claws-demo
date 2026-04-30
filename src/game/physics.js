export const GRAVITY         = 0.55;
export const TERMINAL_VY     = 14;
export const MAX_SPEED        = 4.4;
export const ACCELERATION     = 0.85;
export const FRICTION         = 0.78;   // multiplier per frame when no input
export const JUMP_FORCE       = -12.0;
export const DOUBLE_JUMP_FORCE = -10.5;
export const DASH_FORCE       = 9.5;
export const DASH_DURATION    = 13;     // frames
export const DASH_COOLDOWN    = 48;

export function applyGravity(entity) {
  if (entity.isDashing) return; // gravity suspended during dash
  entity.vy += GRAVITY;
  if (entity.vy > TERMINAL_VY) entity.vy = TERMINAL_VY;
}
