import { ENVIRONMENTS } from '../data/environments';
import { MISSIONS } from '../data/missions';
import { ENEMY_TEMPLATES } from '../data/enemies';

export function getEnvironmentForMission(missionId) {
  const mission = MISSIONS.find(m => m.id === missionId);
  if (!mission?.environment) return null;
  return ENVIRONMENTS.find(e => e.id === mission.environment) || null;
}

export function getEnemyLore(enemyName) {
  const enemy = ENEMY_TEMPLATES.find(e => e.name === enemyName);
  return enemy?.lore || null;
}
