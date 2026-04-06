export const DECISION_EVENTS = [
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
    { text: "Move on", effect: "moveOn", desc: "+15% resource recovery" },
  ]},
  { title: "Power Relay", desc: "Damaged power relay. Reroute it?", choices: [
    { text: "Overload offensively", effect: "overload", desc: "25 AoE next fight" },
    { text: "Reroute to shields", effect: "shields", desc: "+25 shield all" },
    { text: "Salvage parts", effect: "salvage", desc: "Rare+ loot" },
  ]},
];
