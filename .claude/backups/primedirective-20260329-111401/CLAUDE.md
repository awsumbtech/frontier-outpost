# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

**Frontier Outpost** is a browser-based sci-fi RPG built with React (Vite). It features pause-and-plan auto-combat, squad management, deep gear/skill systems, a 20-mission story campaign across 5 chapters, and a consumable stim system. No backend — all game logic runs client-side.

## Current State

The project has **not been scaffolded yet**. The repo contains:
- `MonolithApp.jsx` — the complete game as a single ~87KB file (the source of truth)
- Governance docs: `PRD.md`, `DECOMPOSITION_PLAN.md`, `GAME_BALANCE.md`, `ROADMAP.md`, `INIT_INSTRUCTIONS.md`

**First task** is to follow `INIT_INSTRUCTIONS.md` to scaffold the Vite project, then follow `DECOMPOSITION_PLAN.md` to break the monolith into the target architecture below. No behavior changes during decomposition.

## Tech Stack

- **Framework:** React 18 + Vite (template: react)
- **Language:** JavaScript (JSX)
- **Styling:** CSS-in-JS (embedded styles), Rajdhani + Share Tech Mono fonts
- **State:** React useState/useEffect, persistent storage via localStorage
- **No backend, no testing framework, no linter configured.**

## Commands (after Vite scaffold)

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run preview # Preview production build
```

## Target Architecture

After decomposition, the project follows this structure. See `DECOMPOSITION_PLAN.md` for the full extraction plan.

- `src/data/` — Game constants and templates. All game data lives here, never in components.
- `src/engine/` — Pure functions (no React, no side effects). Combat math, gear generation, operative creation, save/load.
- `src/components/tabs/` — One component per game tab (Squad, Mission, Comms, Inventory, Recruit).
- `src/components/combat/` — Combat UI components (ally/enemy cards, log, decision panel, sticky bar).
- `src/components/shared/` — Reusable UI primitives (bars, badges, modals, stat displays).
- `src/hooks/` — `useGameState.js` (central state + save/load) and `useMission.js` (mission state machine).
- `src/styles/global.css` — All CSS extracted from inline styles.

## Prime Directive Rules

1. **No scope creep.** Do not add features, systems, or mechanics not explicitly requested. If something seems like a good idea, propose it — don't build it.
2. **One thing at a time.** Complete the current task fully before starting the next. No partial implementations.
3. **Data stays in `/data`.** All game constants, templates, and configuration live in data files. Never hardcode game data in components.
4. **Engine stays pure.** Functions in `/engine` are pure (no React, no side effects). They take inputs and return outputs.
5. **Components are thin.** Components render UI and dispatch actions. Game logic lives in engine or hooks.
6. **Test combat math.** Any change to combat calculations must be verified with a before/after comparison on at least one scenario.
7. **Preserve save compatibility.** New fields in game state must have defaults so old saves don't crash. Use `game.field || defaultValue` patterns.
8. **No visual regressions.** After any UI change, verify the app renders correctly on both the Mission tab (during combat) and Squad tab (operative detail).

## Key Design Decisions

- **Pause-and-plan combat:** Auto-combat runs round by round. Player clicks "Next Round" to advance. Tactical decisions interrupt every 3 rounds and between encounters.
- **Between-encounter healing:** Squad recovers 15% HP and 25% shields between encounters.
- **Repeat penalty:** First clear gives full XP/credits. Repeats give 50% rewards but full loot drops.
- **Chapter unlock:** Complete all 4 missions in a chapter to unlock the next (20 missions, 5 chapters).
- **Difficulty tags:** Easy/Fair/Hard/Brutal based on squad avg level vs recommended level.
- **Class-specific weapons only.** Armor, implants, and gadgets are universal (ANY tag).
- **6 skills per branch, 2 branches per class.** Skills have prerequisites (must learn in order within branch).

## Reference Docs

- `GAME_BALANCE.md` — Combat math formulas, class base stats, enemy templates, XP/credit curves, gear rarity weights. **Read this before changing any combat or economy values.**
- `PRD.md` — Full product requirements and feature specifications.
- `DECOMPOSITION_PLAN.md` — Step-by-step plan for breaking MonolithApp.jsx into target architecture.
- `ROADMAP.md` — Future feature ideas (not yet approved for implementation).
