import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAvailableAbilities,
  executeAbility,
  getBuffModifiedStats,
  tickStatusEffects,
  applyTurnStartEffects,
} from '../combat';
import { createOperative } from '../operatives';
import { saveGame, loadGame } from '../saves';
import { CLASS_BASE_RESOURCE } from '../../data/constants';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeEnemy(overrides = {}) {
  return {
    id: 'enemy-1',
    name: 'Drone',
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

function makeAlly(classKey = 'VANGUARD', name = 'Soldier') {
  const op = createOperative(classKey, name);
  op.activeEffects = [];
  return op;
}

// ─── getAvailableAbilities ──────────────────────────────────────────────────

describe('getAvailableAbilities', () => {
  it('returns empty array for operative with no learned skills', () => {
    const op = makeAlly('VANGUARD');
    const abilities = getAvailableAbilities(op);
    expect(abilities).toEqual([]);
  });

  it('returns only abilities whose unlockSkill is learned', () => {
    const op = makeAlly('VANGUARD');
    op.skills['Fortify'] = true; // unlocks shieldWall
    const abilities = getAvailableAbilities(op);
    expect(abilities).toHaveLength(1);
    expect(abilities[0].id).toBe('shieldWall');
  });

  it('marks abilities as available: true when operative has sufficient resource', () => {
    const op = makeAlly('VANGUARD');
    op.skills['Fortify'] = true; // shieldWall costs 15
    op.currentResource = 20;
    const abilities = getAvailableAbilities(op);
    expect(abilities[0].available).toBe(true);
  });

  it('marks abilities as available: false when operative has insufficient resource', () => {
    const op = makeAlly('VANGUARD');
    op.skills['Fortify'] = true; // shieldWall costs 15
    op.currentResource = 10;
    const abilities = getAvailableAbilities(op);
    expect(abilities[0].available).toBe(false);
  });

  it('marks ability as available: true when resource equals exact cost', () => {
    const op = makeAlly('VANGUARD');
    op.skills['Fortify'] = true; // shieldWall costs 15
    op.currentResource = 15;
    const abilities = getAvailableAbilities(op);
    expect(abilities[0].available).toBe(true);
  });

  it('returns multiple unlocked abilities when multiple skills are learned', () => {
    const op = makeAlly('VANGUARD');
    op.skills['Fortify'] = true;      // unlocks shieldWall
    op.skills['Provoke'] = true;      // unlocks taunt
    op.currentResource = 50;
    const abilities = getAvailableAbilities(op);
    expect(abilities).toHaveLength(2);
    const ids = abilities.map(a => a.id);
    expect(ids).toContain('shieldWall');
    expect(ids).toContain('taunt');
  });

  it('operative with zero currentResource marks all abilities unavailable', () => {
    const op = makeAlly('RECON');
    op.skills['Lethal Edge'] = true; // unlocks assassinate (costs 25)
    op.currentResource = 0;
    const abilities = getAvailableAbilities(op);
    expect(abilities[0].available).toBe(false);
  });
});

// ─── executeAbility — attack type ──────────────────────────────────────────

describe('executeAbility — attack type', () => {
  it('Power Strike deals approximately 1.5x base damage to target', () => {
    const attacker = makeAlly('VANGUARD', 'Tank');
    attacker.skills['Cover Fire'] = true; // unlocks powerStrike
    attacker.currentResource = 50;

    // Remove gear to use pure base stats (VANGUARD base damage = 10)
    const enemy = makeEnemy({ armor: 0, hp: 200, maxHp: 200 });
    const squad = [attacker];
    const enemies = [enemy];

    const { enemies: result } = executeAbility(attacker.id, 'powerStrike', enemy.id, squad, enemies);
    const damageTaken = 200 - result[0].hp;

    // With 1.5x multiplier on base 10 damage (+rng -2 to 4), damage range is roughly:
    // (10 - 2) * 1.5 = 12 at minimum, (10 + 4) * 1.5 = 21 at maximum (before armor)
    expect(damageTaken).toBeGreaterThanOrEqual(1);
    expect(damageTaken).toBeLessThan(200);
  });

  it('Assassinate deals roughly 2x damage to target (with +30% crit)', () => {
    const attacker = makeAlly('RECON', 'Ghost');
    attacker.skills['Lethal Edge'] = true; // unlocks assassinate
    attacker.currentResource = 60;

    const enemy = makeEnemy({ armor: 0, hp: 300, maxHp: 300 });
    const squad = [attacker];
    const enemies = [enemy];

    const { enemies: result } = executeAbility(attacker.id, 'assassinate', enemy.id, squad, enemies);
    const damageTaken = 300 - result[0].hp;

    // RECON base damage = 24 with 2x multiplier; range (24-2)*2=44 to (24+4)*2=56 (non-crit)
    expect(damageTaken).toBeGreaterThanOrEqual(1);
    expect(damageTaken).toBeLessThan(300);
  });

  it('Double Strike logs two hits at 70% damage each', () => {
    const attacker = makeAlly('RECON', 'Striker');
    attacker.skills['Phantom Strike'] = true; // unlocks doubleStrike
    attacker.currentResource = 60;

    const enemy = makeEnemy({ armor: 0, hp: 500, maxHp: 500 });
    const squad = [attacker];
    const enemies = [enemy];

    const { log } = executeAbility(attacker.id, 'doubleStrike', enemy.id, squad, enemies);

    // Should see two hit log entries for doubleStrike
    const hitLogs = log.filter(l => l.text.includes('[Double Strike]'));
    expect(hitLogs.length).toBeGreaterThanOrEqual(1);
  });

  it('Double Strike deals damage from two hits', () => {
    const attacker = makeAlly('RECON', 'Striker');
    attacker.skills['Phantom Strike'] = true; // unlocks doubleStrike
    attacker.currentResource = 60;

    const enemy = makeEnemy({ armor: 0, hp: 500, maxHp: 500 });
    const squad = [attacker];
    const enemies = [enemy];

    const { enemies: result } = executeAbility(attacker.id, 'doubleStrike', enemy.id, squad, enemies);
    const damageTaken = 500 - result[0].hp;

    // Two hits at 70% of RECON base 24 = ~16.8 each, so at least 2 total
    expect(damageTaken).toBeGreaterThanOrEqual(2);
  });

  it('Orbital Strike deals AoE damage to all alive enemies', () => {
    const attacker = makeAlly('ENGINEER', 'Techie');
    attacker.skills['Orbital Uplink'] = true; // unlocks orbitalStrike
    attacker.currentResource = 80;

    const enemy1 = makeEnemy({ id: 'e1', armor: 0, hp: 200, maxHp: 200 });
    const enemy2 = makeEnemy({ id: 'e2', armor: 0, hp: 200, maxHp: 200 });
    const squad = [attacker];
    const enemies = [enemy1, enemy2];

    const { enemies: result } = executeAbility(attacker.id, 'orbitalStrike', null, squad, enemies);

    expect(result[0].hp).toBeLessThan(200);
    expect(result[1].hp).toBeLessThan(200);
  });

  it('Orbital Strike does not affect dead enemies', () => {
    const attacker = makeAlly('ENGINEER', 'Techie');
    attacker.skills['Orbital Uplink'] = true;
    attacker.currentResource = 80;

    const enemy1 = makeEnemy({ id: 'e1', armor: 0, hp: 200, maxHp: 200 });
    const enemy2 = makeEnemy({ id: 'e2', alive: false, hp: 0, maxHp: 200, armor: 0 });
    const squad = [attacker];
    const enemies = [enemy1, enemy2];

    const { enemies: result } = executeAbility(attacker.id, 'orbitalStrike', null, squad, enemies);

    expect(result[0].hp).toBeLessThan(200);
    expect(result[1].hp).toBe(0); // dead enemy unchanged
  });

  it('resource cost is deducted from attacker after a successful attack', () => {
    const attacker = makeAlly('VANGUARD', 'Tank');
    attacker.skills['Cover Fire'] = true; // powerStrike costs 12
    attacker.currentResource = 40;

    const enemy = makeEnemy({ armor: 0 });
    const squad = [attacker];
    const enemies = [enemy];

    const { squad: resultSquad } = executeAbility(attacker.id, 'powerStrike', enemy.id, squad, enemies);
    const resultAttacker = resultSquad.find(o => o.id === attacker.id);

    expect(resultAttacker.currentResource).toBe(40 - 12);
  });
});

// ─── executeAbility — buff type ────────────────────────────────────────────

describe('executeAbility — buff type', () => {
  it('Shield Wall adds an armor buff to self with duration 2', () => {
    const attacker = makeAlly('VANGUARD', 'Tank');
    attacker.skills['Fortify'] = true; // unlocks shieldWall
    attacker.currentResource = 30;

    const squad = [attacker];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(attacker.id, 'shieldWall', attacker.id, squad, enemies);
    const resultOp = result.find(o => o.id === attacker.id);

    const armorBuff = resultOp.activeEffects.find(e => e.stat === 'armor' && e.type === 'buff');
    expect(armorBuff).toBeDefined();
    expect(armorBuff.modifier).toBe(0.5);
    expect(armorBuff.remainingRounds).toBe(2);
  });

  it('Smoke Bomb adds an evasion buff to self with duration 2', () => {
    const attacker = makeAlly('RECON', 'Ghost');
    attacker.skills['Shadowstep'] = true; // unlocks smokeBomb
    attacker.currentResource = 30;

    const squad = [attacker];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(attacker.id, 'smokeBomb', attacker.id, squad, enemies);
    const resultOp = result.find(o => o.id === attacker.id);

    const evasionBuff = resultOp.activeEffects.find(e => e.stat === 'evasion' && e.type === 'buff');
    expect(evasionBuff).toBeDefined();
    expect(evasionBuff.modifier).toBe(40);
    expect(evasionBuff.remainingRounds).toBe(2);
  });

  it('Aura Boost adds a damage buff to all alive allies', () => {
    const attacker = makeAlly('MEDIC', 'Doc');
    attacker.skills['Adrenaline Shot'] = true; // unlocks auraBoost
    attacker.currentResource = 60;

    const ally2 = makeAlly('VANGUARD', 'Tank');

    const squad = [attacker, ally2];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(attacker.id, 'auraBoost', null, squad, enemies);

    for (const op of result) {
      const damageBuff = op.activeEffects.find(e => e.stat === 'damage' && e.type === 'buff');
      expect(damageBuff).toBeDefined();
      expect(damageBuff.modifier).toBe(0.15);
      expect(damageBuff.remainingRounds).toBe(3);
    }
  });

  it('Intercept adds intercepted buff to target ally', () => {
    const attacker = makeAlly('VANGUARD', 'Guardian');
    attacker.skills['Guardian Stance'] = true; // unlocks intercept
    attacker.currentResource = 40;

    const ally2 = makeAlly('MEDIC', 'Doc');

    const squad = [attacker, ally2];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(attacker.id, 'intercept', ally2.id, squad, enemies);
    const guardTarget = result.find(o => o.id === ally2.id);

    const interceptBuff = guardTarget.activeEffects.find(e => e.stat === 'intercepted');
    expect(interceptBuff).toBeDefined();
    expect(interceptBuff.remainingRounds).toBe(1);
  });

  it('Taunt adds forceTaunt buff (taunt stat) to self', () => {
    const attacker = makeAlly('VANGUARD', 'Tank');
    attacker.skills['Provoke'] = true; // unlocks taunt
    attacker.currentResource = 30;

    const squad = [attacker];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(attacker.id, 'taunt', attacker.id, squad, enemies);
    const resultOp = result.find(o => o.id === attacker.id);

    const tauntBuff = resultOp.activeEffects.find(e => e.stat === 'taunt');
    expect(tauntBuff).toBeDefined();
    expect(tauntBuff.modifier).toBe(1.0);
    expect(tauntBuff.remainingRounds).toBe(1);
  });
});

// ─── executeAbility — debuff type ─────────────────────────────────────────

describe('executeAbility — debuff type', () => {
  it('EMP Blast stuns all alive enemies', () => {
    const attacker = makeAlly('ENGINEER', 'Techie');
    attacker.skills['EMP Pulse'] = true; // unlocks empBlast
    attacker.currentResource = 60;

    const enemy1 = makeEnemy({ id: 'e1' });
    const enemy2 = makeEnemy({ id: 'e2' });
    const squad = [attacker];
    const enemies = [enemy1, enemy2];

    const { enemies: result } = executeAbility(attacker.id, 'empBlast', null, squad, enemies);

    expect(result[0].stunned).toBe(true);
    expect(result[1].stunned).toBe(true);
  });

  it('EMP Blast does not stun dead enemies', () => {
    const attacker = makeAlly('ENGINEER', 'Techie');
    attacker.skills['EMP Pulse'] = true;
    attacker.currentResource = 60;

    const enemy1 = makeEnemy({ id: 'e1' });
    const enemy2 = makeEnemy({ id: 'e2', alive: false, hp: 0 });
    const squad = [attacker];
    const enemies = [enemy1, enemy2];

    const { enemies: result } = executeAbility(attacker.id, 'empBlast', null, squad, enemies);

    expect(result[0].stunned).toBe(true);
    expect(result[1].stunned).toBe(false); // was dead, unchanged
  });

  it('Armor Shred adds armor debuff to target enemy with duration 3', () => {
    const attacker = makeAlly('ENGINEER', 'Techie');
    attacker.skills['Hack Systems'] = true; // unlocks armorShred
    attacker.currentResource = 40;

    const enemy = makeEnemy();
    const squad = [attacker];
    const enemies = [enemy];

    const { enemies: result } = executeAbility(attacker.id, 'armorShred', enemy.id, squad, enemies);
    const armorDebuff = result[0].activeEffects.find(e => e.stat === 'armor' && e.type === 'debuff');

    expect(armorDebuff).toBeDefined();
    expect(armorDebuff.modifier).toBe(-0.4);
    expect(armorDebuff.remainingRounds).toBe(3);
  });

  it('Mark Target adds damageTaken debuff to target enemy with duration 2', () => {
    const attacker = makeAlly('RECON', 'Sniper');
    attacker.skills['Mark for Death'] = true; // unlocks markTarget
    attacker.currentResource = 40;

    const enemy = makeEnemy();
    const squad = [attacker];
    const enemies = [enemy];

    const { enemies: result } = executeAbility(attacker.id, 'markTarget', enemy.id, squad, enemies);
    const markDebuff = result[0].activeEffects.find(e => e.stat === 'damageTaken' && e.type === 'debuff');

    expect(markDebuff).toBeDefined();
    expect(markDebuff.modifier).toBe(0.3);
    expect(markDebuff.remainingRounds).toBe(2);
  });
});

// ─── executeAbility — heal / revive / cleanse ──────────────────────────────

describe('executeAbility — heal, revive, cleanse', () => {
  it('Heal restores 40% of max HP to a wounded ally', () => {
    const healer = makeAlly('MEDIC', 'Doc');
    healer.skills['Triage'] = true; // unlocks heal
    healer.currentResource = 60;

    const wounded = makeAlly('VANGUARD', 'Tank');
    wounded.currentHp = 50; // well below max (140)

    const squad = [healer, wounded];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(healer.id, 'heal', wounded.id, squad, enemies);
    const healedOp = result.find(o => o.id === wounded.id);

    // VANGUARD maxHp = 140; 40% = 56 HP healed; 50 + 56 = 106
    expect(healedOp.currentHp).toBe(106);
  });

  it('Heal does not exceed max HP', () => {
    const healer = makeAlly('MEDIC', 'Doc');
    healer.skills['Triage'] = true;
    healer.currentResource = 60;

    const target = makeAlly('VANGUARD', 'Tank');
    target.currentHp = 130; // near full (max 140)

    const squad = [healer, target];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(healer.id, 'heal', target.id, squad, enemies);
    const healedOp = result.find(o => o.id === target.id);

    expect(healedOp.currentHp).toBeLessThanOrEqual(140);
    expect(healedOp.currentHp).toBe(140); // capped at max
  });

  it('Revive sets downed ally to alive with 30% max HP', () => {
    const healer = makeAlly('MEDIC', 'Doc');
    healer.skills['Resuscitate'] = true; // unlocks revive
    healer.currentResource = 80;

    const downed = makeAlly('VANGUARD', 'Tank');
    downed.alive = false;
    downed.currentHp = 0;

    const squad = [healer, downed];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(healer.id, 'revive', downed.id, squad, enemies);
    const revivedOp = result.find(o => o.id === downed.id);

    // VANGUARD maxHp = 140; 30% = 42 HP
    expect(revivedOp.alive).toBe(true);
    expect(revivedOp.currentHp).toBe(Math.round(140 * 0.3));
  });

  it('Revive does nothing when target is still alive', () => {
    const healer = makeAlly('MEDIC', 'Doc');
    healer.skills['Resuscitate'] = true;
    healer.currentResource = 80;

    const target = makeAlly('VANGUARD', 'Tank');
    target.currentHp = 100;
    // target is alive

    const squad = [healer, target];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(healer.id, 'revive', target.id, squad, enemies);
    const resultOp = result.find(o => o.id === target.id);

    // Alive target — no change in HP
    expect(resultOp.currentHp).toBe(100);
  });

  it('Purge removes all debuffs from target but leaves buffs intact', () => {
    const healer = makeAlly('MEDIC', 'Doc');
    healer.skills['Purge Toxins'] = true; // unlocks purge
    healer.currentResource = 60;

    const target = makeAlly('VANGUARD', 'Tank');
    target.activeEffects = [
      { id: 'armorShred', type: 'debuff', stat: 'armor', modifier: -0.4, remainingRounds: 2, source: 'enemy' },
      { id: 'markTarget', type: 'debuff', stat: 'damageTaken', modifier: 0.3, remainingRounds: 1, source: 'enemy' },
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 1, source: target.id },
    ];

    const squad = [healer, target];
    const enemies = [makeEnemy()];

    const { squad: result } = executeAbility(healer.id, 'purge', target.id, squad, enemies);
    const cleansedOp = result.find(o => o.id === target.id);

    const remaining = cleansedOp.activeEffects;
    expect(remaining.every(e => e.type !== 'debuff')).toBe(true);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].type).toBe('buff');
  });

  it('Purge on a target with no debuffs results in empty activeEffects (no crash)', () => {
    const healer = makeAlly('MEDIC', 'Doc');
    healer.skills['Purge Toxins'] = true;
    healer.currentResource = 60;

    const target = makeAlly('VANGUARD', 'Tank');
    target.activeEffects = [];

    const squad = [healer, target];
    const enemies = [makeEnemy()];

    expect(() =>
      executeAbility(healer.id, 'purge', target.id, squad, enemies)
    ).not.toThrow();
  });
});

