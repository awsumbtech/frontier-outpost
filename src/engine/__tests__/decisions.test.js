import { describe, it, expect } from 'vitest';
import { applyRoundStartEffects } from '../combat';
import { createOperative } from '../operatives';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAlly(classKey = 'VANGUARD', name = 'Soldier') {
  const op = createOperative(classKey, name);
  op.activeEffects = [];
  return op;
}

function makeEnemy(overrides = {}) {
  return {
    id: 'e1',
    name: 'Drone',
    hp: 100,
    maxHp: 100,
    armor: 10,
    damage: 20,
    speed: 5,
    alive: true,
    stunned: false,
    bleed: 0,
    activeEffects: [],
    ...overrides,
  };
}

// ─── counterAmbush ────────────────────────────────────────────────────────────

describe('decision — counterAmbush', () => {
  it('adds a +30% damage buff activeEffect to all allies on round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(1, [op], [], { counterAmbush: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'counterAmbush');
    expect(effect).toBeDefined();
    expect(effect.stat).toBe('damage');
    expect(effect.modifier).toBe(0.3);
    expect(effect.type).toBe('buff');
  });

  it('applies the counterAmbush buff to every alive ally', () => {
    const op1 = makeAlly('VANGUARD', 'T1');
    const op2 = makeAlly('RECON', 'T2');
    const { squad } = applyRoundStartEffects(1, [op1, op2], [], { counterAmbush: true });

    for (const s of squad) {
      expect(s.activeEffects.some(e => e.id === 'counterAmbush')).toBe(true);
    }
  });

  it('does not apply counterAmbush buff after round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(2, [op], [], { counterAmbush: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'counterAmbush');
    expect(effect).toBeUndefined();
  });

  it('logs a counter-ambush message', () => {
    const op = makeAlly();
    const { log } = applyRoundStartEffects(1, [op], [], { counterAmbush: true });

    const logEntry = log.find(l => l.text.toLowerCase().includes('counter'));
    expect(logEntry).toBeDefined();
  });
});

// ─── fallBack ─────────────────────────────────────────────────────────────────

describe('decision — fallBack', () => {
  it('adds a +50% armor buff to all allies on round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(1, [op], [], { fallBack: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'fallBack');
    expect(effect).toBeDefined();
    expect(effect.stat).toBe('armor');
    expect(effect.modifier).toBe(0.5);
    expect(effect.type).toBe('buff');
  });

  it('sets remainingRounds to a high number (persists all encounter)', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(1, [op], [], { fallBack: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'fallBack');
    expect(effect.remainingRounds).toBeGreaterThan(10);
  });

  it('applies fallBack to all alive allies', () => {
    const op1 = makeAlly('VANGUARD', 'T1');
    const op2 = makeAlly('MEDIC', 'T2');
    const { squad } = applyRoundStartEffects(1, [op1, op2], [], { fallBack: true });

    expect(squad.every(s => s.activeEffects.some(e => e.id === 'fallBack'))).toBe(true);
  });
});

// ─── ambush ───────────────────────────────────────────────────────────────────

describe('decision — ambush', () => {
  it('adds a +300% speed buff to all allies on round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(1, [op], [], { ambush: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'ambush');
    expect(effect).toBeDefined();
    expect(effect.stat).toBe('speed');
    expect(effect.modifier).toBe(3.0);
    expect(effect.type).toBe('buff');
  });

  it('logs an ambush message', () => {
    const op = makeAlly();
    const { log } = applyRoundStartEffects(1, [op], [], { ambush: true });

    const logEntry = log.find(l => l.text.toLowerCase().includes('ambush'));
    expect(logEntry).toBeDefined();
  });

  it('does not apply ambush buff after round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(3, [op], [], { ambush: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'ambush');
    expect(effect).toBeUndefined();
  });
});

// ─── jam ──────────────────────────────────────────────────────────────────────

