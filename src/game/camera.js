const LERP_X = 0.10;
const LERP_Y = 0.08;

// Horizontal look-ahead so player can see ahead of themselves
const LOOK_AHEAD = 80;

export function createCamera(viewW, viewH, worldW, worldH) {
  return { x: 0, y: 0, viewW, viewH, worldW, worldH };
}

export function updateCamera(cam, player) {
  const ahead  = player.facing * LOOK_AHEAD;
  const targetX = player.x + player.w / 2 + ahead - cam.viewW / 2;
  // Keep player at ~42% from top — good view of what's above
  const targetY = player.y + player.h / 2 - cam.viewH * 0.42;

  cam.x += (targetX - cam.x) * LERP_X;
  cam.y += (targetY - cam.y) * LERP_Y;

  cam.x = Math.max(0, Math.min(cam.x, cam.worldW - cam.viewW));
  cam.y = Math.max(0, Math.min(cam.y, cam.worldH - cam.viewH));
}

// Convenience: convert a world rect to screen coords for drawing
export function toScreen(cam, wx, wy) {
  return { sx: wx - cam.x, sy: wy - cam.y };
}

export function inView(cam, wx, wy, ww, wh) {
  return wx + ww > cam.x - 32 &&
         wx      < cam.x + cam.viewW + 32 &&
         wy + wh > cam.y - 32 &&
         wy      < cam.y + cam.viewH + 32;
}
