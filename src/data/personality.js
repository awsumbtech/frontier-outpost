// =============================================================================
// PERSONALITY SYSTEM
// Operative personality traits, combat barks, banter, story reactions,
// and death reactions. Tone: military sci-fi — terse, dark, human.
// =============================================================================

// =============================================================================
// 1. PERSONALITY TRAITS
// =============================================================================

export const PERSONALITY_TRAITS = [
  { id: 'cautious',    name: 'Cautious'    }, // Careful, methodical, by-the-book
  { id: 'reckless',   name: 'Reckless'    }, // Aggressive, bold, charges in
  { id: 'stoic',      name: 'Stoic'       }, // Quiet, composed, few words
  { id: 'wisecracker', name: 'Wisecracker' }, // Jokes under pressure, dark humor
  { id: 'protective', name: 'Protective'  }, // Team-first, shields others
  { id: 'cold',       name: 'Cold'        }, // Clinical, detached, efficient
  { id: 'hopeful',    name: 'Hopeful'     }, // Optimistic even in dark times
  { id: 'cynical',    name: 'Cynical'     }, // Skeptical, expects the worst
];

// =============================================================================
// 2. CONTRADICTORY PAIRS
// Traits that should never be assigned to the same operative.
// =============================================================================

export const CONTRADICTORY_PAIRS = [
  ['cautious',   'reckless'  ],
  ['hopeful',    'cynical'   ],
  ['cold',       'protective'],
];

// =============================================================================
// 3. COMBAT BARKS
// Short in-combat quips triggered by game events.
// Each entry: COMBAT_BARKS[eventType][traitId] = string[]
// Lines must be under 8 words each.
// =============================================================================

export const COMBAT_BARKS = {

  // Operative lands a critical hit
  onCrit: {
    cautious:    ["Confirmed critical. Proceeding.", "Clean hit. Keep moving.", "That'll do. Stay tight.", "Textbook. Eyes up."],
    reckless:    ["BOOM!", "That's what I'm talking about!", "Eat that!", "Who's next?!"],
    stoic:       ["Calculated.", "As expected.", "Clean hit.", "Confirmed."],
    wisecracker: ["Full send. You're dead.", "Did that hurt? Asking for me.", "I'm on fire today.", "Tally's going up."],
    protective:  ["One down, keep them safe.", "Clear. Stay behind me.", "That's for the squad.", "Push them back!"],
    cold:        ["Critical achieved.", "Optimal hit.", "Efficiency noted.", "Damage maximized."],
    hopeful:     ["Yes! We're doing this!", "That's the opening we needed.", "Keep it going!", "See? We can do this."],
    cynical:     ["Lucky shot. Don't get used to it.", "Of course it worked. Now what?", "One down, plenty more.", "Don't celebrate yet."],
  },

  // Operative takes heavy damage (>30% HP)
  onHeavyDamage: {
    cautious:    ["Too exposed. Falling back.", "I knew we pushed too far.", "Armor compromised. Reassessing.", "Taking cover. Re-evaluate."],
    reckless:    ["That all you've got?!", "I've had worse!", "Still standing!", "Come on then!"],
    stoic:       ["Still up.", "Manageable.", "Not done.", "Noted."],
    wisecracker: ["Ow. Ow. Ow.", "Great, there goes my good armor.", "I felt that one. A lot.", "Filing a complaint after this."],
    protective:  ["Don't worry about me. Stay down!", "I'm fine — watch your flanks!", "Cover the others, go!", "Hit me instead, you bastards."],
    cold:        ["Integrity compromised. Continuing.", "Acceptable damage. Proceeding.", "Pain registered. Irrelevant.", "Wound logged. Moving."],
    hopeful:     ["Still here. Still fighting.", "Not out yet!", "Come on, I've got more than this.", "Just a scratch. Stay positive."],
    cynical:     ["Of course.", "Saw that coming.", "Just my luck.", "Typical."],
  },

  // A squadmate goes down
  onAllyDown: {
    cautious:    ["We should've held the line!", "Too far. We went too far.", "Everyone consolidate NOW.", "Regroup. Cover the gap."],
    reckless:    ["I'll make them pay for that!", "Nobody touches my squad!", "That's it, gloves are OFF.", "MOVE! I'm taking them all!"],
    stoic:       ["...noted.", "Close the gap.", "Stay focused.", "Keep moving."],
    wisecracker: ["...damn.", "Not now.", "No jokes. Not for this.", "Come back to us."],
    protective:  ["NO! Cover them!", "Get them out of there!", "I'm coming! Hold on!", "On me! We get them back!"],
    cold:        ["Operative down. Adjust fire lanes.", "Gap in coverage. Compensating.", "One less. Redistribute roles.", "Continue mission."],
    hopeful:     ["Stay with us!", "Don't you give up!", "We're going to get through this!", "Hold on — we're almost there!"],
    cynical:     ["And there it is.", "Called it.", "This planet doesn't forgive mistakes.", "Another one down."],
  },

  // Operative kills an enemy
  onKill: {
    cautious:    ["Target down. Scanning.", "Cleared. Moving methodically.", "One accounted for. Stay alert.", "Down. Check your sectors."],
    reckless:    ["DOWN!", "Next!", "That's how it's done!", "Keep them coming!"],
    stoic:       ["Down.", "Clear.", "Done.", "Next."],
    wisecracker: ["Scratch one.", "You're welcome.", "Adding to the tally.", "Next?"],
    protective:  ["That one's not hurting anyone.", "Threat neutralized. Squad secure.", "Got it. Everyone okay?", "Down. Sound off."],
    cold:        ["Target down.", "Eliminated.", "Next target.", "Moving on."],
    hopeful:     ["One fewer between us and home.", "Down. We're getting there.", "That's one less to worry about.", "Almost through this."],
    cynical:     ["One out of a hundred.", "Still more where that came from.", "Great. A dozen to go.", "And another."],
  },

  // New encounter begins
  onEncounterStart: {
    cautious:    ["Stay sharp.", "Watch the flanks.", "By the numbers.", "Check your sectors."],
    reckless:    ["HERE WE GO!", "Come on!", "I was getting bored.", "Finally!"],
    stoic:       ["Contact.", "Eyes up.", "Here they come.", "Steady."],
    wisecracker: ["Running low on targets. Resupply appreciated.", "Right on schedule.", "They really keep coming, huh.", "Fresh batch."],
    protective:  ["Tight formation. Nobody goes alone.", "Stay close. Watch each other.", "I've got left, you've got right.", "Nobody gets left behind."],
    cold:        ["Engaging.", "Hostiles confirmed. Initiating.", "Contact. Beginning elimination.", "Targets acquired."],
    hopeful:     ["We've got this.", "One more and we're clear.", "Stay together, we'll make it.", "Almost through. Come on."],
    cynical:     ["Of course there's more.", "Never a quiet day.", "Right. Here we go again.", "Surprise, surprise."],
  },
};

