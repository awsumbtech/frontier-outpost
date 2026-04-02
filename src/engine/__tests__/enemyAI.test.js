import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  selectEnemyTarget,
  getBossPhaseModifiers,
  executeEnemyTurn,
} from '../combat';
import { createOperative } from '../operatives';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Create a real operative using createOperative so that getEffectiveStats
 * works (requires baseStats + gear). Apply overrides on top.
 *
 * classKey defaults to 'VANGUARD' unless overridden. The `armor` and `damage`
 * overrides are placed into baseStats so getEffectiveStats reflects them.
 */
function makeAlly(overrides = {}) {
  const { classKey = 'VANGUARD', id, damage, armor, ...rest } = overrides;
  const op = createOperative(classKey, 'Test Op');
  op.activeEffects = [];
  op.defending = false;

  // Allow callers to override base combat stats directly
  if (damage !== undefined) op.baseStats.damage = damage;
  if (armor  !== undefined) op.baseStats.armor  = armor;

  // Apply remaining overrides at top level.
  // currentShield defaults to 0 so shield absorption doesn't silently eat
  // damage in tests that don't explicitly set a shield value.
  return { ...op, currentShield: 0, ...(id ? { id } : {}), ...rest };
}

function makeEnemy(overrides = {}) {
  return {
    id: 'e1',
    name: 'Test Enemy',
    hp: 50,
    maxHp: 50,
    armor: 5,
    damage: 10,
    speed: 8,
    alive: true,
    stunned: false,
    bleed: 0,
    tier: 1,
    aiProfile: 'aggro',
    activeEffects: [],
    ...overrides,
  };
}

// ─── selectEnemyTarget — aggro profile ───────────────────────────────────────

describe('selectEnemyTarget — aggro profile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('targets the ally with the lowest currentHp', () => {
    const enemy = makeEnemy({ aiProfile: 'aggro' });
    const highHp = makeAlly({ id: 'op1', currentHp: 90 });
    const lowHp  = makeAlly({ id: 'op2', currentHp: 20 });
    const midHp  = makeAlly({ id: 'op3', currentHp: 60 });

    // Ensure taunt path is not taken (Math.random > 0.7)
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const target = selectEnemyTarget(enemy, [highHp, lowHp, midHp], [enemy]);
    expect(target.id).toBe('op2');
  });

  it('picks the lowest HP taunter when taunters exist and Math.random <= 0.7', () => {
    const enemy = makeEnemy({ aiProfile: 'aggro' });
    const taunterHighHp = makeAlly({
      id: 'taunt-high',
      currentHp: 80,
      activeEffects: [{ id: 'tauntEffect', type: 'buff', stat: 'taunt', modifier: 1.0, remainingRounds: 2 }],
    });
    const taunterLowHp = makeAlly({
      id: 'taunt-low',
      currentHp: 30,
      activeEffects: [{ id: 'tauntEffect', type: 'buff', stat: 'taunt', modifier: 1.0, remainingRounds: 2 }],
    });
    const nonTaunter = makeAlly({ id: 'normal', currentHp: 10 }); // lowest HP but no taunt

    vi.spyOn(Math, 'random').mockReturnValue(0.5); // <= 0.7 → respect taunt

    const target = selectEnemyTarget(enemy, [taunterHighHp, taunterLowHp, nonTaunter], [enemy]);
    expect(target.id).toBe('taunt-low');
  });

  it('ignores taunt and picks lowest HP overall when Math.random > 0.7', () => {
    const enemy = makeEnemy({ aiProfile: 'aggro' });
    const taunter = makeAlly({
      id: 'taunter',
      currentHp: 80,
      activeEffects: [{ id: 'tauntEffect', type: 'buff', stat: 'taunt', modifier: 1.0, remainingRounds: 2 }],
    });
    const nonTaunterLowest = makeAlly({ id: 'lowest', currentHp: 10 });

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // > 0.7 → ignore taunt

    const target = selectEnemyTarget(enemy, [taunter, nonTaunterLowest], [enemy]);
    expect(target.id).toBe('lowest');
  });

  it('does not crash when all allies have equal HP', () => {
    const enemy = makeEnemy({ aiProfile: 'aggro' });
    const allies = [
      makeAlly({ id: 'op1', currentHp: 50 }),
      makeAlly({ id: 'op2', currentHp: 50 }),
      makeAlly({ id: 'op3', currentHp: 50 }),
    ];
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    expect(() => selectEnemyTarget(enemy, allies, [enemy])).not.toThrow();
  });

  it('returns the only ally when exactly one is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'aggro' });
    const solo = makeAlly({ id: 'solo', currentHp: 5 });
    const target = selectEnemyTarget(enemy, [solo], [enemy]);
    expect(target.id).toBe('solo');
  });
});

