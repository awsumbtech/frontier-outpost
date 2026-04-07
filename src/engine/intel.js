// =============================================================================
// intel.js — Check read comms beats for tactical intel relevant to missions.
// Pure functions. No React, no side effects.
// =============================================================================

import { STORY_CHAPTERS } from '../data/story';

/**
 * Gather all intel from story beats that the player has READ.
 * @param {Object} storyBeatsRead - { "ch1-1": true, ... }
 * @returns {Array<{ type, targets, effect, missionIds, beatKey, sender }>}
 */
export function getReadIntel(storyBeatsRead) {
  const intel = [];
  if (!storyBeatsRead) return intel;

  for (const ch of STORY_CHAPTERS) {
    for (const beat of ch.beats) {
      if (!beat.intel) continue;
      const key = `${ch.id}-${beat.at}`;
      if (storyBeatsRead[key]) {
        intel.push({ ...beat.intel, beatKey: key, sender: beat.sender });
      }
    }
  }
  return intel;
}

/**
 * Get intel items relevant to a specific mission.
 * @param {string} missionId - e.g. "m1a"
 * @param {Object} storyBeatsRead - { "ch1-1": true, ... }
 * @returns {Array<{ type, targets, effect, missionIds, beatKey, sender }>}
 */
export function getIntelForMission(missionId, storyBeatsRead) {
  return getReadIntel(storyBeatsRead).filter(
    i => i.missionIds.includes(missionId)
  );
}

/**
 * Check if there is UNREAD intel relevant to a specific mission.
 * @param {string} missionId - e.g. "m1a"
 * @param {Object} storyBeatsRead - { "ch1-1": true, ... }
 * @param {number} missionsCompleted - current mission count
 * @returns {boolean}
 */
export function hasUnreadIntelForMission(missionId, storyBeatsRead, missionsCompleted) {
  for (const ch of STORY_CHAPTERS) {
    for (const beat of ch.beats) {
      if (!beat.intel) continue;
      if (!beat.intel.missionIds.includes(missionId)) continue;
      // Beat is available (unlocked) but not read
      const key = `${ch.id}-${beat.at}`;
      if (missionsCompleted >= beat.at && !storyBeatsRead?.[key]) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get combat modifiers from intel for a specific mission.
 * @param {string} missionId
 * @param {Object} storyBeatsRead
 * @returns {{ damageBonus: Object, combatLogEntries: Array, ambushUpgrade: boolean }}
 */
export function getIntelCombatModifiers(missionId, storyBeatsRead) {
  const intelItems = getIntelForMission(missionId, storyBeatsRead);
  const result = {
    damageBonus: {},      // { enemyName: multiplier } — e.g. { "Spore Beast": 0.2 }
    combatLogEntries: [], // messages to show at combat start
    ambushUpgrade: false, // true if "Ambush Detected" → "Ambush Anticipated"
    cacheBonus: false,    // true if bonus loot on this mission
    reinforcementWarning: false, // true if boss encounters are telegraphed
  };

  for (const item of intelItems) {
    switch (item.type) {
      case 'weakness':
        for (const target of (item.targets || [])) {
          result.damageBonus[target] = (result.damageBonus[target] || 0) + 0.2;
        }
        result.combatLogEntries.push({
          text: `INTEL: ${item.targets.join(', ')} — ${item.effect}`,
          type: 'intel',
        });
        break;
      case 'ambush':
        result.ambushUpgrade = true;
        result.combatLogEntries.push({
          text: `INTEL: Ambush locations identified — tactical advantage`,
          type: 'intel',
        });
        break;
      case 'cache':
        result.cacheBonus = true;
        result.combatLogEntries.push({
          text: `INTEL: Hidden supply cache located on this route`,
          type: 'intel',
        });
        break;
      case 'reinforcement':
        result.reinforcementWarning = true;
        result.combatLogEntries.push({
          text: `INTEL: Enemy reinforcements expected — prepare accordingly`,
          type: 'intel',
        });
        break;
    }
  }

  return result;
}