describe('decision — jam', () => {
  it('adds a -20% damage debuff to all enemies on round 1', () => {
    const op = makeAlly();
    const enemy = makeEnemy();

    const { enemies } = applyRoundStartEffects(1, [op], [enemy], { jam: true });

    const effect = enemies[0].activeEffects.find(e => e.id === 'jam');
    expect(effect).toBeDefined();
    expect(effect.stat).toBe('damage');
    expect(effect.modifier).toBe(-0.2);
    expect(effect.type).toBe('debuff');
  });

  it('applies jam debuff to all alive enemies', () => {
    const op = makeAlly();
    const e1 = makeEnemy({ id: 'e1' });
    const e2 = makeEnemy({ id: 'e2' });

    const { enemies } = applyRoundStartEffects(1, [op], [e1, e2], { jam: true });

    expect(enemies.every(e => e.activeEffects.some(ef => ef.id === 'jam'))).toBe(true);
  });

  it('logs a jammed comms message', () => {
    const op = makeAlly();
    const enemy = makeEnemy();

    const { log } = applyRoundStartEffects(1, [op], [enemy], { jam: true });

    const logEntry = log.find(l => l.text.toLowerCase().includes('jam'));
    expect(logEntry).toBeDefined();
  });

  it('does not apply jam debuff after round 1', () => {
    const op = makeAlly();
    const enemy = makeEnemy();

    const { enemies } = applyRoundStartEffects(2, [op], [enemy], { jam: true });

    const effect = enemies[0].activeEffects?.find(e => e.id === 'jam');
    expect(effect).toBeUndefined();
  });
});

// ─── rescue ───────────────────────────────────────────────────────────────────

describe('decision — rescue', () => {
  it('adds a -99% speed debuff to all allies on round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(1, [op], [], { rescue: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'rescue');
    expect(effect).toBeDefined();
    expect(effect.stat).toBe('speed');
    expect(effect.modifier).toBe(-0.99);
    expect(effect.type).toBe('debuff');
  });

  it('applies rescue debuff to all alive allies', () => {
    const op1 = makeAlly('VANGUARD', 'T1');
    const op2 = makeAlly('RECON', 'T2');

    const { squad } = applyRoundStartEffects(1, [op1, op2], [], { rescue: true });

    expect(squad.every(s => s.activeEffects.some(e => e.id === 'rescue'))).toBe(true);
  });

  it('logs a rescue message', () => {
    const op = makeAlly();
    const { log } = applyRoundStartEffects(1, [op], [], { rescue: true });

    const logEntry = log.find(l => l.text.toLowerCase().includes('rescuing') || l.text.toLowerCase().includes('rescue'));
    expect(logEntry).toBeDefined();
  });

  it('does not apply rescue debuff after round 1', () => {
    const op = makeAlly();
    const { squad } = applyRoundStartEffects(4, [op], [], { rescue: true });

    const effect = squad[0].activeEffects.find(e => e.id === 'rescue');
    expect(effect).toBeUndefined();
  });
});

// ─── overload ─────────────────────────────────────────────────────────────────

describe('decision — overload', () => {
  it('deals 25 HP damage to all enemies on round 1', () => {
    const op = makeAlly();
    const enemy = makeEnemy({ hp: 100, maxHp: 100 });

    const { enemies } = applyRoundStartEffects(1, [op], [enemy], { overload: true });

    expect(enemies[0].hp).toBe(75);
  });

  it('kills enemies with less than 25 HP', () => {
    const op = makeAlly();
    const enemy = makeEnemy({ hp: 20, maxHp: 100 });

    const { enemies } = applyRoundStartEffects(1, [op], [enemy], { overload: true });

    expect(enemies[0].alive).toBe(false);
  });

  it('damages all alive enemies', () => {
    const op = makeAlly();
    const e1 = makeEnemy({ id: 'e1', hp: 100, maxHp: 100 });
    const e2 = makeEnemy({ id: 'e2', hp: 100, maxHp: 100 });

    const { enemies } = applyRoundStartEffects(1, [op], [e1, e2], { overload: true });

    expect(enemies[0].hp).toBe(75);
    expect(enemies[1].hp).toBe(75);
  });

  it('logs an overload message', () => {
    const op = makeAlly();
    const enemy = makeEnemy();

    const { log } = applyRoundStartEffects(1, [op], [enemy], { overload: true });

    const logEntry = log.find(l => l.text.toLowerCase().includes('overload'));
    expect(logEntry).toBeDefined();
  });

  it('does not deal overload damage after round 1', () => {
    const op = makeAlly();
    const enemy = makeEnemy({ hp: 100, maxHp: 100 });

    const { enemies } = applyRoundStartEffects(2, [op], [enemy], { overload: true });

    expect(enemies[0].hp).toBe(100);
  });
});

// ─── Multiple decisions applied together ─────────────────────────────────────

describe('decisions — combined effects', () => {
  it('can apply multiple independent decision effects in the same round', () => {
    const op = makeAlly();
    const enemy = makeEnemy({ hp: 100, maxHp: 100 });

    const { squad, enemies } = applyRoundStartEffects(1, [op], [enemy], {
      counterAmbush: true,
      overload: true,
    });

    const counterBuff = squad[0].activeEffects.find(e => e.id === 'counterAmbush');
    expect(counterBuff).toBeDefined();
    expect(enemies[0].hp).toBe(75); // overload hit
  });
});
