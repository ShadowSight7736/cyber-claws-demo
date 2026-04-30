import { aabb } from '../game/collision.js';
import { toScreen, inView } from '../game/camera.js';

const ABILITY_NAMES = { 1: 'DOUBLE JUMP', 2: 'CLAW ATTACK', 3: 'CYBER DASH' };

// Returns the id of the shard just collected, or null
export function updateShards(shards, player) {
  for (const s of shards) {
    if (s.collected) continue;
    s.t += 0.035;
    if (aabb(player, s)) {
      s.collected = true;
      player.shards++;
      return s.id;
    }
  }
  return null;
}

// Returns true if player passed through a checkpoint
export function updateCheckpoints(checkpoints, player, currentIdx) {
  for (let i = currentIdx + 1; i < checkpoints.length; i++) {
    if (player.x >= checkpoints[i].x) return i;
  }
  return currentIdx;
}

// ── Drawing ───────────────────────────────────────────────────────────────────

export function drawShards(ctx, shards, cam, tick) {
  for (const s of shards) {
    if (s.collected) continue;
    if (!inView(cam, s.x, s.y - 20, s.w, s.h + 20)) continue;

    const { sx, sy: ssy } = toScreen(cam, s.x, s.y);
    const hover = Math.sin(s.t * 2) * 5;        // float up-down
    const cy    = ssy + s.h / 2 + hover;
    const cx    = sx + s.w / 2;
    const r     = s.w / 2;
    const pulse = 0.55 + 0.45 * Math.sin(s.t * 3);

    // Outer glow halo
    ctx.save();
    ctx.globalAlpha = 0.22 * pulse;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
    grad.addColorStop(0, '#00ffcc');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Rotating ring of sparks
    ctx.strokeStyle = `rgba(0,255,180,${0.25 * pulse})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = s.t + i * (Math.PI / 3);
      const ri = r + 3, ro = r + 10;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * ri, cy + Math.sin(angle) * ri);
      ctx.lineTo(cx + Math.cos(angle) * ro, cy + Math.sin(angle) * ro);
      ctx.stroke();
    }

    // Main diamond body
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 14 * pulse;
    ctx.fillStyle = `rgba(0,255,200,${0.85 * pulse})`;
    _diamond(ctx, cx, cy, r);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = `rgba(255,255,255,${0.6 * pulse})`;
    _diamond(ctx, cx, cy, r * 0.4);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    _diamond(ctx, cx, cy, r);
    ctx.stroke();

    // Shard number badge
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${s.id}`, cx, cy + 3);

    // Floating label
    ctx.font = '9px monospace';
    ctx.fillStyle = `rgba(0,255,200,${0.7 * pulse})`;
    ctx.fillText(`CORE SHARD`, cx, cy - r - 10);
    ctx.fillStyle = `rgba(180,255,240,${0.5 * pulse})`;
    ctx.fillText(ABILITY_NAMES[s.id] || '', cx, cy - r - 20);
    ctx.textAlign = 'left';

    // Ground shadow
    ctx.fillStyle = `rgba(0,255,180,0.12)`;
    ctx.beginPath();
    ctx.ellipse(cx, ssy + s.h + 4, r * (1.2 + hover / 10), 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw zone-sign decorations (atmospheric text at ground level)
export function drawZoneSigns(ctx, signs, cam) {
  for (const sign of signs) {
    if (!inView(cam, sign.x - 10, sign.y - 20, 220, 30)) continue;
    const { sx, sy } = toScreen(cam, sign.x, sign.y);
    ctx.font = '9px monospace';
    ctx.fillStyle = sign.color + '44'; // very dim
    ctx.fillText('▶ ' + sign.label, sx, sy);
  }
}

// ── Private ───────────────────────────────────────────────────────────────────
function _diamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
}
