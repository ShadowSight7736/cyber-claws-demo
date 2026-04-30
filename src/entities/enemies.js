import { GRAVITY, TERMINAL_VY } from '../game/physics.js';
import { resolvePlatforms, aabb } from '../game/collision.js';
import { toScreen, inView } from '../game/camera.js';

// ── Update ────────────────────────────────────────────────────────────────────

export function updateEnemies(enemies, platforms, worldW) {
  for (const e of enemies) {
    if (!e.alive) continue;

    e.t += 0.06;

    // Patrol
    e.x += e.vx * e.dir;
    if (Math.abs(e.x - e.startX) >= e.patrol) e.dir *= -1;

    // Gravity
    e.vy += GRAVITY;
    if (e.vy > TERMINAL_VY) e.vy = TERMINAL_VY;
    e.y += e.vy;

    // Platform collision (simplified top-only for drones)
    e.onGround = false;
    for (const p of platforms) {
      if (!p.solid || !aabb(e, p)) continue;
      const overlapTop = (e.y + e.h) - p.y;
      if (overlapTop > 0 && overlapTop < 22 && e.vy >= 0) {
        e.y = p.y - e.h;
        e.vy = 0;
        e.onGround = true;
      }
    }

    // Wall bounce
    if (e.x < 0 || e.x + e.w > worldW) e.dir *= -1;

    // Flash timer
    if (e.flashTimer > 0) e.flashTimer--;
  }
}

// Returns true if player was hit (and sets invincible timer externally)
export function checkEnemyPlayerContact(enemies, player) {
  if (player.invincibleTimer > 0 || player.isDashing) return false;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (aabb(player, e)) return true;
  }
  return false;
}

// Check attack hitbox vs enemies; returns count of enemies killed
export function checkAttackVsEnemies(hitbox, enemies) {
  if (!hitbox) return 0;
  let killed = 0;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (aabb(hitbox, e)) {
      e.hp--;
      e.flashTimer = 14;
      if (e.hp <= 0) { e.alive = false; killed++; }
    }
  }
  return killed;
}

// ── Drawing ───────────────────────────────────────────────────────────────────

const DRONE_COLORS = { body: '#991b1b', edge: '#ef4444', eye: '#fbbf24', spark: '#ff6600' };

export function drawEnemies(ctx, enemies, cam, tick) {
  for (const e of enemies) {
    if (!e.alive) continue;
    if (!inView(cam, e.x, e.y, e.w, e.h)) continue;

    const { sx, sy } = toScreen(cam, e.x, e.y);
    const cx = sx + e.w / 2;
    const cy = sy + e.h / 2;
    const flash = e.flashTimer > 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(e.dir, 1);

    // Body hexagon
    ctx.shadowColor = flash ? '#ff8800' : DRONE_COLORS.edge;
    ctx.shadowBlur = flash ? 18 : 8;
    ctx.fillStyle = flash ? '#ff7700' : DRONE_COLORS.body;
    _hexagon(ctx, 0, 0, e.w / 2 + 1);
    ctx.fill();

    ctx.strokeStyle = flash ? '#ffaa00' : DRONE_COLORS.edge;
    ctx.lineWidth = 2;
    _hexagon(ctx, 0, 0, e.w / 2 + 1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner ring
    ctx.strokeStyle = 'rgba(255,80,0,0.4)';
    ctx.lineWidth = 1;
    _hexagon(ctx, 0, 0, e.w / 2 - 4);
    ctx.stroke();

    // Eye
    ctx.fillStyle = DRONE_COLORS.eye;
    ctx.beginPath(); ctx.ellipse(4, 0, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(5, 0, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    // Eye glow
    ctx.fillStyle = 'rgba(250,204,20,0.4)';
    ctx.beginPath(); ctx.arc(4, 0, 7, 0, Math.PI * 2); ctx.fill();

    // Rotating spark arms
    ctx.strokeStyle = DRONE_COLORS.spark;
    ctx.lineWidth = 1.2;
    const numArms = 4;
    for (let i = 0; i < numArms; i++) {
      const angle = e.t + (i / numArms) * Math.PI * 2;
      const r1 = e.w / 2 + 2;
      const r2 = r1 + 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
      ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
      ctx.stroke();
    }

    ctx.restore();

    // HP bar (only when damaged)
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(sx, sy - 8, e.w, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(sx, sy - 8, e.w * (e.hp / e.maxHp), 4);
    }

    // Death particles live in the enemy as a flash; real particles omitted for perf
  }
}

// ── Private ───────────────────────────────────────────────────────────────────
function _hexagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else         ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}
