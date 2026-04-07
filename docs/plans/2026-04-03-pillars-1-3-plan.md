# Pillars 1-3: Systems Honesty Overhaul — Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"

## Success Criteria (from design doc)
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

## Baseline
- 325 tests passing across 9 test files
- 0 failures, 0 skipped
- `npm run build` clean

---

## Tasks

### Task 0: Capture Baseline
- **Agent**: tester
- **Do**: Run `npx vitest run` and `npm run build`. Record exact pass/fail counts per file. This is the "before" snapshot.
- **Done when**: Baseline documented — 325 passing, 0 failing, build clean

---

### Task 1: Aura System + `getEffectiveStats` Enhancement
- **Agent**: implementer
- **Do**: Modify `src/engine/operatives.js` to support aura stat propagation. Currently `getEffectiveStats(op)` takes a single operative — add an optional `squad` parameter. When provided, scan all squad members for aura keys and add them to the result.

  **Aura keys to implement** (defined in `src/data/classes.js`):
  - `auraArmor` (Rallying Presence, line 29): +N armor to ALL alive allies
  - `auraCrit` (Neural Boost, line 133): +N crit to ALL alive allies
  - `auraDamage` (Battle Frenzy, line 136): +N damage to ALL alive allies
  - `auraSpeed` (Battle Frenzy, line 136): +N speed to ALL alive allies
  - `berserkDmg` (Berserk Protocol, line 137): treat as auraDamage (+15 dmg to all allies)
  - `berserkCrit` (Berserk Protocol, line 137): treat as auraCrit (+10 crit to all allies)
  - `berserkHpCost` (Berserk Protocol, line 137): reduce max HP of ALL alive allies by 15%

  **Implementation approach**:
  1. Add `getAuraBuffs(squad)` function that iterates all squad members, calls base `getEffectiveStats(op)` (no squad param) to get their raw stats, and sums all `aura*` and `berserk*` keys
  2. Modify `getEffectiveStats(op, squad)` — when `squad` is provided, call `getAuraBuffs(squad)` and add the aura values to the final stats
  3. For `berserkHpCost`: apply as `hp -= Math.round(hp * totalBerserkHpCost)` AFTER all other HP additions

  **Callers to update**: Every call to `getEffectiveStats` in `combat.js` that occurs within a function that has access to the squad array should pass it. The key ones:
  - `executeAllyAttack` (line 211): `getBuffModifiedStats(attacker, true)` → this calls `getEffectiveStats` internally, so update `getBuffModifiedStats` to accept and forward `squad`
  - `applyAllyPassives` (line 319): `getEffectiveStats(attacker)` → pass squad
  - `executeEnemyTurn` (line 404): `getBuffModifiedStats(target, true)` → pass squad
  - `selectEnemyTarget` (lines 468, 486, 500-501, 520-521): `getBuffModifiedStats(o, true)` → pass squad

  DO NOT change signatures of exported functions that components call — add `squad` as an optional last parameter where needed.

- **Files**: `src/engine/operatives.js`, `src/engine/combat.js`
- **Must not break**: All existing `getEffectiveStats(op)` calls without squad still work. All 325 tests pass.
- **Done when**: Aura buffs propagate squad-wide. A Vanguard with Rallying Presence adds +5 armor to teammates. A Medic with Berserk Protocol adds +15 dmg, +10 crit to all allies but costs them 15% max HP.

---

