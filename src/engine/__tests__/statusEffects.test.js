import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  applyStatusEffect,
  removeStatusEffect,
  tickStatusEffects,
  getHealingModifier,
  executeAbility,
  getBuffModifiedStats,
  executeEnemyAbility,
  tickEnemyCooldowns,
} from '../combat';
import { createOperative } from '../operatives';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeUnit(overrides = {}) {
  return {
    id: 'unit-1',
    name: 'Test Unit',
    hp: 100,
    maxHp: 100,
    armor: 10,
    damage: 15,
    speed: 5,
    alive: true,
    activeEffects: [],
    ...overrides,
  };
}

function makeAlly(classKey = 'MEDIC', name = 'Doc') {
  const op = createOperative(classKey, name);
  op.activeEffects = [];
  op.currentHp = 100;
  return op;
}

function makeEnemy(overrides = {}) {
  return {
    id: 'enemy-1',
    name: 'Scav Raider',
    hp: 100,
    maxHp: 100,
    armor: 10,
    damage: 15,
    speed: 5,
    alive: true,
    stunned: false,
    bleed: 0,
    tier: 1,
    activeEffects: [],
    ...overrides,
  };
}

// ─── applyStatusEffect ───────────────────────────────────────────────────────

describe('applyStatusEffect', () => {
  it('applies a single bleed stack', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    expect(unit.activeEffects).toHaveLength(1);
    expect(unit.activeEffects[0].id).toBe('bleed');
    expect(unit.activeEffects[0].type).toBe('dot');
    expect(unit.activeEffects[0].remainingRounds).toBe(3);
  });

  it('stacks bleed up to max (3)', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    expect(unit.activeEffects).toHaveLength(3);
    expect(unit.activeEffects.every(e => e.id === 'bleed')).toBe(true);
  });

  it('refreshes oldest bleed duration when at max stacks', () => {
    const unit = makeUnit();
    // Add 3 bleed stacks with different durations
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    unit.activeEffects[0].remainingRounds = 1; // oldest, lowest remaining
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    unit.activeEffects[1].remainingRounds = 2;
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    unit.activeEffects[2].remainingRounds = 3;
    // At max — next apply should refresh oldest (remainingRounds=1) to full duration (3)
    applyStatusEffect(unit, 'bleed', 'attacker-1');
    expect(unit.activeEffects).toHaveLength(3);
    const rounds = unit.activeEffects.map(e => e.remainingRounds).sort((a, b) => a - b);
    expect(rounds).toEqual([2, 3, 3]);
  });

  it('applies poison', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'poison', 'attacker-1');
    expect(unit.activeEffects).toHaveLength(1);
    expect(unit.activeEffects[0].id).toBe('poison');
    expect(unit.activeEffects[0].type).toBe('dot');
    expect(unit.activeEffects[0].damage).toBe(8);
  });

  it('re-applying poison refreshes duration instead of stacking', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'poison', 'attacker-1');
    unit.activeEffects[0].remainingRounds = 1; // simulate worn-down poison
    applyStatusEffect(unit, 'poison', 'attacker-1');
    expect(unit.activeEffects).toHaveLength(1);
    expect(unit.activeEffects[0].remainingRounds).toBe(3); // refreshed to full
  });

  it('applies weaken debuff with stat and modifier', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'weaken', 'attacker-1');
    expect(unit.activeEffects).toHaveLength(1);
    const eff = unit.activeEffects[0];
    expect(eff.id).toBe('weaken');
    expect(eff.type).toBe('debuff');
    expect(eff.stat).toBe('damage');
    expect(eff.modifier).toBe(-0.2);
    expect(eff.remainingRounds).toBe(2);
  });

  it('applies slow debuff', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'slow', 'attacker-1');
    const eff = unit.activeEffects[0];
    expect(eff.id).toBe('slow');
    expect(eff.stat).toBe('speed');
    expect(eff.modifier).toBe(-0.3);
  });

  it('applies fortify buff', () => {
    const unit = makeUnit();
    applyStatusEffect(unit, 'fortify', 'attacker-1');
    const eff = unit.activeEffects[0];
    expect(eff.id).toBe('fortify');
    expect(eff.type).toBe('buff');
    expect(eff.stat).toBe('armor');
    expect(eff.modifier).toBe(0.4);
  });

  it('returns a log message string', () => {
    const unit = makeUnit({ name: 'Mira' });
    const msg = applyStatusEffect(unit, 'weaken', 'Scav Raider');
    expect(typeof msg).toBe('string');
    expect(msg).toContain('Weaken');
    expect(msg).toContain('Mira');
  });

  it('initializes activeEffects if missing', () => {
    const unit = makeUnit();
    delete unit.activeEffects;
    applyStatusEffect(unit, 'slow', 'attacker-1');
    expect(Array.isArray(unit.activeEffects)).toBe(true);
    expect(unit.activeEffects).toHaveLength(1);
  });
});

