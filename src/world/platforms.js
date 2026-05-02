import { inView, toScreen } from '../game/camera.js';

// ── Zone colour themes ────────────────────────────────────────────────────────
const STYLE = {
  ground:      { fill:'#0c0c26', edge:'#24247a', dim:'#181850', hasGrid:true  },
  platform:    { fill:'#0d1030', edge:'#3535aa', dim:'#1a1a50', hasGrid:false },
  industrial:  { fill:'#1a0e08', edge:'#aa6622', dim:'#2a1a0e', hasGrid:false },
  rooftop:     { fill:'#08161a', edge:'#22aa88', dim:'#0e2028', hasGrid:false },
  bridge:      { fill:'#120c1a', edge:'#7744aa', dim:'#1e1430', hasGrid:false },
  ruin:        { fill:'#0e0e1e', edge:'#aa3388', dim:'#1c1030', hasGrid:false },
  hq:          { fill:'#050d1e', edge:'#1d4ed8', dim:'#0a1a30', hasGrid:true  },
  sewer:       { fill:'#061212', edge:'#15803d', dim:'#0a2020', hasGrid:false },
};

export function drawPlatforms(ctx, platforms, cam) {
  for (const p of platforms) {
    if (!inView(cam, p.x, p.y, p.w, p.h)) continue;
    const { sx, sy } = toScreen(cam, p.x, p.y);
    const s = STYLE[p.type] || STYLE.platform;

    ctx.fillStyle = s.fill;
    ctx.fillRect(sx, sy, p.w, p.h);

    if (s.hasGrid && p.w > 60) {
      ctx.strokeStyle = s.dim; ctx.lineWidth = 1;
      for (let gx = 20; gx < p.w; gx += 20) {
        ctx.beginPath(); ctx.moveTo(sx+gx, sy); ctx.lineTo(sx+gx, sy + Math.min(p.h,28)); ctx.stroke();
      }
    }

    ctx.shadowColor = s.edge; ctx.shadowBlur = 5;
    ctx.strokeStyle = s.edge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy+1); ctx.lineTo(sx+p.w, sy+1); ctx.stroke();
    ctx.shadowBlur = 0;

    if (p.h < 24) {
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx+2, sy+p.h+2); ctx.lineTo(sx+p.w-2, sy+p.h+2); ctx.stroke();
    }
  }
}

// ── Decorations (screens, pipes, debris, etc.) ────────────────────────────────

export function drawDecorations(ctx, decorations, cam, tick) {
  if (!decorations) return;
  for (const d of decorations) {
    if (!inView(cam, d.x, d.y, d.w, d.h)) continue;
    const { sx, sy } = toScreen(cam, d.x, d.y);

    switch (d.type) {
      case 'screen':  _drawScreen(ctx, sx, sy, d.w, d.h, d.label, tick); break;
      case 'monitor': _drawMonitor(ctx, sx, sy, d.w, d.h, tick);          break;
      case 'pipe':    _drawPipe(ctx, sx, sy, d.w, d.h);                   break;
      case 'debris':  _drawDebris(ctx, sx, sy, d.w, d.h);                 break;
      case 'warning': _drawWarning(ctx, sx, sy, d.w, d.h, tick);          break;
      case 'ruin-rubble': _drawRubble(ctx, sx, sy, d.w, d.h);             break;
    }
  }
}

