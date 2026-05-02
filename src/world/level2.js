// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 2 — The Wasteland: exploring outside the city for Sparks
//  World: 4 600 × 820 px.   Miniboss arena at x ≈ 3 400.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_W = 4600;
export const WORLD_H = 820;
export const GROUND_Y = 680;

function ground(x, y, w, h, type = 'ground')  { return { x, y, w, h, type, solid: true, oneWay: false }; }
function plat(x, y, w, type = 'platform')      { return { x, y, w, h: 14, type, solid: true, oneWay: true  }; }

export function buildPlatforms() {
  return [
    // ── Zone 1: City Edge (0–700) ─────────────────────────────────────────
    ground(   0, GROUND_Y, 720, 140),
    plat( 100,  560, 130),
    plat( 280,  490, 110),
    plat( 440,  420, 130),
    plat( 610,  490, 100),
    plat( 200,  640, 90),
    plat( 420,  640, 80),
    plat( 600,  640, 70),

    // ── Zone 2: Industrial Wasteland (700–2 200) ───────────────────────────
    ground( 740, GROUND_Y, 380, 140, 'industrial'),
    ground(1160, GROUND_Y, 360, 140, 'industrial'),
    ground(1560, GROUND_Y, 360, 140, 'industrial'),
    ground(1960, GROUND_Y, 280, 140, 'industrial'),
    ground(2280, GROUND_Y, 200, 140, 'industrial'),

    plat( 780,  560, 140, 'industrial'),
    plat( 960,  490, 120, 'industrial'),
    plat(1130,  420, 130, 'industrial'),
    plat(1310,  360, 110, 'industrial'),
    plat(1460,  300, 140, 'industrial'),
    plat(1620,  370, 120, 'industrial'),
    plat(1760,  440, 100, 'industrial'),
    plat(1880,  510, 110, 'industrial'),
    plat(2020,  450, 120, 'industrial'),
    plat(2160,  390, 100, 'industrial'),

    // lower wasteland path
    plat( 850,  630,  90, 'industrial'),
    plat(1000,  620,  80, 'industrial'),
    plat(1200,  620,  90, 'industrial'),
    plat(1420,  630,  80, 'industrial'),

    // ── Zone 3: Open Fields (2 200–3 200) ─────────────────────────────────
    ground(2240, GROUND_Y, 280, 140),
    ground(2580, GROUND_Y, 280, 140),
    ground(2920, GROUND_Y, 320, 140),

    plat(2300,  560, 130),
    plat(2480,  490, 110),
    plat(2650,  420, 140),
    plat(2820,  490, 100),
    plat(2980,  550, 120),
    plat(3120,  490, 110),
    plat(2360,  640,  90),
    plat(2600,  640,  80),
    plat(2830,  640,  70),

    // ── Zone 4: Enemy Camp (3 200–3 600) ──────────────────────────────────
    ground(3200, GROUND_Y, 420, 140, 'industrial'),
    plat(3240,  600,  80, 'industrial'),
    plat(3350,  540,  90, 'industrial'),
    plat(3480,  480, 100, 'industrial'),

    // ── Zone 5: Miniboss Arena (3 600–4 600) ──────────────────────────────
    ground(3600, GROUND_Y, 1000, 140, 'industrial'),

    // Arena platforms
    plat(3680,  530, 160, 'industrial'),
    plat(3920,  450, 160, 'industrial'),
    plat(4160,  530, 160, 'industrial'),
    plat(3800,  360, 140, 'industrial'),
    plat(4080,  360, 140, 'industrial'),
  ];
}

export function buildShards() {
  return [
    // Shard 2 drops from miniboss defeat — initially NOT on map, spawned by boss system
    // We'll handle this in App.jsx; no static shard in this level's initial data.
  ];
}

export function buildEnemies() {
  const mk = (x, y, patrol, speed, hp) => ({
    x, y, w:24, h:26, vx:speed, vy:0, onGround:false, hp, maxHp:hp, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed, alertSpeed:speed*2.3,
    sightRange:190, sightHeight:75, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#1e3a5f', eyeColor:'#60a5fa',
  });
  return [
    // Zone 1
    mk( 460, 646, 70, 1.2, 3),
    // Zone 2
    mk( 880, 646, 90, 1.4, 4), mk(1180, 646, 80, 1.4, 4),
    mk(1480, 646, 80, 1.5, 4), mk(1760, 646, 70, 1.3, 4),
    mk(1310, 322, 80, 1.4, 4), mk(1620, 332, 70, 1.5, 4),
    // Zone 3
    mk(2360, 646, 90, 1.4, 4), mk(2650, 646, 80, 1.5, 4),
    mk(2980, 646, 90, 1.3, 4),
    // Enemy camp (harder)
    mk(3260, 646, 60, 1.6, 4), mk(3380, 646, 60, 1.7, 4),
    mk(3500, 646, 70, 1.6, 4), mk(3260, 502, 60, 1.5, 4),
  ];
}

export function buildHealthPacks() {
  return [
    { x:1050, y:382, w:22, h:22, collected:false, t:0 },
    { x:2100, y:352, w:22, h:22, collected:false, t:0.5 },
    { x:2830, y:452, w:22, h:22, collected:false, t:1.0 },
    // One inside the arena to help during boss fight
    { x:3730, y:642, w:22, h:22, collected:false, t:0 },
  ];
}

export function buildAttackBoosts() {
  return [
    { x: 960, y:452, w:22, h:22, collected:false, t:0 },
    { x:1600, y:262, w:22, h:22, collected:false, t:0.7 },
    { x:2700, y:382, w:22, h:22, collected:false, t:1.4 },
  ];
}

export function buildCheckpoints() {
  return [
    { x:0,    y:606, w:80, h:80, spawnX:60,   spawnY:646 },
    { x:1550, y:606, w:80, h:80, spawnX:1580, spawnY:646 },
    { x:3580, y:606, w:80, h:80, spawnX:3640, spawnY:646 }, // before boss arena
  ];
}

export function buildDecorations() {
  return [
    // Rusted industrial debris
    { type: 'debris', x: 800,  y: 658, w: 60, h: 22 },
    { type: 'debris', x:1100,  y: 658, w: 50, h: 18 },
    { type: 'debris', x:1650,  y: 658, w: 70, h: 24 },
    { type: 'debris', x:2000,  y: 658, w: 55, h: 20 },
    // Warning signs before boss room
    { type: 'warning', x:3540, y: 580, w: 32, h: 40 },
    { type: 'warning', x:3560, y: 580, w: 32, h: 40 },
  ];
}

export const spawnPoint = { x: 60, y: 646 };

export const levelExit     = { x: 4530, y: 590, w: 44, h: 90 };
export const levelBackExit = { x: 0,   y: 556, w: 44, h: 124 };
export const backSpawn     = { x: 5360, y: 646 }; // near level 1 exit

export const ZONE_LABELS = [
  { xStart:    0, sector: 'OUTER-GRID',   name: 'City Outskirts' },
  { xStart:  700, sector: 'WASTE-ZONE',   name: 'Industrial Wasteland' },
  { xStart: 2200, sector: 'OPEN-FIELDS',  name: 'The Barrens' },
  { xStart: 3200, sector: 'CAMP-DELTA',   name: "Sparks' Forward Camp" },
  { xStart: 3600, sector: 'ARENA-ZERO',   name: 'Drone Commander' },
];
