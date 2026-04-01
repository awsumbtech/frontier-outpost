// Inline story data for Frontier Outpost.
// These objects are consumed by mission/combat logic to surface
// narrative moments DURING missions rather than only post-mission.

// ---------------------------------------------------------------------------
// INLINE_STORY
// Keyed by mission ID. preEncounter fires before the first encounter.
// betweenEncounter fires after the specified encounter number (1-indexed).
// ---------------------------------------------------------------------------
export const INLINE_STORY = {
  m1a: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Sigma, perimeter looks clear on radar. Don't trust it. Move out." },
    ],
  },

  m1b: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Cargo pod went down hard. Whatever's in those crates, we need it. Watch for scavengers." },
    ],
    betweenEncounter: [
      { after: 1, sender: "Dr. Osei", text: "Vasquez — the claw marks on that wreckage are uniform. Almost mechanical. Keep that in mind." },
    ],
  },

  m1c: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Movement along the ridge. Probably fauna. Probably." },
    ],
    betweenEncounter: [
      { after: 1, sender: "Dr. Osei", text: "Sigma, I'm seeing coordinated patrol gaps in the fauna movement. They're not just wandering." },
    ],
  },

  m1d: {
    betweenEncounter: [
      { after: 1, sender: "Dr. Osei", text: "Try to bring back tissue samples intact — I need the glands, not just carapace fragments." },
      { after: 2, sender: "Dr. Osei", text: "Wait. These specimens... there are trace compounds here that have no natural origin. Hold position while I run another scan." },
    ],
  },

  m2a: {
    preEncounter: [
      { sender: "Comms Tech Riley", text: "Signal's getting stronger. You're close. Whatever's broadcasting, it's been running a long time." },
    ],
    betweenEncounter: [
      { after: 1, sender: "Comms Tech Riley", text: "The signal is changing frequency as you move. It knows you're there." },
    ],
  },

  m2b: {
    preEncounter: [
      { sender: "Comms Tech Riley", text: "Relay's online. I need four minutes to finish the decode. Keep them off me." },
    ],
    betweenEncounter: [
      { after: 1, sender: "Comms Tech Riley", text: "Still decoding. The pattern density is — just hold that perimeter." },
      { after: 2, sender: "Comms Tech Riley", text: "I have it. Commander, you need to hear this when you're clear." },
    ],
  },

  m2c: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Governor's manifest says medical supplies. Liang doesn't order medical in sealed military crates. Find out what's really in there." },
    ],
    betweenEncounter: [
      { after: 2, sender: "CMD Vasquez", text: "Command is asking questions about why we're at the depot. Liang has eyes here. Move fast." },
    ],
  },

  m2d: {
    preEncounter: [
      { sender: "Dr. Osei", text: "The tunnel walls are smooth. Not bored — grown. Whatever made these had precision we don't." },
    ],
    betweenEncounter: [
      { after: 2, sender: "Comms Tech Riley", text: "Sigma, I'm losing your signal. The tunnel material is absorbing transmission. You're on your own down there." },
    ],
  },

  m3a: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "This is the hive perimeter. Once you breach, there's no quiet way out. Confirmed?" },
    ],
    betweenEncounter: [
      { after: 2, sender: "Dr. Osei", text: "The architecture is geometric. Right angles, load-bearing curves — this isn't a nest. It's a building." },
    ],
  },

  m3b: {
    betweenEncounter: [
      { after: 1, sender: "Dr. Osei", text: "Those drone production nodes are networked. Destroying one will slow the others. Keep pushing." },
      { after: 3, sender: "CMD Vasquez", text: "Sigma, the hive is rerouting. If you're going to burn that node, do it now before it adapts." },
    ],
  },

  m3c: {
    preEncounter: [
      { sender: "Comms Tech Riley", text: "The data chamber should be ahead. Whatever's stored in there, Meridian flagged it classified before we even launched." },
    ],
    betweenEncounter: [
      { after: 3, sender: "Dr. Osei", text: "Sigma — the data format matches Cygnus probe architecture. This technology predates our survey mission by years." },
    ],
  },

  m3d: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Liang built a lab out here and told no one. Whatever she was studying, we need the hard evidence before she can scrub it." },
    ],
    betweenEncounter: [
      { after: 2, sender: "Dr. Osei", text: "The containment pods in this lab — they held living specimens. Recent. She wasn't studying them. She was communicating with them." },
    ],
  },

  m4a: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "All stations, this is not a drill. Breach in progress on the north wall. Every gun to the perimeter." },
    ],
    betweenEncounter: [
      { after: 2, sender: "CMD Vasquez", text: "Hold that line, Sigma. The colony is watching. You fall back, they fall apart." },
    ],
  },

  m4b: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Southern comms went dark forty minutes ago. Assume the worst. Get them out." },
    ],
    betweenEncounter: [
      { after: 3, sender: "Comms Tech Riley", text: "I'm picking up a survivor beacon. It's weak but it's there — southwest of your position." },
    ],
  },

  m4c: {
    preEncounter: [
      { sender: "Dr. Osei", text: "The alpha-class variant is directing the swarm in real time. Kill it and the pattern breaks. Don't let it run." },
    ],
    betweenEncounter: [
      { after: 2, sender: "CMD Vasquez", text: "Sigma, we're tracking the coordinator heading deeper into the canopy. It's trying to disappear. Don't let it." },
    ],
  },

  m4d: {
    betweenEncounter: [
      { after: 1, sender: "CMD Vasquez", text: "The weapons cache is still sealed — good. Means they haven't gotten inside yet." },
      { after: 3, sender: "Comms Tech Riley", text: "Commander, I'm seeing a third wave massing to your east. Get what you came for and pull out." },
    ],
  },

  m5a: {
    preEncounter: [
      { sender: "Dr. Osei", text: "Alpha conduit ahead. The resistance here will be the heaviest you've faced. The Core is protecting this one." },
    ],
    betweenEncounter: [
      { after: 3, sender: "Comms Tech Riley", text: "Energy readings are spiking at your position. The Core knows you're targeting the conduit." },
    ],
  },

  m5b: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "First conduit is down. The swarm is disoriented but recovering. Hit Beta before they regroup." },
    ],
    betweenEncounter: [
      { after: 3, sender: "Dr. Osei", text: "Power draw from the Core is dropping. It's compensating with the remaining conduits — Beta is overloading. Move." },
    ],
  },

  m5c: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "This is the last one. Everything the colony has, everything you've fought for — it comes down to this conduit." },
    ],
    betweenEncounter: [
      { after: 2, sender: "Comms Tech Riley", text: "The Core is going to emergency state when this conduit drops. Expect a last-stand response. Do not stop." },
      { after: 4, sender: "Dr. Osei", text: "It's drawing everything it has left. Go. Go now." },
    ],
  },

  m5d: {
    preEncounter: [
      { sender: "CMD Vasquez", text: "Sigma. This is it. The whole colony is behind you. Finish this." },
    ],
    betweenEncounter: [
      { after: 2, sender: "Dr. Osei", text: "Its network is fragmenting — but the Core itself is still active. The intelligence is still there. End it." },
      { after: 4, sender: "Comms Tech Riley", text: "Vasquez — Sigma's still in there. Holding the channel open. Come on, come on..." },
    ],
  },
};

