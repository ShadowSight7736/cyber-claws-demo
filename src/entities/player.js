import {
  MAX_SPEED, ACCELERATION, FRICTION,
  JUMP_FORCE, DOUBLE_JUMP_FORCE,
  DASH_FORCE, DASH_DURATION, DASH_COOLDOWN,
  GRAVITY, TERMINAL_VY,
} from '../game/physics.js';
import { toScreen, inView } from '../game/camera.js';

const COYOTE_FRAMES  = 8;
const JUMP_BUFFER_FRAMES = 10;
const ATTACK_DURATION = 20;
const ATTACK_COOLDOWN = 36;
const INVINCIBLE_FRAMES = 80;
const MAX_HEALTH = 5;

export function createPlayer(x, y) {
  return {
    x, y, w: 28, h: 34,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,    // 1=right, -1=left

    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    shards: 0,

    abilities: { doubleJump: false, attack: false, dash: false },

    // Jump state
    jumpsLeft:    1,
    coyoteTimer:  0,
    jumpBuffer:   0,

    // Attack
    isAttacking:   false,
    attackTimer:   0,
    attackCooldown: 0,

    // Dash
    isDashing:    false,
    dashTimer:    0,
    dashCooldown: 0,
    dashDir:      1,

    // Invincibility after damage
    invincibleTimer: 0,

    // Animation
    walkFrame: 0,
    walkTimer: 0,

    // Respawn
    spawnX: x, spawnY: y,
    dead: false,
  };
}

// jumpKey: true on the frame the key was pressed (not held)
export function updatePlayer(player, keys, justPressed, worldW) {
  const ab = player.abilities;

  // ── Ability unlock ─────────────────────────────────────────────
  if (player.shards >= 1) ab.doubleJump = true;
  if (player.shards >= 2) ab.attack = true;
  if (player.shards >= 3) ab.dash = true;

  // ── Dash ───────────────────────────────────────────────────────
  if (player.dashCooldown > 0) player.dashCooldown--;

  const dashPressed = justPressed['Shift'] || justPressed['c'] || justPressed['C'];
  if (ab.dash && dashPressed && player.dashCooldown === 0 && !player.isDashing) {
    player.isDashing  = true;
    player.dashTimer  = DASH_DURATION;
    player.dashDir    = player.facing;
    player.dashCooldown = DASH_COOLDOWN;
    player.vy = 0;
    // Brief invincibility during dash
    player.invincibleTimer = Math.max(player.invincibleTimer, DASH_DURATION + 4);
  }

  // ── Horizontal movement ────────────────────────────────────────
  if (player.isDashing) {
    player.vx = DASH_FORCE * player.dashDir;
    player.dashTimer--;
    if (player.dashTimer <= 0) player.isDashing = false;
  } else {
    const goRight = keys['d'] || keys['ArrowRight'];
    const goLeft  = keys['a'] || keys['ArrowLeft'];

    if (goRight) {
      player.vx = Math.min(player.vx + ACCELERATION, MAX_SPEED);
      player.facing = 1;
    } else if (goLeft) {
      player.vx = Math.max(player.vx - ACCELERATION, -MAX_SPEED);
      player.facing = -1;
    } else {
      player.vx *= FRICTION;
      if (Math.abs(player.vx) < 0.12) player.vx = 0;
    }
  }

  // ── Coyote time ────────────────────────────────────────────────
  if (player.onGround) {
    player.coyoteTimer = COYOTE_FRAMES;
    player.jumpsLeft   = ab.doubleJump ? 2 : 1;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer--;
  }

  // ── Jump buffer ────────────────────────────────────────────────
  const wantsJump = keys['w'] || keys['ArrowUp'];
  if (justPressed['w'] || justPressed['ArrowUp']) player.jumpBuffer = JUMP_BUFFER_FRAMES;
  if (player.jumpBuffer > 0) player.jumpBuffer--;

  if (player.jumpBuffer > 0) {
    if (player.coyoteTimer > 0) {
      // Ground / coyote jump
      player.vy          = JUMP_FORCE;
      player.jumpBuffer  = 0;
      player.coyoteTimer = 0;
      // Using coyote counts as using the ground jump
      if (ab.doubleJump) player.jumpsLeft = 1;
    } else if (player.jumpsLeft > 0 && !player.isDashing) {
      // Air / double jump
      player.vy         = DOUBLE_JUMP_FORCE;
      player.jumpBuffer = 0;
      player.jumpsLeft--;
    }
  }

  // Variable jump height: releasing W early cuts vy
  if (!wantsJump && player.vy < -4) player.vy = Math.max(player.vy + 1.8, -4);

  // ── Attack ─────────────────────────────────────────────────────
  if (player.attackCooldown > 0) player.attackCooldown--;
  const attackPressed = justPressed[' '];
  if (ab.attack && attackPressed && player.attackCooldown === 0 && !player.isDashing) {
    player.isAttacking   = true;
    player.attackTimer   = ATTACK_DURATION;
    player.attackCooldown = ATTACK_COOLDOWN;
  }
  if (player.attackTimer > 0) {
    player.attackTimer--;
    if (player.attackTimer === 0) player.isAttacking = false;
  }

  // ── Gravity ────────────────────────────────────────────────────
  if (!player.isDashing) {
    player.vy += GRAVITY;
    if (player.vy > TERMINAL_VY) player.vy = TERMINAL_VY;
  }

  // ── Apply velocity ─────────────────────────────────────────────
  player.x += player.vx;
  player.y += player.vy;

  // World horizontal clamp
  if (player.x < 0)              { player.x = 0;          player.vx = 0; }
  if (player.x + player.w > worldW) { player.x = worldW - player.w; player.vx = 0; }

  // ── Invincibility ──────────────────────────────────────────────
  if (player.invincibleTimer > 0) player.invincibleTimer--;

  // ── Walk animation ─────────────────────────────────────────────
  if (player.onGround && Math.abs(player.vx) > 0.3) {
    player.walkTimer++;
    if (player.walkTimer >= 6) { player.walkFrame = (player.walkFrame + 1) % 6; player.walkTimer = 0; }
  } else {
    player.walkTimer = 0;
    player.walkFrame = 0;
  }
}

