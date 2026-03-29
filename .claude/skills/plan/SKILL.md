---
name: plan
description: "Creates an implementation plan with success criteria, blast radius analysis, and agent assignments for each task. Use after brainstorming, or when user says 'plan this', 'break this down', or provides a clear spec."
---

# Plan Skill

Create an implementation plan where every task has clear success criteria and regression checks.

## Process

1. **Read the design doc** from `docs/plans/` if one exists. If not, ask: "What does success look like for this?"
2. **Carry forward success criteria**: The plan must reference the success criteria from the design doc. Every task contributes to meeting those criteria.
3. **Establish baseline task** (ALWAYS first): Run the full test suite and record results. This is the "before" snapshot.
4. **Break into tasks**: Each task should be completable in one agent session
5. **Assign agents**: Map each task to the appropriate agent
6. **For each task, define**:
   - What to do (specific enough for an agent with no context)
   - What "done" looks like for this specific task
   - What must NOT break (blast radius awareness)
   - Verification step (test to run, behavior to check)
7. **Order tasks**: Dependencies first, parallel work identified
8. **Add regression check tasks**: After implementation tasks, add explicit verification tasks
9. **Save plan**: Write to `docs/plans/YYYY-MM-DD-{topic}-plan.md`

## Plan Template

```markdown
# {Feature} Implementation Plan

> **To execute**: Use `/execute` or say "execute this plan"

## Success Criteria (from design doc)
- [ ] {User's definition of done}
- [ ] {Existing behaviors that must be preserved}
- [ ] No regressions — all previously passing tests still pass

## Baseline
- Run full test suite before any changes
- Record: {X passing, Y failing, Z skipped}

## Tasks

### Task 0: Capture Baseline
- **Agent**: explorer
- **Do**: Run the full test suite. Record exactly which tests pass, fail, and skip. Check for any existing errors or warnings in build/lint output.
- **Done when**: Baseline snapshot documented with exact pass/fail counts

### Task 1: {title}
- **Agent**: {explorer|implementer|tester|reviewer|documenter|debugger}
- **Do**: {specific instructions}
- **Files**: {expected files involved}
- **Must not break**: {specific things to verify still work}
- **Done when**: {measurable criteria} AND no regressions from baseline

### Task 2: {title}
- **Agent**: {agent}
- **Do**: {instructions}
- **Files**: {files}
- **Must not break**: {what to verify}
- **Done when**: {criteria} AND no regressions
- **Depends on**: Task 1

### Task N-1: Regression Verification
- **Agent**: tester
- **Do**: Run the full test suite. Compare results to baseline from Task 0. Flag any test that changed from pass to fail.
- **Done when**: Zero net-new test failures compared to baseline

### Task N: Final Review
- **Agent**: reviewer
- **Do**: Review all changes against success criteria. Verify blast radius was checked. Confirm test baseline comparison shows no regressions.
- **Done when**: Success criteria met, no regressions, all critical/warning findings addressed
```

## Rules
- EVERY plan starts with a baseline capture task
- EVERY plan ends with regression verification + final review
- EVERY implementation task has a "must not break" field
- Tasks must be specific enough that an agent with zero context can complete them
- If success criteria aren't defined, DO NOT create the plan. Go back to brainstorm.
- Target 3-8 implementation tasks. If more, break into multiple plans.
- Keep plans in `docs/plans/` — they serve as project history
