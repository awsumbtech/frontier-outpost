import { describe, it, expect } from 'vitest';
import { executeItemUse } from '../combat';
import { createOperative, getEffectiveStats } from '../operatives';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAlly(classKey = 'VANGUARD', name = 'Soldier') {
  const op = createOperative(classKey, name);
  op.activeEffects = [];
  return op;
}

function makeStim(id) {
  const stims = {
    health_stim:  { id: 'health_stim',  name: 'Health Stim',  desc: 'Restore 40% HP', cost: 0 },
    shield_cell:  { id: 'shield_cell',  name: 'Shield Cell',  desc: 'Restore shields', cost: 0 },
    nano_kit:     { id: 'nano_kit',     name: 'Nano Kit',     desc: '+25% HP squad', cost: 0 },
    adrenaline:   { id: 'adrenaline',   name: 'Adrenaline',   desc: '+50% dmg 3 rds', cost: 0 },
    purge_shot:   { id: 'purge_shot',   name: 'Purge Shot',   desc: 'Cleanse + evasion', cost: 0 },
  };
  return stims[id];
}

// ─── Adrenaline stim ──────────────────────────────────────────────────────────

describe('executeItemUse — adrenaline stim', () => {
  it('adds a damage activeEffect with +50% modifier lasting 3 rounds', () => {
    const op = makeAlly('RECON', 'Scout');
    const stims = [makeStim('adrenaline')];

    const { squad } = executeItemUse('adrenaline', op.id, [op], stims);

    const effect = squad[0].activeEffects.find(e => e.id === 'adrenaline');
    expect(effect).toBeDefined();
    expect(effect.stat).toBe('damage');
    expect(effect.modifier).toBe(0.5);
    expect(effect.remainingRounds).toBe(3);
  });

  it('consumes the stim from the inventory after use', () => {
    const op = makeAlly('RECON', 'Scout');
    const stims = [makeStim('adrenaline')];

    const { stims: remaining } = executeItemUse('adrenaline', op.id, [op], stims);

    expect(remaining.length).toBe(0);
  });

  it('stores the effect as type buff', () => {
    const op = makeAlly('RECON', 'Scout');
    const stims = [makeStim('adrenaline')];

    const { squad } = executeItemUse('adrenaline', op.id, [op], stims);

    const effect = squad[0].activeEffects.find(e => e.id === 'adrenaline');
    expect(effect.type).toBe('buff');
  });
});

// ─── Purge Shot stim ──────────────────────────────────────────────────────────

describe('executeItemUse — purge_shot stim', () => {
  it('removes existing debuffs from the target', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'poison', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 3, source: 'enemy' },
      { id: 'slow',   type: 'debuff', stat: 'speed',  modifier: -0.1, remainingRounds: 2, source: 'enemy' },
    ];
    const stims = [makeStim('purge_shot')];

    const { squad } = executeItemUse('purge_shot', op.id, [op], stims);

    const debuffs = squad[0].activeEffects.filter(e => e.type === 'debuff');
    expect(debuffs.length).toBe(0);
  });

  it('adds an evasion buff after purging', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const stims = [makeStim('purge_shot')];

    const { squad } = executeItemUse('purge_shot', op.id, [op], stims);

    const evasionBuff = squad[0].activeEffects.find(e => e.id === 'purgeShot' && e.stat === 'evasion');
    expect(evasionBuff).toBeDefined();
    expect(evasionBuff.modifier).toBe(10);
    expect(evasionBuff.remainingRounds).toBe(2);
  });

  it('consumes the purge_shot stim', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const stims = [makeStim('purge_shot')];

    const { stims: remaining } = executeItemUse('purge_shot', op.id, [op], stims);

    expect(remaining.length).toBe(0);
  });

  it('also removes dot-type effects during purge', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.activeEffects = [
      { id: 'bleed', type: 'dot', damagePerStack: 5, remainingRounds: 3, source: 'enemy' },
    ];
    const stims = [makeStim('purge_shot')];

    const { squad } = executeItemUse('purge_shot', op.id, [op], stims);

    const dots = squad[0].activeEffects.filter(e => e.type === 'dot');
    expect(dots.length).toBe(0);
  });
});

// ─── Health Stim ──────────────────────────────────────────────────────────────

describe('executeItemUse — health_stim', () => {
  it('restores 40% of max HP to the target operative', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const maxHp = getEffectiveStats(op).hp;
    op.currentHp = Math.floor(maxHp * 0.5); // 50% HP
    const hpBefore = op.currentHp;

    const stims = [makeStim('health_stim')];
    const { squad } = executeItemUse('health_stim', op.id, [op], stims);

    const expectedHeal = Math.round(maxHp * 0.4);
    expect(squad[0].currentHp).toBe(Math.min(maxHp, hpBefore + expectedHeal));
  });

  it('does not exceed max HP when target is nearly full', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    const maxHp = getEffectiveStats(op).hp;
    op.currentHp = maxHp - 1; // nearly full

    const stims = [makeStim('health_stim')];
    const { squad } = executeItemUse('health_stim', op.id, [op], stims);

    expect(squad[0].currentHp).toBe(maxHp);
  });
});

// ─── Shield Cell ──────────────────────────────────────────────────────────────

describe('executeItemUse — shield_cell', () => {
  it('restores shields to max for the target operative', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.currentShield = 0;
    const maxShield = getEffectiveStats(op).shield;

    const stims = [makeStim('shield_cell')];
    const { squad } = executeItemUse('shield_cell', op.id, [op], stims);

    expect(squad[0].currentShield).toBe(maxShield);
  });
});

// ─── Nano Kit ─────────────────────────────────────────────────────────────────

describe('executeItemUse — nano_kit', () => {
  it('heals all alive squad members by 25% of their max HP', () => {
    const op1 = makeAlly('VANGUARD', 'Tank');
    const op2 = makeAlly('RECON', 'Scout');
    const maxHp1 = getEffectiveStats(op1).hp;
    const maxHp2 = getEffectiveStats(op2).hp;
    op1.currentHp = Math.floor(maxHp1 * 0.5);
    op2.currentHp = Math.floor(maxHp2 * 0.5);

    const hp1Before = op1.currentHp;
    const hp2Before = op2.currentHp;

    const stims = [makeStim('nano_kit')];
    const { squad } = executeItemUse('nano_kit', op1.id, [op1, op2], stims);

    expect(squad[0].currentHp).toBeGreaterThan(hp1Before);
    expect(squad[1].currentHp).toBeGreaterThan(hp2Before);
  });

  it('does not heal dead squad members', () => {
    const op1 = makeAlly('VANGUARD', 'Tank');
    const op2 = makeAlly('RECON', 'Dead');
    op2.alive = false;
    op2.currentHp = 0;

    const stims = [makeStim('nano_kit')];
    const { squad } = executeItemUse('nano_kit', op1.id, [op1, op2], stims);

    expect(squad[1].currentHp).toBe(0);
    expect(squad[1].alive).toBe(false);
  });
});

// ─── No-op when stim not found ────────────────────────────────────────────────

describe('executeItemUse — missing stim edge case', () => {
  it('returns unchanged squad when stim id is not in stims array', () => {
    const op = makeAlly('VANGUARD', 'Tank');
    op.currentHp = 50;
    const stims = [makeStim('health_stim')];

    const { squad, stims: remaining } = executeItemUse('nonexistent_stim', op.id, [op], stims);

    expect(squad[0].currentHp).toBe(50);
    expect(remaining.length).toBe(1); // stim not consumed
  });
});
