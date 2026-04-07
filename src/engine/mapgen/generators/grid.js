import { TILE } from "../../../data/mapConstants";

// ---------------------------------------------------------------------------
// Euclidean distance between two room centers.
// ---------------------------------------------------------------------------
function dist(a, b) {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// Carve a filled rectangle into terrain as FLOOR.
// Coordinates are clamped to grid bounds.
// ---------------------------------------------------------------------------
function carveRect(terrain, x, y, w, h, height, width) {
  const x1 = Math.max(0, x);
  const y1 = Math.max(0, y);
  const x2 = Math.min(width - 1, x + w - 1);
  const y2 = Math.min(height - 1, y + h - 1);
  for (let row = y1; row <= y2; row++) {
    for (let col = x1; col <= x2; col++) {
      terrain[row][col] = TILE.FLOOR;
    }
  }
}

// ---------------------------------------------------------------------------
// Carve an L-shaped corridor between two points.
// corridorWidth controls the thickness of each segment.
// The bend point is either (ax, by) or (bx, ay) chosen by a coin flip.
// ---------------------------------------------------------------------------
function carveCorridor(terrain, ax, ay, bx, by, corridorWidth, rng, mapH, mapW) {
  const half = Math.floor(corridorWidth / 2);

  if (rng.chance(0.5)) {
    // Horizontal first, then vertical
    carveRect(terrain,
      Math.min(ax, bx),
      ay - half,
      Math.abs(bx - ax) + corridorWidth,
      corridorWidth,
      mapH, mapW
    );
    carveRect(terrain,
      bx - half,
      Math.min(ay, by),
      corridorWidth,
      Math.abs(by - ay) + corridorWidth,
      mapH, mapW
    );
  } else {
    // Vertical first, then horizontal
    carveRect(terrain,
      ax - half,
      Math.min(ay, by),
      corridorWidth,
      Math.abs(by - ay) + corridorWidth,
      mapH, mapW
    );
    carveRect(terrain,
      Math.min(ax, bx),
      by - half,
      Math.abs(bx - ax) + corridorWidth,
      corridorWidth,
      mapH, mapW
    );
  }
}

// ---------------------------------------------------------------------------
// Check whether a candidate room (with 1-tile padding) overlaps any placed room.
// Padding means the zone that must remain WALL around each room extends 1 tile
// on every side, so we expand both rectangles by 1 before overlap testing.
// ---------------------------------------------------------------------------
function overlapsAny(rooms, rx, ry, rw, rh) {
  // Expand candidate by 1 on all sides for padding check
  const ex1 = rx - 1;
  const ey1 = ry - 1;
  const ex2 = rx + rw;     // right edge (exclusive) + 1 padding = rx+rw+1-1 = rx+rw
  const ey2 = ry + rh;

  for (const room of rooms) {
    // Expand existing room by 1 on all sides
    const ox1 = room.x - 1;
    const oy1 = room.y - 1;
    const ox2 = room.x + room.w;
    const oy2 = room.y + room.h;

    // AABB overlap
    if (ex1 < ox2 && ex2 > ox1 && ey1 < oy2 && ey2 > oy1) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Build a minimum spanning tree via Prim's algorithm.
// Returns an array of [indexA, indexB] edges.
// ---------------------------------------------------------------------------
function buildMST(rooms) {
  if (rooms.length <= 1) return [];

  const inTree = new Set([0]);
  const edges = [];

  while (inTree.size < rooms.length) {
    let bestDist = Infinity;
    let bestFrom = -1;
    let bestTo = -1;

    for (const fromIdx of inTree) {
      for (let toIdx = 0; toIdx < rooms.length; toIdx++) {
        if (inTree.has(toIdx)) continue;
        const d = dist(rooms[fromIdx], rooms[toIdx]);
        if (d < bestDist) {
          bestDist = d;
          bestFrom = fromIdx;
          bestTo = toIdx;
        }
      }
    }

    if (bestTo === -1) break; // safety — should never happen
    inTree.add(bestTo);
    edges.push([bestFrom, bestTo]);
  }

  return edges;
}

// ---------------------------------------------------------------------------
// Main generator — pure function, no side effects.
// Returns a 2D terrain array [y][x] of TILE integers.
// ---------------------------------------------------------------------------
export function generateGrid(width, height, params, rng) {
  const {
    minRoomSize = 4,
    maxRoomSize = 9,
    roomCount = 6,
    corridorWidth = 1,
    extraCorridors = 2,
  } = params;

  // Step 1: Fill grid with WALL
  const terrain = Array.from({ length: height }, () =>
    new Array(width).fill(TILE.WALL)
  );

  // Step 2: Place non-overlapping rooms
  const rooms = [];
  const MAX_TRIES = 100;

  for (let i = 0; i < roomCount; i++) {
    let placed = false;
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const rw = rng.nextInt(minRoomSize, maxRoomSize);
      const rh = rng.nextInt(minRoomSize, maxRoomSize);
      // Keep at least 1 tile from the map border so wall padding has room
      const rx = rng.nextInt(1, width - rw - 1);
      const ry = rng.nextInt(1, height - rh - 1);

      if (overlapsAny(rooms, rx, ry, rw, rh)) continue;

      // Carve the room interior
      carveRect(terrain, rx, ry, rw, rh, height, width);
      rooms.push({
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        cx: Math.floor(rx + rw / 2),
        cy: Math.floor(ry + rh / 2),
      });
      placed = true;
      break;
    }
    // If we can't place a room after MAX_TRIES, skip it (map still valid)
    if (!placed) {
      // No-op: postprocessor validates connectivity
    }
  }

  // Need at least 2 rooms to carve corridors
  if (rooms.length < 2) return terrain;

  // Step 3: Build MST connecting all room centers
  const mstEdges = buildMST(rooms);

  // Step 4: Carve L-shaped corridors for each MST edge
  for (const [a, b] of mstEdges) {
    carveCorridor(
      terrain,
      rooms[a].cx, rooms[a].cy,
      rooms[b].cx, rooms[b].cy,
      corridorWidth,
      rng,
      height, width
    );
  }

  // Step 5: Add extra corridors for loops
  // Collect all pairs that are NOT already connected by the MST
  const mstSet = new Set(mstEdges.map(([a, b]) => `${Math.min(a, b)},${Math.max(a, b)}`));
  const nonMstPairs = [];
  for (let a = 0; a < rooms.length; a++) {
    for (let b = a + 1; b < rooms.length; b++) {
      const key = `${a},${b}`;
      if (!mstSet.has(key)) {
        nonMstPairs.push([a, b]);
      }
    }
  }

  const shuffled = rng.shuffle(nonMstPairs);
  const extras = Math.min(extraCorridors, shuffled.length);
  for (let i = 0; i < extras; i++) {
    const [a, b] = shuffled[i];
    carveCorridor(
      terrain,
      rooms[a].cx, rooms[a].cy,
      rooms[b].cx, rooms[b].cy,
      corridorWidth,
      rng,
      height, width
    );
  }

  return terrain;
}
