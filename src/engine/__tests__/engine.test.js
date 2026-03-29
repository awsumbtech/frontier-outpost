import { describe, it, expect, vi } from 'vitest';
import { rng, pick, uid, rollRarity } from '../utils';
import { generateGear } from '../gear';
import { createOperative, getEffectiveStats, xpForLevel } from '../operatives';
import { generateEncounter, combatRound } from '../combat';
import { RARITY } from '../../data/constants';

describe('utils', () => {
  it('rng returns value within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = rng(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('rng works with negative ranges', () => {
    const val = rng(-5, 5);
    expect(val).toBeGreaterThanOrEqual(-5);
    expect(val).toBeLessThanOrEqual(5);
  });

  it('pick returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(pick(arr));
    }
  });

  it('uid returns a string of expected length', () => {
    const id = uid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(id.length).toBeLessThanOrEqual(8);
  });

  it('uid generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });

  it('rollRarity returns a valid rarity level', () => {
    for (let i = 0; i < 100; i++) {
      const r = rollRarity();
      expect(r).toBeGreaterThanOrEqual(RARITY.COMMON);
      expect(r).toBeLessThanOrEqual(RARITY.PROTOTYPE);
    }
  });

  it('rollRarity with high luck skews toward higher rarities', () => {
    let highCount = 0;
    for (let i = 0; i < 200; i++) {
      if (rollRarity(50) >= RARITY.RARE) highCount++;
    }
    // With +50 luck, should get RARE+ most of the time
    expect(highCount).toBeGreaterThan(100);
  });
});

describe('generateGear', () => {
  it('generates a weapon with required fields', () => {
    const weapon = generateGear('weapon', 'VANGUARD', 1);
    expect(weapon.type).toBe('weapon');
    expect(weapon.classKey).toBe('VANGUARD');
    expect(weapon.id).toBeTruthy();
    expect(weapon.name).toBeTruthy();
    expect(weapon.rarity).toBeGreaterThanOrEqual(0);
    expect(weapon.stats.damage).toBeGreaterThan(0);
    expect(weapon.stats.crit).toBeDefined();
    expect(weapon.mods).toEqual([]);
  });

  it('generates armor with null classKey (universal)', () => {
    const armor = generateGear('armor', 'RECON', 1);
    expect(armor.type).toBe('armor');
    expect(armor.classKey).toBeNull();
    expect(armor.stats.armor).toBeGreaterThan(0);
    expect(armor.stats.hp).toBeGreaterThan(0);
  });

  it('generates implant with primary stat', () => {
    const implant = generateGear('implant', 'MEDIC', 1);
    expect(implant.type).toBe('implant');
    expect(implant.classKey).toBeNull();
    expect(Object.keys(implant.stats).length).toBeGreaterThanOrEqual(1);
  });

  it('generates gadget with effect and uses', () => {
    const gadget = generateGear('gadget', 'ENGINEER', 1);
    expect(gadget.type).toBe('gadget');
    expect(gadget.classKey).toBeNull();
    expect(gadget.uses).toBeGreaterThanOrEqual(1);
    expect(Object.keys(gadget.stats).length).toBe(1);
  });

  it('higher level gear has higher stat values on average', () => {
    let lowSum = 0, highSum = 0;
    for (let i = 0; i < 100; i++) {
      lowSum += generateGear('weapon', 'RECON', 1).stats.damage;
      highSum += generateGear('weapon', 'RECON', 10).stats.damage;
    }
    expect(highSum / 100).toBeGreaterThan(lowSum / 100);
  });
});

