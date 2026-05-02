import { aabb } from '../game/collision.js';
import { toScreen, inView } from '../game/camera.js';

// ── Shards — each level has exactly one ──────────────────────────────────────
// Ability assignment is sequential on collection (first unclaimed → dash only
// because double-jump + attack are auto).

export function updateShards(shards, player) {
  for (const s of shards) {
    if (s.collected) continue;
    s.t += 0.035;
    if (aabb(player, s)) {
      s.collected = true;
      player.shards++;
      return s.id;   // return shard id to caller for notification
    }
  }
  return null;
}

// ── Health packs ──────────────────────────────────────────────────────────────

export function updateHealthPacks(packs, player) {
  for (const p of packs) {
    if (p.collected) continue;
    p.t = (p.t || 0) + 0.04;
    if (aabb(player, p)) {
      p.collected = true;
      player.health = Math.min(player.health + 2, player.maxHealth);
      return true;
    }
  }
  return false;
}

// ── Attack boosts ─────────────────────────────────────────────────────────────

export function updateAttackBoosts(boosts, player) {
  for (const b of boosts) {
    if (b.collected) continue;
    b.t = (b.t || 0) + 0.04;
    if (aabb(player, b)) {
      b.collected = true;
      player.attackDamage = Math.min(player.attackDamage + 1, 7);
      return true;
    }
  }
  return false;
}

// ── Checkpoint trigger ────────────────────────────────────────────────────────
// Returns new active index if advanced, else same index.
export function updateCheckpoints(checkpoints, player, currentIdx) {
  for (let i = currentIdx + 1; i < checkpoints.length; i++) {
    const c = checkpoints[i];
    // Activate only when player is on ground near the trigger box
    if (player.onGround &&
        player.x + player.w > c.x && player.x < c.x + (c.w || 60) &&
        player.y + player.h > c.y && player.y < c.y + (c.h || 80)) {
      return i;
    }
  }
  return currentIdx;
}

// ── Level exit trigger ────────────────────────────────────────────────────────

export function checkLevelExit(exit, player) {
  if (!exit) return false;
  return aabb(player, exit);
}

// ── Drawing ───────────────────────────────────────────────────────────────────

export function drawShards(ctx, shards, cam) {
  for (const s of shards) {
    if (s.collected) continue;
    if (!inView(cam, s.x, s.y - 20, s.w, s.h + 20)) continue;

    const { sx, sy: ssy } = toScreen(cam, s.x, s.y);
    const hover = Math.sin(s.t * 2) * 5;
    const cy = ssy + s.h / 2 + hover;
    const cx = sx + s.w / 2;
    const r  = s.w / 2;
    const pulse = 0.55 + 0.45 * Math.sin(s.t * 3);

    ctx.save();
    ctx.globalAlpha = 0.2 * pulse;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
    grad.addColorStop(0, '#00ffcc'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 14 * pulse;
    ctx.fillStyle = `rgba(0,255,200,${0.85 * pulse})`;
    _diamond(ctx, cx, cy, r); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.55 * pulse})`;
    _diamond(ctx, cx, cy, r * 0.4); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    _diamond(ctx, cx, cy, r); ctx.stroke();

    ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${s.id}`, cx, cy + 3);
    ctx.fillStyle = `rgba(0,255,200,${0.65 * pulse})`; ctx.font = '8px monospace';
    ctx.fillText('CORE SHARD', cx, cy - r - 8);
    ctx.textAlign = 'left';
  }
}

export function drawHealthPacks(ctx, packs, cam) {
  for (const p of packs) {
    if (p.collected) continue;
    if (!inView(cam, p.x, p.y, p.w, p.h)) continue;
    const { sx, sy } = toScreen(cam, p.x, p.y);
    const t = p.t || 0;
    const bob = Math.sin(t * 2.5) * 4;

    ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(sx, sy + bob, p.w, p.h);
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.5;
    ctx.strokeRect(sx, sy + bob, p.w, p.h);
    ctx.shadowBlur = 0;

    // Cross symbol
    ctx.fillStyle = '#bbf7d0'; ctx.lineWidth = 2;
    const cx = sx + p.w/2, cy = sy + p.h/2 + bob;
    ctx.fillRect(cx - 1.5, cy - 5, 3, 10);
    ctx.fillRect(cx - 5, cy - 1.5, 10, 3);

    ctx.fillStyle = '#4ade80'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('HP+2', cx, sy + bob - 4);
    ctx.textAlign = 'left';
  }
}

export function drawAttackBoosts(ctx, boosts, cam) {
  for (const b of boosts) {
    if (b.collected) continue;
    if (!inView(cam, b.x, b.y, b.w, b.h)) continue;
    const { sx, sy } = toScreen(cam, b.x, b.y);
    const t = b.t || 0;
    const bob = Math.sin(t * 2.5) * 4;
    const cx = sx + b.w/2, cy = sy + b.h/2 + bob;

    ctx.shadowColor = '#f97316'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ea580c';
    _diamond(ctx, cx, cy, b.w / 2); ctx.fill();
    ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 1.5;
    _diamond(ctx, cx, cy, b.w / 2); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('⚡', cx, cy + 3);
    ctx.fillStyle = '#fb923c'; ctx.font = '8px monospace';
    ctx.fillText('ATK+1', cx, sy + bob - 4);
    ctx.textAlign = 'left';
  }
}

export function drawLevelBackExit(ctx, exit, cam, tick) {
  if (!exit) return;
  if (!inView(cam, exit.x, exit.y, exit.w, exit.h)) return;
  const { sx, sy } = toScreen(cam, exit.x, exit.y);
  const pulse = 0.6 + 0.4 * Math.sin(tick * 0.06);
  ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 20 * pulse;
  ctx.fillStyle = `rgba(245,158,11,${0.4 * pulse})`;
  ctx.fillRect(sx, sy, exit.w, exit.h);
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, exit.w, exit.h);
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(254,243,199,${0.8 * pulse})`;
  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('BACK', sx + exit.w / 2, sy + exit.h / 2 + 4);
  ctx.textAlign = 'left';
}

export function drawLevelExit(ctx, exit, cam, tick) {
  if (!exit) return;
  if (!inView(cam, exit.x, exit.y, exit.w, exit.h)) return;
  const { sx, sy } = toScreen(cam, exit.x, exit.y);
  const pulse = 0.6 + 0.4 * Math.sin(tick * 0.06);

  ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 20 * pulse;
  ctx.fillStyle = `rgba(99,102,241,${0.4 * pulse})`;
  ctx.fillRect(sx, sy, exit.w, exit.h);
  ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, exit.w, exit.h);
  ctx.shadowBlur = 0;

  ctx.fillStyle = `rgba(199,210,254,${0.8 * pulse})`;
  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('EXIT', sx + exit.w / 2, sy + exit.h / 2 + 4);
  ctx.textAlign = 'left';
}

// ── Private ────────────────────────────────────────────────────────────────────
function _diamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy-r); ctx.lineTo(cx+r, cy); ctx.lineTo(cx, cy+r); ctx.lineTo(cx-r, cy);
  ctx.closePath();
}