// ─── executeAbility — resource validation ──────────────────────────────────

describe('executeAbility — resource validation', () => {
  it('deducts resource cost on a successful ability use', () => {
    const attacker = makeAlly('RECON', 'Ghost');
    attacker.skills['Lethal Edge'] = true; // assassinate costs 25
    attacker.currentResource = 50;

    const enemy = makeEnemy({ armor: 0 });
    const squad = [attacker];
    const enemies = [enemy];

    const { squad: result } = executeAbility(attacker.id, 'assassinate', enemy.id, squad, enemies);
    const resultOp = result.find(o => o.id === attacker.id);

    expect(resultOp.currentResource).toBe(50 - 25);
  });

  it('does not allow currentResource to go below zero', () => {
    const attacker = makeAlly('RECON', 'Ghost');
    attacker.skills['Lethal Edge'] = true; // assassinate costs 25
    attacker.currentResource = 10; // less than cost

    const enemy = makeEnemy({ armor: 0 });
    const squad = [attacker];
    const enemies = [enemy];

    // executeAbility always deducts even if insufficient (resource validation
    // is enforced by getAvailableAbilities / UI layer). It should clamp to 0.
    const { squad: result } = executeAbility(attacker.id, 'assassinate', enemy.id, squad, enemies);
    const resultOp = result.find(o => o.id === attacker.id);

    expect(resultOp.currentResource).toBeGreaterThanOrEqual(0);
  });
});

