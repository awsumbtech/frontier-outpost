# Frontier Outpost

A browser-based sci-fi RPG built with React + Vite. Features pause-and-plan auto-combat, squad management, gear/skill systems, a 20-mission story campaign across 5 chapters, and a consumable stim system.

No backend — all game logic runs client-side with localStorage persistence.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npx vitest run` | Run test suite (86 tests) |
| `npx vitest` | Run tests in watch mode |

## Architecture

```
src/
  App.jsx           # Root component (~50 lines) — tab router + hook wiring
  data/             # Game constants (classes, missions, enemies, gear, story)
  engine/           # Pure game logic (combat, gear gen, operatives, utils)
  hooks/            # useGameState (all gameplay handlers) + useMission (state machine)
  components/
    tabs/           # One component per game tab (Squad, Mission, Comms, Inventory, Recruit)
    combat/         # Combat UI (ally/enemy unit cards)
    shared/         # Reusable pieces (ClassBadge, StatDiff, GearModal)
  styles/           # global.css
```

**Key principles:**
- Data stays in `src/data/` — never hardcode game data in components
- Engine functions are pure — no React, no side effects
- Components are thin — they render UI and pass props, logic lives in hooks/engine

## Gameplay

1. **Squad** — View operatives, equip gear, learn skills
2. **Mission** — Select from chapter-grouped missions, fight through encounters
3. **Comms** — Read story transmissions that unlock as you progress
4. **Inventory** — Manage gear, buy/use combat stims
5. **Recruit** — Add new operatives (4 classes: Vanguard, Recon, Medic, Engineer)

Combat is auto-resolved round by round. Tactical decisions appear every 3 rounds and between encounters. Squads recover 15% HP and 25% shields between encounters.

## Save Compatibility

Game state is saved to `window.storage` under the key `frontier-v2`. New fields use defensive defaults (`game.field || defaultValue`) to ensure old saves load without issues.
