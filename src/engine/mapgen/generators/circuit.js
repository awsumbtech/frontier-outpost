import { TILE } from "../../../data/mapConstants";
import { floodFill } from "../pathfinding";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Carve a filled rectangle into terrain as FLOOR.
 * Clamps to the interior of the grid (never overwrites the 1-tile border).
 */
function carveRect(terrain, x, y, w, h, mapW, mapH) {
  const x1 = Math.max(1, x);
  const y1 = Math.max(1, y);
  const x2 = Math.min(mapW - 2, x + w - 1);
  const y2 = Math.min(mapH - 2, y + h - 1);
  for (let row = y1; row <= y2; row++) {
    for (let col = x1; col <= x2; col++) {
      terrain[row][col] = TILE.FLOOR;
    }
  }
}

/**
 * Find the first FLOOR tile in the grid (top-left scan order).
 * Returns {x, y} or null if no FLOOR tile exists.
 */
function findFirstFloor(terrain, mapW, mapH) {
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      if (terrain[y][x] === TILE.FLOOR) return { x, y };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate a circuit-style map: a rectangular loop path around the perimeter
 * of the interior, with interior shortcuts, alcoves branching inward, and
 * optional wall-mass decoration.
 *
 * Returns a 2D terrain[y][x] array containing only TILE.WALL or TILE.FLOOR.
 * The postprocessor handles spawn, exit, encounter zones, and obstacles.
 *
 * @param {number} width          - Map width in tiles
 * @param {number} height         - Map height in tiles
 * @param {object} params         - Generation parameters (see defaults below)
 * @param {object} rng            - Seeded PRNG from seededRandom.js
 * @returns {number[][]}          - terrain[y][x] of TILE.WALL | TILE.FLOOR
 */
export function generateCircuit(width, height, params, rng) {
  const {
    pathWidth      = 3,
    shortcuts      = 2,
    alcoves        = 3,
    interiorDetail = 0.3,
  } = params;

  // The inset defines how far from each map edge the loop path sits.
  // Keep at least 2 tiles so the outer wall is always solid.
  const INSET = Math.max(2, Math.ceil(pathWidth / 2) + 1);

  // Loop boundary coordinates (outer edge of the loop path, inside inset).
  const loopLeft   = INSET;
  const loopRight  = width  - 1 - INSET;
  const loopTop    = INSET;
  const loopBottom = height - 1 - INSET;

  // Safety: if the map is too small to fit a loop, just carve a single room.
  if (loopRight - loopLeft < pathWidth * 2 || loopBottom - loopTop < pathWidth * 2) {
    const terrain = Array.from({ length: height }, () => new Array(width).fill(TILE.WALL));
    carveRect(terrain, INSET, INSET, width - INSET * 2, height - INSET * 2, width, height);
    return terrain;
  }

  // ── 1. Initialise grid to all WALL ──────────────────────────────────────────
  const terrain = Array.from({ length: height }, () => new Array(width).fill(TILE.WALL));

  // ── 2. Carve the perimeter loop ─────────────────────────────────────────────
  // The loop is a rectangular ring of FLOOR `pathWidth` tiles thick.
  // We carve four rectangular strips for the four sides, then slightly widen
  // the corners so the turns feel rounded.

  const pw = pathWidth; // shorthand

  // Top strip  (horizontal, top of loop)
  carveRect(terrain, loopLeft, loopTop, loopRight - loopLeft + 1, pw, width, height);
  // Bottom strip
  carveRect(terrain, loopLeft, loopBottom - pw + 1, loopRight - loopLeft + 1, pw, width, height);
  // Left strip  (vertical, excludes corners already carved above)
  carveRect(terrain, loopLeft, loopTop, pw, loopBottom - loopTop + 1, width, height);
  // Right strip
  carveRect(terrain, loopRight - pw + 1, loopTop, pw, loopBottom - loopTop + 1, width, height);

  // Round/smooth corners — carve one extra tile diagonally inward at each corner
  const cornerExtra = Math.max(1, Math.floor(pw / 2));
  const corners = [
    { x: loopLeft  + pw,           y: loopTop    + pw },           // top-left inner
    { x: loopRight - pw - cornerExtra + 1, y: loopTop    + pw },   // top-right inner
    { x: loopLeft  + pw,           y: loopBottom - pw - cornerExtra + 1 }, // bottom-left
    { x: loopRight - pw - cornerExtra + 1, y: loopBottom - pw - cornerExtra + 1 }, // bottom-right
  ];
  for (const c of corners) {
    carveRect(terrain, c.x, c.y, cornerExtra, cornerExtra, width, height);
  }

  // ── 3. Add shortcuts ────────────────────────────────────────────────────────
  // Each shortcut is a 2-tile-wide corridor cutting straight across the interior.
  // Alternate between horizontal (left→right) and vertical (top→bottom) shortcuts.
  const shortcutWidth = 2;

  for (let i = 0; i < shortcuts; i++) {
    if (i % 2 === 0) {
      // Horizontal shortcut: connects left side to right side
      // Pick a random Y position in the interior (not overlapping the loop strips)
      const interiorTop    = loopTop    + pw + 1;
      const interiorBottom = loopBottom - pw - shortcutWidth;
      if (interiorBottom > interiorTop) {
        const sy = rng.nextInt(interiorTop, interiorBottom);
        // Span from left loop path to right loop path
        carveRect(terrain, loopLeft, sy, loopRight - loopLeft + 1, shortcutWidth, width, height);
      }
    } else {
      // Vertical shortcut: connects top side to bottom side
      const interiorLeft  = loopLeft  + pw + 1;
      const interiorRight = loopRight - pw - shortcutWidth;
      if (interiorRight > interiorLeft) {
        const sx = rng.nextInt(interiorLeft, interiorRight);
        // Span from top loop path to bottom loop path
        carveRect(terrain, sx, loopTop, shortcutWidth, loopBottom - loopTop + 1, width, height);
      }
    }
  }

  // ── 4. Add alcoves ──────────────────────────────────────────────────────────
  // Alcoves are small rectangular pockets branching inward from the main loop.
  // We pick a random side and a random position along that side, then carve
  // a room extending toward the interior.

  const sides = ["top", "bottom", "left", "right"];

  for (let i = 0; i < alcoves; i++) {
    const side = rng.pick(sides);
    const alcoveDepth = rng.nextInt(3, 5);   // tiles deep (inward)
    const alcoveWidth = rng.nextInt(3, 4);   // tiles wide (along the side)

    if (side === "top") {
      // Branch downward from the top strip
      const minX = loopLeft + pw;
      const maxX = loopRight - pw - alcoveWidth;
      if (maxX >= minX) {
        const ax = rng.nextInt(minX, maxX);
        const ay = loopTop + pw; // starts just inside the top strip
        carveRect(terrain, ax, ay, alcoveWidth, alcoveDepth, width, height);
      }
    } else if (side === "bottom") {
      // Branch upward from the bottom strip
      const minX = loopLeft + pw;
      const maxX = loopRight - pw - alcoveWidth;
      if (maxX >= minX) {
        const ax = rng.nextInt(minX, maxX);
        const ay = loopBottom - pw - alcoveDepth + 1; // ends at the bottom strip
        carveRect(terrain, ax, ay, alcoveWidth, alcoveDepth, width, height);
      }
    } else if (side === "left") {
      // Branch rightward from the left strip
      const minY = loopTop + pw;
      const maxY = loopBottom - pw - alcoveWidth;
      if (maxY >= minY) {
        const ay = rng.nextInt(minY, maxY);
        const ax = loopLeft + pw; // starts just inside the left strip
        carveRect(terrain, ax, ay, alcoveDepth, alcoveWidth, width, height);
      }
    } else {
      // Branch leftward from the right strip
      const minY = loopTop + pw;
      const maxY = loopBottom - pw - alcoveWidth;
      if (maxY >= minY) {
        const ay = rng.nextInt(minY, maxY);
        const ax = loopRight - pw - alcoveDepth + 1; // ends at the right strip
        carveRect(terrain, ax, ay, alcoveDepth, alcoveWidth, width, height);
      }
    }
  }

  // ── 5. Interior decoration ──────────────────────────────────────────────────
  // Carve small indentations or pillar-like notches in the wall mass enclosed
  // by the loop. Higher interiorDetail → more carved detail.
  // These are purely visual variety; they do NOT need to connect to the loop.

  if (interiorDetail > 0) {
    // Determine how many detail features to add (scaled by area and detail param)
    const interiorW = loopRight - loopLeft - pw * 2 - 1;
    const interiorH = loopBottom - loopTop  - pw * 2 - 1;

    if (interiorW > 0 && interiorH > 0) {
      const maxFeatures = Math.round(interiorDetail * 10);

      for (let f = 0; f < maxFeatures; f++) {
        // Each feature is a small 1–2 tile indentation carved into the interior wall mass
        const fx = loopLeft  + pw + rng.nextInt(1, Math.max(1, interiorW - 1));
        const fy = loopTop   + pw + rng.nextInt(1, Math.max(1, interiorH - 1));
        const fw = rng.nextInt(1, 2);
        const fh = rng.nextInt(1, 2);
        // Only carve if the tile is currently WALL (don't overwrite existing FLOOR)
        for (let dy = 0; dy <= fh; dy++) {
          for (let dx = 0; dx <= fw; dx++) {
            const tx = fx + dx;
            const ty = fy + dy;
            if (tx >= 1 && tx < width - 1 && ty >= 1 && ty < height - 1) {
              if (terrain[ty][tx] === TILE.WALL) {
                terrain[ty][tx] = TILE.FLOOR;
              }
            }
          }
        }
      }
    }
  }

  // ── 6. Connectivity validation ──────────────────────────────────────────────
  // Collect all FLOOR tiles. If any are disconnected from the main region,
  // add a connecting corridor from that tile to the nearest loop point.

  let start = findFirstFloor(terrain, width, height);
  let maxPasses = 10;
  while (start && maxPasses-- > 0) {
    const reachable = floodFill(terrain, start.x, start.y);
    let foundDisconnected = false;

    for (let y = 1; y < height - 1 && !foundDisconnected; y++) {
      for (let x = 1; x < width - 1 && !foundDisconnected; x++) {
        if (terrain[y][x] === TILE.FLOOR && !reachable.has(`${x},${y}`)) {
          foundDisconnected = true;

          // Carve an L-shaped corridor from the loop center to this tile
          const loopCenterX = Math.floor((loopLeft + loopRight) / 2);
          const loopCenterY = Math.floor((loopTop + loopBottom) / 2);

          const x1 = Math.min(loopCenterX, x);
          const x2 = Math.max(loopCenterX, x);
          for (let cx = x1; cx <= x2; cx++) {
            carveRect(terrain, cx, loopCenterY, 1, 1, width, height);
          }
          const y1 = Math.min(loopCenterY, y);
          const y2 = Math.max(loopCenterY, y);
          for (let cy = y1; cy <= y2; cy++) {
            carveRect(terrain, x, cy, 1, 1, width, height);
          }
        }
      }
    }

    if (!foundDisconnected) break;
  }

  return terrain;
}
