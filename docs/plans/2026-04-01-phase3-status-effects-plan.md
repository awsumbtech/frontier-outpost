# Phase 3: Status Effects System — Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"

## Success Criteria (from design doc)

- [ ] DoT effects (Bleed, Poison) deal damage each turn and expire correctly
- [ ] Bleed stacks (max 3); Poison reduces healing by 50%
- [ ] Slow (-30% speed) and Weaken (-20% damage) debuffs work with duration tracking
- [ ] 4 enemy types gain abilities with cooldowns (Scav Raider → Weaken, Spore Beast → Poison, Psi-Wraith → MP drain, Heavy Sentinel → self armor buff)
- [ ] UI shows individual effect icons with remaining duration on allies and enemies
- [ ] Effect tooltips on hover
- [ ] Combat log announces effect application, tick damage, and expiry
- [ ] All 222 existing tests still pass
- [ ] New tests cover every new engine function
- [ ] Save compatibility preserved
- [ ] Build passes (`npm run build`)

## Baseline

- 222 tests passing (61 abilities + 69 personality + 22 engine + 23 data + 16 hooks + 14 components + 17 tabs)
- Build clean

## Tasks

### Task 0: Capture Baseline
- **Agent**: tester
- **Do**: Run `npx vitest run` and `npm run build`. Record exact pass/fail counts per test file. Note any warnings.
- **Done when**: Baseline snapshot documented — 222 passing, 0 failing, build clean

### Task 1: Status Effect Registry + Enemy Ability Data
- **Agent**: implementer
- **Do**:
  1. In `src/data/constants.js`, add `STATUS_EFFECTS` object with entries for: `bleed`, `poison`, `slow`, `weaken`, `fortify`. Each entry has: `name`, `type` (dot|debuff|buff), `icon` (text character), `desc`, `maxStacks` (for DoTs), and for stat-based effects: `stat`, `modifier`.
  2. In `src/data/enemies.js`, add an `abilities` array to 4 enemy templates:
     - Scav Raider: `dirtyFight` → applies `weaken`, cooldown 3, chance 0.4
     - Spore Beast: `toxicSpores` → applies `poison`, cooldown 4, chance 0.5, targetType `random`
     - Psi-Wraith: `mindDrain` → drains 15 MP, cooldown 3, chance 0.5
     - Heavy Sentinel: `fortify` → applies `fortify` to self, cooldown 4, chance 0.6, targetType `self`
  3. In `src/engine/combat.js` `generateEncounter`, initialize `abilityCooldowns: {}` on each enemy instance that has abilities.
- **Files**: `src/data/constants.js`, `src/data/enemies.js`, `src/engine/combat.js`
- **Must not break**: Existing data tests (23), existing enemy generation logic, all ability tests (61)
- **Done when**: Data files updated, `npx vitest run` still shows 222 passing, `npm run build` clean

### Task 2: Status Effect Engine Functions + Tests
- **Agent**: implementer
- **Do**:
  1. In `src/engine/combat.js`, add these pure functions:
     - `applyStatusEffect(unit, effectId, source, options)` — Adds effect to `unit.activeEffects`. For DoTs: if `effectId === 'bleed'` and already present, increment stack count (max 3). For `poison`: don't stack, refresh duration. For stat debuffs: add as normal activeEffect entry. Return log message string.
     - `removeStatusEffect(unit, effectId)` — Remove specific effect by id from `activeEffects`. Return log message.
     - `tickStatusEffects(unit)` — Process all effects: decrement `remainingRounds`, apply DoT damage (bleed: 5 per stack per tick, poison: 8 per tick), remove expired effects. Return `{ unit, logEntries: string[], totalDotDamage: number }`.
  2. Integrate `tickStatusEffects` into `applyTurnStartEffects` — call it for each unit (ally and enemy) at turn start, collect log entries.
  3. Delete the orphaned `tickEffects` export. Update any tests that reference it to use the new `tickStatusEffects` or `applyTurnStartEffects` path.
  4. In `tickStatusEffects`: when checking healing on a poisoned unit, export a helper `getHealingModifier(unit)` that returns 0.5 if poisoned, 1.0 otherwise. Update `executeAbility` heal path to use it.
  5. For `slow` effect: modify turn order calculation (wherever speed is used for ordering) to factor in active slow effects via `getBuffModifiedStats`.
  6. Add `slow` and `weaken` handling to `getBuffModifiedStats` switch cases (speed and damage stats).
  7. Write tests for every new function: apply, remove, tick, stacking, max stacks, poison heal reduction, slow speed reduction, expiry.
- **Files**: `src/engine/combat.js`, `tests/abilities.test.js` (or new `tests/statusEffects.test.js`)
- **Must not break**: All 222 existing tests, existing buff/debuff behavior, combat math
- **Depends on**: Task 1
- **Done when**: New functions work, new tests pass, all 222 original tests still pass

