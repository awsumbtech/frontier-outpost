# Phase 3: Status Effects System — Design Doc

## Success Criteria

- [ ] DoT effects (Bleed, Poison) deal damage each turn and expire correctly
- [ ] Bleed stacks; Poison reduces healing by 50%
- [ ] Slow (-30% speed) and Weaken (-20% damage) debuffs work with duration tracking
- [ ] 4 enemy types gain abilities: Scav Raider (Weaken), Spore Beast (Poison), Psi-Wraith (MP drain), Heavy Sentinel (self armor buff)
- [ ] Enemy abilities fire on cooldown, not every turn
- [ ] UI shows individual effect icons with remaining duration on both allies and enemies
- [ ] Effect tooltips on hover explain what each effect does
- [ ] Combat log announces effect application, tick damage, and expiry
- [ ] All 222 existing tests still pass
- [ ] New tests cover every new engine function
- [ ] Save compatibility preserved (old saves don't crash)
- [ ] No changes to action menu flow, turn order logic, or ally ability behavior
- [ ] Build passes (`npm run build`)

## Blast Radius

### Files to change
| File | What changes |
|------|-------------|
| `src/engine/combat.js` | New effect functions, DoT tick logic in `applyTurnStartEffects`, enemy ability execution |
| `src/data/enemies.js` | Add `abilities` and `aiProfile` fields to 4 enemy templates |
| `src/data/constants.js` | Status effect definitions (id, name, description, icon, stat, modifier, duration) |
| `src/hooks/useMission.js` | Wire enemy ability execution into enemy turn flow |
| `src/components/combat/PartyStatusPanel.jsx` | Replace count badges with individual effect icons + tooltips |
| `src/components/combat/UnitTile.jsx` | Add effect icons for enemies |
| `src/components/combat/BattleScene.jsx` | Pass effect data, combat log entries |
| `src/styles/global.css` | Effect icon styling, buff/debuff colors, tooltip styles |

### Files that depend on changed code
| File | Risk |
|------|------|
| `src/components/combat/CombatAlly.jsx` | Renders via PartyStatusPanel — verify no prop breakage |
| `src/components/combat/CombatEnemy.jsx` | Renders via UnitTile — verify no prop breakage |
| `src/components/tabs/MissionTab.jsx` | Orchestrates combat UI — verify flow unchanged |
| All existing test files | Must continue passing |

### Test suites to run
- `npx vitest run` — all 222 tests (full regression)
- Manual: verify combat renders correctly on Mission tab

## Risks

| Risk | Mitigation |
|------|-----------|
| DoT stacking makes fights unwinnable | Cap Bleed stacks (max 3), Poison doesn't stack |
| Enemy abilities every turn is oppressive | Cooldown system (ability fires every N turns) |
| `tickEffects` orphan vs inline ticking confusion | Consolidate: delete orphan, use one canonical path |
| `getBuffModifiedStats` not called in passive procs | Out of scope for Phase 3 — note for future cleanup |
| Speed modification (Slow) affects turn order mid-round | Apply Slow to next round's turn order, not current |

## Approach

### 1. Status Effect Registry (data layer)

Add `STATUS_EFFECTS` to `constants.js` — a lookup table defining every effect:

```js
export const STATUS_EFFECTS = {
  bleed: { name: 'Bleed', type: 'dot', icon: '🩸', desc: 'Takes damage each turn. Stacks up to 3x.', maxStacks: 3 },
  poison: { name: 'Poison', type: 'dot', icon: '☠', desc: 'Takes damage each turn. Halves healing received.', maxStacks: 1 },
  slow: { name: 'Slow', type: 'debuff', stat: 'speed', modifier: -0.3, icon: '🐌', desc: '-30% speed next round.' },
  weaken: { name: 'Weaken', type: 'debuff', stat: 'damage', modifier: -0.2, icon: '💔', desc: '-20% damage for 2 rounds.' },
  fortify: { name: 'Fortify', type: 'buff', stat: 'armor', modifier: 0.4, icon: '🛡', desc: '+40% armor for 2 rounds.' },
};
```

### 2. Engine functions (combat.js)

- `applyStatusEffect(unit, effectId, source, options)` — add/stack effect on a unit
- `removeStatusEffect(unit, effectId)` — remove specific effect
- `tickStatusEffects(unit)` — decrement durations, apply DoT damage, return log entries
- Consolidate: fold orphaned `tickEffects` into the canonical `applyTurnStartEffects` path
- `executeEnemyAbility(enemy, squad, enemies)` — enemy ability execution with cooldown check

### 3. Enemy abilities (data layer)

Add to 4 enemy templates in `enemies.js`:

```js
{ name: 'Scav Raider', ..., abilities: [{ id: 'dirtyFight', appliesEffect: 'weaken', cooldown: 3, chance: 0.4 }] }
{ name: 'Spore Beast', ..., abilities: [{ id: 'toxicSpores', appliesEffect: 'poison', cooldown: 4, chance: 0.5, targetType: 'random' }] }
{ name: 'Psi-Wraith', ..., abilities: [{ id: 'mindDrain', drainMp: 15, cooldown: 3, chance: 0.5 }] }
{ name: 'Heavy Sentinel', ..., abilities: [{ id: 'fortify', appliesEffect: 'fortify', cooldown: 4, chance: 0.6, targetType: 'self' }] }
```

Enemy ability logic: each turn, check if any ability is off cooldown → roll chance → execute or normal attack.

### 4. Hook integration (useMission.js)

- In enemy turn execution: call `executeEnemyAbility` before falling back to normal attack
- Track enemy cooldowns on enemy objects (`abilityCooldowns: { dirtyFight: 0 }`)
- Collect combat log entries from `tickStatusEffects` and surface them in UI

### 5. UI upgrades

- **PartyStatusPanel**: Replace `▲{n}`/`▼{n}` badges with individual icons from STATUS_EFFECTS registry, show remaining rounds, tooltip on hover
- **UnitTile**: Add effect icon row for enemies (same pattern)
- **Combat log**: New entries for "Spore Beast uses Toxic Spores on Kira!", "Kira takes 8 poison damage", "Bleed on Mira expired"

### 6. Cleanup

- Delete orphaned `tickEffects` export (consolidate into `applyTurnStartEffects`)
- Update existing tests that reference `tickEffects` to use the consolidated path

## Build Sequence

1. Data: STATUS_EFFECTS registry in constants.js
2. Data: Enemy abilities in enemies.js
3. Engine: `applyStatusEffect`, `removeStatusEffect`, `tickStatusEffects` + tests
4. Engine: Consolidate `tickEffects` orphan into `applyTurnStartEffects` + DoT ticking
5. Engine: `executeEnemyAbility` with cooldown logic + tests
6. Hook: Wire enemy abilities into useMission.js enemy turn flow
7. UI: Effect icons + tooltips on PartyStatusPanel
8. UI: Effect icons on UnitTile (enemies)
9. UI: Combat log entries for effects
10. CSS: Styling for effect icons, tooltips, buff/debuff colors
11. Full regression test run
12. Manual verification via browser