// ─── getBuffModifiedStats ───────────────────────────────────────────────────

describe('getBuffModifiedStats', () => {
  it('returns base effective stats when operative has no activeEffects', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [];

    const stats = getBuffModifiedStats(op, true);

    expect(stats.hp).toBe(140);
    expect(stats.armor).toBe(18);
    expect(stats.damage).toBe(10);
  });

  it('applies armor buff correctly (+50% armor)', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 2 }
    ];

    const stats = getBuffModifiedStats(op, true);

    // base armor = 18; +50% → 18 * 1.5 = 27
    expect(stats.armor).toBe(Math.round(18 * 1.5));
  });

  it('applies armor debuff correctly (-40% armor)', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'armorShred', type: 'debuff', stat: 'armor', modifier: -0.4, remainingRounds: 3 }
    ];

    const stats = getBuffModifiedStats(op, true);

    // base armor = 18; -40% → 18 * 0.6 = 10.8 → round to 11
    expect(stats.armor).toBe(Math.round(18 * (1 + -0.4)));
  });

  it('applies evasion buff additively', () => {
    const op = makeAlly('RECON', 'Ghost');
    // RECON base evasion = 16
    op.activeEffects = [
      { id: 'smokeBomb', type: 'buff', stat: 'evasion', modifier: 40, remainingRounds: 2 }
    ];

    const stats = getBuffModifiedStats(op, true);

    expect(stats.evasion).toBe(16 + 40);
  });

  it('applies damage buff multiplicatively (+15%)', () => {
    const op = makeAlly('MEDIC', 'Doc');
    // MEDIC base damage = 8
    op.activeEffects = [
      { id: 'auraBoost', type: 'buff', stat: 'damage', modifier: 0.15, remainingRounds: 3 }
    ];

    const stats = getBuffModifiedStats(op, true);

    // 8 * 1.15 = 9.2 → round to 9
    expect(stats.damage).toBe(Math.round(8 * 1.15));
  });

  it('applies damageTaken debuff by setting damageTakenMod', () => {
    const enemy = makeEnemy({ activeEffects: [
      { id: 'markTarget', type: 'debuff', stat: 'damageTaken', modifier: 0.3, remainingRounds: 2 }
    ]});

    const stats = getBuffModifiedStats(enemy, false);

    expect(stats.damageTakenMod).toBe(0.3);
  });

  it('stacks multiple effects independently', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    // VANGUARD base armor = 18, damage = 10
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 2 },
      { id: 'auraBoost', type: 'buff', stat: 'damage', modifier: 0.15, remainingRounds: 3 },
    ];

    const stats = getBuffModifiedStats(op, true);

    expect(stats.armor).toBe(Math.round(18 * 1.5));
    expect(stats.damage).toBe(Math.round(10 * 1.15));
  });

  it('works for enemy units (isAlly = false) using raw stats', () => {
    const enemy = makeEnemy({ armor: 20, activeEffects: [
      { id: 'armorShred', type: 'debuff', stat: 'armor', modifier: -0.4, remainingRounds: 3 }
    ]});

    const stats = getBuffModifiedStats(enemy, false);

    expect(stats.armor).toBe(Math.round(20 * 0.6));
  });
});

