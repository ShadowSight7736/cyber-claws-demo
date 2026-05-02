// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 4 — Sparks' Lair: The Final Boss
//  World: 3 200 × 820 px.
//  Arena is fully enclosed.  Sparks walks right off screen after defeat.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_W = 3200;
export const WORLD_H = 820;
export const GROUND_Y = 680;

function ground(x, y, w, h, type = 'ruin') { return { x, y, w, h, type, solid: true, oneWay: false }; }
function plat(x, y, w, type = 'ruin')      { return { x, y, w, h: 14, type, solid: true, oneWay: true  }; }

export function buildPlatforms() {
  return [
    // ── Zone 1: Approach (0–600) ──────────────────────────────────────────
    ground(   0, GROUND_Y, 620, 140),
    plat(  90,  560, 120),
    plat( 260,  490, 110),
    plat( 410,  420, 130),
    plat( 560,  490, 100),

    // ── Zone 2: Boss Arena (600–2 600) ────────────────────────────────────
    ground( 600, GROUND_Y, 2020, 140, 'ruin'),

    plat( 700,  540, 180, 'ruin'),
    plat( 940,  460, 160, 'ruin'),
    plat(1160,  380, 200, 'ruin'),
    plat(1420,  460, 160, 'ruin'),
    plat(1640,  380, 200, 'ruin'),
    plat(1900,  460, 160, 'ruin'),
    plat(2120,  540, 180, 'ruin'),

    plat(1040,  320, 240, 'ruin'),
    plat(1400,  320, 240, 'ruin'),

    // ── Zone 3: Aftermath / Whiskers (2 600–3 200) ────────────────────────
    ground(2620, GROUND_Y, 580, 140, 'ruin'),
    plat(2680,  580, 120, 'ruin'),
    plat(2840,  520, 120, 'ruin'),
    plat(3000,  580, 160, 'ruin'),
  ];
}

export function buildShards() {
  // Shard 4 spawns at Sparks' defeat position — not pre-placed.
  return [];
}

export function buildEnemies() {
  const mk = (x, y, patrol, speed, hp) => ({
    x, y, w:24, h:26, vx:speed, vy:0, onGround:false, hp, maxHp:hp, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed, alertSpeed:speed*2.2,
    sightRange:180, sightHeight:70, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#450a0a', eyeColor:'#f87171',
  });
  const mkp = (x, y, patrol) => ({
    x, y, w:26, h:28, vx:0.7, vy:0, onGround:false, hp:4, maxHp:4, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed:0.7, alertSpeed:1.5,
    sightRange:210, sightHeight:80, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#0c1445', eyeColor:'#7dd3fc',
    pusher:true, meleeImmune:true, pushRange:70, pushForce:10,
  });
  return [
    // Approach — one regular guard then a pusher blocking the way
    mk(  310, 646, 70, 1.6, 4),
    mkp( 470, 646, 60),

    // Arena — two pushers mixed among the regular guards
    mk(  900, 646, 80, 1.6, 4),
    mkp(1200, 646, 70),
    mk( 1700, 646, 90, 1.7, 4),
    mkp(2000, 646, 75),
  ];
}

export function buildHealthPacks() {
  return [
    { x: 750, y:502, w:22, h:22, collected:false, t:0   },
    { x:2180, y:502, w:22, h:22, collected:false, t:0.8 },
  ];
}

export function buildAttackBoosts() {
  return [
    { x:1150, y:342, w:22, h:22, collected:false, t:0.3 },
    { x:1460, y:342, w:22, h:22, collected:false, t:1.1 },
  ];
}

export function buildCheckpoints() {
  return [
    { x:  0, y:606, w:80, h:80, spawnX:60,  spawnY:646 },
    { x:580, y:606, w:80, h:80, spawnX:640, spawnY:646 },
  ];
}

export function buildWhiskers() {
  return {
    x: 2780, y: 646, w: 30, h: 34,
    lines: [
      "YO! You actually did it!!",
      "I knew you had it in you, Nimbus.",
      "Heh. Nobody messes with the Cyber Claws.",
      "The city's gonna be okay now, man.",
      "...maybe. Probably. Let's go home.",
    ],
    lineIndex: 0,
    lineTimer: 0,
    lineDuration: 220,
    near: false,
    done: false,
    startX: 2780,
    patrolRange: 65,
    speed: 0.5,
    facing: -1,
    vy: 0,
    onGround: false,
  };
}

export function buildDecorations() {
  return [
    { type: 'warning', x: 560, y: 600, w: 32, h: 40 },
    { type: 'ruin-rubble', x: 650, y: 658, w: 80, h: 22 },
    { type: 'ruin-rubble', x:2100, y: 658, w: 70, h: 18 },
  ];
}

export const spawnPoint    = { x: 60, y: 646 };
export const levelBackExit = { x: 0,   y: 556, w: 44, h: 124 };
export const backSpawn     = { x: 3780, y: 626 }; // near level 3 exit, clear of the portal

// Sparks spawn position (right side of arena, facing left toward player)
export const SPARKS_SPAWN = { x: 2400, y: 646 };

export const ZONE_LABELS = [
  { xStart:   0, sector: 'SECTOR-X',    name: "Sparks' Approach" },
  { xStart: 600, sector: 'FINAL-ARENA', name: 'The Last Stand' },
  { xStart:2620, sector: 'AFTERMATH',   name: 'End of Chapter I' },
];
