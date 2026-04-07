export const RARITY = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, PROTOTYPE: 4 };
export const RARITY_NAMES = ["Common", "Uncommon", "Rare", "Epic", "Prototype"];
export const RARITY_COLORS = ["#8b9bb4", "#4ade80", "#60a5fa", "#c084fc", "#f59e0b"];
export const CLASS_KEYS = ["VANGUARD", "RECON", "ENGINEER", "MEDIC"];

export const CLASS_RESOURCE_NAMES = {
  VANGUARD: "Resolve",
  RECON: "Focus",
  ENGINEER: "Charge",
  MEDIC: "Serum",
};

export const CLASS_BASE_RESOURCE = {
  VANGUARD: 40,
  RECON: 50,
  ENGINEER: 60,
  MEDIC: 80,
};

export const CLASS_RESOURCE_COLORS = {
  VANGUARD: "#60a5fa",
  RECON: "#f87171",
  ENGINEER: "#fbbf24",
  MEDIC: "#4ade80",
};

// Reputation axes — maps axis name to decision effect keys that increase it
export const REPUTATION_AXES = {
  heroic: ['rescue', 'mark', 'shields', 'fallBack'],
  ruthless: ['pushThrough', 'quickLoot', 'overload', 'moveOn'],
  tactical: ['counterAmbush', 'ambush', 'jam', 'carefulLoot'],
};

export const REPUTATION_LABELS = {
  heroic: { name: 'Heroic', icon: '⚑', color: '#4ade80' },
  ruthless: { name: 'Ruthless', icon: '⚡', color: '#f87171' },
  tactical: { name: 'Tactical', icon: '◆', color: '#60a5fa' },
};

export const INTEL_TYPES = {
  weakness: { name: 'Weakness', icon: '⚔', color: '#f59e0b' },
  ambush: { name: 'Ambush Intel', icon: '👁', color: '#c084fc' },
  cache: { name: 'Supply Cache', icon: '◈', color: '#4ade80' },
  reinforcement: { name: 'Reinforcements', icon: '⚠', color: '#f87171' },
};

export const STATUS_EFFECTS = {
  bleed: { name: 'Bleed', type: 'dot', icon: '🩸', spriteId: 'bleed', desc: 'Takes damage each turn. Stacks up to 3x.', maxStacks: 3, damagePerStack: 5, duration: 3 },
  poison: { name: 'Poison', type: 'dot', icon: '☠', spriteId: 'poison', desc: 'Takes damage each turn. Halves healing received.', maxStacks: 1, damage: 8, duration: 3 },
  slow: { name: 'Slow', type: 'debuff', icon: '🐌', spriteId: 'slow', desc: '-30% speed next round.', stat: 'speed', modifier: -0.3, duration: 2 },
  weaken: { name: 'Weaken', type: 'debuff', icon: '💔', spriteId: 'weaken', desc: '-20% damage for 2 rounds.', stat: 'damage', modifier: -0.2, duration: 2 },
  fortify: { name: 'Fortify', type: 'buff', icon: '🛡', spriteId: 'fortify', desc: '+40% armor for 2 rounds.', stat: 'armor', modifier: 0.4, duration: 2 },
};