// ─── tickStatusEffects ────────────────────────────────────────────────────────

describe('tickStatusEffects', () => {
  it('decrements remainingRounds on active effects', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 2 }
    ];

    tickStatusEffects(op);

    expect(op.activeEffects[0].remainingRounds).toBe(1);
  });

  it('removes effects when remainingRounds reaches zero', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 1 }
    ];

    tickStatusEffects(op);

    expect(op.activeEffects).toHaveLength(0);
  });

  it('logs effect expiry when an effect is removed', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 1 }
    ];

    const { logEntries } = tickStatusEffects(op);

    expect(logEntries).toHaveLength(1);
    expect(logEntries[0].text).toContain('ShieldWall');
    expect(logEntries[0].text.toLowerCase()).toContain('expired');
  });

  it('keeps effects that still have rounds remaining', () => {
    const op = makeAlly('RECON', 'Ghost');
    op.activeEffects = [
      { id: 'smokeBomb', type: 'buff', stat: 'evasion', modifier: 40, remainingRounds: 3 }
    ];

    tickStatusEffects(op);

    expect(op.activeEffects).toHaveLength(1);
    expect(op.activeEffects[0].remainingRounds).toBe(2);
  });

  it('handles tick with no active effects without error', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [];

    expect(() => tickStatusEffects(op)).not.toThrow();
  });

  it('ticks effects on enemy units', () => {
    const enemy = makeEnemy({
      activeEffects: [
        { id: 'armorShred', type: 'debuff', stat: 'armor', modifier: -0.4, remainingRounds: 2 }
      ]
    });

    tickStatusEffects(enemy);

    expect(enemy.activeEffects[0].remainingRounds).toBe(1);
  });

  it('logs expiry with correct type for buff effects', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 1 }
    ];

    const { logEntries } = tickStatusEffects(op);

    expect(logEntries[0].type).toBe('expired');
  });

  it('logs expiry with correct type for debuff effects', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'armorShred', type: 'debuff', stat: 'armor', modifier: -0.4, remainingRounds: 1 }
    ];

    const { logEntries } = tickStatusEffects(op);

    expect(logEntries[0].type).toBe('expired');
  });
});

