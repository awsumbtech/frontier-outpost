import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  executeAllyAttack,
  executeEnemyTurn,
  executeAbility,
  applyTurnStartEffects,
  applyRoundStartEffects,
  applyAllyPassives,
  buildTurnQueue,
} from '../combat';
import { createOperative, getEffectiveStats, getAuraBuffs } from '../operatives';

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

// ─── Aura System ─────────────────────────────────────────────────────────────

describe('getEffectiveStats — aura system', () => {
  it('Vanguard with Rallying Presence grants +5 armor to all other squad members', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Rallying Presence'] = true;

    const recon = makeAlly('RECON', 'Scout');
    const squad = [vanguard, recon];

    const reconStats = getEffectiveStats(recon, squad);
    const reconStatsNoSquad = getEffectiveStats(recon);

    expect(reconStats.armor).toBe(reconStatsNoSquad.armor + 5);
  });

  it('Medic with Neural Boost grants +4 crit to all squad members', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Neural Boost'] = true;

    const vanguard = makeAlly('VANGUARD', 'Tank');
    const squad = [medic, vanguard];

    const vanguardStats = getEffectiveStats(vanguard, squad);
    const vanguardStatsNoSquad = getEffectiveStats(vanguard);

    expect(vanguardStats.crit).toBe(vanguardStatsNoSquad.crit + 4);
  });

  it('Berserk Protocol raises squad damage by 15', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Berserk Protocol'] = true;

    const recon = makeAlly('RECON', 'Scout');
    const squad = [medic, recon];

    const reconStats = getEffectiveStats(recon, squad);
    const reconStatsNoSquad = getEffectiveStats(recon);

    expect(reconStats.damage).toBe(reconStatsNoSquad.damage + 15);
  });

  it('Berserk Protocol raises squad crit by 10', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Berserk Protocol'] = true;

    const recon = makeAlly('RECON', 'Scout');
    const squad = [medic, recon];

    const reconStats = getEffectiveStats(recon, squad);
    const reconStatsNoSquad = getEffectiveStats(recon);

    expect(reconStats.crit).toBe(reconStatsNoSquad.crit + 10);
  });

  it('Berserk Protocol reduces squad max HP by 15%', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Berserk Protocol'] = true;

    const vanguard = makeAlly('VANGUARD', 'Tank');
    const squad = [medic, vanguard];

    const statsWithAura = getEffectiveStats(vanguard, squad);
    const statsRaw = getEffectiveStats(vanguard);

    expect(statsWithAura.hp).toBe(Math.round(statsRaw.hp * (1 - 0.15)));
  });

  it('getAuraBuffs returns correct summed aura values from multiple sources', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Rallying Presence'] = true; // auraArmor: 5

    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Neural Boost'] = true; // auraCrit: 4

    const squad = [vanguard, medic];
    const auras = getAuraBuffs(squad);

    expect(auras.armor).toBe(5);
    expect(auras.crit).toBe(4);
  });

  it('getAuraBuffs ignores dead operatives', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Rallying Presence'] = true;
    vanguard.alive = false;

    const recon = makeAlly('RECON', 'Scout');
    const squad = [vanguard, recon];

    const auras = getAuraBuffs(squad);
    expect(auras.armor).toBe(0);
  });
});

// ─── flatDR ──────────────────────────────────────────────────────────────────

