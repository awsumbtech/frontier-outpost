# Phase 4: Phaser Map Visual Overhaul — Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"
> **Design doc**: `docs/plans/2026-04-02-phase4-phaser-map-sprites-design.md`

## Success Criteria (from design doc)
- [ ] Player is an animated sprite with 4-direction walk cycle (no cyan square, no direction triangle)
- [ ] Player sprite matches squad leader's class (Vanguard/Recon/Engineer/Medic)
- [ ] Map tiles rendered from tileset texture, not colored rectangles
- [ ] Each environment palette produces visually distinct tiles
- [ ] Maps generate as circuit/loop paths around impassable interiors
- [ ] Interior shortcuts provide optional route variety
- [ ] Encounter zones, spawn, and exit remain visually distinct and functional
- [ ] All existing gameplay works: encounters, combat, exit detection, save/resume
- [ ] 325 existing tests continue passing
- [ ] No perceptible frame drops during exploration

## Baseline
- **Tests**: 325 passing, 0 failing, 0 skipped (9 test files)
- **Build**: passes (22.85s)
- **Captured**: 2026-04-02

---

## Tasks

### Task 0: Capture Baseline (DONE)
- **Agent**: explorer
- **Do**: Run full test suite + build. Record results.
- **Done when**: Baseline documented
- **Result**: 325 passing, build clean

---

