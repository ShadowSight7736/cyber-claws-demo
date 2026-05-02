import {
  MAX_SPEED, ACCELERATION, FRICTION,
  JUMP_FORCE, DOUBLE_JUMP_FORCE,
  DASH_FORCE, DASH_DURATION, DASH_COOLDOWN,
  HOVER_DURATION, SHIELD_DURATION, SHIELD_COOLDOWN,
  GRAVITY, TERMINAL_VY,
} from '../game/physics.js';
import { toScreen, inView } from '../game/camera.js';

const COYOTE_FRAMES      = 9;
const JUMP_BUFFER_FRAMES = 12;
const ATTACK_DURATION    = 18;
const ATTACK_COOLDOWN    = 32;
const RANGED_COOLDOWN    = 25;
const RANGED_SPEED       = 10;
const RANGED_LIFETIME    = 110; // ~1.8 s at 60 fps
export const INVINCIBLE_FRAMES = 60;
const MAX_HEALTH = 5;

export function createPlayer(x, y) {
  return {
    x, y, w: 28, h: 34,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    shards: 0,
    attackDamage: 2,
    abilities: { attack: true, hover: false, dash: false, ranged: false, shield: false },
    jumpsLeft: 0,
    coyoteTimer: 0,
    jumpBuffer: 0,
    isAttacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: 1,
    isHovering: false,
    hoverTimer: 0,
    isShielded: false,
    shieldTimer: 0,
    shieldCooldown: 0,
    rangedCooldown: 0,
    invincibleTimer: 0,
    walkFrame: 0,
    walkTimer: 0,
    spawnX: x,
    spawnY: y,
  };
}

// Returns a projectile object if the player fires, otherwise null.
export function tryFireRanged(player, justPressed) {
  if (!player.abilities.ranged) return null;
  if (player.rangedCooldown > 0 || !justPressed['Numpad3']) return null;
  player.rangedCooldown = RANGED_COOLDOWN;
  return {
    x: player.facing === 1 ? player.x + player.w + 2 : player.x - 10,
    y: player.y + player.h / 2 - 4,
    w: 8, h: 8,
    vx: RANGED_SPEED * player.facing,
    alive: true,
    lifetime: 0,
  };
}