// =============================================================================
// 4. BANTER LINES
// Brief radio exchanges between encounters.
// Indexed by sorted trait-pair key: 'traitA+traitB' (alphabetical order).
// Each entry: array of exchange objects.
// Exchange: { speakers: [traitA, traitB], lines: [{speaker, text}, ...] }
// Lines under 10 words each.
// =============================================================================

export const BANTER_LINES = {

  // stoic + wisecracker — the comedy duo
  'stoic+wisecracker': [
    {
      speakers: ['stoic', 'wisecracker'],
      lines: [
        { speaker: 'wisecracker', text: "You ever smile? Even a little?" },
        { speaker: 'stoic',       text: "No." },
      ]
    },
    {
      speakers: ['stoic', 'wisecracker'],
      lines: [
        { speaker: 'wisecracker', text: "I tell the best jokes, admit it." },
        { speaker: 'stoic',       text: "They're adequate." },
      ]
    },
    {
      speakers: ['stoic', 'wisecracker'],
      lines: [
        { speaker: 'wisecracker', text: "What are you thinking about right now?" },
        { speaker: 'stoic',       text: "Suppression angles." },
      ]
    },
  ],

  // cautious + reckless — the conflict
  'cautious+reckless': [
    {
      speakers: ['cautious', 'reckless'],
      lines: [
        { speaker: 'cautious', text: "You checked the far side before pushing?" },
        { speaker: 'reckless', text: "I checked it with my boot." },
      ]
    },
    {
      speakers: ['cautious', 'reckless'],
      lines: [
        { speaker: 'reckless', text: "Stop overthinking, just move." },
        { speaker: 'cautious', text: "Overthinking keeps people alive." },
      ]
    },
    {
      speakers: ['cautious', 'reckless'],
      lines: [
        { speaker: 'cautious', text: "That was not the plan." },
        { speaker: 'reckless', text: "Plan worked, didn't it?" },
      ]
    },
  ],

  // hopeful + cynical — the contrast
  'cynical+hopeful': [
    {
      speakers: ['hopeful', 'cynical'],
      lines: [
        { speaker: 'hopeful',  text: "We're actually making a difference here." },
        { speaker: 'cynical',  text: "Keep telling yourself that." },
      ]
    },
    {
      speakers: ['hopeful', 'cynical'],
      lines: [
        { speaker: 'cynical',  text: "You know this ends badly, right?" },
        { speaker: 'hopeful',  text: "Not if I have anything to say." },
      ]
    },
    {
      speakers: ['hopeful', 'cynical'],
      lines: [
        { speaker: 'hopeful',  text: "Sun's out. Two of them, even." },
        { speaker: 'cynical',  text: "Both trying to give me a headache." },
      ]
    },
  ],

  // cold + protective — the tension
  'cold+protective': [
    {
      speakers: ['cold', 'protective'],
      lines: [
        { speaker: 'protective', text: "You don't have to do everything alone." },
        { speaker: 'cold',       text: "I'm more effective that way." },
      ]
    },
    {
      speakers: ['cold', 'protective'],
      lines: [
        { speaker: 'cold',       text: "Your attachment is a tactical liability." },
        { speaker: 'protective', text: "My squad is not a liability." },
      ]
    },
    {
      speakers: ['cold', 'protective'],
      lines: [
        { speaker: 'protective', text: "You saved me back there." },
        { speaker: 'cold',       text: "You're more useful alive." },
      ]
    },
  ],

  // wisecracker + cynical — dark humor
  'cynical+wisecracker': [
    {
      speakers: ['wisecracker', 'cynical'],
      lines: [
        { speaker: 'wisecracker', text: "Bright side: we're definitely getting hazard pay." },
        { speaker: 'cynical',     text: "There is no bright side." },
      ]
    },
    {
      speakers: ['wisecracker', 'cynical'],
      lines: [
        { speaker: 'cynical',     text: "This mission is going to kill us all." },
        { speaker: 'wisecracker', text: "Sure, but think of the story." },
      ]
    },
    {
      speakers: ['wisecracker', 'cynical'],
      lines: [
        { speaker: 'wisecracker', text: "You're the fun one, you know that?" },
        { speaker: 'cynical',     text: "You haven't met fun." },
      ]
    },
  ],

  // reckless + protective — the friction
  'protective+reckless': [
    {
      speakers: ['reckless', 'protective'],
      lines: [
        { speaker: 'reckless',   text: "I had it under control." },
        { speaker: 'protective', text: "You were on fire. Literally." },
      ]
    },
    {
      speakers: ['reckless', 'protective'],
      lines: [
        { speaker: 'protective', text: "Stay in formation. I mean it." },
        { speaker: 'reckless',   text: "Formations slow you down." },
      ]
    },
    {
      speakers: ['reckless', 'protective'],
      lines: [
        { speaker: 'reckless',   text: "You worry too much." },
        { speaker: 'protective', text: "Someone has to." },
      ]
    },
  ],

  // stoic + cold — mutual respect
  'cold+stoic': [
    {
      speakers: ['stoic', 'cold'],
      lines: [
        { speaker: 'stoic', text: "Good shooting back there." },
        { speaker: 'cold',  text: "Adequate." },
      ]
    },
    {
      speakers: ['stoic', 'cold'],
      lines: [
        { speaker: 'cold',  text: "You don't talk much." },
        { speaker: 'stoic', text: "Neither do you." },
      ]
    },
    {
      speakers: ['stoic', 'cold'],
      lines: [
        { speaker: 'stoic', text: "Ready." },
        { speaker: 'cold',  text: "Ready." },
      ]
    },
  ],

  // hopeful + protective — warmth
  'hopeful+protective': [
    {
      speakers: ['hopeful', 'protective'],
      lines: [
        { speaker: 'hopeful',    text: "We're going to get everyone home." },
        { speaker: 'protective', text: "Yeah. We are." },
      ]
    },
    {
      speakers: ['hopeful', 'protective'],
      lines: [
        { speaker: 'protective', text: "You doing okay back there?" },
        { speaker: 'hopeful',    text: "Better now that we're all together." },
      ]
    },
    {
      speakers: ['hopeful', 'protective'],
      lines: [
        { speaker: 'hopeful',    text: "I trust this squad with my life." },
        { speaker: 'protective', text: "Good. Because you have to." },
      ]
    },
  ],

  // cautious + cold — professional
  'cautious+cold': [
    {
      speakers: ['cautious', 'cold'],
      lines: [
        { speaker: 'cautious', text: "Confirming the route before we push." },
        { speaker: 'cold',     text: "Confirmed. Proceed." },
      ]
    },
    {
      speakers: ['cautious', 'cold'],
      lines: [
        { speaker: 'cold',     text: "Your caution wastes time." },
        { speaker: 'cautious', text: "Haste wastes lives." },
      ]
    },
    {
      speakers: ['cautious', 'cold'],
      lines: [
        { speaker: 'cautious', text: "I want an exit before we go in." },
        { speaker: 'cold',     text: "Already mapped two." },
      ]
    },
  ],

  // wisecracker + hopeful — lightness
  'hopeful+wisecracker': [
    {
      speakers: ['wisecracker', 'hopeful'],
      lines: [
        { speaker: 'wisecracker', text: "Name a reason to smile right now." },
        { speaker: 'hopeful',     text: "We're still breathing." },
      ]
    },
    {
      speakers: ['wisecracker', 'hopeful'],
      lines: [
        { speaker: 'hopeful',     text: "You always know how to lighten the mood." },
        { speaker: 'wisecracker', text: "It's a gift. Also a coping mechanism." },
      ]
    },
    {
      speakers: ['wisecracker', 'hopeful'],
      lines: [
        { speaker: 'wisecracker', text: "You actually like it out here, don't you." },
        { speaker: 'hopeful',     text: "Two suns. Alien forests. Yeah, kinda." },
      ]
    },
  ],

  // reckless + cynical — chaos
  'cynical+reckless': [
    {
      speakers: ['reckless', 'cynical'],
      lines: [
        { speaker: 'reckless', text: "You've got to admit that was awesome." },
        { speaker: 'cynical',  text: "That was a disaster that worked." },
      ]
    },
    {
      speakers: ['reckless', 'cynical'],
      lines: [
        { speaker: 'cynical',  text: "You're going to get us all killed." },
        { speaker: 'reckless', text: "Not today." },
      ]
    },
    {
      speakers: ['reckless', 'cynical'],
      lines: [
        { speaker: 'reckless', text: "Nothing ventured, nothing gained." },
        { speaker: 'cynical',  text: "Nothing ventured, nothing lost." },
      ]
    },
  ],

  // stoic + protective — quiet solidarity
  'protective+stoic': [
    {
      speakers: ['stoic', 'protective'],
      lines: [
        { speaker: 'protective', text: "Watching your six out there." },
        { speaker: 'stoic',      text: "Appreciated." },
      ]
    },
    {
      speakers: ['stoic', 'protective'],
      lines: [
        { speaker: 'stoic',      text: "You don't need to check on me." },
        { speaker: 'protective', text: "I know. I do it anyway." },
      ]
    },
    {
      speakers: ['stoic', 'protective'],
      lines: [
        { speaker: 'protective', text: "Tell me if it gets too heavy." },
        { speaker: 'stoic',      text: "...you'll know." },
      ]
    },
  ],

  // cautious + hopeful — grounded optimism
  'cautious+hopeful': [
    {
      speakers: ['cautious', 'hopeful'],
      lines: [
        { speaker: 'hopeful',  text: "I think we're going to make it." },
        { speaker: 'cautious', text: "Hope so. Verify the exit first." },
      ]
    },
    {
      speakers: ['cautious', 'hopeful'],
      lines: [
        { speaker: 'cautious', text: "Don't get ahead of yourself." },
        { speaker: 'hopeful',  text: "Someone has to look ahead." },
      ]
    },
    {
      speakers: ['cautious', 'hopeful'],
      lines: [
        { speaker: 'hopeful',  text: "We've cleared worse than this." },
        { speaker: 'cautious', text: "And nearly died doing it." },
      ]
    },
  ],

  // cold + cynical — dark pragmatism
  'cold+cynical': [
    {
      speakers: ['cold', 'cynical'],
      lines: [
        { speaker: 'cynical', text: "This colony was never going to survive." },
        { speaker: 'cold',    text: "Irrelevant. Complete the mission." },
      ]
    },
    {
      speakers: ['cold', 'cynical'],
      lines: [
        { speaker: 'cold',    text: "Sentiment clouds judgment." },
        { speaker: 'cynical', text: "I gave up sentiment years ago." },
      ]
    },
    {
      speakers: ['cold', 'cynical'],
      lines: [
        { speaker: 'cynical', text: "You ever wonder if it matters?" },
        { speaker: 'cold',    text: "No." },
      ]
    },
  ],

  // wisecracker + protective — deflection
  'protective+wisecracker': [
    {
      speakers: ['wisecracker', 'protective'],
      lines: [
        { speaker: 'wisecracker', text: "You always this tense or is it just me?" },
        { speaker: 'protective',  text: "It's you. You're reckless." },
      ]
    },
    {
      speakers: ['wisecracker', 'protective'],
      lines: [
        { speaker: 'protective',  text: "You okay? You got quiet." },
        { speaker: 'wisecracker', text: "Just... reloading the jokes. Give me a sec." },
      ]
    },
    {
      speakers: ['wisecracker', 'protective'],
      lines: [
        { speaker: 'wisecracker', text: "You'd take a bullet for any of us." },
        { speaker: 'protective',  text: "Don't make it weird." },
      ]
    },
  ],
};

