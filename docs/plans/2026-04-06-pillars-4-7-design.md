# Pillars 4-7: Deep Systems — Decision Echoes, Intel, Smart Loot, Mission Identity

**Date:** 2026-04-06
**Prerequisite:** Pillars 1-3 completed (commit 8a0cd8c). 417 tests passing, build clean.
**Scope:** Make the game systems interconnect — decisions ripple forward, comms provide real intel, loot respects your squad, and missions feel distinct.

---

## What Pillars 1-3 Accomplished

Every skill, decision, stim, gadget, and ability now works mechanically. The game is *honest* — it delivers what it promises. But the systems are still **isolated**. A decision in mission 3 doesn't affect mission 5. Reading comms is optional flavor. Loot ignores your squad. Every mission runs the same loop.

Pillars 4-7 make the game **interconnected**.

---

## Pillar 4: Decision Echoes — Choices That Ripple Forward

### Current State
`game.decisionHistory` records every decision as `{ [effectKey]: missionId }`. Currently only consumed by `getDecisionEcho()` in `engine/personality.js` for flavor text. Decisions have **zero forward impact**.

### Goal
Past decisions should influence future missions in ways the player can feel:

### Proposed Mechanics

**4A. Reputation System**
Track a simple reputation axis based on decisions:
- Heroic choices (rescue, mark, careful approaches) → `reputation.heroic += 1`
- Ruthless choices (pushThrough, quickLoot, overload) → `reputation.ruthless += 1`
- Tactical choices (counterAmbush, ambush, jam, fallBack) → `reputation.tactical += 1`

**4B. Decision Consequences**
Based on accumulated reputation, future missions change:
- **Heroic reputation**: Rescued civilians provide intel (bonus comms beats), merchants give discounts (stim prices drop), fewer ambush events
- **Ruthless reputation**: Enemies are more aggressive (higher-tier spawns), but loot quality increases. Civilians stop appearing (no rescue events)
- **Tactical reputation**: More tactical decision events appear, enemy AI profiles shift toward more predictable patterns

**4C. Story Branch Reactions**
Story beats in `data/story.js` should reference decisions. When Dr. Osei talks about the colony's situation, the text should vary based on whether the player has been rescuing civilians or pushing through them. This doesn't require branching story — just conditional sentence insertions.

### Files to Change
- `src/data/constants.js` — add reputation categories
- `src/engine/` — new `reputation.js` module that reads `decisionHistory` and computes reputation
- `src/hooks/useMission.js` — apply reputation effects to encounter generation, decision event selection
- `src/data/story.js` — add conditional variants to beats
- `src/engine/personality.js` — enhance `getDecisionEcho` with reputation-aware responses

---

## Pillar 5: Comms as Tactical Intel

### Current State
The Comms tab (`CommsTab.jsx`) is a read-only story log. Story beats unlock at `missionsCompleted` thresholds. Reading them has zero gameplay impact.

### Goal
Transform comms from passive flavor into an **intelligence system** that rewards engagement:

### Proposed Mechanics

**5A. Intel Attachments on Story Beats**
Each story beat in `STORY_CHAPTERS` gains an optional `intel` field:
```js
{ at: 4, text: "...", speaker: "Dr. Osei", intel: {
  type: "weakness",        // weakness | ambush | cache | reinforcement
  targets: ["Spore Beast"], // which enemies
  effect: "poison_immune",  // what the intel reveals
  missionIds: [5, 6, 7],   // which missions it applies to
}}
```

**5B. Intel Effects in Combat**
When the player has READ a comms beat with intel (checked via `game.storyBeatsRead`):
- **weakness**: Reveals an enemy vulnerability. "+20% damage vs [enemy type]" applied as a combat modifier
- **ambush**: Reveals ambush locations. "Ambush Detected" decisions become "Ambush Anticipated" with better choice options
- **cache**: Reveals hidden supply locations. Extra loot drops on specific missions
- **reinforcement**: Warns about enemy reinforcements. Boss encounters are telegraphed with preparation time

**5C. Unread Intel Warning**
Before starting a mission, if unread comms contain intel relevant to that mission, show a subtle warning: "📡 Unread intel may be relevant to this mission." This teaches players that comms matter without forcing them to read.

**5D. Intel Log in Combat**
During combat, if intel applies, show it in the combat log: "INTEL: Spore Beasts are vulnerable to fire damage" as a reminder.

### Files to Change
- `src/data/story.js` — add `intel` fields to relevant beats
- `src/engine/` — new `intel.js` module that checks read beats against current mission
- `src/engine/combat.js` — apply intel modifiers (weakness damage bonus, etc.)
- `src/hooks/useMission.js` — check intel at mission start, show warnings
- `src/components/tabs/CommsTab.jsx` — visual indicator for intel-bearing beats
- `src/components/tabs/MissionTab.jsx` — unread intel warning on mission select

---

## Pillar 6: Smart Loot

