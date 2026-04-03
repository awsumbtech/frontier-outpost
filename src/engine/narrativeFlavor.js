import { pick } from './utils';

const FLAVOR = {
  ally: [
    "{actor} lunges at {target}!",
    "{actor} strikes at {target}!",
    "{actor} takes aim at {target}!",
  ],
  enemy: [
    "{actor} attacks {target}!",
    "{actor} lashes out at {target}!",
    "{actor} moves against {target}!",
  ],
  crit: [
    "Critical hit! {actor} tears into {target}!",
    "A devastating blow from {actor}!",
    "{actor} finds a weak point!",
  ],
  critkill: [
    "{actor} obliterates {target} with a precision strike!",
    "Critical elimination by {actor}!",
  ],
  kill: [
    "{actor} finishes off {target}!",
    "{target} goes down hard!",
    "Target neutralized!",
  ],
  allyDown: [
    "{target} collapses!",
    "{target} is down! Operative lost!",
    "We've lost {target}!",
  ],
  heal: [
    "Nanites knit together wounds.",
    "Emergency med-patch applied.",
    "Bio-repair sequence initiated.",
  ],
  turret: [
    "Automated turret locks on!",
    "Turret tracking... firing!",
    "The turret opens fire!",
  ],
  aoe: [
    "The blast tears through enemy ranks!",
    "Shrapnel rips across the field!",
    "Explosive impact!",
  ],
  double: [
    "Lightning-fast follow-up!",
    "A second strike!",
  ],
  evade: [
    "A clean dodge!",
    "Evaded!",
  ],
  counter: [
    "Counter-strike!",
    "Punishing riposte!",
  ],
  defend: [
    "Bracing for impact.",
    "Defensive stance!",
  ],
  buff: [
    "Systems enhanced.",
    "Power surge!",
  ],
  debuff: [
    "Systems disrupted.",
    "Incoming interference!",
  ],
  ability: [
    "Special ability deployed!",
    "Activating tactical protocol!",
  ],
  item: [
    "Stim administered.",
    "Field supplies deployed.",
  ],
  round: null,
  info: null,
  dot: null,
  expired: null,
  bleed: null,
  stun: null,
};

/**
 * Extracts actor and target names from a log entry text.
 * Common log formats:
 *   "🎯 Recon ▸ Feral Drone 18 ★CRIT"
 *   "  Feral Drone ▸ 🛡Tank 12"
 */
function extractNames(text) {
  if (!text) return { actor: '', target: '' };
  // Try to match "Actor ▸ Target" pattern
  const match = text.match(/([A-Za-z][A-Za-z ]*?)\s*▸\s*[^\w]*([A-Za-z][A-Za-z ]*?)(?:\s+\d|$|\s+★|\s+☠|\s+✘)/);
  if (match) return { actor: match[1].trim(), target: match[2].trim() };
  return { actor: '', target: '' };
}

/**
 * Wraps a combat log entry with narrative flavor text.
 * Returns the original entry augmented with a `flavor` string, or unchanged if no flavor applies.
 */
export function narrativeWrap(entry) {
  if (typeof entry === 'string') return entry;
  if (!entry || !entry.type) return entry;

  const templates = FLAVOR[entry.type];
  if (!templates) return entry;

  const template = pick(templates);
  const { actor, target } = extractNames(entry.text);

  const flavor = template
    .replace('{actor}', actor || 'the operative')
    .replace('{target}', target || 'the enemy');

  return { ...entry, flavor };
}