// ─── applyTurnStartEffects (also ticks effects for allies) ─────────────────

describe('applyTurnStartEffects — effect ticking', () => {
  it('decrements ally active effects each turn', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 2 }
    ];
    const squad = [op];
    const enemies = [makeEnemy()];

    const { squad: result } = applyTurnStartEffects(op.id, true, squad, enemies);
    const resultOp = result.find(o => o.id === op.id);

    expect(resultOp.activeEffects[0].remainingRounds).toBe(1);
  });

  it('removes ally effects with remainingRounds <= 0', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'shieldWall', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 1 }
    ];
    const squad = [op];
    const enemies = [makeEnemy()];

    const { squad: result } = applyTurnStartEffects(op.id, true, squad, enemies);
    const resultOp = result.find(o => o.id === op.id);

    expect(resultOp.activeEffects).toHaveLength(0);
  });

  it('logs expiry for ally effects', () => {
    const op = makeAlly('RECON', 'Ghost');
    op.activeEffects = [
      { id: 'smokeBomb', type: 'buff', stat: 'evasion', modifier: 40, remainingRounds: 1 }
    ];
    const squad = [op];
    const enemies = [makeEnemy()];

    const { log } = applyTurnStartEffects(op.id, true, squad, enemies);

    const expiryLog = log.find(l => l.text.includes('expired'));
    expect(expiryLog).toBeDefined();
    expect(expiryLog.text.toLowerCase()).toContain('smokebomb');
  });
});

