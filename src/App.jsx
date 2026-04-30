import React, { useEffect, useRef, useCallback } from 'react';

// Core
import { applyGravity }                         from './game/physics.js';
import { createCamera, updateCamera }           from './game/camera.js';
import { resolvePlatforms, aabb }               from './game/collision.js';

// World
import {
  WORLD_W, WORLD_H, GROUND_Y,
  buildPlatforms, buildShards, buildEnemies,
  buildCheckpoints, buildWhiskers, buildZoneSigns,
} from './world/level1.js';
import { drawPlatforms, drawParallaxBackground, drawAtmosphere } from './world/platforms.js';

// Entities
import { createPlayer, updatePlayer, getAttackHitbox, drawPlayer } from './entities/player.js';
import { updateEnemies, checkEnemyPlayerContact, checkAttackVsEnemies, drawEnemies } from './entities/enemies.js';
import { updateShards, updateCheckpoints, drawShards, drawZoneSigns } from './entities/collectibles.js';

// UI
import { drawHUD, drawNotification, drawIntroScreen, drawGameOver, drawVictory } from './ui/hud.js';
import { updateWhiskers, drawWhiskers, drawStoryBeat, drawZoneTitle } from './ui/dialogue.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const VIEW_W = 900;
const VIEW_H = 560;
const INVINCIBLE_FRAMES = 80;

const ZONE_TITLES = [
  { sector: 'SECTOR-0', name: 'The Outskirts' },
  { sector: 'DISTRICT-7', name: 'Industrial Ruins' },
  { sector: 'UPPER-GRID', name: 'Neon Rooftops' },
  { sector: 'BRIDGE-COLLAPSE', name: 'The Void Bridge' },
  { sector: 'END-RUINS', name: 'Edge of Memory' },
];

const SHARD_STORIES = {
  1: '"I remember… how to leap."',
  2: '"The claws… they respond."',
  3: '"Speed.  Purpose.  Power."',
};