### Task 3: Enemy Ability Execution + Tests
- **Agent**: implementer
- **Do**:
  1. In `src/engine/combat.js`, add `executeEnemyAbility(enemy, squad, enemies)`:
     - Check if enemy has `abilities` array. If not, return null (normal attack).
     - For each ability: check if `abilityCooldowns[abilityId] <= 0`. If off cooldown, roll `Math.random() < chance`.
     - On success: execute the ability effect (apply status effect to target, or drain MP, or self-buff). Set cooldown. Return `{ target, ability, logEntry }`.
     - On failure (all on cooldown or rolls fail): return null (normal attack).
  2. Target selection per `targetType`:
     - `random`: random alive ally
     - `self`: the enemy itself
     - Default: random alive ally
  3. Add `tickEnemyCooldowns(enemy)` — decrement all cooldowns by 1 each round.
  4. Write tests: enemy with ability fires it, cooldown prevents refire, chance-based (mock Math.random), MP drain reduces operative MP, self-buff applies to enemy.
- **Files**: `src/engine/combat.js`, test file
- **Must not break**: Existing enemy turn logic, all 222 tests
- **Depends on**: Task 2
- **Done when**: Enemy abilities fire correctly with cooldowns, tested, no regressions

### Task 4: Hook Integration — Wire Enemy Abilities into Combat Flow
- **Agent**: implementer
- **Do**:
  1. In `src/hooks/useMission.js`, in the enemy turn execution path:
     - Before the existing `executeEnemyTurn` call, try `executeEnemyAbility(enemy, squad, enemies)`.
     - If it returns a result, use that instead of normal attack. Apply state changes. Add log entry.
     - If null, proceed with normal `executeEnemyTurn`.
  2. After each round, call `tickEnemyCooldowns` on all alive enemies.
  3. Collect log entries from `applyTurnStartEffects` (DoT ticks) and surface them in the combat log state.
  4. Ensure `abilityCooldowns` is initialized on enemy instances at encounter start (from Task 1).
  5. Save compatibility: guard all new fields with `|| {}` / `|| []` defaults.
- **Files**: `src/hooks/useMission.js`
- **Must not break**: Turn flow, action menu, ally abilities, encounter transitions, 222 tests
- **Depends on**: Task 3
- **Done when**: Enemy abilities fire during combat, DoT damage ticks at turn start, combat log populated, all tests pass

### Task 5: UI — Effect Icons, Tooltips, and Combat Log
- **Agent**: implementer
- **Do**:
  1. **PartyStatusPanel.jsx**: Replace `▲{n}`/`▼{n}` count badges with individual effect icons. For each effect in `operative.activeEffects`, render icon from `STATUS_EFFECTS` registry + remaining rounds number. Add hover tooltip showing effect name + description.
  2. **UnitTile.jsx**: Add effect icon row below enemy HP bar. Same pattern: icon + duration for each `activeEffects` entry.
  3. **BattleScene.jsx** (or wherever combat log renders): Add new log entries for effect application ("Spore Beast uses Toxic Spores on Kira!"), DoT ticks ("Kira takes 8 poison damage"), and effect expiry ("Bleed on Mira expired").
  4. **CSS** in `global.css`: Style effect icons (small inline badges), buff icons green-tinted, debuff icons red-tinted. Tooltip styling (dark bg, light text, appears on hover). Combat log entry styling for effect events.
- **Files**: `src/components/combat/PartyStatusPanel.jsx`, `src/components/combat/UnitTile.jsx`, `src/components/combat/BattleScene.jsx`, `src/styles/global.css`
- **Must not break**: Component rendering, existing combat UI layout, 222 tests (especially 14 component + 17 tab tests)
- **Depends on**: Task 4
- **Done when**: Effects visible on allies and enemies, tooltips work, combat log shows effect events, all tests pass, build clean

### Task 6: Full Regression Test Run
- **Agent**: tester
- **Do**: Run `npx vitest run` and `npm run build`. Compare to Task 0 baseline. Flag ANY test that changed from pass to fail. Verify new test count is higher than 222. Run a quick manual check: start dev server, enter combat, verify UI renders without errors.
- **Must not break**: Everything
- **Depends on**: Task 5
- **Done when**: Zero net-new failures, build clean, new tests all pass

### Task 7: Browser Verification
- **Agent**: implementer (with Playwright)
- **Do**: Start dev server (`npm run dev`), navigate to a mission with Scav Raiders or Spore Beasts. Enter combat. Verify:
  1. Combat loads without errors
  2. Enemy abilities fire (check combat log for ability messages)
  3. Effect icons appear on affected units
  4. DoT damage ticks show in combat log
  5. Effects expire after correct number of rounds
  6. Tooltips appear on hover over effect icons
  Take screenshots for evidence.
- **Depends on**: Task 6
- **Done when**: All 6 checks confirmed visually

### Task 8: Final Review
- **Agent**: reviewer
- **Do**: Review all changes against success criteria. Verify:
  1. Every success criterion is met
  2. Blast radius was checked — no unexpected changes to unrelated files
  3. Test baseline comparison shows no regressions
  4. New functions are pure (no React, no side effects in engine)
  5. Save compatibility (new fields have defaults)
  6. No hardcoded data in components (all from constants/data files)
- **Done when**: All success criteria met, no regressions, no critical findings