// ─── removeStatusEffect ──────────────────────────────────────────────────────

describe('removeStatusEffect', () => {
  it('removes a single effect by id', () => {
    const unit = makeUnit({
      activeEffects: [
        { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 }
      ]
    });
    removeStatusEffect(unit, 'weaken');
    expect(unit.activeEffects).toHaveLength(0);
  });

  it('removes all stacked bleed instances', () => {
    const unit = makeUnit({
      activeEffects: [
        { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 3 },
        { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 },
        { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 1 },
      ]
    });
    removeStatusEffect(unit, 'bleed');
    expect(unit.activeEffects).toHaveLength(0);
  });

  it('only removes matching effect, leaves others intact', () => {
    const unit = makeUnit({
      activeEffects: [
        { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 },
        { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 },
      ]
    });
    removeStatusEffect(unit, 'bleed');
    expect(unit.activeEffects).toHaveLength(1);
    expect(unit.activeEffects[0].id).toBe('weaken');
  });

  it('returns a log message string', () => {
    const unit = makeUnit({ name: 'Mira' });
    unit.activeEffects = [{ id: 'slow', type: 'debuff', stat: 'speed', modifier: -0.3, remainingRounds: 2 }];
    const msg = removeStatusEffect(unit, 'slow');
    expect(typeof msg).toBe('string');
    expect(msg.toLowerCase()).toContain('slow');
  });

  it('handles removing a non-existent effect gracefully', () => {
    const unit = makeUnit();
    expect(() => removeStatusEffect(unit, 'bleed')).not.toThrow();
    expect(unit.activeEffects).toHaveLength(0);
  });
});

// ─── tickStatusEffects ───────────────────────────────────────────────────────