// ── Build fresh game state ────────────────────────────────────────────────────
function buildGameState() {
  const checkpoints = buildCheckpoints();
  const spawn       = checkpoints[0];
  return {
    player:         createPlayer(spawn.x, spawn.y),
    platforms:      buildPlatforms(),
    shards:         buildShards(),
    enemies:        buildEnemies(),
    checkpoints,
    whiskers:       buildWhiskers(),
    zoneSigns:      buildZoneSigns(),
    camera:         createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H),
    checkpointIdx:  0,
    phase: 'intro', // 'intro' | 'playing' | 'gameover' | 'victory'
    // Notification
    notif: null,              // { text, alpha }
    // Story beat below player
    story: null,              // { text, alpha }
    // Zone title
    zoneTitle: null,          // { zone, alpha }
    lastZone: -1,
  };
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef(null);
  const keysRef    = useRef({});
  const prevRef    = useRef({});   // previous-frame keys
  const rafRef     = useRef(null);
  const tickRef    = useRef(0);

  // ── Init / restart ─────────────────────────────────────────────
  const initGame = useCallback(() => {
    stateRef.current = buildGameState();
    tickRef.current  = 0;
  }, []);

  // ── Input ──────────────────────────────────────────────────────
  useEffect(() => {
    initGame();

    const onDown = (e) => {
      const g = stateRef.current;
      if (!g) return;

      // Suppress scroll
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      keysRef.current[e.key] = true;

      if (e.key === 'Enter' && g.phase === 'intro') g.phase = 'playing';

      if ((e.key === 'r' || e.key === 'R') && g.phase !== 'playing') {
        initGame();
        stateRef.current.phase = 'playing';
      }
    };

    const onUp = (e) => { keysRef.current[e.key] = false; };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, [initGame]);

  // ── Game loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      tickRef.current++;
      const tick = tickRef.current;
      const g    = stateRef.current;
      const keys = keysRef.current;

      // Keys pressed this frame only
      const justPressed = {};
      for (const k in keys) {
        if (keys[k] && !prevRef.current[k]) justPressed[k] = true;
      }

      // ── Clear ──────────────────────────────────────────────────
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);

      if (!g) { rafRef.current = requestAnimationFrame(loop); return; }

      const { player, platforms, shards, enemies, checkpoints, whiskers,
              zoneSigns, camera } = g;

      // ── Background (always drawn) ──────────────────────────────
      drawParallaxBackground(ctx, camera, VIEW_W, VIEW_H, tick);

      // ── Intro phase ────────────────────────────────────────────
      if (g.phase === 'intro') {
        drawIntroScreen(ctx, VIEW_W, VIEW_H, tick);
        prevRef.current = { ...keys };
        rafRef.current  = requestAnimationFrame(loop);
        return;
      }

      // ══════════════════════════════════════════════════════════
      //  SIMULATION
      // ══════════════════════════════════════════════════════════
      if (g.phase === 'playing') {

        // 1. Gravity (modifies vy)
        applyGravity(player);

        // 2. Player input + velocity application
        updatePlayer(player, keys, justPressed, WORLD_W);

        // 3. Platform collision
        resolvePlatforms(player, platforms);

        // 4. World-bottom death check
        if (player.y > WORLD_H + 60) {
          _respawnPlayer(player, checkpoints, g.checkpointIdx);
        }

        // 5. Shards
        const shardId = updateShards(shards, player);
        if (shardId !== null) {
          g.notif = { text: `✦ CORE SHARD ${shardId} — ${_abilityName(shardId)} UNLOCKED!`, alpha: 1 };
          g.story = { text: SHARD_STORIES[shardId] || '', alpha: 1 };
        }

        // 6. Checkpoint progression
        g.checkpointIdx = updateCheckpoints(checkpoints, player, g.checkpointIdx);

        // 7. Update player's spawn to latest checkpoint
        const cp = checkpoints[g.checkpointIdx];
        player.spawnX = cp.x;
        player.spawnY = cp.y;

        // 8. Enemies
        updateEnemies(enemies, platforms, WORLD_W);

        // 9. Enemy → player damage
        if (checkEnemyPlayerContact(enemies, player)) {
          player.health--;
          player.invincibleTimer = INVINCIBLE_FRAMES;
          if (player.health <= 0) g.phase = 'gameover';
        }

        // 10. Attack → enemies
        const hitbox = getAttackHitbox(player);
        checkAttackVsEnemies(hitbox, enemies);

        // 11. Camera
        updateCamera(camera, player);

        // 12. Whiskers NPC
        updateWhiskers(whiskers, player);

        // 13. Zone detection
        const zone = _detectZone(player.x);
        if (zone !== g.lastZone) {
          g.lastZone  = zone;
          g.zoneTitle = { zone: ZONE_TITLES[zone] || ZONE_TITLES[0], alpha: 1 };
        }

        // 14. Fade notifications
        if (g.notif) {
          g.notif.alpha -= 0.007;
          if (g.notif.alpha <= 0) g.notif = null;
        }
        if (g.story) {
          g.story.alpha -= 0.006;
          if (g.story.alpha <= 0) g.story = null;
        }
        if (g.zoneTitle) {
          if (g.zoneTitle.alpha > 0.01) g.zoneTitle.alpha -= 0.006;
        }

        // 15. Victory
        if (shards.every(s => s.collected)) g.phase = 'victory';
      }

      // ══════════════════════════════════════════════════════════
      //  RENDER
      // ══════════════════════════════════════════════════════════
      drawAtmosphere(ctx, camera, VIEW_W, VIEW_H, tick);
      drawPlatforms(ctx, platforms, camera);
      drawZoneSigns(ctx, zoneSigns, camera);
      drawShards(ctx, shards, camera, tick);
      drawEnemies(ctx, enemies, camera, tick);
      drawWhiskers(ctx, whiskers, camera);
      drawPlayer(ctx, player, camera);

      // UI overlays
      drawHUD(ctx, player, VIEW_W);
      if (g.notif)     drawNotification(ctx, g.notif.text,  g.notif.alpha,  VIEW_W);
      if (g.story)     drawStoryBeat(ctx,   g.story.text,   g.story.alpha,  VIEW_W, VIEW_H);
      if (g.zoneTitle) drawZoneTitle(ctx,   g.zoneTitle.zone, g.zoneTitle.alpha, VIEW_W);

      if (g.phase === 'gameover') drawGameOver(ctx, VIEW_W, VIEW_H);
      if (g.phase === 'victory')  drawVictory(ctx,  VIEW_W, VIEW_H, tick);

      // Save keys for next frame's justPressed
      prevRef.current = { ...keys };
      rafRef.current  = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={VIEW_W}
        height={VIEW_H}
        style={styles.canvas}
      />
      <div style={styles.bar}>
        A/D move &nbsp;·&nbsp; W jump &nbsp;·&nbsp; SPACE attack (after Shard 2)
        &nbsp;·&nbsp; SHIFT dash (after Shard 3) &nbsp;·&nbsp; R restart
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _respawnPlayer(player, checkpoints, idx) {
  const cp = checkpoints[idx];
  player.x  = cp.x;
  player.y  = cp.y;
  player.vx = 0;
  player.vy = 0;
  player.invincibleTimer = 80;
  player.health = Math.max(0, player.health - 1);
}

function _abilityName(id) {
  return ['', 'DOUBLE JUMP', 'CLAW ATTACK', 'CYBER DASH'][id] || '';
}

function _detectZone(playerX) {
  if (playerX < 1200) return 0;
  if (playerX < 2500) return 1;
  if (playerX < 3300) return 2;
  if (playerX < 3860) return 3;
  return 4;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    userSelect: 'none',
  },
  canvas: {
    border: '2px solid #1e0a4e',
    borderRadius: '3px',
    display: 'block',
  },
  bar: {
    color: '#2d1b69',
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '0.03em',
  },
};