function _drawScreen(ctx, x, y, w, h, label, tick) {
  // Frame
  ctx.fillStyle = '#03070f'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);

  // Grid of animated data blocks
  const cols = 10, rows = 6;
  const cw = (w - 8) / cols, ch = (h - 8) / rows;
  const phase = Math.floor(tick / 40) % 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = ((c * 7 + r * 3 + phase * 11 + c * r) % 100) / 100;
      if (val > 0.25) {
        const g = Math.floor(val * 200 + 40);
        ctx.fillStyle = `rgb(0,${g},${Math.floor(g * 0.35)})`;
        ctx.fillRect(x + 4 + c * cw, y + 4 + r * ch, cw - 1, ch - 1);
      }
    }
  }

  // Scanning line
  const scanY = ((tick * 2) % (h - 8));
  ctx.fillStyle = 'rgba(0,255,80,0.12)';
  ctx.fillRect(x + 4, y + 4 + scanY, w - 8, 2);

  // Label + status
  ctx.fillStyle = '#22c55e'; ctx.font = '8px monospace';
  ctx.fillText(label || '', x + 5, y + h - 14);
  if (Math.floor(tick / 50) % 4 !== 0) {
    ctx.fillStyle = '#16a34a';
    ctx.fillText('● LIVE', x + 5, y + h - 4);
  }

  // Corner markers
  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1;
  const m = 6;
  for (const [ex,ey] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]) {
    const sx2 = ex === x ? 1 : -1, sy2 = ey === y ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(ex+sx2*m, ey); ctx.lineTo(ex, ey); ctx.lineTo(ex, ey+sy2*m); ctx.stroke();
  }
}

function _drawMonitor(ctx, x, y, w, h, tick) {
  ctx.fillStyle = '#030b15'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  const blink = Math.floor(tick / 30) % 3;
  ctx.fillStyle = blink === 0 ? '#22d3ee' : (blink === 1 ? '#f59e0b' : '#4ade80');
  ctx.font = '6px monospace';
  ctx.fillText(blink === 0 ? 'STATUS: OK' : (blink === 1 ? 'ALERT !!' : 'SCANNING'), x + 3, y + h - 4);
}

function _drawPipe(ctx, x, y, w, h) {
  // Vertical pipe
  ctx.fillStyle = '#14532d'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#166534'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  // Highlight
  ctx.fillStyle = 'rgba(74,222,128,0.15)'; ctx.fillRect(x + 3, y + 4, 4, h - 8);
  // Drip effect
  ctx.fillStyle = '#4ade80';
  ctx.beginPath(); ctx.arc(x + w/2, y + h, 3, 0, Math.PI*2); ctx.fill();
}

function _drawDebris(ctx, x, y, w, h) {
  ctx.fillStyle = '#1c1917'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + 20, y + h); ctx.stroke();
}

function _drawWarning(ctx, x, y, w, h, tick) {
  const flash = Math.floor(tick / 25) % 2 === 0;
  ctx.fillStyle = flash ? '#854d0e' : '#422006';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = flash ? '#fbbf24' : '#92400e'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = flash ? '#fbbf24' : '#78350f';
  ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
  ctx.fillText('!', x + w/2, y + h/2 + 5);
  ctx.textAlign = 'left';
}

function _drawRubble(ctx, x, y, w, h) {
  ctx.fillStyle = '#1c1917';
  for (let i = 0; i < 4; i++) {
    const rx = x + i * (w/4), ry = y + Math.sin(i*1.7)*6, rw = w/4 - 2, rh = h - Math.cos(i)*4;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1; ctx.strokeRect(rx, ry, rw, rh);
  }
}

// ── Parallax background ───────────────────────────────────────────────────────

let _stars = null, _bldgsFar = null, _bldgsMid = null;

