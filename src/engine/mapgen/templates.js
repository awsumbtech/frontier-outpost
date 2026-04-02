// Template stamping system (v2 stub).
// In v2, this will stamp hand-crafted room templates into procedurally generated maps.
// For v1, this is a no-op pass-through.

// import { MAP_TEMPLATES } from "../../data/mapTemplates";
// import { TILE } from "../../data/mapConstants";

// Stamp a template into terrain at the given position.
// eslint-disable-next-line no-unused-vars
export function stampTemplate(terrain, template, offsetX, offsetY) {
  // v2: iterate template.terrain and overwrite tiles at offset position
  // v2: carve connecting corridors from template exits to nearest floor tiles
  return terrain;
}

// Find and stamp all required templates for a zone config.
// eslint-disable-next-line no-unused-vars
export function applyTemplates(terrain, zoneConfig, rng) {
  // v2: filter MAP_TEMPLATES by requiredEnvironments
  // v2: find placement positions based on template.placement hints
  // v2: call stampTemplate for each
  return terrain;
}
