import { RARITY } from '../data/constants';

export const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const uid = () => Math.random().toString(36).slice(2, 10);

export function rollRarity(luck = 0) {
  const r = Math.random() * 100 + luck;
  if (r > 98) return RARITY.PROTOTYPE;
  if (r > 90) return RARITY.EPIC;
  if (r > 75) return RARITY.RARE;
  if (r > 50) return RARITY.UNCOMMON;
  return RARITY.COMMON;
}
