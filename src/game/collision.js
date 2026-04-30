export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Resolves entity against solid platforms. Updates onGround.
// Call AFTER applying velocity (entity.x += entity.vx, etc.).
export function resolvePlatforms(entity, platforms) {
  entity.onGround = false;

  for (const p of platforms) {
    if (!p.solid) continue;
    if (!aabb(entity, p)) continue;

    const ol = (entity.x + entity.w) - p.x;       // overlap left
    const or_ = (p.x + p.w) - entity.x;            // overlap right
    const ot = (entity.y + entity.h) - p.y;        // overlap top
    const ob = (p.y + p.h) - entity.y;             // overlap bottom

    // Resolve on the axis of minimum penetration
    if (Math.min(ot, ob) < Math.min(ol, or_)) {
      if (ot < ob && entity.vy >= 0) {
        entity.y  = p.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      } else if (entity.vy < 0) {
        entity.y  = p.y + p.h;
        entity.vy = 0;
      }
    } else {
      if (ol < or_) {
        entity.x  = p.x - entity.w;
        if (entity.vx > 0) entity.vx = 0;
      } else {
        entity.x  = p.x + p.w;
        if (entity.vx < 0) entity.vx = 0;
      }
    }
  }
}
