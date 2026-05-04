// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 5 — Home Stretch
//  Short victory-lap level that puts the new Shield ability to the test.
//  Dense enemy clusters reward well-timed shields.  Whiskers waits at the end.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_W = 2800;
export const WORLD_H = 820;
export const GROUND_Y = 680;

const RUI = 'ruin';

function ground(x, y, w, h, type = RUI) { return { x, y, w, h, type, solid: true, oneWay: false }; }
function plat(x, y, w, type = RUI)      { return { x, y, w, h: 14, type, solid: true, oneWay: true }; }

export function buildPlatforms() {
  return [
    // ── Zone 1: Shield Gauntlet (0–1 700) ───────────────────────────────
    ground(0, GROUND_Y, 1720, 140),

    // Lower platforms for enemy placement
    plat( 140, 570, 120),
    plat( 340, 500, 110),
    plat( 540, 570, 130),
    plat( 760, 490, 120),
    plat( 960, 560, 110),
    plat(1160, 490, 130),
    plat(1380, 560, 120),
    plat(1540, 490, 110),

    // ── Zone 2: Final Stretch / Whiskers (1 700–2 800) ──────────────────
    ground(1720, GROUND_Y, 1080, 140),

    plat(1780, 570, 120),
    plat(1960, 490, 130),
    plat(2160, 560, 120),
    plat(2400, 590, 140),
    plat(2600, 560, 160),  // Whiskers stands here at the end
  ];
}

export function buildShards() {
  return []; // all shards already collected in earlier levels
}

export function buildEnemies() {
  // Elite bot — faster and more HP to encourage shield use
  const elite = (x, y, patrol, speed) => ({
    x, y, w:24, h:26, vx:speed, vy:0, onGround:false, hp:5, maxHp:5, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed, alertSpeed:speed*2.0,
    sightRange:200, sightHeight:80, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#3b0764', eyeColor:'#c084fc',
  });
  // Pusher — melee immune, requires ranged
  const mkp = (x, y, patrol) => ({
    x, y, w:26, h:28, vx:0.7, vy:0, onGround:false, hp:4, maxHp:4, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed:0.7, alertSpeed:1.5,
    sightRange:210, sightHeight:80, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#0c1445', eyeColor:'#7dd3fc',
    pusher:true, meleeImmune:true, pushRange:70, pushForce:10,
  });

  return [
    // ── Zone 1: paired elite clusters — shield or take big hits ──────────
    mkp(   390, 466,  50),
    elite( 560, 646,  40, 2.0),   // pair 2
    elite( 620, 646,  40, 2.0),
    elite( 800, 456,  50, 1.8),   // elevated pair
    elite( 860, 456,  40, 1.9),
    mkp(  1000, 526,  45),
    elite(1100, 646,  40, 2.1),   // trio
    elite(1160, 646,  40, 2.0),
    elite(1220, 646,  40, 2.1),
    elite(1400, 526,  50, 1.9),
    mkp(  1560, 456,  40),

    // ── Zone 2: lighter — let the player breathe before Whiskers ─────────
    elite(1840, 646,  60, 1.7),
    elite(2000, 456,  50, 1.8),
    elite(2220, 646,  60, 1.7),
  ];
}

export function buildHealthPacks() {
  return [
    { x:  500, y: 618, w: 22, h: 22, collected: false, t: 0.3 },
    { x: 1050, y: 618, w: 22, h: 22, collected: false, t: 0.9 },
    { x: 1700, y: 618, w: 22, h: 22, collected: false, t: 0.5 },
  ];
}

export function buildAttackBoosts() { return []; }

export function buildCheckpoints() {
  return [
    { x:    0, y: 606, w: 80, h: 80, spawnX:  60, spawnY: 646 },
    { x:  900, y: 606, w: 80, h: 80, spawnX:  960, spawnY: 646 },
    { x: 1700, y: 606, w: 80, h: 80, spawnX: 1760, spawnY: 646 },
  ];
}

export function buildWhiskers() {
  return {
    x: 2660, y: 646, w: 30, h: 34,
    lines: [
      "YO! You actually did it!!",
      "Sparks is GONE. The city's safe.",
      "I knew you had it in you, Nimbus.",
      "Heh. Nobody messes with the Cyber Claws.",
      "...Let's go home.",
    ],
    lineIndex: 0,
    lineTimer: 0,
    lineDuration: 220,
    near: false,
    done: false,
    startX: 2660,
    patrolRange: 60,
    speed: 0.5,
    facing: -1,
    vy: 0,
    onGround: false,
  };
}

export function buildDecorations() {
  return [
    { type: 'warning', x:    0, y: 600, w: 32, h: 40 },
    { type: 'ruin-rubble', x: 300, y: 658, w: 70, h: 22 },
    { type: 'ruin-rubble', x: 900, y: 658, w: 80, h: 22 },
    { type: 'ruin-rubble', x:1600, y: 658, w: 60, h: 18 },
  ];
}

export const spawnPoint    = { x:  60, y: 646 };
export const levelBackExit = { x:   0, y: 540, w: 44, h: 140 };
export const backSpawn     = { x: 2700, y: 646 }; // in level 4 aftermath, clear of its exit

export const ZONE_LABELS = [
  { xStart:    0, sector: 'SECTOR-0',   name: 'Shield Gauntlet' },
  { xStart: 1700, sector: 'AFTERMATH',  name: 'Home Stretch' },
];
