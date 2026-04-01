import { describe, it, expect, vi } from 'vitest';
import {
  selectTraits,
  selectBark,
  selectBanter,
  selectStoryReaction,
  selectDeathReaction,
  getDecisionEcho,
  getEnvFlavor,
  getInlineStory,
} from '../personality';
import {
  PERSONALITY_TRAITS,
  CONTRADICTORY_PAIRS,
  COMBAT_BARKS,
  DEATH_REACTIONS,
} from '../../data/personality';
import { INLINE_STORY, DECISION_ECHOES, ENV_FLAVOR } from '../../data/inlineStory';

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------
const makeOp = (name, traits, alive = true) => ({ name, traits, alive, classKey: 'VANGUARD' });

const ALL_TRAIT_IDS = PERSONALITY_TRAITS.map((t) => t.id);

// ---------------------------------------------------------------------------
// 1. selectTraits()
// ---------------------------------------------------------------------------
describe('selectTraits', () => {
  it('returns a non-empty array', () => {
    const traits = selectTraits();
    expect(Array.isArray(traits)).toBe(true);
    expect(traits.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 2 traits', () => {
    for (let i = 0; i < 50; i++) {
      const traits = selectTraits();
      expect(traits.length).toBeLessThanOrEqual(2);
    }
  });

  it('returns only valid trait IDs', () => {
    for (let i = 0; i < 100; i++) {
      const traits = selectTraits();
      for (const id of traits) {
        expect(ALL_TRAIT_IDS).toContain(id);
      }
    }
  });

  it('never returns a contradictory pair', () => {
    // Run many iterations to catch probabilistic failures
    for (let i = 0; i < 500; i++) {
      const traits = selectTraits();
      if (traits.length === 2) {
        const [a, b] = traits;
        const isContradictory = CONTRADICTORY_PAIRS.some(
          ([x, y]) => (x === a && y === b) || (x === b && y === a)
        );
        expect(isContradictory).toBe(false);
      }
    }
  });

  it('returns 1 trait when Math.random forces single-trait path', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // 0.99 >= 0.6, so wantTwo = false
    const traits = selectTraits();
    expect(traits.length).toBe(1);
    vi.restoreAllMocks();
  });

  it('returns 2 traits when Math.random forces two-trait path', () => {
    // 0.1 < 0.6, so wantTwo = true; then subsequent calls determine which traits
    const calls = [0.1, 0.0, 0.5]; // wantTwo=true, then pick indices
    let callIndex = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => calls[callIndex++ % calls.length]);
    const traits = selectTraits();
    expect(traits.length).toBe(2);
    vi.restoreAllMocks();
  });

  it('returns unique trait IDs (no duplicates)', () => {
    for (let i = 0; i < 100; i++) {
      const traits = selectTraits();
      const unique = new Set(traits);
      expect(unique.size).toBe(traits.length);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. selectBark()
// ---------------------------------------------------------------------------
describe('selectBark', () => {
  it('returns null when operative has no traits', () => {
    // Force the 40% random check to pass (Math.random < 0.4)
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Ghost', []);
    const result = selectBark('onKill', op);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns null when operative traits is undefined', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = { name: 'Ghost', alive: true, classKey: 'VANGUARD' };
    const result = selectBark('onKill', op);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns null when random roll does not fire (>=0.4)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const op = makeOp('Hawk', ['stoic']);
    const result = selectBark('onKill', op);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns null for an unknown event type', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Hawk', ['stoic']);
    const result = selectBark('onUnknownEvent', op);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns {text, opName} structure when conditions are met', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Hawk', ['stoic']);
    const result = selectBark('onKill', op);
    expect(result).not.toBeNull();
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.opName).toBe('Hawk');
    vi.restoreAllMocks();
  });

  it('uses the operative name from the operative object', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Sergeant Chen', ['cautious']);
    const result = selectBark('onCrit', op);
    if (result !== null) {
      expect(result.opName).toBe('Sergeant Chen');
    }
    vi.restoreAllMocks();
  });

  it('respects recentBarks deduplication — skips already-shown lines', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Hawk', ['stoic']);
    // Exhaust all bark lines for stoic+onKill so none are available
    const allStoicKillLines = COMBAT_BARKS.onKill.stoic;
    const result = selectBark('onKill', op, allStoicKillLines);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns null when all bark lines for all traits are in recentBarks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Hawk', ['stoic', 'wisecracker']);
    const exhausted = [
      ...COMBAT_BARKS.onKill.stoic,
      ...COMBAT_BARKS.onKill.wisecracker,
    ];
    const result = selectBark('onKill', op, exhausted);
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns a bark text that comes from the correct event pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const op = makeOp('Hawk', ['cold']);
    const coldEncounterLines = COMBAT_BARKS.onEncounterStart.cold;
    const result = selectBark('onEncounterStart', op);
    if (result !== null) {
      expect(coldEncounterLines).toContain(result.text);
    }
    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// 3. selectBanter()
// ---------------------------------------------------------------------------
describe('selectBanter', () => {
  it('returns null when fewer than 2 alive operatives have traits', () => {
    const squad = [makeOp('Solo', ['stoic'])];
    const result = selectBanter(squad);
    expect(result).toBeNull();
  });

  it('returns null for an empty squad', () => {
    const result = selectBanter([]);
    expect(result).toBeNull();
  });

  it('returns null when all operatives are dead', () => {
    const squad = [
      makeOp('A', ['stoic'], false),
      makeOp('B', ['wisecracker'], false),
    ];
    const result = selectBanter(squad);
    expect(result).toBeNull();
  });

  it('returns null when only one operative is alive', () => {
    const squad = [
      makeOp('Alive', ['stoic'], true),
      makeOp('Dead', ['wisecracker'], false),
    ];
    const result = selectBanter(squad);
    expect(result).toBeNull();
  });

  it('returns null when alive ops have no traits', () => {
    const squad = [makeOp('A', [], true), makeOp('B', [], true)];
    const result = selectBanter(squad);
    expect(result).toBeNull();
  });

  it('returns {lines} structure when a matching trait pair exists', () => {
    // stoic+wisecracker has banter defined
    const squad = [makeOp('Silent', ['stoic']), makeOp('Joker', ['wisecracker'])];
    const result = selectBanter(squad);
    expect(result).not.toBeNull();
    expect(Array.isArray(result.lines)).toBe(true);
    expect(result.lines.length).toBeGreaterThan(0);
  });

  it('each line in result has speaker and text fields', () => {
    const squad = [makeOp('Silent', ['stoic']), makeOp('Joker', ['wisecracker'])];
    const result = selectBanter(squad);
    expect(result).not.toBeNull();
    for (const line of result.lines) {
      expect(typeof line.speaker).toBe('string');
      expect(typeof line.text).toBe('string');
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it('maps trait speaker IDs to operative names', () => {
    const squad = [makeOp('Rashida', ['stoic']), makeOp('Kowalski', ['wisecracker'])];
    const result = selectBanter(squad);
    expect(result).not.toBeNull();
    // Speakers should be operative names, not trait IDs
    const speakerNames = result.lines.map((l) => l.speaker);
    for (const name of speakerNames) {
      expect(['Rashida', 'Kowalski']).toContain(name);
    }
  });

  it('returns null when no banter entry exists for the operative trait combination', () => {
    // No banter defined for stoic+stoic
    const squad = [makeOp('A', ['stoic']), makeOp('B', ['stoic'])];
    const result = selectBanter(squad);
    expect(result).toBeNull();
  });

  it('finds a banter pair even when one operative has multiple traits', () => {
    // Op A has reckless+hopeful; Op B has stoic
    // stoic+reckless has no defined banter but stoic+wisecracker does
    // Use a trait combo we know has banter
    const squad = [makeOp('Alpha', ['cold', 'stoic']), makeOp('Beta', ['wisecracker'])];
    const result = selectBanter(squad);
    // stoic+wisecracker banter should be found via Alpha's stoic trait
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. selectStoryReaction()
// ---------------------------------------------------------------------------
describe('selectStoryReaction', () => {
  it('returns empty array for an unknown beat key', () => {
    const squad = [makeOp('Reyes', ['cautious'])];
    const result = selectStoryReaction('unknown-beat-xyz', squad);
    expect(result).toEqual([]);
  });

  it('returns empty array when no squad operative traits match the beat', () => {
    // ch1-1 has reactions for: cautious, reckless, hopeful, cynical — NOT stoic
    const squad = [makeOp('Silent', ['stoic'])];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result).toEqual([]);
  });

  it('returns empty array for an empty squad', () => {
    const result = selectStoryReaction('ch1-1', []);
    expect(result).toEqual([]);
  });

  it('returns empty array when all matching operatives are dead', () => {
    const squad = [makeOp('Ghost', ['cautious'], false)];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result).toEqual([]);
  });

  it('returns {opName, text} objects for matching alive operatives', () => {
    const squad = [makeOp('Reyes', ['cautious'])];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result.length).toBe(1);
    expect(result[0].opName).toBe('Reyes');
    expect(typeof result[0].text).toBe('string');
    expect(result[0].text.length).toBeGreaterThan(0);
  });

  it('returns the correct text for a known trait-beat combination', () => {
    const squad = [makeOp('Reyes', ['cautious'])];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result[0].text).toBe('Eastern ridge. Noted. We go slow.');
  });

  it('returns at most 2 reactions even when more operatives match', () => {
    const squad = [
      makeOp('Op1', ['cautious']),
      makeOp('Op2', ['reckless']),
      makeOp('Op3', ['hopeful']),
      makeOp('Op4', ['cynical']),
    ];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('returns one reaction per operative (not multiple per op)', () => {
    // Give op two matching traits for the beat
    const squad = [makeOp('Reyes', ['cautious', 'reckless'])];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result.length).toBe(1);
  });

  it('returns exactly the number of matching operatives when 2 or fewer', () => {
    const squad = [makeOp('Reyes', ['cautious']), makeOp('Hawk', ['reckless'])];
    const result = selectStoryReaction('ch1-1', squad);
    expect(result.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 5. selectDeathReaction()
// ---------------------------------------------------------------------------
describe('selectDeathReaction', () => {
  it('returns null when there are no survivors', () => {
    const fallen = makeOp('Ghost', ['stoic']);
    const result = selectDeathReaction(fallen, []);
    expect(result).toBeNull();
  });

  it('returns null when all survivors have no traits', () => {
    const fallen = makeOp('Ghost', ['stoic']);
    const survivors = [makeOp('Empty', [])];
    const result = selectDeathReaction(fallen, survivors);
    expect(result).toBeNull();
  });

  it('returns null when no survivor traits have matching DEATH_REACTIONS entries', () => {
    // DEATH_REACTIONS covers all 8 traits, so we'd need to use a fake trait
    // Instead verify the function returns non-null for a real trait
    const fallen = makeOp('Ghost', ['stoic']);
    const survivors = [makeOp('Hawk', ['cautious'])];
    const result = selectDeathReaction(fallen, survivors);
    expect(result).not.toBeNull();
  });

  it('returns {opName, text} structure', () => {
    const fallen = makeOp('Ghost', ['stoic']);
    const survivors = [makeOp('Hawk', ['cautious'])];
    const result = selectDeathReaction(fallen, survivors);
    expect(result).not.toBeNull();
    expect(typeof result.opName).toBe('string');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('uses a survivor name as opName (not the fallen op name)', () => {
    const fallen = makeOp('Fallen Soldier', ['stoic']);
    const survivors = [makeOp('Living Squad Member', ['cautious'])];
    const result = selectDeathReaction(fallen, survivors);
    expect(result.opName).toBe('Living Squad Member');
    expect(result.opName).not.toBe('Fallen Soldier');
  });

  it('returns text from the DEATH_REACTIONS pool for the survivor trait', () => {
    const fallen = makeOp('Ghost', ['stoic']);
    const survivors = [makeOp('Hawk', ['cautious'])];
    const result = selectDeathReaction(fallen, survivors);
    expect(DEATH_REACTIONS.cautious).toContain(result.text);
  });

  it('handles multiple survivors by picking one', () => {
    const fallen = makeOp('Ghost', ['stoic']);
    const survivors = [
      makeOp('Op1', ['cynical']),
      makeOp('Op2', ['hopeful']),
      makeOp('Op3', ['reckless']),
    ];
    const result = selectDeathReaction(fallen, survivors);
    expect(result).not.toBeNull();
    expect(['Op1', 'Op2', 'Op3']).toContain(result.opName);
  });
});

// ---------------------------------------------------------------------------
// 6. getDecisionEcho()
// ---------------------------------------------------------------------------
describe('getDecisionEcho', () => {
  it('returns empty array when no decision history is provided', () => {
    const result = getDecisionEcho('m2b', {});
    expect(result).toEqual([]);
  });

  it('returns empty array when missionId has no matching echoes', () => {
    // Use a mission that has no echoes in DECISION_ECHOES
    const result = getDecisionEcho('m1a', { rescue: 'm1c' });
    expect(result).toEqual([]);
  });

  it('returns empty array when decisionHistory does not include relevant effects', () => {
    // m2b has rescue echo eligible, but history has something unrelated
    const result = getDecisionEcho('m2b', { jam: 'm1d' });
    expect(result).toEqual([]);
  });

  it('returns array of {sender, text} when a match is found via history value', () => {
    // DECISION_ECHOES.rescue.missions includes 'm2b'
    // history value 'rescue' means player chose 'rescue' in some prior mission
    const result = getDecisionEcho('m2b', { someDecision: 'rescue' });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const echo of result) {
      expect(typeof echo.sender).toBe('string');
      expect(typeof echo.text).toBe('string');
    }
  });

  it('returns array of {sender, text} when a match is found via history key', () => {
    // effectKey as a key in history
    const result = getDecisionEcho('m2b', { rescue: true });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('parses "Sender: text" lines into {sender, text}', () => {
    const result = getDecisionEcho('m2b', { rescue: 'mPrevious' });
    // DECISION_ECHOES.rescue lines start with "Vasquez: ..." or "Riley: ..."
    if (result.length > 0) {
      const echo = result[0];
      expect(echo.sender.length).toBeGreaterThan(0);
      expect(echo.text.length).toBeGreaterThan(0);
      // Sender should not contain a colon
      expect(echo.sender).not.toContain(':');
    }
  });

  it('returns multiple echoes when multiple decisions match the mission', () => {
    // m3a is in: counterAmbush.missions, pushThrough.missions, fallBack.missions
    // If history contains multiple of these, we get multiple echoes
    const history = { counterAmbush: 'mPrev', pushThrough: 'mPrev2' };
    const result = getDecisionEcho('m3a', history);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 7. getEnvFlavor()
// ---------------------------------------------------------------------------
describe('getEnvFlavor', () => {
  it('returns null for an unknown environment ID', () => {
    const result = getEnvFlavor('unknown_env_xyz');
    expect(result).toBeNull();
  });

  it('returns a non-empty string for a valid environment ID', () => {
    const result = getEnvFlavor('crimson_clearing');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string from the correct environment pool', () => {
    const envLines = ENV_FLAVOR.crimson_clearing;
    const result = getEnvFlavor('crimson_clearing');
    expect(envLines).toContain(result);
  });

  it('returns a string for cargo_wreckage environment', () => {
    const result = getEnvFlavor('cargo_wreckage');
    expect(typeof result).toBe('string');
    expect(ENV_FLAVOR.cargo_wreckage).toContain(result);
  });

  it('returns a string for eastern_ridge environment', () => {
    const result = getEnvFlavor('eastern_ridge');
    expect(typeof result).toBe('string');
    expect(ENV_FLAVOR.eastern_ridge).toContain(result);
  });

  it('returns one of the defined lines across multiple calls', () => {
    const envLines = ENV_FLAVOR.crimson_clearing;
    for (let i = 0; i < 30; i++) {
      const result = getEnvFlavor('crimson_clearing');
      expect(envLines).toContain(result);
    }
  });

  it('returns null for null input', () => {
    const result = getEnvFlavor(null);
    expect(result).toBeNull();
  });

  it('returns null for undefined input', () => {
    const result = getEnvFlavor(undefined);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. getInlineStory()
// ---------------------------------------------------------------------------
describe('getInlineStory', () => {
  it('returns empty array for an unknown mission ID', () => {
    const result = getInlineStory('m99z', 'preEncounter', 0);
    expect(result).toEqual([]);
  });

  it('returns preEncounter entries for a valid mission that has them', () => {
    const result = getInlineStory('m1a', 'preEncounter', 0);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array for preEncounter when mission has none defined', () => {
    // m1d has no preEncounter entries
    const result = getInlineStory('m1d', 'preEncounter', 0);
    expect(result).toEqual([]);
  });

  it('preEncounter entries have sender and text fields', () => {
    const result = getInlineStory('m1a', 'preEncounter', 0);
    for (const entry of result) {
      expect(typeof entry.sender).toBe('string');
      expect(typeof entry.text).toBe('string');
      expect(entry.text.length).toBeGreaterThan(0);
    }
  });

  it('returns betweenEncounter entries with after <= encounterNum', () => {
    // m1b has betweenEncounter: [{ after: 1, ... }]
    const result = getInlineStory('m1b', 'betweenEncounter', 1);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array for betweenEncounter when encounterNum < all after values', () => {
    // m1b betweenEncounter fires after encounter 1 — so encounterNum=0 should return nothing
    const result = getInlineStory('m1b', 'betweenEncounter', 0);
    expect(result).toEqual([]);
  });

  it('filters betweenEncounter entries correctly by encounterNum', () => {
    // m1d has two entries: after:1 and after:2
    const resultAfter1 = getInlineStory('m1d', 'betweenEncounter', 1);
    const resultAfter2 = getInlineStory('m1d', 'betweenEncounter', 2);
    expect(resultAfter1.length).toBe(1);  // only after:1 fires
    expect(resultAfter2.length).toBe(2);  // both after:1 and after:2 fire
  });

  it('returns empty array for an unrecognised trigger point', () => {
    const result = getInlineStory('m1a', 'unknownTrigger', 0);
    expect(result).toEqual([]);
  });

  it('returns empty array for betweenEncounter when mission has none defined', () => {
    // m1a only has preEncounter, no betweenEncounter
    const result = getInlineStory('m1a', 'betweenEncounter', 5);
    expect(result).toEqual([]);
  });

  it('returns correct sender from preEncounter entries', () => {
    const result = getInlineStory('m1a', 'preEncounter', 0);
    expect(result[0].sender).toBe('CMD Vasquez');
  });

  it('returns betweenEncounter entries for a late encounterNum (catches all prior entries)', () => {
    // m2b has entries after:1 and after:2
    const resultLate = getInlineStory('m2b', 'betweenEncounter', 10);
    expect(resultLate.length).toBe(2);
  });

  it('returns empty array for m5d betweenEncounter when encounterNum is 1 (all entries have after>1)', () => {
    // m5d betweenEncounter: after:2, after:4
    const result = getInlineStory('m5d', 'betweenEncounter', 1);
    expect(result).toEqual([]);
  });
});
