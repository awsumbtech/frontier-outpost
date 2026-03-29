---
name: brainstorm
description: "Structured requirements gathering with mandatory success criteria definition. Auto-triggers when starting a new feature, task, or project. Use when user says 'let's build', 'I want to add', 'new feature', or describes something they want to create."
---

# Brainstorm Skill

Before writing any code, clarify what we're building AND how we'll know it's done right.

## Process

1. **Understand the request**: Read the user's description carefully
2. **Explore context**: Use the `explorer` agent to check relevant existing code, current test status, and what might be affected
3. **Define success criteria** (MANDATORY — do not skip):
   Ask the user explicitly:
   - "What does success look like for this? How will you know it's working correctly?"
   - "What should NOT change? Are there existing behaviors we need to preserve?"
   - "What's the worst thing that could go wrong if this is implemented poorly?"
   Document the answers. These become the acceptance criteria for the plan.
4. **Ask clarifying questions**: One at a time, prefer multiple choice when possible
   - Expected behavior (happy path)
   - Edge cases and error handling expectations
   - Constraints (performance, compatibility, security)
5. **Map the blast radius**: What existing code, features, or tests will be affected?
   - Use the `explorer` agent to trace dependencies
   - Identify what currently works that MUST continue working
6. **Propose 2-3 approaches**: With trade-offs for each, including risk to existing functionality
7. **Get approval**: Present the chosen approach in sections, confirm each
8. **Save design doc**: Write to `docs/plans/YYYY-MM-DD-{topic}-design.md` including:
   - Success criteria (from step 3)
   - Blast radius analysis (from step 5)
   - Chosen approach
9. **Transition**: Invoke the `plan` skill to create the implementation plan

## The Design Doc Must Include

```markdown
## Success Criteria
- [ ] {What the user said "done" looks like}
- [ ] {Existing behaviors that must be preserved}
- [ ] {Tests that must continue passing}

## Blast Radius
- Files likely to change: {list}
- Files that depend on changed code: {list}
- Test suites to run for verification: {list}

## Risks
- {What could go wrong and how we'll mitigate it}
```

## Rules
- **NEVER proceed without defined success criteria**. If the user says "just do it" without defining what success looks like, push back: "I want to make sure I deliver what you actually need. What does 'done right' look like for you?"
- YAGNI — cut anything that isn't needed right now
- One question at a time — don't overwhelm
- If the task is truly trivial (< 10 lines of change), abbreviate but still confirm: "So success = {X} and nothing else should change, correct?"
- The ONLY next step after brainstorm is `/plan`. Do not invoke implementation skills.
