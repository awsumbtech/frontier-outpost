# Phase 4: Enemy AI Tactics — Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"

## Success Criteria (from design doc)

- [ ] Each AI profile (aggro, tactical, support, tank, assassin) produces distinct targeting behavior
- [ ] `selectEnemyAction()` replaces random `pick()` in enemy targeting
- [ ] `aiProfile` field on all 12 enemy templates
- [ ] Boss phase transitions for Apex Predator and Core Guardian
- [ ] Boss architecture supports adding abilities later
- [ ] Taunt mechanic still works (overridable by aggro profile 30% of time)
- [ ] Existing ability/status effect systems unchanged
- [ ] All 281 existing tests pass + new tests for every AI function
- [ ] Save compatibility preserved

## Baseline

- **Tests**: 281 passing, 0 failing, 0 skipped (8 test files)
- **Build**: Clean, 4.19s

---

## Tasks

### Task 0: Capture Baseline ✅

- **Agent**: explorer
- **Done**: 281 tests passing, build clean

### Task 1: Add `aiProfile` and `bossPhases` to enemy data

- **Agent**: implementer
- **Do**: In `src/data/enemies.js`, add an `aiProfile` string field to every enemy template and `bossPhases` config to tier-4 bosses. Also add boss abilities arrays (empty for now, with the infrastructure ready).
- **Files**: `src/data/enemies.js`
- **Mapping**:
  - `aggro`: Feral Drone, Apex Predator
  - `tactical`: Scav Raider, Rogue Mech
  - `support`: Hive Swarm
  - `tank`: Heavy Sentinel, Core Guardian
  - `assassin`: Xeno Stalker, Psi-Wraith
  - Any remaining enemies without an obvious fit: `aggro` (default)
- **Boss config shape**:
  ```js
  bossPhases: [
    { hpThreshold: 1.0, name: 'normal' },
    { hpThreshold: 0.5, name: 'enraged', damageModifier: 1.3 },
    { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
  ]
  ```
- **Must not break**: Existing enemy template shape (all current fields preserved). `generateEncounter` still works. Data validation tests pass.
- **Done when**: All 12 enemies have `aiProfile`, bosses have `bossPhases`, 281 tests still pass.

### Task 2: Implement `selectEnemyTarget()` per AI profile

- **Agent**: implementer
- **Do**: In `src/engine/combat.js`, add a new pure function `selectEnemyTarget(enemy, aliveAllies, aliveEnemies)` that returns a `targetId` based on the enemy's `aiProfile`. Implement all 5 targeting profiles:
  - **aggro**: Target lowest HP ally. If multiple tied, pick randomly. Ignore taunt 30% of time.
  - **tactical**: Target highest-damage ally. Switch off defending targets. Respect taunt normally.
  - **support**: Target medic/healer class first, then lowest armor. Respect taunt.
  - **tank**: Target randomly (tanks focus on self-buffing, not smart targeting). Respect taunt.
  - **assassin**: Target lowest armor ally. Respect taunt.
  - **default fallback**: Random (current behavior) if no profile or unknown profile.
- **Taunt handling**: All profiles respect taunt (70% chance to target taunter) EXCEPT aggro which overrides 30% of the time (effectively 49% chance to ignore taunt = 70% × 30%). Keep the existing taunt logic as the base, let profiles override target selection AFTER taunt check fails.
- **Files**: `src/engine/combat.js`
- **Must not break**: Existing `executeEnemyTurn`, `executeEnemyAbility`, buff/debuff system. No changes to any existing function signatures.
- **Done when**: `selectEnemyTarget` is exported, handles all 5 profiles + fallback, is a pure function with no side effects.

### Task 3: Implement `getBossPhaseModifiers()`

