---
globs: "**/*"
---

# Agent Routing Rules

These rules help Claude decide which agent to use automatically.

## PRIME DIRECTIVE — Applies to ALL agents and ALL tasks

**Every change must leave the project in a better state than you found it.**

Before ANY work:
1. Confirm success criteria with the user — what does "done right" look like?
2. Capture baseline test results (run full test suite)
3. Map blast radius (what depends on what you're changing?)

After ANY work:
4. Run full test suite — compare to baseline
5. If any previously-passing test now fails → you're not done, fix the regression
6. Verify the user's success criteria are actually met

## Agent Selection

| Task Type | Agent | When to use |
|---|---|---|
| Research & discovery | `explorer` | Understanding code, finding patterns, mapping dependencies, blast radius analysis |
| Writing/changing code | `implementer` | Creating features, fixing bugs, refactoring — always with baseline/regression checking |
| Quality & regression check | `reviewer` | Post-implementation: success criteria verification, blast radius audit, regression detection |
| Test creation | `tester` | Writing tests, adding coverage, running baseline comparisons |
| Documentation | `documenter` | READMEs, architecture docs, API docs, inline comments |
| Bug investigation | `debugger` | Systematic root cause analysis with blast radius mapping |

## Skill Triggers

| Situation | Skill | Triggers |
|---|---|---|
| Starting something new | `brainstorm` | "let's build", "I want to add", "new feature" — forces success criteria definition |
| Breaking down work | `plan` | "plan this", "break this down" — every task gets success criteria + "must not break" |
| Running a plan | `execute` | "execute", "do it", "run the plan" — baseline capture, regression gates at every step |
| Something's broken | `debug` | "bug", "broken", "not working" — root cause first, blast radius mapped, no band-aids |

## Multi-step Workflow

For anything beyond a trivial change: brainstorm → plan → execute

The execute skill handles agent dispatch, baseline comparison, and regression gates automatically.

## Single-step Tasks

For simple, self-contained requests, delegate directly BUT still verify:
- "Find where X is defined" → explorer (no verification needed — read only)
- "Fix this typo in config.js" → implementer (still run tests before/after)
- "Review this PR" → reviewer
- "Add tests for the auth module" → tester
- "Update the README" → documenter (verify build still works if README has code examples)
- "Why is this test failing" → debugger (map blast radius before recommending fix)

## When to Push Back

If the user says something like:
- "Just fix it" → Ask: "What does 'fixed' look like? I want to make sure I solve the right problem."
- "Don't worry about tests" → Say: "I understand you want to move fast, but running tests is how I make sure I don't break something else. It only takes a moment."
- "It's a small change, just do it" → Small changes to shared code can have big blast radius. Still check.
