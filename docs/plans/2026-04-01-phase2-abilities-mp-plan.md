# Phase 2: Active Abilities + Class Resources — Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"

## Success Criteria
- [ ] Each class has a named resource pool (Resolve/Focus/Charge/Serum) displayed in PartyStatusPanel
- [ ] "Ability" button in ActionMenu opens a submenu of learned abilities with costs
- [ ] Abilities grayed out when insufficient resource
- [ ] Each class has 3-4 active abilities tied to learned skills (option B: unlock via skill learning)
- [ ] Buff/debuff system with duration tracking (rounds tick down, visual indicators on units)
- [ ] Resource recovers between encounters (like HP/shields)
- [ ] Old saves are wiped cleanly (save version bump)
- [ ] All 161 existing tests still pass
- [ ] Attack/Defend/Item flow unchanged
- [ ] Combat math for basic attacks unchanged

## Baseline
- Build: ✅ passes
- Tests: 161 passing, 0 failing (6 test files)

## Class Resource Names
| Class | Resource | Base Pool |
|-------|----------|-----------|
| Vanguard | Resolve | 40 |
| Recon | Focus | 50 |
| Engineer | Charge | 60 |
| Medic | Serum | 80 |

## Ability Definitions
See `docs/plans/2026-04-01-ff-combat-phases-2-4.md` for the full table. Key mapping:

**Vanguard (Resolve)**
- Shield Wall (Fortify) — 15 cost, +50% armor 2 rounds
- Taunt (Provoke) — 10 cost, force all enemies to target you 1 round
- Intercept (Guardian Stance) — 20 cost, guard an ally, take their hits this round
- Power Strike (Cover Fire) — 12 cost, attack at 1.5x damage

**Recon (Focus)**
- Assassinate (Lethal Edge) — 25 cost, 2x damage +30% crit
- Smoke Bomb (Shadowstep) — 15 cost, +40% evasion 2 rounds
- Double Strike (Phantom Strike) — 20 cost, two hits at 70% each
- Mark Target (Mark for Death) — 10 cost, target takes +30% damage 2 rounds

**Engineer (Charge)**
- Deploy Turret (Deploy Turret skill) — 20 cost, turret auto-fires 3 rounds
- EMP Blast (EMP Pulse) — 25 cost, stun all enemies 1 round
- Armor Shred (Hack Systems) — 15 cost, reduce target armor 40% for 3 rounds
- Orbital Strike (Orbital Uplink) — 30 cost, heavy AoE to all enemies

**Medic (Serum)**
- Heal (Triage) — 15 cost, heal one ally 40% max HP
- Revive (Resuscitate) — 30 cost, revive downed ally at 30% HP (1/encounter)
- Aura Boost (Adrenaline Shot) — 20 cost, +15% damage all allies 3 rounds
- Purge (Purge Toxins) — 12 cost, remove debuffs from one ally

## Tasks

### Task 0: Capture Baseline
- **Agent**: tester
- **Do**: Run `npm run build` and `npx vitest run`. Record exact counts.
- **Done when**: 161 tests passing, build clean

### Task 1: Data Layer — Resource pools + ability definitions
- **Agent**: implementer
- **Do**:
  1. In `src/data/constants.js`: Add `CLASS_RESOURCE_NAMES` map and `CLASS_BASE_RESOURCE` map
  2. In `src/data/classes.js`: Add `abilities` array to each class (not inside branches — at class level). Each ability: `{ id, name, cost, desc, unlockSkill, targetType, effectType, effect }`. `unlockSkill` is the skill name that must be learned. `targetType`: "self" | "enemy" | "ally" | "allEnemies" | "allAllies".
  3. In `src/engine/operatives.js`: Add `currentResource` field in `createOperative` (set to class base). Add resource to `getEffectiveStats` return (gear `mp` stat bonus → `resource` stat).
  4. In `src/engine/saves.js`: Add `SAVE_VERSION = 2`. On `loadGame`, check version — if missing or < 2, return `null` (wipe old saves).
- **Files**: `src/data/constants.js`, `src/data/classes.js`, `src/engine/operatives.js`, `src/engine/saves.js`
- **Must not break**: `getEffectiveStats` still returns all existing stats correctly. Existing tests pass.
- **Done when**: Data structures in place, `createOperative` includes `currentResource`, save version gate works

### Task 2: Combat Engine — `executeAbility` + buff/debuff system
- **Agent**: implementer
- **Do**:
  1. Add `activeEffects` array tracking to combat functions. Each effect: `{ id, type, stat, modifier, remainingRounds, source, ... }`
  2. Add `executeAbility(attackerId, abilityId, targetId, squad, enemies)` pure function. Looks up ability from class data, deducts resource cost, applies effect based on `effectType`.
  3. Add `tickEffects(squad, enemies)` — called at turn start. Decrements `remainingRounds`, removes expired effects, applies per-turn damage (bleed/poison).
  4. Modify `applyTurnStartEffects` to call `tickEffects`.
  5. Add `getModifiedStats(unit)` or extend `getEffectiveStats` to factor in active buff/debuff modifiers.
  6. Handle `applySquadState` sync — must now copy `currentResource` and `activeEffects`.
