// Dev tools toggled at runtime with function keys.
// F1 = hitboxes, F2 = heal, F3 = enemy sight, F4 = next level, F5 = NPC teleport

export const dev = {
  hitboxes:  false,
  sight:     false,
  nextLevel: false,
  npcMenu: { open: false, selectedIdx: 0 },
};

// npcs: array of { name, x, y } objects — built each frame by App.jsx
export function handleDevKeys(justPressed, player, npcs = []) {
  if (justPressed['F1']) dev.hitboxes = !dev.hitboxes;
  if (justPressed['F3']) dev.sight    = !dev.sight;
  if (justPressed['F2']) {
    player.health = player.maxHealth;
    player.invincibleTimer = 0;
  }
  if (justPressed['F4']) dev.nextLevel = true;

  // F5: toggle NPC teleporter menu
  if (justPressed['F5']) {
    dev.npcMenu.open = !dev.npcMenu.open;
    dev.npcMenu.selectedIdx = 0;
  }

  if (dev.npcMenu.open && npcs.length > 0) {
    // Navigate — consume arrow keys so they don't affect gameplay
    if (justPressed['ArrowUp']) {
      dev.npcMenu.selectedIdx = Math.max(0, dev.npcMenu.selectedIdx - 1);
      delete justPressed['ArrowUp'];
    }
    if (justPressed['ArrowDown']) {
      dev.npcMenu.selectedIdx = Math.min(npcs.length - 1, dev.npcMenu.selectedIdx + 1);
      delete justPressed['ArrowDown'];
    }
    // Escape to close
    if (justPressed['Escape']) {
      dev.npcMenu.open = false;
    }
    // Space or Enter to teleport
    if (justPressed[' '] || justPressed['Enter']) {
      const t = npcs[dev.npcMenu.selectedIdx];
      if (t) {
        player.x = t.x;
        player.y = t.y;
        player.vx = 0;
        player.vy = 0;
      }
      dev.npcMenu.open = false;
      delete justPressed[' '];   // prevent jump on same frame
      delete justPressed['Enter'];
    }
  }
}

export function drawDevOverlay(ctx, cam, player, enemies, getAttackHitbox, miniboss = null) {
  if (!dev.hitboxes && !dev.sight) return;

  const { x: cx, y: cy } = cam;

  if (dev.hitboxes) {
    _box(ctx, player.x - cx, player.y - cy, player.w, player.h, 'rgba(0,255,0,0.5)');
    const ah = getAttackHitbox(player);
    if (ah) _box(ctx, ah.x - cx, ah.y - cy, ah.w, ah.h, 'rgba(255,80,0,0.6)');
    for (const e of enemies) {
      if (!e.alive) continue;
      _box(ctx, e.x - cx, e.y - cy, e.w, e.h, 'rgba(255,0,0,0.4)');
    }
  }

  if (dev.sight) {
    for (const e of enemies) {
      if (!e.alive) continue;
      const ex = e.x - cx, ey = e.y - cy;
      const range = e.sightRange || 180;
      ctx.strokeStyle = e.alerted ? 'rgba(255,60,0,0.5)' : 'rgba(0,200,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex - range, ey - (e.sightHeight || 60), range * 2 + e.w, (e.sightHeight || 60) * 2 + e.h);
    }

    // Drone Commander patrol radius
    if (miniboss && miniboss.alive) {
      const mx = miniboss.x + miniboss.w / 2 - cx;
      const my = miniboss.y + miniboss.h / 2 - cy;
      const r  = miniboss.droneRadius || 310;
      ctx.strokeStyle = 'rgba(255,210,0,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,210,0,0.8)';
      ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('DRONE ZONE', mx, my - r - 4);
      ctx.textAlign = 'left';
    }
  }
}

// Draw the NPC teleport menu overlay (call after everything else)
export function drawNpcMenu(ctx, npcs, viewW, viewH) {
  if (!dev.npcMenu.open) return;

  const mw = 220, itemH = 26;
  const mh = 48 + npcs.length * itemH;
  const mx = Math.floor(viewW / 2 - mw / 2);
  const my = Math.floor(viewH / 2 - mh / 2);

  // Panel
  ctx.save();
  ctx.fillStyle = 'rgba(4,2,14,0.92)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5;
  ctx.strokeRect(mx, my, mw, mh);

  // Title
  ctx.font = 'bold 11px monospace'; ctx.fillStyle = '#a78bfa';
  ctx.textAlign = 'center';
  ctx.fillText('▸ TELEPORT TO NPC', viewW / 2, my + 18);

  // Separator
  ctx.strokeStyle = '#2d1b69'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx + 10, my + 26); ctx.lineTo(mx + mw - 10, my + 26); ctx.stroke();

  // NPC list
  ctx.textAlign = 'left';
  ctx.font = '10px monospace';
  if (npcs.length === 0) {
    ctx.fillStyle = '#3b1764';
    ctx.fillText('No NPCs in this level', mx + 16, my + 44);
  } else {
    npcs.forEach((npc, i) => {
      const selected = i === dev.npcMenu.selectedIdx;
      const ry = my + 38 + i * itemH;
      if (selected) {
        ctx.fillStyle = 'rgba(124,58,237,0.25)';
        ctx.fillRect(mx + 4, ry - 12, mw - 8, itemH - 2);
        ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 6;
        ctx.fillStyle = '#00ffcc';
        ctx.fillText('▶', mx + 10, ry);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#4c2d7a';
        ctx.fillText('  ', mx + 10, ry);
      }
      ctx.fillStyle = selected ? '#e0d4ff' : '#6d5a8a';
      ctx.fillText(npc.name, mx + 26, ry);
    });
  }

  // Hint
  ctx.font = '8px monospace'; ctx.fillStyle = '#2d1b69'; ctx.textAlign = 'center';
  ctx.fillText('↑↓ navigate  ·  Space/Enter select  ·  Esc close', viewW / 2, my + mh - 8);

  ctx.restore();
  ctx.textAlign = 'left';
}

function _box(ctx, x, y, w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}
