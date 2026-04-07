// Tile type constants for map generation
export const TILE = {
  VOID:           0,  // Outside map bounds (black)
  FLOOR:          1,  // Walkable ground
  WALL:           2,  // Impassable barrier
  OBSTACLE:       3,  // Impassable object (crate, rock, machinery)
  ENCOUNTER_ZONE: 4,  // Walkable, elevated encounter rate
  SPAWN:          5,  // Player start position (walkable)
  EXIT:           6,  // Mission exit / completion trigger (walkable)
};

export const TILE_WALKABLE = new Set([
  TILE.FLOOR, TILE.ENCOUNTER_ZONE, TILE.SPAWN, TILE.EXIT
]);

export const TILE_SIZE = 32;  // pixels per tile

// Map dimension constraints
export const MAP_MIN_W = 20;
export const MAP_MIN_H = 15;
export const MAP_MAX_W = 50;
export const MAP_MAX_H = 40;

// Encounter defaults
export const ENCOUNTER_BASE_RATE = 0.05;
export const ENCOUNTER_ZONE_RATE = 0.15;
export const ENCOUNTER_COOLDOWN = 8;       // min steps between encounters
export const ENCOUNTER_ESCALATION = 0.02;  // +2% per step after cooldown
export const ENCOUNTER_MAX_RATE = 0.80;
