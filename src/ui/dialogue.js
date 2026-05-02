import { toScreen, inView } from '../game/camera.js';
import { GRAVITY } from '../game/physics.js';

const TALK_DIST_X = 110;
const TALK_DIST_Y = 80;
const NPC_SPEED   = 1.2;
const NPC_JUMP    = -9.0;

// ── Generic NPC update ────────────────────────────────────────────────────────

export function updateNPC(npc, player, platforms) {
  const near = Math.abs(player.x - npc.x) < TALK_DIST_X &&
               Math.abs(player.y - npc.y) < TALK_DIST_Y;
  npc.near = near;

  // Gravity
  if (npc.vy === undefined) npc.vy = 0;
  npc.vy += GRAVITY;
  if (npc.vy > 10) npc.vy = 10;

  // Horizontal movement
  let vx = 0;
  if (near) {
    // Follow player; stop at comfortable distance
    const dx = (player.x + player.w / 2) - (npc.x + npc.w / 2);
    if (Math.abs(dx) > 45) {
      vx = NPC_SPEED * Math.sign(dx);
      npc.facing = Math.sign(dx);
    }
    // Jump toward player if they're on a higher platform
    if (npc.onGround && player.y < npc.y - 50) {
      npc.vy = npc.jumpVy || NPC_JUMP;
    }
  } else if (npc.combatTarget && npc.combatTarget.alive) {
    // Chase the combat target set by updateNovaCombat
    const tdx = (npc.combatTarget.x + npc.combatTarget.w / 2) - (npc.x + npc.w / 2);
    vx = (npc.speed || NPC_SPEED) * 1.5 * Math.sign(tdx);
    npc.facing = Math.sign(tdx);
    // Try to jump toward target if it's above
    if (npc.onGround && npc.combatTarget.y < npc.y - 40) {
      npc.vy = npc.jumpVy || NPC_JUMP;
    }
  } else if (npc.randomWander) {
    // Random wander: pick a new direction/duration at random
    npc.wanderTimer = (npc.wanderTimer || 0) - 1;
    if (npc.wanderTimer <= 0) {
      const roll = Math.random();
      if (roll < 0.25) {
        npc.wanderDir  = 0;  // short pause
        npc.wanderTimer = 20 + Math.floor(Math.random() * 40);
      } else {
        npc.wanderDir  = Math.random() < 0.5 ? 1 : -1;
        npc.wanderTimer = 80 + Math.floor(Math.random() * 120);
      }
    }
    // Soft boundary: don't drift > 200px from startX
    if (npc.startX !== undefined) {
      const dist = npc.x - npc.startX;
      if (dist >  200 && npc.wanderDir === 1)  npc.wanderDir = -1;
      if (dist < -200 && npc.wanderDir === -1) npc.wanderDir =  1;
    }
    vx = (npc.speed || NPC_SPEED) * (npc.wanderDir || 0);
    if (npc.wanderDir) npc.facing = npc.wanderDir;
    // Occasional small hop while wandering
    npc.jumpTimer = (npc.jumpTimer || 0) + 1;
    if (npc.onGround && npc.jumpTimer > 280) {
      npc.vy = npc.jumpVy || NPC_JUMP;
      npc.jumpTimer = 0;
    }
  } else if (npc.patrolRange) {
    // Fixed bounce patrol (used by Whiskers)
    vx = npc.speed * npc.facing;
    if (npc.x + vx >= npc.startX + npc.patrolRange) {
      npc.x = npc.startX + npc.patrolRange;
      npc.facing = -1; vx = 0;
    } else if (npc.x + vx <= npc.startX - npc.patrolRange) {
      npc.x = npc.startX - npc.patrolRange;
      npc.facing = 1; vx = 0;
    }
    npc.jumpTimer = (npc.jumpTimer || 0) + 1;
    if (npc.onGround && npc.jumpTimer > 160) {
      npc.vy = npc.jumpVy || NPC_JUMP;
      npc.jumpTimer = 0;
    }
  }

  npc.x += vx;
  npc.y += npc.vy;

  // Platform collision (top-only resolve)
  npc.onGround = false;
  for (const p of (platforms || [])) {
    if (!p.solid) continue;
    if (npc.x + npc.w <= p.x || npc.x >= p.x + p.w) continue;
    if (npc.y + npc.h <= p.y || npc.y >= p.y + p.h) continue;
    const ot = (npc.y + npc.h) - p.y;
    if (ot > 0 && ot < 28 && npc.vy >= 0) {
      npc.y = p.y - npc.h;
      npc.vy = 0;
      npc.onGround = true;
    }
  }

  // Dialogue timing
  if (near) {
    npc.lineTimer++;
    if (npc.lineTimer >= npc.lineDuration) {
      npc.lineTimer = 0;
      const next = npc.lineIndex + 1;
      if (next < npc.lines.length) {
        npc.lineIndex = next;
      } else if (npc.done !== undefined) {
        npc.done = true;  // signals game-end for Whiskers in level 3
      }
    }
  }
}

// ── Whiskers (orange cat companion) ──────────────────────────────────────────

