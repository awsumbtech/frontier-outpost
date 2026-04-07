import { TILE_WALKABLE } from "../../data/mapConstants";

// Flood fill from a starting point. Returns Set of "x,y" strings for all reachable tiles.
export function floodFill(terrain, startX, startY) {
  const h = terrain.length;
  const w = terrain[0].length;
  const visited = new Set();
  const queue = [[startX, startY]];
  const key = (x, y) => `${x},${y}`;

  if (!TILE_WALKABLE.has(terrain[startY]?.[startX])) return visited;
  visited.add(key(startX, startY));

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const k = key(nx, ny);
      if (visited.has(k)) continue;
      if (!TILE_WALKABLE.has(terrain[ny][nx])) continue;
      visited.add(k);
      queue.push([nx, ny]);
    }
  }
  return visited;
}

// Check if two points are connected via walkable tiles.
export function isReachable(terrain, startX, startY, endX, endY) {
  const reachable = floodFill(terrain, startX, startY);
  return reachable.has(`${endX},${endY}`);
}

// A* pathfinding (4-directional). Returns array of {x, y} or null if unreachable.
export function findPath(terrain, startX, startY, endX, endY) {
  const h = terrain.length;
  const w = terrain[0].length;
  if (!TILE_WALKABLE.has(terrain[startY]?.[startX])) return null;
  if (!TILE_WALKABLE.has(terrain[endY]?.[endX])) return null;

  const key = (x, y) => y * w + x;
  const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);

  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();
  const startKey = key(startX, startY);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startX, startY));

  // Simple binary heap for the open set
  const open = [{ x: startX, y: startY, f: fScore.get(startKey) }];
  const inOpen = new Set([startKey]);

  while (open.length > 0) {
    // Find lowest f-score (simple linear scan — fine for our map sizes)
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const current = open[bestIdx];
    open.splice(bestIdx, 1);
    const ck = key(current.x, current.y);
    inOpen.delete(ck);

    if (current.x === endX && current.y === endY) {
      // Reconstruct path
      const path = [{ x: endX, y: endY }];
      let k = ck;
      while (cameFrom.has(k)) {
        k = cameFrom.get(k);
        path.push({ x: k % w, y: Math.floor(k / w) });
      }
      return path.reverse();
    }

    const currentG = gScore.get(ck);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (!TILE_WALKABLE.has(terrain[ny][nx])) continue;

      const nk = key(nx, ny);
      const tentativeG = currentG + 1;
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, ck);
        gScore.set(nk, tentativeG);
        const f = tentativeG + heuristic(nx, ny);
        fScore.set(nk, f);
        if (!inOpen.has(nk)) {
          open.push({ x: nx, y: ny, f });
          inOpen.add(nk);
        }
      }
    }
  }
  return null; // No path found
}

// Find the largest connected region of walkable tiles. Returns Set of "x,y" strings.
export function findLargestRegion(terrain) {
  const h = terrain.length;
  const w = terrain[0].length;
  const visited = new Set();
  let largest = new Set();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = `${x},${y}`;
      if (visited.has(k) || !TILE_WALKABLE.has(terrain[y][x])) continue;
      const region = floodFill(terrain, x, y);
      for (const r of region) visited.add(r);
      if (region.size > largest.size) largest = region;
    }
  }
  return largest;
}
