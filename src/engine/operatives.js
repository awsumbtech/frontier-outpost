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

export function getEffectiveStats(op) {
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
  return s;
}

export function xpForLevel(level) { return Math.floor(100 * Math.pow(1.4, level - 1)); }