// =============================================================================
// 5. STORY REACTIONS
// Operative reactions to story beats. Indexed by "chapterId-at" key.
// Each entry: array of { trait, text } reaction objects.
// One short line each — radio chatter style.
// =============================================================================

export const STORY_REACTIONS = {

  // ch1-1: Vasquez — perimeter's holding, movement on eastern ridge
  'ch1-1': [
    { trait: 'cautious',    text: "Eastern ridge. Noted. We go slow." },
    { trait: 'reckless',    text: "Movement? Let's go find out what it is." },
    { trait: 'hopeful',     text: "Perimeter's holding. That's something." },
    { trait: 'cynical',     text: "Day one and they're already pushing us." },
  ],

  // ch1-2: Osei — fauna aggression suggests they're defending something
  'ch1-2': [
    { trait: 'stoic',       text: "Defending something. Keep that in mind." },
    { trait: 'cautious',    text: "If they're defending something, we need to know what." },
    { trait: 'cynical',     text: "Great. Something to find. Or something to find us." },
    { trait: 'hopeful',     text: "Territorial is manageable. We just have to be careful." },
  ],

  // ch1-3: Vasquez — Liang wants eastern sectors cleared
  'ch1-3': [
    { trait: 'cautious',    text: "Deeper patrols need more intel first." },
    { trait: 'reckless',    text: "Deeper patrols. Finally." },
    { trait: 'protective',  text: "More exposure means more risk to the squad." },
    { trait: 'cold',        text: "Orders received. Proceeding accordingly." },
  ],

  // ch2-5: Osei — creatures are engineered, not natural
  'ch2-5': [
    { trait: 'cynical',     text: "Engineered. Of course they are." },
    { trait: 'cautious',    text: "Someone built these things. That's a whole different threat." },
    { trait: 'cold',        text: "Engineered organisms. Adjust threat assessment accordingly." },
    { trait: 'stoic',       text: "Someone made these. Someone sent them." },
  ],

  // ch2-6: Riley — countdown signal underground
  'ch2-6': [
    { trait: 'cautious',    text: "A countdown. We need to find out what it's for." },
    { trait: 'reckless',    text: "Countdown to what? I want to be there when it hits zero." },
    { trait: 'hopeful',     text: "If we know it's coming, we can stop it." },
    { trait: 'cynical',     text: "A countdown. To something bad. Obviously." },
  ],

  // ch2-7: Vasquez — Liang shut down Riley's findings suspiciously
  'ch2-7': [
    { trait: 'cynical',     text: "The ones in charge never want to hear it." },
    { trait: 'cautious',    text: "If Liang's hiding something, we need to work around her." },
    { trait: 'cold',        text: "Suppression of findings. Motive unknown. Flag for monitoring." },
    { trait: 'protective',  text: "If she's putting the squad at risk, I want to know why." },
  ],

  // ch3-9: Osei — hive matches Cygnus probe data (probe that "malfunctioned")
  'ch3-9': [
    { trait: 'cynical',     text: "Probe didn't malfunction. It was killed." },
    { trait: 'cautious',    text: "Someone knew about this before we landed. That's not an accident." },
    { trait: 'stoic',       text: "They knew. They sent us anyway." },
    { trait: 'cold',        text: "Prior knowledge concealed. This was deliberate." },
  ],

  // ch3-10: Vasquez — Liang restricted access, encrypted comms off-world
  'ch3-10': [
    { trait: 'cynical',     text: "She's been talking to someone the whole time." },
    { trait: 'cautious',    text: "Off-world comms, encrypted. We're operating blind." },
    { trait: 'reckless',    text: "I want five minutes alone with her comm logs." },
    { trait: 'protective',  text: "She's been lying to us this whole time. To all of us." },
  ],

  // ch3-11: Riley — countdown accelerating, colony was sent to trigger this
  'ch3-11': [
    { trait: 'cynical',     text: "We were bait. We were always bait." },
    { trait: 'hopeful',     text: "Then we stop it. That's why we're still here." },
    { trait: 'reckless',    text: "Someone triggered this? Tell me who." },
    { trait: 'cold',        text: "Colony used as a catalyst. Calculating new parameters." },
  ],

  // ch4-13: Liang abandoned colony, Vasquez assumes command
  'ch4-13': [
    { trait: 'cynical',     text: "Walked out with alien tech. Knew she would." },
    { trait: 'protective',  text: "She abandoned forty-seven people. Unforgivable." },
    { trait: 'cold',        text: "Command transferred. Vasquez is now the objective anchor." },
    { trait: 'hopeful',     text: "Vasquez won't leave us. We finish this together." },
  ],

  // ch4-14: Osei — creatures adapting to tactics, intelligence directing them
  'ch4-14': [
    { trait: 'cautious',    text: "If they're adapting, our playbook is already compromised." },
    { trait: 'cold',        text: "Tactical variance required. Current patterns are burned." },
    { trait: 'stoic',       text: "They're learning. We learn faster." },
    { trait: 'cynical',     text: "Something's running them. Something smarter than us." },
  ],

  // ch4-15: Lost contact with southern settlements, Sigma is last line
  'ch4-15': [
    { trait: 'protective',  text: "If we fall, there's nothing left. Nobody falls." },
    { trait: 'hopeful',     text: "Last line means we can still hold it. We hold it." },
    { trait: 'cynical',     text: "Last line. Great. Love those odds." },
    { trait: 'reckless',    text: "Last line? Then we make it count." },
  ],

  // ch5-17: Osei mapped three power conduits to destroy
  'ch5-17': [
    { trait: 'cautious',    text: "Three targets. We plan each approach separately." },
    { trait: 'cold',        text: "Conduits identified. Optimal order mapped." },
    { trait: 'reckless',    text: "Three things to blow up? Let's go." },
    { trait: 'hopeful',     text: "Three hits and this thing goes dark. We can do three." },
  ],

  // ch5-18: Vasquez — final assault on the Core
  'ch5-18': [
    { trait: 'stoic',       text: "This is what we came for. Let's finish it." },
    { trait: 'protective',  text: "Everyone comes back from this. I mean it." },
    { trait: 'cynical',     text: "Final assault. Hope the math's in our favor." },
    { trait: 'reckless',    text: "Final push! Let's burn it down!" },
  ],

  // ch5-19: Riley — Liang told Meridian "experiment succeeded," second wave coming
  'ch5-19': [
    { trait: 'cynical',     text: "Experiment succeeded. We're the data." },
    { trait: 'cold',        text: "Second wave confirmed. Threat window is now." },
    { trait: 'protective',  text: "A second wave. We end this here, or it never ends." },
    { trait: 'hopeful',     text: "Then we make sure there's nothing to send a wave at." },
  ],
};

// =============================================================================
// 6. DEATH REACTIONS
// What an operative says when a squadmate falls permanently.
// Indexed by surviving operative's trait id. 3 lines each.
// =============================================================================

export const DEATH_REACTIONS = {
  cautious:    [
    "We should have pulled back.",
    "I saw the signs. I should have said something.",
    "Adjusting protocol.",
  ],
  reckless:    [
    "I'll make them pay.",
    "This isn't over.",
    "They died fighting. Good.",
  ],
  stoic:       [
    "...noted.",
    "They knew the risks.",
    "We carry on.",
  ],
  wisecracker: [
    "...damn.",
    "No joke for this one.",
    "Save me a seat.",
  ],
  protective:  [
    "I should've been there.",
    "Never again.",
    "This is on me.",
  ],
  cold:        [
    "Noted. Adjusting tactical assessment.",
    "One less variable.",
    "Mission continues.",
  ],
  hopeful:     [
    "They gave us a chance.",
    "We honor them by finishing this.",
    "They're watching over us.",
  ],
  cynical:     [
    "Another name for the wall.",
    "This planet takes everything.",
    "Knew this would happen.",
  ],
};
