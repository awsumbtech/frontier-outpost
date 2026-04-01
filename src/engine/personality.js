// =============================================================================
// personality.js — Pure selection logic for the personality system.
// No React. No side effects. All functions are pure (given Math.random()).
// =============================================================================

import {
  PERSONALITY_TRAITS,
  CONTRADICTORY_PAIRS,
  COMBAT_BARKS,
  BANTER_LINES,
  STORY_REACTIONS,
  DEATH_REACTIONS,
} from '../data/personality';

import { INLINE_STORY, DECISION_ECHOES, ENV_FLAVOR } from '../data/inlineStory';

import { pick, rng } from './utils';

// =============================================================================
// 1. selectTraits()
// Returns an array of 1–2 trait id strings for a new operative.
// 60% chance of 2 traits, 40% chance of 1. Contradictory pairs are avoided.
// =============================================================================

export function selectTraits() {
  const allIds = PERSONALITY_TRAITS.map((t) => t.id);
  const wantTwo = Math.random() < 0.6;

  if (!wantTwo || allIds.length < 2) {
    return [pick(allIds)];
  }

  // Build a list of valid two-trait combos (no contradictory pairs).
  // Attempt up to 20 random picks to keep it O(1) in the happy path.
  for (let attempt = 0; attempt < 20; attempt++) {
    const first = pick(allIds);
    const remaining = allIds.filter((id) => id !== first);
    const second = pick(remaining);

    const contradicts = CONTRADICTORY_PAIRS.some(
      ([a, b]) =>
        (a === first && b === second) || (a === second && b === first)
    );

    if (!contradicts) {
      return [first, second];
    }
  }

  // Fallback: return just one trait if we couldn't find a clean pair.
  return [pick(allIds)];
}

// =============================================================================
// 2. selectBark(event, operative, recentBarks)
// Returns { text, opName } or null.
// ~40% chance of firing. Deduplicates against recentBarks.
// =============================================================================

export function selectBark(event, operative, recentBarks = []) {
  if (Math.random() >= 0.4) return null;

  const { name, traits } = operative;
  if (!traits || traits.length === 0) return null;

  const eventBarks = COMBAT_BARKS[event];
  if (!eventBarks) return null;

  // Try each trait (randomise order so the second trait isn't always a fallback).
  const traitOrder =
    traits.length > 1 && Math.random() < 0.5
      ? [traits[1], traits[0]]
      : [...traits];

  for (const trait of traitOrder) {
    const lines = eventBarks[trait];
    if (!lines || lines.length === 0) continue;

    // Filter out recently shown lines.
    const available = lines.filter((l) => !recentBarks.includes(l));
    if (available.length === 0) continue;

    return { text: pick(available), opName: name };
  }

  return null;
}

// =============================================================================
// 3. selectBanter(squad)
// Returns { lines: [{ speaker, text }, ...] } or null.
// Finds trait-pair matches across alive squad members and picks one exchange.
// =============================================================================

export function selectBanter(squad) {
  const eligible = squad.filter(
    (op) => op.alive && op.traits && op.traits.length > 0
  );

  if (eligible.length < 2) return null;

  // Collect all matching banter entries across operative pairs.
  const matches = [];

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const opA = eligible[i];
      const opB = eligible[j];

      for (const traitA of opA.traits) {
        for (const traitB of opB.traits) {
          // Build the sorted key.
          const key = [traitA, traitB].sort().join('+');
          const entry = BANTER_LINES[key];
          if (!entry || entry.length === 0) continue;

          // Each element in the entry array is an exchange object.
          const exchange = pick(entry);
          matches.push({ exchange, opA, opB, traitA, traitB });
        }
      }
    }
  }

  if (matches.length === 0) return null;

  const chosen = pick(matches);
  const { exchange, opA, opB } = chosen;

  // Map trait speaker ids to operative names.
  // exchange.speakers tells us which two traits are involved;
  // exchange.lines[].speaker is a trait id.
  // We match trait id to operative based on which op has that trait.
  const traitToName = {};
  for (const line of exchange.lines) {
    if (opA.traits.includes(line.speaker)) {
      traitToName[line.speaker] = opA.name;
    } else if (opB.traits.includes(line.speaker)) {
      traitToName[line.speaker] = opB.name;
    }
  }

  const lines = exchange.lines.map((l) => ({
    speaker: traitToName[l.speaker] || l.speaker,
    text: l.text,
  }));

  return { lines };
}

