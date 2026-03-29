import { describe, it, expect } from 'vitest';
import { RARITY, RARITY_NAMES, RARITY_COLORS, CLASS_KEYS } from '../constants';
import { CLASSES } from '../classes';
import { STIM_TYPES, WEAPON_NAMES, ARMOR_NAMES, IMPLANT_NAMES, GADGET_NAMES } from '../gear';
import { ENEMY_TEMPLATES } from '../enemies';
import { MISSIONS } from '../missions';
import { STORY_CHAPTERS } from '../story';
import { DECISION_EVENTS } from '../decisions';
import { OP_NAMES } from '../operativeNames';

describe('constants', () => {
  it('RARITY has 5 tiers', () => {
    expect(Object.keys(RARITY)).toHaveLength(5);
    expect(RARITY.COMMON).toBe(0);
    expect(RARITY.PROTOTYPE).toBe(4);
  });

  it('RARITY_NAMES matches RARITY count', () => {
    expect(RARITY_NAMES).toHaveLength(5);
  });

  it('RARITY_COLORS matches RARITY count', () => {
    expect(RARITY_COLORS).toHaveLength(5);
    RARITY_COLORS.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('CLASS_KEYS has 4 classes', () => {
    expect(CLASS_KEYS).toEqual(["VANGUARD", "RECON", "ENGINEER", "MEDIC"]);
  });
});

describe('CLASSES', () => {
  it('has all 4 classes matching CLASS_KEYS', () => {
    for (const key of CLASS_KEYS) {
      expect(CLASSES[key]).toBeDefined();
    }
  });

  it('each class has required fields', () => {
    for (const key of CLASS_KEYS) {
      const cls = CLASSES[key];
      expect(cls.name).toBeTruthy();
      expect(cls.icon).toBeTruthy();
      expect(cls.color).toMatch(/^#/);
      expect(cls.desc).toBeTruthy();
      expect(cls.baseStats).toBeDefined();
      expect(cls.baseStats.hp).toBeGreaterThan(0);
      expect(cls.baseStats.damage).toBeGreaterThan(0);
    }
  });

  it('each class has 2 branches with 6 skills each', () => {
    for (const key of CLASS_KEYS) {
      const branches = Object.values(CLASSES[key].branches);
      expect(branches).toHaveLength(2);
      for (const branch of branches) {
        expect(branch.name).toBeTruthy();
        expect(branch.skills).toHaveLength(6);
        for (const skill of branch.skills) {
          expect(skill.name).toBeTruthy();
          expect(skill.cost).toBeGreaterThan(0);
          expect(skill.effect).toBeDefined();
        }
      }
    }
  });

  it('base stats have all 7 required stat keys', () => {
    const requiredStats = ['hp', 'armor', 'shield', 'damage', 'speed', 'crit', 'evasion'];
    for (const key of CLASS_KEYS) {
      for (const stat of requiredStats) {
        expect(CLASSES[key].baseStats[stat]).toBeDefined();
      }
    }
  });
});

describe('gear data', () => {
  it('STIM_TYPES has 5 stim types', () => {
    expect(STIM_TYPES).toHaveLength(5);
    STIM_TYPES.forEach(s => {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.cost).toBeGreaterThan(0);
    });
  });

  it('WEAPON_NAMES has entries for each class', () => {
    for (const key of CLASS_KEYS) {
      expect(WEAPON_NAMES[key]).toBeDefined();
      expect(WEAPON_NAMES[key].length).toBeGreaterThan(0);
    }
  });

  it('name pools are non-empty arrays of strings', () => {
    for (const pool of [ARMOR_NAMES, IMPLANT_NAMES, GADGET_NAMES]) {
      expect(pool.length).toBeGreaterThan(0);
      pool.forEach(name => expect(typeof name).toBe('string'));
    }
  });
});

describe('ENEMY_TEMPLATES', () => {
  it('has 10 enemies', () => {
    expect(ENEMY_TEMPLATES).toHaveLength(10);
  });

  it('each enemy has required fields', () => {
    ENEMY_TEMPLATES.forEach(e => {
      expect(e.name).toBeTruthy();
      expect(e.hp).toBeGreaterThan(0);
      expect(e.damage).toBeGreaterThan(0);
      expect(e.tier).toBeGreaterThanOrEqual(1);
      expect(e.tier).toBeLessThanOrEqual(4);
    });
  });

  it('has enemies in all 4 tiers', () => {
    for (let tier = 1; tier <= 4; tier++) {
      expect(ENEMY_TEMPLATES.filter(e => e.tier === tier).length).toBeGreaterThan(0);
    }
  });
});

describe('MISSIONS', () => {
  it('has 20 missions', () => {
    expect(MISSIONS).toHaveLength(20);
  });

  it('has 4 missions per chapter across 5 chapters', () => {
    for (let ch = 1; ch <= 5; ch++) {
      const chMissions = MISSIONS.filter(m => m.chapter === `ch${ch}`);
      expect(chMissions).toHaveLength(4);
    }
  });

  it('each mission has required fields', () => {
    MISSIONS.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(m.chapter).toMatch(/^ch[1-5]$/);
      expect(m.name).toBeTruthy();
      expect(m.encounters).toBeGreaterThan(0);
      expect(m.tier).toBeGreaterThanOrEqual(1);
      expect(m.xpMult).toBeGreaterThan(0);
      expect(m.recLevel).toBeGreaterThan(0);
    });
  });
});

describe('STORY_CHAPTERS', () => {
  it('has 5 chapters', () => {
    expect(STORY_CHAPTERS).toHaveLength(5);
  });

  it('each chapter has 3 beats', () => {
    STORY_CHAPTERS.forEach(ch => {
      expect(ch.id).toBeTruthy();
      expect(ch.title).toBeTruthy();
      expect(ch.intro).toBeTruthy();
      expect(ch.beats).toHaveLength(3);
      ch.beats.forEach(b => {
        expect(b.at).toBeGreaterThanOrEqual(0);
        expect(b.sender).toBeTruthy();
        expect(b.text).toBeTruthy();
      });
    });
  });
});

describe('DECISION_EVENTS', () => {
  it('has 5 events', () => {
    expect(DECISION_EVENTS).toHaveLength(5);
  });

  it('each event has 3 choices', () => {
    DECISION_EVENTS.forEach(e => {
      expect(e.title).toBeTruthy();
      expect(e.desc).toBeTruthy();
      expect(e.choices).toHaveLength(3);
      e.choices.forEach(c => {
        expect(c.text).toBeTruthy();
        expect(c.effect).toBeTruthy();
      });
    });
  });
});

describe('OP_NAMES', () => {
  it('has 15 names', () => {
    expect(OP_NAMES).toHaveLength(15);
  });

  it('all names are non-empty strings', () => {
    OP_NAMES.forEach(name => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });
});
