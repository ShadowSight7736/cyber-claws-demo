// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 1 — The Outskirts → CC HQ → Sewers
//  World: 5 500 × 820 px.  Ground top at y = 680.
//  New physics: single-jump height ≈ 336 px from standing (y=646).
//  All floating platforms are oneWay:true (pass through from below).
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_W = 5500;
export const WORLD_H = 820;
export const GROUND_Y = 680;

const G = 'ground', P = 'platform', IND = 'industrial';
const HQ = 'hq', SEW = 'sewer', RUI = 'ruin';

function ground(x, y, w, h, type = G) { return { x, y, w, h, type, solid: true, oneWay: false }; }
function plat(x, y, w, type = P)      { return { x, y, w, h: 14, type, solid: true, oneWay: true }; }
function wall(x, y, h, type = HQ)    { return { x, y, w: 18, h, type, solid: true, oneWay: false }; }

export function buildPlatforms() {
  return [
    // ── ZONE 1: Outskirts (0–1 100) ──────────────────────────────────────
    ground(0,    GROUND_Y, 1120, 140),
    ground(1140, GROUND_Y, 200,  140),  // gap 20px then ground resumes

    plat( 110,  560, 140),
    plat( 310,  480, 120),
    plat( 480,  400, 140),   // ← leads up toward HQ
    plat( 660,  470, 100),
    plat( 800,  530, 120),
    plat( 960,  580, 100),
    plat(1060,  630,  80),

    // low side path
    plat( 200,  640, 90),
    plat( 410,  640, 80),
    plat( 700,  640, 70),

    // ── ZONE 2: CC HQ Exterior (1 100–1 700) ──────────────────────────────
    ground(1100, GROUND_Y, 620, 140, HQ),

    // building facade ledges
    plat(1160,  540, 180, HQ),
    plat(1380,  440, 200, HQ),
    plat(1540,  360, 180, HQ),
    plat(1220,  640, 100, HQ),
    plat(1350,  620,  90, HQ),

    // ── ZONE 3: CC HQ Interior — Screen Room (1 700–3 000) ──────────────
    // Floor + ceiling of the HQ interior (solid, not one-way)
    ground(1700, GROUND_Y, 1320, 140, HQ),
    { x:1700, y:200, w:1320, h:20, type:HQ, solid:true, oneWay:false }, // ceiling

    // Desks / consoles (platforms player walks on)
    plat(1760,  610, 180, HQ),
    plat(1980,  610, 160, HQ),
    plat(2210,  610, 140, HQ),
    plat(2440,  570, 120, HQ),
    plat(2620,  520, 110, HQ),
    plat(2760,  460,  90, HQ),
    plat(2880,  400,  90, HQ),   // elevated walkway

    // mezzanine level
    plat(1850,  480, 160, HQ),
    plat(2050,  420, 140, HQ),
    plat(2250,  380, 120, HQ),

    // upper catwalk
    plat(2400,  310, 200, HQ),
    plat(2650,  280, 180, HQ),
    plat(2870,  260, 160, HQ),

    // ── ZONE 4: Sewer Entry (3 000–3 200) ─────────────────────────────────
    ground(3000, GROUND_Y, 280, 140, SEW),
    plat(3020,  600, 120, SEW),
    plat(3160,  540, 100, SEW),
    plat(3260,  500,  90, SEW),

    // ── ZONE 5: Sewers (3 200–4 700) ──────────────────────────────────────
    // No wide ground — tunnels made of platform slabs.
    // Water at y=750 (fatal).

    // Upper tunnel
    ground(3200, 340, 260, 18, SEW),
    ground(3500, 340, 240, 18, SEW),
    ground(3780, 340, 260, 18, SEW),
    ground(4080, 340, 220, 18, SEW),

    // Lower tunnel
    ground(3200, 560, 200, 18, SEW),
    ground(3440, 560, 200, 18, SEW),
    ground(3680, 560, 200, 18, SEW),
    ground(3920, 540, 180, 18, SEW),
    ground(4140, 540, 200, 18, SEW),

    // Sewer step platforms (connecting upper/lower)
    plat(3380,  440, 80, SEW),
    plat(3560,  440, 80, SEW),
    plat(3720,  460, 70, SEW),
    plat(3900,  460, 80, SEW),
    plat(4080,  440, 70, SEW),
    plat(4300,  400, 90, SEW),
    plat(4380,  500, 80, SEW),
    plat(4480,  440, 90, SEW),

    // Sewer pipes (horizontal bars — solid walls to give tunnel feel)
    { x:3350, y:280, w:20, h:60, type:SEW, solid:true, oneWay:false },
    { x:3650, y:280, w:20, h:60, type:SEW, solid:true, oneWay:false },
    { x:3950, y:280, w:20, h:60, type:SEW, solid:true, oneWay:false },

    // Core Shard platform (in sewers, accessible via upper path)
    plat(4550,  290, 120, SEW),   // ← Shard lives here

    // ── ZONE 6: Sewer Exit + Surface (4 700–5 500) ────────────────────────
    ground(4700, GROUND_Y, 800, 140, RUI),

    plat(4720,  580, 130, RUI),
    plat(4890,  500, 120, RUI),
    plat(5060,  430, 140, RUI),
    plat(5220,  380, 120, RUI),
    plat(5340,  480, 100, RUI),
    plat(5430,  580, 120, RUI),   // near exit
  ];
}

