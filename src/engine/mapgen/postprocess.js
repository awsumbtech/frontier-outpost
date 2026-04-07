import { TILE, TILE_WALKABLE } from "../../data/mapConstants";
import { floodFill, findLargestRegion, isReachable } from "./pathfinding";

// Postprocess raw terrain from any generator:
// 1. Keep only the largest connected region (fill disconnected pockets with WALL)
// 2. Place encounter zones (clustered)
// 3. Place obstacles on floor tiles
// 4. Place spawn and exit points in opposite quadrants
// 5. Validate spawn→exit connectivity
export function postprocess(terrain, profile, missionData, rng) {
  const h = terrain.length;
  const w = terrain[0].length;
  const { params } = profile;

  // 1. Keep only largest connected region
  const largest = findLargestRegion(terrain);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (TILE_WALKABLE.has(terrain[y][x]) && !largest.has(`${x},${y}`)) {
        terrain[y][x] = TILE.WALL;
      }
    }
  }

  // Collect all floor tiles
  const floorTiles = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (terrain[y][x] === TILE.FLOOR) floorTiles.push({ x, y });
    }
  }

  if (floorTiles.length < 20) {
    // Map is too sparse — return as-is, caller should retry
    return { terrain, entities: [], encounterConfig: {}, valid: false };
  }

  // 2. Place encounter zones (clustered placement)
  const encounterZoneCount = Math.floor(floorTiles.length * (params.encounterZonePercent || 0.15));
  const clustering = params.encounterZoneClustering || 0.6;

  // Pick seed points, then spread outward
  const seedCount = Math.max(2, Math.floor(encounterZoneCount / 8));
  const seeds = [];
  const shuffled = rng.shuffle(floorTiles);
  for (let i = 0; i < seedCount && i < shuffled.length; i++) {
    seeds.push(shuffled[i]);
  }

  let placed = 0;
  const isEZ = new Set();

  // First pass: spread from seeds
  for (const seed of seeds) {
    const queue = [seed];
    const visited = new Set([`${seed.x},${seed.y}`]);
    while (queue.length > 0 && placed < encounterZoneCount) {
      const tile = queue.shift();
      if (terrain[tile.y][tile.x] === TILE.FLOOR) {
        terrain[tile.y][tile.x] = TILE.ENCOUNTER_ZONE;
        isEZ.add(`${tile.x},${tile.y}`);
        placed++;
      }
      // Spread to neighbors with clustering probability
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = tile.x + dx;
        const ny = tile.y + dy;
        const k = `${nx},${ny}`;
        if (visited.has(k)) continue;
        visited.add(k);
        if (ny <= 0 || ny >= h - 1 || nx <= 0 || nx >= w - 1) continue;
        if (terrain[ny][nx] !== TILE.FLOOR) continue;
        if (rng.chance(clustering)) {
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  // 3. Place obstacles on remaining floor tiles (not encounter zones)
  const obstacleCount = Math.floor(floorTiles.length * (params.obstaclePercent || 0.03));
  const remainingFloor = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (terrain[y][x] === TILE.FLOOR) remainingFloor.push({ x, y });
    }
  }
  const obstacleShuffled = rng.shuffle(remainingFloor);
  let obstaclesPlaced = 0;
  for (const tile of obstacleShuffled) {
    if (obstaclesPlaced >= obstacleCount) break;
    // Don't block narrow passages: require >= 3 walkable neighbors
    let walkableNeighbors = 0;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (TILE_WALKABLE.has(terrain[tile.y + dy]?.[tile.x + dx])) walkableNeighbors++;
    }
    if (walkableNeighbors >= 3) {
      terrain[tile.y][tile.x] = TILE.OBSTACLE;
      obstaclesPlaced++;
    }
  }

  // 4. Place spawn (bottom-left quadrant) and exit (top-right quadrant)
  const entities = [];
  const spawn = findOpenTile(terrain, w, h, 0, h / 2, w / 2, h, rng);
  const exit = findOpenTile(terrain, w, h, w / 2, 0, w, h / 2, rng);

  if (!spawn || !exit) {
    return { terrain, entities: [], encounterConfig: {}, valid: false };
  }

  terrain[spawn.y][spawn.x] = TILE.SPAWN;
  terrain[exit.y][exit.x] = TILE.EXIT;
  entities.push({ type: "spawn", x: spawn.x, y: spawn.y });
  entities.push({ type: "exit", x: exit.x, y: exit.y });

  // 5. Validate connectivity
  const valid = isReachable(terrain, spawn.x, spawn.y, exit.x, exit.y);

  const encounterConfig = {
    maxEncounters: missionData.encounters || 3,
    remainingEncounters: missionData.encounters || 3,
  };

  return { terrain, entities, encounterConfig, valid };
}

// Find a walkable tile with open space in a quadrant.
function findOpenTile(terrain, mapW, mapH, x1, y1, x2, y2, rng) {
  const candidates = [];
  const minX = Math.floor(Math.max(1, x1));
  const maxX = Math.floor(Math.min(mapW - 1, x2));
  const minY = Math.floor(Math.max(1, y1));
  const maxY = Math.floor(Math.min(mapH - 1, y2));

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (!TILE_WALKABLE.has(terrain[y][x])) continue;
      // Prefer tiles with open space around them
      let openNeighbors = 0;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        if (TILE_WALKABLE.has(terrain[y + dy]?.[x + dx])) openNeighbors++;
      }
      if (openNeighbors >= 3) candidates.push({ x, y, score: openNeighbors });
    }
  }

  if (candidates.length === 0) {
    // Fallback: any walkable tile in the quadrant
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        if (TILE_WALKABLE.has(terrain[y][x])) return { x, y };
      }
    }
    return null;
  }

  // Pick one of the best candidates
  candidates.sort((a, b) => b.score - a.score);
  const topN = candidates.slice(0, Math.min(5, candidates.length));
  return rng.pick(topN);
}
