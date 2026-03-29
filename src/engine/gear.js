import { WEAPON_NAMES, ARMOR_NAMES, IMPLANT_NAMES, GADGET_NAMES } from '../data/gear';
import { rng, pick, uid, rollRarity } from './utils';

export function generateGear(type, classKey, level = 1) {
  const rarity = rollRarity(level * 2);
  const mult = 1 + rarity * 0.3 + level * 0.1;
  const modSlots = Math.min(rarity, 3);
  if (type === "weapon") {
    return { id: uid(), type: "weapon", classKey, name: pick(WEAPON_NAMES[classKey] || WEAPON_NAMES.RECON), rarity, level, modSlots, mods: [],
      stats: { damage: Math.round(rng(8, 15) * mult), crit: Math.round(rng(2, 8) * (1 + rarity * 0.2)), armorPen: rarity >= 2 ? rng(5, 15) * rarity : 0 } };
  }
  if (type === "armor") {
    return { id: uid(), type: "armor", classKey: null, name: pick(ARMOR_NAMES), rarity, level, modSlots, mods: [],
      stats: { armor: Math.round(rng(5, 12) * mult), hp: Math.round(rng(10, 25) * mult), shield: rarity >= 1 ? Math.round(rng(5, 15) * mult) : 0, evasion: rarity >= 3 ? rng(3, 8) : 0 } };
  }
  if (type === "implant") {
    const primary = pick(["damage", "crit", "speed", "hp", "armor", "evasion"]);
    const stats = { [primary]: Math.round(rng(3, 10) * mult) };
    if (rarity >= 2) { const sec = pick(["damage", "crit", "speed", "hp"].filter(s => s !== primary)); stats[sec] = Math.round(rng(2, 6) * mult); }
    return { id: uid(), type: "implant", classKey: null, name: pick(IMPLANT_NAMES), rarity, level, modSlots: 0, mods: [], stats };
  }
  const eff = pick(["healBurst", "shieldBurst", "dmgBurst", "stunBurst"]);
  return { id: uid(), type: "gadget", classKey: null, name: pick(GADGET_NAMES), rarity, level, modSlots: 0, mods: [],
    stats: { [eff]: Math.round(rng(10, 25) * mult) }, uses: 1 + Math.floor(rarity / 2) };
}
