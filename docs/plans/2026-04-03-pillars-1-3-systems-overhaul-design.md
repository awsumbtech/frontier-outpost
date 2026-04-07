# Pillars 1-3: Systems Honesty Overhaul

**Date:** 2026-04-03
**Scope:** Wire every dead skill, fix every broken system, make every decision real
**Baseline:** 325 tests passing (9 files)

## Philosophy

Every system must deliver what it promises. If the UI says "+30% damage", damage increases by 30%. If a skill costs 3 points, it does something meaningful. If a decision presents 3 choices, they produce different outcomes.

---

## Success Criteria

- [ ] All 22-25 dead skill effects have engine code that executes them
- [ ] All 15 decision choices produce mechanically distinct outcomes
- [ ] counterAmbush actually applies +30% damage on round 1
- [ ] Intercept ability redirects attacks to the Vanguard
- [ ] Adrenaline stim applies +50% damage for 3 rounds
- [ ] Purge Shot stim applies evasion boost for 2 rounds
- [ ] Gadgets can be activated in combat with real burst effects
- [ ] All 325 existing tests still pass
- [ ] New tests cover every wired-up system
- [ ] Save compatibility preserved (new fields have defaults)
- [ ] Build passes (`npm run build`)

## Must NOT Change

- Turn-based combat flow (speed-ordered initiative, 4 actions per turn)
- 5 enemy AI targeting profiles
- Story content and chapter structure
- Exploration map / Phaser layer
- Component architecture (thin components, logic in engine/hooks)
- Existing working abilities (16 across 4 classes)
- XP/credit reward formulas

---

## Blast Radius

### Files That Will Change

| File | Changes | Risk |
|------|---------|------|
| `src/engine/combat.js` | Major — implement skill effects, fix counterAmbush, wire stims, gadgets, intercept | HIGH — core combat math |
| `src/engine/operatives.js` | Moderate — aura propagation in getEffectiveStats | MEDIUM — stat aggregation |
| `src/engine/gear.js` | Minor — gadget activation helpers | LOW |
| `src/engine/stims.js` | Minor — fix adrenaline/purge flags | LOW |
| `src/hooks/useMission.js` | Moderate — wire all decision effects | MEDIUM — state machine |
| `src/data/decisions.js` | Minor — clarify effect descriptions | LOW |

### Files That Depend On Changed Code

| Consumer | Dependency | Verification |
|----------|------------|--------------|
| All combat UI components | combat.js functions | Visual combat flow still works |
| MissionTab.jsx | useMission.js state | Decision UI still renders |
| SquadTab.jsx | operatives.js getEffectiveStats | Stat display accurate |
| CombatAlly.jsx / CombatEnemy.jsx | combat state shape | No new required fields without defaults |
| All 325 existing tests | engine + hooks | Must all pass |

---

## Pillar 1: Wire All Dead Skills

### Category A — Simple Stat Reads (add check in combat.js)

These just need the combat engine to READ a stat it already has on the operative:

| Skill | Key | Implementation |
|-------|-----|----------------|
| Damage Plating | `flatDR: 4` | In `executeEnemyTurn`: subtract `flatDR` from incoming damage after armor calc |
| Immovable Object | `stunImmune: true` | In `applyTurnStartEffects`: skip stun if `stats.stunImmune` |
| Shield Bash | `attackStun: 0.2` | In `executeAllyAttack`: roll stun chance post-hit |
| Hit and Run | `hitRunEvasion: 15` | In `executeAllyAttack`: add temp evasion buff after attacking |
| Hack Systems | `enemyDmgReduce: 0.1` | In `executeEnemyTurn`: reduce enemy damage by squad's max `enemyDmgReduce` |
| Overload Network | `stunVuln: 0.3` | In `executeAllyAttack`: bonus damage vs stunned targets |
| Target Painter | `turretArmorShred: 3` | In turret logic: reduce target armor per turret hit |

### Category B — Aura Effects (need squad-wide propagation)

These require a new `getAuraBuffs(squad)` function that sums aura stats from all operatives:

| Skill | Key | Effect |
|-------|-----|--------|
| Rallying Presence | `auraArmor: 5` | +5 armor to all allies |
| Neural Boost | `auraCrit: 4` | +4 crit to all allies |
| Battle Frenzy | `auraDamage: 6, auraSpeed: 3` | +6 damage, +3 speed to all allies |
| Berserk Protocol | `berserkDmg: 15, berserkCrit: 10` | +15 damage, +10 crit to all allies (rename to aura semantics) |

Implementation: Add `getAuraBuffs(squad, opId)` to `operatives.js`. Called by `getEffectiveStats` when squad is passed. Aura buffs apply to ALL allies (including self). This is ~15 lines.

### Category C — Conditional Effects (need HP/round checks)

| Skill | Key | Trigger |
|-------|-----|---------|
| Last Stand | `lastStandDmg/Armor/Heal` | When operative HP < 25% max |
| Wraith Mode | `wraithRounds/Evasion/DmgMult` | Rounds 1-2 of each encounter |
| Berserk Protocol | `berserkHpCost: 0.15` | Medic pays 15% HP for aura buffs |

Implementation: Check conditions in `applyRoundStartEffects` and `executeAllyAttack`. ~20 lines each.

### Category D — Per-Round Passives (need round-start/end hooks)

| Skill | Key | Effect |
|-------|-----|--------|
| Scorched Earth | `roundAoeDmg: 15, armorBurn: 5` | Every round: 15 AoE + permanently reduce enemy armor by 5 |
| Combat Stims | `autoStim: 1` | Generate 1 health stim at encounter start |
| Adrenaline Shot | `buffTopDamage: 8` | Highest-damage ally gets +8 damage each round |
| Overclock Stim | `overclockAlly: 0.2` | 20% chance fastest ally acts twice |

Implementation: Add to `applyRoundStartEffects` and `applyRoundEndEffects`. ~30 lines.

### Category E — Triggered Passives (need event hooks)

| Skill | Key | Trigger |
|-------|-----|---------|
| Mark for Death | `markTarget: true` | First hit auto-marks target (+20% damage taken from all) |
| Death Sentence | `guaranteedCritMarked/killResetMark` | Auto-crit marked targets; kills move mark |
| Trauma Kit | `secondHeal: 0.5` | Heal second-lowest ally at 50% rate |
| Resuscitate | `revive: 0.4` | Once/encounter: auto-revive first downed ally |
| Miracle Worker | `unlimitedRevive/healBonus/autoRevive` | Remove revive limit, +50% healing, auto-revive |
| Intercept passive | `intercept: 0.15-0.35` | Passive chance to redirect hits to Vanguard |
| Fortress Protocol | `interceptDR: 0.2` | Interceptor takes 20% less redirected damage |

Implementation: Hook into `executeEnemyTurn` (intercept), `executeAllyAttack` (mark/death sentence), `applyAllyPassives` (heals/revive). ~60 lines.

---

## Pillar 2: Fix Broken Systems

### 2A — counterAmbush Bug
**File:** `combat.js` line 135
**Fix:** After the log message, apply a `counterAmbush` activeEffect to all squad members: `{ stat: 'damage', modifier: 0.3, rounds: 1 }`. This gets picked up by `getBuffModifiedStats` automatically.

### 2B — Intercept Ability
**File:** `combat.js` `executeEnemyTurn`
**Fix:** Before resolving enemy hit on target, check if target has `intercepted` in `activeEffects`. If so, redirect to the interceptor. Apply `interceptDR` reduction.

### 2C — Adrenaline Stim
**File:** `combat.js` `executeItemUse`
**Fix:** Instead of setting `_adrenalineRounds`, push `activeEffect: { stat: 'damage', modifier: 0.5, rounds: 3 }`. This flows through `getBuffModifiedStats` automatically.

### 2D — Purge Shot Stim
**File:** `combat.js` `executeItemUse`
**Fix:** Push `activeEffect: { stat: 'evasion', modifier: 10, rounds: 2, additive: true }`. Add `additive` handling in `getBuffModifiedStats`.