### Task 2: Wire Simple Combat Reads (Category A Skills)
- **Agent**: implementer
- **Do**: Implement 7 skill effect keys that just need the combat engine to check a stat it already has. All changes in `src/engine/combat.js`.

  **2a. flatDR** (Damage Plating, Vanguard Bulwark line 19):
  - In `executeEnemyTurn`, after armor reduction at line 433, add: `dmg = Math.max(1, dmg - (stats.flatDR || 0))` before the defend check.
  - In the legacy `combatRound` at line 82, add the same after armor reduction.

  **2b. stunImmune** (Immovable Object, Vanguard Bulwark line 21):
  - In `applyTurnStartEffects`, at line 171 where ally stun is checked: `if (unit.stunned)` → add a stats check: `const stats = getEffectiveStats(unit); if (unit.stunned && !stats.stunImmune)` for the stun-skips-turn path. If `stunImmune`, clear the stun and log "resists stun!".

  **2c. attackStun** (Shield Bash, Vanguard Warden line 30):
  - In `executeAllyAttack`, after the damage/kill resolution at line 225, if the target is still alive: `if (stats.attackStun && Math.random() < stats.attackStun) { target.stunned = true; log.push({ text: '⚡ ${target.name} stunned!', type: 'stun' }); }`

  **2d. hitRunEvasion** (Hit and Run, Recon Ghost line 64):
  - In `executeAllyAttack`, after the attack resolves, apply a temporary evasion buff: `if (stats.hitRunEvasion) { if (!attacker.activeEffects) attacker.activeEffects = []; attacker.activeEffects.push({ id: 'hitRun', type: 'buff', stat: 'evasion', modifier: stats.hitRunEvasion, remainingRounds: 1, source: attacker.id }); }`

  **2e. enemyDmgReduce** (Hack Systems, Engineer Saboteur line 99):
  - In `executeEnemyTurn`, before the damage calc at line 417, check if any alive squad member has `enemyDmgReduce`. Find the max value: `const maxReduce = Math.max(0, ...s.filter(o => o.alive).map(o => getEffectiveStats(o).enemyDmgReduce || 0))`. If > 0, apply after base damage: `dmg = Math.round(dmg * (1 - maxReduce))`.

  **2f. stunVuln** (Overload Network, Engineer Saboteur line 101):
  - In `executeAllyAttack`, after damage calc but before applying to target HP, check: `if (target.stunned) { const maxStunVuln = Math.max(0, ...s.filter(o => o.alive).map(o => getEffectiveStats(o).stunVuln || 0)); if (maxStunVuln > 0) dmg = Math.round(dmg * (1 + maxStunVuln)); }`
  - Note: `stunVuln` is a squad-wide passive — ANY squad member with it enables the bonus for ALL ally attacks.

  **2g. turretArmorShred** (Target Painter, Engineer Machinist line 88):
  - In `applyAllyPassives` turret block (lines 322-340), after turret damage is applied to `tt`, add: `if (stats.turretArmorShred) { tt.armor = Math.max(0, (tt.armor || 0) - stats.turretArmorShred); log.push({ text: '  🔧 Turret shreds ${tt.name} armor -${stats.turretArmorShred}', type: 'debuff' }); }`
  - Apply to both primary and dual turret hits.

- **Files**: `src/engine/combat.js`
- **Must not break**: All existing combat flows — damage formula base case, stun processing, turret logic, evasion. All 325 tests pass.
- **Done when**: Each of the 7 skills produces its stated mechanical effect when the operative has the skill learned.

---

