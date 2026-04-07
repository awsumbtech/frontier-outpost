import VanguardSprite from './classes/Vanguard';
import ReconSprite from './classes/Recon';
import EngineerSprite from './classes/Engineer';
import MedicSprite from './classes/Medic';

import FeralDroneSprite from './enemies/FeralDrone';
import ScavRaiderSprite from './enemies/ScavRaider';
import SporeBeastSprite from './enemies/SporeBeast';
import RogueMechSprite from './enemies/RogueMech';
import XenoStalkerSprite from './enemies/XenoStalker';
import HiveSwarmSprite from './enemies/HiveSwarm';
import HeavySentinelSprite from './enemies/HeavySentinel';
import PsiWraithSprite from './enemies/PsiWraith';
import ApexPredatorSprite from './enemies/ApexPredator';
import CoreGuardianSprite from './enemies/CoreGuardian';

import AttackSprite from './actions/Attack';
import AbilitySprite from './actions/Ability';
import ItemSprite from './actions/Item';
import DefendSprite from './actions/Defend';

import BleedSprite from './effects/Bleed';
import PoisonSprite from './effects/Poison';
import SlowSprite from './effects/Slow';
import WeakenSprite from './effects/Weaken';
import FortifySprite from './effects/Fortify';

import HealthStimSprite from './stims/HealthStim';
import ShieldCellSprite from './stims/ShieldCell';
import AdrenalineSprite from './stims/Adrenaline';
import NanoRepairSprite from './stims/NanoRepair';
import PurgeShotSprite from './stims/PurgeShot';

export const SPRITE_MAP = {
  // Classes
  vanguard: VanguardSprite,
  recon: ReconSprite,
  engineer: EngineerSprite,
  medic: MedicSprite,

  // Enemies
  feral_drone: FeralDroneSprite,
  scav_raider: ScavRaiderSprite,
  spore_beast: SporeBeastSprite,
  rogue_mech: RogueMechSprite,
  xeno_stalker: XenoStalkerSprite,
  hive_swarm: HiveSwarmSprite,
  heavy_sentinel: HeavySentinelSprite,
  psi_wraith: PsiWraithSprite,
  apex_predator: ApexPredatorSprite,
  core_guardian: CoreGuardianSprite,

  // Actions
  action_attack: AttackSprite,
  action_ability: AbilitySprite,
  action_item: ItemSprite,
  action_defend: DefendSprite,

  // Status effects
  bleed: BleedSprite,
  poison: PoisonSprite,
  slow: SlowSprite,
  weaken: WeakenSprite,
  fortify: FortifySprite,

  // Stims
  health_stim: HealthStimSprite,
  shield_cell: ShieldCellSprite,
  adrenaline: AdrenalineSprite,
  nano_kit: NanoRepairSprite,
  purge_shot: PurgeShotSprite,
};

/** Convert enemy display name to sprite key: "Feral Drone" → "feral_drone" */
export function enemySpriteKey(name) {
  return name.toLowerCase().replace(/[- ]/g, '_');
}

/** Convert classKey to sprite key: "VANGUARD" → "vanguard" */
export function classSpriteKey(classKey) {
  return classKey.toLowerCase();
}
