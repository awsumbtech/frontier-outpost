import { TILE } from "../../../data/mapConstants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Carve a single floor tile, clamping to the interior of the grid. */
function carveTile(terrain, x, y, width, height) {
  if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
    terrain[y][x] = TILE.FLOOR;
  }
}

/**
 * Carve a square brush of radius `r` centred at (cx, cy).
 * tunnelWidth 1 → single tile, 2 → 3×3 brush, 3 → 5×5 brush, etc.
 */
function carveBrush(terrain, cx, cy, radius, width, height) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      carveTile(terrain, cx + dx, cy + dy, width, height);
    }
  }
}

/**
 * Carve a rectangular chamber. Origin (x, y) is the top-left corner.
 * Clamped to leave at least 1-tile wall border.
 */
function carveRect(terrain, x, y, w, h, mapW, mapH) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      carveTile(terrain, col, row, mapW, mapH);
    }
  }
}

/**
 * Carve an axis-aligned ellipse centred at (cx, cy) with radii (rx, ry).
 * Uses the standard ellipse equation: (dx/rx)² + (dy/ry)² <= 1
 */
function carveEllipse(terrain, cx, cy, rx, ry, mapW, mapH) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0) {
        carveTile(terrain, cx + dx, cy + dy, mapW, mapH);
      }
    }
  }
}

/**
 * Drunkard's walk from (x, y) toward target (tx, ty).
 * At each step, 70 % chance of stepping toward the target, 30 % random.
 * Carves a brush of the given radius at every position.
 * Returns when the walker reaches within 1 tile of the target.
 */
function drunkardWalk(terrain, x, y, tx, ty, brushRadius, branchChance, rng, width, height) {
  const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const MAX_STEPS = (width + height) * 4; // safety cap

  let cx = x;
  let cy = y;

  for (let step = 0; step < MAX_STEPS; step++) {
    carveBrush(terrain, cx, cy, brushRadius, width, height);

    // Arrived close enough?
    if (Math.abs(cx - tx) <= 1 && Math.abs(cy - ty) <= 1) break;

    // 70 % bias toward target
    let dx, dy;
    if (rng.chance(0.70)) {
      dx = Math.sign(tx - cx);
      dy = Math.sign(ty - cy);
      // Move orthogonally: pick horizontal or vertical bias randomly
      if (dx !== 0 && dy !== 0) {
        if (rng.chance(0.5)) dx = 0;
        else dy = 0;
      }
    } else {
      [dx, dy] = rng.pick(DIRS);
    }

    cx = Math.max(1, Math.min(width - 2, cx + dx));
    cy = Math.max(1, Math.min(height - 2, cy + dy));

    // Branch tunnel?
    if (rng.chance(branchChance)) {
      const branchLen = rng.nextInt(10, 20);
      const [bdx, bdy] = rng.pick(DIRS);
      let bx = cx;
      let by = cy;
      for (let b = 0; b < branchLen; b++) {
        bx = Math.max(1, Math.min(width - 2, bx + bdx));
        by = Math.max(1, Math.min(height - 2, by + bdy));
        carveBrush(terrain, bx, by, brushRadius, width, height);
      }
    }
  }
}

/**
 * One pass of cellular automata smoothing.
 * Wall if >= 5 of its 8 neighbours are walls; otherwise floor.
 * Border row/columns are always left as WALL.
 */
function smoothPass(terrain, width, height) {
  const next = terrain.map(row => [...row]);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let wallCount = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (terrain[y + dy][x + dx] === TILE.WALL) wallCount++;
        }
      }
      next[y][x] = wallCount >= 5 ? TILE.WALL : TILE.FLOOR;
    }
  }

  return next;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate a cavern-style map using drunkard's walk tunnels and chambers.
 *
 * @param {number} width   - Map width in tiles
 * @param {number} height  - Map height in tiles
 * @param {object} params  - Generation parameters (see defaults below)
 * @param {object} rng     - Seeded PRNG (createRng instance)
 * @returns {number[][]}   - 2D terrain array [y][x] of TILE constants
 */
export function generateCavern(width, height, params, rng) {
  const {
    tunnelCount    = 5,
    tunnelWidth    = 2,
    branchChance   = 0.15,
    chamberCount   = 4,
    chamberMinSize = 4,
    chamberMaxSize = 8,
    smoothPasses   = 2,
  } = params;

  // Brush radius from tunnelWidth (1 → r=0, 2 → r=1, 3 → r=1, 4 → r=2 …)
  const brushRadius = Math.max(0, Math.floor((tunnelWidth - 1) / 2));

  // Half of the largest possible chamber, used as placement padding so
  // chambers don't get placed too close to the border.
  const maxHalfChamber = Math.ceil(chamberMaxSize / 2);
  const pad = maxHalfChamber + 1;

  // -------------------------------------------------------------------------
  // 1. Fill with WALL
  // -------------------------------------------------------------------------
  let terrain = Array.from({ length: height }, () => new Array(width).fill(TILE.WALL));

  // -------------------------------------------------------------------------
  // 2. Place chambers
  // -------------------------------------------------------------------------
  const centers = []; // [{x, y}] — chamber centres in placement order

  const placementW = Math.max(1, width  - pad * 2);
  const placementH = Math.max(1, height - pad * 2);

  for (let i = 0; i < chamberCount; i++) {
    const cx = pad + rng.nextInt(0, placementW - 1);
    const cy = pad + rng.nextInt(0, placementH - 1);
    centers.push({ x: cx, y: cy });

    const sizeW = rng.nextInt(chamberMinSize, chamberMaxSize);
    const sizeH = rng.nextInt(chamberMinSize, chamberMaxSize);

    // Randomly choose ellipse or rectangle
    if (rng.chance(0.5)) {
      const rx = Math.floor(sizeW / 2);
      const ry = Math.floor(sizeH / 2);
      carveEllipse(terrain, cx, cy, rx, ry, width, height);
    } else {
      const ox = cx - Math.floor(sizeW / 2);
      const oy = cy - Math.floor(sizeH / 2);
      carveRect(terrain, ox, oy, sizeW, sizeH, width, height);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Connect adjacent chambers with drunkard's walk
  //    Also add (tunnelCount - (chamberCount - 1)) extra random tunnels
  //    if tunnelCount exceeds the minimum needed for connectivity.
  // -------------------------------------------------------------------------
  const minTunnels = Math.max(0, chamberCount - 1);

  // Connect chamber i → chamber i+1 (chain ensures all chambers reachable)
  for (let i = 0; i < minTunnels; i++) {
    const a = centers[i];
    const b = centers[i + 1];
    drunkardWalk(terrain, a.x, a.y, b.x, b.y, brushRadius, branchChance, rng, width, height);
  }

  // Extra tunnels: connect random chamber pairs for more organic looping
  const extraTunnels = Math.max(0, tunnelCount - minTunnels);
  for (let i = 0; i < extraTunnels; i++) {
    const a = rng.pick(centers);
    const b = rng.pick(centers);
    if (a !== b) {
      drunkardWalk(terrain, a.x, a.y, b.x, b.y, brushRadius, branchChance, rng, width, height);
    }
  }

  // -------------------------------------------------------------------------
  // 4. Smooth with cellular automata
  // -------------------------------------------------------------------------
  for (let pass = 0; pass < smoothPasses; pass++) {
    terrain = smoothPass(terrain, width, height);
  }

  // -------------------------------------------------------------------------
  // 5. Return terrain
  // -------------------------------------------------------------------------
  return terrain;
}