export function drawPlayerProjectiles(ctx, projectiles, cam) {
  for (const p of projectiles) {
    if (!p.alive) continue;
    const sx = p.x - cam.x;
    const sy = p.y - cam.y;
    const fade = Math.max(0.3, 1 - p.lifetime / RANGED_LIFETIME);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath(); ctx.arc(sx + 4, sy + 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#003322';
    ctx.beginPath(); ctx.arc(sx + 4, sy + 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// Call once per frame.  Gravity is applied by App.jsx BEFORE this.
// justPressed: keys pressed this frame only.
export function updatePlayer(player, keys, justPressed, worldW, worldH) {
  const ab = player.abilities;

  // ── Ability unlocks: shard 1=dash, 2=hover, 3=ranged, 4=shield ──────────
  if (player.shards >= 1) ab.dash   = true;
  if (player.shards >= 2) ab.hover  = true;
  if (player.shards >= 3) ab.ranged = true;
  if (player.shards >= 4) ab.shield = true;

  // ── Ranged cooldown ───────────────────────────────────────────────────────
  if (player.rangedCooldown > 0) player.rangedCooldown--;

  // ── Dash ─────────────────────────────────────────────────────────────────
  if (player.dashCooldown > 0) player.dashCooldown--;
  const dashPressed = justPressed['Shift'] || justPressed['c'] || justPressed['C'];
  if (ab.dash && dashPressed && player.dashCooldown === 0 && !player.isDashing) {
    player.isDashing  = true;
    player.dashTimer  = DASH_DURATION;
    player.dashDir    = player.facing;
    player.dashCooldown = DASH_COOLDOWN;
    player.vy = 0;
    player.invincibleTimer = Math.max(player.invincibleTimer, DASH_DURATION + 6);
  }

  // ── Horizontal ────────────────────────────────────────────────────────────
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
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }
  }

  // ── Coyote time ───────────────────────────────────────────────────────────
  if (player.onGround) {
    player.coyoteTimer = COYOTE_FRAMES;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer--;
  }

  // ── Jump  (Space or W or ArrowUp) ────────────────────────────────────────
  const jumpJust = justPressed[' '] || justPressed['w'] || justPressed['ArrowUp'];
  if (jumpJust) player.jumpBuffer = JUMP_BUFFER_FRAMES;
  if (player.jumpBuffer > 0) player.jumpBuffer--;

  if (player.jumpBuffer > 0 && player.coyoteTimer > 0) {
    player.vy          = JUMP_FORCE;
    player.jumpBuffer  = 0;
    player.coyoteTimer = 0;
  }

  // Variable-height jump: releasing early softens the arc
  const holdJump = keys[' '] || keys['w'] || keys['ArrowUp'];
  if (!holdJump && player.vy < -3) player.vy = Math.max(player.vy + 1.6, -3);

  // ── Hover  (jump again in air) ────────────────────────────────────────────
  if (ab.hover && jumpJust && !player.onGround && player.coyoteTimer === 0 &&
      !player.isHovering && !player.isDashing) {
    player.isHovering = true;
    player.hoverTimer = HOVER_DURATION;
  }
  if (player.isHovering) {
    player.vy = Math.min(player.vy, 0.6);   // near-zero fall while hovering
    player.hoverTimer--;
    if (player.hoverTimer <= 0 || player.onGround || !holdJump) {
      player.isHovering = false;
      player.hoverTimer = 0;
    }
  }

  // ── Shield  (Q — 2 s invincible, 15 s cooldown) ───────────────────────────
  if (player.shieldCooldown > 0) player.shieldCooldown--;
  if (ab.shield && justPressed['Numpad2'] &&
      player.shieldCooldown === 0 && !player.isShielded) {
    player.isShielded  = true;
    player.shieldTimer = SHIELD_DURATION;
  }
  if (player.isShielded) {
    player.invincibleTimer = Math.max(player.invincibleTimer, 4);
    player.shieldTimer--;
    if (player.shieldTimer <= 0) {
      player.isShielded    = false;
      player.shieldCooldown = SHIELD_COOLDOWN;
    }
  }

  // ── Attack  (E key) ───────────────────────────────────────────────────────
  if (player.attackCooldown > 0) player.attackCooldown--;
  const attackJust = justPressed['Numpad1'];
  if (ab.attack && attackJust && player.attackCooldown === 0 && !player.isDashing) {
    player.isAttacking   = true;
    player.attackTimer   = ATTACK_DURATION;
    player.attackCooldown = ATTACK_COOLDOWN;
  }
  if (player.attackTimer > 0) {
    player.attackTimer--;
    if (player.attackTimer === 0) player.isAttacking = false;
  }

  // ── Apply velocity (gravity already applied by caller) ───────────────────
  player.x += player.vx;
  player.y += player.vy;

  // Horizontal world clamp
  if (player.x < 0)             { player.x = 0;          player.vx = 0; }
  if (player.x + player.w > worldW) { player.x = worldW - player.w; player.vx = 0; }

  // ── Invincibility ─────────────────────────────────────────────────────────
  if (player.invincibleTimer > 0) player.invincibleTimer--;

  // ── Walk animation ────────────────────────────────────────────────────────
  if (player.onGround && Math.abs(player.vx) > 0.2) {
    player.walkTimer++;
    if (player.walkTimer >= 6) { player.walkFrame = (player.walkFrame + 1) % 6; player.walkTimer = 0; }
  } else {
    player.walkTimer = 0; player.walkFrame = 0;
  }
}

export function getAttackHitbox(player) {
  if (!player.isAttacking) return null;
  const progress = 1 - player.attackTimer / 18;
  const reach    = 16 + progress * 28;
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

  // Flicker every 4 frames when invincible
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 1) return;

  const { sx, sy } = toScreen(cam, player.x, player.y);
  const { w, h, facing, isAttacking, isDashing, onGround } = player;

  ctx.save();
  ctx.translate(sx + w / 2, sy + h / 2);
  ctx.scale(facing, 1);

  // Dash trail
  if (isDashing) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#c084fc';
    for (let i = 1; i <= 4; i++) ctx.fillRect(-w / 2 - i * 7, -h / 2, w, h);
    ctx.globalAlpha = 1;
  }

  // Body
  ctx.fillStyle = isDashing ? '#c084fc' : '#6d28d9';
  _rr(ctx, -w / 2, -h / 2 + 8, w, h - 8, 5);
  ctx.fill();
  ctx.fillStyle = isDashing ? '#e9d5ff' : '#8b5cf6';
  ctx.fillRect(-4, -h / 2 + 10, 8, h - 22);
  ctx.shadowColor = '#a78bfa';  ctx.shadowBlur = isDashing ? 16 : 5;
  ctx.strokeStyle = '#a78bfa';  ctx.lineWidth = 1.5;
  _rr(ctx, -w / 2, -h / 2 + 8, w, h - 8, 5);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Head
  ctx.fillStyle = '#7c3aed';
  _rr(ctx, -w / 2 + 2, -h / 2 - 8, w - 4, 18, 4); ctx.fill();
  ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 4;
  ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5;
  _rr(ctx, -w / 2 + 2, -h / 2 - 8, w - 4, 18, 4); ctx.stroke();
  ctx.shadowBlur = 0;

  // Ears
  ctx.fillStyle = '#6d28d9';
  _tri(ctx, -w/2+3, -h/2-8, -w/2+2, -h/2-20, -w/2+13, -h/2-8);
  _tri(ctx,  w/2-3, -h/2-8,  w/2-2, -h/2-20,  w/2-13, -h/2-8);
  ctx.fillStyle = '#c084fc';
  _tri(ctx, -w/2+4, -h/2-9, -w/2+4, -h/2-17, -w/2+11, -h/2-9);
  _tri(ctx,  w/2-4, -h/2-9,  w/2-4, -h/2-17,  w/2-11, -h/2-9);

  // Eyes
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath(); ctx.ellipse(-7, -h/2-1, 3.2, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 7, -h/2-1, 3.2, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#003322';
  ctx.beginPath(); ctx.ellipse(-6.5, -h/2-1, 1.2, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 7.5, -h/2-1, 1.2, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Whiskers
  ctx.strokeStyle = 'rgba(196,181,253,0.55)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(6,-h/2); ctx.lineTo(17,-h/2+3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6,-h/2); ctx.lineTo(17,-h/2-3); ctx.stroke();

  // Legs
  const bob = onGround ? Math.sin(player.walkFrame * Math.PI / 3) * 3 : 0;
  ctx.fillStyle = '#5b21b6';
  ctx.fillRect(-w/2+3, h/2-9+bob,  9, 9);
  ctx.fillRect( w/2-12, h/2-9-bob, 9, 9);

  // Tail
  const swing = onGround ? Math.sin(player.walkFrame * 0.6) * 6 : 4;
  ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 5;
  ctx.strokeStyle = '#9d74e0'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w/2, h/4);
  ctx.quadraticCurveTo(-w/2-18, h/2+swing, -w/2-10, h/2+14+swing);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Claw attack
  if (isAttacking) {
    const prog = 1 - player.attackTimer / ATTACK_DURATION;
    ctx.save();
    ctx.globalAlpha = 0.8 - prog * 0.5;
    ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 18;
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(w/2, 0, 20 + prog * 20, -Math.PI*0.5, Math.PI*0.5);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.lineWidth = 2 - i * 0.5;
      ctx.beginPath();
      ctx.moveTo(w/2 + i*6,      -h/4 + i*5);
      ctx.lineTo(w/2 + i*6 + 22,  h/4 + i*3);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }

  ctx.restore();

  // Hover glow ring under feet (screen space)
  if (player.isHovering) {
    const pulse = 0.5 + 0.25 * Math.sin(Date.now() * 0.01);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 14;
    ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(sx + w/2, sy + h - 2, w * 0.7, 5, 0, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  }

  // Shield aura (screen space)
  if (player.isShielded) {
    const pulse = 0.35 + 0.15 * Math.sin(Date.now() * 0.012);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 22;
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx + w/2, sy + h/2, w * 0.95, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.restore();
  }
}

function _rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y, x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h, x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h, x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y, x+r,y);
  ctx.closePath();
}
function _tri(ctx,x1,y1,x2,y2,x3,y3){
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill();
}