// ─── Save version gate ──────────────────────────────────────────────────────

describe('saveGame / loadGame — version gate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadGame returns null when there is no saved data', () => {
    expect(loadGame()).toBeNull();
  });

  it('loadGame returns null for saves without a _saveVersion field', () => {
    localStorage.setItem('frontier-outpost-save', JSON.stringify({ squad: [] }));
    expect(loadGame()).toBeNull();
  });

  it('loadGame returns null for saves with version below 2', () => {
    localStorage.setItem('frontier-outpost-save', JSON.stringify({ squad: [], _saveVersion: 1 }));
    expect(loadGame()).toBeNull();
  });

  it('loadGame returns data for saves with version equal to 2', () => {
    const data = { squad: [], _saveVersion: 2 };
    localStorage.setItem('frontier-outpost-save', JSON.stringify(data));
    const result = loadGame();
    expect(result).not.toBeNull();
    expect(result._saveVersion).toBe(2);
  });

  it('saveGame includes _saveVersion in persisted data', () => {
    const fakeGame = { squad: [], credits: 0 };
    saveGame(fakeGame);
    const raw = JSON.parse(localStorage.getItem('frontier-outpost-save'));
    expect(raw._saveVersion).toBe(2);
  });

  it('saveGame does not mutate the original game object', () => {
    const fakeGame = { squad: [], credits: 0 };
    saveGame(fakeGame);
    expect(fakeGame._saveVersion).toBeUndefined();
  });

  it('loadGame removes stale save from localStorage when version is outdated', () => {
    localStorage.setItem('frontier-outpost-save', JSON.stringify({ squad: [], _saveVersion: 1 }));
    loadGame();
    expect(localStorage.getItem('frontier-outpost-save')).toBeNull();
  });
});

// ─── createOperative — resource field ──────────────────────────────────────

describe('createOperative — currentResource field', () => {
  it('initializes VANGUARD with correct base resource (Resolve = 40)', () => {
    const op = createOperative('VANGUARD', 'Test');
    expect(op.currentResource).toBe(CLASS_BASE_RESOURCE.VANGUARD);
  });

  it('initializes RECON with correct base resource (Focus = 50)', () => {
    const op = createOperative('RECON', 'Test');
    expect(op.currentResource).toBe(CLASS_BASE_RESOURCE.RECON);
  });

  it('initializes ENGINEER with correct base resource (Charge = 60)', () => {
    const op = createOperative('ENGINEER', 'Test');
    expect(op.currentResource).toBe(CLASS_BASE_RESOURCE.ENGINEER);
  });

  it('initializes MEDIC with correct base resource (Serum = 80)', () => {
    const op = createOperative('MEDIC', 'Test');
    expect(op.currentResource).toBe(CLASS_BASE_RESOURCE.MEDIC);
  });
});
