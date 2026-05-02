import { GRAVITY } from '../game/physics.js';
import { aabb } from '../game/collision.js';
import { toScreen, inView } from '../game/camera.js';
import { INVINCIBLE_FRAMES } from './player.js';

// ═══════════════════════════════════════════════════════════════════════════
//  PROJECTILE
// ═══════════════════════════════════════════════════════════════════════════

export function createProjectile(x, y, vx, vy, damage = 1) {
  return { x, y, w: 10, h: 10, vx, vy, alive: true, damage, t: 0 };
}

export function updateProjectiles(projectiles, player, platforms, worldW, worldH) {
  for (const p of projectiles) {
    if (!p.alive) continue;
    p.t++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;  // slight arc

    // Out of world
    if (p.x < -50 || p.x > worldW + 50 || p.y > worldH + 50) { p.alive = false; continue; }

    // Hit solid platform (non-oneWay)
    for (const pl of platforms) {
      if (!pl.solid || pl.oneWay) continue;
      if (aabb(p, pl)) { p.alive = false; break; }
    }

    // Hit player
    if (p.alive && player.invincibleTimer === 0 && aabb(p, player)) {
      player.health -= p.damage;
      player.invincibleTimer = INVINCIBLE_FRAMES;
      p.alive = false;
    }
  }
  // prune dead
  let i = projectiles.length;
  while (i--) { if (!projectiles[i].alive) projectiles.splice(i, 1); }
}

