export const INTRO_SEQUENCE = [
  {
    label: "DESCENT",
    text: "The colony ship Meridian breaks through the upper atmosphere of Kepler-442b. Through the viewport, an alien world unfolds — vast crimson forests stretching to the horizon, jagged mountain ranges veined with bioluminescent rivers, and storms the color of bruised copper rolling across a sky with two suns. After 14 months in cryo, this is the first real light you've seen. It burns."
  },
  {
    label: "LANDFALL",
    text: "The forward operating base is designated Outpost Sigma. Forty-seven souls. Prefab shelters, a med bay, a comms array, and enough firepower to hold a perimeter — barely. The main colony is 80 klicks south, still assembling infrastructure. You're the tip of the spear. Tactical lead. If something hostile comes out of those treelines, your squad meets it first."
  },
  {
    label: "FIRST CONTACT",
    text: "Perimeter drones pick up movement within the first hour. The fauna here is unlike anything in the Meridian's databanks — armored, fast, and territorial. Dr. Osei calls them \"adaptive organisms.\" Your squad calls them problems. Initial scans show dozens of species, some docile, some decidedly not. The hostile ones are already testing your fences."
  },
  {
    label: "MISSION BRIEFING",
    text: "Commander Vasquez patches through from the main colony. \"Sigma, you have one job: secure the perimeter and push the clearance zone out to 5 klicks. The colony can't build if it can't breathe. You've got two operatives, limited gear, and whatever you can scavenge. Make it work.\" The channel cuts. Outside, something screams in the treeline. Your squad checks their weapons. Time to move."
  }
];