// ---------------------------------------------------------------------------
// DECISION_ECHOES
// Keyed by decision effect name. When a player's past choice matches an
// effect here, a random line from `lines` can be surfaced in a later mission.
// `missions` lists the mission IDs where the echo is eligible to appear.
// ---------------------------------------------------------------------------
export const DECISION_ECHOES = {
  rescue: {
    missions: ["m2b", "m3a"],
    lines: [
      "Vasquez: That colonist you pulled out is back on duty. Volunteered for perimeter watch. Good call.",
      "Riley: Word spread about the rescue. Morale's up more than I expected.",
    ],
  },

  pushThrough: {
    missions: ["m2c", "m3a"],
    lines: [
      "Vasquez: Command flagged your charge through those tunnels. Officially, they're concerned. Unofficially, they're impressed.",
      "Riley: Your squad took some hits getting here fast. Glad you made it.",
    ],
  },

  jam: {
    missions: ["m2d", "m3b"],
    lines: [
      "Riley: That comms jam you ran earlier? The creatures are still using the disrupted frequency range. We can exploit that.",
      "Vasquez: Tactical note — jamming bought you time before. Same window may not be available in these tunnels.",
    ],
  },

  counterAmbush: {
    missions: ["m3a", "m4c"],
    lines: [
      "Vasquez: Counter-ambush was textbook. The swarm adapted, but you bought real time with that call.",
      "Riley: They telegraphed that flank again. Your people read it faster this time.",
    ],
  },

  carefulLoot: {
    missions: ["m2c", "m3d"],
    lines: [
      "Riley: The scan data from that cache? One of the serial numbers traces back to a Meridian manifest. This just got complicated.",
      "Osei: The careful approach paid off — that equipment is intact enough to analyze.",
    ],
  },

  overload: {
    missions: ["m3b", "m4d"],
    lines: [
      "Osei: The overload burn pattern from the last relay is identical to what I'm seeing in the hive's power nodes. Worth noting.",
      "Vasquez: That relay trick — we're replicating it on the fortification grid. Nice work.",
    ],
  },

  ambush: {
    missions: ["m2d", "m4c"],
    lines: [
      "Vasquez: Your ambush data is in the tactical database. Other squads are running the same play.",
      "Riley: That patrol route you ambushed? It's shifted. They learned. Stay flexible.",
    ],
  },

  fallBack: {
    missions: ["m3a", "m4a"],
    lines: [
      "Vasquez: Falling back to cover was the right call last time. These positions are tighter — read it the same way.",
      "Osei: Survivability over aggression has kept your squad effective longer. The data bears that out.",
    ],
  },
};

