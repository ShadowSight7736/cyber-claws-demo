import { GRAVITY, TERMINAL_VY } from '../game/physics.js';
import { aabb } from '../game/collision.js';
import { toScreen, inView } from '../game/camera.js';
import { INVINCIBLE_FRAMES } from './player.js';

const ALERT_COOLDOWN = 100;  // frames of chase after losing sight

export function createEnemy(x, y, opts = {}) {
  return {
    x, y,
    w: opts.w || 24, h: opts.h || 26,
    vx: opts.speed || 1.2,
    vy: 0,
    onGround: false,
    hp: opts.hp || 3,
    maxHp: opts.hp || 3,
    alive: true,
    flashTimer: 0,
    startX: x,
    patrol: opts.patrol || 80,
    dir: 1,
    speed: opts.speed || 1.2,
    alertSpeed: (opts.speed || 1.2) * 2.2,
    sightRange: opts.sightRange || 180,
    sightHeight: opts.sightHeight || 70,
    alerted: false,
    alertCooldown: 0,
    t: Math.random() * Math.PI * 2,
    // visual tweaks
    color: opts.color || '#334155',  // steel-blue base
    eyeColor: opts.eyeColor || '#22d3ee',
  };
}

// ── Update ─────────────────────────────────────────────────────────────────

export function updateEnemies(enemies, platforms, player, worldW) {
  for (const e of enemies) {
    if (!e.alive) continue;
    e.t += 0.06;

    // ── Sight check ──────────────────────────────────────────────
    const dx = player.x + player.w / 2 - (e.x + e.w / 2);
    const dy = player.y + player.h / 2 - (e.y + e.h / 2);
    const inSight = Math.abs(dx) <= e.sightRange && Math.abs(dy) <= e.sightHeight;

    if (inSight && player.invincibleTimer < INVINCIBLE_FRAMES - 10) {
      e.alerted       = true;
      e.alertCooldown = ALERT_COOLDOWN;
    } else if (e.alertCooldown > 0) {
      e.alertCooldown--;
      if (e.alertCooldown === 0) e.alerted = false;
    }

    // ── Horizontal movement ───────────────────────────────────────
    if (e.alerted) {
      // Chase: move toward player
      e.dir = dx >= 0 ? 1 : -1;
      e.vx  = e.alertSpeed * e.dir;
    } else {
      // Patrol
      e.vx = e.speed * e.dir;
      if (Math.abs(e.x - e.startX) >= e.patrol) e.dir *= -1;
    }

    // ── Gravity ───────────────────────────────────────────────────
    e.vy += GRAVITY;
    if (e.vy > TERMINAL_VY) e.vy = TERMINAL_VY;
    e.y += e.vy;

    // Platform collision (top-only for enemies)
    e.onGround = false;
    for (const p of platforms) {
      if (!p.solid) continue;
      if (!aabb(e, p)) continue;
      const ot = (e.y + e.h) - p.y;
      if (ot > 0 && ot < 22 && e.vy >= 0) {
        e.y = p.y - e.h;
        e.vy = 0;
        e.onGround = true;
      }
    }

    e.x += e.vx;
    if (e.x < 0 || e.x + e.w > worldW) { e.dir *= -1; e.x = Math.max(0, Math.min(e.x, worldW - e.w)); }
    if (e.flashTimer > 0) e.flashTimer--;
  }
}

export function checkEnemyPlayerContact(enemies, player) {
  if (player.invincibleTimer > 0) return false;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (aabb(player, e)) return true;
  }
  return false;
}

export function checkAttackVsEnemies(hitbox, enemies, damage) {
  if (!hitbox) return 0;
  let killed = 0;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (aabb(hitbox, e)) {
      e.hp -= damage;
      e.flashTimer = 14;
      if (e.hp <= 0) { e.alive = false; killed++; }
    }
  }
  return killed;
}