export function drawProjectiles(ctx, projectiles, cam) {
  for (const p of projectiles) {
    const { sx, sy } = toScreen(cam, p.x, p.y);
    const pulse = 0.7 + 0.3 * Math.sin(p.t * 0.3);
    ctx.shadowColor = '#f97316'; ctx.shadowBlur = 10;
    ctx.fillStyle = `rgba(251,146,60,${pulse})`;
    ctx.beginPath(); ctx.arc(sx + p.w/2, sy + p.h/2, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1;
    ctx.stroke(); ctx.shadowBlur = 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DRONE COMMANDER — Level 2 miniboss (20 HP)
// ═══════════════════════════════════════════════════════════════════════════

export function createMiniboss(x, y) {
  return {
    x, y, w: 44, h: 50,
    vx: 0, vy: 0,
    onGround: false,
    hp: 20, maxHp: 20,
    alive: true,
    defeated: false,
    flashTimer: 0,
    attackTimer: 100,
    phase: 1,
    dir: -1,
    t: 0,
    jumpTimer: 200,
    chargeTimer: 0,
    isCharging: false,
    // Drones
    drones: [],
    droneRadius: 310,    // visible patrol boundary (bigger than bot sight 180)
    droneSpawnTimer: 60, // frames until next drone spawns
    maxDrones: 5,
  };
}

export function updateMiniboss(boss, player, platforms, projectiles, worldW) {
  if (!boss.alive) return;
  boss.t += 0.05;
  if (boss.flashTimer > 0) boss.flashTimer--;

  // Phase 2 at 50%
  if (boss.hp <= 10 && boss.phase === 1) boss.phase = 2;

  const speed = boss.phase === 2 ? 2.4 : 1.6;

  // Face player
  const dx = player.x + player.w/2 - (boss.x + boss.w/2);
  boss.dir = dx >= 0 ? 1 : -1;

  // Move toward player
  if (Math.abs(dx) > 60) boss.vx = speed * boss.dir;
  else boss.vx = 0;

  // Occasional jump
  boss.jumpTimer--;
  if (boss.jumpTimer <= 0 && boss.onGround) {
    boss.vy = -8.5;
    boss.jumpTimer = boss.phase === 2 ? 140 : 220;
  }

  // Projectile attacks
  boss.attackTimer--;
  if (boss.attackTimer <= 0) {
    boss.attackTimer = boss.phase === 2 ? 65 : 100;
    const py = boss.y + boss.h * 0.4;
    const pvx = Math.sign(dx) * 4.5;
    projectiles.push(createProjectile(boss.x + boss.w/2, py, pvx, -1.5, 1));
    if (boss.phase === 2) {
      projectiles.push(createProjectile(boss.x + boss.w/2, py, pvx * 0.6, -3, 1));
    }
  }

  // Gravity
  boss.vy += GRAVITY;
  if (boss.vy > 12) boss.vy = 12;
  boss.x += boss.vx; boss.y += boss.vy;

  // Platforms
  boss.onGround = false;
  for (const p of platforms) {
    if (!p.solid) continue;
    if (!aabb(boss, p)) continue;
    const ot = (boss.y + boss.h) - p.y;
    if (ot > 0 && ot < 28 && boss.vy >= 0) {
      boss.y = p.y - boss.h; boss.vy = 0; boss.onGround = true;
    }
  }

  // Arena clamp
  if (boss.x < 50) boss.x = 50;
  if (boss.x + boss.w > worldW - 50) boss.x = worldW - 50 - boss.w;

  // ── Drone spawn & update ──────────────────────────────────────────────────
  const bcx = boss.x + boss.w / 2;
  const bcy = boss.y + boss.h / 2;

  if (boss.drones.length < boss.maxDrones) {
    boss.droneSpawnTimer--;
    if (boss.droneSpawnTimer <= 0) {
      const orbitR = 90 + Math.random() * 160; // 90–250 px
      boss.drones.push({
        angle:        Math.random() * Math.PI * 2,
        angularSpeed: (0.022 + Math.random() * 0.02) * (Math.random() < 0.5 ? 1 : -1),
        orbitR,
        x: bcx, y: bcy,
        w: 18, h: 12,
        hp: 2, maxHp: 2,
        alive: true, flashTimer: 0, t: 0,
      });
      boss.droneSpawnTimer = 90; // ~1.5 s between spawns
    }
  }

  for (const d of boss.drones) {
    if (!d.alive) continue;
    d.t += 0.08;
    if (d.flashTimer > 0) d.flashTimer--;
    d.angle += d.angularSpeed;
    // Flat elliptical orbit: wide horizontally, compressed vertically
    d.x = bcx + Math.cos(d.angle) * d.orbitR - d.w / 2;
    d.y = bcy + Math.sin(d.angle) * d.orbitR * 0.32 - d.h / 2;
  }
}

export function drawMiniboss(ctx, boss, cam) {
  if (!boss.alive) return;
  if (!inView(cam, boss.x, boss.y, boss.w, boss.h)) return;

  const { sx, sy } = toScreen(cam, boss.x, boss.y);
  const flash = boss.flashTimer > 0;
  const bw = boss.w, bh = boss.h;
  const cx = sx + bw/2, cy = sy + bh/2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(boss.dir, 1);

  // Treads
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-bw/2, bh/2-6, bw, 7);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
  ctx.strokeRect(-bw/2, bh/2-6, bw, 7);
  // Tread detail
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(-bw/2+4 + i*8, bh/2-6); ctx.lineTo(-bw/2+4 + i*8, bh/2+1); ctx.stroke();
  }

  // Body
  const bodyC = flash ? '#ff6600' : (boss.phase===2 ? '#7f1d1d' : '#334155');
  ctx.fillStyle = bodyC;
  ctx.fillRect(-bw/2, -bh/2+8, bw, bh-12);
  ctx.strokeStyle = flash ? '#ffaa00' : (boss.phase===2 ? '#ef4444' : '#64748b');
  ctx.lineWidth = 2; ctx.strokeRect(-bw/2, -bh/2+8, bw, bh-12);

  // Armor panels
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1;
  ctx.strokeRect(-bw/2+3, -bh/2+11, bw/2-4, bh-24);
  ctx.strokeRect(3, -bh/2+11, bw/2-4, bh-24);

  // Cannon arm
  ctx.fillStyle = '#475569';
  ctx.fillRect(bw/2-2, -4, 14, 8);
  ctx.fillRect(bw/2+10, -3, 6, 6);
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
  ctx.strokeRect(bw/2-2, -4, 14, 8);

  // Head
  ctx.fillStyle = flash ? '#ff4400' : '#1e293b';
  ctx.fillRect(-bw/2+6, -bh/2-10, bw-12, 20);
  ctx.strokeStyle = flash ? '#ff8800' : '#475569'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-bw/2+6, -bh/2-10, bw-12, 20);

  // Visor eye
  const eyeC = boss.phase===2 ? '#ff2222' : '#22d3ee';
  ctx.shadowColor = eyeC; ctx.shadowBlur = 12;
  ctx.fillStyle = eyeC;
  ctx.fillRect(-bw/2+9, -bh/2-6, bw-18, 8);
  ctx.shadowBlur = 0;

  // Antenna
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-4, -bh/2-10); ctx.lineTo(-4, -bh/2-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -bh/2-10); ctx.lineTo(4, -bh/2-18); ctx.stroke();
  ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(-4, -bh/2-22, 3, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  // ── Drones ──────────────────────────────────────────────────────────────
  for (const d of boss.drones) {
    if (!d.alive) continue;
    if (!inView(cam, d.x, d.y, d.w, d.h)) continue;
    const { sx: dsx, sy: dsy } = toScreen(cam, d.x, d.y);
    const dflash = d.flashTimer > 0;
    const dpulse = 0.7 + 0.3 * Math.sin(d.t * 4);

    ctx.save();
    // Thruster glow
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8 * dpulse;
    ctx.fillStyle = dflash ? '#ff6600' : '#0e7490';
    ctx.fillRect(dsx, dsy, d.w, d.h);
    ctx.strokeStyle = dflash ? '#ffaa00' : '#22d3ee'; ctx.lineWidth = 1.5;
    ctx.strokeRect(dsx, dsy, d.w, d.h);
    ctx.shadowBlur = 0;
    // Eye lens
    ctx.fillStyle = dflash ? '#ff4444' : '#67e8f9';
    ctx.beginPath(); ctx.arc(dsx + d.w - 4, dsy + d.h / 2, 3, 0, Math.PI * 2); ctx.fill();
    // Thruster trail
    ctx.globalAlpha = 0.5 * dpulse;
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(dsx - 5, dsy + d.h / 2 - 2, 5, 4);
    ctx.globalAlpha = 1;
    ctx.restore();

    // HP pip
    if (d.hp < d.maxHp) {
      ctx.fillStyle = '#1f2937'; ctx.fillRect(dsx, dsy - 5, d.w, 3);
      ctx.fillStyle = '#22d3ee'; ctx.fillRect(dsx, dsy - 5, d.w * (d.hp / d.maxHp), 3);
    }
  }

  // HP bar
  const barW = 120, barX = cx - barW/2, barY = sy - 18;
  ctx.fillStyle = '#1f2937'; ctx.fillRect(barX, barY, barW, 8);
  ctx.fillStyle = boss.phase===2 ? '#ef4444' : '#f97316';
  ctx.fillRect(barX, barY, barW * (boss.hp / boss.maxHp), 8);
  ctx.strokeStyle = '#374151'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, 8);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('DRONE COMMANDER', cx, barY - 3);
  ctx.textAlign = 'left';
}

