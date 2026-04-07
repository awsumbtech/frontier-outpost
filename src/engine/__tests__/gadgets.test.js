import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeGadgetUse } from '../combat';
import { createOperative, getEffectiveStats } from '../operatives';

afterEach(() => vi.restoreAllMocks());

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
    hp: 200,
    maxHp: 200,
    armor: 0,
    damage: 20,
    speed: 5,
    alive: true,
    stunned: false,
    bleed: 0,
    activeEffects: [],
    ...overrides,
  };
}

function withGadget(op, stats, uses = 2) {
  op.gear = { ...op.gear, gadget: { id: 'gadget-1', name: 'Gadget', type: 'gadget', stats, uses } };
  return op;
}

// ─── healBurst ────────────────────────────────────────────────────────────────

describe('executeGadgetUse — healBurst', () => {
  it('increases operative HP by the healBurst amount', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const maxHp = getEffectiveStats(op).hp;
    op.currentHp = Math.floor(maxHp * 0.5);
    withGadget(op, { healBurst: 30 });

    const hpBefore = op.currentHp;
    const { squad } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].currentHp).toBe(hpBefore + 30);
  });

  it('does not exceed max HP when near full health', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const maxHp = getEffectiveStats(op).hp;
    op.currentHp = maxHp - 5;
    withGadget(op, { healBurst: 50 });

    const { squad } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].currentHp).toBe(maxHp);
  });
});

// ─── shieldBurst ──────────────────────────────────────────────────────────────

describe('executeGadgetUse — shieldBurst', () => {
  it('increases operative shield by the shieldBurst amount', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.currentShield = 0;
    withGadget(op, { shieldBurst: 20 });

    const { squad } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].currentShield).toBe(20);
  });

  it('does not exceed max shield', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const maxShield = getEffectiveStats(op).shield;
    op.currentShield = maxShield - 2;
    withGadget(op, { shieldBurst: 100 });

    const { squad } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].currentShield).toBe(maxShield);
  });
});

// ─── dmgBurst ─────────────────────────────────────────────────────────────────

describe('executeGadgetUse — dmgBurst', () => {
  it('deals AoE damage to all alive enemies', () => {
    const op = makeAlly('ENGINEER', 'Tech');
    withGadget(op, { dmgBurst: 30 });

    const enemy1 = makeEnemy({ id: 'e1', hp: 200, maxHp: 200, armor: 0 });
    const enemy2 = makeEnemy({ id: 'e2', hp: 200, maxHp: 200, armor: 0 });

    const { enemies } = executeGadgetUse(op.id, [op], [enemy1, enemy2]);

    expect(enemies[0].hp).toBeLessThan(200);
    expect(enemies[1].hp).toBeLessThan(200);
  });

  it('marks enemies with 0 HP as dead', () => {
    const op = makeAlly('ENGINEER', 'Tech');
    withGadget(op, { dmgBurst: 9999 });

    const enemy = makeEnemy({ hp: 10, maxHp: 10, armor: 0 });

    const { enemies } = executeGadgetUse(op.id, [op], [enemy]);

    expect(enemies[0].alive).toBe(false);
  });

  it('deals at least 1 damage even against armored enemies', () => {
    const op = makeAlly('ENGINEER', 'Tech');
    withGadget(op, { dmgBurst: 5 });

    const enemy = makeEnemy({ hp: 500, maxHp: 500, armor: 9999 });

    const { enemies } = executeGadgetUse(op.id, [op], [enemy]);

    expect(enemies[0].hp).toBeLessThan(500);
    expect(500 - enemies[0].hp).toBeGreaterThanOrEqual(1);
  });
});

// ─── stunBurst ────────────────────────────────────────────────────────────────

describe('executeGadgetUse — stunBurst', () => {
  it('stuns one alive enemy', () => {
    const op = makeAlly('ENGINEER', 'Tech');
    withGadget(op, { stunBurst: true });

    const enemy1 = makeEnemy({ id: 'e1' });
    const enemy2 = makeEnemy({ id: 'e2' });

    const { enemies } = executeGadgetUse(op.id, [op], [enemy1, enemy2]);

    const stunnedCount = enemies.filter(e => e.stunned).length;
    expect(stunnedCount).toBe(1);
  });

  it('logs a stun message', () => {
    const op = makeAlly('ENGINEER', 'Tech');
    withGadget(op, { stunBurst: true });

    const enemy = makeEnemy();

    const { log } = executeGadgetUse(op.id, [op], [enemy]);

    const stunLog = log.find(l => l.type === 'stun');
    expect(stunLog).toBeDefined();
  });
});

// ─── Uses decrement ───────────────────────────────────────────────────────────

describe('executeGadgetUse — uses management', () => {
  it('decrements uses by 1 after activation', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    withGadget(op, { healBurst: 30 }, 3);

    const { squad } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].gear.gadget.uses).toBe(2);
  });

  it('returns no effect when uses are 0', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const maxHp = getEffectiveStats(op).hp;
    op.currentHp = Math.floor(maxHp * 0.5);
    withGadget(op, { healBurst: 50 }, 0); // 0 uses

    const hpBefore = op.currentHp;
    const { squad, log } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].currentHp).toBe(hpBefore); // no healing
    expect(log.length).toBe(0);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('executeGadgetUse — edge cases', () => {
  it('returns no effect when operative has no gadget equipped', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.gear.gadget = null;

    const hpBefore = op.currentHp;
    const { squad, log } = executeGadgetUse(op.id, [op], []);

    expect(squad[0].currentHp).toBe(hpBefore);
    expect(log.length).toBe(0);
  });

  it('returns no effect for a dead operative', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.alive = false;
    withGadget(op, { healBurst: 50 });

    const { log } = executeGadgetUse(op.id, [op], []);

    expect(log.length).toBe(0);
  });

  it('returns no effect when gadget has no stats', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.gear.gadget = { id: 'broken', name: 'Broken', uses: 2, stats: {} };

    const enemy = makeEnemy();
    const { log } = executeGadgetUse(op.id, [op], [enemy]);

    // No recognised stat triggers, so nothing should fire
    expect(log.length).toBe(0);
  });
});
