export const STIM_TYPES = [
  { id: "health_stim", name: "Health Stim", icon: "💚", spriteId: "health_stim", desc: "Restore 40% HP to one ally", color: "#2ed573", cost: 30 },
  { id: "shield_cell", name: "Shield Cell", icon: "🔷", spriteId: "shield_cell", desc: "Restore 100% shield to one ally", color: "#00d4ff", cost: 25 },
  { id: "adrenaline", name: "Adrenaline Injector", icon: "⚡", spriteId: "adrenaline", desc: "One ally gets +50% damage for 3 rounds", color: "#ffa502", cost: 40 },
  { id: "nano_kit", name: "Nano Repair Kit", icon: "🔧", spriteId: "nano_kit", desc: "Heal entire squad for 25% HP", color: "#2ed573", cost: 50 },
  { id: "purge_shot", name: "Purge Shot", icon: "✨", spriteId: "purge_shot", desc: "Remove all debuffs, +10% evasion for 2 rounds", color: "#c084fc", cost: 35 },
];

export const WEAPON_NAMES = {
  VANGUARD: ["Riot Cannon", "Shock Maul", "Heavy Repeater", "Blast Shield Launcher", "Concussion Rifle"],
  RECON: ["Phase Pistol", "Mono-Blade", "Railgun Sniper", "Plasma Dagger", "Needle Rifle"],
  ENGINEER: ["Arc Welder", "Bolt Driver", "Micro-Launcher", "Tesla Coil", "Rivet Gun"],
  MEDIC: ["Bio-Injector", "Stasis Beam", "Nano Sprayer", "Pulse Rifle", "Chem Launcher"]
};

export const ARMOR_NAMES = ["Plating", "Exo-Suit", "Hardshell", "Reactive Vest", "Nano-Weave", "Composite Shell", "Ablative Coat"];
export const IMPLANT_NAMES = ["Neural Jack", "Reflex Amp", "Dermal Mesh", "Bone Lace", "Synth Gland", "Optic Suite", "Cortex Chip"];
export const GADGET_NAMES = ["Stim Pack", "Decoy Drone", "Shield Cell", "Smoke Bomb", "Scan Pulse", "Grav Mine", "Nano Swarm"];
