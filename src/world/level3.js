// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 3 — Signal Tower Network
//  World: 3 900 × 760 px.  Ground at y = 660.
//  Zone 2 has no ground — falling is lethal.  Core Shard 3 at tower peak.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_W = 3900;
export const WORLD_H = 760;
export const GROUND_Y = 660;

const TWR = 'tower';
const RUI = 'ruin';

function ground(x, y, w, h, type = RUI) { return { x, y, w, h, type, solid: true, oneWay: false }; }
function plat(x, y, w, type = TWR)      { return { x, y, w, h: 14, type, solid: true, oneWay: true }; }
function wall(x, y, h)                   { return { x, y, w: 18, h, type: TWR, solid: true, oneWay: false }; }

export function buildPlatforms() {
  return [
    // ── Zone 1: Entry Plaza (0–700) ───────────────────────────────────────
    ground(0, GROUND_Y, 720, 100),

    plat(120,  560, 130, RUI),
    plat(300,  480, 120, RUI),
    plat(480,  400, 140, RUI),
    plat(650,  480, 110, RUI),

    // ── Zone 2: Signal Tower Network (700–2 700) ──────────────────────────
    // No ground — platforms only.  Fall to world bottom = respawn.

    // Lower catwalk approach
    plat( 720,  560, 110),
    plat( 870,  510,  90),
    plat(1010,  460, 100),

    // Ascending to mid-tier
    plat(1140,  400, 110),
    plat(1290,  340, 100),
    plat(1440,  280, 130),  // mid-high ledge

    // Tower peak — Core Shard lives here
    plat(1610,  210, 170),  // ← shard at x≈1650, y≈172

    // Descending far side
    plat(1820,  280, 110),
    plat(1970,  340, 100),
    plat(2110,  400, 120),
    plat(2270,  460, 110),
    plat(2420,  520, 100),
    plat(2560,  580, 110),

    // Vertical tower pillars (visual + collision walls)
    wall( 700,  400, 260),
    wall(1280,  200, 460),
    wall(1780,  200, 460),
    wall(2700,  420, 240),

    // ── Zone 3: Descent and Exit (2 700–3 900) ────────────────────────────
    ground(2700, GROUND_Y, 1200, 100, RUI),

    plat(2750,  560, 130, RUI),
    plat(2940,  490, 120, RUI),
    plat(3120,  420, 140, RUI),
    plat(3310,  490, 120, RUI),
    plat(3500,  560, 130, RUI),
    plat(3680,  600, 120, RUI),
  ];
}

export function buildShards() {
  return [
    { id: 3, x: 1684, y: 130, w: 22, h: 22, collected: false, t: 0 },
  ];
}

export function buildEnemies() {
  const mk = (x, y, patrol, speed, hp, color, eye) => ({
    x, y, w:24, h:26, vx:speed, vy:0, onGround:false, hp, maxHp:hp, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed, alertSpeed:speed*2.2,
    sightRange:180, sightHeight:70, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color, eyeColor:eye,
  });
  // Pusher: melee-immune force-field bot — only ranged attacks can damage it
  const mkp = (x, y, patrol) => ({
    x, y, w:26, h:28, vx:0.7, vy:0, onGround:false, hp:4, maxHp:4, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed:0.7, alertSpeed:1.5,
    sightRange:210, sightHeight:80, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#0c1445', eyeColor:'#7dd3fc',
    pusher:true, meleeImmune:true, pushRange:70, pushForce:10,
  });
  return [
    // Zone 1 — entry guards
    mk( 250, 626,  80, 1.3, 3, '#334155', '#22d3ee'),
    mk( 520, 446,  70, 1.4, 3, '#334155', '#22d3ee'),

    // Zone 2 — mix of regular bots and pushers (pushers block melee path to the shard)
    mk(  870, 476,  60, 1.2, 4, '#1e3a5f', '#60a5fa'),
    mkp(1140, 366,  50),   // pusher guarding approach to shard
    mkp(1820, 246,  55),   // pusher on far side of peak
    mk( 2110, 366,  70, 1.4, 4, '#1e3a5f', '#60a5fa'),
    mk( 2420, 486,  60, 1.3, 4, '#1e3a5f', '#60a5fa'),

    // Zone 3 — descent: one pusher among the tougher guards
    mk( 2900, 626,  90, 1.5, 4, '#450a0a', '#f87171'),
    mkp(3200, 626,  80),   // pusher in descent
    mk( 3550, 626, 100, 1.4, 4, '#450a0a', '#f87171'),
  ];
}

export function buildHealthPacks() {
  return [
    { x: 1650, y: 172, w: 22, h: 22, collected: false, t: 0.4 }, // near shard
    { x: 3120, y: 382, w: 22, h: 22, collected: false, t: 1.1 },
  ];
}

export function buildAttackBoosts() {
  return [
    { x: 1010, y: 422, w: 22, h: 22, collected: false, t: 0.7 },
  ];
}

export function buildCheckpoints() {
  return [
    { x:   0, y: 586, w: 80, h: 80, spawnX:  60, spawnY: 626 },
    { x: 680, y: 586, w: 80, h: 80, spawnX: 730, spawnY: 526 }, // tower entry
    { x:2680, y: 586, w: 80, h: 80, spawnX:2740, spawnY: 626 }, // descent
  ];
}

export function buildDecorations() {
  return [
    { type: 'pipe', x:  710, y: 360, w: 24, h: 300 },
    { type: 'pipe', x: 1290, y: 160, w: 24, h: 480 },
    { type: 'pipe', x: 1790, y: 160, w: 24, h: 480 },
    { type: 'pipe', x: 2710, y: 380, w: 24, h: 280 },
    { type: 'screen', x: 1610, y:  60, w: 170, h:  80, label: 'RELAY NODE 7' },
    { type: 'monitor', x: 870, y: 476, w: 50, h: 24, label: '' },
    { type: 'monitor', x:2270, y: 436, w: 50, h: 24, label: '' },
  ];
}

export const spawnPoint    = { x:  60, y: 626 };
export const levelExit     = { x: 3840, y: 560, w: 44, h: 100 };
export const levelBackExit = { x:    0, y: 536, w: 44, h: 124 };
export const backSpawn     = { x: 4480, y: 646 }; // near level 2 exit

export const ZONE_LABELS = [
  { xStart:    0, sector: 'SECTOR-3',   name: 'Entry Plaza' },
  { xStart:  700, sector: 'RELAY-NET',  name: 'Signal Tower Network' },
  { xStart: 2700, sector: 'SECTOR-3B',  name: 'Tower Descent' },
];
