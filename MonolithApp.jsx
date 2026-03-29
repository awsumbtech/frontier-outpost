import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONSTANTS & DATA ───────────────────────────────────────────────
const RARITY = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, PROTOTYPE: 4 };
const RARITY_NAMES = ["Common", "Uncommon", "Rare", "Epic", "Prototype"];
const RARITY_COLORS = ["#8b9bb4", "#4ade80", "#60a5fa", "#c084fc", "#f59e0b"];

const CLASS_KEYS = ["VANGUARD", "RECON", "ENGINEER", "MEDIC"];

const CLASSES = {
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

// ─── STIM / CONSUMABLE SYSTEM ───────────────────────────────────────
const STIM_TYPES = [
  { id: "health_stim", name: "Health Stim", icon: "💚", desc: "Restore 40% HP to one ally", color: "#2ed573", cost: 30 },
  { id: "shield_cell", name: "Shield Cell", icon: "🔷", desc: "Restore 100% shield to one ally", color: "#00d4ff", cost: 25 },
  { id: "adrenaline", name: "Adrenaline Injector", icon: "⚡", desc: "One ally gets +50% damage for 3 rounds", color: "#ffa502", cost: 40 },
  { id: "nano_kit", name: "Nano Repair Kit", icon: "🔧", desc: "Heal entire squad for 25% HP", color: "#2ed573", cost: 50 },
  { id: "purge_shot", name: "Purge Shot", icon: "✨", desc: "Remove all debuffs, +10% evasion for 2 rounds", color: "#c084fc", cost: 35 },
];

const WEAPON_NAMES = {
  VANGUARD: ["Riot Cannon", "Shock Maul", "Heavy Repeater", "Blast Shield Launcher", "Concussion Rifle"],
  RECON: ["Phase Pistol", "Mono-Blade", "Railgun Sniper", "Plasma Dagger", "Needle Rifle"],
  ENGINEER: ["Arc Welder", "Bolt Driver", "Micro-Launcher", "Tesla Coil", "Rivet Gun"],
  MEDIC: ["Bio-Injector", "Stasis Beam", "Nano Sprayer", "Pulse Rifle", "Chem Launcher"]
};

const ARMOR_NAMES = ["Plating", "Exo-Suit", "Hardshell", "Reactive Vest", "Nano-Weave", "Composite Shell", "Ablative Coat"];
const IMPLANT_NAMES = ["Neural Jack", "Reflex Amp", "Dermal Mesh", "Bone Lace", "Synth Gland", "Optic Suite", "Cortex Chip"];
const GADGET_NAMES = ["Stim Pack", "Decoy Drone", "Shield Cell", "Smoke Bomb", "Scan Pulse", "Grav Mine", "Nano Swarm"];

const ENEMY_TEMPLATES = [
  { name: "Feral Drone", hp: 30, armor: 2, damage: 8, speed: 14, tier: 1 },
  { name: "Scav Raider", hp: 45, armor: 5, damage: 12, speed: 10, tier: 1 },
  { name: "Spore Beast", hp: 60, armor: 3, damage: 15, speed: 8, tier: 1 },
  { name: "Rogue Mech", hp: 80, armor: 18, damage: 14, speed: 6, tier: 2 },
  { name: "Xeno Stalker", hp: 55, armor: 8, damage: 20, speed: 16, tier: 2 },
  { name: "Hive Swarm", hp: 40, armor: 0, damage: 25, speed: 12, tier: 2 },
  { name: "Heavy Sentinel", hp: 120, armor: 25, damage: 18, speed: 4, tier: 3 },
  { name: "Psi-Wraith", hp: 70, armor: 5, damage: 30, speed: 14, tier: 3 },
  { name: "Apex Predator", hp: 200, armor: 20, damage: 35, speed: 10, tier: 4 },
  { name: "Core Guardian", hp: 300, armor: 30, damage: 28, speed: 8, tier: 4 },
];

const MISSIONS = [
  // CH1: Planetfall
  { id: "m1a", chapter: "ch1", name: "Perimeter Sweep", desc: "Clear hostiles along the outpost perimeter", encounters: 2, tier: 1, xpMult: 1, recLevel: 1 },
  { id: "m1b", chapter: "ch1", name: "Salvage Recovery", desc: "Recover supplies from a downed cargo pod", encounters: 2, tier: 1, xpMult: 1.1, recLevel: 1 },
  { id: "m1c", chapter: "ch1", name: "Eastern Ridge Patrol", desc: "Scout the ridge where movement was detected", encounters: 3, tier: 1, xpMult: 1.2, recLevel: 2 },
  { id: "m1d", chapter: "ch1", name: "Fauna Specimen Hunt", desc: "Collect samples for Dr. Osei's analysis", encounters: 3, tier: 1, xpMult: 1.3, recLevel: 2 },
  // CH2: Strange Signals
  { id: "m2a", chapter: "ch2", name: "Signal Source Recon", desc: "Locate the origin of underground transmissions", encounters: 3, tier: 2, xpMult: 1.5, recLevel: 3 },
  { id: "m2b", chapter: "ch2", name: "Comms Relay Defense", desc: "Protect Riley's relay while she decodes the signal", encounters: 3, tier: 2, xpMult: 1.6, recLevel: 3 },
  { id: "m2c", chapter: "ch2", name: "Governor's Cargo Intercept", desc: "Investigate Liang's sealed supply shipments", encounters: 4, tier: 2, xpMult: 1.8, recLevel: 4 },
  { id: "m2d", chapter: "ch2", name: "Deep Tunnel Probe", desc: "Push into the tunnels beneath the eastern ridge", encounters: 4, tier: 2, xpMult: 2.0, recLevel: 4 },
  // CH3: The Hive
  { id: "m3a", chapter: "ch3", name: "Hive Perimeter Breach", desc: "Force entry into the outer hive tunnels", encounters: 4, tier: 3, xpMult: 2.2, recLevel: 5 },
  { id: "m3b", chapter: "ch3", name: "Drone Nest Purge", desc: "Destroy a drone production node", encounters: 4, tier: 3, xpMult: 2.4, recLevel: 5 },
  { id: "m3c", chapter: "ch3", name: "Data Core Extraction", desc: "Recover alien data from a sealed chamber", encounters: 5, tier: 3, xpMult: 2.6, recLevel: 6 },
  { id: "m3d", chapter: "ch3", name: "Liang's Lab Raid", desc: "Seize evidence from the Governor's hidden research site", encounters: 5, tier: 3, xpMult: 2.8, recLevel: 7 },
  // CH4: Containment Breach
  { id: "m4a", chapter: "ch4", name: "Colony Defense", desc: "Hold the line as evolved creatures assault the colony", encounters: 5, tier: 3, xpMult: 3.0, recLevel: 7 },
  { id: "m4b", chapter: "ch4", name: "Southern Settlement Rescue", desc: "Fight through to the cut-off southern settlers", encounters: 5, tier: 4, xpMult: 3.2, recLevel: 8 },
  { id: "m4c", chapter: "ch4", name: "Swarm Coordinator Hunt", desc: "Track and eliminate a new alpha-class creature", encounters: 4, tier: 4, xpMult: 3.5, recLevel: 9 },
  { id: "m4d", chapter: "ch4", name: "Fortification Supply Run", desc: "Secure weapons cache from an overrun depot", encounters: 5, tier: 4, xpMult: 3.0, recLevel: 8 },
  // CH5: The Core
  { id: "m5a", chapter: "ch5", name: "Conduit Alpha Strike", desc: "Destroy the first power conduit feeding the Core", encounters: 5, tier: 4, xpMult: 3.5, recLevel: 9 },
  { id: "m5b", chapter: "ch5", name: "Conduit Beta Strike", desc: "Destroy the second power conduit under heavy guard", encounters: 6, tier: 4, xpMult: 3.8, recLevel: 10 },
  { id: "m5c", chapter: "ch5", name: "Conduit Gamma Strike", desc: "Destroy the final conduit deep in the hive core", encounters: 6, tier: 4, xpMult: 4.0, recLevel: 11 },
  { id: "m5d", chapter: "ch5", name: "The Core", desc: "Confront the alien intelligence. End this.", encounters: 7, tier: 4, xpMult: 5.0, recLevel: 12 },
];

// ─── STORY SYSTEM ───────────────────────────────────────────────────
const STORY_CHAPTERS = [
  {
    id: "ch1", title: "Planetfall", unlockAt: 0,
    intro: "Day 1. The colony ship Meridian has made landfall on Kepler-442b. You're the tactical lead for Outpost Sigma, a forward operating base tasked with securing the perimeter while the main colony establishes infrastructure. Scans show indigenous fauna, some hostile. Nothing you can't handle.",
    beats: [
      { at: 1, sender: "CMD Vasquez", text: "Good work on the sweep. Perimeter's holding. We're picking up movement in the eastern ridge, probably more ferals. Keep your squad sharp." },
      { at: 2, sender: "Dr. Osei", text: "Interesting. The fauna you've been clearing aren't random. They're territorial, yes, but their aggression patterns suggest they're defending something. I'm analyzing tissue samples now." },
      { at: 3, sender: "CMD Vasquez", text: "Main colony reports all green. Governor Liang wants the eastern sectors cleared within the week. I'm authorizing deeper patrols. Be ready." },
    ]
  },
  {
    id: "ch2", title: "Strange Signals", unlockAt: 4,
    intro: "Something's wrong. Dr. Osei's tissue analysis revealed synthetic compounds in the fauna. These creatures aren't entirely natural. Meanwhile, comms has been picking up faint, structured radio signals from deep underground. The colony leadership is dismissing it as geological interference. You're not so sure.",
    beats: [
      { at: 5, sender: "Dr. Osei", text: "The synthetic markers are consistent across every species you've engaged. Someone engineered these creatures. This isn't evolution. This is design." },
      { at: 6, sender: "Comms Tech Riley", text: "Commander, those underground signals? They're not random. I ran a pattern analysis. It's a repeating sequence. A countdown. Whatever it's counting down to happens in approximately 14 cycles." },
      { at: 7, sender: "CMD Vasquez", text: "I brought Riley's findings to Governor Liang. She shut it down. Said we're here to build, not chase ghost signals. Between you and me, something about her reaction felt off. Keep digging, but quietly." },
    ]
  },
  {
    id: "ch3", title: "The Hive", unlockAt: 8,
    intro: "Your deep recon teams have found it. Beneath the eastern ridge, a vast network of tunnels leads to what can only be described as a hive. The engineered fauna are its defenders. At its center, your drones detected massive energy readings and structures that are unmistakably artificial. This planet had occupants before us. It might still have them.",
    beats: [
      { at: 9, sender: "Dr. Osei", text: "I've been cross-referencing the hive architecture with the Meridian's historical database. It matches fragments from the Cygnus probe data. The probe that went silent. The one the Meridian Corporation told us malfunctioned." },
      { at: 10, sender: "CMD Vasquez", text: "Governor Liang has restricted all access to the eastern sectors. Official reason: geological instability. Unofficial reason: she's been in encrypted comms with someone off-world. I intercepted a fragment. The word 'containment' came up. A lot." },
      { at: 11, sender: "Comms Tech Riley", text: "The countdown is accelerating. Whatever's down there is waking up. And Commander? I found something in the Meridian's sealed flight logs. We weren't sent here to colonize. We were sent here to trigger this." },
    ]
  },
  {
    id: "ch4", title: "Containment Breach", unlockAt: 12,
    intro: "Riley was right. The sealed flight logs confirm everything. The Meridian Corporation knew about the alien presence on Kepler-442b. The colony was a cover. Your real purpose: activate dormant alien technology buried beneath the surface so Meridian could study and weaponize it. Governor Liang is Meridian's operative. The countdown has reached zero. The hive is fully active now, and the creatures are evolving. Bigger. Smarter. Organized.",
    beats: [
      { at: 13, sender: "CMD Vasquez", text: "Liang's gone. Took a shuttle off-world with her security detail and what looks like alien tech samples. She left the rest of us. All 2,000 colonists. I'm assuming command. We need to fortify." },
      { at: 14, sender: "Dr. Osei", text: "The creatures are adapting to our tactics. Each engagement, they learn. I'm seeing new variants: armored types, ones that seem to coordinate. There's an intelligence directing them. Not animal instinct. Strategy." },
      { at: 15, sender: "CMD Vasquez", text: "We've lost contact with the southern settlements. Whatever's directing these things is systematically cutting us off. Outpost Sigma is the colony's last line. Hold the line. No matter what." },
    ]
  },
  {
    id: "ch5", title: "The Core", unlockAt: 16,
    intro: "Dr. Osei has identified the source: a central intelligence deep within the hive she's calling 'The Core.' It's not just controlling the creatures, it's been studying us since we arrived. Every patrol, every engagement was data collection. It knows our weapons, our tactics, our weaknesses. But Osei believes the Core has a vulnerability. It requires massive power to maintain its network. Destroy the power relays feeding it, and the swarm loses coordination. One shot. Everything you've built leads to this.",
    beats: [
      { at: 17, sender: "Dr. Osei", text: "I've mapped three primary power conduits feeding the Core. Each one is defended by the heaviest concentrations we've seen. Take them out and the Core goes into emergency hibernation. The swarm fractures." },
      { at: 18, sender: "CMD Vasquez", text: "This is it. Every operative, every weapon, every advantage we've scraped together. Osei's mapped the route. You lead the strike team in. The rest of us hold the perimeter. Whatever happens down there, know that you gave this colony a chance." },
      { at: 19, sender: "Comms Tech Riley", text: "Commander. I intercepted one last transmission from Liang's shuttle before it left comms range. She told Meridian the experiment was a success. They're sending a second wave. More colonists. More 'triggers.' We stop the Core today, but this fight? It's just getting started." },
    ]
  }
];

const DECISION_EVENTS = [
  { title: "Ambush Detected", desc: "Motion sensors detect hostiles flanking your position.", choices: [
    { text: "Set counter-ambush", effect: "counterAmbush", desc: "+30% damage first round" },
    { text: "Fall back to cover", effect: "fallBack", desc: "+20 armor this fight" },
    { text: "Push through fast", effect: "pushThrough", desc: "Skip encounter, take 15% HP" },
  ]},
  { title: "Supply Cache", desc: "An abandoned supply crate. Could be trapped.", choices: [
    { text: "Scan and loot", effect: "carefulLoot", desc: "Bonus loot" },
    { text: "Grab and go", effect: "quickLoot", desc: "50/50 loot or trap" },
    { text: "Ignore it", effect: "skip", desc: "Play it safe" },
  ]},
  { title: "Comms Intercept", desc: "Enemy patrol route intercepted.", choices: [
    { text: "Set an ambush", effect: "ambush", desc: "First strike" },
    { text: "Avoid entirely", effect: "avoid", desc: "Skip encounter" },
    { text: "Jam comms", effect: "jam", desc: "Enemies -20% accuracy" },
  ]},
  { title: "Injured Civilian", desc: "Wounded colonist requesting evac.", choices: [
    { text: "Rescue them", effect: "rescue", desc: "+XP bonus" },
    { text: "Mark for pickup", effect: "mark", desc: "Small XP" },
    { text: "Move on", effect: "skip", desc: "No effect" },
  ]},
  { title: "Power Relay", desc: "Damaged power relay. Reroute it?", choices: [
    { text: "Overload offensively", effect: "overload", desc: "25 AoE next fight" },
    { text: "Reroute to shields", effect: "shields", desc: "+25 shield all" },
    { text: "Salvage parts", effect: "salvage", desc: "Rare+ loot" },
  ]},
];

const OP_NAMES = [
  "Kael Voss", "Mira Chen", "Rex Okafor", "Zara Petrov", "Juno Reeves",
  "Thorn Blackwell", "Nova Singh", "Dax Moreau", "Lyra Tanaka", "Colt Brennan",
  "Ember Cruz", "Ash Volkov", "Sage Nakamura", "Pike Sullivan", "Wren Okonkwo"
];

// ─── UTILITIES ──────────────────────────────────────────────────────
const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 10);

