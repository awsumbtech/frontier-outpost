import { describe, it, expect } from 'vitest';
import { computeReputation, getDominantReputation, getReputationCombatModifiers } from '../reputation';

describe('computeReputation', () => {
  it('returns all zeros for empty history', () => {
    expect(computeReputation({})).toEqual({ heroic: 0, ruthless: 0, tactical: 0 });
  });

  it('returns all zeros for null/undefined', () => {
    expect(computeReputation(null)).toEqual({ heroic: 0, ruthless: 0, tactical: 0 });
    expect(computeReputation(undefined)).toEqual({ heroic: 0, ruthless: 0, tactical: 0 });
  });

  it('counts heroic decisions', () => {
    const rep = computeReputation({ rescue: 'm1a', mark: 'm1b', shields: 'm2a' });
    expect(rep.heroic).toBe(3);
    expect(rep.ruthless).toBe(0);
    expect(rep.tactical).toBe(0);
  });

  it('counts ruthless decisions', () => {
    const rep = computeReputation({ pushThrough: 'm1a', quickLoot: 'm1b', overload: 'm2a' });
    expect(rep.heroic).toBe(0);
    expect(rep.ruthless).toBe(3);
    expect(rep.tactical).toBe(0);
  });

  it('counts tactical decisions', () => {
    const rep = computeReputation({ counterAmbush: 'm1a', ambush: 'm1b', jam: 'm2a' });
    expect(rep.heroic).toBe(0);
    expect(rep.ruthless).toBe(0);
    expect(rep.tactical).toBe(3);
  });

  it('handles mixed decisions', () => {
    const rep = computeReputation({ rescue: 'm1a', pushThrough: 'm1b', counterAmbush: 'm2a', mark: 'm2b' });
    expect(rep.heroic).toBe(2);
    expect(rep.ruthless).toBe(1);
    expect(rep.tactical).toBe(1);
  });

  it('ignores decision keys not in any axis', () => {
    const rep = computeReputation({ skip: 'm1a', avoid: 'm1b' });
    expect(rep.heroic).toBe(0);
    expect(rep.ruthless).toBe(0);
    expect(rep.tactical).toBe(0);
  });
});

describe('getDominantReputation', () => {
  it('returns null when all zeros', () => {
    expect(getDominantReputation({ heroic: 0, ruthless: 0, tactical: 0 })).toBeNull();
  });

  it('returns heroic when highest', () => {
    expect(getDominantReputation({ heroic: 3, ruthless: 1, tactical: 2 })).toBe('heroic');
  });

  it('returns ruthless when highest', () => {
    expect(getDominantReputation({ heroic: 1, ruthless: 3, tactical: 2 })).toBe('ruthless');
  });

  it('returns tactical when highest', () => {
    expect(getDominantReputation({ heroic: 1, ruthless: 2, tactical: 3 })).toBe('tactical');
  });

  it('tactical wins ties with heroic and ruthless', () => {
    expect(getDominantReputation({ heroic: 2, ruthless: 2, tactical: 2 })).toBe('tactical');
  });

  it('heroic wins ties over ruthless', () => {
    expect(getDominantReputation({ heroic: 2, ruthless: 2, tactical: 0 })).toBe('heroic');
  });
});

describe('getReputationCombatModifiers', () => {
  it('returns baseline modifiers for no reputation', () => {
    const mods = getReputationCombatModifiers({ heroic: 0, ruthless: 0, tactical: 0 });
    expect(mods.allyDamageBonus).toBe(0);
    expect(mods.enemyDamageBonus).toBe(0);
    expect(mods.lootQualityBonus).toBe(0);
    expect(mods.xpMultiplier).toBe(1.0);
  });

  it('applies heroic bonuses at threshold 2', () => {
    const mods = getReputationCombatModifiers({ heroic: 2, ruthless: 0, tactical: 0 });
    expect(mods.xpMultiplier).toBeCloseTo(1.1);
    expect(mods.ambushChanceReduction).toBeCloseTo(0.15);
  });

  it('applies heroic bonuses at threshold 4', () => {
    const mods = getReputationCombatModifiers({ heroic: 4, ruthless: 0, tactical: 0 });
    expect(mods.xpMultiplier).toBeCloseTo(1.2);
  });

  it('applies ruthless bonuses', () => {
    const mods = getReputationCombatModifiers({ heroic: 0, ruthless: 3, tactical: 0 });
    expect(mods.enemyDamageBonus).toBeCloseTo(0.1);
    expect(mods.lootQualityBonus).toBe(1);
  });

  it('applies tactical bonuses', () => {
    const mods = getReputationCombatModifiers({ heroic: 0, ruthless: 0, tactical: 3 });
    expect(mods.allyDamageBonus).toBeCloseTo(0.05);
  });

  it('stacks modifiers from multiple axes', () => {
    const mods = getReputationCombatModifiers({ heroic: 3, ruthless: 3, tactical: 3 });
    expect(mods.xpMultiplier).toBeCloseTo(1.1);
    expect(mods.enemyDamageBonus).toBeCloseTo(0.1);
    expect(mods.allyDamageBonus).toBeCloseTo(0.05);
    expect(mods.lootQualityBonus).toBe(1);
  });
});
