# Phase 4: Phaser Map Visual Overhaul — Design Doc

**Date:** 2026-04-02
**Status:** Design

## Summary

Replace the Phaser exploration map's colored rectangles with real sprites (player + tiles) and introduce a circuit-path map generator that makes exploration feel like navigating a world rather than moving a square through a grid.

Three pillars:
1. **Player sprite** — Animated walk cycle per class, directional facing
2. **Tile sprites** — Themed terrain tileset replacing Graphics rectangles
3. **Circuit map generator** — Loop/perimeter path with interior shortcuts

---

## Success Criteria

- [ ] Player is an animated sprite with 4-direction walk cycle (no cyan square, no direction triangle)
- [ ] Player sprite matches squad leader's class (Vanguard/Recon/Engineer/Medic)
- [ ] Map tiles are rendered from a tileset image, not colored rectangles
- [ ] Each environment palette produces visually distinct tile colors
- [ ] Maps generate as circuit/loop paths around impassable interiors
- [ ] Interior shortcuts provide optional route variety
- [ ] Encounter zones, spawn, and exit remain visually distinct and functional
- [ ] All existing gameplay works: encounters trigger, combat transitions, exit detection, save/resume
- [ ] 325 existing tests continue passing
- [ ] Performance: no perceptible frame drops during exploration

---

## What Must NOT Change

- EventBridge events and protocol (map:ready, map:step, map:encounter, map:exit)
- EncounterSystem logic (rates, cooldowns, escalation)
- Combat flow (exploration → encounter → combat → resume → exploration)
- Save compatibility (playerPos, mapData structure)
- React SVG sprites in combat UI (src/sprites/)
- Existing 3 generator archetypes (organic, grid, cavern) — still used by missions that reference them
- Mission data format (missions.js)
- CameraSystem behavior

---

## Blast Radius

### Files to Change
| File | Change |
|------|--------|
| `src/phaser/entities/Player.js` | Replace Graphics with Sprite, add walk animation, remove triangle |
| `src/phaser/scenes/MapScene.js` | Replace `renderTilemap()` Graphics with Phaser Tilemap, load assets |
| `src/data/mapGeneratorProfiles.js` | Add circuit archetype profiles, assign to some missions |
| `src/data/missions.js` | Update select missions to use circuit environments |

### Files to Add
| File | Purpose |
|------|---------|
| `src/engine/mapgen/generators/circuit.js` | New circuit/loop path generator |
| `src/phaser/assets/spriteGen.js` | Programmatic sprite sheet generation (class walk cycles) |
| `src/phaser/assets/tilesetGen.js` | Programmatic tileset generation (terrain tiles) |
| `public/` or inline textures | Generated sprite sheet + tileset textures |

### Files Untouched
- `src/phaser/EventBridge.js`
- `src/phaser/systems/EncounterSystem.js`
- `src/phaser/systems/CameraSystem.js`
- `src/phaser/PhaserGame.jsx` (minimal changes if any — asset loading)
- `src/phaser/config/phaserConfig.js`
- `src/hooks/useMission.js` (no interface changes)
- `src/components/tabs/MissionTab.jsx`
- All combat code, all React SVG sprites
- `src/engine/mapgen/postprocess.js` (circuit generator handles its own placement)
- Existing generators (organic.js, grid.js, cavern.js)

### Test Suites to Run
- `npx vitest run` — full 325-test suite
- Manual: start mission → explore map → trigger encounter → fight → resume → find exit
- Manual: verify all 4 class sprites render correctly as squad leader

---

## Approach

### 1. Programmatic Sprite Generation (Hybrid Strategy)

**Why programmatic:** We can't download external assets. The existing React SVG sprites are portrait icons, not walk-cycle characters. We'll generate pixel-art-style sprite sheets at Phaser boot time using Canvas/Graphics API.

**Player sprites (per class):**
- 32×32 frames
- 4 directions (down, left, right, up)
- 3 frames per direction: stand, walk-left-foot, walk-right-foot (12 frames total)
- Color palette derived from existing SVG class colors:
  - Vanguard: steel blue/silver (heavy armor silhouette)
  - Recon: dark teal/green (slim silhouette)
  - Engineer: amber/orange (utility belt silhouette)
  - Medic: white/red cross (medkit silhouette)
- Each class has a distinct body shape/silhouette for recognition
- Generated as a Phaser texture at scene preload, keyed by class ID

**Tileset (per environment palette):**
- 32×32 tiles
- 7 tile types: void, floor, wall, obstacle, encounter_zone, spawn, exit
- Floor tiles get subtle pattern variation (grating lines, panel seams)
- Walls get darker shade + edge highlights
- Obstacles get 3D-ish inset (existing approach, but as texture)
- Encounter zones get subtle color tint (reddish overlay)
- Exit keeps pulsing animation (overlay tween on top of tile)
- Generated per-environment using palette colors from generator profiles