describe('tickStatusEffects', () => {
  it('bleed deals 5 damage per stack', () => {
    const unit = makeUnit({ hp: 50 });
    unit.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 3 }
    ];
    tickStatusEffects(unit);
    expect(unit.hp).toBe(45);
  });

  it('multiple bleed stacks each deal 5 damage', () => {
    const unit = makeUnit({ hp: 50 });
    unit.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 3 },
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 },
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 1 },
    ];
    tickStatusEffects(unit);
    expect(unit.hp).toBe(35); // 50 - 15
  });

  it('poison deals 8 damage', () => {
    const unit = makeUnit({ hp: 50 });
    unit.activeEffects = [
      { id: 'poison', type: 'dot', damage: 8, remainingRounds: 3 }
    ];
    tickStatusEffects(unit);
    expect(unit.hp).toBe(42);
  });

  it('hp is clamped to 0 minimum on DoT damage', () => {
    const unit = makeUnit({ hp: 3 });
    unit.activeEffects = [
      { id: 'poison', type: 'dot', damage: 8, remainingRounds: 3 }
    ];
    tickStatusEffects(unit);
    expect(unit.hp).toBe(0);
  });

  it('DoT damage applies to currentHp for ally units', () => {
    const unit = makeUnit({ currentHp: 50, hp: undefined });
    unit.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 }
    ];
    tickStatusEffects(unit);
    expect(unit.currentHp).toBe(45);
  });

  it('durations decrement each tick', () => {
    const unit = makeUnit();
    unit.activeEffects = [
      { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 }
    ];
    tickStatusEffects(unit);
    expect(unit.activeEffects[0].remainingRounds).toBe(1);
  });

  it('expired effects are removed', () => {
    const unit = makeUnit();
    unit.activeEffects = [
      { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 1 }
    ];
    tickStatusEffects(unit);
    expect(unit.activeEffects).toHaveLength(0);
  });

  it('bleed effect expires after last round and is removed', () => {
    const unit = makeUnit({ hp: 50 });
    unit.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 1 }
    ];
    tickStatusEffects(unit);
    expect(unit.hp).toBe(45);
    expect(unit.activeEffects).toHaveLength(0);
  });

  it('returns correct log entries for bleed damage', () => {
    const unit = makeUnit({ name: 'Kira', hp: 50 });
    unit.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 }
    ];
    const { logEntries } = tickStatusEffects(unit);
    const dmgLog = logEntries.find(e => e.text.includes('bleed'));
    expect(dmgLog).toBeDefined();
    expect(dmgLog.text).toContain('Kira');
    expect(dmgLog.text).toContain('5');
    expect(dmgLog.type).toBe('bleed');
  });

  it('returns correct log entries for poison damage', () => {
    const unit = makeUnit({ name: 'Kira', hp: 50 });
    unit.activeEffects = [
      { id: 'poison', type: 'dot', damage: 8, remainingRounds: 2 }
    ];
    const { logEntries } = tickStatusEffects(unit);
    const dmgLog = logEntries.find(e => e.text.includes('poison'));
    expect(dmgLog).toBeDefined();
    expect(dmgLog.text).toContain('Kira');
    expect(dmgLog.text).toContain('8');
    expect(dmgLog.type).toBe('poison');
  });

  it('logs expired effects', () => {
    const unit = makeUnit({ name: 'Mira' });
    unit.activeEffects = [
      { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 1 }
    ];
    const { logEntries } = tickStatusEffects(unit);
    const expiredLog = logEntries.find(e => e.text.toLowerCase().includes('expired'));
    expect(expiredLog).toBeDefined();
    expect(expiredLog.text.toLowerCase()).toContain('weaken');
  });

  it('returns totalDotDamage summing all DoT', () => {
    const unit = makeUnit({ hp: 100 });
    unit.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 },
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 2 },
      { id: 'poison', type: 'dot', damage: 8, remainingRounds: 2 },
    ];
    const { totalDotDamage } = tickStatusEffects(unit);
    expect(totalDotDamage).toBe(18); // 5 + 5 + 8
  });

  it('returns totalDotDamage of 0 when no DoT effects', () => {
    const unit = makeUnit();
    unit.activeEffects = [
      { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 }
    ];
    const { totalDotDamage } = tickStatusEffects(unit);
    expect(totalDotDamage).toBe(0);
  });
});

// ─── getHealingModifier ───────────────────────────────────────────────────────

describe('getHealingModifier', () => {
  it('returns 1.0 when unit has no active effects', () => {
    const unit = makeUnit();
    expect(getHealingModifier(unit)).toBe(1.0);
  });

  it('returns 1.0 when unit has effects but none are poison', () => {
    const unit = makeUnit({
      activeEffects: [
        { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 }
      ]
    });
    expect(getHealingModifier(unit)).toBe(1.0);
  });

  it('returns 0.5 when unit has an active poison effect', () => {
    const unit = makeUnit({
      activeEffects: [
        { id: 'poison', type: 'dot', damage: 8, remainingRounds: 3 }
      ]
    });
    expect(getHealingModifier(unit)).toBe(0.5);
  });

  it('returns 0.5 when poisoned alongside other effects', () => {
    const unit = makeUnit({
      activeEffects: [
        { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 },
        { id: 'poison', type: 'dot', damage: 8, remainingRounds: 1 },
      ]
    });
    expect(getHealingModifier(unit)).toBe(0.5);
  });

  it('handles unit with no activeEffects property', () => {
    const unit = makeUnit();
    delete unit.activeEffects;
    expect(getHealingModifier(unit)).toBe(1.0);
  });
});