// ---------------------------------------------------------------------------
// ENV_FLAVOR
// Keyed by environment ID (matches missions.js environment field).
// Three short atmospheric lines per environment.
// These can be surfaced in the combat log during encounters.
// ---------------------------------------------------------------------------
export const ENV_FLAVOR = {
  crimson_clearing: [
    "Crimson fronds shed bioluminescent spores with every movement through the undergrowth.",
    "The alien canopy filters both suns into a deep, blood-warm haze.",
    "Something in the treeline clicks — a sound with no natural explanation.",
  ],

  cargo_wreckage: [
    "Twisted hull plating juts from the soil at angles that shouldn't be survivable.",
    "Claw marks score the cargo frames in long, parallel lines — deep and deliberate.",
    "Loose wiring sparks intermittently, throwing brief shadows across the wreckage.",
  ],

  eastern_ridge: [
    "Wind cuts across the exposed rock, carrying copper-colored dust that coats every surface.",
    "Mineral veins in the stone pulse with faint bioluminescent light, rhythmic as breathing.",
    "The ridge drops off sharply to the east — a long fall to the valley floor.",
  ],

  underground_tunnels: [
    "The walls radiate a steady warmth that has nothing to do with geothermal activity.",
    "Bioluminescent veins branch through the stone overhead like a frozen circulatory system.",
    "A low, subsonic hum carries through the tunnel floor and up through the boots.",
  ],

  comms_relay: [
    "Antenna arrays stand against a sky bruised with approaching storm light.",
    "The treeline presses close on three sides — the fourth is a sheer drop.",
    "Static bursts from the relay speakers at irregular intervals, masking the sounds of approach.",
  ],

  cargo_depot: [
    "Meridian Corp stenciling runs along every sealed crate, each one numbered but unlabeled.",
    "Emergency lighting gives the depot a flat, clinical cast that makes distances hard to read.",
    "Unmarked equipment lines the far wall under sealed tarps — nothing from any standard manifest.",
  ],

  hive_tunnels: [
    "The curves here are too precise — geometry calculated rather than grown.",
    "Energy conduits run along the walls, warm to the touch, pulsing with slow regularity.",
    "The air smells of ozone and something sweeter, organic, unidentifiable.",
  ],

  hidden_lab: [
    "Monitoring equipment still runs, logging data for an audience that may no longer exist.",
    "Containment pods line the far wall, their seals recently broken from the inside.",
    "Research terminals display scrolling alien script alongside Meridian Corp headers.",
  ],

  colony_perimeter: [
    "Floodlights sweep the kill zone in slow arcs, catching movement that isn't always there.",
    "The prefab walls were built for weather, not siege — every operator knows it.",
    "Distress calls from the southern sectors break through the tactical channel in fragments.",
  ],

  swarm_territory: [
    "Organic web structures bridge the canopy overhead, filtering light into pale threads.",
    "Drone carcasses from earlier engagements litter the ground — some still twitch.",
    "The forest is too quiet. The swarm moves by silence, not by sound.",
  ],

  core_conduits: [
    "Conduit housings vibrate with geothermal energy drawn from somewhere far below.",
    "The heat here is punishing — armor systems cycle cooling protocols continuously.",
    "As the squad advances, the resistance intensifies with mechanical, deliberate escalation.",
  ],

  the_core: [
    "The chamber is vast and cathedral-quiet, shaped by an intelligence that has been waiting.",
    "Every surface pulses with awareness — the Core is not just here, it is the room.",
    "The air pressure shifts as something ancient and patient turns its full attention inward.",
  ],
};

