---
name: review-gate
description: "Quality gate that runs between implementation steps. Compares current test results to baseline and blocks on regressions. Auto-invoked by the execute skill."
---

# Review Gate Skill

Regression-focused quality check between implementation steps.

## Process

1. **Run the full test suite** — not just the tests you think are relevant. ALL tests.
2. **Compare to baseline**:
   - How many tests passed before? How many now?
   - Did any previously-passing test start failing? → This is a BLOCKER.
   - Did any new tests get added? (Good — note them)
3. **Check task completion** against the "done when" criteria
4. **Spot check changed files**:
   - Were all imports/callers of changed functions updated?
   - Any syntax errors, missing semicolons, unclosed brackets?
   - Any `console.log` / `print` / debug statements left in?
5. **Report**:
   - ✅ PASS — No regressions, task criteria met, proceed
   - ⚠️ WARN — Minor issues noted but no regressions, safe to proceed with notes
   - ❌ FAIL — Regressions detected OR task criteria not met. MUST address before continuing.

## On Failure

If the gate fails:
- List exactly which tests regressed (test name, file, error)
- Identify which change likely caused the regression
- The implementer agent must fix the regression before the next task starts
- After the fix, re-run this gate. Do not proceed until it passes.

## Rules
- This runs after EVERY implementation task, not just at the end
- "I only changed one file so I don't need to run all tests" is NEVER acceptable
- A task is not done until the gate passes
- If there's no test suite, say so explicitly and recommend manual verification steps