// ─── executeAbility heal + poison interaction ────────────────────────────────

describe('executeAbility heal — poison halves healing', () => {
  it('heals full amount when target is not poisoned', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Triage'] = true; // unlocks heal ability
    medic.currentResource = 50;

    const target = makeAlly('VANGUARD', 'Tank');
    const targetStats = { hp: 100 };
    // Set current hp below max so healing is visible
    target.currentHp = 50;

    const squad = [medic, target];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(medic.id, 'heal', target.id, squad, enemies);
    const resultTarget = result.find(o => o.id === target.id);
    const maxHp = resultTarget.currentHp; // will be after heal

    // Full heal = 40% of maxHp. VANGUARD base hp ~70 (from class data)
    // We check that healing happened at all (currentHp > 50)
    expect(resultTarget.currentHp).toBeGreaterThan(50);
  });

  it('heals half amount when target is poisoned', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Triage'] = true;
    medic.currentResource = 50;

    const targetHealthy = makeAlly('VANGUARD', 'Tank');
    targetHealthy.currentHp = 50;

    const targetPoisoned = makeAlly('VANGUARD', 'Tank');
    targetPoisoned.id = 'tank-poisoned';
    targetPoisoned.currentHp = 50;
    targetPoisoned.activeEffects = [
      { id: 'poison', type: 'dot', damage: 8, remainingRounds: 3 }
    ];

    const squad1 = [medic, targetHealthy];
    const squad2 = [{ ...medic, id: medic.id }, targetPoisoned];

    const { squad: resultHealthy } = executeAbility(medic.id, 'heal', targetHealthy.id, squad1, [makeEnemy()]);
    const { squad: resultPoisoned } = executeAbility(medic.id, 'heal', targetPoisoned.id, squad2, [makeEnemy()]);

    const healthyHeal = resultHealthy.find(o => o.id === targetHealthy.id).currentHp - 50;
    const poisonedHeal = resultPoisoned.find(o => o.id === targetPoisoned.id).currentHp - 50;

    // Poisoned target should receive half the healing
    expect(poisonedHeal).toBe(Math.round(healthyHeal / 2));
  });
});

// ─── getBuffModifiedStats — speed and damage debuffs ────────────────────────

describe('getBuffModifiedStats — speed and damage debuffs', () => {
  it('applies slow debuff — reduces speed by 30%', () => {
    const enemy = makeEnemy({ speed: 10 });
    enemy.activeEffects = [
      { id: 'slow', type: 'debuff', stat: 'speed', modifier: -0.3, remainingRounds: 2 }
    ];
    const stats = getBuffModifiedStats(enemy, false);
    expect(stats.speed).toBe(Math.round(10 * 0.7));
  });

  it('applies weaken debuff — reduces damage by 20%', () => {
    const enemy = makeEnemy({ damage: 20 });
    enemy.activeEffects = [
      { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 }
    ];
    const stats = getBuffModifiedStats(enemy, false);
    expect(stats.damage).toBe(Math.round(20 * 0.8));
  });

  it('applies fortify buff — increases armor by 40%', () => {
    const enemy = makeEnemy({ armor: 20 });
    enemy.activeEffects = [
      { id: 'fortify', type: 'buff', stat: 'armor', modifier: 0.4, remainingRounds: 2 }
    ];
    const stats = getBuffModifiedStats(enemy, false);
    expect(stats.armor).toBe(Math.round(20 * 1.4));
  });

  it('applies slow debuff to ally', () => {
    const ally = makeAlly('VANGUARD', 'Tank');
    // VANGUARD base speed = 7 (from class data)
    ally.activeEffects = [
      { id: 'slow', type: 'debuff', stat: 'speed', modifier: -0.3, remainingRounds: 2 }
    ];
    const stats = getBuffModifiedStats(ally, true);
    // Should be 30% reduction from base
    expect(stats.speed).toBeLessThan(7);
  });

  it('stacks multiple stat modifiers', () => {
    const enemy = makeEnemy({ speed: 10, damage: 20 });
    enemy.activeEffects = [
      { id: 'slow', type: 'debuff', stat: 'speed', modifier: -0.3, remainingRounds: 2 },
      { id: 'weaken', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 2 },
    ];
    const stats = getBuffModifiedStats(enemy, false);
    expect(stats.speed).toBe(Math.round(10 * 0.7));
    expect(stats.damage).toBe(Math.round(20 * 0.8));
  });
});