// ─── selectEnemyTarget — tactical profile ────────────────────────────────────

describe('selectEnemyTarget — tactical profile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('targets the ally with the highest effective damage', () => {
    const enemy = makeEnemy({ aiProfile: 'tactical' });
    const lowDmg  = makeAlly({ id: 'low',  damage: 8 });
    const highDmg = makeAlly({ id: 'high', damage: 25 });
    const midDmg  = makeAlly({ id: 'mid',  damage: 15 });

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, [lowDmg, highDmg, midDmg], [enemy]);
    expect(target.id).toBe('high');
  });

  it('skips defending targets when non-defending options exist', () => {
    const enemy = makeEnemy({ aiProfile: 'tactical' });
    const defending = makeAlly({ id: 'def', damage: 30, defending: true });
    const notDefending = makeAlly({ id: 'atk', damage: 20, defending: false });

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, [defending, notDefending], [enemy]);
    expect(target.id).toBe('atk');
  });

  it('falls back to highest damage ally even when all are defending', () => {
    const enemy = makeEnemy({ aiProfile: 'tactical' });
    const allDefending = [
      makeAlly({ id: 'low',  damage: 8,  defending: true }),
      makeAlly({ id: 'high', damage: 25, defending: true }),
    ];

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, allDefending, [enemy]);
    expect(target.id).toBe('high');
  });

  it('returns the only ally when exactly one is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'tactical' });
    const solo = makeAlly({ id: 'solo' });
    const target = selectEnemyTarget(enemy, [solo], [enemy]);
    expect(target.id).toBe('solo');
  });
});

// ─── selectEnemyTarget — support profile ─────────────────────────────────────

describe('selectEnemyTarget — support profile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('targets the Medic when one is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'support' });
    const medic   = makeAlly({ id: 'doc',    className: 'Medic', armor: 15 });
    const soldier = makeAlly({ id: 'grunt',  className: 'Vanguard', armor: 5 });

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, [soldier, medic], [enemy]);
    expect(target.id).toBe('doc');
  });

  it('targets the ally with the lowest armor when no Medic is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'support' });
    const highArmor = makeAlly({ id: 'tank',   className: 'Vanguard', armor: 20 });
    const lowArmor  = makeAlly({ id: 'scout',  className: 'Scout',    armor: 3  });
    const midArmor  = makeAlly({ id: 'sniper', className: 'Sniper',   armor: 10 });

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, [highArmor, lowArmor, midArmor], [enemy]);
    expect(target.id).toBe('scout');
  });

  it('returns the only ally when exactly one is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'support' });
    const solo = makeAlly({ id: 'solo' });
    const target = selectEnemyTarget(enemy, [solo], [enemy]);
    expect(target.id).toBe('solo');
  });
});

// ─── selectEnemyTarget — tank profile ────────────────────────────────────────

