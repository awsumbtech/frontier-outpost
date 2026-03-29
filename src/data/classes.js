export const CLASSES = {
  VANGUARD: {
    name: "Vanguard", icon: "🛡️", color: "#3b82f6",
    desc: "Heavy frontliner. Draws fire, absorbs hits, protects the squad.",
    baseStats: { hp: 140, armor: 18, shield: 25, damage: 10, speed: 7, crit: 2, evasion: 1 },
    branches: {
      BULWARK: {
        name: "Bulwark", desc: "Immovable wall",
        skills: [
          { name: "Fortify", desc: "+15 Armor, +10 HP", cost: 1, effect: { armor: 15, hp: 10 } },
          { name: "Shield Capacitor", desc: "+25 Shield, regen 5 shield/rd", cost: 1, effect: { shield: 25, shieldRegen: 5 } },
          { name: "Provoke", desc: "70% chance enemies target you", cost: 1, effect: { taunt: 0.7 } },
          { name: "Damage Plating", desc: "Flat -4 dmg from all hits", cost: 2, effect: { flatDR: 4 } },
          { name: "Kinetic Absorb", desc: "30% dmg redirected to shield", cost: 2, effect: { shieldRedirect: 0.3 } },
          { name: "Immovable Object", desc: "+60 HP, +20 Armor. Cannot be stunned", cost: 3, effect: { hp: 60, armor: 20, stunImmune: true } },
        ]
      },
      WARDEN: {
        name: "Warden", desc: "Protective guardian",
        skills: [
          { name: "Cover Fire", desc: "+8 Damage when protecting allies", cost: 1, effect: { damage: 8 } },
          { name: "Guardian Stance", desc: "20% chance to intercept hits on allies", cost: 1, effect: { intercept: 0.2 } },
          { name: "Rallying Presence", desc: "All allies +5 Armor", cost: 1, effect: { auraArmor: 5 } },
          { name: "Shield Bash", desc: "Attacks have 20% stun chance", cost: 2, effect: { attackStun: 0.2 } },
          { name: "Fortress Protocol", desc: "Intercept chance +15%, take 20% less when intercepting", cost: 2, effect: { intercept: 0.15, interceptDR: 0.2 } },
          { name: "Last Stand", desc: "Below 25% HP: +30 Dmg, +25 Armor, heal 8/rd", cost: 3, effect: { lastStandDmg: 30, lastStandArmor: 25, lastStandHeal: 8 } },
        ]
      }
    }
  },
  RECON: {
    name: "Recon", icon: "🎯", color: "#ef4444",
    desc: "Precision killer. Marks targets, exploits weaknesses, strikes lethally.",
    baseStats: { hp: 65, armor: 4, shield: 8, damage: 24, speed: 17, crit: 20, evasion: 16 },
    branches: {
      ASSASSIN: {
        name: "Assassin", desc: "Single-target annihilator",
        skills: [
          { name: "Weak Point Analysis", desc: "+12% Crit, +8% Armor Pen", cost: 1, effect: { crit: 12, armorPen: 8 } },
          { name: "Lethal Edge", desc: "+10 Damage", cost: 1, effect: { damage: 10 } },
          { name: "Mark for Death", desc: "First hit marks target, all allies deal +20% to marked", cost: 1, effect: { markTarget: true } },
          { name: "Execute Protocol", desc: "3x crit dmg vs targets below 30% HP", cost: 2, effect: { executeCrit: 3 } },
          { name: "Bleed Toxin", desc: "Crits apply 8 bleed/rd for 3 rds", cost: 2, effect: { critBleed: 8 } },
          { name: "Death Sentence", desc: "Guaranteed crit vs marked targets. Kills reset mark to new target", cost: 3, effect: { guaranteedCritMarked: true, killResetMark: true } },
        ]
      },
      GHOST: {
        name: "Ghost", desc: "Untouchable phantom",
        skills: [
          { name: "Shadowstep", desc: "+12% Evasion", cost: 1, effect: { evasion: 12 } },
          { name: "Smoke Screen", desc: "+8% Evasion, +5% Crit", cost: 1, effect: { evasion: 8, crit: 5 } },
          { name: "Hit and Run", desc: "After attacking, +15% evasion until next turn", cost: 1, effect: { hitRunEvasion: 15 } },
          { name: "Phantom Strike", desc: "30% chance to act twice", cost: 2, effect: { doubleAct: 0.3 } },
          { name: "Evade Counter", desc: "Dodged attacks = counter for 60% dmg", cost: 2, effect: { evadeCounter: 0.6 } },
          { name: "Wraith Mode", desc: "First 2 rounds: 90% evasion + double damage", cost: 3, effect: { wraithRounds: 2, wraithEvasion: 90, wraithDmgMult: 2 } },
        ]
      }
    }
  },
  ENGINEER: {
    name: "Engineer", icon: "⚙️", color: "#f59e0b",
    desc: "Tech controller. Deploys systems, hacks enemies, controls the field.",
    baseStats: { hp: 85, armor: 10, shield: 18, damage: 14, speed: 10, crit: 5, evasion: 4 },
    branches: {
      TURRET_MASTER: {
        name: "Machinist", desc: "Automated war machines",
        skills: [
          { name: "Deploy Turret", desc: "Turret deals 10 dmg/round", cost: 1, effect: { turretDmg: 10 } },
          { name: "Reinforced Frame", desc: "Turret +5 dmg, survives 1 EMP", cost: 1, effect: { turretDmg: 5 } },
          { name: "Target Painter", desc: "Turret shots reduce target armor by 3", cost: 1, effect: { turretArmorShred: 3 } },
          { name: "Dual Deployment", desc: "Second turret at 70% power", cost: 2, effect: { dualTurret: 0.7 } },
          { name: "Siege Protocols", desc: "Turrets ignore 50% armor, +5 dmg", cost: 2, effect: { turretArmorPen: 50, turretDmg: 5 } },
          { name: "Orbital Uplink", desc: "Every 3rd round: orbital strike 45 AoE. Turret damage +10", cost: 3, effect: { orbitalDmg: 45, orbitalCd: 3, turretDmg: 10 } },
        ]
      },
      SABOTEUR: {
        name: "Saboteur", desc: "Disruption and area denial",
        skills: [
          { name: "Frag Charge", desc: "+12 AoE dmg to random attacks", cost: 1, effect: { aoeDmg: 12 } },
          { name: "EMP Pulse", desc: "18% chance to stun any enemy each round", cost: 1, effect: { stunChance: 18 } },
          { name: "Hack Systems", desc: "Reduce all enemy damage by 10%", cost: 1, effect: { enemyDmgReduce: 0.1 } },
          { name: "Cluster Mines", desc: "25 AoE at encounter start", cost: 2, effect: { minesDmg: 25 } },
          { name: "Overload Network", desc: "Stunned enemies take +30% dmg from all sources", cost: 2, effect: { stunVuln: 0.3 } },
          { name: "Scorched Earth", desc: "Every round: 15 AoE to all enemies. -5 their armor permanently", cost: 3, effect: { roundAoeDmg: 15, armorBurn: 5 } },
        ]
      }
    }
  },
  MEDIC: {
    name: "Medic", icon: "💉", color: "#22c55e",
    desc: "Combat lifeline. Heals, revives, cleanses, and keeps everyone fighting.",
    baseStats: { hp: 90, armor: 8, shield: 15, damage: 8, speed: 13, crit: 3, evasion: 6 },
    branches: {
      FIELD_SURGEON: {
        name: "Field Surgeon", desc: "Dedicated healer",
        skills: [
          { name: "Triage", desc: "Heal lowest ally 18 HP/round", cost: 1, effect: { healPerRound: 18 } },
          { name: "Trauma Kit", desc: "+10 heal/round, heal second lowest too at 50%", cost: 1, effect: { healPerRound: 10, secondHeal: 0.5 } },
          { name: "Combat Stims", desc: "Generate 1 stim per encounter automatically", cost: 1, effect: { autoStim: 1 } },
          { name: "Resuscitate", desc: "Revive first downed ally at 40% HP, once per encounter", cost: 2, effect: { revive: 0.4 } },
          { name: "Regeneration Field", desc: "All allies heal 8/rd passively", cost: 2, effect: { aoeHeal: 8 } },
          { name: "Miracle Worker", desc: "Revive has no limit. Heals restore +50% more. Downed allies auto-revive at 20% after 2 rounds", cost: 3, effect: { unlimitedRevive: true, healBonus: 0.5, autoRevive: 0.2 } },
        ]
      },
      COMBAT_MEDIC: {
        name: "Combat Medic", desc: "Offensive support",
        skills: [
          { name: "Adrenaline Shot", desc: "Highest dmg ally gets +8 Damage", cost: 1, effect: { buffTopDamage: 8 } },
          { name: "Neural Boost", desc: "All allies +4% Crit", cost: 1, effect: { auraCrit: 4 } },
          { name: "Overclock Stim", desc: "Fastest ally acts twice, 20% chance/rd", cost: 1, effect: { overclockAlly: 0.2 } },
          { name: "Purge Toxins", desc: "Cleanse all debuffs from allies each round", cost: 2, effect: { cleanse: true } },
          { name: "Battle Frenzy", desc: "All allies +6 Dmg, +3 Speed. Medic heals 5/rd to all", cost: 2, effect: { auraDamage: 6, auraSpeed: 3, aoeHeal: 5 } },
          { name: "Berserk Protocol", desc: "All allies +15 Dmg, +10% Crit, -15% max HP. Medic heals 12/rd to all", cost: 3, effect: { berserkDmg: 15, berserkCrit: 10, berserkHpCost: 0.15, aoeHeal: 12 } },
        ]
      }
    }
  }
};
