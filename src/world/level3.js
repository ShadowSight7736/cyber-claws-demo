// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 3 — Signal Tower
//  World: 3 900 × 760 px.  Ground at y = 660.
//  One tall tower holds Core Shard 3 at its peak.  Climb it or skip it —
//  the ground path continues on both sides of the tower base.
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
    // Continuous ground — never removed, so the skip path always exists
    ground(0, GROUND_Y, 3900, 100),

    // ── Zone 1: Approach (0–1 000) ────────────────────────────────────────
    plat(120,  560, 130, RUI),
    plat(320,  490, 120, RUI),
    plat(520,  560, 120, RUI),
    plat(700,  490, 110, RUI),

    // ── Zone 2: The Signal Tower (1 000–1 400) ────────────────────────────
    // Walls span y=80→600.  Player stands at y=634+ so they pass freely
    // under the open base — enter from ground level to start climbing.
    wall(1000, 80, 520),   // left wall
    wall(1322, 80, 520),   // right wall

    // Interior platforms — zigzag left / right each floor (~70 px steps)
    plat(1018, 590, 120),  // floor 1 — left
    plat(1200, 520, 100),  // floor 2 — right
    plat(1018, 450, 120),  // floor 3 — left
    plat(1200, 380, 100),  // floor 4 — right
    plat(1018, 310, 120),  // floor 5 — left
    plat(1200, 240, 100),  // floor 6 — right
    plat(1018, 170, 120),  // floor 7 — left
    plat(1190, 100, 110),  // floor 8 — right (shard floats above this)

    // ── Zone 3: Exit Path (1 400–3 900) ──────────────────────────────────
    plat(1460, 560, 130, RUI),
    plat(1660, 490, 120, RUI),
    plat(1860, 560, 130, RUI),
    plat(2060, 490, 110, RUI),
    plat(2260, 560, 120, RUI),
    plat(2460, 490, 130, RUI),
    plat(2660, 560, 120, RUI),
    plat(2860, 490, 130, RUI),
    plat(3060, 560, 120, RUI),
    plat(3260, 490, 130, RUI),
    plat(3460, 560, 130, RUI),
    plat(3650, 500, 120, RUI),
  ];
}

export function buildShards() {
  return [
    { id: 3, x: 1230, y: 62, w: 22, h: 22, collected: false, t: 0 },
  ];
}

export function buildEnemies() {
  const mk = (x, y, patrol, speed, hp, color, eye) => ({
    x, y, w:24, h:26, vx:speed, vy:0, onGround:false, hp, maxHp:hp, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed, alertSpeed:speed*2.2,
    sightRange:180, sightHeight:70, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color, eyeColor:eye,
  });
  const mkp = (x, y, patrol) => ({
    x, y, w:26, h:28, vx:0.7, vy:0, onGround:false, hp:4, maxHp:4, alive:true,
    flashTimer:0, startX:x, patrol, dir:1, speed:0.7, alertSpeed:1.5,
    sightRange:210, sightHeight:80, alerted:false, alertCooldown:0,
    t:Math.random()*Math.PI*2, color:'#0c1445', eyeColor:'#7dd3fc',
    pusher:true, meleeImmune:true, pushRange:70, pushForce:10,
  });
  return [
    // Zone 1 — approach guards (ground level)
    mk( 250, 626,  80, 1.3, 3, '#334155', '#22d3ee'),
    mk( 700, 626,  60, 1.4, 3, '#334155', '#22d3ee'),

    // Tower interior — guards on right-side floors; pusher on floor 4 forces ranged
    mk(1250, 494,  40, 1.2, 4, '#1e3a5f', '#60a5fa'),  // floor 2
    mkp(1250, 352,  35),                                  // floor 4 — melee-immune
    mk(1250, 214,  40, 1.4, 4, '#1e3a5f', '#60a5fa'),  // floor 6
    mk(1245,  74,  35, 1.2, 4, '#1e3a5f', '#60a5fa'),  // floor 8 — guards the shard

    // Zone 3 — exit path
    mk(1700, 626,  80, 1.4, 4, '#450a0a', '#f87171'),
    mkp(2100, 626,  70),
    mk(2600, 626,  90, 1.5, 4, '#450a0a', '#f87171'),
    mk(3300, 626, 100, 1.4, 4, '#450a0a', '#f87171'),
  ];
}

export function buildHealthPacks() {
  return [
    { x: 1040, y: 152, w: 22, h: 22, collected: false, t: 0.4 }, // floor 7 — reward for climbing
    { x: 2460, y: 452, w: 22, h: 22, collected: false, t: 1.1 },
  ];
}

export function buildAttackBoosts() {
  return [
    { x: 2060, y: 452, w: 22, h: 22, collected: false, t: 0.7 },
  ];
}

export function buildCheckpoints() {
  return [
    { x:    0, y: 586, w: 80, h: 80, spawnX:   60, spawnY: 626 },
    { x:  950, y: 586, w: 80, h: 80, spawnX:  970, spawnY: 626 }, // tower entrance
    { x: 2000, y: 586, w: 80, h: 80, spawnX: 2060, spawnY: 626 }, // exit path mid
  ];
}

export function buildDecorations() {
  return [
    { type: 'pipe',        x: 1010, y:  80, w: 14, h: 520 },
    { type: 'pipe',        x: 1332, y:  80, w: 14, h: 520 },
    { type: 'screen',      x: 1020, y:  60, w: 300, h: 24, label: 'RELAY NODE 7' },
    { type: 'monitor',     x:  580, y: 534, w: 50, h: 24, label: '' },
    { type: 'monitor',     x: 2260, y: 466, w: 50, h: 24, label: '' },
    { type: 'ruin-rubble', x:  350, y: 658, w: 70, h: 22 },
    { type: 'ruin-rubble', x: 1600, y: 658, w: 80, h: 22 },
  ];
}

export const spawnPoint    = { x:  60, y: 626 };
export const levelExit     = { x: 3840, y: 560, w: 44, h: 100 };
export const levelBackExit = { x:    0, y: 536, w: 44, h: 124 };
export const backSpawn     = { x: 4480, y: 646 }; // near level 2 exit

export const ZONE_LABELS = [
  { xStart:    0, sector: 'SECTOR-3',     name: 'Entry Plaza' },
  { xStart: 1000, sector: 'SIGNAL-TOWER', name: 'The Signal Tower' },
  { xStart: 1400, sector: 'SECTOR-3B',    name: 'Exit Path' },
];