### 2E — Gadget Activation
**Files:** `combat.js` (new `executeGadgetUse` function), `useMission.js` (add to action menu)
**Fix:** Add "Gadget" as a 5th combat action. `healBurst` heals self, `shieldBurst` restores shields, `dmgBurst` deals AoE damage, `stunBurst` stuns target. Decrement `uses` counter. Gadget becomes inert when uses = 0.

---

## Pillar 3: Make All Decisions Real

### Design Principle
Every choice in a decision event should have a **real mechanical trade-off**. No choice should be strictly better than the alternatives. Format: risk vs. reward.

### Ambush Detected (decisions.js event 0)
| Choice | Effect | Implementation |
|--------|--------|----------------|
| Counter-ambush | +30% squad damage round 1 (FIX existing) | Apply activeEffect in `applyRoundStartEffects` |
| Fall back to cover | +20 armor all allies for this encounter | Apply armor activeEffect via `handleDecision` |
| Push through | -15% max HP all allies (existing, works) | Already implemented |

### Supply Cache (decisions.js event 1)
| Choice | Effect | Implementation |
|--------|--------|----------------|
| Scan carefully | +1 guaranteed rare item at mission end | Set flag; check in loot generation |
| Grab and go | 50% chance: 2 common items; 50% chance: 10 damage AoE trap | Roll in `handleDecision`, apply immediately |
| Ignore | +10% XP bonus for remaining encounters (played it safe) | Set XP multiplier flag |

### Comms Intercept (decisions.js event 2)
| Choice | Effect | Implementation |
|--------|--------|----------------|
| Set ambush | Squad acts first next encounter (speed +50 round 1) | Massive speed buff round 1 via activeEffect |
| Avoid patrol | Skip next encounter entirely | Decrement remaining encounters |
| Jam comms | Enemies deal -20% damage this mission | Apply persistent debuff |

### Injured Civilian (decisions.js event 3)
| Choice | Effect | Implementation |
|--------|--------|----------------|
| Rescue | +50% XP from next encounter, but squad loses 1 round preparing | Grant XP buff, enemies get free round 1 |
| Mark for pickup | +25% XP from next encounter (smaller but safer) | Grant smaller XP buff |
| Move on | +15% resource recovery between encounters | Boost between-encounter resource regen |

### Power Relay (decisions.js event 4)
| Choice | Effect | Implementation |
|--------|--------|----------------|
| Overload offensively | 25 AoE to all enemies (existing, works) | Already implemented |
| Reroute to shields | +25 shield all (existing, works) | Already implemented |
| Salvage parts | Rare+ gear item (existing, works) | Already implemented |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Aura buffs create infinite stat stacking | Combat becomes trivially easy | Cap aura bonuses; test with 4-medic squad |
| Wraith Mode + Last Stand overlap | Recon becomes unkillable | Wraith is rounds 1-2 only; Last Stand is <25% HP — non-overlapping by design |
| Gadget action clutters combat UI | UX confusion | Only show Gadget button when operative has gadget with uses > 0 |
| Scorched Earth AoE per round too strong | Trivializes encounters | Balance: check vs enemy count; 15 damage is modest at tier 3-4 |
| Save migration | Old saves crash on new fields | All new state fields use `|| default` patterns |
| counterAmbush fix changes combat balance | Existing difficulty tuning shifts | +30% for 1 round is bounded; matches existing overload (25 AoE) in power |

---

## Test Plan

### New Test Files
- `src/engine/__tests__/skillEffects.test.js` — test every Category A-E skill
- `src/engine/__tests__/decisions.test.js` — test all 15 decision outcomes
- `src/engine/__tests__/gadgets.test.js` — test gadget activation and uses
- `src/engine/__tests__/stims.test.js` — test adrenaline and purge shot mechanical effects

### Regression
- All 325 existing tests must pass unchanged
- `npm run build` clean
- Manual playthrough: complete 1 mission with each class, verify skill effects fire