describe('operatives', () => {
  it('createOperative returns valid operative shape', () => {
    const op = createOperative('VANGUARD', 'Test Soldier');
    expect(op.name).toBe('Test Soldier');
    expect(op.classKey).toBe('VANGUARD');
    expect(op.className).toBe('Vanguard');
    expect(op.level).toBe(1);
    expect(op.xp).toBe(0);
    expect(op.skillPoints).toBe(1);
    expect(op.alive).toBe(true);
    expect(op.currentHp).toBe(140); // Vanguard base HP
    expect(op.currentShield).toBe(25); // Vanguard base shield
    expect(op.gear.weapon).toBeNull();
    expect(op.gear.armor).toBeNull();
    expect(op.skills).toEqual({});
  });

  it('getEffectiveStats returns base stats with no gear', () => {
    const op = createOperative('RECON', 'Test Recon');
    const stats = getEffectiveStats(op);
    expect(stats.hp).toBe(65);
    expect(stats.damage).toBe(24);
    expect(stats.speed).toBe(17);
    expect(stats.crit).toBe(20);
  });

  it('getEffectiveStats adds gear bonuses', () => {
    const op = createOperative('VANGUARD', 'Test Tank');
    op.gear.weapon = { stats: { damage: 15, crit: 5 } };
    op.gear.armor = { stats: { armor: 10, hp: 20 } };
    const stats = getEffectiveStats(op);
    expect(stats.damage).toBe(10 + 15); // base + weapon
    expect(stats.crit).toBe(2 + 5); // base + weapon crit
    expect(stats.armor).toBe(18 + 10); // base + armor
    expect(stats.hp).toBe(140 + 20); // base + armor hp
  });

  it('getEffectiveStats adds skill bonuses', () => {
    const op = createOperative('VANGUARD', 'Test Tank');
    op.skills['Fortify'] = true; // +15 Armor, +10 HP
    const stats = getEffectiveStats(op);
    expect(stats.armor).toBe(18 + 15);
    expect(stats.hp).toBe(140 + 10);
  });

  it('xpForLevel scales with level', () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(140);
    expect(xpForLevel(3)).toBeGreaterThan(xpForLevel(2));
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(5));
  });
});

describe('combat', () => {
  it('generateEncounter returns enemies of correct tier', () => {
    const enemies = generateEncounter(1, 0);
    expect(enemies.length).toBeGreaterThanOrEqual(2);
    expect(enemies.length).toBeLessThanOrEqual(3);
    enemies.forEach(e => {
      expect(e.alive).toBe(true);
      expect(e.hp).toBeGreaterThan(0);
      expect(e.maxHp).toBe(e.hp);
      expect(e.tier).toBeLessThanOrEqual(1);
    });
  });

  it('generateEncounter scales enemies by tier and encounter number', () => {
    const e1 = generateEncounter(1, 0);
    const e3 = generateEncounter(3, 3);
    // Tier 3 enemies should have higher HP on average
    const avgHp1 = e1.reduce((s, e) => s + e.hp, 0) / e1.length;
    const avgHp3 = e3.reduce((s, e) => s + e.hp, 0) / e3.length;
    expect(avgHp3).toBeGreaterThan(avgHp1);
  });

  it('combatRound processes without errors', () => {
    const squad = [createOperative('VANGUARD', 'Tank'), createOperative('RECON', 'DPS')];
    const enemies = generateEncounter(1, 0);
    const log = [];
    // Run a round — should not throw
    expect(() => combatRound(squad, enemies, log)).not.toThrow();
    expect(log.length).toBeGreaterThan(0);
  });

  it('combatRound reduces enemy HP', () => {
    const squad = [createOperative('VANGUARD', 'Tank'), createOperative('RECON', 'DPS')];
    const enemies = generateEncounter(1, 0);
    const initialTotalHp = enemies.reduce((s, e) => s + e.hp, 0);
    const log = [];
    combatRound(squad, enemies, log);
    const finalTotalHp = enemies.filter(e => e.alive).reduce((s, e) => s + e.hp, 0);
    expect(finalTotalHp).toBeLessThan(initialTotalHp);
  });

  it('damage formula: min 1 damage after armor reduction', () => {
    // Verify via GAME_BALANCE.md: finalDmg = max(1, baseDmg - floor(effectiveArmor * 0.4))
    // A low-damage attacker vs high-armor target should still do at least 1
    const squad = [createOperative('MEDIC', 'Healer')]; // 8 base damage
    const enemies = [{ id: 'test', name: 'Tank', hp: 999, maxHp: 999, armor: 100, damage: 5, speed: 1, alive: true, stunned: false, bleed: 0, tier: 1 }];
    const log = [];
    combatRound(squad, enemies, log);
    // Enemy should have taken at least 1 damage
    expect(enemies[0].hp).toBeLessThan(999);
  });
});
