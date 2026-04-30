// All HUD drawing — health, shards, abilities, notifications, screens.

const TOTAL_SHARDS = 3;

// ── In-game HUD ───────────────────────────────────────────────────────────────

export function drawHUD(ctx, player, viewW) {
  const ab = player.abilities;

  // ── Health ──────────────────────────────────────────────────────
  _panel(ctx, 12, 12, 142, 36);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#9d74e0';
  ctx.fillText('HP', 22, 33);

  for (let i = 0; i < player.maxHealth; i++) {
    const filled = i < player.health;
    ctx.shadowColor = filled ? '#f43f5e' : 'transparent';
    ctx.shadowBlur  = filled ? 8 : 0;
    ctx.fillStyle   = filled ? '#f43f5e' : '#2d1a2e';
    ctx.beginPath();
    ctx.arc(52 + i * 18, 30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = filled ? '#fda4af' : '#4a2d4e';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Core Shards ─────────────────────────────────────────────────
  _panel(ctx, 12, 55, 155, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.fillText(`CORE SHARDS`, 22, 72);
  for (let i = 0; i < TOTAL_SHARDS; i++) {
    const have = player.shards > i;
    ctx.shadowColor = have ? '#00ffcc' : 'transparent';
    ctx.shadowBlur  = have ? 6 : 0;
    ctx.fillStyle   = have ? '#00ffcc' : '#0d2e2a';
    _diamond(ctx, 110 + i * 18, 68, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Abilities ────────────────────────────────────────────────────
  _panel(ctx, 12, 90, 200, 66);
  ctx.font = '10px monospace';
  _abilityRow(ctx, 22, 106, ab.doubleJump, '[W]   DOUBLE JUMP');
  _abilityRow(ctx, 22, 121, ab.attack,     '[SPC] CLAW ATTACK');
  _abilityRow(ctx, 22, 136, ab.dash,       '[SHF] CYBER DASH');
  _abilityRow(ctx, 22, 148, true,          '[A/D] MOVE',  '#443355');

  // ── Chapter tag (top-right) ──────────────────────────────────────
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText('CYBER CLAWS', viewW - 14, 26);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#3b1764';
  ctx.fillText('CHAPTER I  —  AWAKENING', viewW - 14, 40);
  ctx.textAlign = 'left';
}

// ── Floating notification (fades out) ────────────────────────────────────────

export function drawNotification(ctx, text, alpha, viewW) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#00ffcc';
  ctx.fillText(text, viewW / 2, 76);
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.textAlign = 'left';
}

// ── Intro screen ─────────────────────────────────────────────────────────────

export function drawIntroScreen(ctx, viewW, viewH, tick) {
  // Dark overlay
  ctx.fillStyle = 'rgba(3,2,14,0.92)';
  ctx.fillRect(0, 0, viewW, viewH);

  // Title glow pulse
  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.04);

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';

  // Logo
  ctx.font = 'bold 54px monospace';
  ctx.shadowColor = '#7c3aed';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('CYBER CLAWS', viewW / 2, viewH / 2 - 90);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.font = '13px monospace';
  ctx.fillStyle = '#4c1d95';
  ctx.fillText('Chapter I  —  Awakening', viewW / 2, viewH / 2 - 52);

  // Divider
  ctx.strokeStyle = '#2d1b69';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(viewW / 2 - 140, viewH / 2 - 36);
  ctx.lineTo(viewW / 2 + 140, viewH / 2 - 36);
  ctx.stroke();

  // Lore
  ctx.font = '12px monospace';
  ctx.fillStyle = '#6d5a8a';
  const lines = [
    'Year 2051.  The neon city sleeps.',
    'Nimbus wakes in the abandoned outskirts.',
    '"Find the Core Shards," Whiskers warned.',
    'Three shards.  Three powers.  One chance.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, viewW / 2, viewH / 2 - 12 + i * 18));

  // Controls hint
  ctx.font = '11px monospace';
  ctx.fillStyle = '#38225a';
  ctx.fillText('A / D  move   |   W  jump   |   SPACE  attack   |   SHIFT  dash', viewW / 2, viewH / 2 + 92);

  // Blinking prompt
  if (Math.floor(tick / 30) % 2 === 0) {
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 10;
    ctx.fillText('Press  ENTER  to Begin', viewW / 2, viewH / 2 + 66);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
  ctx.textAlign = 'left';
}

// ── Game Over screen ──────────────────────────────────────────────────────────

export function drawGameOver(ctx, viewW, viewH) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.textAlign = 'center';
  ctx.font = 'bold 52px monospace';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#f43f5e';
  ctx.fillText('SYSTEM FAILURE', viewW / 2, viewH / 2 - 20);
  ctx.shadowBlur = 0;

  ctx.font = '15px monospace';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText('Nimbus.exe has stopped.', viewW / 2, viewH / 2 + 22);

  ctx.font = '13px monospace';
  ctx.fillStyle = '#4c1d95';
  ctx.fillText('Press  R  to reboot', viewW / 2, viewH / 2 + 50);
  ctx.textAlign = 'left';
}

// ── Victory screen ────────────────────────────────────────────────────────────

export function drawVictory(ctx, viewW, viewH, tick) {
  ctx.fillStyle = 'rgba(2,0,10,0.88)';
  ctx.fillRect(0, 0, viewW, viewH);

  const pulse = 0.8 + 0.2 * Math.sin(tick * 0.05);

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';

  ctx.font = '14px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.fillText('✦  ALL CORE SHARDS RECOVERED  ✦', viewW / 2, viewH / 2 - 60);

  ctx.font = 'bold 38px monospace';
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('NIMBUS  AWAKENS', viewW / 2, viewH / 2 - 10);
  ctx.shadowBlur = 0;

  ctx.font = '13px monospace';
  ctx.fillStyle = '#4c1d95';
  ctx.fillText('Chapter I  Complete', viewW / 2, viewH / 2 + 32);
  ctx.fillText('More chapters await…', viewW / 2, viewH / 2 + 52);

  ctx.font = '11px monospace';
  ctx.fillStyle = '#2d1b69';
  ctx.fillText('Press  R  to replay', viewW / 2, viewH / 2 + 86);

  ctx.restore();
  ctx.textAlign = 'left';
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(4,2,14,0.78)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e0a4e';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function _abilityRow(ctx, x, y, unlocked, label, lockedColor = '#1e1040') {
  ctx.fillStyle = unlocked ? '#a78bfa' : lockedColor;
  ctx.shadowColor = unlocked ? '#a78bfa' : 'transparent';
  ctx.shadowBlur  = unlocked ? 5 : 0;
  ctx.fillText(label + (unlocked ? '' : '  ·'), x, y);
  ctx.shadowBlur = 0;
}

function _diamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
  ctx.closePath();
}
