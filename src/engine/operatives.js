import { CLASSES } from '../data/classes';
import { CLASS_BASE_RESOURCE } from '../data/constants';
import { uid } from './utils';

export function createOperative(classKey, name, traits = []) {
  const cls = CLASSES[classKey];
  return {
    id: uid(), name, classKey, className: cls.name, icon: cls.icon, spriteId: classKey.toLowerCase(), color: cls.color,
    level: 1, xp: 0, xpToLevel: 100, skillPoints: 1,
    baseStats: { ...cls.baseStats },
    gear: { weapon: null, armor: null, implant: null, gadget: null },
    skills: {}, alive: true, currentHp: cls.baseStats.hp, currentShield: cls.baseStats.shield,
    currentResource: CLASS_BASE_RESOURCE[classKey],
    traits,
  };
}

export function getEffectiveStats(op, squad = null) {
  const s = { ...op.baseStats };
  for (const slot of ["weapon", "armor", "implant", "gadget"]) {
    const g = op.gear[slot];
    if (g) for (const [k, v] of Object.entries(g.stats)) { if (typeof v === "number") s[k] = (s[k] || 0) + v; else s[k] = v; }
  }
  const cls = CLASSES[op.classKey];
  for (const [, branch] of Object.entries(cls.branches)) {
    for (const skill of branch.skills) {
      if (op.skills[skill.name]) for (const [k, v] of Object.entries(skill.effect)) { if (typeof v === "number") s[k] = (s[k] || 0) + v; else s[k] = v; }
    }
  }
  if (squad) {
    const auras = getAuraBuffs(squad);
    s.armor = (s.armor || 0) + auras.armor;
    s.crit = (s.crit || 0) + auras.crit;
    s.damage = (s.damage || 0) + auras.damage;
    s.speed = (s.speed || 0) + auras.speed;
    if (auras.hpCostPct > 0) s.hp = Math.round(s.hp * (1 - auras.hpCostPct));
  }
  return s;
}

export function getAuraBuffs(squad) {
  const auras = { armor: 0, crit: 0, damage: 0, speed: 0, hpCostPct: 0 };
  if (!squad) return auras;
  for (const op of squad) {
    if (!op.alive) continue;
    const s = getEffectiveStats(op); // raw stats without aura (no squad param)
    if (s.auraArmor) auras.armor += s.auraArmor;
    if (s.auraCrit) auras.crit += s.auraCrit;
    if (s.auraDamage) auras.damage += s.auraDamage;
    if (s.auraSpeed) auras.speed += s.auraSpeed;
    // Berserk Protocol buffs (treated as auras)
    if (s.berserkDmg) auras.damage += s.berserkDmg;
    if (s.berserkCrit) auras.crit += s.berserkCrit;
    if (s.berserkHpCost) auras.hpCostPct += s.berserkHpCost;
  }
  return auras;
}

export function xpForLevel(level) { return Math.floor(100 * Math.pow(1.4, level - 1)); }
