import { TILE } from "../../../data/mapConstants";

/**
 * Generates an organic cave-like terrain map using random walk followed by
 * cellular automata smoothing.
 *
 * Returns a 2D array terrain[y][x] containing only TILE.WALL or TILE.FLOOR.
 * The postprocessor is responsible for placing spawn, exit, encounter zones,
 * and obstacles, and for validating connectivity.
 *
 * @param {number} width  - Map width in tiles
 * @param {number} height - Map height in tiles
 * @param {object} params - Generation parameters (see defaults below)
 * @param {object} rng    - Seeded PRNG from seededRandom.js
 * @returns {number[][]}  - terrain[y][x] of TILE.WALL | TILE.FLOOR
 */
export function generateOrganic(width, height, params, rng) {
  const {
    walkIterations   = 6000,
    smoothPasses     = 4,
    wallThreshold    = 4,
  } = params;

  // ── 1. Initialise grid to all WALL ──────────────────────────────────────────
  const terrain = Array.from({ length: height }, () =>
    new Array(width).fill(TILE.WALL)
  );

  // Helper: clamp a coordinate to the interior (border tiles must stay WALL).
  const clampX = (x) => Math.max(1, Math.min(width  - 2, x));
  const clampY = (y) => Math.max(1, Math.min(height - 2, y));

  // ── 2. Random walk ──────────────────────────────────────────────────────────
  // The four cardinal directions.
  const DIRS = [
    { dx:  0, dy: -1 }, // north
    { dx:  0, dy:  1 }, // south
    { dx: -1, dy:  0 }, // west
    { dx:  1, dy:  0 }, // east
  ];

  // Start at the centre of the grid (interior-clamped).
  let wx = clampX(Math.floor(width  / 2));
  let wy = clampY(Math.floor(height / 2));

  // Track every FLOOR tile so we can jump to one occasionally.
  const floorTiles = [];

  // Carve the starting position.
  terrain[wy][wx] = TILE.FLOOR;
  floorTiles.push({ x: wx, y: wy });

  for (let step = 0; step < walkIterations; step++) {
    // Every ~500 steps, jump to a random existing FLOOR tile so the walk fans
    // out instead of drilling a single corridor.
    if (step > 0 && step % 500 === 0 && floorTiles.length > 0) {
      const jumpTarget = rng.pick(floorTiles);
      wx = jumpTarget.x;
      wy = jumpTarget.y;
    }

    // Pick a random cardinal direction and move.
    const dir = rng.pick(DIRS);
    wx = clampX(wx + dir.dx);
    wy = clampY(wy + dir.dy);

    // Carve — only add to floorTiles list on first carve of each cell.
    if (terrain[wy][wx] !== TILE.FLOOR) {
      terrain[wy][wx] = TILE.FLOOR;
      floorTiles.push({ x: wx, y: wy });
    }
  }

  // ── 3. Cellular automata smoothing ─────────────────────────────────────────
  for (let pass = 0; pass < smoothPasses; pass++) {
    // Work on a copy so this pass's writes don't affect the same pass's reads.
    const next = terrain.map(row => [...row]);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Count WALL tiles in the 3×3 neighbourhood (includes the cell itself).
        let wallCount = 0;
        for (let ny = y - 1; ny <= y + 1; ny++) {
          for (let nx = x - 1; nx <= x + 1; nx++) {
            if (terrain[ny][nx] === TILE.WALL) wallCount++;
          }
        }

        // Standard cave CA rule: become/stay WALL if surrounded by enough walls.
        next[y][x] = wallCount >= wallThreshold ? TILE.WALL : TILE.FLOOR;
      }
    }

    // Commit the smoothed layer (border rows/columns are untouched — already WALL).
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        terrain[y][x] = next[y][x];
      }
    }
  }

  // ── 4. Return raw terrain ───────────────────────────────────────────────────
  // Border tiles are guaranteed WALL. Interior tiles are WALL or FLOOR.
  // The postprocessor handles encounter zones, spawn, exit, obstacles, and
  // connectivity validation.
  return terrain;
}
