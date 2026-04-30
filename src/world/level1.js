// ═══════════════════════════════════════════════════════════════════════════
//  Cyber Claws — Chapter I: Awakening
//  World: 4 200 × 760 px
//  Ground top-edge at y = 660.  Player height = 34, so standing y = 626.
//  Single-jump max height ≈ 131 px from take-off.
//  Gap-jump max width  ≈ 190 px at full speed.
// ═══════════════════════════════════════════════════════════════════════════

export const WORLD_W = 4200;
export const WORLD_H = 760;
export const GROUND_Y = 660;   // top face of ground

function p(x, y, w, h, type = 'platform') {
  return { x, y, w, h, type, solid: true };
}

// ── Platforms ────────────────────────────────────────────────────────────────
export function buildPlatforms() {
  return [

    // ── ZONE 1: The Outskirts  (x 0–1 200) ─────────────────────────────
    //    Tutorial area. Ground with gaps only where a hop suffices.
    //    Max platform height: 130 px above ground (reachable without shard).

    p(    0, GROUND_Y, 980,  100, 'ground'),
    p(  995, GROUND_Y, 280,  100, 'ground'),

    // Stepping-stone path up to Shard 1
    p( 110,  575, 130,  14),   // +85 from ground (626→541) — easy
    p( 290,  510, 110,  14),   // +65 from prev
    p( 460,  450, 140,  14),   // +60 from prev  ← Shard 1 above here
    p( 650,  510,  90,  14),
    p( 775,  560, 110,  14),
    p( 900,  520,  90,  14),   // bridging the gap at 980–994
    p(1020,  600,  80,  14),
    p(1120,  545, 110,  14),

    // Low side-path (alternate route along ground)
    p( 200,  625,  90,  14),
    p( 380,  615,  80,  14),
    p( 700,  620,  70,  14),

    // ── ZONE 2: Industrial District  (x 1 200–2 500) ────────────────────
    //    Requires Shard 1 (double jump) for the high route.
    //    Ground is broken into islands.

    p(1270, GROUND_Y, 240,  100, 'ground'),
    p(1560, GROUND_Y, 230,  100, 'ground'),
    p(1840, GROUND_Y, 210,  100, 'ground'),
    p(2100, GROUND_Y, 160,  100, 'ground'),
    p(2330, GROUND_Y, 120,  100, 'ground'),

    // Main ascending path (each step +60–80 px)
    p(1290,  585, 130,  14, 'industrial'),
    p(1460,  515, 120,  14, 'industrial'),
    p(1620,  450, 140,  14, 'industrial'),
    p(1790,  385, 110,  14, 'industrial'),
    p(1950,  320, 130,  14, 'industrial'),   // ← high climb
    p(2110,  265, 120,  14, 'industrial'),   // ← Shard 2 platform
    p(2280,  310, 140,  14, 'industrial'),
    p(2430,  380, 100,  14, 'industrial'),

    // Lower industrial catwalks (safe path, no double-jump needed)
    p(1310,  625,  80,  14, 'industrial'),
    p(1420,  610,  90,  14, 'industrial'),
    p(1580,  600,  80,  14, 'industrial'),
    p(1700,  570,  70,  14, 'industrial'),
    p(1870,  555,  90,  14, 'industrial'),
    p(2000,  565,  80,  14, 'industrial'),
    p(2180,  580,  90,  14, 'industrial'),

    // Industrial wall-ledges (decorative + short cuts)
    p(1750,  430,  50,  14, 'industrial'),
    p(2060,  390,  50,  14, 'industrial'),
    p(2220,  450,  50,  14, 'industrial'),

    // ── ZONE 3: Neon Rooftops  (x 2 500–3 300) ──────────────────────────
    //    No ground — aerial zone. Requires double jump.
    //    Wide rooftops break up the tension.

    // Lower safety ledges (catch falls)
    p(2510,  640,  90,  14, 'rooftop'),
    p(2650,  625,  80,  14, 'rooftop'),
    p(2800,  635,  80,  14, 'rooftop'),
    p(2960,  640,  90,  14, 'rooftop'),
    p(3100,  630,  80,  14, 'rooftop'),

    // Main rooftop path
    p(2500,  500, 110,  14, 'rooftop'),
    p(2640,  440,  90,  14, 'rooftop'),
    p(2760,  380, 170,  14, 'rooftop'),   // wide rooftop ← Shard 3 lives here
    p(2960,  430, 100,  14, 'rooftop'),
    p(3070,  370,  90,  14, 'rooftop'),
    p(3170,  430, 100,  14, 'rooftop'),
    p(3260,  490, 110,  14, 'rooftop'),

    // Extra short rooftops for vertical variety
    p(2570,  560,  55,  14, 'rooftop'),
    p(2700,  500,  50,  14, 'rooftop'),
    p(2870,  470,  50,  14, 'rooftop'),
    p(3020,  510,  55,  14, 'rooftop'),

    // ── ZONE 4: Collapsed Bridge  (x 3 300–3 850) ────────────────────────
    //    Void below. Platform precision required (bridge planks).
    //    Shard 3 (dash) provides a safety net for long gaps.

    p(3310,  580,  90,  14, 'bridge'),
    p(3430,  548,  75,  14, 'bridge'),
    p(3535,  512,  80,  14, 'bridge'),
    p(3640,  548,  65,  14, 'bridge'),
    p(3730,  518,  85,  14, 'bridge'),
    p(3840,  548, 100,  14, 'bridge'),

    // Under-bridge ledges (secret lower path)
    p(3360,  630,  60,  14, 'bridge'),
    p(3490,  620,  55,  14, 'bridge'),
    p(3610,  610,  60,  14, 'bridge'),
    p(3740,  620,  55,  14, 'bridge'),

    // ── ZONE 5: End Ruins  (x 3 850–4 200) ──────────────────────────────
    //    Whiskers NPC lives here. Safe landing zone.

    p(3860, GROUND_Y, 340,  100, 'ruin'),

    p(3870,  590, 120,  14, 'ruin'),   // arrival platform from bridge
    p(4000,  530, 130,  14, 'ruin'),
    p(4070,  480, 100,  14, 'ruin'),
    p(4130,  545, 100,  14, 'ruin'),

  ];
}

