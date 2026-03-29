# Project Init Instructions

## Step 1: Create the Vite Project

```bash
cd ~/projects  # or wherever you keep your repos
npm create vite@latest frontier-outpost -- --template react
cd frontier-outpost
npm install
```

## Step 2: Drop in the Docs

Copy these files into the project root:

```
frontier-outpost/
  CLAUDE.md              # Prime Directive (Claude Code reads this automatically)
  PRD.md                 # Product requirements
  DECOMPOSITION_PLAN.md  # How to break up the monolith
  GAME_BALANCE.md        # All the math
  ROADMAP.md             # Future features
```

## Step 3: Drop in the Source

Copy the current monolith artifact into the project:

```bash
# Copy the artifact file into src/
cp frontier-outpost.jsx src/MonolithApp.jsx
```

This is the reference. Claude Code will decompose it following the DECOMPOSITION_PLAN.

## Step 4: Init Git

```bash
git init
git add -A
git commit -m "Initial scaffold with monolith reference and governance docs"
```

## Step 5: Open Claude Code

```bash
claude
```

Claude Code will automatically read CLAUDE.md and understand the project.

## Step 6: First Task - Decompose

Tell Claude Code:

> "Follow the DECOMPOSITION_PLAN.md to decompose MonolithApp.jsx into the target architecture defined in CLAUDE.md. Do Phase 1 first (extract data and engine), verify it works, then Phase 2 (extract components), verify again. Do not change any game behavior."

## Step 7: Verify

After decomposition, run:

```bash
npm run dev
```

Play through a full mission. Verify:
- Combat works
- Decisions appear
- Stims work
- Story beats unlock
- Missions show completion flags
- Save/load works

## Step 8: Prime Directive Active

From this point forward, CLAUDE.md governs all Claude Code interactions. Any new feature requests go through the Prime Directive rules (no scope creep, one thing at a time, etc.).

## Tips

- If Claude Code tries to add features during decomposition, redirect: "Just decompose, no new features"
- If something breaks, `git diff` to see what changed
- Keep the monolith file as reference until decomposition is fully verified, then delete it
- Use `git commit` after each successful phase
