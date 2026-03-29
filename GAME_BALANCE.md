# Game Balance Reference

## Combat Math

### Damage Calculation
```
baseDmg = attacker.damage + rng(-2, 4)
if crit: baseDmg *= 1.8 (or executeCrit multiplier if applicable)
effectiveArmor = max(0, target.armor - attacker.armorPen)
finalDmg = max(1, baseDmg - floor(effectiveArmor * 0.4))
```

### Crit Check
```
isCrit = random(0,100) < attacker.crit
```

### Evasion Check
```
evaded = random(0,100) < target.evasion
```

### Shield Absorption
Shields absorb damage before HP. Shield damage = min(remaining damage, current shield).

### Taunt
Vanguard Provoke: 70% chance enemies target the taunter instead of random ally.

### Between-Encounter Recovery
- HP: +15% of max HP
- Shield: +25% of max shield

---

## Class Base Stats

| Class | HP | Armor | Shield | Damage | Speed | Crit | Evasion |
|-------|-----|-------|--------|--------|-------|------|---------|
| Vanguard | 140 | 18 | 25 | 10 | 7 | 2% | 1% |
| Recon | 65 | 4 | 8 | 24 | 17 | 20% | 16% |
| Engineer | 85 | 10 | 18 | 14 | 10 | 5% | 4% |
| Medic | 90 | 8 | 15 | 8 | 13 | 3% | 6% |

---

## Enemy Templates

| Enemy | HP | Armor | Damage | Speed | Tier |
|-------|-----|-------|--------|-------|------|
| Feral Drone | 30 | 2 | 8 | 14 | 1 |
| Scav Raider | 45 | 5 | 12 | 10 | 1 |
| Spore Beast | 60 | 3 | 15 | 8 | 1 |
| Rogue Mech | 80 | 18 | 14 | 6 | 2 |
| Xeno Stalker | 55 | 8 | 20 | 16 | 2 |
| Hive Swarm | 40 | 0 | 25 | 12 | 2 |
| Heavy Sentinel | 120 | 25 | 18 | 4 | 3 |
| Psi-Wraith | 70 | 5 | 30 | 14 | 3 |
| Apex Predator | 200 | 20 | 35 | 10 | 4 |
| Core Guardian | 300 | 30 | 28 | 8 | 4 |

### Enemy Scaling
```
scale = 1 + (tier - 1) * 0.15 + encounterNum * 0.05
scaledHP = round(baseHP * scale)
scaledArmor = round(baseArmor * scale)
scaledDamage = round(baseDamage * scale)
```

### Encounter Composition
- Tier 1-2: 2-3 enemies per encounter
- Tier 3-4: 2-4 enemies per encounter
- Enemies selected from templates where tier <= missionTier and tier >= missionTier - 1

---

## Gear Generation

### Rarity Roll
```
roll = random(0,100) + (level * 2)
Prototype: roll > 98
Epic: roll > 90
Rare: roll > 75
Uncommon: roll > 50
Common: otherwise
```

### Stat Multiplier
```
mult = 1 + rarity * 0.3 + level * 0.1
```

### Weapon Stats
- damage: rng(8,15) * mult
- crit: rng(2,8) * (1 + rarity * 0.2)
- armorPen: rarity >= 2 ? rng(5,15) * rarity : 0

### Armor Stats
- armor: rng(5,12) * mult
- hp: rng(10,25) * mult
- shield: rarity >= 1 ? rng(5,15) * mult : 0
- evasion: rarity >= 3 ? rng(3,8) : 0

### Mod Slots
- modSlots = min(rarity, 3)

### Scrap Value
- credits = (rarity + 1) * 15 + level * 5

---

## Progression

### XP Formula
```
xpToLevel = floor(100 * 1.4^(level - 1))
```

| Level | XP Required | Cumulative |
|-------|-------------|------------|
| 1 > 2 | 100 | 100 |
| 2 > 3 | 140 | 240 |
| 3 > 4 | 196 | 436 |
| 4 > 5 | 274 | 710 |
| 5 > 6 | 384 | 1,094 |
| 6 > 7 | 538 | 1,632 |
| 7 > 8 | 753 | 2,385 |
| 8 > 9 | 1,054 | 3,439 |
| 9 > 10 | 1,476 | 4,915 |
| 10 > 11 | 2,066 | 6,981 |
| 11 > 12 | 2,893 | 9,874 |

### Mission XP
```
xp = round(50 * mission.xpMult * mission.tier * repeatPenalty)
repeatPenalty = 1.0 (first clear) or 0.5 (repeat)
```

### Mission Credits
```
credits = round(rng(30,60) * mission.tier * repeatPenalty)
```

---

## Mission Difficulty Curve

| Chapter | Missions | Tier | Rec Levels | Encounters |
|---------|----------|------|------------|------------|
| 1: Planetfall | 4 | 1 | 1-2 | 2-3 |
| 2: Strange Signals | 4 | 2 | 3-4 | 3-4 |
| 3: The Hive | 4 | 3 | 5-7 | 4-5 |
| 4: Containment Breach | 4 | 3-4 | 7-9 | 4-5 |
| 5: The Core | 4 | 4 | 9-12 | 5-7 |

---

## Stim Costs

| Stim | Cost | Effect |
|------|------|--------|
| Health Stim | 30 | 40% HP to one ally |
| Shield Cell | 25 | 100% shield to one ally |
| Adrenaline Injector | 40 | +50% dmg 3 rounds |
| Nano Repair Kit | 50 | 25% HP to all |
| Purge Shot | 35 | Cleanse + 10% evasion 2 rounds |

---

## Economy

### Income Sources
- Mission credits (30-300 per mission depending on tier and first clear)
- Gear scrapping (20-100 per item depending on rarity/level)

### Expenses
- Recruit operative: 150
- Stims: 25-50 each
- (Future: mod crafting costs)

### Expected Credits Per Chapter
Rough estimate for first-clear only:
- Ch1: ~200-300 credits
- Ch2: ~400-600 credits
- Ch3: ~600-900 credits
- Ch4: ~800-1200 credits
- Ch5: ~1000-1600 credits
