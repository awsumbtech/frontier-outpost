# FF Combat System — Phases 2-4 Design

## Status

- **Phase 1 COMPLETE** (PR #1): Core turn-based system with Attack/Defend/Item
- **Phase 2 COMPLETE** (2026-04-01): Active abilities + class resources (Resolve/Focus/Charge/Serum), 16 abilities, buff/debuff system, 61 new tests
- **Phases 3-4**: Planned below, not yet started

---

## Phase 2: Active Abilities + MP System

**Goal:** Convert passive skill bonuses into usable combat abilities with cooldowns and/or MP costs. This is the heart of the FF experience — choosing between Attack and a class-specific ability each turn.

### New Resource: MP (Mental/Psi Points)

- Each class gets a base MP pool (e.g., Vanguard 40, Recon 50, Engineer 60, Medic 80)
- MP does NOT regenerate per round (recovers between encounters like HP/shields)
- Gear can boost max MP (new `mp` stat on implants/gadgets)
- Add `currentMp` and base `mp` to operative state (save-compatible: default to max if missing)

### Ability Design Per Class

Each class gets 3-4 active abilities drawn from their existing skill branches. Learning a skill unlocks the ability. Some skills stay passive (stat boosts), others become active.

**VANGUARD (Tank)**
| Ability | Source Skill | Cost | Effect |
|---------|-------------|------|--------|
| Shield Wall | Fortify branch | 15 MP | +50% armor for 2 rounds (self) |
| Taunt | Warden branch | 10 MP | Force all enemies to target you for 1 round |
| Intercept | Warden branch | 20 MP | Guard an ally — take hits meant for them this round |
| Power Strike | Bulwark branch | 12 MP | Attack at 1.5x damage |

**RECON (DPS)**
| Ability | Source Skill | Cost | Effect |
|---------|-------------|------|--------|
| Assassinate | Assassin branch | 25 MP | Attack at 2x damage, +30% crit chance |
| Smoke Bomb | Ghost branch | 15 MP | +40% evasion for 2 rounds (self) |
| Double Strike | Assassin branch | 20 MP | Attack twice at 70% damage each |
| Mark Target | Ghost branch | 10 MP | Target takes +30% damage from all sources for 2 rounds |

**ENGINEER (Support/AoE)**
| Ability | Source Skill | Cost | Effect |
|---------|-------------|------|--------|
| Deploy Turret | Machinist branch | 20 MP | Place turret that auto-fires 3 rounds (already exists as passive — make it activatable) |
| EMP Blast | Saboteur branch | 25 MP | Stun all enemies for 1 round |
| Armor Shred | Saboteur branch | 15 MP | Reduce target's armor by 40% for 3 rounds |
| Orbital Strike | Machinist branch | 30 MP | Heavy AoE damage to all enemies |

**MEDIC (Healer)**
| Ability | Source Skill | Cost | Effect |
|---------|-------------|------|--------|
| Heal | Field Surgeon branch | 15 MP | Heal one ally for 40% max HP |
| Revive | Field Surgeon branch | 30 MP | Revive downed ally at 30% HP (1/encounter) |
| Aura Boost | Combat Medic branch | 20 MP | +15% damage to all allies for 3 rounds |
| Purge | Combat Medic branch | 12 MP | Remove debuffs from one ally |

### Action Menu Changes

The action menu becomes:
```
┌─────────────────────────────────┐
│  MIRA's Turn        MP: 35/50  │
│                                 │
│  ► Attack    ► Ability ▸       │
│  ► Item      ► Defend          │
└─────────────────────────────────┘
```

Clicking "Ability" opens a submenu listing learned abilities with MP costs. Grayed out if insufficient MP.

### Data Changes

- `src/data/classes.js`: Add `abilities` array to each branch skill definition with `{ id, name, mpCost, desc, unlockSkill, effect }`.
- `src/data/constants.js`: Add base MP per class.
- Operative state: Add `currentMp` field (defaults to class base MP).

### Engine Changes

- `src/engine/combat.js`: Add `executeAbility(attackerId, abilityId, targetId, squad, enemies)` pure function.
- Handle buff/debuff state (temporary stat modifiers with duration tracking).
- New `tickBuffs(squad, enemies)` function called at turn start to decrement durations.

### Hook Changes

- `useMission.js`: Add `selectAbility()` handler, `chooseAbility(abilityId)` → target selection → execute.
- Track active buffs/debuffs in `turnState.activeEffects[]`.

### Component Changes

- `ActionMenu.jsx`: Add "Ability" button, MP display.
- New `AbilitySelector.jsx`: List of available abilities with MP costs, descriptions.
- `PartyStatusPanel.jsx`: Add MP bar below shield bar.
- `UnitTile.jsx`: Show buff/debuff icons.

### Build Sequence

1. Add MP to data/state (save-compatible defaults)
2. Define abilities in classes.js
3. Add `executeAbility` + `tickBuffs` to combat engine with tests
4. Add buff/debuff tracking to turnState
5. Build AbilitySelector component
6. Update ActionMenu with Ability button + MP display
7. Update PartyStatusPanel with MP bar
8. Wire into useMission hook
9. CSS styling
10. Balance pass — test each ability manually

---

## Phase 3: Status Effects System

**Goal:** Formalize buffs, debuffs, and status conditions into a proper system that abilities, items, and enemy attacks can interact with.

### Status Effect Types

**Buffs (positive, on allies)**
- Shield Wall: +50% armor, 2 rounds
- Smoke Bomb: +40% evasion, 2 rounds
- Aura Boost: +15% damage, 3 rounds
- Mark (on enemy): +30% incoming damage, 2 rounds

**Debuffs (negative, on allies from enemies)**
- Bleed: X damage per turn, stacks
- Poison: X damage per turn, reduces healing by 50%
- Slow: -30% speed (affects turn order next round)
- Weaken: -20% damage, 2 rounds

**Conditions**
- Stunned: Skip turn (already exists)
- Defending: 50% DR (already exists)
- Taunting: Enemies forced to target (already exists partially)
- Downed: 0 HP, can be revived (already exists)

### Data Structure

```js
// On each unit during combat
activeEffects: [
  { id: "shieldWall", type: "buff", stat: "armor", modifier: 0.5, remainingRounds: 2, source: "opId" },
  { id: "bleed", type: "debuff", damage: 5, remainingRounds: 3, source: "enemyId" },
]
```

### Engine Changes

- `applyEffect(unitId, effect, squad, enemies)` — add effect to unit
- `removeEffect(unitId, effectId, squad, enemies)` — remove effect
- `tickEffects(squad, enemies)` — decrement durations, apply per-turn damage, remove expired
- `getModifiedStats(unit)` — apply active buff/debuff modifiers to base stats
- Integrate into `applyTurnStartEffects` (tick effects, apply DoTs)

### UI Changes

- Show buff/debuff icons on UnitTile (small icons below HP bar)
- Show effect tooltips on hover
- Status effect announcements in combat log
- Visual feedback: green shimmer for buffs, red pulse for debuffs

### Enemy Abilities

Some enemies gain their own abilities:
- Scav Raider: "Dirty Fight" — applies Weaken
- Spore Beast: "Toxic Spores" — applies Poison to random ally
- Psi-Wraith: "Mind Drain" — steals MP
- Heavy Sentinel: "Fortify" — self armor buff

---

## Phase 4: Enemy AI Tactics

**Goal:** Replace random targeting with intelligent behavior patterns. Each enemy type gets a tactical profile that makes fights feel distinct.

### AI Profiles

**Aggro (Feral Drone, Apex Predator)**
- Target lowest HP ally
- Double down on weakened targets
- Ignore taunts 30% of the time

**Tactical (Scav Raider, Rogue Mech)**
- Target highest damage ally (focus the DPS)
- Use abilities when available (Weaken on biggest threat)
- Switch targets if current target is defending

**Support (Hive Swarm)**
- Buff other enemies (armor boost, heal)
- Only attack if no allies need buffing
- Target healers first

**Tank (Heavy Sentinel, Core Guardian)**
- Self-buff with armor/shield
- Taunt allies away from squishier enemies
- Power attack every 3 rounds

**Assassin (Xeno Stalker, Psi-Wraith)**
- Always target lowest armor ally
- Use debuffs (poison, mind drain)
- Flee (become untargetable 1 round) at 30% HP

### Implementation

- Add `aiProfile` field to enemy templates in `enemies.js`
- New `selectEnemyAction(enemy, squad, enemies)` function replacing random targeting
- Returns `{ action: "attack"|"ability"|"buff", targetId, abilityId }`
- Each profile is a simple priority-based decision tree (not complex ML)

### Boss Patterns

Late-game enemies (Apex Predator, Core Guardian) get scripted phase transitions:
- Phase 1 (>50% HP): Normal attacks
- Phase 2 (<50% HP): Enrage (+30% damage), use powerful abilities
- Phase 3 (<20% HP): Desperate — AoE attacks, ignore defense

---

## Implementation Order

| Phase | Sessions | Dependencies |
|-------|----------|-------------|
| Phase 2 (Abilities + MP) | 2-3 | Phase 1 complete ✅ |
| Phase 3 (Status Effects) | 1-2 | Phase 2 (abilities apply effects) |
| Phase 4 (Enemy AI) | 1-2 | Phase 3 (AI uses status effects) |

Phase 2 is the biggest lift. Phases 3 and 4 build on its foundation.

## Key Principles

- **All engine functions stay pure** — no React, no side effects
- **Save compatibility** — new fields default gracefully for old saves
- **Existing tests must pass** — add new tests for every new function
- **Balance after building** — get mechanics working first, tune numbers second
- **One phase at a time** — don't start Phase 3 until Phase 2 is merged and stable