// ═══════════════════════════════════════════════════════════════════════════
//  SPARKS — Level 3 final boss (40 HP)
// ═══════════════════════════════════════════════════════════════════════════

export function createSparks(x, y) {
  return {
    x, y, w: 56, h: 64,
    vx: 0, vy: 0,
    onGround: false,
    hp: 40, maxHp: 40,
    alive: true,
    defeated: false,
    walkingAway: false,
    flashTimer: 0,
    attackTimer: 110,
    phase: 1,
    dir: -1,
    t: 0,
    jumpTimer: 180,
    enrageTimer: 0,
    // Arena bounds set by level
    arenaLeft: 500,
    arenaRight: 2350,
    // Ground minions
    minions: [],
    minionSpawnTimer: 110,
    maxMinions: 5,
  };
}

export function updateSparks(boss, player, platforms, projectiles) {
  boss.t += 0.05;
  if (boss.flashTimer > 0) boss.flashTimer--;

  // Walking-to-prison state
  if (boss.walkingAway) {
    boss.vx = 2;
    boss.x += boss.vx;
    boss.vy += GRAVITY; boss.y += boss.vy;
    // stay on ground
    for (const p of platforms) {
      if (!p.solid) continue;
      if (!aabb(boss, p)) continue;
      const ot = (boss.y + boss.h) - p.y;
      if (ot > 0 && ot < 20 && boss.vy >= 0) { boss.y = p.y - boss.h; boss.vy = 0; }
    }
    return;
  }

  if (!boss.alive) return;

  // Phase transition
  if (boss.hp <= 20 && boss.phase === 1) {
    boss.phase = 2;
    boss.attackTimer = 0;
    boss.enrageTimer = 60;
  }

  // Face player
  const dx = player.x + player.w/2 - (boss.x + boss.w/2);
  boss.dir = dx >= 0 ? 1 : -1;
  const speed = boss.phase === 2 ? 2.8 : 2.0;

  // Move
  if (Math.abs(dx) > 100) boss.vx = speed * boss.dir;
  else boss.vx = 0;

  // Jump
  boss.jumpTimer--;
  if (boss.jumpTimer <= 0 && boss.onGround) {
    boss.vy = -9.0;
    boss.jumpTimer = boss.phase === 2 ? 100 : 170;
  }

  // Attacks
  boss.attackTimer--;
  if (boss.attackTimer <= 0) {
    const cooldown = boss.phase === 2 ? 55 : 90;
    boss.attackTimer = cooldown;
    const py = boss.y + boss.h * 0.35;
    const pvx = Math.sign(dx) * (boss.phase === 2 ? 5.5 : 4.5);
    projectiles.push(createProjectile(boss.x + boss.w/2, py, pvx, -1.5, 1));
    if (boss.phase === 2) {
      projectiles.push(createProjectile(boss.x + boss.w/2, py, pvx, -3.5, 1));
      projectiles.push(createProjectile(boss.x + boss.w/2, py, pvx * 0.5, -0.5, 1));
    }
  }

  // Physics
  boss.vy += GRAVITY; if (boss.vy > 12) boss.vy = 12;
  boss.x += boss.vx; boss.y += boss.vy;

  boss.onGround = false;
  for (const p of platforms) {
    if (!p.solid) continue;
    if (!aabb(boss, p)) continue;
    const ot = (boss.y + boss.h) - p.y;
    if (ot > 0 && ot < 32 && boss.vy >= 0) {
      boss.y = p.y - boss.h; boss.vy = 0; boss.onGround = true;
    }
  }

  // Arena bounds
  if (boss.x < boss.arenaLeft) { boss.x = boss.arenaLeft; boss.vx = 0; }
  if (boss.x + boss.w > boss.arenaRight) { boss.x = boss.arenaRight - boss.w; boss.vx = 0; }

  // ── Minion spawn & update ─────────────────────────────────────────────────
  if (boss.alive) {
    if (boss.minions.length < boss.maxMinions) {
      boss.minionSpawnTimer--;
      if (boss.minionSpawnTimer <= 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        boss.minions.push({
          x: boss.x + boss.w / 2 + side * 36,
          y: boss.y,
          w: 20, h: 22,
          vx: 0, vy: 0,
          onGround: false,
          hp: 3, maxHp: 3,
          alive: true, flashTimer: 0,
          dir: side,
          t: Math.random() * Math.PI * 2,
        });
        boss.minionSpawnTimer = 150;
      }
    }

    for (const m of boss.minions) {
      if (!m.alive) continue;
      m.t += 0.06;
      if (m.flashTimer > 0) m.flashTimer--;
      // Chase player
      const mdx = player.x + player.w / 2 - (m.x + m.w / 2);
      m.dir = mdx >= 0 ? 1 : -1;
      m.vx  = 2.2 * m.dir;
      // Gravity
      m.vy += GRAVITY;
      if (m.vy > 10) m.vy = 10;
      m.x += m.vx;
      m.y += m.vy;
      // Platform collision
      m.onGround = false;
      for (const p of platforms) {
        if (!p.solid) continue;
        if (!aabb(m, p)) continue;
        const mot = (m.y + m.h) - p.y;
        if (mot > 0 && mot < 20 && m.vy >= 0) { m.y = p.y - m.h; m.vy = 0; m.onGround = true; }
      }
    }
  }
}