function rollRarity(luck = 0) {
  const r = Math.random() * 100 + luck;
  if (r > 98) return RARITY.PROTOTYPE;
  if (r > 90) return RARITY.EPIC;
  if (r > 75) return RARITY.RARE;
  if (r > 50) return RARITY.UNCOMMON;
  return RARITY.COMMON;
}

function generateGear(type, classKey, level = 1) {
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

function createOperative(classKey, name) {
  const cls = CLASSES[classKey];
  return {
    id: uid(), name, classKey, className: cls.name, icon: cls.icon, color: cls.color,
    level: 1, xp: 0, xpToLevel: 100, skillPoints: 1,
    baseStats: { ...cls.baseStats },
    gear: { weapon: null, armor: null, implant: null, gadget: null },
    skills: {}, alive: true, currentHp: cls.baseStats.hp, currentShield: cls.baseStats.shield,
  };
}

function getEffectiveStats(op) {
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

function xpForLevel(level) { return Math.floor(100 * Math.pow(1.4, level - 1)); }

// ─── COMBAT ─────────────────────────────────────────────────────────
function generateEncounter(tier, encounterNum) {
  const enemies = ENEMY_TEMPLATES.filter(e => e.tier <= tier && e.tier >= tier - 1);
  const count = tier <= 2 ? rng(2, 3) : rng(2, 4);
  return Array.from({ length: count }, () => {
    const t = pick(enemies);
    const scale = 1 + (tier - 1) * 0.15 + encounterNum * 0.05;
    return { id: uid(), ...t, hp: Math.round(t.hp * scale), maxHp: Math.round(t.hp * scale),
      armor: Math.round(t.armor * scale), damage: Math.round(t.damage * scale), speed: t.speed, alive: true, stunned: false, bleed: 0 };
  });
}

function combatRound(squad, enemies, log) {
  const allUnits = [
    ...squad.filter(o => o.alive).map(o => ({ ...o, isAlly: true, stats: getEffectiveStats(o), ref: o })),
    ...enemies.filter(e => e.alive).map(e => ({ ...e, isAlly: false, stats: e, ref: e })),
  ].sort((a, b) => (b.stats.speed || 0) - (a.stats.speed || 0));

  for (const unit of allUnits) {
    if (!unit.ref.alive) continue;
    if (unit.ref.stunned) { unit.ref.stunned = false; log.push({ text: `${unit.name} stunned!`, type: "stun" }); continue; }
    if (unit.ref.bleed > 0 && !unit.isAlly) {
      unit.ref.hp -= unit.ref.bleed;
      log.push({ text: `${unit.name} bleeds ${unit.ref.bleed}`, type: "bleed" });
      if (unit.ref.hp <= 0) { unit.ref.alive = false; log.push({ text: `${unit.name} bleeds out!`, type: "kill" }); continue; }
    }

    if (unit.isAlly) {
      const targets = enemies.filter(e => e.alive);
      if (targets.length === 0) break;
      const target = pick(targets);
      const stats = unit.stats;
      let dmg = stats.damage + rng(-2, 4);
      const isCrit = Math.random() * 100 < (stats.crit || 0);
      if (isCrit) { dmg = Math.round(dmg * 1.8); if (stats.executeCrit && target.hp < target.maxHp * 0.3) dmg *= 2; if (stats.critBleed) target.bleed = (target.bleed || 0) + stats.critBleed; }
      const armor = Math.max(0, target.armor - (stats.armorPen || 0));
      dmg = Math.max(1, dmg - Math.floor(armor * 0.4));
      target.hp -= dmg;
      const killed = target.hp <= 0; if (killed) target.alive = false;
      log.push({ text: `${unit.icon} ${unit.name.split(" ")[0]} ▸ ${target.name} ${dmg}${isCrit ? " ★CRIT" : ""}${killed ? " ✘KILL" : ""}`, type: isCrit ? (killed ? "critkill" : "crit") : (killed ? "kill" : "ally") });

      if (stats.turretDmg) {
        const t2 = enemies.filter(e => e.alive);
        if (t2.length > 0) {
          const tt = pick(t2); let td = stats.turretDmg + rng(-1, 3);
          td = stats.turretArmorPen ? Math.max(1, td - Math.floor(tt.armor * (1 - stats.turretArmorPen / 100) * 0.4)) : Math.max(1, td - Math.floor(tt.armor * 0.4));
          tt.hp -= td; const tk = tt.hp <= 0; if (tk) tt.alive = false;
          log.push({ text: `  ⚙ Turret ▸ ${tt.name} ${td}${tk ? " ✘KILL" : ""}`, type: tk ? "kill" : "turret" });
          if (stats.dualTurret) { const t3 = enemies.filter(e => e.alive); if (t3.length > 0) { const tt2 = pick(t3); const td2 = Math.round(td * stats.dualTurret); tt2.hp -= td2; const tk2 = tt2.hp <= 0; if (tk2) tt2.alive = false;
            log.push({ text: `  ⚙ Turret#2 ▸ ${tt2.name} ${td2}${tk2 ? " ✘KILL" : ""}`, type: tk2 ? "kill" : "turret" }); }}
        }
      }
      if (stats.doubleAct && Math.random() < stats.doubleAct) { const t2 = enemies.filter(e => e.alive); if (t2.length > 0) { const tt = pick(t2); let d2 = Math.round(dmg * 0.7); tt.hp -= d2; const tk = tt.hp <= 0; if (tk) tt.alive = false;
        log.push({ text: `  ⚡ ${unit.name.split(" ")[0]} again! ${d2} ▸ ${tt.name}${tk ? " ✘KILL" : ""}`, type: "double" }); }}
      if (stats.aoeDmg && Math.random() > 0.5) { for (const e of enemies.filter(e => e.alive)) { const ad = Math.max(1, stats.aoeDmg - Math.floor(e.armor * 0.3)); e.hp -= ad; if (e.hp <= 0) e.alive = false; }
        log.push({ text: `  💥 AoE ${stats.aoeDmg}!`, type: "aoe" }); }
      if ((stats.healPerRound || 0) > 0) { const wounded = squad.filter(o => o.alive && o.currentHp < getEffectiveStats(o).hp).sort((a, b) => a.currentHp - b.currentHp);
        if (wounded.length > 0) { const mhp = getEffectiveStats(wounded[0]).hp; wounded[0].currentHp = Math.min(mhp, wounded[0].currentHp + stats.healPerRound);
          log.push({ text: `  💚 Heal ${wounded[0].name.split(" ")[0]} +${stats.healPerRound}`, type: "heal" }); }}
      if (stats.aoeHeal) { for (const ally of squad.filter(o => o.alive)) { const mhp = getEffectiveStats(ally).hp; ally.currentHp = Math.min(mhp, ally.currentHp + stats.aoeHeal); }
        log.push({ text: `  💚 Regen +${stats.aoeHeal} all`, type: "heal" }); }
    } else {
      const targets = squad.filter(o => o.alive); if (targets.length === 0) break;
      const taunters = targets.filter(o => getEffectiveStats(o).taunt);
      const target = taunters.length > 0 && Math.random() > 0.3 ? pick(taunters) : pick(targets);
      const stats = getEffectiveStats(target);
      if (Math.random() * 100 < (stats.evasion || 0)) {
        log.push({ text: `  ${target.name.split(" ")[0]} dodges ${unit.name}!`, type: "evade" });
        if (stats.evadeCounter) { const cd = Math.round(stats.damage * stats.evadeCounter); unit.ref.hp -= cd; const tk = unit.ref.hp <= 0; if (tk) unit.ref.alive = false;
          log.push({ text: `  ↩ Counter ${cd} ▸ ${unit.name}${tk ? " ✘KILL" : ""}`, type: tk ? "kill" : "counter" }); }
        continue;
      }
      let dmg = unit.ref.damage + rng(-2, 3);
      if (stats.shieldRedirect && target.currentShield > 0) { const r = Math.round(dmg * stats.shieldRedirect); const sd = Math.min(r, target.currentShield); target.currentShield -= sd; dmg -= sd; }
      dmg = Math.max(1, dmg - Math.floor((stats.armor || 0) * 0.4));
      if (target.currentShield > 0) { const sa = Math.min(dmg, target.currentShield); target.currentShield -= sa; dmg -= sa; }
      target.currentHp -= dmg;
      const killed = target.currentHp <= 0; if (killed) { target.alive = false; target.currentHp = 0; }
      log.push({ text: `  ${unit.name} ▸ ${target.icon}${target.name.split(" ")[0]} ${dmg}${killed ? " ☠DOWN" : ""}`, type: killed ? "allyDown" : "enemy" });
    }
  }
  for (const op of squad.filter(o => o.alive)) { const s = getEffectiveStats(op); if (s.stunChance) { for (const e of enemies.filter(e => e.alive)) { if (Math.random() * 100 < s.stunChance) { e.stunned = true;
    log.push({ text: `  ⚡ EMP stuns ${e.name}!`, type: "stun" }); }}}}
}

// ─── STYLES ─────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
:root{--bg:#0a0c10;--bg2:#111520;--bg3:#181d2a;--border:#1e2536;--border2:#2a3347;--text:#c8d0e0;--text2:#7a859e;--accent:#00d4ff;--accent2:#0099cc;--danger:#ff4757;--success:#2ed573;--warning:#ffa502;--purple:#c084fc}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Rajdhani',sans-serif;font-size:14px;overflow:hidden}
#root{height:100vh;width:100vw}
.app{height:100vh;display:flex;flex-direction:column;background:var(--bg);background-image:radial-gradient(ellipse at 20% 50%,rgba(0,212,255,.03) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(255,71,87,.02) 0%,transparent 50%)}
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:var(--bg2);border-bottom:1px solid var(--border);min-height:36px;flex-shrink:0}
.top-bar h1{font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--accent);letter-spacing:2px;text-transform:uppercase}
.top-bar .credits{font-family:'Share Tech Mono',monospace;color:var(--warning);font-size:12px}
.top-bar .meta{font-family:'Share Tech Mono',monospace;color:var(--text2);font-size:10px}
.nav{display:flex;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0}
.nav button{flex:1;padding:7px 2px;background:none;border:none;border-bottom:2px solid transparent;color:var(--text2);font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:600;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;transition:all .15s}
.nav button:hover{color:var(--text)}.nav button.active{color:var(--accent);border-bottom-color:var(--accent)}
.content{flex:1;overflow-y:auto;padding:8px;min-height:0}
.content::-webkit-scrollbar{width:4px}.content::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.card{background:var(--bg2);border:1px solid var(--border);border-radius:5px;padding:8px;margin-bottom:6px}
.card-header{display:flex;align-items:center;gap:5px;margin-bottom:4px}
.card-header .icon{font-size:16px}.card-header h3{font-size:13px;font-weight:600;flex:1}
.card-header .level{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--accent);background:rgba(0,212,255,.1);padding:1px 5px;border-radius:2px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:2px;margin:4px 0}
.stat{display:flex;justify-content:space-between;padding:1px 4px;background:rgba(0,0,0,.25);border-radius:2px;font-size:10px}
.stat .label{color:var(--text2);text-transform:uppercase;font-size:8px;letter-spacing:.3px}.stat .value{font-family:'Share Tech Mono',monospace;color:var(--accent);font-size:10px}
.bar-container{height:4px;background:rgba(0,0,0,.3);border-radius:2px;overflow:hidden;margin:2px 0}
.bar-fill{height:100%;border-radius:2px;transition:width .3s}
.bar-label{display:flex;justify-content:space-between;font-size:8px;font-family:'Share Tech Mono',monospace;color:var(--text2);margin-top:1px}
.gear-slot{display:flex;align-items:center;gap:5px;padding:4px 6px;background:rgba(0,0,0,.2);border:1px dashed var(--border2);border-radius:3px;margin:2px 0;font-size:11px;cursor:pointer;transition:border-color .15s}
.gear-slot:hover{border-color:var(--accent)}
.gear-slot .slot-label{color:var(--text2);min-width:44px;text-transform:uppercase;font-size:8px;letter-spacing:.3px}
.btn{padding:6px 12px;border:1px solid var(--border2);border-radius:3px;background:var(--bg3);color:var(--text);font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;text-transform:uppercase;letter-spacing:.5px}
.btn:hover{background:rgba(255,255,255,.08);border-color:var(--accent)}.btn:disabled{opacity:.3;cursor:not-allowed}
.btn-primary{background:rgba(0,212,255,.15);border-color:var(--accent);color:var(--accent)}.btn-primary:hover{background:rgba(0,212,255,.25)}
.btn-danger{background:rgba(255,71,87,.12);border-color:var(--danger);color:var(--danger)}.btn-sm{padding:2px 6px;font-size:9px}
.branch{margin:5px 0;padding:6px;border:1px solid var(--border);border-radius:5px}
.branch-title{font-size:11px;font-weight:600;margin-bottom:3px;display:flex;align-items:center;gap:4px}
.skill-node{display:flex;align-items:center;gap:5px;padding:4px 6px;margin:2px 0;background:rgba(0,0,0,.2);border-radius:3px;border:1px solid var(--border);cursor:pointer;transition:all .15s;font-size:11px}
.skill-node:hover{border-color:var(--accent)}.skill-node.learned{border-color:var(--success);background:rgba(46,213,115,.08)}
.skill-node .cost{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--warning);white-space:nowrap}