### Task 1: Create Programmatic Player Sprite Generator
- **Agent**: implementer
- **Do**: Create `src/phaser/assets/spriteGen.js` that generates 32×32 player sprite sheet textures at runtime using Phaser's Graphics + generateTexture API.

  Requirements:
  - Export function `generatePlayerSprite(scene, classId)` that creates a Phaser texture keyed `player-{classId}`
  - 4 classes: vanguard, recon, engineer, medic
  - Each has a distinct silhouette and color palette:
    - Vanguard: blue (#4a90d9) + silver, heavy/broad body shape
    - Recon: teal (#2d8a6e) + dark, slim body shape
    - Engineer: amber (#d4a030) + brown, medium body with utility details
    - Medic: white (#e8e8e8) + red cross accent, medium body
  - 12 frames per class arranged in a 3×4 grid (3 frames wide, 4 rows = 4 directions):
    - Row 0: facing down (frame 0=stand, 1=walk-left, 2=walk-right)
    - Row 1: facing left
    - Row 2: facing right
    - Row 3: facing up
  - Walk frames should shift legs/arms slightly for movement feel
  - Verify colors against actual SVG files in `src/sprites/` before hardcoding

- **Files**: `src/phaser/assets/spriteGen.js` (new)
- **Must not break**: Nothing — new file, no existing code touched
- **Done when**: Function can be called with a scene + classId and produces a named texture with 12 frames

---

### Task 2: Create Programmatic Tileset Generator
- **Agent**: implementer
- **Do**: Create `src/phaser/assets/tilesetGen.js` that generates a tileset texture from an environment palette.

  Requirements:
  - Export function `generateTileset(scene, palette)` that creates a Phaser texture keyed `tileset-{hash}`
  - Takes palette object from generator profile (has floor, wall, obstacle, encounterZone, ambient colors)
  - Generates a strip of 32×32 tiles, one per TILE type (7 tiles: void, floor, wall, obstacle, encounter_zone, spawn, exit)
  - Floor tiles: base color with subtle horizontal/vertical line patterns (metal grating feel)
  - Wall tiles: darker shade with edge highlight on top/left for depth
  - Obstacle tiles: palette obstacle color with 3D inset look (2px border highlight/shadow)
  - Encounter zone: floor base with subtle reddish overlay/tint
  - Spawn: floor with cyan/green accent marks
  - Exit: floor with orange/amber accent marks (pulse handled by overlay tween separately)
  - Void: solid black (#0a0c10)

- **Files**: `src/phaser/assets/tilesetGen.js` (new)
- **Must not break**: Nothing — new file
- **Done when**: Function produces a named tileset texture with 7 visually distinct tile types that vary by palette

---

### Task 3: Refactor Player.js to Use Animated Sprite
- **Agent**: implementer
- **Do**: Refactor `src/phaser/entities/Player.js` to use the generated sprite sheet instead of Graphics.

  Requirements:
  - Accept `classId` parameter (squad leader's class)
  - In constructor: call `generatePlayerSprite(scene, classId)` if texture doesn't already exist
  - Replace Container+Graphics with `scene.add.sprite()` using the generated texture
  - Define 8 animations: `walk-down`, `walk-left`, `walk-right`, `walk-up`, `idle-down`, `idle-left`, `idle-right`, `idle-up`
  - Walk animations: 3 frames at 8fps, repeat
  - Idle animations: single frame (stand frame for that direction)
  - On movement start: play `walk-{direction}` animation
  - On movement end: play `idle-{direction}` animation
  - Track current facing direction, default to `down`
  - Remove ALL direction triangle code (triangle graphics, rotation logic, position offsets)
  - Keep: grid-based movement logic, tween system, MOVE_SPEED, step event emission, getPosition/setPosition API, depth setting

  The public API must remain identical:
  - `getPosition()` returns `{x, y}` tile coords
  - `setPosition(x, y)` teleports
  - `destroy()` cleans up
  - Emits `player:step` with same data shape

- **Files**: `src/phaser/entities/Player.js` (modify), `src/phaser/assets/spriteGen.js` (import)
- **Must not break**: Player movement, step events, position tracking, MapScene integration
- **Depends on**: Task 1
- **Done when**: Player renders as animated sprite, walks in 4 directions with animation, no triangle, same movement behavior

---

### Task 4: Refactor MapScene.js to Use Tilemap
- **Agent**: implementer
- **Do**: Refactor `src/phaser/scenes/MapScene.js` to render tiles from the generated tileset instead of Graphics rectangles.

  Requirements:
  - In `create()`: call `generateTileset(scene, mapData.palette)` to get tileset texture
  - Build a Phaser.Tilemaps.Tilemap from the terrain 2D array:
    - Create tilemap data from the terrain array (use `Phaser.Tilemaps.Formats` or manual layer creation)
    - Map each TILE constant to its index in the generated tileset strip
  - Remove `renderTilemap()` method and all Graphics-based tile drawing
  - Keep exit marker pulse animation (as an overlay sprite/graphic on top of tilemap)
  - Keep encounter flash effect on camera
  - Pass squad leader's classId to Player constructor (read from mapData or add to init data)
  - Keep ALL event emissions unchanged (map:ready, map:step, map:encounter, map:exit)
  - Keep EncounterSystem and CameraSystem integration identical

  Note: If Phaser tilemap API is complex for dynamic textures, an alternative is to use a grid of sprites from the tileset. Choose whichever approach is cleaner. The terrain array remains the source of truth for collision/encounter logic — visuals are decoupled.

- **Files**: `src/phaser/scenes/MapScene.js` (modify), `src/phaser/assets/tilesetGen.js` (import)
- **Must not break**: EventBridge events, encounter detection, exit detection, camera following, keyboard input
- **Depends on**: Task 2, Task 3
- **Done when**: Map renders with tileset textures, player walks on it, all events fire correctly

---

### Task 5: Create Circuit Map Generator
- **Agent**: implementer
- **Do**: Create `src/engine/mapgen/generators/circuit.js` — a new map generator archetype that creates loop/perimeter paths.

  Requirements:
  - Export function `generateCircuit(width, height, params, rng)` returning `terrain[y][x]` 2D array
  - Algorithm:
    1. Fill entire map with WALL
    2. Carve a perimeter loop path (2-3 tiles wide) around the map, inset ~3 tiles from edges
    3. The interior (center area) stays as WALL — this forces the player around the loop
    4. Add 1-3 shortcut corridors cutting through the interior (connect opposite sides of the loop)
    5. Add small alcoves (2-4 tiles deep) branching off the main path at random intervals
    6. All carved tiles are FLOOR
  - Parameters (via `params` object):
    - `pathWidth`: 2-3 (corridor width)
    - `shortcuts`: 1-3 (number of interior shortcuts)
    - `alcoves`: 2-5 (number of side alcoves)
    - `interiorDetail`: 0.0-1.0 (how much decorative wall variation in interior)
  - Do NOT place encounter zones, spawn, exit, or obstacles — that's handled by postprocess.js
  - Return format matches existing generators: just `terrain` 2D array of TILE constants
  - Validate: the carved path must be fully connected (use floodFill from pathfinding.js)

  Reference existing generators for the pattern:
  - `src/engine/mapgen/generators/organic.js`
  - `src/engine/mapgen/generators/grid.js`
  - `src/engine/mapgen/generators/cavern.js`

- **Files**: `src/engine/mapgen/generators/circuit.js` (new)
- **Must not break**: Nothing — new file. Existing generators untouched.
- **Done when**: Generator produces valid connected circuit maps with perimeter paths + shortcuts

---

### Task 6: Wire Circuit Generator into Profile System
- **Agent**: implementer
- **Do**: Register the circuit generator and create profiles for it.

  Requirements:
  1. In `src/engine/mapgen/index.js`: add `circuit` to the archetype switch/lookup so it calls `generateCircuit`
  2. In `src/data/mapGeneratorProfiles.js`: add 2-3 new circuit-archetype environment profiles (or update existing environments to use circuit). Suggested:
     - Convert `comms_relay` or `colony_perimeter` to circuit (thematically fits patrol routes)
     - Create 1 new environment `patrol_route` with circuit archetype if needed
  3. In `src/data/missions.js`: assign at least 2-3 missions to use circuit-archetype environments (pick missions where "patrolling" makes thematic sense, like "Perimeter Sweep")
  4. Ensure postprocess.js works correctly on circuit terrain (spawn bottom-left, exit top-right quadrant placement should still find valid walkable tiles along the circuit)

- **Files**: `src/engine/mapgen/index.js` (modify), `src/data/mapGeneratorProfiles.js` (modify), `src/data/missions.js` (modify)
- **Must not break**: Existing generators still work for missions that use them. Mission data format unchanged. Map generation pipeline (index.js → generator → postprocess → validate) works end-to-end.
- **Depends on**: Task 5
- **Done when**: Missions with circuit environments generate valid playable maps. Other missions unchanged.

---

### Task 7: Pass Squad Leader Class to Phaser
- **Agent**: implementer
- **Do**: Wire the squad leader's class ID from React state through to the Phaser Player entity.

  Requirements:
  1. In `src/hooks/useMission.js`: when generating mapData, include `squadLeaderClass` field (read from `game.squad[0].classId` or equivalent)
  2. In `src/phaser/PhaserGame.jsx`: pass `squadLeaderClass` through to MapScene init data (it's already passing mapData which can carry this)
  3. In `src/phaser/scenes/MapScene.js`: read `squadLeaderClass` from init data, pass to Player constructor
  4. Fallback: if no squad leader class available, default to `'vanguard'`

- **Files**: `src/hooks/useMission.js` (minor modify), `src/phaser/scenes/MapScene.js` (minor modify)
- **Must not break**: useMission hook flow, mapData structure (additive field only), PhaserGame props
- **Depends on**: Task 3
- **Done when**: Player sprite on map matches the squad leader's class

---

### Task 8: Regression Verification
- **Agent**: tester
- **Do**: Run the full test suite. Compare results to baseline (325 passing, 0 failing). Run `npm run build`. Flag any test that changed from pass to fail.

  Additionally verify manually (or via browser agent):
  - Start a mission → map loads with tileset graphics (not colored rectangles)
  - Player sprite is animated (not cyan square)
  - Player walks in 4 directions with walk animation
  - Encounters trigger correctly
  - Combat transition works (map hides, combat shows)
  - After combat, map resumes at correct position
  - Exit detection works when all encounters cleared
  - Circuit-type missions generate loop maps

- **Files**: All changed files
- **Must not break**: Everything from baseline
- **Done when**: 325+ tests pass, build succeeds, gameplay works end-to-end

---

### Task 9: Final Review
- **Agent**: reviewer
- **Do**: Review all changes against success criteria from design doc. Verify:
  1. No cyan square or direction triangle anywhere in Player.js
  2. No Graphics-based tile drawing in MapScene.js
  3. Circuit generator produces valid connected maps
  4. All 4 class sprites have distinct colors/shapes
  5. EventBridge protocol unchanged
  6. Save compatibility preserved (no breaking mapData format changes)
  7. Existing generators (organic/grid/cavern) untouched
  8. No hardcoded game data in components
  9. Engine functions remain pure (spriteGen/tilesetGen are Phaser-specific, not engine)

- **Done when**: All success criteria met, no regressions, code follows project conventions

---

## Dependency Graph

```
Task 1 (sprite gen) ──→ Task 3 (Player.js) ──→ Task 7 (wire class ID)
                                            ↘
Task 2 (tileset gen) ──→ Task 4 (MapScene.js) ──→ Task 8 (regression)──→ Task 9 (review)
                                            ↗
Task 5 (circuit gen) ──→ Task 6 (wire profiles)
```

**Parallelizable**: Tasks 1+2+5 can run simultaneously (all new files, no dependencies)
**Sequential**: 3 depends on 1, 4 depends on 2+3, 6 depends on 5, 7 depends on 3