export function buildShards() {
  return [
    { id: 1, x: 4590, y: 252, w: 22, h: 22, collected: false, t: 0 },
  ];
}

export function buildEnemies() {
  function e(x, y, opts) { return { x, y, ...opts }; }
  return [
    // Zone 1
    { x: 280, y: 646, w:24, h:26, vx:1.2, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:280, patrol:90, dir:1, speed:1.2, alertSpeed:2.6, sightRange:180, sightHeight:70, alerted:false, alertCooldown:0, t:0, color:'#334155', eyeColor:'#22d3ee' },
    { x: 520, y: 646, w:24, h:26, vx:1.0, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:520, patrol:80, dir:1, speed:1.0, alertSpeed:2.2, sightRange:160, sightHeight:70, alerted:false, alertCooldown:0, t:0.5, color:'#334155', eyeColor:'#22d3ee' },
    { x: 750, y: 646, w:24, h:26, vx:1.3, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:750, patrol:70, dir:-1, speed:1.3, alertSpeed:2.8, sightRange:160, sightHeight:70, alerted:false, alertCooldown:0, t:1.0, color:'#334155', eyeColor:'#22d3ee' },
    // Zone 2 HQ Exterior
    { x:1200, y:646, w:24, h:26, vx:1.2, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:1200, patrol:100, dir:1, speed:1.2, alertSpeed:2.6, sightRange:180, sightHeight:70, alerted:false, alertCooldown:0, t:0.2, color:'#334155', eyeColor:'#22d3ee' },
    { x:1440, y:402, w:24, h:26, vx:1.1, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:1440, patrol:80, dir:1, speed:1.1, alertSpeed:2.4, sightRange:170, sightHeight:70, alerted:false, alertCooldown:0, t:0.8, color:'#334155', eyeColor:'#22d3ee' },
    // Zone 3 Screen Room
    { x:1900, y:646, w:24, h:26, vx:1.3, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:1900, patrol:100, dir:1, speed:1.3, alertSpeed:2.8, sightRange:180, sightHeight:70, alerted:false, alertCooldown:0, t:0.4, color:'#1e3a5f', eyeColor:'#60a5fa' },
    { x:2300, y:646, w:24, h:26, vx:1.4, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:2300, patrol:90, dir:-1, speed:1.4, alertSpeed:3.0, sightRange:190, sightHeight:70, alerted:false, alertCooldown:0, t:1.2, color:'#1e3a5f', eyeColor:'#60a5fa' },
    { x:2650, y:646, w:24, h:26, vx:1.2, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:2650, patrol:80, dir:1, speed:1.2, alertSpeed:2.6, sightRange:170, sightHeight:70, alerted:false, alertCooldown:0, t:2.0, color:'#1e3a5f', eyeColor:'#60a5fa' },
    { x:2900, y:362, w:24, h:26, vx:1.3, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:2900, patrol:60, dir:1, speed:1.3, alertSpeed:2.8, sightRange:170, sightHeight:70, alerted:false, alertCooldown:0, t:0.6, color:'#1e3a5f', eyeColor:'#60a5fa' },
    // Sewers
    { x:3300, y:302, w:24, h:26, vx:1.1, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:3300, patrol:140, dir:1, speed:1.1, alertSpeed:2.4, sightRange:160, sightHeight:70, alerted:false, alertCooldown:0, t:0.3, color:'#0f2a1e', eyeColor:'#34d399' },
    { x:3600, y:302, w:24, h:26, vx:1.2, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:3600, patrol:150, dir:-1, speed:1.2, alertSpeed:2.6, sightRange:170, sightHeight:70, alerted:false, alertCooldown:0, t:1.0, color:'#0f2a1e', eyeColor:'#34d399' },
    { x:3900, y:302, w:24, h:26, vx:1.4, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:3900, patrol:130, dir:1, speed:1.4, alertSpeed:3.0, sightRange:160, sightHeight:70, alerted:false, alertCooldown:0, t:0.7, color:'#0f2a1e', eyeColor:'#34d399' },
    { x:4200, y:302, w:24, h:26, vx:1.3, vy:0, onGround:false, hp:3,maxHp:3, alive:true, flashTimer:0, startX:4200, patrol:120, dir:-1, speed:1.3, alertSpeed:2.8, sightRange:170, sightHeight:70, alerted:false, alertCooldown:0, t:1.5, color:'#0f2a1e', eyeColor:'#34d399' },
  ];
}