/* ─── COMBAT LOG ─── */
.combat-log{font-family:'Share Tech Mono',monospace;font-size:10px;background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:5px;padding:6px;overflow-y:auto;line-height:1.45;flex:1;min-height:60px}
.log-line{padding:0.5px 0}.log-round{color:var(--accent);font-weight:bold;margin-top:4px;padding-top:3px;border-top:1px solid rgba(0,212,255,.15)}
.log-ally{color:#8bc7ff}.log-enemy{color:#ff8a8a}.log-crit,.log-critkill{color:var(--warning);font-weight:bold}
.log-kill{color:var(--danger);font-weight:bold}.log-allyDown{color:#ff6b81;font-weight:bold;background:rgba(255,71,87,.08);padding:0 3px;border-radius:2px}
.log-heal{color:var(--success)}.log-evade{color:#a78bfa;font-style:italic}.log-counter{color:#a78bfa}
.log-stun{color:#fbbf24}.log-turret{color:#fbbf24}.log-double{color:#67e8f9}.log-aoe{color:#fb923c;font-weight:bold}
.log-bleed{color:#f87171}.log-decision{color:var(--purple);font-weight:bold}.log-info{color:var(--text2)}.log-header{color:var(--accent);font-weight:bold;font-size:11px}

/* ─── MISSION LAYOUT ─── */
.mission-layout{display:flex;flex-direction:column;height:100%;min-height:0}
.mission-top{flex-shrink:0}.mission-log-area{flex:1;min-height:0;display:flex;flex-direction:column;margin:4px 0}
.sticky-bar{flex-shrink:0;padding:6px 0 0 0;border-top:1px solid var(--border)}
.sticky-bar .decision-panel{background:linear-gradient(135deg,rgba(192,132,252,.1),rgba(0,212,255,.06));border:1px solid rgba(192,132,252,.3);border-radius:6px;padding:8px;margin-bottom:5px}
.sticky-bar .decision-panel h3{color:var(--purple);font-size:12px;margin-bottom:2px}
.sticky-bar .decision-panel p{color:var(--text2);font-size:10px;margin-bottom:6px}
.choice-btn{display:block;width:100%;padding:7px 8px;margin:3px 0;background:rgba(0,0,0,.35);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:11px;text-align:left;cursor:pointer;transition:all .15s}
.choice-btn:hover{border-color:var(--purple);background:rgba(192,132,252,.1)}.choice-btn .choice-desc{font-size:9px;color:var(--text2);margin-top:1px}

/* ─── COMBAT UNITS ─── */
.combat-unit{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 5px;flex:1;min-width:0}
.combat-unit.dead{opacity:.25}
.combat-unit .unit-header{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:600;margin-bottom:1px}
.combat-unit .mini-stats{display:flex;gap:4px;font-size:8px;font-family:'Share Tech Mono',monospace;color:var(--text2);margin-top:1px;flex-wrap:wrap}
.combat-unit .mini-stats .ms-val{color:var(--accent)}
.enemy-unit{background:rgba(255,71,87,.05);border:1px solid rgba(255,71,87,.12);border-radius:4px;padding:4px 5px;flex:1;min-width:0}
.enemy-unit .unit-header{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:var(--danger);margin-bottom:1px}
.enemy-unit .mini-stats{display:flex;gap:4px;font-size:8px;font-family:'Share Tech Mono',monospace;color:var(--text2);margin-top:1px}
.enemy-unit .mini-stats .ms-val{color:var(--danger)}

.units-row{display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px}
.section-label{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:var(--text2);margin:4px 0 2px 0}
.class-badge{font-size:8px;padding:0 3px;border-radius:2px;font-family:'Share Tech Mono',monospace;white-space:nowrap}
.scrap-value{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--warning);white-space:nowrap}
.tag{display:inline-block;padding:0 4px;border-radius:2px;font-size:8px;font-family:'Share Tech Mono',monospace;text-transform:uppercase}
.xp-bar-container{height:3px;background:rgba(0,0,0,.3);border-radius:1px;overflow:hidden;margin:2px 0}
.xp-bar{height:100%;background:linear-gradient(90deg,var(--accent2),var(--accent));border-radius:1px;transition:width .5s}
.inv-filters{display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap}
.inv-filters button{padding:2px 6px;border:1px solid var(--border);border-radius:2px;background:var(--bg3);color:var(--text2);font-family:'Rajdhani',sans-serif;font-size:10px;cursor:pointer;transition:all .15s}
.inv-filters button.active{border-color:var(--accent);color:var(--accent);background:rgba(0,212,255,.08)}
.inv-item{display:flex;align-items:center;gap:5px;padding:5px;background:var(--bg2);border:1px solid var(--border);border-radius:3px;margin:2px 0;cursor:pointer;transition:border-color .15s}
.inv-item:hover{border-color:var(--accent)}
.mission-card{background:var(--bg2);border:1px solid var(--border);border-radius:5px;padding:8px;margin:5px 0;cursor:pointer;transition:all .15s}
.mission-card:hover{border-color:var(--accent)}.mission-card h4{color:var(--text);font-size:12px;margin-bottom:2px}
.mission-card .mission-desc{color:var(--text2);font-size:10px;margin-bottom:4px}
.mission-card .mission-meta{display:flex;gap:8px;font-size:9px;color:var(--text2)}.mission-card .mission-meta span{font-family:'Share Tech Mono',monospace}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:100;padding:10px}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:6px;padding:10px;max-width:360px;width:100%;max-height:80vh;overflow-y:auto}
.modal h3{margin-bottom:6px;color:var(--accent);font-size:13px}
.stat-diff-pos{color:var(--success);font-size:9px;font-family:'Share Tech Mono',monospace}
.stat-diff-neg{color:var(--danger);font-size:9px;font-family:'Share Tech Mono',monospace}
.recruit-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.recruit-card{background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:8px;text-align:center}
.recruit-card .class-icon{font-size:22px}.recruit-card h4{font-size:12px;margin:2px 0}.recruit-card p{font-size:9px;color:var(--text2);line-height:1.2}
.empty-state{text-align:center;padding:24px 12px;color:var(--text2)}.empty-state .big-icon{font-size:32px;margin-bottom:6px}
`;

// ─── APP ────────────────────────────────────────────────────────────
const TABS = ["Squad", "Mission", "Comms", "Inventory", "Recruit"];

function initState() {
  const s1 = createOperative("VANGUARD", OP_NAMES[0]);
  const s2 = createOperative("RECON", OP_NAMES[1]);
  s1.gear.weapon = generateGear("weapon", "VANGUARD", 1);
  s1.gear.armor = generateGear("armor", "VANGUARD", 1);
  s2.gear.weapon = generateGear("weapon", "RECON", 1);
  s2.gear.armor = generateGear("armor", "RECON", 1);
  return { squad: [s1, s2], inventory: [generateGear("gadget", null, 1), generateGear("implant", null, 1), generateGear("weapon", "ENGINEER", 1)], credits: 200, missionsCompleted: 0, storyBeatsRead: {}, stims: [{ ...STIM_TYPES[0] }, { ...STIM_TYPES[0] }], completedMissions: {} };
}

export default function App() {
  const [tab, setTab] = useState("Squad");
  const [game, setGame] = useState(initState);
  const [selectedOp, setSelectedOp] = useState(null);
  const [gearModal, setGearModal] = useState(null);
  const [mission, setMission] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [decision, setDecision] = useState(null);
  const [missionResult, setMissionResult] = useState(null);
  const [invFilter, setInvFilter] = useState("all");
  const [stimTarget, setStimTarget] = useState(null);
  const logRef = useRef(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [combatLog]);

  useEffect(() => { (async () => { try { const r = await window.storage.get("frontier-v2"); if (r?.value) { const d = JSON.parse(r.value); if (d.squad) setGame(d); } } catch(e){} })(); }, []);
  const saveGame = useCallback(async (s) => { try { await window.storage.set("frontier-v2", JSON.stringify(s)); } catch(e){} }, []);
  const updateGame = useCallback((fn) => { setGame(prev => { const next = fn(prev); saveGame(next); return next; }); }, [saveGame]);

  function equipGear(opId, slot, gearId) {
    updateGame(g => {
      const ng = { ...g, squad: [...g.squad], inventory: [...g.inventory] };
      const oi = ng.squad.findIndex(o => o.id === opId); if (oi < 0) return g;
      const op = { ...ng.squad[oi], gear: { ...ng.squad[oi].gear } };
      const gi = ng.inventory.findIndex(i => i.id === gearId); if (gi < 0) return g;
      if (op.gear[slot]) ng.inventory.push(op.gear[slot]);
      op.gear[slot] = ng.inventory[gi]; ng.inventory.splice(gi, 1);
      const stats = getEffectiveStats(op); op.currentHp = Math.min(op.currentHp, stats.hp); op.currentShield = Math.min(op.currentShield, stats.shield);
      ng.squad[oi] = op; return ng;
    }); setGearModal(null);
  }

  function unequipGear(opId, slot) {
    updateGame(g => {
      const ng = { ...g, squad: [...g.squad], inventory: [...g.inventory] };
      const oi = ng.squad.findIndex(o => o.id === opId); if (oi < 0) return g;
      const op = { ...ng.squad[oi], gear: { ...ng.squad[oi].gear } };
      if (op.gear[slot]) { ng.inventory.push(op.gear[slot]); op.gear[slot] = null; }
      ng.squad[oi] = op; return ng;
    });
  }

  function scrapGear(gearId) {
    updateGame(g => { const i = g.inventory.findIndex(x => x.id === gearId); if (i < 0) return g;
      const val = (g.inventory[i].rarity + 1) * 15 + g.inventory[i].level * 5; const inv = [...g.inventory]; inv.splice(i, 1);
      return { ...g, inventory: inv, credits: g.credits + val }; });
  }

  function learnSkill(opId, skillName, cost) {
    updateGame(g => { const ng = { ...g, squad: [...g.squad] }; const i = ng.squad.findIndex(o => o.id === opId); if (i < 0) return g;
      const op = { ...ng.squad[i], skills: { ...ng.squad[i].skills } }; if (op.skillPoints < cost) return g;
      op.skills[skillName] = true; op.skillPoints -= cost; const s = getEffectiveStats(op); op.currentHp = s.hp; op.currentShield = s.shield;
      ng.squad[i] = op; return ng; });
  }

  function recruitOp(classKey) {
    if (game.squad.length >= 4 || game.credits < 150) return;
    const used = game.squad.map(o => o.name); const name = pick(OP_NAMES.filter(n => !used.includes(n)));
    const op = createOperative(classKey, name); op.gear.weapon = generateGear("weapon", classKey, 1);
    updateGame(g => ({ ...g, squad: [...g.squad, op], credits: g.credits - 150 }));
  }

  function dismissOp(opId) {
    updateGame(g => { const op = g.squad.find(o => o.id === opId); if (!op) return g;
      const inv = [...g.inventory]; for (const s of ["weapon","armor","implant","gadget"]) if (op.gear[s]) inv.push(op.gear[s]);
      return { ...g, squad: g.squad.filter(o => o.id !== opId), inventory: inv }; }); setSelectedOp(null);
  }

  // ─── STIM SYSTEM ────────────────────────────────────────────
  function buyStim(stimType) {
    if (game.credits < stimType.cost) return;
    updateGame(g => ({ ...g, credits: g.credits - stimType.cost, stims: [...(g.stims || []), { ...stimType }] }));
  }

  function useStim(stimIdx, targetOpId) {
    const stim = (game.stims || [])[stimIdx];
    if (!stim) return;
    updateGame(g => {
      const ng = { ...g, stims: [...(g.stims || [])], squad: [...g.squad] };
      ng.stims.splice(stimIdx, 1);
      if (stim.id === "health_stim" && targetOpId) {
        ng.squad = ng.squad.map(o => {
          if (o.id !== targetOpId) return o;
          const maxHp = getEffectiveStats(o).hp;
          return { ...o, currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.4)), alive: true };
        });
      } else if (stim.id === "shield_cell" && targetOpId) {
        ng.squad = ng.squad.map(o => {
          if (o.id !== targetOpId) return o;
          const maxSh = getEffectiveStats(o).shield;
          return { ...o, currentShield: maxSh };
        });
      } else if (stim.id === "nano_kit") {
        ng.squad = ng.squad.map(o => {
          const maxHp = getEffectiveStats(o).hp;
          return { ...o, currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.25)), alive: true };
        });
      }
      // adrenaline and purge are applied as combat buffs (tracked separately if needed)
      return ng;
    });
  }

  // Between-encounter healing: squad heals 15% between encounters
  function betweenEncounterHeal() {
    setGame(prev => ({
      ...prev,
      squad: prev.squad.map(o => {
        if (!o.alive) return o;
        const maxHp = getEffectiveStats(o).hp;
        const maxSh = getEffectiveStats(o).shield;
        return {
          ...o,
          currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.15)),
          currentShield: Math.min(maxSh, o.currentShield + Math.round(maxSh * 0.25)),
        };
      })
    }));
  }

  // ─── MISSION ────────────────────────────────────────────────
  function startMission(mt) {
    if (game.squad.filter(o => o.alive).length === 0) return;
    updateGame(g => ({ ...g, squad: g.squad.map(o => { const s = getEffectiveStats(o); return { ...o, alive: true, currentHp: s.hp, currentShield: s.shield }; }) }));
    setMission({ type: mt, currentEncounter: 0, totalEncounters: mt.encounters, phase: "briefing", enemies: [], roundNum: 0, decisionApplied: {} });
    // Add story flavor to briefing
    const currentChapter = STORY_CHAPTERS.filter(ch => game.missionsCompleted >= ch.unlockAt).pop();
    const storyFlavor = currentChapter ? [{ text: `[${currentChapter.title}]`, type: "decision" }] : [];
    setCombatLog([{ text: `MISSION: ${mt.name.toUpperCase()}`, type: "header" }, { text: mt.desc, type: "info" }, ...storyFlavor]);
    setDecision(null); setMissionResult(null); setTab("Mission");
  }

  function advanceMission() {
    if (!mission) return;
    if (mission.phase === "briefing") {
      const enemies = generateEncounter(mission.type.tier, 0);
      setCombatLog(p => [...p, { text: `Encounter 1/${mission.totalEncounters}`, type: "round" }, { text: enemies.map(e => e.name).join(", "), type: "info" }]);
      setMission(m => ({ ...m, phase: "combat", enemies, currentEncounter: 1, roundNum: 0 })); return;
    }
    if (mission.phase === "combat") {
      const log = []; const rn = mission.roundNum + 1;
      log.push({ text: `Round ${rn}`, type: "round" });
      const squad = [...game.squad.filter(o => o.alive)]; const enemies = [...mission.enemies];
      if (rn === 1) for (const op of squad) { const s = getEffectiveStats(op); if (s.minesDmg) { for (const e of enemies.filter(e => e.alive)) { e.hp -= s.minesDmg; if (e.hp <= 0) e.alive = false; } log.push({ text: `💣 Mines ${s.minesDmg} AoE!`, type: "aoe" }); }}
      if (rn % 4 === 0) for (const op of squad) { const s = getEffectiveStats(op); if (s.orbitalDmg) { for (const e of enemies.filter(e => e.alive)) { const d = Math.max(1, s.orbitalDmg - Math.floor(e.armor*.2)); e.hp -= d; if (e.hp <= 0) e.alive = false; } log.push({ text: `🛰 ORBITAL ${s.orbitalDmg} AoE!`, type: "aoe" }); }}
      if (mission.decisionApplied.counterAmbush && rn === 1) log.push({ text: `Counter-ambush! +30% dmg`, type: "decision" });
      if (mission.decisionApplied.overload && rn === 1) { for (const e of enemies.filter(e => e.alive)) { e.hp -= 25; if (e.hp <= 0) e.alive = false; } log.push({ text: `Overload 25 AoE!`, type: "aoe" }); }
      combatRound(squad, enemies, log);
      setGame(prev => ({ ...prev, squad: prev.squad.map(o => { const m = squad.find(s => s.id === o.id); return m ? { ...o, currentHp: m.currentHp, currentShield: m.currentShield, alive: m.alive } : o; }) }));
      setCombatLog(p => [...p, ...log]);
      if (squad.every(o => !o.alive)) { setCombatLog(p => [...p, { text: "MISSION FAILED", type: "header" }]); setMission(m => ({ ...m, phase: "result" })); setMissionResult({ success: false }); return; }
      if (enemies.every(e => !e.alive)) {
        const ne = mission.currentEncounter + 1;
        if (ne > mission.totalEncounters) {
          const tm = mission.type.tier; const loot = Array.from({ length: rng(1, 2 + tm) }, () => generateGear(pick(["weapon","armor","implant","gadget"]), pick(CLASS_KEYS), game.squad[0]?.level || 1));
          const isFirstClear = !game.completedMissions?.[mission.type.id];
          const repeatPenalty = isFirstClear ? 1 : 0.5;
          const xp = Math.round(50 * mission.type.xpMult * tm * repeatPenalty); const creds = Math.round(rng(30, 60) * tm * repeatPenalty);
          setCombatLog(p => [...p, { text: "MISSION COMPLETE", type: "header" }, { text: `+${xp}XP +${creds}¢ ${loot.length} items${!isFirstClear ? " (repeat)" : " ★FIRST CLEAR"}`, type: "info" }]);
          setMission(m => ({ ...m, phase: "result" })); setMissionResult({ success: true, loot, xp, credits: creds });
          updateGame(g => { const ng = { ...g, inventory: [...g.inventory, ...loot], credits: g.credits + creds, missionsCompleted: g.missionsCompleted + 1, completedMissions: { ...(g.completedMissions || {}), [mission.type.id]: (g.completedMissions?.[mission.type.id] || 0) + 1 } };
            ng.squad = ng.squad.map(o => { if (!o.alive) return o; let nx = o.xp + xp, lv = o.level, sp = o.skillPoints, xn = xpForLevel(lv);
              while (nx >= xn) { nx -= xn; lv++; sp++; xn = xpForLevel(lv); } return { ...o, xp: nx, level: lv, skillPoints: sp, xpToLevel: xn }; }); return ng; }); return;
        }
        if (Math.random() > 0.4) { const evt = pick(DECISION_EVENTS); setDecision(evt); setMission(m => ({ ...m, phase: "decision", roundNum: 0 })); setCombatLog(p => [...p, { text: `⟐ ${evt.title}`, type: "decision" }]); betweenEncounterHeal(); return; }
        const newE = generateEncounter(mission.type.tier, ne - 1);
        betweenEncounterHeal();
        setCombatLog(p => [...p, { text: `💚 Squad recovers between encounters`, type: "heal" }, { text: `Encounter ${ne}/${mission.totalEncounters}`, type: "round" }, { text: newE.map(e => e.name).join(", "), type: "info" }]);
        setMission(m => ({ ...m, enemies: newE, currentEncounter: ne, roundNum: 0, decisionApplied: {} })); return;
      }
      if (rn % 3 === 0 && !decision) { const evt = pick(DECISION_EVENTS); setDecision(evt); setMission(m => ({ ...m, phase: "decision", roundNum: rn })); setCombatLog(p => [...p, { text: `⟐ ${evt.title}`, type: "decision" }]); return; }
      setMission(m => ({ ...m, enemies, roundNum: rn }));
    }
  }

  function handleDecision(choice) {
    const applied = { [choice.effect]: true };
    if (choice.effect === "shields") setGame(p => ({ ...p, squad: p.squad.map(o => o.alive ? { ...o, currentShield: o.currentShield + 25 } : o) }));
    if (choice.effect === "pushThrough") { setGame(p => ({ ...p, squad: p.squad.map(o => { if (!o.alive) return o; return { ...o, currentHp: Math.max(1, o.currentHp - Math.round(getEffectiveStats(o).hp * .15)) }; }) })); setMission(m => ({ ...m, currentEncounter: m.currentEncounter + 1 })); }
    if (choice.effect === "avoid") setMission(m => ({ ...m, currentEncounter: m.currentEncounter + 1 }));
    if (choice.effect === "salvage") { const b = generateGear(pick(["weapon","armor"]), pick(CLASS_KEYS), (game.squad[0]?.level||1)+1); b.rarity = Math.max(RARITY.RARE, b.rarity); updateGame(g => ({ ...g, inventory: [...g.inventory, b] })); }
    setCombatLog(p => [...p, { text: `>> ${choice.text}`, type: "decision" }]); setDecision(null);
    const enemies = generateEncounter(mission.type.tier, mission.currentEncounter);
    setCombatLog(p => [...p, { text: `Encounter ${mission.currentEncounter}/${mission.totalEncounters}`, type: "round" }, { text: enemies.map(e => e.name).join(", "), type: "info" }]);
    setMission(m => ({ ...m, phase: "combat", enemies, roundNum: 0, decisionApplied: { ...m.decisionApplied, ...applied } }));
  }

  function resetMission() {
    setMission(null); setDecision(null); setMissionResult(null); setCombatLog([]);
    updateGame(g => ({ ...g, squad: g.squad.map(o => { const s = getEffectiveStats(o); return { ...o, alive: true, currentHp: s.hp, currentShield: s.shield }; }) })); setTab("Squad");
  }

  // ─── Components ─────────────────────────────────────────────
  function CombatAlly({ op }) {
    const s = getEffectiveStats(op); const hp = Math.max(0, (op.currentHp / s.hp) * 100); const sh = s.shield > 0 ? Math.max(0, (op.currentShield / s.shield) * 100) : 0;
    return (<div className={`combat-unit${!op.alive?" dead":""}`}>
      <div className="unit-header"><span style={{fontSize:12}}>{op.icon}</span><span style={{color:op.color,flex:1,fontSize:10}}>{op.name.split(" ")[0]}</span><span style={{fontSize:8,color:"var(--text2)"}}>L{op.level}</span></div>
      <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:hp>50?"var(--success)":hp>25?"var(--warning)":"var(--danger)"}}/></div>
      {s.shield>0&&<div className="bar-container" style={{height:2}}><div className="bar-fill" style={{width:`${sh}%`,background:"var(--accent)"}}/></div>}
      <div className="bar-label"><span>{op.currentHp}/{s.hp}</span>{s.shield>0&&<span style={{color:"var(--accent)"}}>{op.currentShield}sh</span>}</div>
      <div className="mini-stats"><span>D:<span className="ms-val">{s.damage}</span></span><span>A:<span className="ms-val">{s.armor}</span></span><span>S:<span className="ms-val">{s.speed}</span></span><span>C:<span className="ms-val">{s.crit}%</span></span></div>
    </div>);
  }

  function CombatEnemy({ e }) {
    const hp = Math.max(0, (e.hp / e.maxHp) * 100);
    return (<div className="enemy-unit">
      <div className="unit-header"><span style={{flex:1}}>{e.name}</span>{e.stunned&&<span style={{fontSize:8,color:"var(--warning)"}}>STN</span>}</div>
      <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:"var(--danger)"}}/></div>
      <div className="bar-label"><span>{e.hp}/{e.maxHp}</span></div>
      <div className="mini-stats"><span>D:<span className="ms-val">{e.damage}</span></span><span>A:<span className="ms-val">{e.armor}</span></span><span>S:<span className="ms-val">{e.speed}</span></span></div>
    </div>);
  }

  function ClassBadge({ classKey }) {
    if (!classKey) return <span className="class-badge" style={{background:"rgba(255,255,255,.05)",color:"var(--text2)"}}>ANY</span>;
    const c = CLASSES[classKey]; if (!c) return null;
    return <span className="class-badge" style={{background:c.color+"20",color:c.color}}>{c.icon}{c.name}</span>;
  }

  function StatDiff({ currentGear, newGear }) {
    if (!newGear) return null; const cs = currentGear?.stats||{}; const ns = newGear.stats||{};
    const keys = [...new Set([...Object.keys(cs),...Object.keys(ns)])].filter(k => typeof(ns[k]??cs[k])==="number");
    return (<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:1}}>
      {keys.map(k => { const d = (ns[k]||0)-(cs[k]||0); if (d === 0 && currentGear) return null; if (d === 0) return <span key={k} style={{fontSize:9,color:"var(--text2)"}}>{k}+{ns[k]}</span>;
        return <span key={k} className={d>0?"stat-diff-pos":"stat-diff-neg"}>{k}:{d>0?"+":""}{d}</span>; })}
    </div>);
  }

  // ─── TAB: Squad ─────────────────────────────────────────────
  function renderSquad() {
    if (selectedOp) {
      const op = game.squad.find(o => o.id === selectedOp); if (!op) { setSelectedOp(null); return null; }
      const stats = getEffectiveStats(op); const cls = CLASSES[op.classKey];
      return (<div>
        <button className="btn btn-sm" onClick={() => setSelectedOp(null)} style={{marginBottom:6}}>← Back</button>
        <div className="card">
          <div className="card-header"><span className="icon">{op.icon}</span><h3 style={{color:op.color}}>{op.name}</h3><span className="level">LVL {op.level}</span></div>
          <div style={{fontSize:10,color:"var(--text2)",marginBottom:3}}>{cls.desc}</div>
          <div className="xp-bar-container"><div className="xp-bar" style={{width:`${(op.xp/op.xpToLevel)*100}%`}}/></div>
          <div style={{fontSize:9,color:"var(--text2)"}}>XP:{op.xp}/{op.xpToLevel} SP:<span style={{color:op.skillPoints>0?"var(--warning)":"var(--text2)"}}>{op.skillPoints}</span></div>
          <div className="stat-grid">
            {[["HP",stats.hp],["ARM",stats.armor],["SHD",stats.shield],["DMG",stats.damage],["SPD",stats.speed],["CRT",stats.crit+"%"],["EVA",(stats.evasion||0)+"%"],
              ...(stats.armorPen?[["PEN",stats.armorPen+"%"]]:[]),...(stats.turretDmg?[["TRT",stats.turretDmg]]:[]),...(stats.healPerRound?[["HPS",stats.healPerRound]]:[])
            ].map(([l,v])=><div className="stat" key={l}><span className="label">{l}</span><span className="value">{v}</span></div>)}
          </div>
          <div className="section-label">Loadout</div>
          {["weapon","armor","implant","gadget"].map(slot => {
            const gear = op.gear[slot];
            return (<div className="gear-slot" key={slot} onClick={() => setGearModal({opId:op.id,slot})}>
              <span className="slot-label">{slot}</span>
              {gear ? (<>
                <span style={{color:RARITY_COLORS[gear.rarity],flex:1,fontSize:11}}>{gear.name}</span>
                <ClassBadge classKey={gear.classKey}/>
                <span style={{color:RARITY_COLORS[gear.rarity],fontSize:9,fontFamily:"'Share Tech Mono',monospace"}}>{RARITY_NAMES[gear.rarity][0]}</span>
                <button className="btn btn-sm btn-danger" onClick={e=>{e.stopPropagation();unequipGear(op.id,slot);}}>✕</button>
              </>) : <span style={{color:"var(--text2)",fontStyle:"italic",fontSize:10}}>Tap to equip</span>}
            </div>);
          })}
          <div className="section-label">Skills</div>
          {Object.entries(cls.branches).map(([bk,branch])=>(
            <div className="branch" key={bk}>
              <div className="branch-title"><span style={{color:op.color}}>◆</span>{branch.name}<span style={{fontSize:9,color:"var(--text2)",marginLeft:"auto"}}>{branch.desc}</span></div>
              {branch.skills.map((skill,i)=>{
                const learned=!!op.skills[skill.name]; const can=!learned&&op.skillPoints>=skill.cost; const prev=i===0||op.skills[branch.skills[i-1].name];
                return (<div className={`skill-node${learned?" learned":""}`} key={skill.name} onClick={()=>can&&prev&&learnSkill(op.id,skill.name,skill.cost)} style={{opacity:!learned&&!prev?.35:1,cursor:can&&prev?"pointer":"default"}}>
                  <span style={{color:learned?"var(--success)":"var(--text2)",fontSize:12}}>{learned?"✓":"○"}</span>
                  <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600}}>{skill.name}</div><div style={{fontSize:9,color:"var(--text2)"}}>{skill.desc}</div></div>
                  {!learned&&<span className="cost">{skill.cost}SP</span>}
                </div>);
              })}
            </div>
          ))}
          {game.squad.length>1&&<button className="btn btn-danger btn-sm" style={{marginTop:8,width:"100%"}} onClick={()=>dismissOp(op.id)}>Dismiss</button>}
        </div>
      </div>);
    }
    return (<div>{game.squad.map(op=>{
      const s=getEffectiveStats(op); const hp=(op.currentHp/s.hp)*100;
      return (<div className="card" key={op.id} onClick={()=>setSelectedOp(op.id)} style={{cursor:"pointer"}}>
        <div className="card-header"><span className="icon">{op.icon}</span><h3 style={{color:op.color}}>{op.name}</h3><span style={{fontSize:10,color:"var(--text2)"}}>{op.className}</span><span className="level">L{op.level}</span></div>
        <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:hp>50?"var(--success)":hp>25?"var(--warning)":"var(--danger)"}}/></div>
        <div style={{fontSize:9,color:"var(--text2)",display:"flex",justifyContent:"space-between",marginTop:1}}>
          <span>HP:{op.currentHp}/{s.hp} D:{s.damage} A:{s.armor} S:{s.speed}</span>
          {op.skillPoints>0&&<span style={{color:"var(--warning)"}}>●{op.skillPoints}SP</span>}
        </div>
      </div>);
    })}</div>);
  }

  // ─── TAB: Mission ───────────────────────────────────────────
  function renderMission() {
    if (!mission) {
      const avg = game.squad.length>0?Math.round(game.squad.reduce((s,o)=>s+o.level,0)/game.squad.length):1;
      const completed = game.completedMissions || {};

      // Determine which chapters are unlocked: ch1 always, others require all missions of prev chapter done
      const chapterOrder = ["ch1","ch2","ch3","ch4","ch5"];
      const unlockedChapters = new Set(["ch1"]);
      for (let i = 1; i < chapterOrder.length; i++) {
        const prevChMissions = MISSIONS.filter(m => m.chapter === chapterOrder[i-1]);
        const allPrevDone = prevChMissions.every(m => completed[m.id]);
        if (allPrevDone) unlockedChapters.add(chapterOrder[i]);
        else break;
      }

      return (<div>
        <div style={{fontSize:10,color:"var(--text2)",marginBottom:6}}>Avg LVL:{avg} | Missions:{game.missionsCompleted}</div>
        {chapterOrder.map(chId => {
          const ch = STORY_CHAPTERS.find(c => c.id === chId);
          if (!ch) return null;
          const chMissions = MISSIONS.filter(m => m.chapter === chId);
          const isUnlocked = unlockedChapters.has(chId);
          const allDone = chMissions.every(m => completed[m.id]);
          const doneCount = chMissions.filter(m => completed[m.id]).length;

          return (<div key={chId} style={{marginBottom:10}}>
            {/* Chapter Header */}
            <div style={{
              display:"flex",alignItems:"center",gap:6,padding:"5px 8px",
              background: isUnlocked ? (allDone ? "rgba(46,213,115,0.08)" : "rgba(0,212,255,0.06)") : "rgba(0,0,0,0.2)",
              border: `1px solid ${allDone ? "rgba(46,213,115,0.3)" : isUnlocked ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
              borderRadius:5,marginBottom:4,
              opacity: isUnlocked ? 1 : 0.45
            }}>
              {allDone && <span style={{color:"var(--success)",fontSize:12}}>✓</span>}
              {!allDone && isUnlocked && <span style={{color:"var(--accent)",fontSize:10}}>▸</span>}
              {!isUnlocked && <span style={{color:"var(--text2)",fontSize:10}}>🔒</span>}
              <span style={{fontWeight:700,fontSize:12,color:allDone?"var(--success)":isUnlocked?"var(--accent)":"var(--text2)",flex:1}}>{ch.title}</span>
              <span style={{fontSize:9,fontFamily:"'Share Tech Mono',monospace",color:"var(--text2)"}}>{doneCount}/{chMissions.length}</span>
            </div>

            {/* Missions */}
            {isUnlocked && chMissions.map(mt => {
              const isDone = !!completed[mt.id];
              const timesCleared = completed[mt.id] || 0;
              const levelDiff = avg - mt.recLevel;
              const diffColor = levelDiff >= 2 ? "var(--success)" : levelDiff >= 0 ? "var(--accent)" : levelDiff >= -2 ? "var(--warning)" : "var(--danger)";
              const diffLabel = levelDiff >= 2 ? "Easy" : levelDiff >= 0 ? "Fair" : levelDiff >= -2 ? "Hard" : "Brutal";

              return (<div className="mission-card" key={mt.id} onClick={()=>startMission(mt)}
                style={{borderLeftWidth:3,borderLeftStyle:"solid",borderLeftColor:isDone?"var(--success)":"var(--border2)",marginLeft:8}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  {isDone && <span style={{color:"var(--success)",fontSize:11,fontWeight:700}}>✓</span>}
                  <h4 style={{flex:1,fontSize:12}}>{mt.name}</h4>
                  <span style={{fontSize:8,fontFamily:"'Share Tech Mono',monospace",color:diffColor,background:diffColor+"15",padding:"1px 4px",borderRadius:2}}>{diffLabel}</span>
                </div>
                <div className="mission-desc">{mt.desc}</div>
                <div className="mission-meta">
                  <span>T{mt.tier}</span>
                  <span>{mt.encounters}enc</span>
                  <span>{mt.xpMult}xXP</span>
                  <span>Rec L{mt.recLevel}</span>
                  {timesCleared > 0 && <span style={{color:"var(--text2)"}}>x{timesCleared}</span>}
                </div>
              </div>);
            })}

            {/* Locked chapter hint */}
            {!isUnlocked && (<div style={{marginLeft:8,padding:"6px 8px",border:"1px dashed var(--border)",borderRadius:4,fontSize:10,color:"var(--text2)",fontStyle:"italic"}}>
              Complete all {chapterOrder[chapterOrder.indexOf(chId)-1] && STORY_CHAPTERS.find(c=>c.id===chapterOrder[chapterOrder.indexOf(chId)-1])?.title} missions to unlock
            </div>)}
          </div>);
        })}
      </div>);
    }

    return (<div className="mission-layout">
      <div className="mission-top">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
          <span style={{color:"var(--accent)",fontFamily:"'Share Tech Mono',monospace",fontSize:11}}>{mission.type.name}</span>
          <span style={{fontSize:9,color:"var(--text2)"}}>E{mission.currentEncounter}/{mission.totalEncounters} R{mission.roundNum}</span>
        </div>
        <div className="section-label">Squad</div>
        <div className="units-row">{game.squad.map(op=><CombatAlly key={op.id} op={op}/>)}</div>
        {mission.enemies&&mission.enemies.some(e=>e.alive)&&<>
          <div className="section-label">Hostiles</div>
          <div className="units-row">{mission.enemies.filter(e=>e.alive).map(e=><CombatEnemy key={e.id} e={e}/>)}</div>
        </>}
      </div>
      <div className="mission-log-area">
        <div className="combat-log" ref={logRef}>
          {combatLog.map((entry,i)=>{
            if (typeof entry==="string") return <div key={i} className="log-line log-info">{entry||"\u00A0"}</div>;
            return <div key={i} className={`log-line log-${entry.type}`}>{entry.text}</div>;
          })}
        </div>
      </div>
      <div className="sticky-bar">
        {decision&&mission.phase==="decision"&&(
          <div className="decision-panel">
            <h3>⟐ {decision.title}</h3><p>{decision.desc}</p>
            {decision.choices.map((c,i)=>(<button className="choice-btn" key={i} onClick={()=>handleDecision(c)}>{c.text}<div className="choice-desc">{c.desc}</div></button>))}
          </div>
        )}
        <div style={{display:"flex",gap:5}}>
          {mission.phase==="briefing"&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceMission}>Begin Mission</button>}
          {mission.phase==="combat"&&!decision&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceMission}>Next Round ▸</button>}
          {mission.phase==="result"&&<button className="btn btn-primary" style={{flex:1}} onClick={resetMission}>{missionResult?.success?"✓":"✕"} Return to Base</button>}
          {mission.phase!=="result"&&<button className="btn btn-danger" onClick={resetMission}>Abort</button>}
        </div>
      </div>
    </div>);
  }

  // ─── TAB: Inventory ─────────────────────────────────────────
  function renderInventory() {
    const stims = game.stims || [];
    const types=["all","weapon","armor","implant","gadget"];
    const filtered=invFilter==="all"?game.inventory:game.inventory.filter(g=>g.type===invFilter);
    const sorted=[...filtered].sort((a,b)=>b.rarity-a.rarity);
    return (<div>
      {/* STIM SECTION */}
      <div style={{marginBottom:10}}>
        <div className="section-label">Stims ({stims.length})</div>
        {stims.length > 0 && (<div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
          {stims.map((s,i)=>(
            <div key={i} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:4,padding:"4px 6px",fontSize:10,display:"flex",alignItems:"center",gap:3,cursor:"pointer"}}
              onClick={()=>{
                if (s.id==="nano_kit"||s.id==="purge_shot") { useStim(i, null); }
                else { setStimTarget({stimIdx:i,stim:s}); }
              }}>
              <span>{s.icon}</span>
              <span style={{color:s.color,fontWeight:600}}>{s.name}</span>
              <span style={{color:"var(--text2)",fontSize:8}}>TAP</span>
            </div>
          ))}
        </div>)}
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {STIM_TYPES.map(st=>(
            <button key={st.id} className="btn btn-sm" style={{fontSize:9,display:"flex",alignItems:"center",gap:3}} disabled={game.credits<st.cost} onClick={()=>buyStim(st)}>
              <span>{st.icon}</span>{st.name}<span style={{color:"var(--warning)"}}>{st.cost}¢</span>
            </button>
          ))}
        </div>
      </div>

      {/* GEAR SECTION */}
      <div className="section-label">Gear ({game.inventory.length})</div>
      {game.inventory.length===0?<div style={{color:"var(--text2)",fontSize:10,padding:8,textAlign:"center"}}>No gear. Complete missions.</div>:(
        <>
          <div className="inv-filters">{types.map(t=>(<button key={t} className={invFilter===t?"active":""} onClick={()=>setInvFilter(t)}>
            {t==="all"?`All(${game.inventory.length})`:`${t}(${game.inventory.filter(g=>g.type===t).length})`}
          </button>))}</div>
          {sorted.map(gear=>{
            const sv=(gear.rarity+1)*15+gear.level*5;
            return (<div className="inv-item" key={gear.id}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                  <span style={{color:RARITY_COLORS[gear.rarity],fontWeight:600,fontSize:11}}>{gear.name}</span>
                  <span className="tag" style={{background:RARITY_COLORS[gear.rarity]+"20",color:RARITY_COLORS[gear.rarity]}}>{RARITY_NAMES[gear.rarity]}</span>
                  <ClassBadge classKey={gear.classKey}/>
                </div>
                <div style={{fontSize:9,color:"var(--text2)",marginTop:1}}>
                  {gear.type} L{gear.level}{gear.modSlots>0&&` ${gear.modSlots}mod`} | {Object.entries(gear.stats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>`${k}+${v}`).join(" ")}
                </div>
              </div>
              <span className="scrap-value">{sv}¢</span>
              <button className="btn btn-sm" onClick={()=>scrapGear(gear.id)}>Scrap</button>
            </div>);
          })}
        </>
      )}

      {/* Stim target picker modal */}
      {stimTarget && (<div className="modal-overlay" onClick={()=>setStimTarget(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <h3>{stimTarget.stim.icon} Use {stimTarget.stim.name}</h3>
          <div style={{fontSize:10,color:"var(--text2)",marginBottom:6}}>{stimTarget.stim.desc}</div>
          {game.squad.map(op=>{
            const s=getEffectiveStats(op);
            const hpPct=Math.round((op.currentHp/s.hp)*100);
            return (<div key={op.id} className="inv-item" onClick={()=>{useStim(stimTarget.stimIdx,op.id);setStimTarget(null);}}>
              <span style={{fontSize:14}}>{op.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:op.color}}>{op.name}</div>
                <div style={{fontSize:9,color:"var(--text2)"}}>HP:{op.currentHp}/{s.hp} ({hpPct}%) | Shield:{op.currentShield}/{s.shield}</div>
              </div>
              <div className="bar-container" style={{width:40}}><div className="bar-fill" style={{width:`${hpPct}%`,background:hpPct>50?"var(--success)":hpPct>25?"var(--warning)":"var(--danger)"}}/></div>
            </div>);
          })}
          <button className="btn" style={{marginTop:6,width:"100%"}} onClick={()=>setStimTarget(null)}>Cancel</button>
        </div>
      </div>)}
    </div>);
  }

  // ─── TAB: Comms (Story) ──────────────────────────────────────
  function renderComms() {
    const mc = game.missionsCompleted;
    const unlockedChapters = STORY_CHAPTERS.filter(ch => mc >= ch.unlockAt);
    const allBeats = [];

    for (const ch of unlockedChapters) {
      allBeats.push({ type: "chapter", chapter: ch });
      for (const beat of ch.beats) {
        if (mc >= beat.at) allBeats.push({ type: "beat", beat, chapterId: ch.id });
      }
    }

    // Count unread
    const unreadCount = allBeats.filter(b => b.type === "beat" && !game.storyBeatsRead[`${b.chapterId}-${b.beat.at}`]).length;

    // Mark all as read when viewing
    const unreadKeys = allBeats.filter(b => b.type === "beat" && !game.storyBeatsRead[`${b.chapterId}-${b.beat.at}`]).map(b => `${b.chapterId}-${b.beat.at}`);
    if (unreadKeys.length > 0) {
      setTimeout(() => {
        updateGame(g => {
          const newRead = { ...g.storyBeatsRead };
          for (const k of unreadKeys) newRead[k] = true;
          return { ...g, storyBeatsRead: newRead };
        });
      }, 500);
    }

    if (unlockedChapters.length === 0) {
      return (<div className="empty-state">
        <div className="big-icon">📡</div>
        <div>No transmissions yet</div>
        <div style={{fontSize:10,marginTop:2}}>Complete your first mission</div>
      </div>);
    }

    return (<div>
      {unlockedChapters.map((ch, ci) => {
        const isLatest = ci === unlockedChapters.length - 1;
        return (<div key={ch.id} style={{marginBottom:12}}>
          <div style={{
            background: isLatest ? "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(192,132,252,0.05))" : "var(--bg2)",
            border: `1px solid ${isLatest ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
            borderRadius: 6, padding: 10, marginBottom: 6
          }}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{color:"var(--accent)",fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:1}}>CH.{ci+1}</span>
              <span style={{fontSize:13,fontWeight:700,color:isLatest?"var(--accent)":"var(--text)"}}>{ch.title}</span>
            </div>
            <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.4}}>{ch.intro}</div>
          </div>

          {ch.beats.filter(b => mc >= b.at).map((beat, bi) => {
            const key = `${ch.id}-${beat.at}`;
            const isNew = !game.storyBeatsRead[key];
            return (<div key={bi} style={{
              background: isNew ? "rgba(0,212,255,0.04)" : "var(--bg3)",
              border: `1px solid ${isNew ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
              borderRadius: 5, padding: 8, marginBottom: 4, marginLeft: 12,
              borderLeft: `2px solid ${isNew ? "var(--accent)" : "var(--border2)"}`
            }}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                <span style={{fontSize:10,color:"var(--accent)",fontFamily:"'Share Tech Mono',monospace"}}>◈</span>
                <span style={{fontSize:11,fontWeight:600,color:isNew?"var(--accent)":"var(--text)"}}>{beat.sender}</span>
                {isNew && <span style={{fontSize:8,background:"rgba(0,212,255,0.15)",color:"var(--accent)",padding:"0 4px",borderRadius:2,fontFamily:"'Share Tech Mono',monospace"}}>NEW</span>}
                <span style={{fontSize:8,color:"var(--text2)",marginLeft:"auto",fontFamily:"'Share Tech Mono',monospace"}}>M{beat.at}</span>
              </div>
              <div style={{fontSize:11,color:"var(--text)",lineHeight:1.4}}>{beat.text}</div>
            </div>);
          })}
        </div>);
      })}

      {mc < 19 && (<div style={{
        textAlign:"center",padding:12,color:"var(--text2)",fontSize:10,
        border:"1px dashed var(--border)",borderRadius:5,marginTop:8
      }}>
        <span style={{fontFamily:"'Share Tech Mono',monospace"}}>
          {(() => {
            const nextBeat = STORY_CHAPTERS.flatMap(ch => ch.beats).find(b => b.at > mc);
            const nextChapter = STORY_CHAPTERS.find(ch => ch.unlockAt > mc);
            if (nextChapter && (!nextBeat || nextChapter.unlockAt <= nextBeat.at)) return `Next chapter unlocks at mission ${nextChapter.unlockAt}`;
            if (nextBeat) return `Next transmission at mission ${nextBeat.at}`;
            return "Story complete";
          })()}
        </span>
      </div>)}
    </div>);
  }

  // ─── TAB: Recruit ───────────────────────────────────────────
  function renderRecruit() {
    const can=game.squad.length<4;
    return (<div>
      <div style={{fontSize:10,color:"var(--text2)",marginBottom:6}}>Squad:{game.squad.length}/4 | 150¢{!can&&<span style={{color:"var(--danger)",marginLeft:4}}>Full</span>}</div>
      <div className="recruit-grid">{Object.entries(CLASSES).map(([key,cls])=>{
        const has=game.squad.some(o=>o.classKey===key);
        return (<div className="recruit-card" key={key}>
          <div className="class-icon">{cls.icon}</div><h4 style={{color:cls.color}}>{cls.name}</h4><p>{cls.desc}</p>
          <div className="stat-grid" style={{marginTop:3,textAlign:"left"}}>{Object.entries(cls.baseStats).slice(0,4).map(([k,v])=>(<div className="stat" key={k}><span className="label">{k}</span><span className="value">{v}</span></div>))}</div>
          <button className="btn btn-primary btn-sm" style={{marginTop:4,width:"100%"}} disabled={!can||game.credits<150} onClick={()=>recruitOp(key)}>{has?"Another":"Recruit"} 150¢</button>
        </div>);
      })}</div>
    </div>);
  }

  // ─── Gear Modal ─────────────────────────────────────────────
  function renderGearModal() {
    if (!gearModal) return null;
    const {opId,slot}=gearModal; const op=game.squad.find(o=>o.id===opId); if (!op) return null;
    const cur=op.gear[slot]; const avail=game.inventory.filter(g=>g.type===slot);
    return (<div className="modal-overlay" onClick={()=>setGearModal(null)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>Equip {slot} for {op.name.split(" ")[0]}</h3>
        {cur&&<div style={{fontSize:9,color:"var(--text2)",marginBottom:4,padding:"3px 5px",background:"rgba(0,0,0,.2)",borderRadius:3}}>
          Current: <span style={{color:RARITY_COLORS[cur.rarity]}}>{cur.name}</span> | {Object.entries(cur.stats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>`${k}:${v}`).join(" ")}
        </div>}
        {avail.length===0?<div style={{color:"var(--text2)",padding:12,textAlign:"center",fontSize:11}}>No {slot}s available</div>:
          avail.sort((a,b)=>b.rarity-a.rarity).map(gear=>(<div className="inv-item" key={gear.id} onClick={()=>equipGear(opId,slot,gear.id)}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
                <span style={{color:RARITY_COLORS[gear.rarity],fontWeight:600,fontSize:11}}>{gear.name}</span>
                <ClassBadge classKey={gear.classKey}/>
              </div>
              <div style={{fontSize:9,color:"var(--text2)"}}>{Object.entries(gear.stats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>`${k}+${v}`).join(" ")}</div>
              <StatDiff currentGear={cur} newGear={gear}/>
            </div>
            <span className="tag" style={{background:RARITY_COLORS[gear.rarity]+"20",color:RARITY_COLORS[gear.rarity]}}>{RARITY_NAMES[gear.rarity][0]}</span>
          </div>))}
        <button className="btn" style={{marginTop:6,width:"100%"}} onClick={()=>setGearModal(null)}>Close</button>
      </div>
    </div>);
  }

  return (<>
    <style>{CSS}</style>
    <div className="app">
      <div className="top-bar">
        <h1>Frontier Outpost</h1>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span className="meta">M:{game.missionsCompleted}</span><span className="credits">◈{game.credits}¢</span></div>
      </div>
      <div className="nav">{TABS.map(t=>(<button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
        {t==="Squad"&&"👥"}{t==="Mission"&&"⚔"}{t==="Comms"&&"📡"}{t==="Inventory"&&"🎒"}{t==="Recruit"&&"➕"} {t}
        {t==="Comms"&&(()=>{const ur=STORY_CHAPTERS.flatMap(ch=>ch.beats.filter(b=>game.missionsCompleted>=b.at&&!game.storyBeatsRead[`${ch.id}-${b.at}`])).length;return ur>0?<span style={{background:"var(--danger)",color:"#fff",fontSize:8,padding:"0 3px",borderRadius:6,marginLeft:3,fontFamily:"'Share Tech Mono',monospace"}}>{ur}</span>:null;})()}
      </button>))}</div>
      <div className="content" style={tab==="Mission"&&mission?{padding:6,display:"flex",flexDirection:"column"}:{}}>
        {tab==="Squad"&&renderSquad()}
        {tab==="Mission"&&renderMission()}
        {tab==="Comms"&&renderComms()}
        {tab==="Inventory"&&renderInventory()}
        {tab==="Recruit"&&renderRecruit()}
      </div>
      {renderGearModal()}
    </div>
  </>);
}