export function drawParallaxBackground(ctx, cam, viewW, viewH, tick) {
  const grad = ctx.createLinearGradient(0, 0, 0, viewH);
  grad.addColorStop(0, '#03020d'); grad.addColorStop(0.55, '#07041a'); grad.addColorStop(1, '#0c0720');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, viewW, viewH);

  if (!_stars) _stars = _buildStars(viewW, viewH);
  for (const s of _stars) {
    const alpha = 0.2 + 0.25 * Math.sin(tick * 0.018 + s.phase);
    ctx.fillStyle = `rgba(200,200,255,${alpha.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(s.x - cam.x * 0.04, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }

  if (!_bldgsFar) _bldgsFar = _buildSilhouette(viewW, 60, 200, 24, 90);
  if (!_bldgsMid) _bldgsMid = _buildSilhouette(viewW, 40, 160, 18, 60);
  _drawSilhouette(ctx, _bldgsFar, cam.x * 0.12, viewH, viewW, '#060414');
  _drawSilhouette(ctx, _bldgsMid, cam.x * 0.25, viewH, viewW, '#04030f', tick);
}

function _drawSilhouette(ctx, buildings, offX, viewH, viewW, color, tick) {
  ctx.fillStyle = color;
  for (const b of buildings) {
    const bx = ((b.x - offX) % (viewW * 2) + viewW * 2) % (viewW * 2) - viewW * 0.3;
    if (bx + b.w < -2 || bx > viewW + 2) continue;
    const by = viewH - b.h;
    ctx.fillRect(bx, by, b.w, b.h);
    if (tick && b.windows) {
      for (const w of b.windows) {
        const fl = Math.sin(tick * 0.03 + w.seed) > 0.6 ? 0.18 : 0.07;
        ctx.fillStyle = `rgba(120,120,255,${fl})`;
        ctx.fillRect(bx + w.rx, by + w.ry, w.rw, w.rh);
        ctx.fillStyle = color;
      }
    }
  }
}

export function drawAtmosphere(ctx, cam, viewW, viewH, tick) {
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const seed = i * 137.5;
    const px = ((seed * 31.7 - cam.x * 0.6 + tick * (0.25 + (i % 3) * 0.15)) % viewW + viewW) % viewW;
    const py = (seed * 17.3 + tick * (0.12 + (i % 5) * 0.08)) % (viewH * 0.8);
    const a  = 0.03 + 0.03 * Math.sin(tick * 0.04 + seed);
    ctx.fillStyle = `rgba(160,120,255,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ── Sewer water ────────────────────────────────────────────────────────────────

export function drawSewerWater(ctx, cam, viewW, viewH, worldH, tick) {
  const waterWorldY = worldH - 70;
  const wy = waterWorldY - cam.y;
  if (wy > viewH || wy < -20) return;

  ctx.save();
  ctx.globalAlpha = 0.7 + 0.1 * Math.sin(tick * 0.1);
  ctx.fillStyle = '#052e16';
  ctx.fillRect(0, wy, viewW, viewH - wy + 20);

  // Surface shimmer
  ctx.strokeStyle = '#166534'; ctx.lineWidth = 2;
  for (let wx = 0; wx < viewW; wx += 30) {
    const wave = Math.sin((wx + tick * 2) * 0.05) * 3;
    ctx.beginPath(); ctx.moveTo(wx, wy + wave); ctx.lineTo(wx + 28, wy + wave); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // "TOXIC" label
  ctx.fillStyle = 'rgba(74,222,128,0.4)'; ctx.font = '9px monospace';
  ctx.textAlign = 'center'; ctx.fillText('TOXIC WATER', viewW/2, wy + 14); ctx.textAlign = 'left';
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function _buildStars(vw, vh) {
  return Array.from({ length: 130 }, () => ({
    x: Math.random() * vw, y: Math.random() * vh * 0.65,
    r: Math.random() * 1.3 + 0.3, phase: Math.random() * Math.PI * 2,
  }));
}

function _buildSilhouette(vw, minW, maxW, minH, maxH) {
  const out = []; let x = 0;
  while (x < vw * 2.2) {
    const w = minW + Math.random() * (maxW - minW);
    const h = minH + Math.random() * (maxH - minH);
    const windows = [];
    for (let wy = 8; wy < h - 10; wy += 12) {
      for (let wx = 6; wx < w - 6; wx += 10) {
        if (Math.random() > 0.45) windows.push({ rx:wx, ry:wy, rw:3, rh:5, seed:Math.random()*100 });
      }
    }
    out.push({ x, w, h, windows }); x += w + 3 + Math.random() * 18;
  }
  return out;
}
