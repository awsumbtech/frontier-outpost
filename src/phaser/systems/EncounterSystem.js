import { TILE, ENCOUNTER_BASE_RATE, ENCOUNTER_ZONE_RATE, ENCOUNTER_COOLDOWN, ENCOUNTER_ESCALATION, ENCOUNTER_MAX_RATE } from "../../data/mapConstants";
import { createRng } from "../../engine/mapgen/seededRandom";

// Manages random encounter triggering based on player steps.
export default class EncounterSystem {
  constructor(encounterConfig, seed) {
    this.maxEncounters = encounterConfig.maxEncounters || 3;
    this.remainingEncounters = encounterConfig.remainingEncounters || this.maxEncounters;
    this.stepsSinceLastEncounter = 0;
    this.totalEncountersTriggered = 0;
    this.rng = createRng(seed + 9999); // offset seed from map gen
  }

  // Called each time the player takes a step. Returns true if an encounter triggers.
  checkStep(tileType) {
    if (this.remainingEncounters <= 0) return false;

    this.stepsSinceLastEncounter++;

    // Cooldown period — no encounters
    if (this.stepsSinceLastEncounter <= ENCOUNTER_COOLDOWN) return false;

    // Base rate depends on tile type
    const baseRate = tileType === TILE.ENCOUNTER_ZONE
      ? ENCOUNTER_ZONE_RATE
      : ENCOUNTER_BASE_RATE;

    // Escalating probability after cooldown
    const stepsOverCooldown = this.stepsSinceLastEncounter - ENCOUNTER_COOLDOWN;
    const escalation = Math.min(stepsOverCooldown * ENCOUNTER_ESCALATION, 0.40);
    const finalRate = Math.min(baseRate + escalation, ENCOUNTER_MAX_RATE);

    if (this.rng.chance(finalRate)) {
      this.triggerEncounter();
      return true;
    }
    return false;
  }

  triggerEncounter() {
    this.stepsSinceLastEncounter = 0;
    this.totalEncountersTriggered++;
    this.remainingEncounters--;
  }

  // Check if all encounters have been completed (exit should be available).
  isComplete() {
    return this.remainingEncounters <= 0;
  }

  getState() {
    return {
      remaining: this.remainingEncounters,
      total: this.maxEncounters,
      triggered: this.totalEncountersTriggered,
      stepsSinceLast: this.stepsSinceLastEncounter,
    };
  }
}