// ---------------------------------------------------------------------------
// DYNAMIC_BRIEFINGS
// Keyed by mission ID. Each entry has an optional `requiredMission` (the
// briefing addition only shows if that mission has been completed) and a
// `text` line appended to the mission briefing when the condition is met.
// ---------------------------------------------------------------------------
export const DYNAMIC_BRIEFINGS = {
  m1c: {
    requiredMission: "m1b",
    text: "The claw patterns on the cargo wreck match marks reported along the ridge — same origin.",
  },

  m1d: {
    requiredMission: "m1c",
    text: "Ridge patrol confirmed the fauna aren't random — Osei's specimen hunt now has a specific target grid.",
  },

  m2a: {
    requiredMission: "m1d",
    text: "Osei's sample analysis flagged synthetic compounds in the fauna tissue — that changes what you're looking for underground.",
  },

  m2c: {
    requiredMission: "m2a",
    text: "The signal source recon placed Meridian-pattern hardware 40 meters below the depot — Liang's shipments go deeper than the manifest shows.",
  },

  m2d: {
    requiredMission: "m2b",
    text: "Riley's decoded signal points to a structure further in than the first tunnel survey reached.",
  },

  m3a: {
    requiredMission: "m2d",
    text: "The deep tunnel probe confirmed the hive perimeter — your squad has seen what's inside. This time you're not pulling back.",
  },

  m3d: {
    requiredMission: "m3c",
    text: "The data core extraction pulled schematics that match Liang's lab coordinates exactly.",
  },

  m4a: {
    requiredMission: "m3d",
    text: "Evidence from Liang's lab confirms the swarm is acting on standing orders — the assault on the colony is not random.",
  },

  m4c: {
    requiredMission: "m4b",
    text: "A survivor from the southern settlement described a larger creature directing the others — that's your target.",
  },

  m5d: {
    requiredMission: "m5c",
    text: "Three conduits down. The Core's network is fractured. This is the only window you're going to get.",
  },
};