export function applyDamageToSparks(boss, damage) {
  if (!boss.alive || boss.walkingAway) return false;
  boss.hp -= damage;
  boss.flashTimer = 14;
  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.alive = false;
    boss.defeated = true;
    boss.minions.forEach(m => { m.alive = false; });
    return true;
  }
  return false;
}

export function drawSparks(ctx, boss, cam) {
  if (!inView(cam, boss.x, boss.y, boss.w, boss.h)) return;
  const { sx, sy } = toScreen(cam, boss.x, boss.y);
  const flash = boss.flashTimer > 0;
  const bw = boss.w, bh = boss.h;
  const cx = sx + bw/2, cy = sy + bh/2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(boss.dir, 1);

  // Cape / cloak (flowing dark)
  ctx.fillStyle = 'rgba(15,5,25,0.7)';
  ctx.beginPath();
  ctx.moveTo(-bw/2, -bh/4);
  ctx.quadraticCurveTo(-bw/2-20, bh/4 + Math.sin(boss.t)*8, -bw/2-10, bh/2);
  ctx.lineTo(-bw/2, bh/2);
  ctx.closePath(); ctx.fill();

  // Legs
  ctx.fillStyle = flash ? '#ff6600' : '#1e293b';
  ctx.fillRect(-bw/2+6, bh/2-14, 14, 14);
  ctx.fillRect(bw/2-20, bh/2-14, 14, 14);

  // Body
  const bodyC = flash ? '#ff4400' : (boss.phase===2 ? '#450a0a' : '#0f172a');
  ctx.fillStyle = bodyC;
  ctx.fillRect(-bw/2, -bh/2+14, bw, bh-20);
  const borderC = flash ? '#ff8800' : (boss.phase===2 ? '#dc2626' : '#dc2626');
  ctx.strokeStyle = borderC; ctx.lineWidth = 2;
  ctx.strokeRect(-bw/2, -bh/2+14, bw, bh-20);

  // Chest lightning bolt
  ctx.fillStyle = boss.phase===2 ? '#fbbf24' : '#f97316';
  ctx.beginPath();
  ctx.moveTo(4, -bh/2+18); ctx.lineTo(-4, 0); ctx.lineTo(2, 0);
  ctx.lineTo(-4, bh/2-14); ctx.lineTo(4, -bh/2+28); ctx.lineTo(-2, 0); ctx.lineTo(4, 0);
  ctx.closePath(); ctx.fill();

  // Shoulders (armor pads)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-bw/2-8, -bh/2+14, 12, 18);
  ctx.fillRect(bw/2-4, -bh/2+14, 12, 18);
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
  ctx.strokeRect(-bw/2-8, -bh/2+14, 12, 18);
  ctx.strokeRect(bw/2-4, -bh/2+14, 12, 18);

  // Dog ears (floppy, hang down beside head)
  const earC = flash ? '#7f1d1d' : '#1e293b';
  ctx.fillStyle = earC;
  ctx.fillRect(-bw/2+2, -bh/2-4, 10, 22);   // left ear
  ctx.fillRect( bw/2-12, -bh/2-4, 10, 22);  // right ear
  ctx.strokeStyle = flash ? '#ef4444' : '#475569'; ctx.lineWidth = 1;
  ctx.strokeRect(-bw/2+2, -bh/2-4, 10, 22);
  ctx.strokeRect( bw/2-12, -bh/2-4, 10, 22);

  // Head
  ctx.fillStyle = flash ? '#7f1d1d' : '#111827';
  ctx.fillRect(-bw/2+10, -bh/2-4, bw-20, 20);
  ctx.strokeStyle = flash ? '#ef4444' : '#dc2626'; ctx.lineWidth = 2;
  ctx.strokeRect(-bw/2+10, -bh/2-4, bw-20, 20);

  // Visor
  ctx.shadowColor = boss.phase===2 ? '#ff0000' : '#f97316';
  ctx.shadowBlur = 14;
  ctx.fillStyle = boss.phase===2 ? '#ef4444' : '#ea580c';
  ctx.fillRect(-bw/2+14, -bh/2, bw-28, 8);
  ctx.shadowBlur = 0;

  // Snout (protrudes from front/right side)
  ctx.fillStyle = flash ? '#7f1d1d' : '#1e293b';
  ctx.fillRect(bw/2-10, -bh/2+8, 14, 10);
  ctx.strokeStyle = flash ? '#ef4444' : '#475569'; ctx.lineWidth = 1;
  ctx.strokeRect(bw/2-10, -bh/2+8, 14, 10);
  // Nose
  ctx.fillStyle = flash ? '#ef4444' : '#dc2626';
  ctx.beginPath(); ctx.arc(bw/2+3, -bh/2+10, 2.5, 0, Math.PI*2); ctx.fill();

  // Phase 2 energy aura
  if (boss.phase === 2) {
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(boss.t * 4);
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, bw * 0.8, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // ── Minions ──────────────────────────────────────────────────────────────
  for (const m of boss.minions) {
    if (!m.alive) continue;
    if (!inView(cam, m.x, m.y, m.w, m.h)) continue;
    const { sx: msx, sy: msy } = toScreen(cam, m.x, m.y);
    const mflash = m.flashTimer > 0;
    const malerted = true;

    ctx.save();
    ctx.translate(msx + m.w / 2, msy + m.h / 2);
    ctx.scale(m.dir, 1);
    const mbw = m.w, mbh = m.h;

    // Feet
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-mbw/2, mbh/2-4, mbw/2-1, 4);
    ctx.fillRect(1, mbh/2-4, mbw/2-1, 4);

    // Body (red variant for Sparks' minions)
    ctx.fillStyle = mflash ? '#ff6600' : '#450a0a';
    ctx.fillRect(-mbw/2, -mbh/2+5, mbw, mbh-8);
    ctx.strokeStyle = mflash ? '#ffaa00' : '#dc2626'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-mbw/2, -mbh/2+5, mbw, mbh-8);

    // Head
    ctx.fillStyle = mflash ? '#ff4400' : '#7f1d1d';
    ctx.fillRect(-mbw/2+2, -mbh/2-6, mbw-4, 13);
    ctx.strokeStyle = mflash ? '#ff8800' : '#ef4444'; ctx.lineWidth = 1;
    ctx.strokeRect(-mbw/2+2, -mbh/2-6, mbw-4, 13);

    // Eye
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(3, -mbh/2-1, 3.5, 2.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // HP bar
    if (m.hp < m.maxHp) {
      ctx.fillStyle = '#1f2937'; ctx.fillRect(msx, msy - 6, m.w, 3);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(msx, msy - 6, m.w * (m.hp / m.maxHp), 3);
    }
  }

  // HP bar
  if (!boss.walkingAway) {
    const barW = 180, barX = cx - barW/2, barY = sy - 22;
    ctx.fillStyle = '#1f2937'; ctx.fillRect(barX, barY, barW, 10);
    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#dc2626' : '#7f1d1d';
    ctx.fillRect(barX, barY, barW * hpRatio, 10);
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, 10);
    ctx.fillStyle = '#f87171'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`SPARKS  ${boss.phase===2 ? '— ENRAGED' : ''}`, cx, barY - 4);
    ctx.textAlign = 'left';
  } else {
    // Walking-away text
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('...walking to prison', cx, sy - 8);
    ctx.textAlign = 'left';
  }
}

// Attack hitbox vs boss
export function checkAttackVsBoss(hitbox, boss, damage) {
  if (!hitbox) return false;
  if (!boss.alive || boss.walkingAway) return false;
  if (aabb(hitbox, boss)) {
    return applyDamageToSparks(boss, damage);
  }
  return false;
}

export function checkAttackVsMiniboss(hitbox, boss, damage) {
  if (!hitbox || !boss.alive) return false;
  if (aabb(hitbox, boss)) {
    boss.hp -= damage;
    boss.flashTimer = 14;
    if (boss.hp <= 0) {
      boss.hp = 0; boss.alive = false; boss.defeated = true;
      boss.drones.forEach(d => { d.alive = false; });
      return true;
    }
  }
  return false;
}

// Player body contact with boss
export function checkBossPlayerContact(boss, player) {
  if (player.invincibleTimer > 0) return false;
  if (!boss.alive || boss.walkingAway) return false;
  return aabb(boss, player);
}