// ── Nova vs enemy combat ───────────────────────────────────────────────────
// Nova detects enemies in a generous radius, sets combatTarget so updateNPC
// can chase them.  She then deals 0.1 damage every 30 frames within strike
// range.  She cannot be hurt.  Generous dy so she can target elevated bots.
export function updateNovaCombat(nova, enemies) {
  if (!nova) return;

  // Find closest enemy within detection range
  let closest = null, closestDist = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = Math.abs((nova.x + nova.w / 2) - (e.x + e.w / 2));
    const dy = Math.abs((nova.y + nova.h / 2) - (e.y + e.h / 2));
    if (dx < 280 && dy < 380) {
      const d = dx + dy * 0.4; // weight horizontal distance more
      if (d < closestDist) { closestDist = d; closest = e; }
    }
  }
  nova.combatTarget = closest;
  if (closest) {
    closest.alerted = true;
    closest.alertCooldown = Math.max(closest.alertCooldown, 90);
  }

  // Strike: 0.1 damage every 30 frames to any enemy in strike range
  nova.attackTimer = (nova.attackTimer || 0) + 1;
  if (nova.attackTimer >= 30) {
    nova.attackTimer = 0;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = Math.abs((nova.x + nova.w / 2) - (e.x + e.w / 2));
      const dy = Math.abs((nova.y + nova.h / 2) - (e.y + e.h / 2));
      if (dx < 150 && dy < 380) {  // generous dy: reaches elevated tunnel bots
        e.hp -= 0.1;
        e.flashTimer = 6;
        if (e.hp <= 0) { e.hp = 0; e.alive = false; }
      }
    }
  }
}

// ── Drawing — small boxy robot ─────────────────────────────────────────────

export function drawEnemies(ctx, enemies, cam) {
  for (const e of enemies) {
    if (!e.alive) continue;
    if (!inView(cam, e.x, e.y, e.w, e.h)) continue;

    const { sx, sy } = toScreen(cam, e.x, e.y);
    const flash  = e.flashTimer > 0;
    const alerted = e.alerted;

    ctx.save();
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    ctx.scale(e.dir, 1);

    const bw = e.w, bh = e.h;
    const bodyColor = flash ? '#ff6600' : (alerted ? '#7f1d1d' : e.color);
    const edgeColor = flash ? '#ffaa00' : (alerted ? '#ef4444' : '#64748b');

    // ── Treads / feet ─────────────────────────────────────────
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-bw/2,     bh/2 - 4, bw/2 - 1, 5);
    ctx.fillRect(1,         bh/2 - 4, bw/2 - 1, 5);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
    ctx.strokeRect(-bw/2,   bh/2 - 4, bw/2 - 1, 5);
    ctx.strokeRect(1,       bh/2 - 4, bw/2 - 1, 5);

    // ── Body ─────────────────────────────────────────────────
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-bw/2, -bh/2 + 6, bw, bh - 9);
    ctx.strokeStyle = edgeColor; ctx.lineWidth = 1.5;
    ctx.strokeRect(-bw/2, -bh/2 + 6, bw, bh - 9);
    // Vent lines
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const gy = -bh/2 + 10 + i * 5;
      ctx.beginPath(); ctx.moveTo(-bw/2+3, gy); ctx.lineTo(bw/2-3, gy); ctx.stroke();
    }

    // ── Head ─────────────────────────────────────────────────
    ctx.fillStyle = alerted ? '#450a0a' : '#1e293b';
    ctx.fillRect(-bw/2 + 3, -bh/2 - 8, bw - 6, 16);
    ctx.strokeStyle = edgeColor; ctx.lineWidth = 1.5;
    ctx.strokeRect(-bw/2 + 3, -bh/2 - 8, bw - 6, 16);

    // ── Antenna ───────────────────────────────────────────────
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -bh/2 - 8); ctx.lineTo(0, -bh/2 - 16); ctx.stroke();
    // Alert LED on antenna
    ctx.shadowColor = alerted ? '#ef4444' : '#22d3ee';
    ctx.shadowBlur  = alerted ? 8 : 4;
    ctx.fillStyle   = alerted ? '#ef4444' : e.eyeColor;
    ctx.beginPath(); ctx.arc(0, -bh/2 - 16, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur  = 0;

    // ── Sensor eye ────────────────────────────────────────────
    const eyeC = alerted ? '#ff4444' : e.eyeColor;
    ctx.shadowColor = eyeC; ctx.shadowBlur = 8;
    ctx.fillStyle   = eyeC;
    ctx.beginPath(); ctx.ellipse(3, -bh/2, 4, 3, 0, 0, Math.PI*2); ctx.fill();
    // Scan line in eye
    const scanProg = ((e.t * 30) % 6) - 3;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#000a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-1, -bh/2 + scanProg); ctx.lineTo(7, -bh/2 + scanProg); ctx.stroke();

    // ── Alert indicator ───────────────────────────────────────
    if (alerted) {
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -bh/2 - 20);
      ctx.shadowBlur = 0; ctx.textAlign = 'left';
    }

    ctx.restore();

    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(sx, sy - 8, e.w, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx, sy - 8, e.w * (e.hp / e.maxHp), 4);
      ctx.strokeStyle = '#374151'; ctx.lineWidth = 0.5;
      ctx.strokeRect(sx, sy - 8, e.w, 4);
    }
  }
}
