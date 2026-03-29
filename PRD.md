# Frontier Outpost - Product Requirements Document

## Overview

Frontier Outpost is a browser-based sci-fi RPG featuring pause-and-plan auto-combat, deep squad management, gear progression, skill trees, and a narrative campaign. The game targets players who enjoy idle/auto-battler mechanics with meaningful decision points and build optimization.

## Core Loop

1. **Manage squad** - Equip gear, allocate skill points, buy stims
2. **Select mission** - Choose from chapter-grouped missions with difficulty indicators
3. **Run mission** - Watch auto-combat, make tactical decisions at pause points
4. **Collect rewards** - XP, credits, loot drops
5. **Progress story** - New comms transmissions unlock, chapters advance
6. **Repeat** - Grind earlier missions if needed, push to next chapter

---

## Game Systems

### 1. Squad Management

- Squad size: 1-4 operatives
- Each operative has: name, class, level, XP, skill points, gear (4 slots), skills
- Recruit new operatives for 150 credits
- Dismiss operatives (gear returns to inventory)
- Operatives fully heal between missions

### 2. Classes (4 total)

Each class has 2 specialization branches with 6 skills each (12 skills total per class). Skills must be learned in order within a branch. Both branches can be progressed simultaneously.

**Vanguard** (Tank) - High HP/Armor/Shield, low damage/speed
- Bulwark: Fortify, Shield Capacitor, Provoke, Damage Plating, Kinetic Absorb, Immovable Object
- Warden: Cover Fire, Guardian Stance, Rallying Presence, Shield Bash, Fortress Protocol, Last Stand

**Recon** (DPS) - High damage/crit/evasion/speed, low HP/armor
- Assassin: Weak Point Analysis, Lethal Edge, Mark for Death, Execute Protocol, Bleed Toxin, Death Sentence
- Ghost: Shadowstep, Smoke Screen, Hit and Run, Phantom Strike, Evade Counter, Wraith Mode

**Engineer** (Controller) - Balanced stats, turrets and AoE
- Machinist: Deploy Turret, Reinforced Frame, Target Painter, Dual Deployment, Siege Protocols, Orbital Uplink
- Saboteur: Frag Charge, EMP Pulse, Hack Systems, Cluster Mines, Overload Network, Scorched Earth

**Medic** (Support) - Moderate stats, high speed, healing/buffs
- Field Surgeon: Triage, Trauma Kit, Combat Stims, Resuscitate, Regeneration Field, Miracle Worker
- Combat Medic: Adrenaline Shot, Neural Boost, Overclock Stim, Purge Toxins, Battle Frenzy, Berserk Protocol

### 3. Gear System

**4 equipment slots per operative:** weapon, armor, implant, gadget

**5 rarity tiers:** Common, Uncommon, Rare, Epic, Prototype

**Class affinity:**
- Weapons: Class-specific (each class has unique weapon name pool)
- Armor: Universal (ANY)
- Implants: Universal (ANY)
- Gadgets: Universal (ANY)

**Gear stats:** damage, crit, armorPen, armor, hp, shield, evasion, speed (varies by type)

**Mod slots:** Higher rarity gear has more mod slots (future feature)

**Scrap value:** (rarity + 1) * 15 + level * 5 credits

### 4. Stim / Consumable System

5 stim types purchasable with credits:

| Stim | Cost | Effect |
|------|------|--------|
| Health Stim | 30 | Restore 40% HP to one ally |
| Shield Cell | 25 | Restore 100% shield to one ally |
| Adrenaline Injector | 40 | +50% damage for 3 rounds (one ally) |
| Nano Repair Kit | 50 | Heal entire squad for 25% HP |
| Purge Shot | 35 | Remove all debuffs, +10% evasion for 2 rounds |

Stims can be used anytime from the Inventory tab. Single-target stims require target selection via modal.

### 5. Combat System

**Turn order:** All units sorted by speed, highest first.

**Round flow:**
1. Apply start-of-round effects (mines, orbital strikes, regen)
2. Each unit acts in speed order
3. Allies attack random enemy, apply all skill effects
4. Enemies attack random ally (biased toward taunters)
5. Apply end-of-round effects (stun checks, bleeds)

**Pause points:**
- Every 3 rounds during combat
- Between encounters
- Both trigger tactical decision events

**Between-encounter recovery:** 15% HP, 25% shields restored automatically

**Decision events:** 5 event types with 3 choices each, providing tactical advantages or skip options

### 6. Mission System

**20 missions across 5 chapters (4 per chapter)**

**Chapter unlock:** Complete all 4 missions in a chapter to unlock the next

**Difficulty indicator:** Based on squad avg level vs mission recommended level
- Easy: +2 or more above rec
- Fair: at or +1 above rec
- Hard: 1-2 below rec
- Brutal: 3+ below rec

**Completion tracking:**
- First clear marked with checkmark
- Times cleared counter on each mission
- Chapter progress shown (e.g., 3/4)

**Repeat rewards:** 50% XP and credits on repeat, full loot drops

**Mission tiers:** 1-4, affecting enemy scaling and loot quality

### 7. Story / Comms System

**5 chapters, 15 story beats total (3 per chapter)**

Story beats unlock based on total missions completed counter. They appear as transmissions from 3 characters:
- CMD Vasquez (military command)
- Dr. Osei (science/research)
- Comms Tech Riley (conspiracy/intel)

**Narrative arc:** Colony establishment > synthetic fauna discovery > underground signals > alien hive > corporate conspiracy > containment breach > final assault on the Core

New transmissions show a red badge on the Comms tab. Entries marked NEW until viewed.

### 8. Progression

**XP:** Earned per mission, split among surviving squad members
- First clear: full XP (50 * xpMult * tier)
- Repeat: 50% XP

**Leveling:** XP threshold = 100 * 1.4^(level-1). Each level grants 1 skill point.

**Credits:** Earned from missions and scrapping gear. Spent on recruits (150) and stims (25-50).

---

## UI Structure

5 tabs: Squad, Mission, Comms, Inventory, Recruit

**Squad tab:** List view (click to detail). Detail shows stats, gear slots, skill tree.
**Mission tab:** Chapter-grouped mission list when idle. During mission: squad status, enemy status, combat log, sticky action bar at bottom.
**Comms tab:** Chronological story transmissions grouped by chapter.
**Inventory tab:** Stim section (buy + use) + gear section with type filters.
**Recruit tab:** 2x2 grid of class cards with stats and recruit button.

---

## Future Considerations (Not In Scope Yet)

- Mod crafting system for gear mod slots
- Gear sets with set bonuses
- Operative traits/perks randomly rolled on recruit
- Formation system (front/back row)
- Auto-combat toggle and speed controls
- Permadeath mode
- Post-campaign endless mode
