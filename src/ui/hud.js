// HUD, screens, and overlay rendering
import { SHIELD_COOLDOWN } from '../game/physics.js';

export function drawHUD(ctx, player, viewW, levelNum) {
  const ab = player.abilities;

  // ── Health ──────────────────────────────────────────────────────
  _panel(ctx, 12, 12, 148, 36);
  ctx.font = '10px monospace'; ctx.fillStyle = '#9d74e0';
  ctx.fillText('HP', 22, 33);
  for (let i = 0; i < player.maxHealth; i++) {
    const filled = i < player.health;
    ctx.shadowColor = filled ? '#f43f5e' : 'transparent'; ctx.shadowBlur = filled ? 7 : 0;
    ctx.fillStyle   = filled ? '#f43f5e' : '#2d1a2e';
    ctx.beginPath(); ctx.arc(52 + i * 18, 30, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = filled ? '#fda4af' : '#4a2d4e'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.shadowBlur  = 0;
  }

  // ── Attack damage ────────────────────────────────────────────────
  _panel(ctx, 12, 55, 148, 26);
  ctx.font = '10px monospace'; ctx.fillStyle = '#fb923c';
  ctx.fillText(`ATK  ${player.attackDamage} / 7`, 22, 72);
  // Mini progress bar
  ctx.fillStyle = '#431407'; ctx.fillRect(90, 61, 60, 6);
  ctx.fillStyle = '#f97316'; ctx.fillRect(90, 61, Math.round(60 * player.attackDamage / 7), 6);

  // ── Shards ────────────────────────────────────────────────────────
  _panel(ctx, 12, 88, 148, 26);
  ctx.font = '10px monospace'; ctx.fillStyle = '#00ffcc';
  ctx.fillText(`SHARDS  ${player.shards} / 4`, 22, 105);
  for (let i = 0; i < 4; i++) {
    const have = player.shards > i;
    ctx.shadowColor = have ? '#00ffcc' : 'transparent'; ctx.shadowBlur = have ? 5 : 0;
    ctx.fillStyle   = have ? '#00ffcc' : '#0d2e2a';
    _diamond(ctx, 112 + i * 16, 101, 5); ctx.fill(); ctx.shadowBlur = 0;
  }

  // ── Abilities ────────────────────────────────────────────────────
  _panel(ctx, 12, 122, 210, 130);
  ctx.font = '10px monospace';
  _arow(ctx, 22, 138, true,       '[A/D]  Move',       '#443355');
  _arow(ctx, 22, 153, true,       '[W/SPC] Jump');
  _arow(ctx, 22, 168, ab.attack,  '[NUM1] Claw Attack');
  _arow(ctx, 22, 183, ab.dash,    '[SHF]  Cyber Dash');
  _arow(ctx, 22, 198, ab.hover,   '[W/SPC] Hover');
  _arow(ctx, 22, 213, ab.ranged,  '[NUM3] Ranged Shot');
  // Shield row with cooldown bar
  _arow(ctx, 22, 228, ab.shield,  '[NUM2]  Shield');
  if (ab.shield) {
    if (player.isShielded) {
      ctx.fillStyle = '#00ffcc'; ctx.font = '8px monospace';
      ctx.fillText('ACTIVE', 155, 228);
    } else if (player.shieldCooldown > 0) {
      const pct = 1 - player.shieldCooldown / SHIELD_COOLDOWN;
      ctx.fillStyle = '#1e0a4e'; ctx.fillRect(22, 231, 80, 3);
      ctx.fillStyle = '#c084fc'; ctx.fillRect(22, 231, Math.round(80 * pct), 3);
    }
  }

  // ── Chapter/level tag (top-right) ────────────────────────────────
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px monospace'; ctx.fillStyle = '#7c3aed';
  ctx.fillText('CYBER CLAWS', viewW - 14, 26);
  ctx.font = '10px monospace'; ctx.fillStyle = '#3b1764';
  ctx.fillText(`LEVEL ${levelNum}  —  AWAKENING`, viewW - 14, 40);
  ctx.textAlign = 'left';

}

export function drawBossAlert(ctx, bossName, viewW, viewH) {
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px monospace';
  ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`▶ DEFEAT  ${bossName}  TO PROCEED`, viewW / 2, viewH - 28);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.textAlign = 'left';
}

export function drawNotification(ctx, text, alpha, viewW) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 16;
  ctx.fillStyle = '#00ffcc'; ctx.fillText(text, viewW / 2, 76);
  ctx.shadowBlur = 0; ctx.restore(); ctx.textAlign = 'left';
}