### Task 3: Wire Conditional & Per-Round Skills (Categories C+D)
- **Agent**: implementer
- **Do**: Implement skill effects that trigger based on conditions (HP thresholds, round numbers) or fire each round. All changes in `src/engine/combat.js`.

  **3a. Last Stand** (Vanguard Warden line 32, keys: `lastStandDmg`, `lastStandArmor`, `lastStandHeal`):
  - In `executeAllyAttack` where stats are read (line 211), after getting `getBuffModifiedStats`, add a conditional: if `stats.lastStandDmg` and `attacker.currentHp < stats.hp * 0.25`, add `lastStandDmg` to damage and `lastStandArmor` to armor for this attack. Log "⚠ LAST STAND active!".
  - In `executeEnemyTurn` where target stats are used, if target has Last Stand skills and is below 25% HP, add `lastStandArmor` to their effective armor for damage reduction.
  - In `applyAllyPassives`, after heal logic, if an operative has `lastStandHeal` and is below 25% HP, heal them by `lastStandHeal`.

  **3b. Wraith Mode** (Recon Ghost line 67, keys: `wraithRounds`, `wraithEvasion`, `wraithDmgMult`):
  - In `applyRoundStartEffects` (line 122), after the round 1 block, add: for each operative in squad with `wraithRounds`, if `roundNum <= stats.wraithRounds`, push an activeEffect for evasion (`wraithEvasion`) and one for damage (`wraithDmgMult - 1` as modifier). These effects have `remainingRounds: 1` so they auto-expire at end of each round, getting re-applied each round of the wraith window.
  - Log "👻 ${op.name} in Wraith Mode! 90% evasion, 2x damage" on round 1, "👻 Wraith Mode continues" on round 2.

  **3c. Scorched Earth** (Engineer Saboteur line 102, keys: `roundAoeDmg`, `armorBurn`):
  - In `applyRoundStartEffects`, after orbital strike logic, add: for each operative with `roundAoeDmg`, deal that damage AoE to all alive enemies. If `armorBurn`, permanently reduce each alive enemy's armor by that value (clamped to 0). Log "🔥 Scorched Earth ${dmg} AoE, -${armorBurn} armor!".

  **3d. Combat Stims** (Medic Field Surgeon line 123, key: `autoStim`):
  - In `applyRoundStartEffects`, on round 1 only: for each operative with `autoStim`, generate that many `health_stim` entries. Return them as a `newStims` field in the result object: `{ squad, enemies, log, newStims }`. The caller (`useMission.js`) should merge these into `game.stims`.
  - Update the caller in `useMission.js` where `applyRoundStartEffects` is called to handle the new `newStims` array.

  **3e. Adrenaline Shot** (Medic Combat Medic line 132, key: `buffTopDamage`):
  - In `applyRoundStartEffects`, after Wraith Mode logic: for each operative with `buffTopDamage`, find the alive ally with the highest base damage (excluding the Medic if desired, but including is fine), push a 1-round damage activeEffect with `modifier` set as additive value. Since `getBuffModifiedStats` uses `damage` as multiplicative, instead add it directly: find the target, add `buffTopDamage` to target's flat damage for this round via a 1-round activeEffect. Use additive approach: `{ stat: 'damage', modifier: buffTopDamage / target_base_damage, remainingRounds: 1 }` — or simpler: just modify the target's `baseStats.damage` temporarily. Best approach: push `{ stat: 'bonusDamage', modifier: stats.buffTopDamage, remainingRounds: 1 }` and add handling for `bonusDamage` in `getBuffModifiedStats`.
  - Simpler alternative: Just add `stats.buffTopDamage` directly as flat bonus in `executeAllyAttack` when checking the attacker. If the attacker is the "top damage ally" AND any squad medic has `buffTopDamage`, add the bonus. This avoids activeEffect complexity.
  - **Recommended**: In `applyAllyPassives` for the medic, after heals, identify the highest-damage alive ally and push a 1-round `{ stat: 'flatDmgBonus', modifier: stats.buffTopDamage, remainingRounds: 1 }` activeEffect. Then in `executeAllyAttack`, check for `flatDmgBonus` in activeEffects and add to damage.

  **3f. Overclock Stim** (Medic Combat Medic line 134, key: `overclockAlly`):
  - In `buildTurnQueue` (line 104): after building the queue, check if any alive squad member has `overclockAlly`. If so, roll `Math.random() < overclockAlly`. On success, find the fastest alive ally and duplicate their entry in the queue (they act twice). Log is handled by the caller.
  - Alternatively, in `applyRoundStartEffects`, add a `doubleActor` field to the result identifying who gets to act twice this round. The mission hook can then insert them into the queue a second time.
  - **Recommended**: Add the duplicate entry directly in `buildTurnQueue`. Return a `log` array from `buildTurnQueue` so the caller can display "⚡ Overclock! {name} acts twice!".

  **3g. Passive Cleanse** (Purge Toxins, Medic Combat Medic line 135, key: `cleanse`):
  - In `applyRoundStartEffects`, for each operative with `cleanse: true`, remove all debuff-type activeEffects from all alive allies. Log "✨ {name} cleanses all debuffs!".