// ─── executeEnemyAbility ─────────────────────────────────────────────────────

function makeEnemyWithAbility(abilityOverrides = {}) {
  return {
    id: 'enemy-1',
    name: 'Scav Raider',
    hp: 100,
    maxHp: 100,
    armor: 5,
    damage: 12,
    speed: 10,
    alive: true,
    stunned: false,
    bleed: 0,
    tier: 1,
    activeEffects: [],
    abilityCooldowns: {},
    abilities: [
      {
        id: 'dirtyFight',
        name: 'Dirty Fight',
        appliesEffect: 'weaken',
        cooldown: 3,
        chance: 0.4,
        targetType: 'enemy',
        ...abilityOverrides,
      },
    ],
  };
}

function makeOperative(overrides = {}) {
  return {
    id: 'op-1',
    name: 'Mira',
    alive: true,
    currentHp: 80,
    currentResource: 50,
    activeEffects: [],
    ...overrides,
  };
}

describe('executeEnemyAbility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when enemy has no abilities', () => {
    const enemy = { ...makeEnemyWithAbility(), abilities: [] };
    const result = executeEnemyAbility(enemy, [makeOperative()], [enemy]);
    expect(result).toBeNull();
  });

  it('returns null when enemy.abilities is undefined', () => {
    const enemy = { id: 'e1', name: 'Drone', hp: 30, alive: true };
    const result = executeEnemyAbility(enemy, [makeOperative()], [enemy]);
    expect(result).toBeNull();
  });

  it('returns result with correct abilityName when ability fires (Math.random always 0)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility();
    const op = makeOperative();
    const result = executeEnemyAbility(enemy, [op], [enemy]);
    expect(result).not.toBeNull();
    expect(result.used).toBe(true);
    expect(result.abilityName).toBe('Dirty Fight');
  });

  it('returns result with correct targetName when ability fires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility();
    const op = makeOperative({ name: 'Kira' });
    const result = executeEnemyAbility(enemy, [op], [enemy]);
    expect(result.targetName).toBe('Kira');
  });

  it('returns null when ability is on cooldown', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility();
    enemy.abilityCooldowns = { dirtyFight: 2 };
    const result = executeEnemyAbility(enemy, [makeOperative()], [enemy]);
    expect(result).toBeNull();
  });

  it('returns null when chance roll fails (Math.random returns 0.99)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const enemy = makeEnemyWithAbility({ chance: 0.4 });
    const result = executeEnemyAbility(enemy, [makeOperative()], [enemy]);
    expect(result).toBeNull();
  });

  it('sets cooldown on the ability after it fires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility({ cooldown: 3 });
    const op = makeOperative();
    executeEnemyAbility(enemy, [op], [enemy]);
    expect(enemy.abilityCooldowns['dirtyFight']).toBe(3);
  });

  it('appliesEffect weaken — target has weaken in activeEffects', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility({ appliesEffect: 'weaken', targetType: 'enemy' });
    const op = makeOperative();
    executeEnemyAbility(enemy, [op], [enemy]);
    expect(op.activeEffects.some(e => e.id === 'weaken')).toBe(true);
  });

  it('appliesEffect poison on random target', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility({ appliesEffect: 'poison', targetType: 'random' });
    const op = makeOperative();
    executeEnemyAbility(enemy, [op], [enemy]);
    expect(op.activeEffects.some(e => e.id === 'poison')).toBe(true);
  });

  it('drainMp reduces target currentResource by ability.drainMp', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = {
      ...makeEnemyWithAbility(),
      abilities: [{ id: 'mindDrain', name: 'Mind Drain', drainMp: 15, cooldown: 3, chance: 0.5, targetType: 'random' }],
    };
    const op = makeOperative({ currentResource: 40 });
    executeEnemyAbility(enemy, [op], [enemy]);
    expect(op.currentResource).toBe(25);
  });

  it('drainMp clamps currentResource to 0 when drain exceeds current value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = {
      ...makeEnemyWithAbility(),
      abilities: [{ id: 'mindDrain', name: 'Mind Drain', drainMp: 15, cooldown: 3, chance: 0.5, targetType: 'random' }],
    };
    const op = makeOperative({ currentResource: 5 });
    executeEnemyAbility(enemy, [op], [enemy]);
    expect(op.currentResource).toBe(0);
  });

  it('targetType self — effect applied to enemy itself', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility({ appliesEffect: 'fortify', targetType: 'self', chance: 0.6 });
    const op = makeOperative();
    executeEnemyAbility(enemy, [op], [enemy]);
    expect(enemy.activeEffects.some(e => e.id === 'fortify')).toBe(true);
    expect(op.activeEffects).toHaveLength(0);
  });

  it('initializes abilityCooldowns if missing (save compat)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no fire, just save-compat test
    const enemy = makeEnemyWithAbility();
    delete enemy.abilityCooldowns;
    executeEnemyAbility(enemy, [makeOperative()], [enemy]);
    expect(typeof enemy.abilityCooldowns).toBe('object');
  });

  it('returns null when all alive operatives array is empty (no valid target)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const enemy = makeEnemyWithAbility();
    const deadOp = makeOperative({ alive: false });
    const result = executeEnemyAbility(enemy, [deadOp], [enemy]);
    expect(result).toBeNull();
  });
});