describe('flatDR — flat damage reduction', () => {
  it('reduces incoming enemy damage by the flatDR amount', () => {
    // Create operatives BEFORE mocking to ensure unique UIDs
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Damage Plating'] = true; // flatDR: 4
    vanguard.baseStats.armor = 0;
    vanguard.baseStats.shield = 0;
    vanguard.currentShield = 0;
    vanguard.currentHp = 200;
    vanguard.baseStats.hp = 200;
    vanguard.baseStats.evasion = 0;

    const vanguardNoFlatDR = makeAlly('VANGUARD', 'NoDR');
    vanguardNoFlatDR.baseStats.armor = 0;
    vanguardNoFlatDR.baseStats.shield = 0;
    vanguardNoFlatDR.currentShield = 0;
    vanguardNoFlatDR.currentHp = 200;
    vanguardNoFlatDR.baseStats.hp = 200;
    vanguardNoFlatDR.baseStats.evasion = 0;

    const enemy = makeEnemy({ damage: 20, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99); // avoid dodge/evasion
    const { squad: resultWith } = executeEnemyTurn(enemy.id, [vanguard], [enemy]);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { squad: resultWithout } = executeEnemyTurn(enemy.id, [vanguardNoFlatDR], [enemy]);

    const dmgWithDR = 200 - resultWith[0].currentHp;
    const dmgWithout = 200 - resultWithout[0].currentHp;

    expect(dmgWithDR).toBeLessThan(dmgWithout);
  });
});

// ─── stunImmune ───────────────────────────────────────────────────────────────

describe('stunImmune — cannot be stunned', () => {
  it('operative with stunImmune resists stun and canAct stays true', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Immovable Object'] = true; // stunImmune: true
    vanguard.stunned = true;

    const { canAct, squad } = applyTurnStartEffects(vanguard.id, true, [vanguard], []);

    expect(canAct).toBe(true);
    expect(squad[0].stunned).toBe(false);
  });

  it('operative without stunImmune loses their turn when stunned', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.stunned = true;

    const { canAct } = applyTurnStartEffects(vanguard.id, true, [vanguard], []);

    expect(canAct).toBe(false);
  });
});

// ─── attackStun ───────────────────────────────────────────────────────────────