### 2. Circuit Map Generator

**Algorithm: Perimeter Loop with Interior Walls + Shortcuts**

```
Phase 1: Carve the circuit
  1. Fill map with WALL
  2. Carve a perimeter path (2-3 tiles wide) around the map edges
  3. Carve interior walls/obstacles filling the center area
  4. Add 1-3 shortcut corridors cutting through the interior

Phase 2: Add variety
  5. Add small alcoves/rooms branching off the main path
  6. Scatter encounter zones along the path at intervals
  7. Place obstacles (crates/debris) along path edges for visual interest

Phase 3: Place markers
  8. Spawn at bottom of circuit
  9. Exit at top (or opposite end) — maximizes walking distance
  10. Validate connectivity with A* (reuse existing pathfinding.js)
```

**Key properties:**
- Player must traverse most of the circuit to reach exit
- Shortcuts are optional — let players find faster routes
- Encounter zones placed at path bends/intersections (natural choke points)
- Interior isn't just empty wall — has visual variety (machinery, structures)

**Integration with existing system:**
- New archetype `"circuit"` in generator profile lookup
- Returns same `terrain[y][x]` 2D array format
- Postprocess still handles encounter zone placement + validation
- Seeded RNG for deterministic generation

### 3. Player.js Refactor

**Current:** Phaser.GameObjects.Container with Graphics (cyan rect + triangle)
**New:** Phaser.GameObjects.Sprite with animation

```
Changes:
- preload: generate sprite sheet texture for squad leader's class
- create: new Phaser.GameObjects.Sprite (not Container + Graphics)
- Add animation definitions: walk-down, walk-left, walk-right, walk-up, idle-down/left/right/up
- update(): play walk animation on movement, idle on stop
- Face direction: set animation to matching direction (replaces triangle)
- Remove: triangle graphics, container nesting
- Keep: grid-based movement logic, tween system, step events, public API
```

### 4. MapScene.js Refactor

**Current:** `renderTilemap()` draws colored rectangles via Phaser.Graphics
**New:** Use Phaser tilemap from generated texture

```
Changes:
- preload: generate tileset texture for current environment palette
- create: build Phaser.Tilemaps.Tilemap from terrain array
- Remove: renderTilemap() Graphics drawing
- Keep: exit marker pulse tween (overlay on top of tilemap)
- Keep: all event emissions, encounter system, camera system
```

---

## Asset Color Reference (from existing SVGs)

| Class | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| Vanguard | #4a90d9 (blue) | #c0c0c0 (silver) | #ffffff |
| Recon | #2d8a6e (teal) | #1a1a2e (dark) | #00ff88 |
| Engineer | #d4a030 (amber) | #8b6914 (brown) | #ff8c00 |
| Medic | #e8e8e8 (white) | #cc0000 (red) | #ff4444 |

*These will be verified against actual SVG files during implementation.*

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Programmatic sprites look bad | Visual quality | Start with clean geometric shapes, iterate on detail. Placeholder quality is fine for v1 — can swap for hand-drawn later |
| Circuit maps feel repetitive | Gameplay | Randomize shortcut positions, alcove shapes, encounter zone placement. Multiple size variants via profiles |
| Tilemap rendering breaks encounter detection | Gameplay blocker | EncounterSystem uses tile type lookups (unchanged). Tilemap is purely visual — terrain array is still the source of truth |
| Performance hit from textures | Frame drops | Generated textures are small (< 100KB). Phaser handles tilemap rendering efficiently. Profile if issues arise |
| Save compatibility | Data loss | mapData structure unchanged — terrain array format identical. playerPos format identical |
| Existing generators break | Regression | Not touching organic/grid/cavern generators at all. Circuit is additive |

---

## Out of Scope (Future Enhancements)

- Branching paths (Phase 4b — move to approach B later)
- Enemy sprites visible on map before encounters
- Environmental hazards / interactive objects
- Map fog of war / visibility system
- Hand-drawn pixel art replacement for programmatic sprites
- Sound effects for footsteps / encounters
- Mini-map overlay

---

## Implementation Order

1. **Sprite generation system** — programmatic sprite sheets for player + tileset
2. **Player.js refactor** — swap Graphics for animated Sprite
3. **MapScene.js refactor** — swap Graphics tilemap for Phaser Tilemap
4. **Circuit generator** — new map generation archetype
5. **Profile integration** — wire circuit generator to mission profiles
6. **Polish & test** — visual tuning, full gameplay verification