- **Files**: `src/engine/combat.js`, `src/engine/operatives.js` (for `getEffectiveStats` squad param in new contexts), `src/hooks/useMission.js` (for `newStims` from Combat Stims)
- **Must not break**: Round start/end flow, turn queue building, existing passives (turrets, heals, AoE). All 325 tests pass.
- **Done when**: Each conditional/per-round skill fires under its stated conditions and produces the described effect.

---

### Task 4: Wire Triggered Passives (Category E Skills)
- **Agent**: implementer
- **Do**: Implement skill effects that trigger on specific combat events (hitting, killing, taking hits, allies going down). All changes in `src/engine/combat.js`.

  **4a. Mark for Death passive** (Recon Assassin line 53, key: `markTarget: true`):
  - In `executeAllyAttack`, after damage is applied but before return: if `stats.markTarget` AND the target is alive AND the target does NOT already have a `damageTaken` activeEffect, apply one: `target.activeEffects.push({ id: 'autoMark', type: 'debuff', stat: 'damageTaken', modifier: 0.2, remainingRounds: 2, source: attacker.id })`. Log "🎯 ${target.name} marked! All allies +20% damage".
  - This is a passive proc on the Recon's first hit per target. Use the `modifier: 0.2` (not 0.3 like the active ability) to differentiate.

  **4b. Death Sentence** (Recon Assassin line 56, keys: `guaranteedCritMarked`, `killResetMark`):
  - In `executeAllyAttack`, before the crit roll at line 213: if `stats.guaranteedCritMarked` AND the target has a `damageTaken` activeEffect with id `autoMark` or source matching the Mark Target ability, set `isCrit = true` (guaranteed crit).
  - After the kill check at line 225: if `stats.killResetMark` AND `killed`, find the next alive enemy without a mark and apply the `autoMark` debuff. Log "🎯 Mark transfers to ${newTarget.name}!".

  **4c. Trauma Kit secondHeal** (Medic Field Surgeon line 122, key: `secondHeal`):
  - In `applyAllyPassives` heal block (lines 367-373): after healing the most wounded ally, if `stats.secondHeal`, find the SECOND most wounded ally and heal them at `Math.round(stats.healPerRound * stats.secondHeal)`. Log the second heal.

  **4d. Passive Revive** (Resuscitate, Medic Field Surgeon line 124, key: `revive: 0.4`):
  - In `applyAllyPassives`, after heals: if any medic has `stats.revive > 0`, check for downed allies (`!o.alive`). If found and no revive has been used this encounter (track via a `_passiveReviveUsed` flag on the medic), revive the first downed ally at `revive` percentage of max HP. Set `_passiveReviveUsed = true`. Log "💚 {medic} auto-revives {ally} at {pct}% HP!".

  **4e. Miracle Worker** (Medic Field Surgeon line 126, keys: `unlimitedRevive`, `healBonus`, `autoRevive`):
  - `healBonus: 0.5`: In `executeAbility` heal case (line 737), modify the heal formula: `const healMult = 1 + (getEffectiveStats(attacker).healBonus || 0)`. Apply: `healAmt = Math.round(maxHp * healPercent * healMult * getHealingModifier(target))`.
  - `unlimitedRevive`: Currently revive has no per-encounter limit implemented, so this is already effectively unlimited. Add a comment noting this.
  - `autoRevive: 0.2`: In `applyRoundStartEffects`, track downed allies. If any medic has `autoRevive` and an ally has been downed for 2+ rounds (track via `_downedRounds` counter), auto-revive at 20% HP. Increment `_downedRounds` each round for downed allies in `applyRoundStartEffects`.

  **4f. Intercept passive + ability fix** (Guardian Stance line 28, Fortress Protocol line 31):
  - **Active Intercept ability fix**: In `executeEnemyTurn`, BEFORE the evasion check at line 407, add: check if the selected `target` has an `intercepted` activeEffect. If so, find the interceptor (the Vanguard whose ID matches `interceptedBy`). If the interceptor is alive, redirect the attack to them instead. Apply `interceptDR` reduction: `dmg = Math.round(dmg * (1 - (interceptorStats.interceptDR || 0)))`. Log "🛡 {vanguard} intercepts hit meant for {target}!".
  - **Passive intercept**: In `executeEnemyTurn`, if no active intercept is present, check if any alive squad member has `stats.intercept > 0`. Roll `Math.random() < stats.intercept`. On success, redirect the attack to that operative instead. Apply `interceptDR` if they have it. Log "🛡 {vanguard} steps in front of {target}!".