// =============================================================================
// 4. selectStoryReaction(beatKey, squad)
// Returns up to 2 { opName, text } objects for operatives whose traits match
// the story beat. Returns empty array if no matches.
// =============================================================================

export function selectStoryReaction(beatKey, squad) {
  const reactions = STORY_REACTIONS[beatKey];
  if (!reactions) return [];

  // Build a set of trait→text for this beat.
  const traitToText = {};
  for (const { trait, text } of reactions) {
    traitToText[trait] = text;
  }

  const matches = [];

  for (const op of squad) {
    if (!op.alive || !op.traits || op.traits.length === 0) continue;

    for (const trait of op.traits) {
      if (traitToText[trait]) {
        matches.push({ opName: op.name, text: traitToText[trait] });
        break; // one reaction per operative
      }
    }
  }

  if (matches.length === 0) return [];
  if (matches.length <= 2) return matches;

  // Pick 2 at random.
  const idx1 = rng(0, matches.length - 1);
  let idx2 = rng(0, matches.length - 2);
  if (idx2 >= idx1) idx2++;
  return [matches[idx1], matches[idx2]];
}

// =============================================================================
// 5. selectDeathReaction(fallenOp, survivors)
// Returns { opName, text } or null.
// Picks one random line from a random surviving operative that has a matching
// trait in DEATH_REACTIONS.
// =============================================================================

export function selectDeathReaction(fallenOp, survivors) {
  const eligible = survivors.filter(
    (op) => op.traits && op.traits.length > 0
  );

  if (eligible.length === 0) return null;

  // Collect all candidates as { op, trait, lines }.
  const candidates = [];
  for (const op of eligible) {
    for (const trait of op.traits) {
      const lines = DEATH_REACTIONS[trait];
      if (lines && lines.length > 0) {
        candidates.push({ op, lines });
        break; // one entry per survivor
      }
    }
  }

  if (candidates.length === 0) return null;

  const chosen = pick(candidates);
  return { opName: chosen.op.name, text: pick(chosen.lines) };
}

// =============================================================================
// 6. getDecisionEcho(missionId, decisionHistory)
// Returns array of { sender, text } or empty array.
// Surfaces echoes of past decisions when relevant to the current mission.
// =============================================================================

export function getDecisionEcho(missionId, decisionHistory) {
  const results = [];

  for (const [effectKey, echo] of Object.entries(DECISION_ECHOES)) {
    // Check this echo is eligible for the current mission.
    if (!echo.missions.includes(missionId)) continue;

    // Check the player actually made this decision in some prior mission.
    // decisionHistory values are mission ids where the decision was taken.
    const wasChosen = Object.values(decisionHistory).includes(effectKey) ||
      Object.keys(decisionHistory).includes(effectKey);

    if (!wasChosen) continue;

    // Pick a random line from this echo.
    const rawLine = pick(echo.lines);
    results.push(parseSender(rawLine));
  }

  return results;
}

// =============================================================================
// 7. getEnvFlavor(envId)
// Returns a random atmospheric string for the given environment, or null.
// =============================================================================

export function getEnvFlavor(envId) {
  const lines = ENV_FLAVOR[envId];
  if (!lines || lines.length === 0) return null;
  return pick(lines);
}

// =============================================================================
// 8. getInlineStory(missionId, triggerPoint, encounterNum)
// Returns array of { sender, text } or empty array.
// =============================================================================

export function getInlineStory(missionId, triggerPoint, encounterNum) {
  const missionData = INLINE_STORY[missionId];
  if (!missionData) return [];

  if (triggerPoint === 'preEncounter') {
    return missionData.preEncounter || [];
  }

  if (triggerPoint === 'betweenEncounter') {
    const entries = missionData.betweenEncounter || [];
    return entries.filter((e) => e.after <= encounterNum);
  }

  return [];
}

// =============================================================================
// Internal helpers
// =============================================================================

// Parse "Sender: text" formatted lines into { sender, text }.
// If no prefix is found, uses the raw line as text with an empty sender.
function parseSender(line) {
  const colonIdx = line.indexOf(':');
  if (colonIdx > 0 && colonIdx < 30) {
    return {
      sender: line.slice(0, colonIdx).trim(),
      text: line.slice(colonIdx + 1).trim(),
    };
  }
  return { sender: '', text: line };
}
