import { createRng } from "./seededRandom";
import { generateOrganic } from "./generators/organic";
import { generateGrid } from "./generators/grid";
import { generateCavern } from "./generators/cavern";
import { generateCircuit } from "./generators/circuit";
import { postprocess } from "./postprocess";
import { TILE_SIZE } from "../../data/mapConstants";
import { GENERATOR_PROFILES } from "../../data/mapGeneratorProfiles";

const GENERATORS = {
  organic: generateOrganic,
  grid: generateGrid,
  cavern: generateCavern,
  circuit: generateCircuit,
};

const MAX_RETRIES = 3;

// Generate a complete map for a mission.
// missionData: { id, environment, encounters, tier, ... } from MISSIONS array
// seed: optional — if omitted, uses Date.now()
export function generateMapForMission(missionData, seed) {
  const profile = GENERATOR_PROFILES[missionData.environment];
  if (!profile) {
    throw new Error(`No generator profile for environment: ${missionData.environment}`);
  }

  const generator = GENERATORS[profile.archetype];
  if (!generator) {
    throw new Error(`Unknown generator archetype: ${profile.archetype}`);
  }

  const actualSeed = seed ?? Date.now();

  // Linear layout: override params to reduce branching/shortcuts
  let params = profile.params;
  if (missionData.layout === "linear") {
    params = { ...params };
    if (profile.archetype === "circuit") {
      params.shortcuts = 0;
      params.alcoves = Math.min(params.alcoves || 0, 1);
      params.interiorDetail = 0;
    } else if (profile.archetype === "grid") {
      params.extraCorridors = 0;
    } else if (profile.archetype === "cavern") {
      params.branchChance = 0;
    }
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const trySeed = actualSeed + attempt;
    const rng = createRng(trySeed);

    const terrain = generator(profile.width, profile.height, params, rng);
    const result = postprocess(terrain, profile, missionData, rng);

    if (result.valid) {
      return {
        id: `map_${missionData.id}_${trySeed}`,
        missionId: missionData.id,
        environmentId: missionData.environment,
        layout: missionData.layout || "open",
        width: profile.width,
        height: profile.height,
        tileSize: TILE_SIZE,
        terrain: result.terrain,
        entities: result.entities,
        encounterConfig: result.encounterConfig,
        palette: profile.palette,
        seed: trySeed,
      };
    }
  }

  // If all retries fail, return the last attempt anyway (very rare)
  const fallbackRng = createRng(actualSeed);
  const terrain = generator(profile.width, profile.height, params, fallbackRng);
  const result = postprocess(terrain, profile, missionData, fallbackRng);

  return {
    id: `map_${missionData.id}_${actualSeed}`,
    missionId: missionData.id,
    environmentId: missionData.environment,
    layout: missionData.layout || "open",
    width: profile.width,
    height: profile.height,
    tileSize: TILE_SIZE,
    terrain: result.terrain,
    entities: result.entities,
    encounterConfig: result.encounterConfig,
    palette: profile.palette,
    seed: actualSeed,
  };
}