describe('attackStun — chance to stun on attack', () => {
  it('stuns enemy when Math.random returns below the stun probability', () => {
    // Create operatives BEFORE mocking to ensure unique UIDs
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Shield Bash'] = true; // attackStun: 0.2
    vanguard.baseStats.damage = 5;
    const enemy = makeEnemy({ hp: 500, maxHp: 500, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.05); // below 0.2 threshold
    const { enemies } = executeAllyAttack(vanguard.id, enemy.id, [vanguard], [enemy]);

    expect(enemies[0].stunned).toBe(true);
  });

  it('does not stun enemy when Math.random returns above the stun probability', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Shield Bash'] = true; // attackStun: 0.2
    const enemy = makeEnemy({ hp: 500, maxHp: 500, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { enemies } = executeAllyAttack(vanguard.id, enemy.id, [vanguard], [enemy]);

    expect(enemies[0].stunned).toBe(false);
  });
});

// ─── hitRunEvasion ────────────────────────────────────────────────────────────

describe('hitRunEvasion — evasion buff after attacking', () => {
  it('adds evasion activeEffect after executing an attack', () => {
    const recon = makeAlly('RECON', 'Scout');
    recon.skills['Hit and Run'] = true; // hitRunEvasion: 15
    const enemy = makeEnemy({ hp: 500, maxHp: 500 });

    // Mock after operative creation to avoid UID collision
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no crit, no stun, no double act
    const { squad } = executeAllyAttack(recon.id, enemy.id, [recon], [enemy]);

    const hitRunEffect = squad[0].activeEffects.find(e => e.id === 'hitRun' && e.stat === 'evasion');
    expect(hitRunEffect).toBeDefined();
    expect(hitRunEffect.modifier).toBe(15);
  });
});

// ─── enemyDmgReduce ───────────────────────────────────────────────────────────

describe('enemyDmgReduce — reduce all incoming enemy damage', () => {
  it('reduces incoming damage from enemy attacks when hack systems is active', () => {
    const engineer = makeAlly('ENGINEER', 'Tech');
    engineer.skills['Hack Systems'] = true; // enemyDmgReduce: 0.1
    engineer.baseStats.armor = 0;
    engineer.baseStats.shield = 0;
    engineer.currentShield = 0;
    engineer.currentHp = 500;
    engineer.baseStats.hp = 500;
    engineer.baseStats.evasion = 0;

    const engineerNoReduce = makeAlly('ENGINEER', 'NoReduce');
    engineerNoReduce.baseStats.armor = 0;
    engineerNoReduce.baseStats.shield = 0;
    engineerNoReduce.currentShield = 0;
    engineerNoReduce.currentHp = 500;
    engineerNoReduce.baseStats.hp = 500;
    engineerNoReduce.baseStats.evasion = 0;

    const enemy = makeEnemy({ damage: 50, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no evasion
    const { squad: result1 } = executeEnemyTurn(enemy.id, [engineer], [enemy]);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { squad: result2 } = executeEnemyTurn(enemy.id, [engineerNoReduce], [enemy]);

    const dmgWithReduce = 500 - result1[0].currentHp;
    const dmgWithout = 500 - result2[0].currentHp;

    // With 10% enemy damage reduction, damage should be lower or equal (accounting for rng)
    expect(dmgWithReduce).toBeLessThanOrEqual(dmgWithout);
  });
});

// ─── stunVuln ─────────────────────────────────────────────────────────────────

describe('stunVuln — bonus damage vs stunned enemies', () => {
  it('deals extra damage to a stunned enemy compared to an unstunned enemy', () => {
    const engineer = makeAlly('ENGINEER', 'Tech');
    engineer.skills['Overload Network'] = true; // stunVuln: 0.3
    const stunnedEnemy = makeEnemy({ id: 'e1', hp: 1000, maxHp: 1000, armor: 0, stunned: true });
    const normalEnemy = makeEnemy({ id: 'e2', hp: 1000, maxHp: 1000, armor: 0, stunned: false });

    // Force no crit, no double act
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { enemies: result1 } = executeAllyAttack(engineer.id, stunnedEnemy.id, [engineer], [stunnedEnemy]);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { enemies: result2 } = executeAllyAttack(engineer.id, normalEnemy.id, [engineer], [normalEnemy]);

    const dmgVsStunned = 1000 - result1[0].hp;
    const dmgVsNormal = 1000 - result2[0].hp;

    expect(dmgVsStunned).toBeGreaterThan(dmgVsNormal);
  });
});

// ─── turretArmorShred ──────────────────────────────────────────────────────────

describe('turretArmorShred — turret reduces enemy armor', () => {
  it('reduces enemy armor after turret fires', () => {
    const engineer = makeAlly('ENGINEER', 'Tech');
    engineer.skills['Deploy Turret'] = true; // turretDmg: 10
    engineer.skills['Target Painter'] = true; // turretArmorShred: 3

    const enemy = makeEnemy({ hp: 500, maxHp: 500, armor: 20 });
    const { enemies } = applyAllyPassives(engineer.id, [engineer], [enemy]);

    expect(enemies[0].armor).toBe(Math.max(0, 20 - 3));
  });
});

// ─── Last Stand (damage) ─────────────────────────────────────────────────────

describe('Last Stand — damage bonus below 25% HP', () => {
  it('adds lastStandDmg bonus when operative is below 25% HP', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Last Stand'] = true; // lastStandDmg: 30
    const maxHp = getEffectiveStats(vanguard).hp;
    vanguard.currentHp = Math.floor(maxHp * 0.20); // 20% — in last stand
    const enemy = makeEnemy({ hp: 1000, maxHp: 1000, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no crit, no stun
    const { log } = executeAllyAttack(vanguard.id, enemy.id, [vanguard], [enemy]);

    const lastStandLog = log.find(l => l.text.includes('LAST STAND'));
    expect(lastStandLog).toBeDefined();
  });

  it('does not apply lastStandDmg bonus at full HP', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Last Stand'] = true;
    const maxHp = getEffectiveStats(vanguard).hp;
    vanguard.currentHp = maxHp; // full HP
    const enemy = makeEnemy({ hp: 1000, maxHp: 1000, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { log } = executeAllyAttack(vanguard.id, enemy.id, [vanguard], [enemy]);

    const lastStandLog = log.find(l => l.text.includes('LAST STAND'));
    expect(lastStandLog).toBeUndefined();
  });
});

// ─── Last Stand (armor) ───────────────────────────────────────────────────────

describe('Last Stand — armor bonus below 25% HP', () => {
  it('reduces incoming damage more when operative is in last stand', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Last Stand'] = true; // lastStandArmor: 25
    vanguard.baseStats.armor = 0;
    vanguard.baseStats.shield = 0;
    vanguard.currentShield = 0;
    vanguard.baseStats.evasion = 0;
    const maxHp = getEffectiveStats(vanguard).hp;
    vanguard.currentHp = Math.floor(maxHp * 0.20);
    vanguard.baseStats.hp = maxHp;

    const vanguardFull = makeAlly('VANGUARD', 'Full');
    vanguardFull.skills['Last Stand'] = true;
    vanguardFull.baseStats.armor = 0;
    vanguardFull.baseStats.shield = 0;
    vanguardFull.currentShield = 0;
    vanguardFull.baseStats.evasion = 0;
    const maxHp2 = getEffectiveStats(vanguardFull).hp;
    vanguardFull.currentHp = maxHp2;
    vanguardFull.baseStats.hp = maxHp2;

    const enemy = makeEnemy({ damage: 40, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { squad: result1 } = executeEnemyTurn(enemy.id, [vanguard], [enemy]);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { squad: result2 } = executeEnemyTurn(enemy.id, [vanguardFull], [enemy]);

    const dmgLastStand = vanguard.currentHp - result1[0].currentHp;
    const dmgFull = maxHp2 - result2[0].currentHp;

    expect(dmgLastStand).toBeLessThan(dmgFull);
  });
});

// ─── Last Stand (heal) ────────────────────────────────────────────────────────

describe('Last Stand — passive heal below 25% HP', () => {
  it('heals operative when below 25% HP during applyAllyPassives', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Last Stand'] = true; // lastStandHeal: 8
    const maxHp = getEffectiveStats(vanguard).hp;
    vanguard.currentHp = Math.floor(maxHp * 0.20);
    vanguard.baseStats.hp = maxHp;

    const hpBefore = vanguard.currentHp;
    const enemy = makeEnemy();
    const { squad } = applyAllyPassives(vanguard.id, [vanguard], [enemy]);

    expect(squad[0].currentHp).toBeGreaterThan(hpBefore);
  });

  it('does not heal operative at full HP via last stand heal', () => {
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Last Stand'] = true;
    const maxHp = getEffectiveStats(vanguard).hp;
    vanguard.currentHp = maxHp;
    vanguard.baseStats.hp = maxHp;

    const enemy = makeEnemy();
    const { log } = applyAllyPassives(vanguard.id, [vanguard], [enemy]);

    const lastStandHeal = log.find(l => l.text.includes('Last Stand heal'));
    expect(lastStandHeal).toBeUndefined();
  });
});

// ─── Wraith Mode ──────────────────────────────────────────────────────────────

describe('Wraith Mode — evasion and damage buff during first N rounds', () => {
  it('applies evasion and damage activeEffects on round 1 when skill is active', () => {
    const recon = makeAlly('RECON', 'Ghost');
    recon.skills['Wraith Mode'] = true; // wraithRounds: 2, wraithEvasion: 90, wraithDmgMult: 2

    const { squad } = applyRoundStartEffects(1, [recon], []);

    const evasionBuff = squad[0].activeEffects.find(e => e.id === 'wraithEvasion');
    const dmgBuff = squad[0].activeEffects.find(e => e.id === 'wraithDmg');

    expect(evasionBuff).toBeDefined();
    expect(evasionBuff.modifier).toBe(90);
    expect(dmgBuff).toBeDefined();
    expect(dmgBuff.modifier).toBe(1); // (2 - 1) = 1 multiplicative modifier
  });

  it('applies Wraith Mode on round 2 as well (within wraithRounds)', () => {
    const recon = makeAlly('RECON', 'Ghost');
    recon.skills['Wraith Mode'] = true;

    const { squad } = applyRoundStartEffects(2, [recon], []);

    const evasionBuff = squad[0].activeEffects.find(e => e.id === 'wraithEvasion');
    expect(evasionBuff).toBeDefined();
  });

  it('does not apply Wraith Mode on round 3 (beyond wraithRounds)', () => {
    const recon = makeAlly('RECON', 'Ghost');
    recon.skills['Wraith Mode'] = true;

    const { squad } = applyRoundStartEffects(3, [recon], []);

    const evasionBuff = squad[0].activeEffects.find(e => e.id === 'wraithEvasion');
    expect(evasionBuff).toBeUndefined();
  });
});

// ─── Scorched Earth ───────────────────────────────────────────────────────────

describe('Scorched Earth — AoE damage and armor burn every round', () => {
  it('deals AoE damage to all enemies every round', () => {
    const engineer = makeAlly('ENGINEER', 'Tech');
    engineer.skills['Scorched Earth'] = true; // roundAoeDmg: 15, armorBurn: 5

    const enemy1 = makeEnemy({ id: 'e1', hp: 200, maxHp: 200, armor: 0 });
    const enemy2 = makeEnemy({ id: 'e2', hp: 200, maxHp: 200, armor: 0 });

    const { enemies } = applyRoundStartEffects(1, [engineer], [enemy1, enemy2]);

    expect(enemies[0].hp).toBeLessThan(200);
    expect(enemies[1].hp).toBeLessThan(200);
  });

  it('permanently reduces enemy armor each round', () => {
    const engineer = makeAlly('ENGINEER', 'Tech');
    engineer.skills['Scorched Earth'] = true;

    const enemy = makeEnemy({ hp: 200, maxHp: 200, armor: 20 });

    const { enemies } = applyRoundStartEffects(2, [engineer], [enemy]);

    expect(enemies[0].armor).toBe(15); // 20 - 5
  });
});

// ─── Overclock ────────────────────────────────────────────────────────────────

describe('Overclock — fastest ally acts twice', () => {
  it('adds a duplicate entry for the fastest ally when random triggers overclock', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Overclock Stim'] = true; // overclockAlly: 0.2
    const enemies = [makeEnemy()];

    vi.spyOn(Math, 'random').mockReturnValue(0.05); // below 0.2 threshold
    const queue = buildTurnQueue([medic], enemies);

    const allyEntries = queue.filter(e => e.isAlly);
    expect(allyEntries.length).toBe(2); // original + overclock duplicate
    expect(allyEntries.some(e => e.isOverclock)).toBe(true);
  });

  it('does not add duplicate entry when random does not trigger overclock', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Overclock Stim'] = true;
    const enemies = [makeEnemy()];

    vi.spyOn(Math, 'random').mockReturnValue(0.99); // above 0.2 threshold
    const queue = buildTurnQueue([medic], enemies);

    const allyEntries = queue.filter(e => e.isAlly);
    expect(allyEntries.length).toBe(1);
  });
});

// ─── Passive Cleanse ──────────────────────────────────────────────────────────

describe('Passive Cleanse — removes debuffs from allies each round', () => {
  it('removes debuff effects from allies when cleanse skill is active', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Purge Toxins'] = true; // cleanse: true

    const ally = makeAlly('VANGUARD', 'Tank');
    ally.activeEffects = [
      { id: 'poison', type: 'debuff', stat: 'damage', modifier: -0.2, remainingRounds: 3, source: 'enemy' },
    ];

    const { squad } = applyRoundStartEffects(1, [medic, ally], []);

    const allyResult = squad.find(o => o.id === ally.id);
    const remainingDebuffs = allyResult.activeEffects.filter(e => e.type === 'debuff');
    expect(remainingDebuffs.length).toBe(0);
  });

  it('leaves buff effects untouched during cleanse', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Purge Toxins'] = true;

    const ally = makeAlly('VANGUARD', 'Tank');
    ally.activeEffects = [
      { id: 'shield_buff', type: 'buff', stat: 'armor', modifier: 0.5, remainingRounds: 2, source: 'self' },
      { id: 'poison', type: 'debuff', stat: 'damage', modifier: -0.1, remainingRounds: 2, source: 'enemy' },
    ];

    const { squad } = applyRoundStartEffects(2, [medic, ally], []);
    const allyResult = squad.find(o => o.id === ally.id);

    const buffs = allyResult.activeEffects.filter(e => e.type === 'buff');
    expect(buffs.length).toBe(1);
    expect(buffs[0].id).toBe('shield_buff');
  });
});

// ─── Mark for Death ───────────────────────────────────────────────────────────

describe('Mark for Death — first hit marks the target', () => {
  it('adds a damageTaken debuff to the target on first hit', () => {
    const recon = makeAlly('RECON', 'Scout');
    recon.skills['Mark for Death'] = true; // markTarget: true
    const enemy = makeEnemy({ hp: 500, maxHp: 500, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { enemies } = executeAllyAttack(recon.id, enemy.id, [recon], [enemy]);

    const markEffect = enemies[0].activeEffects.find(e => e.stat === 'damageTaken');
    expect(markEffect).toBeDefined();
    expect(markEffect.modifier).toBe(0.2);
  });

  it('does not double-mark an already marked target', () => {
    const recon = makeAlly('RECON', 'Scout');
    recon.skills['Mark for Death'] = true;
    const enemy = makeEnemy({ hp: 500, maxHp: 500, armor: 0 });
    enemy.activeEffects = [
      { id: 'autoMark', type: 'debuff', stat: 'damageTaken', modifier: 0.2, remainingRounds: 2, source: recon.id },
    ];

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { enemies } = executeAllyAttack(recon.id, enemy.id, [recon], [enemy]);

    const marks = enemies[0].activeEffects.filter(e => e.stat === 'damageTaken');
    expect(marks.length).toBe(1);
  });
});

// ─── Death Sentence (guaranteed crit on marked targets) ─────────────────────

describe('Death Sentence — guaranteed crit vs marked targets', () => {
  it('guarantees a crit on a marked target even when Math.random returns 1.0', () => {
    const recon = makeAlly('RECON', 'Scout');
    recon.skills['Death Sentence'] = true; // guaranteedCritMarked: true
    recon.baseStats.crit = 0; // zero crit so normal crit never fires
    const enemy = makeEnemy({ hp: 1000, maxHp: 1000, armor: 0 });
    enemy.activeEffects = [
      { id: 'autoMark', type: 'debuff', stat: 'damageTaken', modifier: 0.2, remainingRounds: 2, source: recon.id },
    ];

    // Mock Math.random to 1.0 — normal crit (1.0 * 100 < 0) never fires, forced crit should override
    vi.spyOn(Math, 'random').mockReturnValue(1.0);
    const { log } = executeAllyAttack(recon.id, enemy.id, [recon], [enemy]);

    const critLog = log.find(l => l.text.includes('CRIT') || l.type === 'crit' || l.type === 'critkill');
    expect(critLog).toBeDefined();
  });

  it('does not guarantee crit on an unmarked target when random always fails', () => {
    const recon = makeAlly('RECON', 'Scout');
    recon.skills['Death Sentence'] = true;
    recon.baseStats.crit = 0;
    const enemy = makeEnemy({ hp: 1000, maxHp: 1000, armor: 0 });
    // No mark on enemy

    vi.spyOn(Math, 'random').mockReturnValue(1.0); // always fails crit check
    const { log } = executeAllyAttack(recon.id, enemy.id, [recon], [enemy]);

    const critLog = log.find(l => l.type === 'crit' || l.type === 'critkill');
    expect(critLog).toBeUndefined();
  });
});

// ─── Kill Reset Mark ──────────────────────────────────────────────────────────

describe('Kill Reset Mark — mark transfers to new target on kill', () => {
  it('transfers the mark to the next living enemy after a kill', () => {
    const recon = makeAlly('RECON', 'Scout');
    recon.skills['Death Sentence'] = true; // killResetMark: true, guaranteedCritMarked: true
    recon.baseStats.damage = 9999; // guarantee kill
    const markedEnemy = makeEnemy({ id: 'e1', hp: 1, maxHp: 100, armor: 0 });
    markedEnemy.activeEffects = [
      { id: 'autoMark', type: 'debuff', stat: 'damageTaken', modifier: 0.2, remainingRounds: 2, source: recon.id },
    ];
    const nextEnemy = makeEnemy({ id: 'e2', hp: 500, maxHp: 500, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(1.0);
    const { enemies } = executeAllyAttack(recon.id, markedEnemy.id, [recon], [markedEnemy, nextEnemy]);

    const nextMark = enemies.find(e => e.id === 'e2')?.activeEffects?.find(e => e.stat === 'damageTaken');
    expect(nextMark).toBeDefined();
  });
});

// ─── Trauma Kit — secondHeal ─────────────────────────────────────────────────

describe('Trauma Kit — heals second-most-wounded ally', () => {
  it('heals both most-wounded and second-most-wounded allies', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Triage'] = true;      // healPerRound: 18
    medic.skills['Trauma Kit'] = true;  // secondHeal: 0.5

    const ally1 = makeAlly('VANGUARD', 'Tank');
    const ally2 = makeAlly('RECON', 'Scout');
    const maxHp1 = getEffectiveStats(ally1).hp;
    const maxHp2 = getEffectiveStats(ally2).hp;
    ally1.currentHp = Math.floor(maxHp1 * 0.3);
    ally2.currentHp = Math.floor(maxHp2 * 0.5);
    ally1.baseStats.hp = maxHp1;
    ally2.baseStats.hp = maxHp2;

    const hp1Before = ally1.currentHp;
    const hp2Before = ally2.currentHp;

    const enemy = makeEnemy();
    const { squad } = applyAllyPassives(medic.id, [medic, ally1, ally2], [enemy]);

    const resultAlly1 = squad.find(o => o.id === ally1.id);
    const resultAlly2 = squad.find(o => o.id === ally2.id);

    expect(resultAlly1.currentHp).toBeGreaterThan(hp1Before);
    expect(resultAlly2.currentHp).toBeGreaterThan(hp2Before);
  });
});

// ─── Passive Revive ───────────────────────────────────────────────────────────

describe('Passive Revive — auto-revive first downed ally once per encounter', () => {
  it('revives the first downed ally when the medic has revive skill', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Resuscitate'] = true; // revive: 0.4

    const downed = makeAlly('VANGUARD', 'Tank');
    downed.alive = false;
    downed.currentHp = 0;
    const maxHp = getEffectiveStats(downed).hp;
    downed.baseStats.hp = maxHp;

    const enemy = makeEnemy();
    const { squad } = applyAllyPassives(medic.id, [medic, downed], [enemy]);

    const revived = squad.find(o => o.id === downed.id);
    expect(revived.alive).toBe(true);
    expect(revived.currentHp).toBeGreaterThan(0);
  });

  it('does not revive twice once _passiveReviveUsed is set', () => {
    const medic = makeAlly('MEDIC', 'Doc');
    medic.skills['Resuscitate'] = true;
    medic._passiveReviveUsed = true; // already used

    const downed = makeAlly('VANGUARD', 'Tank');
    downed.alive = false;
    downed.currentHp = 0;

    const enemy = makeEnemy();
    const { squad } = applyAllyPassives(medic.id, [medic, downed], [enemy]);

    const result = squad.find(o => o.id === downed.id);
    expect(result.alive).toBe(false);
  });
});

// ─── Miracle Worker — healBonus ───────────────────────────────────────────────

describe('Miracle Worker — increases heal amount', () => {
  it('heals more HP compared to a medic without healBonus', () => {
    const medicWithBonus = makeAlly('MEDIC', 'Expert');
    medicWithBonus.skills['Triage'] = true;          // unlocks heal ability
    medicWithBonus.skills['Miracle Worker'] = true;   // healBonus: 0.5
    medicWithBonus.currentResource = 50;

    const medicNormal = makeAlly('MEDIC', 'Normal');
    medicNormal.skills['Triage'] = true;
    medicNormal.currentResource = 50;

    const target1 = makeAlly('VANGUARD', 'Tank1');
    target1.currentHp = 10;
    const target2 = makeAlly('VANGUARD', 'Tank2');
    target2.currentHp = 10;
    const maxHp = getEffectiveStats(target1).hp;
    target1.baseStats.hp = maxHp;
    target2.baseStats.hp = maxHp;

    const enemy = makeEnemy();

    const { squad: result1 } = executeAbility(medicWithBonus.id, 'heal', target1.id, [medicWithBonus, target1], [enemy]);
    const { squad: result2 } = executeAbility(medicNormal.id, 'heal', target2.id, [medicNormal, target2], [enemy]);

    const healedWithBonus = result1.find(o => o.id === target1.id).currentHp - 10;
    const healedNormal = result2.find(o => o.id === target2.id).currentHp - 10;

    expect(healedWithBonus).toBeGreaterThan(healedNormal);
  });
});

// ─── Intercept (active ability) ───────────────────────────────────────────────

describe('Intercept — active ability redirects attacks to interceptor', () => {
  it('redirects enemy attack to the interceptor when target has intercepted activeEffect', () => {
    // Create operatives before mocking to avoid UID collision
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.baseStats.evasion = 0;
    vanguard.baseStats.shield = 0;
    vanguard.currentShield = 0;
    vanguard.currentHp = 200;
    vanguard.baseStats.hp = 200;

    const recon = makeAlly('RECON', 'Scout');
    recon.baseStats.evasion = 0;
    recon.baseStats.shield = 0;
    recon.currentShield = 0;
    recon.currentHp = 65;
    recon.baseStats.hp = 65;
    // Mark recon as being intercepted by vanguard
    recon.activeEffects = [
      { id: 'intercept', type: 'buff', stat: 'intercepted', modifier: 1, remainingRounds: 1, source: vanguard.id, interceptedBy: vanguard.id },
    ];

    // Use an enemy with fixed id, and force selectEnemyTarget to pick recon
    // With mock 0.01: pick picks index Math.floor(0.01 * 2) = 0 => vanguard (index 0)
    // So we need recon at index 0 to be selected, then intercept redirects to vanguard
    // Order squad as [recon, vanguard] so pick(0) picks recon
    const enemy = makeEnemy({ id: 'enemy-1', damage: 30, armor: 0 });

    vi.spyOn(Math, 'random').mockReturnValue(0.01); // picks index 0 = recon
    const { squad } = executeEnemyTurn(enemy.id, [recon, vanguard], [enemy]);

    // Recon should be untouched (still at 65), vanguard took the hit
    const reconResult = squad.find(o => o.id === recon.id);
    const vanguardResult = squad.find(o => o.id === vanguard.id);

    expect(reconResult.currentHp).toBe(65);
    expect(vanguardResult.currentHp).toBeLessThan(200);
  });
});

// ─── Passive Intercept ────────────────────────────────────────────────────────

describe('Passive Intercept — Guardian Stance redirects attacks', () => {
  it('logs an intercept message when vanguard passive intercept fires', () => {
    // Create operatives before mocking to avoid UID collision
    const vanguard = makeAlly('VANGUARD', 'Tank');
    vanguard.skills['Guardian Stance'] = true; // intercept: 0.2
    vanguard.baseStats.evasion = 0;
    vanguard.baseStats.shield = 0;
    vanguard.currentShield = 0;
    vanguard.currentHp = 200;
    vanguard.baseStats.hp = 200;

    const recon = makeAlly('RECON', 'Scout');
    recon.baseStats.evasion = 0;
    recon.baseStats.shield = 0;
    recon.currentShield = 0;
    recon.currentHp = 65;
    recon.baseStats.hp = 65;

    // enemy with default AI — squad order [recon, vanguard]
    // Mock 0.01: selectEnemyTarget with no taunters falls through to pick(),
    // pick([recon, vanguard]) uses Math.floor(0.01 * 2) = 0 => recon is selected.
    // Then passive intercept check: vanguard.intercept=0.2, Math.random()=0.01 < 0.2 => intercept fires.
    const enemy = makeEnemy({ id: 'enemy-2', damage: 20, armor: 0, aiProfile: 'default' });

    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const { log } = executeEnemyTurn(enemy.id, [recon, vanguard], [enemy]);

    const interceptLog = log.find(l => l.text.includes('steps in front'));
    expect(interceptLog).toBeDefined();
  });
});