export const STORY_CHAPTERS = [
  {
    id: "ch1", title: "Planetfall", unlockAt: 0,
    intro: "Day 1. The colony ship Meridian has made landfall on Kepler-442b. You're the tactical lead for Outpost Sigma, a forward operating base tasked with securing the perimeter while the main colony establishes infrastructure. Scans show indigenous fauna, some hostile. Nothing you can't handle.",
    beats: [
      { at: 1, sender: "CMD Vasquez", text: "Good work on the sweep. Perimeter's holding. We're picking up movement in the eastern ridge, probably more ferals. Keep your squad sharp." },
      { at: 2, sender: "Dr. Osei", text: "Interesting. The fauna you've been clearing aren't random. They're territorial, yes, but their aggression patterns suggest they're defending something. I'm analyzing tissue samples now.", intel: { type: "weakness", targets: ["Spore Beast"], effect: "Vulnerable to sustained fire — soft tissue beneath spore sacs", missionIds: ["m1c", "m1d", "m2a"] } },
      { at: 3, sender: "CMD Vasquez", text: "Main colony reports all green. Governor Liang wants the eastern sectors cleared within the week. I'm authorizing deeper patrols. Be ready." },
    ]
  },
  {
    id: "ch2", title: "Strange Signals", unlockAt: 4,
    intro: "Something's wrong. Dr. Osei's tissue analysis revealed synthetic compounds in the fauna. These creatures aren't entirely natural. Meanwhile, comms has been picking up faint, structured radio signals from deep underground. The colony leadership is dismissing it as geological interference. You're not so sure.",
    beats: [
      { at: 5, sender: "Dr. Osei", text: "The synthetic markers are consistent across every species you've engaged. Someone engineered these creatures. This isn't evolution. This is design.", intel: { type: "weakness", targets: ["Rogue Mech", "Xeno Stalker"], effect: "Synthetic joints are weak to EMP and sustained pressure", missionIds: ["m2b", "m2c", "m2d"] } },
      { at: 6, sender: "Comms Tech Riley", text: "Commander, those underground signals? They're not random. I ran a pattern analysis. It's a repeating sequence. A countdown. Whatever it's counting down to happens in approximately 14 cycles.", intel: { type: "ambush", targets: [], effect: "Signal patterns reveal patrol routes — ambushes can be anticipated", missionIds: ["m2c", "m2d", "m3a"] } },
      { at: 7, sender: "CMD Vasquez", text: "I brought Riley's findings to Governor Liang. She shut it down. Said we're here to build, not chase ghost signals. Between you and me, something about her reaction felt off. Keep digging, but quietly." },
    ]
  },
  {
    id: "ch3", title: "The Hive", unlockAt: 8,
    intro: "Your deep recon teams have found it. Beneath the eastern ridge, a vast network of tunnels leads to what can only be described as a hive. The engineered fauna are its defenders. At its center, your drones detected massive energy readings and structures that are unmistakably artificial. This planet had occupants before us. It might still have them.",
    beats: [
      { at: 9, sender: "Dr. Osei", text: "I've been cross-referencing the hive architecture with the Meridian's historical database. It matches fragments from the Cygnus probe data. The probe that went silent. The one the Meridian Corporation told us malfunctioned.", intel: { type: "cache", targets: [], effect: "Cygnus probe supply drops may still be intact along the route", missionIds: ["m3a", "m3b", "m3c"] } },
      { at: 10, sender: "CMD Vasquez", text: "Governor Liang has restricted all access to the eastern sectors. Official reason: geological instability. Unofficial reason: she's been in encrypted comms with someone off-world. I intercepted a fragment. The word 'containment' came up. A lot." },
      { at: 11, sender: "Comms Tech Riley", text: "The countdown is accelerating. Whatever's down there is waking up. And Commander? I found something in the Meridian's sealed flight logs. We weren't sent here to colonize. We were sent here to trigger this.", intel: { type: "reinforcement", targets: ["Heavy Sentinel", "Psi-Wraith"], effect: "Expect heavy resistance — hive defenders are converging", missionIds: ["m3c", "m3d", "m4a"] } },
    ]
  },
  {
    id: "ch4", title: "Containment Breach", unlockAt: 12,
    intro: "Riley was right. The sealed flight logs confirm everything. The Meridian Corporation knew about the alien presence on Kepler-442b. The colony was a cover. Your real purpose: activate dormant alien technology buried beneath the surface so Meridian could study and weaponize it. Governor Liang is Meridian's operative. The countdown has reached zero. The hive is fully active now, and the creatures are evolving. Bigger. Smarter. Organized.",
    beats: [
      { at: 13, sender: "CMD Vasquez", text: "Liang's gone. Took a shuttle off-world with her security detail and what looks like alien tech samples. She left the rest of us. All 2,000 colonists. I'm assuming command. We need to fortify." },
      { at: 14, sender: "Dr. Osei", text: "The creatures are adapting to our tactics. Each engagement, they learn. I'm seeing new variants: armored types, ones that seem to coordinate. There's an intelligence directing them. Not animal instinct. Strategy.", intel: { type: "weakness", targets: ["Heavy Sentinel", "Psi-Wraith"], effect: "Coordinating intelligence creates dependency — disrupt the link", missionIds: ["m4b", "m4c", "m4d"] } },
      { at: 15, sender: "CMD Vasquez", text: "We've lost contact with the southern settlements. Whatever's directing these things is systematically cutting us off. Outpost Sigma is the colony's last line. Hold the line. No matter what." },
    ]
  },
  {
    id: "ch5", title: "The Core", unlockAt: 16,
    intro: "Dr. Osei has identified the source: a central intelligence deep within the hive she's calling 'The Core.' It's not just controlling the creatures, it's been studying us since we arrived. Every patrol, every engagement was data collection. It knows our weapons, our tactics, our weaknesses. But Osei believes the Core has a vulnerability. It requires massive power to maintain its network. Destroy the power relays feeding it, and the swarm loses coordination. One shot. Everything you've built leads to this.",
    beats: [
      { at: 17, sender: "Dr. Osei", text: "I've mapped three primary power conduits feeding the Core. Each one is defended by the heaviest concentrations we've seen. Take them out and the Core goes into emergency hibernation. The swarm fractures.", intel: { type: "weakness", targets: ["Apex Predator", "Core Guardian"], effect: "Power conduit proximity weakens boss shielding — exploit the gaps", missionIds: ["m5c", "m5d"] } },
      { at: 18, sender: "CMD Vasquez", text: "This is it. Every operative, every weapon, every advantage we've scraped together. Osei's mapped the route. You lead the strike team in. The rest of us hold the perimeter. Whatever happens down there, know that you gave this colony a chance.", intel: { type: "ambush", targets: [], effect: "Vasquez's route intel reveals defensive blind spots", missionIds: ["m5c", "m5d"] } },
      { at: 19, sender: "Comms Tech Riley", text: "Commander. I intercepted one last transmission from Liang's shuttle before it left comms range. She told Meridian the experiment was a success. They're sending a second wave. More colonists. More 'triggers.' We stop the Core today, but this fight? It's just getting started." },
    ]
  }
];