export function drawWhiskers(ctx, w, cam) {
  if (!inView(cam, w.x, w.y, w.w, w.h)) return;
  const { sx, sy } = toScreen(cam, w.x, w.y);
  _drawCat(ctx, sx, sy, w.w, w.h, '#92400e', '#f59e0b', '#fbbf24', w.facing ?? 1);

  // Name
  ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center';
  ctx.fillText('WHISKERS', sx + w.w/2, sy - 18);

  if (w.near) _bubble(ctx, sx, sy, w.w, w.h, w.lines[w.lineIndex], '#fbbf24', '#fde68a');
  ctx.textAlign = 'left';
}

// ── Nova (teal cat ally, found in sewers) ────────────────────────────────────

export function drawNova(ctx, n, cam) {
  if (!n || !inView(cam, n.x, n.y, n.w, n.h)) return;
  const { sx, sy } = toScreen(cam, n.x, n.y);
  _drawCat(ctx, sx, sy, n.w, n.h, '#065f46', '#10b981', '#34d399', n.facing ?? -1);

  ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#34d399'; ctx.textAlign = 'center';
  ctx.fillText('NOVA', sx + n.w/2, sy - 18);

  if (n.near) _bubble(ctx, sx, sy, n.w, n.h, n.lines[n.lineIndex], '#34d399', '#a7f3d0');
  ctx.textAlign = 'left';
}

// ── Zone title card ────────────────────────────────────────────────────────────

export function drawZoneTitle(ctx, zone, alpha, viewW) {
  if (!zone || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, alpha);
  ctx.textAlign = 'right';
  ctx.font = 'bold 11px monospace'; ctx.fillStyle = '#4c1d95';
  ctx.fillText(zone.sector, viewW - 16, 60);
  ctx.font = '14px monospace'; ctx.fillStyle = '#7c3aed';
  ctx.fillText(zone.name,   viewW - 16, 76);
  ctx.restore(); ctx.textAlign = 'left';
}

// ── Story beat strip ───────────────────────────────────────────────────────────

export function drawStoryBeat(ctx, text, alpha, viewW, viewH) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, viewH * 0.56, viewW, 50);
  ctx.font = 'italic 12px monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(text, viewW/2, viewH * 0.56 + 30);
  ctx.restore(); ctx.textAlign = 'left';
}

// ── Private ────────────────────────────────────────────────────────────────────

function _drawCat(ctx, sx, sy, w, h, body, mid, edge, facing) {
  ctx.save();
  ctx.translate(sx + w/2, sy + h/2);
  ctx.scale(facing, 1);

  // Body
  ctx.fillStyle = body; _rr(ctx, -w/2, -h/2+8, w, h-8, 4); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 1.5; _rr(ctx, -w/2, -h/2+8, w, h-8, 4); ctx.stroke();
  ctx.fillStyle = mid; ctx.fillRect(-3, -h/2+10, 6, h-22);

  // Head
  ctx.fillStyle = mid; _rr(ctx, -w/2+2, -h/2-6, w-4, 14, 3); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 1; _rr(ctx, -w/2+2, -h/2-6, w-4, 14, 3); ctx.stroke();

  // Ears
  ctx.fillStyle = body;
  _tri(ctx, -w/2+3,-h/2-6, -w/2+2,-h/2-16, -w/2+11,-h/2-6);
  _tri(ctx,  w/2-3,-h/2-6,  w/2-2,-h/2-16,  w/2-11,-h/2-6);

  // Eyes
  ctx.fillStyle = '#fde68a';
  ctx.beginPath(); ctx.arc(-7,-h/2-1, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 7,-h/2-1, 2.5, 0, Math.PI*2); ctx.fill();

  // Legs
  ctx.fillStyle = body;
  ctx.fillRect(-w/2+3, h/2-8, 8, 8); ctx.fillRect(w/2-11, h/2-8, 8, 8);

  ctx.restore();
}

function _bubble(ctx, sx, sy, w, h, text, borderColor, textColor) {
  ctx.font = '10px monospace';
  const tw = ctx.measureText(text).width;
  const pad = 9, bw = tw + pad*2, bh = 22;
  const bx = sx + w/2 - bw/2, by = sy - 54;

  ctx.fillStyle = 'rgba(6,2,20,0.92)'; _rr(ctx, bx, by, bw, bh, 5); ctx.fill();
  ctx.strokeStyle = borderColor; ctx.lineWidth = 1; _rr(ctx, bx, by, bw, bh, 5); ctx.stroke();
  // Tail
  ctx.fillStyle = 'rgba(6,2,20,0.92)';
  ctx.beginPath(); ctx.moveTo(sx+w/2-5, by+bh); ctx.lineTo(sx+w/2+5, by+bh); ctx.lineTo(sx+w/2, by+bh+8); ctx.closePath(); ctx.fill();

  ctx.fillStyle = textColor; ctx.textAlign = 'center';
  ctx.fillText(text, sx + w/2, by + 14);
}

function _rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function _tri(ctx,x1,y1,x2,y2,x3,y3){
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill();
}
