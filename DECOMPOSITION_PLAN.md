# Decomposition Plan

## Goal

Break the current single-file artifact (`frontier-outpost.jsx`, ~1200 lines) into a proper Vite + React project with the architecture defined in CLAUDE.md.

## Prerequisites

```bash
npm create vite@latest frontier-outpost -- --template react
cd frontier-outpost
npm install
```

## Phase 1: Scaffold & Extract Data (No behavior changes)

### Step 1: Create directory structure
```
mkdir -p src/{data,engine,components/{tabs,combat,shared},hooks,styles}
```

### Step 2: Extract data constants
Each file exports a single constant or small group of related constants.

- `src/data/constants.js` - RARITY, RARITY_NAMES, RARITY_COLORS, CLASS_KEYS
- `src/data/classes.js` - CLASSES object (full class definitions with branches/skills)
- `src/data/missions.js` - MISSIONS array (20 missions)
- `src/data/story.js` - STORY_CHAPTERS array (5 chapters, 15 beats)
- `src/data/enemies.js` - ENEMY_TEMPLATES array
- `src/data/gear.js` - WEAPON_NAMES, ARMOR_NAMES, IMPLANT_NAMES, GADGET_NAMES, STIM_TYPES
- `src/data/decisions.js` - DECISION_EVENTS array
- `src/data/operativeNames.js` - OP_NAMES array

### Step 3: Extract engine functions
Pure functions, no React imports.

- `src/engine/utils.js` - rng(), pick(), uid(), rollRarity()
- `src/engine/gear.js` - generateGear()
- `src/engine/operatives.js` - createOperative(), getEffectiveStats(), xpForLevel()
- `src/engine/combat.js` - combatRound(), generateEncounter()
- `src/engine/stims.js` - applyStim() (extract from useStim logic)
- `src/engine/saves.js` - saveGame(), loadGame() using localStorage

### Step 4: Extract CSS
- Copy the CSS string into `src/styles/global.css`
- Import it in `main.jsx`
- Remove the `<style>{CSS}</style>` from App

### Step 5: Verify
- `npm run dev` should show the exact same app
- All game data imported from data files
- All engine functions imported from engine files

## Phase 2: Extract Components (No behavior changes)

### Step 6: Shared components
- `ClassBadge.jsx` - Class affinity badge
- `StatDiff.jsx` - Green/red stat comparison
- `StatGrid.jsx` - Stat display grid
- `BarDisplay.jsx` - HP/Shield/XP bars
- `GearSlot.jsx` - Equipment slot row
- `Modal.jsx` - Reusable modal overlay

### Step 7: Combat components
- `CombatAlly.jsx` - Squad member card during combat
- `CombatEnemy.jsx` - Enemy card during combat
- `CombatLog.jsx` - Scrolling log with color-coded entries
- `DecisionPanel.jsx` - Tactical choice panel
- `StickyBar.jsx` - Bottom action bar

### Step 8: Tab components
- `SquadTab.jsx` - Squad list + detail view (biggest component)
- `MissionTab.jsx` - Mission select + active combat view
- `CommsTab.jsx` - Story transmissions
- `InventoryTab.jsx` - Gear + stims
- `RecruitTab.jsx` - Class recruitment grid

### Step 9: Hooks
- `useGameState.js` - useState + save/load + updateGame helper
- `useMission.js` - Mission state machine (start, advance, handle decision, reset)

### Step 10: Slim down App.jsx
App.jsx should only contain:
- Tab state
- Game state hook
- Mission state hook
- Tab router rendering
- Top bar + nav

### Step 11: Verify
- All functionality identical to monolith
- Each component file < 150 lines ideally
- No circular dependencies

## Phase 3: Quality of Life

### Step 12: Add prop-types or JSDoc comments to all components
### Step 13: Add a simple README.md with setup instructions
### Step 14: Verify save compatibility with existing browser saves

## Validation Checklist

After each phase, verify:
- [ ] App loads without errors
- [ ] Can recruit all 4 classes
- [ ] Can equip/unequip gear
- [ ] Can learn skills
- [ ] Can start and complete a mission
- [ ] Combat log shows correct entries
- [ ] Decisions appear and apply effects
- [ ] Between-encounter healing works
- [ ] Stims can be bought and used
- [ ] Comms tab shows story beats
- [ ] Chapter unlock works (complete ch1 to unlock ch2)
- [ ] Completed missions show checkmark
- [ ] Repeat missions show 50% penalty
- [ ] Save/load persists across refresh
