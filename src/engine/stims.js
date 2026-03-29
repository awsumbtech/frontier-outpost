import { getEffectiveStats } from './operatives';

export function applyStim(stimId, target, squad) {
  switch (stimId) {
    case 'health_stim': {
      const maxHp = getEffectiveStats(target).hp;
      target.currentHp = Math.min(maxHp, target.currentHp + Math.round(maxHp * 0.4));
      break;
    }
    case 'shield_cell': {
      const maxShield = getEffectiveStats(target).shield;
      target.currentShield = maxShield;
      break;
    }
    case 'nano_kit': {
      for (const op of squad.filter(o => o.alive)) {
        const maxHp = getEffectiveStats(op).hp;
        op.currentHp = Math.min(maxHp, op.currentHp + Math.round(maxHp * 0.25));
      }
      break;
    }
    case 'adrenaline': {
      // Adrenaline effect is handled in combat state — mark the target
      target._adrenalineRounds = 3;
      break;
    }
    case 'purge_shot': {
      // Purge effect is handled in combat state — mark the target
      target._purgeRounds = 2;
      break;
    }
  }
}