export function drawIntroScreen(ctx, viewW, viewH, tick) {
  ctx.fillStyle = 'rgba(3,2,14,0.93)'; ctx.fillRect(0, 0, viewW, viewH);
  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.04);
  ctx.save(); ctx.globalAlpha = pulse; ctx.textAlign = 'center';

  ctx.font = 'bold 54px monospace';
  ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 40; ctx.fillStyle = '#a78bfa';
  ctx.fillText('CYBER CLAWS', viewW / 2, viewH / 2 - 100);
  ctx.shadowBlur = 0;

  ctx.font = '13px monospace'; ctx.fillStyle = '#4c1d95';
  ctx.fillText('Chapter I  —  Awakening', viewW / 2, viewH / 2 - 62);

  ctx.strokeStyle = '#2d1b69'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(viewW/2-140, viewH/2-48); ctx.lineTo(viewW/2+140, viewH/2-48); ctx.stroke();

  ctx.font = '12px monospace'; ctx.fillStyle = '#6d5a8a';
  const lines = [
    "Year 2051. The neon city is going completely off the rails.",
    'Nimbus wakes in the outskirts — and Whiskers is at the door.',
    '"Yo, FINALLY! Get up! Go solve the world\'s problems, man!"',
    'Three Core Shards. Three powers. One very annoyed cat.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, viewW/2, viewH/2 - 22 + i * 18));

  ctx.font = '11px monospace'; ctx.fillStyle = '#38225a';
  ctx.fillText('A/D move  ·  W/Space jump  ·  Numpad1 attack  ·  Shift dash  ·  Numpad2 shield  ·  R restart', viewW/2, viewH/2+88);

  if (Math.floor(tick / 30) % 2 === 0) {
    ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 10;
    ctx.fillText('Press  ENTER  to Begin', viewW/2, viewH/2+64);
    ctx.shadowBlur = 0;
  }

  ctx.restore(); ctx.textAlign = 'left';
}

export function drawLevelTransition(ctx, viewW, viewH, alpha, levelNum) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, viewW, viewH);
  if (alpha > 0.5) {
    ctx.globalAlpha = (alpha - 0.5) * 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace'; ctx.fillStyle = '#a78bfa';
    ctx.fillText(`LEVEL  ${levelNum}`, viewW/2, viewH/2 - 10);
    ctx.font = '14px monospace'; ctx.fillStyle = '#4c1d95';
    const lvName = levelNum === 2 ? 'The Wasteland' : levelNum === 3 ? 'Signal Tower Network' : levelNum === 4 ? "Sparks' Lair" : 'Home Stretch';
    ctx.fillText(lvName, viewW/2, viewH/2+20);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

export function drawGameOver(ctx, viewW, viewH) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(0, 0, viewW, viewH);
  ctx.textAlign = 'center';
  ctx.font = 'bold 50px monospace'; ctx.fillStyle = '#f43f5e';
  ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 28;
  ctx.fillText('SYSTEM FAILURE', viewW/2, viewH/2 - 18);
  ctx.shadowBlur = 0;
  ctx.font = '14px monospace'; ctx.fillStyle = '#7c3aed';
  ctx.fillText('Nimbus.exe has crashed.', viewW/2, viewH/2 + 24);
  ctx.font = '12px monospace'; ctx.fillStyle = '#4c1d95';
  ctx.fillText('Press  R  to reboot from level start', viewW/2, viewH/2 + 52);
  ctx.textAlign = 'left';
}

export function drawVictory(ctx, viewW, viewH, tick) {
  ctx.fillStyle = 'rgba(2,0,10,0.9)'; ctx.fillRect(0, 0, viewW, viewH);
  const p = 0.8 + 0.2 * Math.sin(tick * 0.05);
  ctx.save(); ctx.globalAlpha = p; ctx.textAlign = 'center';
  ctx.font = '14px monospace'; ctx.fillStyle = '#00ffcc';
  ctx.fillText('✦  DEMO COMPLETE  ✦', viewW/2, viewH/2 - 80);
  ctx.font = 'bold 38px monospace';
  ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 24; ctx.fillStyle = '#a78bfa';
  ctx.fillText('CYBER CLAWS', viewW/2, viewH/2 - 30);
  ctx.shadowBlur = 0;
  ctx.font = '13px monospace'; ctx.fillStyle = '#4c1d95';
  ctx.fillText('Chapter I — Awakening', viewW/2, viewH/2 + 12);
  ctx.fillText('Thanks for playing!', viewW/2, viewH/2 + 36);
  ctx.font = '11px monospace'; ctx.fillStyle = '#2d1b69';
  ctx.fillText('Press  R  to replay from the start', viewW/2, viewH/2 + 68);
  ctx.restore(); ctx.textAlign = 'left';
}

// ── Private ────────────────────────────────────────────────────────────────────
function _panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(4,2,14,0.78)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e0a4e'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
}
function _arow(ctx, x, y, on, label, offColor = '#1e1040') {
  ctx.fillStyle = on ? '#a78bfa' : offColor;
  ctx.shadowColor = on ? '#a78bfa' : 'transparent'; ctx.shadowBlur = on ? 4 : 0;
  ctx.fillText(label + (on ? '' : '  ·'), x, y); ctx.shadowBlur = 0;
}
function _diamond(ctx, cx, cy, r) {
  ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r,cy); ctx.lineTo(cx,cy+r); ctx.lineTo(cx-r,cy); ctx.closePath();
}