// ─── tickEnemyCooldowns ───────────────────────────────────────────────────────

describe('tickEnemyCooldowns', () => {
  it('decrements all cooldown values by 1', () => {
    const enemy = { abilityCooldowns: { dirtyFight: 3, mindDrain: 2 } };
    tickEnemyCooldowns(enemy);
    expect(enemy.abilityCooldowns.dirtyFight).toBe(2);
    expect(enemy.abilityCooldowns.mindDrain).toBe(1);
  });

  it('does not go below 0', () => {
    const enemy = { abilityCooldowns: { dirtyFight: 0, mindDrain: 1 } };
    tickEnemyCooldowns(enemy);
    expect(enemy.abilityCooldowns.dirtyFight).toBe(0);
    expect(enemy.abilityCooldowns.mindDrain).toBe(0);
  });

  it('handles empty cooldowns object without error', () => {
    const enemy = { abilityCooldowns: {} };
    expect(() => tickEnemyCooldowns(enemy)).not.toThrow();
  });

  it('handles missing abilityCooldowns gracefully (returns without error)', () => {
    const enemy = {};
    expect(() => tickEnemyCooldowns(enemy)).not.toThrow();
  });

  it('decrement from 1 reaches 0 (edge case)', () => {
    const enemy = { abilityCooldowns: { toxicSpores: 1 } };
    tickEnemyCooldowns(enemy);
    expect(enemy.abilityCooldowns.toxicSpores).toBe(0);
  });
});