describe('selectEnemyTarget — tank profile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a member of aliveAllies (random selection)', () => {
    const enemy = makeEnemy({ aiProfile: 'tank' });
    const allies = [
      makeAlly({ id: 'op1' }),
      makeAlly({ id: 'op2' }),
      makeAlly({ id: 'op3' }),
    ];
    const ids = new Set(allies.map(a => a.id));

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, allies, [enemy]);
    expect(ids.has(target.id)).toBe(true);
  });

  it('returns the only ally when exactly one is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'tank' });
    const solo = makeAlly({ id: 'solo' });
    const target = selectEnemyTarget(enemy, [solo], [enemy]);
    expect(target.id).toBe('solo');
  });
});

// ─── selectEnemyTarget — assassin profile ────────────────────────────────────

describe('selectEnemyTarget — assassin profile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('targets the ally with the lowest effective armor', () => {
    const enemy = makeEnemy({ aiProfile: 'assassin' });
    const heavyArmor  = makeAlly({ id: 'tank',   armor: 25 });
    const lightArmor  = makeAlly({ id: 'rogue',  armor: 2  });
    const mediumArmor = makeAlly({ id: 'ranger', armor: 12 });

    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt path

    const target = selectEnemyTarget(enemy, [heavyArmor, lightArmor, mediumArmor], [enemy]);
    expect(target.id).toBe('rogue');
  });

  it('returns the only ally when exactly one is alive', () => {
    const enemy = makeEnemy({ aiProfile: 'assassin' });
    const solo = makeAlly({ id: 'solo' });
    const target = selectEnemyTarget(enemy, [solo], [enemy]);
    expect(target.id).toBe('solo');
  });
});

// ─── selectEnemyTarget — default/fallback profile ────────────────────────────

describe('selectEnemyTarget — default/fallback profile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a valid ally when enemy has no aiProfile', () => {
    const enemy = makeEnemy({ aiProfile: undefined });
    const allies = [makeAlly({ id: 'op1' }), makeAlly({ id: 'op2' })];
    const ids = new Set(allies.map(a => a.id));

    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const target = selectEnemyTarget(enemy, allies, [enemy]);
    expect(ids.has(target.id)).toBe(true);
  });

  it('returns a valid ally when enemy has an unknown aiProfile string', () => {
    const enemy = makeEnemy({ aiProfile: 'berserker_unknown' });
    const allies = [makeAlly({ id: 'op1' }), makeAlly({ id: 'op2' })];
    const ids = new Set(allies.map(a => a.id));

    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const target = selectEnemyTarget(enemy, allies, [enemy]);
    expect(ids.has(target.id)).toBe(true);
  });
});

// ─── selectEnemyTarget — single ally edge case (all profiles) ────────────────

describe('selectEnemyTarget — single alive ally with every profile', () => {
  const profiles = ['aggro', 'tactical', 'support', 'tank', 'assassin', 'default'];

  for (const profile of profiles) {
    it(`profile "${profile}": returns the only ally`, () => {
      const enemy = makeEnemy({ aiProfile: profile });
      const solo = makeAlly({ id: 'last-op', currentHp: 1 });
      const target = selectEnemyTarget(enemy, [solo], [enemy]);
      expect(target.id).toBe('last-op');
    });
  }
});

// ─── getBossPhaseModifiers ────────────────────────────────────────────────────

