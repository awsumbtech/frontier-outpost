# Phase 4: Enemy AI Tactics — Design Doc

## Success Criteria

- [ ] Each AI profile (aggro, tactical, support, tank, assassin) produces noticeably different targeting behavior
- [ ] `selectEnemyAction()` replaces random `pick()` targeting — priority-based decision trees, not random
- [ ] `aiProfile` field added to all 12 enemy templates in `enemies.js`
- [ ] Boss phase transitions for Apex Predator and Core Guardian (enrage >50% HP, desperate <20% HP)
- [ ] Boss architecture supports adding abilities later (abilities array, cooldown infrastructure)
- [ ] Taunt mechanic still works (taunters draw fire, overridable by profile rules)
- [ ] Existing ability system unchanged (cooldowns, chance-based firing, status effects)
- [ ] All 281 existing tests pass + new tests for every AI function
- [ ] Save compatibility preserved (old saves without `aiProfile` work fine)
- [ ] No existing game mechanics broken or sacrificed

## What Must NOT Change

- Taunt mechanic (taunters draw fire)
- Ability system (cooldowns, chance, targetType)
- Status effects system (bleed, poison, slow, weaken, fortify)
- 600ms enemy turn visual delay
- Between-encounter healing (15% HP, 25% shields)
- Combat log behavior
- Player action menu (Attack/Ability/Item/Defend)

## Blast Radius

### Files to change
- `src/data/enemies.js` — add `aiProfile` field to all templates, boss phase config
- `src/engine/combat.js` — new `selectEnemyAction()`, modify `executeEnemyTurn` to use it
- `src/hooks/useMission.js` — wire `selectEnemyAction` into `processEnemyTurn`

### Files that depend on changed code
- `src/hooks/useMission.js` — calls `executeEnemyTurn`
- `src/components/combat/CombatEnemy.jsx` — renders enemy state (may need boss phase indicator)
- All combat test files — must continue passing

### Test suites to run
- `src/engine/__tests__/engine.test.js`
- `src/engine/__tests__/abilities.test.js`
- `src/engine/__tests__/statusEffects.test.js`
- `src/hooks/__tests__/hooks.test.jsx`
- New: `src/engine/__tests__/enemyAI.test.js`

## Risks

- **Over-engineering AI**: Simple priority lists > complex state machines. Each profile is 10-20 lines of logic.
- **Boss phase transitions mutating state unexpectedly**: Phase changes must be pure — return new stats, don't mutate in place.
- **Breaking taunt**: The taunt override (aggro ignores 30%) must be tested explicitly.
- **Save compat**: Enemies are generated fresh each encounter from templates, so `aiProfile` on templates is safe. No save migration needed.

## AI Profile → Enemy Mapping

| Profile | Enemies | Key Behavior |
|---------|---------|-------------|
| aggro | Feral Drone, Apex Predator | Target lowest HP, double down on wounded |
| tactical | Scav Raider, Rogue Mech | Target highest damage dealer, switch off defenders |
| support | Hive Swarm | Buff allies, target healers |
| tank | Heavy Sentinel, Core Guardian | Self-buff, power attack cycle |
| assassin | Xeno Stalker, Psi-Wraith | Target lowest armor, debuff, flee at low HP |

## Boss Phase Transitions

Apex Predator and Core Guardian get `bossPhases` config:
- Phase 1 (>50% HP): Normal behavior per profile
- Phase 2 (≤50% HP): Enrage (+30% damage modifier)
- Phase 3 (≤20% HP): Desperate (AoE/ignore defense — implemented when abilities are added; for now just +50% damage)

Phase transitions are stat modifiers returned by a pure function, not mutations. Abilities can be added to bosses later and the phase system will gate them.

## Architecture Decision

`selectEnemyAction(enemy, aliveAllies, aliveEnemies)` returns:
```js
{ action: 'attack', targetId: 'op3' }
// or when abilities exist:
{ action: 'ability', targetId: 'op1', abilityId: 'mindDrain' }
// or for self-buffs:
{ action: 'ability', targetId: enemy.id, abilityId: 'fortify' }
```

Each profile is a function: `(enemy, allies, enemies) => { targetId }` for targeting, plus ability priority logic layered on top.
