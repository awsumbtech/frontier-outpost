import { describe, it, expect } from 'vitest';
import { getReadIntel, getIntelForMission, hasUnreadIntelForMission, getIntelCombatModifiers } from '../intel';

describe('getReadIntel', () => {
  it('returns empty for no read beats', () => {
    expect(getReadIntel({})).toEqual([]);
  });

  it('returns empty for null', () => {
    expect(getReadIntel(null)).toEqual([]);
  });

  it('returns intel from read beats that have intel', () => {
    // ch1 beat at:2 has weakness intel for Spore Beast
    const read = { 'ch1-2': true };
    const intel = getReadIntel(read);
    expect(intel.length).toBe(1);
    expect(intel[0].type).toBe('weakness');
    expect(intel[0].targets).toContain('Spore Beast');
  });

  it('ignores read beats without intel', () => {
    // ch1 beat at:1 has no intel
    const read = { 'ch1-1': true };
    expect(getReadIntel(read)).toEqual([]);
  });

  it('returns multiple intel from multiple read beats', () => {
    const read = { 'ch1-2': true, 'ch2-5': true, 'ch2-6': true };
    const intel = getReadIntel(read);
    expect(intel.length).toBe(3);
    const types = intel.map(i => i.type);
    expect(types).toContain('weakness');
    expect(types).toContain('ambush');
  });
});

describe('getIntelForMission', () => {
  it('returns only intel relevant to the specified mission', () => {
    const read = { 'ch1-2': true, 'ch2-5': true };
    // ch1-2 intel applies to m1c, m1d, m2a
    const intel = getIntelForMission('m1c', read);
    expect(intel.length).toBe(1);
    expect(intel[0].targets).toContain('Spore Beast');
  });

  it('returns empty for missions with no relevant intel', () => {
    const read = { 'ch1-2': true };
    // ch1-2 intel applies to m1c, m1d, m2a — not m5d
    expect(getIntelForMission('m5a', read)).toEqual([]);
  });

  it('returns multiple intel when applicable', () => {
    const read = { 'ch2-5': true, 'ch2-6': true };
    // Both ch2-5 and ch2-6 intel apply to m2c and m2d
    const intel = getIntelForMission('m2d', read);
    expect(intel.length).toBe(2);
  });
});

describe('hasUnreadIntelForMission', () => {
  it('returns false when all intel is read', () => {
    const read = { 'ch1-2': true };
    // m1c has intel from ch1-2, which is read
    expect(hasUnreadIntelForMission('m1c', read, 5)).toBe(false);
  });

  it('returns true when relevant intel is unread', () => {
    // ch1-2 has intel for m1c, but beat at:2 is unlocked when missionsCompleted >= 2
    expect(hasUnreadIntelForMission('m1c', {}, 5)).toBe(true);
  });

  it('returns false when intel beat is not yet unlocked', () => {
    // ch1-2 at:2, missionsCompleted=1 means beat not yet available
    expect(hasUnreadIntelForMission('m1c', {}, 1)).toBe(false);
  });

  it('returns false for missions with no relevant intel', () => {
    expect(hasUnreadIntelForMission('m1a', {}, 5)).toBe(false);
  });
});

describe('getIntelCombatModifiers', () => {
  it('returns empty modifiers when no intel', () => {
    const mods = getIntelCombatModifiers('m1a', {});
    expect(mods.damageBonus).toEqual({});
    expect(mods.combatLogEntries).toEqual([]);
    expect(mods.ambushUpgrade).toBe(false);
    expect(mods.cacheBonus).toBe(false);
    expect(mods.reinforcementWarning).toBe(false);
  });

  it('returns weakness damage bonus for matching intel', () => {
    const read = { 'ch1-2': true }; // weakness intel for Spore Beast
    const mods = getIntelCombatModifiers('m1c', read);
    expect(mods.damageBonus['Spore Beast']).toBeCloseTo(0.2);
    expect(mods.combatLogEntries.length).toBe(1);
    expect(mods.combatLogEntries[0].type).toBe('intel');
  });

  it('returns ambush upgrade for ambush intel', () => {
    const read = { 'ch2-6': true }; // ambush intel
    const mods = getIntelCombatModifiers('m2c', read);
    expect(mods.ambushUpgrade).toBe(true);
  });

  it('returns cache bonus for cache intel', () => {
    const read = { 'ch3-9': true }; // cache intel
    const mods = getIntelCombatModifiers('m3a', read);
    expect(mods.cacheBonus).toBe(true);
  });

  it('returns reinforcement warning for reinforcement intel', () => {
    const read = { 'ch3-11': true }; // reinforcement intel
    const mods = getIntelCombatModifiers('m3c', read);
    expect(mods.reinforcementWarning).toBe(true);
  });

  it('combines multiple intel types', () => {
    const read = { 'ch2-5': true, 'ch2-6': true }; // weakness + ambush
    const mods = getIntelCombatModifiers('m2c', read);
    expect(Object.keys(mods.damageBonus).length).toBeGreaterThan(0);
    expect(mods.ambushUpgrade).toBe(true);
    expect(mods.combatLogEntries.length).toBe(2);
  });
});