- **Files**: `src/engine/combat.js`
- **Must not break**: Existing attack flow, mark target ability, heal/revive abilities, enemy targeting. All 325 tests pass.
- **Done when**: All triggered passives fire on their stated conditions. Recon mark→crit→kill→transfer chain works. Vanguard intercept redirects damage. Medic passive revive triggers once per encounter.

---

### Task 5: Fix Broken Stims + Gadget System
- **Agent**: implementer
- **Do**: Fix the two broken stims and implement the gadget activation system.

  **5a. Fix Adrenaline stim** (`combat.js` `executeItemUse` lines 285-289):
  - Replace `target._adrenalineRounds = 3` with: `if (!target.activeEffects) target.activeEffects = []; target.activeEffects.push({ id: 'adrenaline', type: 'buff', stat: 'damage', modifier: 0.5, remainingRounds: 3, source: 'stim' });`
  - This flows through `getBuffModifiedStats` automatically — +50% damage for 3 rounds.

  **5b. Fix Purge Shot stim** (`combat.js` `executeItemUse` lines 292-295):
  - Replace `target._purgeRounds = 2` with: `if (!target.activeEffects) target.activeEffects = []; target.activeEffects.push({ id: 'purgeShot', type: 'buff', stat: 'evasion', modifier: 10, remainingRounds: 2, source: 'stim' });`
  - The evasion case in `getBuffModifiedStats` (line 593-594) already handles additive evasion.

  **5c. Implement gadget activation**:
  - Add new export function `executeGadgetUse(attackerId, squad, enemies)` to `combat.js`:
    ```
    - Find the attacker in squad
    - Get their equipped gadget from `attacker.gear.gadget`
    - If no gadget, or gadget.stats has no burst key, or gadget uses <= 0, return no-op
    - Based on which burst key exists:
      - healBurst: heal the attacker by the burst value
      - shieldBurst: restore attacker shields by burst value
      - dmgBurst: deal burst value as AoE to all enemies (reduced by armor * 0.3)
      - stunBurst: stun a random alive enemy
    - Decrement uses: `attacker.gear.gadget = { ...attacker.gear.gadget, uses: gadget.uses - 1 }`
    - Return { squad, enemies, log }
    ```
  - In `src/hooks/useMission.js`: Add `selectGadget` action handler following the pattern of `selectItem`/`selectAbility`. When the player chooses "Gadget" in the combat action menu, call `executeGadgetUse` and advance the turn.
  - The gadget action should only be available if the operative has a gadget equipped with `uses > 0` and a burst stat.

  **5d. Clean up dead stim code in `src/engine/stims.js`**:
  - The `adrenaline` and `purge_shot` cases in stims.js set `_adrenalineRounds` and `_purgeRounds` — these are only used from the pre-combat stim screen. Update them to use the same `activeEffects` pattern for consistency, or remove them if stims.js is not called (check if it's imported anywhere).

- **Files**: `src/engine/combat.js`, `src/hooks/useMission.js`, `src/engine/stims.js`
- **Must not break**: Existing stim usage (health_stim, shield_cell, nano_kit), combat action flow, turn advancement. All 325 tests pass.
- **Done when**: Adrenaline grants +50% damage for 3 rounds (visible in combat log). Purge Shot grants +10 evasion for 2 rounds. Gadgets can be activated in combat with real effects. Uses counter decrements.

---

### Task 6: Wire All Decision Effects
- **Agent**: implementer
- **Do**: Make all 15 decision choices in `src/data/decisions.js` produce real mechanical effects. Changes in `src/hooks/useMission.js` `handleDecision` function (line 685) and `src/engine/combat.js` `applyRoundStartEffects`.

  **Currently working (do not change):**
  - `shields` (line 687): +25 shield ✓
  - `pushThrough` (line 688): -15% HP ✓
  - `salvage` (line 689): Rare+ gear ✓
  - `overload` (combat.js line 136): 25 AoE ✓

  **Fix counterAmbush** (combat.js line 135):
  - After the log message, apply +30% damage buff to all alive squad members as an activeEffect: for each operative in `s`, push `{ id: 'counterAmbush', type: 'buff', stat: 'damage', modifier: 0.3, remainingRounds: 1, source: 'decision' }` to their `activeEffects`.

  **Implement `fallBack`** — +20 armor this encounter:
  - In `handleDecision`: apply an activeEffect to all alive squad members: `{ stat: 'armor', modifier: 0.5, remainingRounds: 99, source: 'decision' }` (long duration = effectively permanent for encounter). OR simpler: set `decisionApplied.fallBack = true` and in `applyRoundStartEffects` round 1, push armor activeEffects.
  - **Recommended**: In `handleDecision`, set it on `decisionApplied`. In `applyRoundStartEffects` round 1, when `decisionApplied.fallBack`, push a `{ stat: 'armor', modifier: 0.5, remainingRounds: 99 }` activeEffect to all squad members. Log "🛡 Squad in cover! +50% armor this encounter".

  **Implement `carefulLoot`** — guaranteed rare item at mission end:
  - In `handleDecision`: set `decisionApplied.carefulLoot = true`.
  - In `useMission.js` where loot is generated at mission end (find the loot generation call — it's in `handleCombatEnd` or the mission result logic), check if `mission.decisionApplied.carefulLoot` and add one extra item with `rarity >= RARITY.RARE`.

  **Implement `quickLoot`** — 50/50 loot or trap:
  - In `handleDecision`: roll `Math.random() < 0.5`. On success: generate 2 common items, add to inventory. On failure: deal 10 damage to all alive squad members (the trap). Log either "Found supplies!" or "It was a trap!".

  **Implement `ambush`** — first strike (speed +50 round 1):
  - In `handleDecision`: set `decisionApplied.ambush = true`.
  - In `applyRoundStartEffects` round 1: if `decisionApplied.ambush`, push `{ stat: 'speed', modifier: 3.0, remainingRounds: 1 }` to all squad members. This ensures all allies act first. Log "⚡ Ambush! Squad acts first!".

  **Implement `avoid`** — skip next encounter:
  - In `handleDecision`: set `decisionApplied.avoid = true`.
  - In `useMission.js` where the next encounter triggers (the encounter event handler from the map), check `mission.decisionApplied.avoid`. If true, skip this encounter (don't generate enemies, mark it as cleared), clear the flag, and continue exploration. Log "Patrol avoided. Moving on."

  **Implement `jam`** — enemies -20% damage this mission:
  - In `handleDecision`: set `decisionApplied.jam = true`.
  - In `executeEnemyTurn`: check if `decisionApplied` (which is stored on `mission`) — hmm, `executeEnemyTurn` doesn't have access to mission state. Better approach: in `applyRoundStartEffects` round 1 of each encounter, if `decisionApplied.jam`, apply a persistent debuff to all enemies: `{ stat: 'damage', modifier: -0.2, remainingRounds: 99 }` on each enemy's activeEffects. Log "📡 Comms jammed! Enemies -20% damage".

  **Implement `rescue`** — +50% XP but enemies get free round:
  - In `handleDecision`: set `decisionApplied.rescue = true`. Set a `missionXpBonus: 0.5` on mission state.
  - In `applyRoundStartEffects` round 1: if `decisionApplied.rescue`, stun all squad members for round 1 (they skip their first turn preparing the rescue). OR push a `{ stat: 'speed', modifier: -0.99, remainingRounds: 1 }` to all allies so enemies act first.
  - In loot/XP calculation at mission end: multiply XP by `(1 + missionXpBonus)`.

  **Implement `mark`** — +25% XP, safer:
  - In `handleDecision`: set `decisionApplied.mark = true`. Set `missionXpBonus: 0.25` on mission state.
  - In XP calculation at mission end: multiply XP by `(1 + missionXpBonus)`.

  **Implement "Move on" `skip` for Injured Civilian** — +15% resource recovery:
  - The `skip` effect already no-ops, which is fine for Supply Cache "Ignore it". For Injured Civilian "Move on", the desc says "No effect" — update the desc to say "+15% resource recovery between encounters" and give it a unique effect key `moveOn`.
  - In `handleDecision`: set `decisionApplied.moveOn = true`.
  - In the between-encounter healing code in `useMission.js`: check for `decisionApplied.moveOn`. If true, boost resource recovery from 25% to 40%.
  - **Data change**: In `decisions.js` line 20, change `effect: "skip"` to `effect: "moveOn"` and update desc.

  **Update decision descriptions** in `decisions.js` to match new effects (only where descriptions are misleading).

- **Files**: `src/data/decisions.js`, `src/hooks/useMission.js`, `src/engine/combat.js`
- **Must not break**: Existing working decisions (shields, pushThrough, salvage, overload), mission flow state machine, loot generation. All 325 tests pass.
- **Done when**: All 15 choices produce distinct mechanical outcomes. Player can observe the difference between each choice in the combat log or results screen.

---

### Task 7: Write Tests for All New Systems
- **Agent**: tester
- **Do**: Create comprehensive test files covering every system wired in Tasks 1-6.

  **File: `src/engine/__tests__/skillEffects.test.js`**
  Test every dead skill that was wired:
  - Aura skills: verify `getEffectiveStats(op, squad)` propagates aura buffs
  - `flatDR`: verify damage reduction in `executeEnemyTurn`
  - `stunImmune`: verify stun is resisted
  - `attackStun`: verify stun chance on ally attack
  - `hitRunEvasion`: verify evasion buff appears in activeEffects after attack
  - `enemyDmgReduce`: verify enemy damage is reduced
  - `stunVuln`: verify bonus damage vs stunned targets
  - `turretArmorShred`: verify enemy armor decreases after turret hit
  - `lastStandDmg/Armor/Heal`: verify activation below 25% HP
  - `wraithRounds/Evasion/DmgMult`: verify activation on rounds 1-2
  - `scorched Earth`: verify per-round AoE + armor burn
  - `markTarget` passive: verify auto-mark on first hit
  - `guaranteedCritMarked`: verify guaranteed crit on marked target
  - `killResetMark`: verify mark transfers on kill
  - `secondHeal`: verify second ally is healed
  - Intercept passive: verify chance-based redirect
  - Intercept ability: verify active redirect from `intercepted` effect

  **File: `src/engine/__tests__/stimsFix.test.js`**
  - Adrenaline: verify +50% damage activeEffect for 3 rounds
  - Purge Shot: verify +10 evasion activeEffect for 2 rounds
  - Existing stims still work (health_stim, shield_cell, nano_kit)

  **File: `src/engine/__tests__/gadgets.test.js`**
  - healBurst: verify self-heal
  - shieldBurst: verify shield restore
  - dmgBurst: verify AoE damage
  - stunBurst: verify enemy stun
  - Uses decrement correctly
  - No-op when uses = 0

  **File: `src/engine/__tests__/decisions.test.js`**
  - counterAmbush: verify +30% damage activeEffect on round 1
  - fallBack: verify +50% armor activeEffect
  - carefulLoot: verify flag set (loot integration tested via mission flow)
  - quickLoot: verify damage or loot outcome
  - ambush: verify speed buff round 1
  - jam: verify -20% enemy damage debuff
  - rescue: verify XP bonus flag + squad speed penalty round 1
  - mark: verify XP bonus flag
  - moveOn: verify resource recovery boost flag

  Each test should:
  - Create minimal squad/enemy fixtures using `createOperative` and `generateEncounter`
  - Call the relevant combat function
  - Assert the expected mechanical effect (stat change, damage diff, flag set)
  - Use deterministic seeds or mock `Math.random` for probability-based tests

- **Files**: `src/engine/__tests__/skillEffects.test.js`, `src/engine/__tests__/stimsFix.test.js`, `src/engine/__tests__/gadgets.test.js`, `src/engine/__tests__/decisions.test.js`
- **Must not break**: All 325 existing tests still pass.
- **Done when**: New tests pass covering every wired skill, fixed stim, gadget effect, and decision outcome. Total test count should increase by 60-100+ tests.

---

### Task 8: Regression Verification
- **Agent**: tester
- **Do**: Run the full test suite (`npx vitest run`) and `npm run build`. Compare to baseline from Task 0.
  - All 325 original tests must pass
  - All new tests must pass
  - Build must be clean (no errors)
  - Check for any TypeScript/lint warnings introduced
- **Done when**: Zero net-new test failures compared to baseline. Build clean. All new tests green.

---

### Task 9: Final Review
- **Agent**: reviewer
- **Do**: Review all changes against the success criteria from the design doc. Verify:
  1. Every skill effect key from `classes.js` has corresponding engine code
  2. Every decision choice in `decisions.js` has a handler in `useMission.js` or `combat.js`
  3. Intercept ability redirects damage (read both write and read paths)
  4. Adrenaline/Purge Shot use activeEffects (not dead flags)
  5. Gadget activation function exists and is wired to the UI hook
  6. counterAmbush applies actual damage modifier
  7. Save compatibility: new fields all have `|| default` guards
  8. No hardcoded game data in components (still in `/data` and `/engine`)
  9. Engine functions remain pure (no React, no side effects beyond cloned arrays)
  10. Code is minimal — no over-engineering, no speculative abstractions
- **Files**: All changed files
- **Done when**: All success criteria met. No regressions. Critical findings addressed.

---

## Dependency Graph

```
Task 0 (baseline)
  └─► Task 1 (auras — needed by Tasks 2-4 for squad param)
       ├─► Task 2 (simple reads — independent of 3,4)
       ├─► Task 3 (conditional/round — independent of 2,4)
       └─► Task 4 (triggered — independent of 2,3)
            └─► Task 5 (stims/gadgets — can parallel with 2-4 but after 1)
                 └─► Task 6 (decisions — can reference all combat changes)
                      └─► Task 7 (tests — must cover all implementation)
                           └─► Task 8 (regression)
                                └─► Task 9 (review)
```

**Parallelizable**: Tasks 2, 3, 4 can run in parallel after Task 1 completes (they touch different sections of combat.js). Task 5 can also parallel with 2-4 if careful about merge conflicts in combat.js.

**Sequential gates**: Task 7 must wait for all implementation tasks. Task 8 must wait for Task 7. Task 9 must wait for Task 8.