// Returns the claw-swipe hitbox rect, or null if not attacking
export function getAttackHitbox(player) {
  if (!player.isAttacking) return null;
  const progress = 1 - player.attackTimer / 20; // 0→1
  const reach = 14 + progress * 28;             // extends forward
  return {
    x: player.facing === 1 ? player.x + player.w : player.x - reach,
    y: player.y + 4,
    w: reach,
    h: player.h - 8,
  };
}

// ── Drawing ───────────────────────────────────────────────────────────────────

export function drawPlayer(ctx, player, cam) {
  if (!inView(cam, player.x, player.y, player.w, player.h)) return;

  // Flicker during invincibility
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 1) return;

  const { sx, sy } = toScreen(cam, player.x, player.y);
  const { w, h, facing, isAttacking, isDashing, onGround, vx } = player;

  ctx.save();
  ctx.translate(sx + w / 2, sy + h / 2);
  ctx.scale(facing, 1);

  // Dash trail effect
  if (isDashing) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#a78bfa';
    for (let i = 1; i <= 3; i++) {
      ctx.fillRect(-w / 2 - i * 6 * facing, -h / 2, w, h);
    }
    ctx.globalAlpha = 1;
  }

  // ── Body ──────────────────────────────────────────────────────
  const bodyColor = isDashing ? '#c084fc' : '#6d28d9';
  ctx.fillStyle = bodyColor;
  _roundRect(ctx, -w / 2, -h / 2 + 8, w, h - 8, 5);
  ctx.fill();

  // Cyber chest line
  ctx.fillStyle = isDashing ? '#e9d5ff' : '#8b5cf6';
  ctx.fillRect(-4, -h / 2 + 10, 8, h - 22);

  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = isDashing ? 16 : 6;
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 1.5;
  _roundRect(ctx, -w / 2, -h / 2 + 8, w, h - 8, 5);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Head ──────────────────────────────────────────────────────
  ctx.fillStyle = '#7c3aed';
  _roundRect(ctx, -w / 2 + 2, -h / 2 - 8, w - 4, 18, 4);
  ctx.fill();
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 1.5;
  _roundRect(ctx, -w / 2 + 2, -h / 2 - 8, w - 4, 18, 4);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Ears ──────────────────────────────────────────────────────
  ctx.fillStyle = '#6d28d9';
  _tri(ctx, -w / 2 + 3, -h / 2 - 8, -w / 2 + 2, -h / 2 - 20, -w / 2 + 13, -h / 2 - 8);
  _tri(ctx,  w / 2 - 3, -h / 2 - 8,  w / 2 - 2, -h / 2 - 20,  w / 2 - 13, -h / 2 - 8);

  // Inner ear
  ctx.fillStyle = '#c084fc';
  _tri(ctx, -w / 2 + 4, -h / 2 - 9, -w / 2 + 4, -h / 2 - 17, -w / 2 + 11, -h / 2 - 9);
  _tri(ctx,  w / 2 - 4, -h / 2 - 9,  w / 2 - 4, -h / 2 - 17,  w / 2 - 11, -h / 2 - 9);

  // ── Eyes (cyan glow) ──────────────────────────────────────────
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath(); ctx.ellipse(-7, -h / 2 - 1, 3.2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 7, -h / 2 - 1, 3.2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = '#003322';
  ctx.beginPath(); ctx.ellipse(-6.5, -h / 2 - 1, 1.2, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 7.5, -h / 2 - 1, 1.2, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // ── Whiskers ──────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(196,181,253,0.6)';
  ctx.lineWidth = 0.8;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(6, -h / 2); ctx.lineTo(17, -h / 2 + d * 3); ctx.stroke();
  }

  // ── Legs (walk bob) ───────────────────────────────────────────
  const bob = onGround ? Math.sin(player.walkFrame * Math.PI / 3) * 3 : 0;
  ctx.fillStyle = '#5b21b6';
  ctx.fillRect(-w / 2 + 3, h / 2 - 9 + bob,  9, 9);
  ctx.fillRect( w / 2 - 12, h / 2 - 9 - bob, 9, 9);

  // Foot glow (when on ground)
  if (onGround) {
    ctx.fillStyle = 'rgba(139,92,246,0.3)';
    ctx.fillRect(-w / 2 + 3, h / 2, 9, 3);
    ctx.fillRect( w / 2 - 12, h / 2, 9, 3);
  }

  // ── Tail ──────────────────────────────────────────────────────
  const tailSwing = onGround ? Math.sin(player.walkFrame * 0.6) * 6 : 4;
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#9d74e0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 4);
  ctx.quadraticCurveTo(-w / 2 - 18, h / 2 + tailSwing, -w / 2 - 10, h / 2 + 14 + tailSwing);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Claw attack arc ───────────────────────────────────────────
  if (isAttacking) {
    const progress = 1 - player.attackTimer / ATTACK_DURATION;
    ctx.save();
    ctx.globalAlpha = 0.85 - progress * 0.5;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(w / 2, 0, 22 + progress * 18, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    // Slash lines
    for (let i = 0; i < 3; i++) {
      const off = i * 6;
      ctx.lineWidth = 2 - i * 0.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 + off,      -h / 4 + i * 5);
      ctx.lineTo(w / 2 + off + 20,  h / 4 + i * 3);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.restore();

  // ── Double-jump sparkle (drawn in world space) ────────────────
  if (!onGround && player.jumpsLeft === 0 && player.abilities.doubleJump) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#c084fc';
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() / 400 + i * Math.PI / 2);
      const r = 20;
      ctx.beginPath();
      ctx.arc(sx + w / 2 + Math.cos(angle) * r,
              sy + h / 2 + Math.sin(angle) * r * 0.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _tri(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath(); ctx.fill();
}