### Current State
Loot is fully random. `generateGear()` in `engine/gear.js` picks a random type, random class key, and random stats. Common to receive 3 Engineer weapons when you have no Engineer.

### Goal
Loot should feel intentional — weighted toward your squad, influenced by your choices, with occasional unique items:

### Proposed Mechanics

**6A. Squad-Weighted Class Drops**
When generating weapons, weight toward classes in the player's squad:
- 60% chance: weapon class matches a squad member's class
- 25% chance: weapon class matches an unrecruited class (incentive to diversify)
- 15% chance: fully random (surprise finds)

**6B. Decision-Influenced Loot Quality**
- `carefulLoot` decisions across the campaign → cumulative +luck bonus for all future loot rolls
- Heroic reputation → chance of "Civilian Gratitude" bonus items (universal, good stats)
- Ruthless reputation → chance of "Battlefield Salvage" items (class-locked, excellent stats but narrow)

**6C. Boss-Specific Named Drops**
Each of the 2 bosses (Apex Predator, Core Guardian) drops a unique named item on first kill:
- Apex Predator: "Predator's Fang" — a weapon with a unique `lifeSteal` effect (heal 10% of damage dealt)
- Core Guardian: "Guardian Core" — an implant with a unique `damageReflect` effect (reflect 15% of damage taken)

These require adding `uniqueEffect` fields to gear and reading them in combat.

**6D. Gear Mod System (use existing modSlots)**
Every item already has `modSlots` and an empty `mods` array. Implement a basic mod system:
- Mods drop as separate items (new loot category)
- Mods provide small bonuses: +3 damage, +5% crit, +2 armor, etc.
- Players can install mods into open slots from the Inventory tab
- This gives players agency over their gear beyond "equip the higher number"

### Files to Change
- `src/engine/gear.js` — weighted class drops, boss drops, mod generation
- `src/engine/combat.js` — unique gear effects (lifeSteal, damageReflect)
- `src/data/enemies.js` — boss drop tables
- `src/data/` — new `mods.js` for mod definitions
- `src/components/tabs/InventoryTab.jsx` — mod installation UI
- `src/hooks/useGameState.js` — mod install/remove handlers

---

## Pillar 7: Mission Identity

### Current State
All 20 missions run the same loop: explore map → encounter → combat → decision → repeat. Differentiation is purely numerical (tier, encounter count). No mission has a unique mechanic.

### Goal
Each mission (or at minimum, each chapter's final mission) should have at least one unique element:

### Proposed Mechanics

**7A. Mission Modifiers**
Add a `modifiers` field to missions in `data/missions.js`:
```js
{ id: 5, ..., modifiers: ["toxic_atmosphere"] }
```

Modifier types:
- `toxic_atmosphere`: All units take 3 poison damage per round (encourages fast play)
- `low_gravity`: +50% evasion for everyone, -20% damage (dodgy fights)
- `power_outage`: No turrets, no gadgets (disables tech abilities)
- `reinforcements`: Extra enemies spawn every 5 rounds
- `time_pressure`: Must clear in N rounds or mission fails
- `escort`: A civilian NPC must survive (new lose condition)
- `boss_hunt`: Single powerful boss instead of multiple encounters

**7B. Chapter Finale Missions**
Missions 4, 8, 12, 16, 20 (last of each chapter) get special treatment:
- Unique boss encounter
- Story-relevant modifier
- Guaranteed unique loot
- Extended decision events with permanent consequences

**7C. Environmental Hazards**
The `environment` field on missions already exists. Wire it to actual combat effects:
- `jungle`: Poison chance on all melee attacks
- `ruins`: Cover bonus (+10 armor for defending units)
- `cave`: Reduced speed for all units (-3)
- `facility`: Turrets deal +25% damage (tech advantage)
- `wasteland`: No between-encounter healing

### Files to Change
- `src/data/missions.js` — add `modifiers` and enhance mission definitions
- `src/engine/combat.js` — apply mission modifiers to combat
- `src/hooks/useMission.js` — check modifiers at mission start, apply environmental effects
- `src/components/tabs/MissionTab.jsx` — display modifiers and environmental effects in briefing

---

## Recommended Execution Order

**Phase A (Pillar 4 + 5 together):** Decision echoes and intel system interconnect naturally — both make past actions influence future gameplay. ~3-4 hours of agent work.

**Phase B (Pillar 6):** Smart loot + mod system. Independent of A. ~2-3 hours.

**Phase C (Pillar 7):** Mission identity. Benefits from A and B being done (missions can reference intel and loot). ~2-3 hours.

---

## How to Start in a New Chat

Say something like:

> "Read `docs/plans/2026-04-06-pillars-4-7-design.md` and implement Pillars 4-7. Start with Phase A (decision echoes + intel system). Baseline: 417 tests, build clean."

The design doc has all the context needed. The new chat can `/brainstorm` to refine, then `/plan` and `/execute`.
