# Post-Mission Debrief Sequence — Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"

## Success Criteria
- [ ] After mission ends (success or failure), a debrief screen shows combat stats + rewards
- [ ] If new story beats unlocked, they display one-at-a-time as "Incoming Transmission" before returning
- [ ] Multiple new beats step through with "Next" button
- [ ] Beats are auto-marked as read after viewing
- [ ] On failure: full debrief with casualties/rounds, no rewards, no new comms
- [ ] Flow ends at Squad tab (same as current behavior)
- [ ] Abort button still works (skips debrief, goes straight to Squad)
- [ ] Existing combat, decision, and mission start flows unchanged
- [ ] No regressions — all 86 tests pass

## Baseline
- Build: passing
- Tests: 86/86 passing (5 test files)

## Design Summary

Replace the single "Return to Base" button with a 3-phase sequence:

```
Mission ends → Debrief (stats/loot) → Incoming Transmission(s) → Squad tab
                                       (skipped if no new beats)
```

**Key decisions:**
- Model as sub-phases (`debriefPhase: "stats" | "comms"`) on the existing `mission` object
- Track combat stats (`totalRounds`, `enemiesKilled`, `operativesDowned`) in `mission.combatStats`
- Detect new beats by snapshotting `missionsCompleted` at mission start, diffing at end
- Count kills by diffing alive enemies before/after each combat round (avoids parsing log types)

## Tasks

### Task 0: Capture Baseline
- **Agent**: tester
- **Do**: Run `npm run build` and `npx vitest run`. Record exact pass/fail counts.
- **Done when**: Baseline documented — 86/86 tests, build clean

### Task 1: Add combat stat tracking to useMission.js
- **Agent**: implementer
- **Do**:
  1. In `startMission()`, add to mission init: `combatStats: { totalRounds: 0, enemiesKilled: 0, operativesDowned: 0 }`, `debriefPhase: null`, `prevMissionsCompleted: game.missionsCompleted`
  2. In `advanceMission()` combat block, before calling `combatRound()`, snapshot `enemies.filter(e => e.alive).length`. After `combatRound()`, diff to count kills. Count `operativesDowned` from squad alive diff. Increment `totalRounds`.
  3. Fold stat increments into the existing `setMission()` calls (don't add new setState calls)
  4. On mission success (final encounter cleared): set `debriefPhase: "stats"`, include `combatStats` in `missionResult`, compute `newBeats` from `STORY_CHAPTERS` by comparing `prevMissionsCompleted` vs new count
  5. On mission failure (squad wiped): same debrief phase, `newBeats: []`, include stats
- **Files**: `src/hooks/useMission.js`
- **Must not break**: Mission start, combat rounds, decision events, between-encounter healing, XP/credit rewards
- **Done when**: `mission.combatStats` accumulates correctly, `missionResult` has `newBeats` and `combatStats`

### Task 2: Add advanceDebrief() and wire to exports
- **Agent**: implementer
- **Do**:
  1. Add `advanceDebrief()` function to `useMission.js`:
     - If `debriefPhase === "stats"` and `newBeats.length > 0`: transition to `debriefPhase: "comms"`, `commsIndex: 0`
     - If `debriefPhase === "stats"` and no new beats: call `resetMission()`
     - If `debriefPhase === "comms"` and more beats: increment `commsIndex`
     - If `debriefPhase === "comms"` and last beat: mark all `newBeats` as read in `storyBeatsRead`, call `resetMission()`
  2. Export `advanceDebrief` from the hook
  3. In `App.jsx`: destructure `advanceDebrief` from `ms`, pass to `MissionTab`
- **Files**: `src/hooks/useMission.js`, `src/App.jsx`
- **Must not break**: `resetMission()` still works for Abort, tab switching, unread badge
- **Done when**: `advanceDebrief` properly sequences stats → comms → squad, and is available as a prop on MissionTab

### Task 3: Build debrief and transmission UI in MissionTab
- **Agent**: implementer
- **Do**:
  1. Accept `advanceDebrief` prop
  2. When `mission.phase === "result"` and `debriefPhase === "stats"`:
     - Render debrief panel: success/failure header, combat stats grid (rounds, kills, downed), rewards section (XP, credits, loot items with rarity colors), "Continue" button calling `advanceDebrief`
     - On failure: show stats but "No rewards" for the rewards section
  3. When `debriefPhase === "comms"`:
     - Render transmission panel: "INCOMING TRANSMISSION" header, sender name, message text
     - Progress indicator ("1 of N") if multiple beats
     - "Next" or "Continue" button calling `advanceDebrief`
  4. Replace the old "Return to Base" button (only shown when `debriefPhase === "stats"` or `"comms"`)
  5. Keep Abort button working (calls `resetMission` directly)
- **Files**: `src/components/tabs/MissionTab.jsx`
- **Must not break**: Briefing phase, combat phase, decision phase rendering, Abort functionality
- **Done when**: Debrief shows stats/rewards, transmissions step through, flow ends at Squad tab

### Task 4: CSS for debrief and transmission panels
- **Agent**: implementer
- **Do**: Add styles to global.css:
  - `.debrief-panel` — padded card with background, similar to existing decision panel
  - `.debrief-header` — large success/failure text with color
  - `.debrief-stats` — grid for stat display
  - `.debrief-loot` — list of loot items with rarity colors
  - `.transmission-panel` — styled like CommsTab beat entries but larger/more prominent
  - `.transmission-sender` — sender name in accent color
  - Reuse existing animations (fadeIn, slideUp) and font vars
- **Files**: `src/styles/global.css`
- **Must not break**: All existing styles
- **Done when**: Debrief and transmission screens are styled consistently with the game's aesthetic

### Task 5: Update tests
- **Agent**: tester
- **Do**:
  1. In `tabs.test.jsx`: pass `advanceDebrief` prop (vi.fn()) to all MissionTab renders
  2. Add test: render MissionTab with `debriefPhase: "stats"` mission, verify debrief panel shows
  3. In `hooks.test.jsx`: verify `startMission` initializes `combatStats` and `prevMissionsCompleted`
- **Files**: `src/components/__tests__/tabs.test.jsx`, `src/hooks/__tests__/hooks.test.jsx`
- **Must not break**: All existing 86 tests
- **Done when**: New tests pass, no existing tests broken

### Task 6: Regression Verification
- **Agent**: tester
- **Do**: Run `npm run build` and `npx vitest run`. Compare to baseline (86 tests). Zero net-new failures.
- **Done when**: Build clean, all tests pass

### Task 7: Final Review
- **Agent**: reviewer
- **Do**: Review all changes against success criteria. Verify the full flow: mission complete → debrief → comms → squad. Check failure path. Check repeat mission (no new comms). Verify Abort still works.
- **Done when**: All success criteria met, no regressions
