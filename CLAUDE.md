# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

**Frontier Outpost** is a browser-based sci-fi RPG built with React (Vite). It features pause-and-plan auto-combat, squad management, deep gear/skill systems, a 20-mission story campaign across 5 chapters, and a consumable stim system. No backend — all game logic runs client-side.

## Current State

The project is **fully decomposed** from the original monolith into a clean React + Vite architecture. The original `MonolithApp.jsx` is kept at project root as a reference only — it is not imported or used.

## Tech Stack

- **Framework:** React 18 + Vite
- **Language:** JavaScript (JSX)
- **Styling:** External CSS (`src/styles/global.css`), Rajdhani + Share Tech Mono fonts
- **State:** React useState/useEffect + custom hooks, persistent storage via `window.storage`
- **Testing:** Vitest + @testing-library/react + jsdom (86 tests)
- **No backend.** All game logic runs client-side.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npx vitest run       # Run all tests
npx vitest           # Run tests in watch mode
```

## Architecture

```
src/
  main.jsx              # Entry point
  App.jsx               # Root (~50 lines): tab router, top bar, hooks wiring
  styles/global.css     # All CSS
  data/                 # Game constants (8 files) — never hardcode data in components
    constants.js, classes.js, gear.js, enemies.js, missions.js,
    story.js, decisions.js, operativeNames.js
  engine/               # Pure functions (6 files) — no React, no side effects
    utils.js, gear.js, operatives.js, combat.js, stims.js, saves.js
  hooks/                # State management (2 files)
    useGameState.js     # Game state + all gameplay handlers
    useMission.js       # Mission state machine (briefing → combat → decision → result)
  components/
    tabs/               # One per game tab (5 files)
      SquadTab.jsx, MissionTab.jsx, CommsTab.jsx, InventoryTab.jsx, RecruitTab.jsx
    combat/             # Combat UI (2 files)
      CombatAlly.jsx, CombatEnemy.jsx
    shared/             # Reusable UI (3 files)
      ClassBadge.jsx, StatDiff.jsx, GearModal.jsx
```

## THE PRIME DIRECTIVE — Read This First

**Every change must leave the project in a BETTER state than you found it. Never trade one fix for new breakage.**

Before touching ANY code:
1. **Define success criteria** — What does "done" look like? Get explicit confirmation from the user.
2. **Map the blast radius** — What else depends on the code you're changing? Use the `explorer` agent if unsure.
3. **Capture baseline** — Run `npm run build` (and tests when available) BEFORE changes. Record what passes/fails.
4. **Make the change** — Minimal, focused, scoped to the task.
5. **Run full verification AFTER** — Compare to baseline. If ANYTHING that worked before now fails, fix the regression before reporting success.
6. **Verify the actual user goal** — Does it solve the problem the user described?

**If you cannot run tests**, tell the user and explain what manual verification you'd recommend. Do not claim success without verification.

## Success Criteria Rules

These apply to EVERY task, no exceptions:

- **No net-new failures**: If the build passed before, it must pass after. If you break one thing fixing another, you're not done.
- **No silent side effects**: If your change touches shared code (engine functions, data files, hooks), check all consumers.
- **No tunnel vision**: Test the happy path AND edge cases. Before reporting "done", ask: "What would break if this ran with real player data?"
- **Confirm, don't assume**: If success criteria are ambiguous, ASK before implementing.

## Project-Specific Rules

1. **No scope creep.** Do not add features, systems, or mechanics not explicitly requested. If something seems like a good idea, propose it — don't build it.
2. **One thing at a time.** Complete the current task fully before starting the next. No partial implementations.
3. **Data stays in `/data`.** All game constants, templates, and configuration live in data files. Never hardcode game data in components.
4. **Engine stays pure.** Functions in `/engine` are pure (no React, no side effects). They take inputs and return outputs.
5. **Components are thin.** Components render UI and dispatch actions. Game logic lives in engine or hooks.
6. **Test combat math.** Any change to combat calculations must be verified with a before/after comparison on at least one scenario.
7. **Preserve save compatibility.** New fields in game state must have defaults so old saves don't crash. Use `game.field || defaultValue` patterns.
8. **No visual regressions.** After any UI change, verify the app renders correctly on both the Mission tab (during combat) and Squad tab (operative detail).

## Agent Routing

When working on tasks, delegate to the appropriate agent:
- **Exploration/research**: `explorer` — understanding code, finding patterns, mapping dependencies, blast radius analysis
- **Implementation**: `implementer` — creating features, fixing bugs, refactoring (always with baseline/regression checking)
- **Code review**: `reviewer` — post-implementation success criteria verification, regression detection
- **Testing**: `tester` — writing tests, adding coverage, running baseline comparisons
- **Documentation**: `documenter` — READMEs, architecture docs, inline comments
- **Debugging**: `debugger` — systematic root cause analysis with blast radius mapping

See `.claude/rules/agent-routing.md` for detailed routing logic.

## Workflow

For any non-trivial task:
1. `/brainstorm` — clarify requirements AND define measurable success criteria
2. `/plan` — create implementation plan with blast radius analysis and agent assignments
3. `/execute` — run the plan with auto-delegation, baseline testing, and regression checks

For simple tasks, delegate directly — but STILL run baseline → change → verify.

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
- Agent definitions: `.claude/agents/`
- Skills: `.claude/skills/`
- Routing rules: `.claude/rules/agent-routing.md`
- Plans: `docs/plans/`
