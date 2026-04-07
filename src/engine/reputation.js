// =============================================================================
// reputation.js — Compute reputation axes from decision history.
// Pure functions. No React, no side effects.
// =============================================================================

import { REPUTATION_AXES } from '../data/constants';

/**
 * Compute reputation scores from decisionHistory.
 * @param {Object} decisionHistory - { effectKey: missionId, ... }
 * @returns {{ heroic: number, ruthless: number, tactical: number }}
 */
export function computeReputation(decisionHistory) {
  const rep = { heroic: 0, ruthless: 0, tactical: 0 };
  if (!decisionHistory) return rep;

  for (const effectKey of Object.keys(decisionHistory)) {
    for (const [axis, effects] of Object.entries(REPUTATION_AXES)) {
      if (effects.includes(effectKey)) {
        rep[axis] += 1;
      }
    }
  }
  return rep;
}

/**
 * Get the dominant reputation axis (highest score), or null if all zero.
 * Ties broken by priority: tactical > heroic > ruthless.
 */
export function getDominantReputation(reputation) {
  const { heroic, ruthless, tactical } = reputation;
  if (heroic === 0 && ruthless === 0 && tactical === 0) return null;
  if (tactical >= heroic && tactical >= ruthless) return 'tactical';
  if (heroic >= ruthless) return 'heroic';
  return 'ruthless';
}

/**
 * Get combat modifiers based on reputation.
 * Returns an object with modifier fields applied during combat.
 */
export function getReputationCombatModifiers(reputation) {
  const mods = {
    allyDamageBonus: 0,     // % bonus damage for allies
    enemyDamageBonus: 0,    // % bonus damage for enemies
    lootQualityBonus: 0,    // added to rarity rolls
    xpMultiplier: 1.0,      // multiplied into XP
    ambushChanceReduction: 0, // % reduction in ambush decision frequency
  };

  // Heroic: rescued civilians provide XP bonus, fewer ambushes
  if (reputation.heroic >= 2) {
    mods.xpMultiplier += 0.1;  // +10% XP at 2+ heroic
    mods.ambushChanceReduction += 0.15;
  }
  if (reputation.heroic >= 4) {
    mods.xpMultiplier += 0.1;  // +20% total at 4+
  }

  // Ruthless: enemies hit harder, but better loot
  if (reputation.ruthless >= 2) {
    mods.enemyDamageBonus += 0.1;  // enemies +10% damage
    mods.lootQualityBonus += 1;     // +1 rarity tier chance
  }
  if (reputation.ruthless >= 4) {
    mods.enemyDamageBonus += 0.1;  // +20% total
    mods.lootQualityBonus += 1;     // +2 total
  }

  // Tactical: more predictable enemies, slight ally damage bonus
  if (reputation.tactical >= 2) {
    mods.allyDamageBonus += 0.05;  // +5% ally damage
  }
  if (reputation.tactical >= 4) {
    mods.allyDamageBonus += 0.05;  // +10% total
  }

  return mods;
}