- **Files**: `src/engine/combat.js`, `src/hooks/useMission.js` (applySquadState only)
- **Must not break**: `executeAllyAttack`, `executeEnemyTurn`, `executeAllyDefend`, `executeItemUse` all unchanged. Existing combat flow works.
- **Done when**: `executeAbility` handles all 16 abilities, `tickEffects` manages durations, `applySquadState` syncs new fields

### Task 3: Tests for ability engine
- **Agent**: tester
- **Do**: Write tests in `src/engine/__tests__/abilities.test.js`:
  - `executeAbility` deducts resource correctly
  - `executeAbility` returns error/no-op when insufficient resource
  - Each ability type applies correct effect (buff duration, damage, heal, stun, etc.)
  - `tickEffects` decrements durations and removes expired effects
  - `getEffectiveStats` incorporates active buffs
  - Save version gate wipes old saves
- **Files**: `src/engine/__tests__/abilities.test.js`
- **Must not break**: All existing 161 tests
- **Done when**: New tests pass, old tests pass

### Task 4: Hook Layer — Wire abilities into turn state machine
- **Agent**: implementer
- **Do**:
  1. Add new subPhases: `"selectAbility"` (show ability list), `"selectAbilityTarget"` (pick target for ability)
  2. Add `selectAbility()` handler — sets subPhase to "selectAbility"
  3. Add `chooseAbility(abilityId)` handler — if self-target or allEnemies, execute immediately. If single target, set subPhase to "selectAbilityTarget".
  4. Update `chooseTarget` to handle `selectedAction === "ability"` path
  5. Add `cancelSelection` support for ability subPhases (back to awaitingAction)
  6. Resource recovery in `betweenEncounterHeal` — restore resource like HP/shields
  7. In `startMission` — initialize `currentResource` to max on mission start
  8. Export `selectAbility`, `chooseAbility` from hook return
- **Files**: `src/hooks/useMission.js`
- **Must not break**: Attack/Defend/Item flows. Turn advancement. Enemy turns. Round end. Decision events.
- **Done when**: Full ability flow works: Ability button → pick ability → pick target → execute → advance turn

### Task 5: UI Components — ActionMenu, AbilitySelector, PartyStatusPanel
- **Agent**: implementer
- **Do**:
  1. `ActionMenu.jsx`: Add 4th "Ability" button. Show resource name + current/max in header.
  2. New `AbilitySelector.jsx`: List learned abilities with costs, descriptions. Gray out if insufficient resource. Back button to return to action menu.
  3. `PartyStatusPanel.jsx`: Add resource bar below shield bar (use class-specific color). Show buff/debuff icons next to name.
  4. Update `MissionTab.jsx` to render AbilitySelector when subPhase is "selectAbility", pass new handlers.
- **Files**: `src/components/combat/ActionMenu.jsx`, `src/components/combat/AbilitySelector.jsx` (new), `src/components/combat/PartyStatusPanel.jsx`, `src/components/tabs/MissionTab.jsx`
- **Must not break**: Existing combat UI layout. Action menu responsiveness. HP/shield bars.
- **Done when**: All UI renders correctly, ability flow is visually complete

### Task 6: CSS Styling
- **Agent**: implementer
- **Do**: Add styles for:
  - Ability button in action menu (distinct color, e.g. purple/cyan)
  - AbilitySelector panel (list with cost badges, disabled state)
  - Resource bar in PartyStatusPanel (distinct from HP/shield, class-colored)
  - Buff/debuff icons (small badges, green for buffs, red for debuffs)
  - Resource display in action menu header
- **Files**: `src/styles/global.css`
- **Must not break**: Existing combat styling
- **Done when**: Styled consistently with existing sci-fi aesthetic

### Task 7: Regression Verification
- **Agent**: tester
- **Do**: Run `npx vitest run` and `npm run build`. Compare to baseline (161 tests, build clean). Flag any regressions.
- **Done when**: Zero net-new failures, build passes

### Task 8: Final Review
- **Agent**: reviewer
- **Do**: Review all changes against success criteria. Verify:
  - All 4 classes have correct abilities with correct unlock skills
  - Resource costs are balanced per the plan
  - Buff durations tick correctly
  - Save wipe works (no crash on old data)
  - No existing combat behavior changed
- **Done when**: All success criteria met, no regressions

## Blast Radius
- **Files changing**: `constants.js`, `classes.js`, `operatives.js`, `saves.js`, `combat.js`, `useMission.js`, `ActionMenu.jsx`, `PartyStatusPanel.jsx`, `MissionTab.jsx`, `global.css`
- **New files**: `AbilitySelector.jsx`, `abilities.test.js`
- **Consumers of changed code**: Every component that imports from combat.js, operatives.js, or useMission.js
- **Test suites**: All 6 existing suites + 1 new

## Risks
| Risk | Mitigation |
|------|-----------|
| `applySquadState` doesn't sync new fields → resource/buffs lost | Explicitly add `currentResource` and `activeEffects` to sync function |
| Buff modifier stacking breaks existing damage calc | `getEffectiveStats` applies buffs additively, test edge cases |
| Ability targeting wrong subPhase → stuck UI | Ensure every subPhase has a cancel path back to awaitingAction |
| Resource recovery between encounters overshoots | Cap at max resource (same pattern as HP/shield) |
