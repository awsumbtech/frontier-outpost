---
name: execute
description: "Executes an implementation plan by dispatching agents with baseline verification and regression checks at every step. Use after planning, or when user says 'execute', 'do it', 'run the plan'."
---

# Execute Skill

Run through the implementation plan with continuous regression monitoring.

## Process

### Startup
1. **Load the plan**: Read the most recent plan from `docs/plans/` or use the current conversation
2. **Verify success criteria exist**: If the plan has no success criteria section, STOP. Say: "This plan doesn't have success criteria defined. Let's fix that before executing." Go back to brainstorm or ask the user.
3. **Confirm with user**: "I'm about to execute {plan name} with {N} tasks. Success criteria: {list them}. Proceed?"

### Task 0: Baseline (MANDATORY — never skip)
4. **Run full test suite**: Record exact pass/fail/skip counts. Record any build warnings or lint errors.
5. **Store baseline**: Keep these numbers — every subsequent check compares against them.
6. If there are pre-existing failures, note them. The goal is: no NEW failures.

### For Each Task (in dependency order)
7. **Announce**: "📋 Task {N}/{total}: {title} → delegating to `{agent}`"
8. **Dispatch agent** with:
   - Task description from the plan
   - Success criteria for this specific task
   - "Must not break" items from the plan
   - Relevant context from previous tasks
   - The baseline test results (so the agent knows what must still pass)
9. **When agent returns**: Run the review gate:
   - Run full test suite again
   - Compare to baseline: any new failures? → STOP. Do not proceed.
   - Does the task's "done when" criteria pass?
   - ✅ All good → mark done, continue
   - ❌ New regressions → report to user: "Task {N} introduced regressions: {list}. The agent needs to fix these before we continue."
   - ⚠️ Task criteria not met but no regressions → ask user: retry, adjust criteria, or skip?

### After All Implementation Tasks
10. **Full regression check**: Dispatch `tester` agent to run complete test suite and compare to baseline
11. **Final review**: Dispatch `reviewer` agent with:
    - All changes made during execution
    - Success criteria from the plan
    - Baseline vs final test results
    - Blast radius analysis

### Summary
12. **Present results**:
```
## Execution Summary

### Success Criteria
- [ ] {criteria 1}: {MET/NOT MET}
- [ ] {criteria 2}: {MET/NOT MET}
- [ ] No regressions: {MET/NOT MET}

### Test Results
- Baseline: {X passing, Y failing}
- Final: {X passing, Y failing}
- Net change: {+X new passing, -Y new failing}

### Tasks Completed
- Task 1: ✅ {title}
- Task 2: ✅ {title}
- ...

### Issues Found
- {any reviewer findings}

### Remaining Work
- {anything not completed or deferred}
```

## Handling Problems

- **New regression detected**: STOP execution. Report which tests broke and which task caused it. The implementer agent must fix the regression before any further tasks run.
- **Agent stuck or looping**: If same error 3 times, stop and escalate to user with full context.
- **Scope creep**: If an agent starts doing work outside the task, stop and redirect.
- **No test suite available**: Flag this clearly. Ask user what manual verification to perform. Do not assume "it compiles = it works."

## Rules
- NEVER skip the baseline capture
- NEVER proceed past a task that introduced regressions
- NEVER skip the final review
- NEVER report success without comparing final test results to baseline
- If an agent reports "done" but didn't mention test results, that's not done — run the tests yourself