describe('getBossPhaseModifiers', () => {
  const bossPhases = [
    { hpThreshold: 1.0, name: 'normal',    damageModifier: 1.0 },
    { hpThreshold: 0.5, name: 'enraged',   damageModifier: 1.3 },
    { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
  ];

  it('returns null for a non-boss enemy (no bossPhases)', () => {
    const enemy = makeEnemy(); // no bossPhases field
    expect(getBossPhaseModifiers(enemy)).toBeNull();
  });

  it('returns phase "normal" with damageModifier 1.0 at 100% HP', () => {
    const enemy = makeEnemy({ hp: 100, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('normal');
    expect(result.damageModifier).toBe(1.0);
  });

  it('returns phase "enraged" with damageModifier 1.3 at 50% HP (threshold boundary)', () => {
    const enemy = makeEnemy({ hp: 50, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('enraged');
    expect(result.damageModifier).toBe(1.3);
  });

  it('returns phase "enraged" with damageModifier 1.3 at 40% HP', () => {
    const enemy = makeEnemy({ hp: 40, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('enraged');
    expect(result.damageModifier).toBe(1.3);
  });

  it('returns phase "desperate" with damageModifier 1.5 at 20% HP (threshold boundary)', () => {
    const enemy = makeEnemy({ hp: 20, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('desperate');
    expect(result.damageModifier).toBe(1.5);
  });

  it('returns phase "desperate" with damageModifier 1.5 at 10% HP', () => {
    const enemy = makeEnemy({ hp: 10, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('desperate');
    expect(result.damageModifier).toBe(1.5);
  });

  it('uses <= comparison so exactly 50% threshold resolves to "enraged"', () => {
    const enemy = makeEnemy({ hp: 50, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('enraged');
  });

  it('uses <= comparison so exactly 20% threshold resolves to "desperate"', () => {
    const enemy = makeEnemy({ hp: 20, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('desperate');
  });

  it('returns phase "normal" at 51% HP (just above enraged threshold)', () => {
    const enemy = makeEnemy({ hp: 51, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('normal');
  });

  it('returns phase "enraged" at 21% HP (just above desperate threshold)', () => {
    const enemy = makeEnemy({ hp: 21, maxHp: 100, bossPhases });
    const result = getBossPhaseModifiers(enemy);
    expect(result.phase).toBe('enraged');
  });
});

// ─── Integration: executeEnemyTurn uses AI targeting ─────────────────────────

describe('executeEnemyTurn — AI targeting integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aggro enemy targets the lowest HP ally (not the other)', () => {
    // Force evasion check to fail (no dodge) by mocking Math.random consistently
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // > any evasion %, no dodge; > 0.7 so taunt is ignored

    const enemy = makeEnemy({ aiProfile: 'aggro', damage: 10, armor: 0 });
    const weakAlly  = makeAlly({ id: 'weak',   currentHp: 5,  maxHp: 100, armor: 0 });
    const strongAlly = makeAlly({ id: 'strong', currentHp: 90, maxHp: 100, armor: 0 });

    const { squad } = executeEnemyTurn(enemy.id, [weakAlly, strongAlly], [enemy]);

    const weak   = squad.find(o => o.id === 'weak');
    const strong = squad.find(o => o.id === 'strong');

    // The weak ally should have taken damage; the strong ally should be untouched
    expect(weak.currentHp).toBeLessThan(5);
    expect(strong.currentHp).toBe(90);
  });

  it('tactical enemy targets the highest damage ally', () => {
    // No evasion; no taunt path
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const enemy = makeEnemy({ aiProfile: 'tactical', damage: 10, armor: 0 });
    const lowDmgAlly  = makeAlly({ id: 'low',  damage: 5,  currentHp: 100, armor: 0 });
    const highDmgAlly = makeAlly({ id: 'high', damage: 30, currentHp: 100, armor: 0 });

    const { squad } = executeEnemyTurn(enemy.id, [lowDmgAlly, highDmgAlly], [enemy]);

    const low  = squad.find(o => o.id === 'low');
    const high = squad.find(o => o.id === 'high');

    expect(high.currentHp).toBeLessThan(100);
    expect(low.currentHp).toBe(100);
  });

  it('support enemy targets the Medic', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // no taunt, no evasion

    const enemy = makeEnemy({ aiProfile: 'support', damage: 10, armor: 0 });
    const medic   = makeAlly({ id: 'medic',    className: 'Medic',    currentHp: 100, armor: 0 });
    const soldier = makeAlly({ id: 'soldier',  className: 'Vanguard', currentHp: 100, armor: 0 });

    const { squad } = executeEnemyTurn(enemy.id, [soldier, medic], [enemy]);

    const medicResult   = squad.find(o => o.id === 'medic');
    const soldierResult = squad.find(o => o.id === 'soldier');

    expect(medicResult.currentHp).toBeLessThan(100);
    expect(soldierResult.currentHp).toBe(100);
  });
});

// ─── Integration: executeEnemyTurn applies boss phase damage modifier ─────────

describe('executeEnemyTurn — boss phase damage modifier integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper: create a zero-evasion ally so Math.random mocking doesn't cause
   * unexpected dodges. The evasion check is `random * 100 < evasion`; with
   * evasion = 0 this is always false regardless of random value.
   */
  function makeNoEvasionAlly(extraOverrides = {}) {
    const ally = makeAlly({ id: 'op1', currentHp: 200, maxHp: 200, armor: 0, currentShield: 0, ...extraOverrides });
    ally.baseStats.evasion = 0;
    return ally;
  }

  it('normal-phase boss deals base damage when at full HP', () => {
    // Math.random = 0: rng(-2, 3) = -2, dmg = 20 + (-2) = 18.
    // Normal phase modifier 1.0 leaves dmg unchanged.
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const bossPhases = [
      { hpThreshold: 1.0, name: 'normal',    damageModifier: 1.0 },
      { hpThreshold: 0.5, name: 'enraged',   damageModifier: 1.3 },
      { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
    ];
    const boss = makeEnemy({ id: 'boss', hp: 100, maxHp: 100, damage: 20, armor: 0, bossPhases });
    const ally = makeNoEvasionAlly();

    const { squad } = executeEnemyTurn(boss.id, [ally], [boss]);
    const resultAlly = squad.find(o => o.id === 'op1');

    // rng(-2, 3) with random=0: Math.floor(0 * 6) - 2 = -2. dmg = 20 - 2 = 18. No armor, shield, or defend.
    expect(resultAlly.currentHp).toBe(200 - 18);
  });

  it('enraged boss (40% HP) deals ~1.3x damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const bossPhases = [
      { hpThreshold: 1.0, name: 'normal',    damageModifier: 1.0 },
      { hpThreshold: 0.5, name: 'enraged',   damageModifier: 1.3 },
      { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
    ];
    const boss = makeEnemy({ id: 'boss', hp: 40, maxHp: 100, damage: 20, armor: 0, bossPhases });
    const ally = makeNoEvasionAlly();

    const { squad } = executeEnemyTurn(boss.id, [ally], [boss]);
    const resultAlly = squad.find(o => o.id === 'op1');

    // Base dmg = 18. Enraged modifier 1.3 → Math.round(18 * 1.3) = 23.
    expect(resultAlly.currentHp).toBe(200 - 23);
  });

  it('desperate boss (10% HP) deals ~1.5x damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const bossPhases = [
      { hpThreshold: 1.0, name: 'normal',    damageModifier: 1.0 },
      { hpThreshold: 0.5, name: 'enraged',   damageModifier: 1.3 },
      { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
    ];
    const boss = makeEnemy({ id: 'boss', hp: 10, maxHp: 100, damage: 20, armor: 0, bossPhases });
    const ally = makeNoEvasionAlly();

    const { squad } = executeEnemyTurn(boss.id, [ally], [boss]);
    const resultAlly = squad.find(o => o.id === 'op1');

    // Base dmg = 18. Desperate modifier 1.5 → Math.round(18 * 1.5) = 27.
    expect(resultAlly.currentHp).toBe(200 - 27);
  });

  it('non-boss enemy (no bossPhases) applies no phase modifier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const normalEnemy = makeEnemy({ id: 'e1', hp: 50, maxHp: 50, damage: 20, armor: 0 }); // no bossPhases
    const ally = makeNoEvasionAlly();

    const { squad } = executeEnemyTurn(normalEnemy.id, [ally], [normalEnemy]);
    const resultAlly = squad.find(o => o.id === 'op1');

    // Base dmg = 18. No modifier.
    expect(resultAlly.currentHp).toBe(200 - 18);
  });

  it('enraged boss deals more damage than the same boss at normal phase', () => {
    // Relative test: does not depend on precise rng values.
    // Use mockReturnValue(0.5) — mid-range, no edge cases.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const bossPhases = [
      { hpThreshold: 1.0, name: 'normal',    damageModifier: 1.0 },
      { hpThreshold: 0.5, name: 'enraged',   damageModifier: 1.3 },
      { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
    ];

    const normalBoss  = makeEnemy({ id: 'bn', hp: 100, maxHp: 100, damage: 20, armor: 0, bossPhases });
    const enragedBoss = makeEnemy({ id: 'be', hp: 40,  maxHp: 100, damage: 20, armor: 0, bossPhases });

    const allyNormal  = makeNoEvasionAlly({ id: 'a1' });
    const allyEnraged = makeNoEvasionAlly({ id: 'a2' });

    const { squad: sq1 } = executeEnemyTurn(normalBoss.id,  [allyNormal],  [normalBoss]);
    const { squad: sq2 } = executeEnemyTurn(enragedBoss.id, [allyEnraged], [enragedBoss]);

    const damageNormal  = allyNormal.currentHp  - sq1.find(o => o.id === 'a1').currentHp;
    const damageEnraged = allyEnraged.currentHp - sq2.find(o => o.id === 'a2').currentHp;

    expect(damageEnraged).toBeGreaterThan(damageNormal);
  });

  it('desperate boss deals more damage than enraged boss', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const bossPhases = [
      { hpThreshold: 1.0, name: 'normal',    damageModifier: 1.0 },
      { hpThreshold: 0.5, name: 'enraged',   damageModifier: 1.3 },
      { hpThreshold: 0.2, name: 'desperate', damageModifier: 1.5 },
    ];

    const enragedBoss   = makeEnemy({ id: 'be', hp: 40, maxHp: 100, damage: 20, armor: 0, bossPhases });
    const desperateBoss = makeEnemy({ id: 'bd', hp: 10, maxHp: 100, damage: 20, armor: 0, bossPhases });

    const allyEnraged   = makeNoEvasionAlly({ id: 'a1' });
    const allyDesperate = makeNoEvasionAlly({ id: 'a2' });

    const { squad: sq1 } = executeEnemyTurn(enragedBoss.id,   [allyEnraged],   [enragedBoss]);
    const { squad: sq2 } = executeEnemyTurn(desperateBoss.id, [allyDesperate], [desperateBoss]);

    const damageEnraged   = allyEnraged.currentHp   - sq1.find(o => o.id === 'a1').currentHp;
    const damageDesperate = allyDesperate.currentHp - sq2.find(o => o.id === 'a2').currentHp;

    expect(damageDesperate).toBeGreaterThan(damageEnraged);
  });
});

// ─── Integration: executeEnemyTurn respects taunt for aggro profile ───────────

describe('executeEnemyTurn — taunt interaction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aggro enemy targets a taunter when Math.random <= 0.7', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // <= 0.7 → respect taunt; also no evasion (0.5 * 100 = 50, but evasion defaults to 0)

    const enemy = makeEnemy({ aiProfile: 'aggro', damage: 10, armor: 0 });
    const taunter = makeAlly({
      id: 'taunter',
      currentHp: 90,
      maxHp: 100,
      armor: 0,
      activeEffects: [{ id: 'tauntEffect', type: 'buff', stat: 'taunt', modifier: 1.0, remainingRounds: 2 }],
    });
    const lowHpNonTaunter = makeAlly({
      id: 'low-hp',
      currentHp: 5,
      maxHp: 100,
      armor: 0,
    });

    const { squad } = executeEnemyTurn(enemy.id, [taunter, lowHpNonTaunter], [enemy]);

    const taunterResult      = squad.find(o => o.id === 'taunter');
    const lowHpNonTaunterResult = squad.find(o => o.id === 'low-hp');

    // Taunter should have received the attack, not the low-HP non-taunter
    expect(taunterResult.currentHp).toBeLessThan(90);
    expect(lowHpNonTaunterResult.currentHp).toBe(5);
  });
});
