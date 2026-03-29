---
name: debug
description: "Systematic debugging methodology with regression prevention. Use when something is broken, tests are failing, behavior is unexpected, or user says 'bug', 'broken', 'not working', 'help me debug'."
---

# Debug Skill

Systematic bug investigation — no guessing, no band-aids, no fixing one thing and breaking another.

## Process

1. **Capture symptoms**: Ask the user (or read from context):
   - What's the expected behavior?
   - What's the actual behavior?
   - When did it start? What changed recently?
   - Can you reproduce it reliably?

2. **Define success criteria**: Confirm with the user:
   - "Success = {expected behavior works} AND {everything else still works}. Correct?"
   - If the user just says "fix it" → push back: "I want to make sure my fix doesn't break something else. What specifically should work when this is resolved?"

3. **Capture baseline**: Run the full test suite NOW, before any investigation changes anything. Record pass/fail counts.

4. **Investigate**: Delegate to the `debugger` agent with:
   - Symptoms and reproduction steps
   - Baseline test results
   - Success criteria
   - Instruction: "Map the blast radius — what else depends on the broken code?"

5. **Review findings**: The debugger reports root cause, blast radius, and recommended fix

6. **Fix**: Delegate to the `implementer` agent with:
   - The debugger's root cause analysis
   - The recommended fix approach
   - The blast radius (what else to check)
   - The baseline test results (what must still pass)
   - Explicit instruction: "After fixing, run the FULL test suite and compare to baseline. If any previously-passing test now fails, your fix introduced a regression — keep going."

7. **Verify**:
   - Run the reproduction steps — is the bug actually fixed?
   - Run the full test suite — compare to baseline. No new failures allowed.
   - Check the blast radius items — are all consumers of the changed code still working?

8. **Escalate if needed**: If not resolved after 3 investigation-fix cycles:
   - Present all findings, attempts, and test results to the user
   - Suggest what to investigate next
   - Don't keep looping — that's how you create more bugs

## Rules
- Always capture baseline test results BEFORE any changes
- Debugger investigates, implementer fixes — separate contexts
- The fix is not "done" until: bug is resolved AND no regressions AND success criteria met
- Never accept "it compiles" or "the specific test passes" as proof of success — run the FULL suite
- If the fix is a band-aid that will cause problems later, say so. Recommend the proper fix even if it's more work.