- **Agent**: implementer
- **Do**: In `src/engine/combat.js`, add a pure function `getBossPhaseModifiers(enemy)` that:
  - Checks if `enemy.bossPhases` exists
  - Determines current phase based on `enemy.hp / enemy.maxHp` ratio (need to track `maxHp` — add it at instantiation in `generateEncounter`)
  - Returns `{ phase: 'normal'|'enraged'|'desperate', damageModifier: number }` or `null` if not a boss
  - The damage modifier gets applied in `executeEnemyTurn` when calculating damage
- **Also**: Modify `generateEncounter` to store `maxHp` on enemy instances (copy of initial `hp`). This is needed for phase threshold calculation.
- **Files**: `src/engine/combat.js`, potentially `src/hooks/useMission.js` if `generateEncounter` lives there
- **Must not break**: Existing encounter generation, enemy HP values, combat damage calculations
- **Done when**: `getBossPhaseModifiers` returns correct phase for different HP percentages, `maxHp` tracked on enemies

### Task 4: Wire AI targeting into combat flow

- **Agent**: implementer
- **Do**: Modify `executeEnemyTurn` in `src/engine/combat.js` to:
  1. Call `selectEnemyTarget()` instead of the current `pick()` random targeting
  2. Call `getBossPhaseModifiers()` and apply `damageModifier` to the attack damage
  3. Keep ALL existing logic (evasion, shields, armor, defend DR, damage calculation) — only the target selection and damage multiplier change
- **Also**: In `src/hooks/useMission.js`, update `processEnemyTurn` to pass `aliveEnemies` to `executeEnemyTurn` if not already available (needed for support profile's "buff allies" logic).
- **Files**: `src/engine/combat.js`, `src/hooks/useMission.js`
- **Must not break**: Evasion checks, shield absorption, armor reduction, defend DR, combat log entries, the 600ms turn delay, taunt mechanic (verify explicitly)
- **Done when**: Enemy turns use profile-based targeting, boss phases apply damage modifiers, all 281 existing tests pass
- **Depends on**: Tasks 1, 2, 3

### Task 5: Write tests for all AI functions

- **Agent**: tester
- **Do**: Create `src/engine/__tests__/enemyAI.test.js` with tests for:
  - `selectEnemyTarget` — one test per profile verifying correct target selection:
    - aggro: picks lowest HP
    - tactical: picks highest damage, switches off defenders
    - support: picks medic class first
    - tank: random (any valid target)
    - assassin: picks lowest armor
    - fallback: random when no profile
  - Taunt interaction: taunter draws fire, aggro override
  - `getBossPhaseModifiers`:
    - Returns null for non-boss enemies
    - Returns 'normal' at full HP
    - Returns 'enraged' at 50% HP
    - Returns 'desperate' at 20% HP
    - Returns correct damage modifiers
  - Edge cases:
    - Only one ally alive (all profiles should target them)
    - Enemy with unknown aiProfile falls back to random
    - Boss at exactly threshold boundaries
- **Files**: `src/engine/__tests__/enemyAI.test.js`
- **Must not break**: All 281 existing tests
- **Done when**: All new tests pass, all 281 old tests pass, coverage for every profile + boss phase + edge case
- **Depends on**: Tasks 2, 3

### Task 6: Regression verification

- **Agent**: tester
- **Do**: Run the full test suite (`npx vitest run`). Compare to baseline (281 passing, 0 failing). Run `npm run build`. Report any differences.
- **Done when**: Zero net-new failures compared to baseline, build clean
- **Depends on**: Tasks 4, 5

### Task 7: Final review

- **Agent**: reviewer
- **Do**: Review all changes against success criteria:
  1. Each AI profile has distinct targeting logic (read `selectEnemyTarget`)
  2. Boss phases work (read `getBossPhaseModifiers`)
  3. `aiProfile` on all 12 enemies
  4. Taunt mechanic preserved
  5. No mutations in pure functions
  6. Save compatibility (no new fields on operative state, `maxHp` only on freshly generated enemies)
  7. Boss abilities can be added later (empty arrays, cooldown infrastructure)
  8. Test coverage adequate
- **Done when**: All success criteria confirmed met, no regressions, no code quality issues
- **Depends on**: Task 6
