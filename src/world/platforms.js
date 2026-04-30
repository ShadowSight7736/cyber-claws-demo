import { inView, toScreen } from '../game/camera.js';

// Colour themes per zone
const ZONE_STYLE = {
  ground:   { fill: '#0c0c26', edge: '#24247a', dim: '#18184e', hasGrid: true },
  platform: { fill: '#0d1030', edge: '#3535aa', dim: '#1a1a50', hasGrid: false },
  industrial:{ fill: '#1a0e08', edge: '#aa6622', dim: '#2a1a0e', hasGrid: false },
  rooftop:  { fill: '#08161a', edge: '#22aa88', dim: '#0e2028', hasGrid: false },
  bridge:   { fill: '#120c1a', edge: '#7744aa', dim: '#1e1430', hasGrid: false },
  ruin:     { fill: '#0e0e1e', edge: '#aa3388', dim: '#1c1030', hasGrid: false },
};

export function drawPlatforms(ctx, platforms, cam) {
  for (const p of platforms) {
    if (!inView(cam, p.x, p.y, p.w, p.h)) continue;
    const { sx, sy } = toScreen(cam, p.x, p.y);
    const style = ZONE_STYLE[p.type] || ZONE_STYLE.platform;

    // Body
    ctx.fillStyle = style.fill;
    ctx.fillRect(sx, sy, p.w, p.h);

    // Vertical panel lines on large ground blocks
    if (style.hasGrid && p.w > 80) {
      ctx.strokeStyle = style.dim;
      ctx.lineWidth = 1;
      for (let gx = 20; gx < p.w; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(sx + gx, sy);
        ctx.lineTo(sx + gx, sy + Math.min(p.h, 30));
        ctx.stroke();
      }
    }

    // Glowing top edge (neon line)
    const edgeGlow = style.edge;
    ctx.shadowColor = edgeGlow;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = edgeGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 1);
    ctx.lineTo(sx + p.w, sy + 1);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Drop shadow beneath thin platforms
    if (p.h < 24) {
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx + 2, sy + p.h + 2);
      ctx.lineTo(sx + p.w - 2, sy + p.h + 2);
      ctx.stroke();
    }
  }
}

// ── Parallax background ──────────────────────────────────────────────────────

let _stars    = null;
let _bldgsFar = null;
let _bldgsMid = null;

export function drawParallaxBackground(ctx, cam, viewW, viewH, tick) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, viewH);
  grad.addColorStop(0, '#03020d');
  grad.addColorStop(0.55, '#07041a');
  grad.addColorStop(1, '#0c0720');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewW, viewH);

  // Stars — almost no parallax (0.04)
  if (!_stars) _stars = _buildStars(viewW, viewH);
  for (const s of _stars) {
    const alpha = 0.2 + 0.25 * Math.sin(tick * 0.018 + s.phase);
    ctx.fillStyle = `rgba(200,200,255,${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(s.x - cam.x * 0.04, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far city silhouette (parallax 0.12)
  if (!_bldgsFar) _bldgsFar = _buildSilhouette(viewW, 60, 200, 24, 90);
  _drawSilhouette(ctx, _bldgsFar, cam.x * 0.12, viewH, viewW, '#060414', '#0a0820');

  // Mid city silhouette (parallax 0.25)
  if (!_bldgsMid) _bldgsMid = _buildSilhouette(viewW, 40, 160, 18, 60);
  _drawSilhouette(ctx, _bldgsMid, cam.x * 0.25, viewH, viewW, '#04030f', '#080618', tick);
}

function _drawSilhouette(ctx, buildings, offX, viewH, viewW, fillColor, winColor, tick) {
  ctx.fillStyle = fillColor;
  for (const b of buildings) {
    const bx = ((b.x - offX) % (viewW * 2) + viewW * 2) % (viewW * 2) - viewW * 0.3;
    if (bx + b.w < -2 || bx > viewW + 2) continue;
    const by = viewH - b.h;
    ctx.fillRect(bx, by, b.w, b.h);

    // Lit windows
    if (winColor && b.windows) {
      for (const w of b.windows) {
        const flicker = tick ? (Math.sin(tick * 0.03 + w.seed) > 0.6 ? 0.18 : 0.08) : 0.12;
        ctx.fillStyle = `rgba(120,120,255,${flicker})`;
        ctx.fillRect(bx + w.rx, by + w.ry, w.rw, w.rh);
        ctx.fillStyle = fillColor;
      }
    }
  }
}

// ── Decorative foreground details ─────────────────────────────────────────────

export function drawAtmosphere(ctx, cam, viewW, viewH, tick) {
  // Floating dust/particles in air
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const seed = i * 137.508;
    const px = ((seed * 31.7 - cam.x * 0.6 + tick * (0.3 + (i % 3) * 0.2)) % viewW + viewW) % viewW;
    const py = (seed * 17.3 + tick * (0.15 + (i % 5) * 0.1)) % (viewH * 0.8);
    const alpha = 0.04 + 0.04 * Math.sin(tick * 0.04 + seed);
    ctx.fillStyle = `rgba(160,120,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Private builders ──────────────────────────────────────────────────────────

function _buildStars(vw, vh) {
  return Array.from({ length: 130 }, () => ({
    x: Math.random() * vw,
    y: Math.random() * vh * 0.65,
    r: Math.random() * 1.3 + 0.3,
    phase: Math.random() * Math.PI * 2,
  }));
}

function _buildSilhouette(vw, minW, maxW, minH, maxH) {
  const out = [];
  let x = 0;
  const total = vw * 2.2;
  while (x < total) {
    const w = minW + Math.random() * (maxW - minW);
    const h = minH + Math.random() * (maxH - minH);
    const windows = [];
    for (let wy = 8; wy < h - 10; wy += 12) {
      for (let wx = 6; wx < w - 6; wx += 10) {
        if (Math.random() > 0.45) {
          windows.push({ rx: wx, ry: wy, rw: 3, rh: 5, seed: Math.random() * 100 });
        }
      }
    }
    out.push({ x, w, h, windows });
    x += w + 3 + Math.random() * 18;
  }
  return out;
}