// ── Shards ───────────────────────────────────────────────────────────────────
export function buildShards() {
  return [
    // Shard 1 — top of Zone-1 climb; needs 3 hops from ground
    { id: 1, x: 497, y: 413, w: 22, h: 22, collected: false, t: 0 },
    // Shard 2 — top of industrial tower; needs double jump
    { id: 2, x: 2138, y: 225, w: 22, h: 22, collected: false, t: Math.PI * 0.66 },
    // Shard 3 — wide neon rooftop in zone 3
    { id: 3, x: 2820, y: 340, w: 22, h: 22, collected: false, t: Math.PI * 1.33 },
  ];
}

// ── Enemies ──────────────────────────────────────────────────────────────────
export function buildEnemies() {
  function drone(x, y, patrol = 80, speed = 1.3) {
    return { x, y, w: 26, h: 22, vx: speed, vy: 0, onGround: false,
             hp: 2, maxHp: 2, alive: true, flashTimer: 0,
             startX: x, patrol, dir: 1, t: Math.random() * Math.PI * 2, speed };
  }
  return [
    // Zone 1
    drone( 660, 626,  90, 1.2),
    drone( 810, 626,  70, 1.0),
    drone( 900, 481,  50, 1.1),   // on platform
    // Zone 2 — ground
    drone(1400, 626,  80, 1.3),
    drone(1680, 626,  70, 1.2),
    drone(1960, 626,  80, 1.3),
    // Zone 2 — elevated
    drone(1660, 346,  60, 1.4),   // high platform patrol
    drone(1990, 281,  50, 1.3),
    drone(2310, 271,  60, 1.4),
    // Zone 3 rooftops
    drone(2560, 461,  55, 1.4),
    drone(2820, 341,  80, 1.5),   // same rooftop as shard 3 — guards it!
    drone(3110, 331,  50, 1.3),
    // Zone 4 bridge
    drone(3550, 473,  50, 1.2),
    drone(3730, 479,  55, 1.3),
    // Zone 5
    drone(3960, 626,  80, 1.0),
  ];
}

// ── Checkpoints ───────────────────────────────────────────────────────────────
// Player respawns at the most recently passed checkpoint.
export function buildCheckpoints() {
  return [
    { x:   0, y: 626 },   // spawn (always active)
    { x: 990, y: 626 },   // after Zone 1 gap
    { x:1840, y: 626 },   // mid Zone 2
    { x:2500, y: 466 },   // Zone 3 entry (on rooftop)
    { x:3860, y: 626 },   // Zone 5 safe zone
  ];
}

// ── Whiskers NPC ──────────────────────────────────────────────────────────────
export function buildWhiskers() {
  return {
    x: 4065, y: 626, w: 30, h: 34,
    lines: [
      'NIMBUS! You made it.',
      'Three Core Shards restored.',
      'The city remembers you.',
      'This is only the beginning…',
      'More chapters await, old friend.',
    ],
    lineIndex: 0,
    lineTimer: 0,
    lineDuration: 220,   // frames per line
  };
}

// ── Zone sign decorations (for atmosphere) ────────────────────────────────────
export function buildZoneSigns() {
  return [
    { x:  60, y: 620, label: 'SECTOR-0 / OUTSKIRTS', color: '#3535aa' },
    { x:1230, y: 640, label: 'DISTRICT-7 / INDUSTRIAL', color: '#aa6622' },
    { x:2505, y: 600, label: 'UPPER-GRID / ROOFTOPS',  color: '#22aa88' },
    { x:3310, y: 545, label: 'BRIDGE-COLLAPSE / VOID',  color: '#7744aa' },
    { x:3865, y: 640, label: 'RUINS / END',              color: '#aa3388' },
  ];
}