export function buildCheckpoints() {
  return [
    { x:0,    y: 606, w:80, h:80, spawnX:60,   spawnY:646 },  // level start
    { x:1100, y: 606, w:80, h:80, spawnX:1150, spawnY:646 },  // after zone 1 gap
    { x:2990, y: 606, w:80, h:80, spawnX:3040, spawnY:646 },  // sewer entry
  ];
}

export function buildNova() {
  return {
    x: 3160, y: 646, w: 28, h: 34,
    lines: [
      "Oh — Nimbus? You made it down here.",
      "These tunnels run under the whole city.",
      "There's a Core Shard deeper in.",
      "Watch out for the bots. They see FAST.",
      "Good luck. I'll hold this exit.",
    ],
    lineIndex: 0,
    lineTimer: 0,
    lineDuration: 200,
    near: false,
    startX: 3160,
    randomWander: true,  // random movement instead of fixed patrol
    speed: 0.9,
    facing: 1,
    vy: 0,
    onGround: false,
    jumpVy: -5.5,
    attackTimer: 0,
    wanderDir: 1,
    wanderTimer: 60,
  };
}

// Animated screen decorations for the CC HQ room
export function buildDecorations() {
  return [
    // Large surveillance screens
    { type: 'screen', x: 1760, y: 350, w: 220, h: 140, label: 'SECTOR-0 FEED' },
    { type: 'screen', x: 2100, y: 300, w: 220, h: 140, label: 'THREAT MAP' },
    { type: 'screen', x: 2460, y: 260, w: 200, h: 130, label: 'COMMS ARRAY' },
    { type: 'screen', x: 2750, y: 220, w: 220, h: 130, label: 'CITY STATUS' },
    // Smaller status monitors
    { type: 'monitor', x: 1920, y: 580, w: 60,  h: 28, label: '' },
    { type: 'monitor', x: 2150, y: 580, w: 60,  h: 28, label: '' },
    { type: 'monitor', x: 2380, y: 540, w: 60,  h: 28, label: '' },
    // Sewer pipes
    { type: 'pipe', x: 3210, y: 260, w: 24, h: 80 },
    { type: 'pipe', x: 3510, y: 260, w: 24, h: 80 },
    { type: 'pipe', x: 3810, y: 260, w: 24, h: 80 },
    { type: 'pipe', x: 4110, y: 260, w: 24, h: 80 },
  ];
}

export const levelExit = { x: 5440, y: 530, w: 44, h: 90 };

export const spawnPoint = { x: 60, y: 646 };

// Zone titles for title-card system
export const ZONE_LABELS = [
  { xStart:    0, sector: 'SECTOR-0',     name: 'The Outskirts' },
  { xStart: 1100, sector: 'CC-HQ FRONT',  name: 'Cyber Claws HQ' },
  { xStart: 1700, sector: 'CC-HQ INNER',  name: 'The Screen Room' },
  { xStart: 3000, sector: 'SUBLEVEL-1',   name: 'The Sewers' },
  { xStart: 4700, sector: 'SECTOR-1',     name: 'Surface Exit' },
];
