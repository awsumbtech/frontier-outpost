import { TILE } from '../../data/mapConstants.js';

// ── Private color helpers ─────────────────────────────────────────────────────

/**
 * Parse "#rrggbb" (or "#rrggbbaa") to { r, g, b }.
 * Alpha channel is ignored.
 */
function hexToComponents(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

/** Convert { r, g, b } components (0–255) back to "#rrggbb". */
function componentsToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    clamp(r).toString(16).padStart(2, '0') +
    clamp(g).toString(16).padStart(2, '0') +
    clamp(b).toString(16).padStart(2, '0')
  );
}

/**
 * Darken a hex colour by `amount` (0–1 fraction of current brightness).
 * amount=0.2 → 20% darker.
 */
function darken(hexColor, amount) {
  const { r, g, b } = hexToComponents(hexColor);
  const factor = 1 - amount;
  return componentsToHex(r * factor, g * factor, b * factor);
}

/**
 * Lighten a hex colour by `amount` (0–1 fraction toward white).
 * amount=0.2 → 20% lighter.
 */
function lighten(hexColor, amount) {
  const { r, g, b } = hexToComponents(hexColor);
  return componentsToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/** Convert "#rrggbb" to the 0xRRGGBB integer Phaser expects. */
function toInt(hexColor) {
  return parseInt(hexColor.replace('#', ''), 16);
}

// ── Tile drawing helpers ──────────────────────────────────────────────────────

const TILE_W = 32;
const TILE_H = 32;

/** Fill the entire tile cell with a solid colour. */
function fillTile(gfx, tileIndex, hexColor, alpha = 1) {
  gfx.fillStyle(toInt(hexColor), alpha);
  gfx.fillRect(tileIndex * TILE_W, 0, TILE_W, TILE_H);
}

/** Draw the floor base with subtle horizontal grating lines every 8px. */
function drawFloor(gfx, tileIndex, floorHex) {
  const x = tileIndex * TILE_W;

  // Base fill
  gfx.fillStyle(toInt(floorHex), 1);
  gfx.fillRect(x, 0, TILE_W, TILE_H);

  // Horizontal lines every 8px — slightly darker, low alpha for grating feel
  const lineColor = darken(floorHex, 0.3);
  gfx.fillStyle(toInt(lineColor), 0.15);
  for (let ly = 0; ly < TILE_H; ly += 8) {
    gfx.fillRect(x, ly, TILE_W, 1);
  }
}

/** Draw a wall tile with 2px highlight on top and left edges. */
function drawWall(gfx, tileIndex, wallHex) {
  const x = tileIndex * TILE_W;
  const base = darken(wallHex, 0.2);

  // Darker base
  gfx.fillStyle(toInt(base), 1);
  gfx.fillRect(x, 0, TILE_W, TILE_H);

  // 2px highlight — top edge
  const hi = lighten(wallHex, 0.35);
  gfx.fillStyle(toInt(hi), 1);
  gfx.fillRect(x, 0, TILE_W, 2);

  // 2px highlight — left edge
  gfx.fillRect(x, 0, 2, TILE_H);
}

/** Draw an obstacle tile with a 3px inset bevel border. */
function drawObstacle(gfx, tileIndex, obstacleHex) {
  const x = tileIndex * TILE_W;

  // Base fill
  gfx.fillStyle(toInt(obstacleHex), 1);
  gfx.fillRect(x, 0, TILE_W, TILE_H);

  const hiColor = lighten(obstacleHex, 0.4);
  const shColor = darken(obstacleHex, 0.4);
  const bw = 3; // border width

  // Lighter top edge
  gfx.fillStyle(toInt(hiColor), 1);
  gfx.fillRect(x, 0, TILE_W, bw);

  // Lighter left edge
  gfx.fillRect(x, 0, bw, TILE_H);

  // Darker bottom edge
  gfx.fillStyle(toInt(shColor), 1);
  gfx.fillRect(x, TILE_H - bw, TILE_W, bw);

  // Darker right edge
  gfx.fillRect(x + TILE_W - bw, 0, bw, TILE_H);
}

/** Draw an encounter zone: floor base with subtle encounterZone colour overlay. */
function drawEncounterZone(gfx, tileIndex, floorHex, encounterHex) {
  const x = tileIndex * TILE_W;

  // Floor base first
  gfx.fillStyle(toInt(floorHex), 1);
  gfx.fillRect(x, 0, TILE_W, TILE_H);

  // Grating lines (same as drawFloor)
  const lineColor = darken(floorHex, 0.3);
  gfx.fillStyle(toInt(lineColor), 0.15);
  for (let ly = 0; ly < TILE_H; ly += 8) {
    gfx.fillRect(x, ly, TILE_W, 1);
  }

  // Reddish encounterZone overlay at 0.3 alpha
  // Strip any alpha suffix from the hex before converting
  const encounterBase = '#' + encounterHex.replace('#', '').slice(0, 6);
  gfx.fillStyle(toInt(encounterBase), 0.3);
  gfx.fillRect(x, 0, TILE_W, TILE_H);
}

/** Draw a spawn tile: floor base + 2 small cyan corner marks. */
function drawSpawn(gfx, tileIndex, floorHex) {
  const x = tileIndex * TILE_W;

  // Floor base with grating
  gfx.fillStyle(toInt(floorHex), 1);
  gfx.fillRect(x, 0, TILE_W, TILE_H);

  const lineColor = darken(floorHex, 0.3);
  gfx.fillStyle(toInt(lineColor), 0.15);
  for (let ly = 0; ly < TILE_H; ly += 8) {
    gfx.fillRect(x, ly, TILE_W, 1);
  }

  // Cyan corner marks — 4×4 px squares at top-left and bottom-right
  const CYAN = 0x00ffcc;
  const ms = 4; // mark size
  gfx.fillStyle(CYAN, 1);
  gfx.fillRect(x + 2, 2, ms, ms);                               // top-left
  gfx.fillRect(x + TILE_W - ms - 2, TILE_H - ms - 2, ms, ms);  // bottom-right
}

/** Draw an exit tile: floor base + small orange diamond/arrow in centre. */
function drawExit(gfx, tileIndex, floorHex) {
  const x = tileIndex * TILE_W;

  // Floor base with grating
  gfx.fillStyle(toInt(floorHex), 1);
  gfx.fillRect(x, 0, TILE_W, TILE_H);

  const lineColor = darken(floorHex, 0.3);
  gfx.fillStyle(toInt(lineColor), 0.15);
  for (let ly = 0; ly < TILE_H; ly += 8) {
    gfx.fillRect(x, ly, TILE_W, 1);
  }

  // Orange diamond centred in the tile using a rotated square approximation.
  // We draw it as a small filled triangle strip using individual pixel rows.
  const ORANGE = 0xff8800;
  const cx = x + TILE_W / 2;
  const cy = TILE_H / 2;
  const half = 6; // half-width of diamond

  gfx.fillStyle(ORANGE, 1);
  for (let dy = -half; dy <= half; dy++) {
    const hw = half - Math.abs(dy);
    gfx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a horizontal tileset texture for the given environment palette.
 *
 * The texture is keyed `tileset-{paletteId}` and contains 7 32×32 tiles laid
 * out side by side (total 224×32), one frame per TILE constant:
 *
 *   Index 0  TILE.VOID           — solid black
 *   Index 1  TILE.FLOOR          — floor with metal grating lines
 *   Index 2  TILE.WALL           — dark wall with top/left highlight
 *   Index 3  TILE.OBSTACLE       — 3D-bevelled obstacle block
 *   Index 4  TILE.ENCOUNTER_ZONE — floor + reddish overlay
 *   Index 5  TILE.SPAWN          — floor + cyan corner marks
 *   Index 6  TILE.EXIT           — floor + orange diamond marker
 *
 * @param {Phaser.Scene} scene     - The active Phaser scene (provides graphics + texture cache)
 * @param {object}       palette   - Palette object from a GENERATOR_PROFILES entry
 * @param {string}       paletteId - Unique identifier (used as texture key suffix)
 */
export function generateTileset(scene, palette, paletteId) {
  const key = `tileset-${paletteId}`;

  // Return early if already generated this session
  if (scene.textures.exists(key)) return;

  const TOTAL_TILES = 7; // TILE values 0–6
  const SHEET_W = TOTAL_TILES * TILE_W;
  const SHEET_H = TILE_H;

  // Off-screen graphics context — never added to the scene display list
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });

  // ── Tile 0: VOID ───────────────────────────────────────────────────────────
  fillTile(gfx, TILE.VOID, '#0a0c10');

  // ── Tile 1: FLOOR ──────────────────────────────────────────────────────────
  drawFloor(gfx, TILE.FLOOR, palette.floor);

  // ── Tile 2: WALL ───────────────────────────────────────────────────────────
  drawWall(gfx, TILE.WALL, palette.wall);

  // ── Tile 3: OBSTACLE ───────────────────────────────────────────────────────
  drawObstacle(gfx, TILE.OBSTACLE, palette.obstacle);

  // ── Tile 4: ENCOUNTER_ZONE ─────────────────────────────────────────────────
  drawEncounterZone(gfx, TILE.ENCOUNTER_ZONE, palette.floor, palette.encounterZone);

  // ── Tile 5: SPAWN ──────────────────────────────────────────────────────────
  drawSpawn(gfx, TILE.SPAWN, palette.floor);

  // ── Tile 6: EXIT ───────────────────────────────────────────────────────────
  drawExit(gfx, TILE.EXIT, palette.floor);

  // Bake all graphics commands into a named texture
  gfx.generateTexture(key, SHEET_W, SHEET_H);

  // Register individual frame definitions so callers can use tileIndex directly
  const texture = scene.textures.get(key);
  for (let i = 0; i < TOTAL_TILES; i++) {
    texture.add(i, 0, i * TILE_W, 0, TILE_W, TILE_H);
  }

  // Release the off-screen graphics object
  gfx.destroy();
}
