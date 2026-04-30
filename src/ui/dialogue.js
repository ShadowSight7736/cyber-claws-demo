import { toScreen, inView } from '../game/camera.js';

const TALK_DIST = 100;   // px — how close Nimbus must be

// ── Whiskers update ───────────────────────────────────────────────────────────

export function updateWhiskers(whiskers, player) {
  const near = Math.abs(player.x - whiskers.x) < TALK_DIST &&
               Math.abs(player.y - whiskers.y) < 80;
  whiskers.near = near;

  if (near) {
    whiskers.lineTimer++;
    if (whiskers.lineTimer >= whiskers.lineDuration) {
      whiskers.lineTimer = 0;
      whiskers.lineIndex = (whiskers.lineIndex + 1) % whiskers.lines.length;
    }
  }
}

// ── Whiskers drawing ──────────────────────────────────────────────────────────

export function drawWhiskers(ctx, whiskers, cam) {
  if (!inView(cam, whiskers.x, whiskers.y, whiskers.w, whiskers.h)) return;
  const { sx, sy } = toScreen(cam, whiskers.x, whiskers.y);
  const { w, h } = whiskers;
  const cx = sx + w / 2;

  // Body
  ctx.fillStyle = '#92400e';
  _rr(ctx, sx, sy + 8, w, h - 8, 4);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  _rr(ctx, sx, sy + 8, w, h - 8, 4);
  ctx.stroke();

  // Stripe
  ctx.fillStyle = '#b45309';
  ctx.fillRect(sx + 8, sy + 10, 4, h - 18);
  ctx.fillRect(sx + w - 12, sy + 10, 4, h - 18);

  // Head
  ctx.fillStyle = '#a16207';
  _rr(ctx, sx + 2, sy - 4, w - 4, 14, 4);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  _rr(ctx, sx + 2, sy - 4, w - 4, 14, 4);
  ctx.stroke();

  // Ears
  ctx.fillStyle = '#92400e';
  _tri(ctx, sx + 3, sy - 4, sx + 2, sy - 16, sx + 12, sy - 4);
  _tri(ctx, sx + w - 3, sy - 4, sx + w - 2, sy - 16, sx + w - 12, sy - 4);

  // Eyes
  ctx.fillStyle = '#fde68a';
  ctx.beginPath(); ctx.arc(sx + 9,  sy + 3, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + w - 9, sy + 3, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.beginPath(); ctx.ellipse(sx + 9,  sy + 3, 1.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx + w - 9, sy + 3, 1.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(253,230,138,0.6)';
  ctx.lineWidth = 0.8;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx + w - 4, sy + 4); ctx.lineTo(sx + w + 10, sy + 4 + d * 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 4, sy + 4); ctx.lineTo(sx - 10, sy + 4 + d * 3); ctx.stroke();
  }

  // Name tag
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.fillText('WHISKERS', cx, sy - 18);

  // Dialogue bubble
  if (whiskers.near) {
    const line = whiskers.lines[whiskers.lineIndex];
    ctx.font = '10px monospace';
    const tw = ctx.measureText(line).width;
    const pad = 9;
    const bw = tw + pad * 2;
    const bh = 22;
    const bx = cx - bw / 2;
    const by = sy - 52;

    // Bubble body
    ctx.fillStyle = 'rgba(8,4,28,0.9)';
    _rr(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    _rr(ctx, bx, by, bw, bh, 5);
    ctx.stroke();

    // Bubble tail
    ctx.fillStyle = 'rgba(8,4,28,0.9)';
    ctx.beginPath();
    ctx.moveTo(cx - 5, by + bh);
    ctx.lineTo(cx + 5, by + bh);
    ctx.lineTo(cx, by + bh + 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fde68a';
    ctx.fillText(line, cx, by + 14);
  }

  ctx.textAlign = 'left';
}

// ── Story notification at screen centre (shard collected etc.) ────────────────

export function drawStoryBeat(ctx, text, alpha, viewW, viewH) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, viewH * 0.55, viewW, 55);
  ctx.font = 'italic 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(text, viewW / 2, viewH * 0.55 + 32);
  ctx.restore();
  ctx.textAlign = 'left';
}

// ── Zone title card (plays briefly on zone entry) ────────────────────────────

export function drawZoneTitle(ctx, zone, alpha, viewW) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.textAlign = 'right';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#4c1d95';
  ctx.fillText(zone.sector, viewW - 16, 62);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText(zone.name, viewW - 16, 78);
  ctx.restore();
  ctx.textAlign = 'left';
}

// ── Private ───────────────────────────────────────────────────────────────────
function _rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function _tri(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
}
