import { ENEMY_TEMPLATES } from '../data/enemies';
import { CLASSES } from '../data/classes';
import { rng, pick, uid } from './utils';
import { getEffectiveStats } from './operatives';
import { STATUS_EFFECTS } from '../data/constants';

export function generateEncounter(tier, encounterNum) {
  const enemies = ENEMY_TEMPLATES.filter(e => e.tier <= tier && e.tier >= tier - 1);
  const count = tier <= 2 ? rng(2, 3) : rng(2, 4);
  return Array.from({ length: count }, () => {
    const t = pick(enemies);
    const scale = 1 + (tier - 1) * 0.15 + encounterNum * 0.05;
    const instance = { id: uid(), ...t, hp: Math.round(t.hp * scale), maxHp: Math.round(t.hp * scale),
      armor: Math.round(t.armor * scale), damage: Math.round(t.damage * scale), speed: t.speed, alive: true, stunned: false, bleed: 0 };
    if (t.abilities) instance.abilityCooldowns = {};
    return instance;
  });
}

export function combatRound(squad, enemies, log) {
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

// ─── Turn-Based Combat Functions (Phase 1) ─────────────────────────────────
// All functions below are PURE: they return new objects, never mutate inputs.
// Used by the turn-based combat system alongside the legacy combatRound above.

function cloneSquad(squad) { return squad.map(o => ({ ...o })); }
function cloneEnemies(enemies) { return enemies.map(e => ({ ...e })); }

/**
 * Build the turn order for one round. Sorted by speed descending.
 * Returns array of { unitId, isAlly, speed, name }.
 */
export function buildTurnQueue(squad, enemies) {
  const entries = [];
  for (const o of squad) {
    if (!o.alive) continue;
    const stats = getEffectiveStats(o);
    entries.push({ unitId: o.id, isAlly: true, speed: stats.speed || 0, name: o.name });
  }
  for (const e of enemies) {
    if (!e.alive) continue;
    entries.push({ unitId: e.id, isAlly: false, speed: e.speed || 0, name: e.name });
  }
  return entries.sort((a, b) => b.speed - a.speed);
}

/**
 * Apply start-of-round effects: mines (round 1), orbital strikes (every 4th round),
 * and decision-based effects (counterAmbush, overload).
 */
export function applyRoundStartEffects(roundNum, squad, enemies, decisionApplied = {}) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];

  if (roundNum === 1) {
    for (const op of s) {
      const stats = getEffectiveStats(op);
      if (stats.minesDmg) {
        for (const en of e.filter(x => x.alive)) { en.hp -= stats.minesDmg; if (en.hp <= 0) en.alive = false; }
        log.push({ text: `💣 Mines ${stats.minesDmg} AoE!`, type: "aoe" });
      }
    }
    if (decisionApplied.counterAmbush) log.push({ text: `Counter-ambush! +30% dmg`, type: "decision" });
    if (decisionApplied.overload) {
      for (const en of e.filter(x => x.alive)) { en.hp -= 25; if (en.hp <= 0) en.alive = false; }
      log.push({ text: `Overload 25 AoE!`, type: "aoe" });
    }
  }

  if (roundNum % 4 === 0) {
    for (const op of s) {
      const stats = getEffectiveStats(op);
      if (stats.orbitalDmg) {
        for (const en of e.filter(x => x.alive)) { const d = Math.max(1, stats.orbitalDmg - Math.floor(en.armor * 0.2)); en.hp -= d; if (en.hp <= 0) en.alive = false; }
        log.push({ text: `🛰 ORBITAL ${stats.orbitalDmg} AoE!`, type: "aoe" });
      }
    }
  }

  return { squad: s, enemies: e, log };
}

/**
 * Apply start-of-turn effects for a specific unit: bleed tick, stun check, clear defend.
 * Returns { squad, enemies, log, canAct }.
 */
export function applyTurnStartEffects(unitId, isAlly, squad, enemies) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];
  let canAct = true;

  if (isAlly) {
    const unit = s.find(o => o.id === unitId);
    if (!unit || !unit.alive) return { squad: s, enemies: e, log, canAct: false };
    // Clear defend at the start of this unit's next turn
    if (unit.defending) unit.defending = false;
    // Allies don't bleed in current system
    if (unit.stunned) { unit.stunned = false; log.push({ text: `${unit.name} stunned!`, type: "stun" }); canAct = false; }
    // Process DoT effects before decrementing
    if (!unit.activeEffects) unit.activeEffects = [];
    const dotResultAlly = tickStatusEffects(unit);
    for (const entry of dotResultAlly.logEntries) log.push(entry);
  } else {
    const unit = e.find(x => x.id === unitId);
    if (!unit || !unit.alive) return { squad: s, enemies: e, log, canAct: false };
    if (unit.stunned) { unit.stunned = false; log.push({ text: `${unit.name} stunned!`, type: "stun" }); canAct = false; }
    if (canAct && unit.bleed > 0) {
      unit.hp -= unit.bleed;
      log.push({ text: `${unit.name} bleeds ${unit.bleed}`, type: "bleed" });
      if (unit.hp <= 0) { unit.alive = false; log.push({ text: `${unit.name} bleeds out!`, type: "kill" }); canAct = false; }
    }
    // Process DoT effects and tick active effects on enemy
    if (!unit.activeEffects) unit.activeEffects = [];
    const dotResultEnemy = tickStatusEffects(unit);
    for (const entry of dotResultEnemy.logEntries) log.push(entry);
    if (dotResultEnemy.totalDotDamage > 0 && unit.hp <= 0) {
      unit.alive = false;
      canAct = false;
    }
  }

  return { squad: s, enemies: e, log, canAct };
}

/**
 * Execute an ally's attack on a chosen enemy target.
 * Uses the existing damage formula from combatRound.
 */
export function executeAllyAttack(attackerId, targetId, squad, enemies) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];

  const attacker = s.find(o => o.id === attackerId);
  const target = e.find(x => x.id === targetId);
  if (!attacker || !attacker.alive || !target || !target.alive) return { squad: s, enemies: e, log };

  const stats = getBuffModifiedStats(attacker, true);
  let dmg = stats.damage + rng(-2, 4);
  const isCrit = Math.random() * 100 < (stats.crit || 0);
  if (isCrit) {
    dmg = Math.round(dmg * 1.8);
    if (stats.executeCrit && target.hp < target.maxHp * 0.3) dmg *= 2;
    if (stats.critBleed) target.bleed = (target.bleed || 0) + stats.critBleed;
  }
  const targetStats = getBuffModifiedStats(target, false);
  const armor = Math.max(0, targetStats.armor - (stats.armorPen || 0));
  dmg = Math.max(1, dmg - Math.floor(armor * 0.4));
  // Apply damageTaken modifier from debuffs (e.g. Mark Target)
  if (targetStats.damageTakenMod) dmg = Math.round(dmg * (1 + targetStats.damageTakenMod));
  target.hp -= dmg;
  const killed = target.hp <= 0; if (killed) target.alive = false;
  log.push({ text: `${attacker.icon} ${attacker.name.split(" ")[0]} ▸ ${target.name} ${dmg}${isCrit ? " ★CRIT" : ""}${killed ? " ✘KILL" : ""}`, type: isCrit ? (killed ? "critkill" : "crit") : (killed ? "kill" : "ally") });

  return { squad: s, enemies: e, log };
}

/**
 * Execute ally defend. Sets defending: true on the unit.
 */
export function executeAllyDefend(attackerId, squad) {
  const s = cloneSquad(squad);
  const log = [];

  const unit = s.find(o => o.id === attackerId);
  if (!unit || !unit.alive) return { squad: s, log };

  unit.defending = true;
  log.push({ text: `🛡 ${unit.name.split(" ")[0]} defends!`, type: "defend" });

  return { squad: s, log };
}

/**
 * Execute item (stim) usage during combat.
 * Returns { squad, stims, log }.
 */
export function executeItemUse(stimId, targetId, squad, stims) {
  const s = cloneSquad(squad);
  const newStims = [...stims];
  const log = [];

  const stimIdx = newStims.findIndex(st => st.id === stimId);
  if (stimIdx === -1) return { squad: s, stims: newStims, log };
  const stim = newStims[stimIdx];

  switch (stim.id) {
    case 'health_stim': {
      const target = s.find(o => o.id === targetId);
      if (!target || !target.alive) break;
      const maxHp = getEffectiveStats(target).hp;
      target.currentHp = Math.min(maxHp, target.currentHp + Math.round(maxHp * 0.4));
      log.push({ text: `💚 ${target.name.split(" ")[0]} healed +40% HP`, type: "item" });
      break;
    }
    case 'shield_cell': {
      const target = s.find(o => o.id === targetId);
      if (!target || !target.alive) break;
      const maxShield = getEffectiveStats(target).shield;
      target.currentShield = maxShield;
      log.push({ text: `🔷 ${target.name.split(" ")[0]} shields restored`, type: "item" });
      break;
    }
    case 'nano_kit': {
      for (const op of s.filter(o => o.alive)) {
        const maxHp = getEffectiveStats(op).hp;
        op.currentHp = Math.min(maxHp, op.currentHp + Math.round(maxHp * 0.25));
      }
      log.push({ text: `🔧 Nano Kit heals squad +25% HP`, type: "item" });
      break;
    }
    case 'adrenaline': {
      const target = s.find(o => o.id === targetId);
      if (!target || !target.alive) break;
      target._adrenalineRounds = 3;
      log.push({ text: `⚡ ${target.name.split(" ")[0]} boosted! +50% dmg 3 rounds`, type: "item" });
      break;
    }
    case 'purge_shot': {
      const target = s.find(o => o.id === targetId);
      if (!target || !target.alive) break;
      target._purgeRounds = 2;
      log.push({ text: `✨ ${target.name.split(" ")[0]} purged! +10% evasion 2 rounds`, type: "item" });
      break;
    }
  }

  // Consume the stim
  newStims.splice(stimIdx, 1);

  return { squad: s, stims: newStims, log };
}

/**
 * Apply post-action passive effects for an ally: turrets, double act, AoE, heals.
 * Fires after the ally takes an Attack action.
 */
export function applyAllyPassives(attackerId, squad, enemies) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];

  const attacker = s.find(o => o.id === attackerId);
  if (!attacker || !attacker.alive) return { squad: s, enemies: e, log };

  const stats = getEffectiveStats(attacker);

  // Turrets
  if (stats.turretDmg) {
    const targets = e.filter(x => x.alive);
    if (targets.length > 0) {
      const tt = pick(targets);
      let td = stats.turretDmg + rng(-1, 3);
      td = stats.turretArmorPen
        ? Math.max(1, td - Math.floor(tt.armor * (1 - stats.turretArmorPen / 100) * 0.4))
        : Math.max(1, td - Math.floor(tt.armor * 0.4));
      tt.hp -= td; const tk = tt.hp <= 0; if (tk) tt.alive = false;
      log.push({ text: `  ⚙ Turret ▸ ${tt.name} ${td}${tk ? " ✘KILL" : ""}`, type: tk ? "kill" : "turret" });
      if (stats.dualTurret) {
        const t3 = e.filter(x => x.alive);
        if (t3.length > 0) {
          const tt2 = pick(t3); const td2 = Math.round(td * stats.dualTurret);
          tt2.hp -= td2; const tk2 = tt2.hp <= 0; if (tk2) tt2.alive = false;
          log.push({ text: `  ⚙ Turret#2 ▸ ${tt2.name} ${td2}${tk2 ? " ✘KILL" : ""}`, type: tk2 ? "kill" : "turret" });
        }
      }
    }
  }

  // Double act
  if (stats.doubleAct && Math.random() < stats.doubleAct) {
    const targets = e.filter(x => x.alive);
    if (targets.length > 0) {
      const tt = pick(targets);
      const baseDmg = stats.damage + rng(-2, 4);
      let d2 = Math.round(baseDmg * 0.7);
      const armor = Math.max(0, tt.armor - (stats.armorPen || 0));
      d2 = Math.max(1, d2 - Math.floor(armor * 0.4));
      tt.hp -= d2; const tk = tt.hp <= 0; if (tk) tt.alive = false;
      log.push({ text: `  ⚡ ${attacker.name.split(" ")[0]} again! ${d2} ▸ ${tt.name}${tk ? " ✘KILL" : ""}`, type: "double" });
    }
  }

  // AoE damage
  if (stats.aoeDmg && Math.random() > 0.5) {
    for (const en of e.filter(x => x.alive)) {
      const ad = Math.max(1, stats.aoeDmg - Math.floor(en.armor * 0.3));
      en.hp -= ad; if (en.hp <= 0) en.alive = false;
    }
    log.push({ text: `  💥 AoE ${stats.aoeDmg}!`, type: "aoe" });
  }

  // Single-target heal
  if ((stats.healPerRound || 0) > 0) {
    const wounded = s.filter(o => o.alive && o.currentHp < getEffectiveStats(o).hp).sort((a, b) => a.currentHp - b.currentHp);
    if (wounded.length > 0) {
      const mhp = getEffectiveStats(wounded[0]).hp;
      wounded[0].currentHp = Math.min(mhp, wounded[0].currentHp + stats.healPerRound);
      log.push({ text: `  💚 Heal ${wounded[0].name.split(" ")[0]} +${stats.healPerRound}`, type: "heal" });
    }
  }

  // AoE heal
  if (stats.aoeHeal) {
    for (const ally of s.filter(o => o.alive)) {
      const mhp = getEffectiveStats(ally).hp;
      ally.currentHp = Math.min(mhp, ally.currentHp + stats.aoeHeal);
    }
    log.push({ text: `  💚 Regen +${stats.aoeHeal} all`, type: "heal" });
  }

  return { squad: s, enemies: e, log };
}

/**
 * Execute an enemy's turn. Auto-targets using existing AI logic.
 * Respects the defending flag — 50% DR if target is defending.
 */
export function executeEnemyTurn(enemyId, squad, enemies) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];

  const enemy = e.find(x => x.id === enemyId);
  if (!enemy || !enemy.alive) return { squad: s, enemies: e, log };

  const targets = s.filter(o => o.alive);
  if (targets.length === 0) return { squad: s, enemies: e, log };

  const taunters = targets.filter(o => getBuffModifiedStats(o, true).taunt);
  const target = taunters.length > 0 && Math.random() > 0.3 ? pick(taunters) : pick(targets);
  const stats = getBuffModifiedStats(target, true);

  // Evasion check (includes Smoke Bomb evasion buff)
  if (Math.random() * 100 < (stats.evasion || 0)) {
    log.push({ text: `  ${target.name.split(" ")[0]} dodges ${enemy.name}!`, type: "evade" });
    if (stats.evadeCounter) {
      const cd = Math.round(stats.damage * stats.evadeCounter);
      enemy.hp -= cd; const tk = enemy.hp <= 0; if (tk) enemy.alive = false;
      log.push({ text: `  ↩ Counter ${cd} ▸ ${enemy.name}${tk ? " ✘KILL" : ""}`, type: tk ? "kill" : "counter" });
    }
    return { squad: s, enemies: e, log };
  }

  let dmg = enemy.damage + rng(-2, 3);

  // Shield redirect
  if (stats.shieldRedirect && target.currentShield > 0) {
    const r = Math.round(dmg * stats.shieldRedirect);
    const sd = Math.min(r, target.currentShield);
    target.currentShield -= sd; dmg -= sd;
  }

  // Armor reduction
  dmg = Math.max(1, dmg - Math.floor((stats.armor || 0) * 0.4));

  // Defend: 50% damage reduction
  if (target.defending) dmg = Math.max(1, Math.floor(dmg * 0.5));

  // Shield absorption
  if (target.currentShield > 0) {
    const sa = Math.min(dmg, target.currentShield);
    target.currentShield -= sa; dmg -= sa;
  }

  target.currentHp -= dmg;
  const killed = target.currentHp <= 0;
  if (killed) { target.alive = false; target.currentHp = 0; }
  log.push({ text: `  ${enemy.name} ▸ ${target.icon}${target.name.split(" ")[0]} ${dmg}${killed ? " ☠DOWN" : ""}${target.defending ? " (guarding)" : ""}`, type: killed ? "allyDown" : "enemy" });

  return { squad: s, enemies: e, log };
}

/**
 * Apply end-of-round effects: EMP stun chance from squad skills.
 */
export function applyRoundEndEffects(squad, enemies) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];

  for (const op of s.filter(o => o.alive)) {
    const stats = getEffectiveStats(op);
    if (stats.stunChance) {
      for (const en of e.filter(x => x.alive)) {
        if (Math.random() * 100 < stats.stunChance) {
          en.stunned = true;
          log.push({ text: `  ⚡ EMP stuns ${en.name}!`, type: "stun" });
        }
      }
    }
  }

  return { squad: s, enemies: e, log };
}

/**
 * Check if combat has ended.
 * Returns "allEnemiesDead" | "allAlliesDead" | null.
 */
export function checkCombatEnd(squad, enemies) {
  if (squad.every(o => !o.alive)) return "allAlliesDead";
  if (enemies.every(e => !e.alive)) return "allEnemiesDead";
  return null;
}

// ─── Ability System (Phase 2) ──────────────────────────────────────────────
// All functions below are PURE: they return new objects, never mutate inputs.

/**
 * Returns array of abilities the operative has unlocked (skill learned) and
 * whether each is currently affordable.
 * Each entry: { ...ability, available: boolean }
 */
export function getAvailableAbilities(operative) {
  const cls = CLASSES[operative.classKey];
  if (!cls || !cls.abilities) return [];
  return cls.abilities
    .filter(a => operative.skills && operative.skills[a.unlockSkill])
    .map(a => ({ ...a, available: (operative.currentResource || 0) >= a.cost }));
}

/**
 * Returns stats with active buff/debuff modifiers applied on top of base stats.
 * Works for both allies (uses getEffectiveStats) and enemies (uses raw stats).
 */
export function getBuffModifiedStats(unit, isAlly = true) {
  const base = isAlly ? { ...getEffectiveStats(unit) } : { ...unit };
  const effects = unit.activeEffects || [];
  for (const eff of effects) {
    const { stat, modifier } = eff;
    if (stat === 'armor') {
      base.armor = Math.round((base.armor || 0) * (1 + modifier));
    } else if (stat === 'evasion' && modifier > 0) {
      base.evasion = (base.evasion || 0) + modifier;
    } else if (stat === 'damage') {
      base.damage = Math.round((base.damage || 0) * (1 + modifier));
    } else if (stat === 'speed') {
      base.speed = Math.round((base.speed || 0) * (1 + modifier));
    } else if (stat === 'damageTaken') {
      base.damageTakenMod = (base.damageTakenMod || 0) + modifier;
    } else if (stat === 'taunt') {
      base.taunt = modifier;
    }
  }
  return base;
}

/**
 * Execute an ability for an operative.
 * Returns { squad, enemies, log }.
 */
export function executeAbility(attackerId, abilityId, targetId, squad, enemies) {
  const s = cloneSquad(squad);
  const e = cloneEnemies(enemies);
  const log = [];

  const attacker = s.find(o => o.id === attackerId);
  if (!attacker || !attacker.alive) return { squad: s, enemies: e, log };

  // Ensure activeEffects initialized
  if (!attacker.activeEffects) attacker.activeEffects = [];

  const cls = CLASSES[attacker.classKey];
  if (!cls || !cls.abilities) return { squad: s, enemies: e, log };
  const ability = cls.abilities.find(a => a.id === abilityId);
  if (!ability) return { squad: s, enemies: e, log };

  // Deduct resource cost
  attacker.currentResource = Math.max(0, (attacker.currentResource || 0) - ability.cost);

  const { effectType, targetType, effect } = ability;

  if (effectType === 'attack') {
    if (effect.aoeDamage) {
      // AoE attack (Orbital Strike)
      const flatDmg = effect.aoeDamage;
      for (const en of e.filter(x => x.alive)) {
        const reduced = Math.max(1, flatDmg - Math.floor((en.armor || 0) * 0.2));
        en.hp -= reduced;
        if (en.hp <= 0) en.alive = false;
      }
      log.push({ text: `${attacker.icon} ${attacker.name.split(' ')[0]} ▸ ${ability.name} ${flatDmg} AoE!`, type: 'ability' });
    } else {
      // Single or multi-hit attack
      const target = e.find(x => x.id === targetId);
      if (!target || !target.alive) return { squad: s, enemies: e, log };

      const stats = getEffectiveStats(attacker);
      const numHits = effect.hits || 1;
      const mult = effect.damageMultiplier || 1.0;
      const critBonus = effect.critBonus || 0;

      for (let i = 0; i < numHits; i++) {
        let dmg = Math.round((stats.damage + rng(-2, 4)) * mult);
        const critChance = (stats.crit || 0) + critBonus;
        const isCrit = Math.random() * 100 < critChance;
        if (isCrit) dmg = Math.round(dmg * 1.8);

        const armorVal = Math.max(0, (target.armor || 0) - (stats.armorPen || 0));
        dmg = Math.max(1, dmg - Math.floor(armorVal * 0.4));

        // Apply damageTaken modifier from debuffs on target
        if (target.activeEffects) {
          const dtMod = target.activeEffects
            .filter(eff => eff.stat === 'damageTaken')
            .reduce((sum, eff) => sum + eff.modifier, 0);
          if (dtMod > 0) dmg = Math.round(dmg * (1 + dtMod));
        }

        target.hp -= dmg;
        const killed = target.hp <= 0;
        if (killed) target.alive = false;
        const hitLabel = numHits > 1 ? ` (hit ${i + 1})` : '';
        log.push({ text: `${attacker.icon} ${attacker.name.split(' ')[0]} ▸ ${target.name} ${dmg}${isCrit ? ' ★CRIT' : ''}${killed ? ' ✘KILL' : ''}${hitLabel} [${ability.name}]`, type: isCrit ? (killed ? 'critkill' : 'crit') : (killed ? 'kill' : 'ability') });
        if (killed) break;
      }
    }

  } else if (effectType === 'buff') {
    const applyBuff = (tgt) => {
      if (!tgt.activeEffects) tgt.activeEffects = [];
      if (effect.forceTaunt) {
        tgt.activeEffects.push({ id: abilityId, type: 'buff', stat: 'taunt', modifier: 1.0, remainingRounds: effect.duration, source: attackerId });
        log.push({ text: `${attacker.name.split(' ')[0]} taunts enemies! [${ability.name}]`, type: 'buff' });
      } else if (effect.interceptBy) {
        // Find target operative to guard
        const guardTarget = s.find(o => o.id === targetId && o.id !== attackerId);
        if (guardTarget) {
          if (!guardTarget.activeEffects) guardTarget.activeEffects = [];
          guardTarget.activeEffects.push({ id: abilityId, type: 'buff', stat: 'intercepted', modifier: 1, remainingRounds: effect.duration, source: attackerId, interceptedBy: attackerId });
          attacker.activeEffects.push({ id: abilityId + '_interceptor', type: 'buff', stat: 'intercepting', modifier: 1, remainingRounds: effect.duration, source: attackerId });
          log.push({ text: `${attacker.name.split(' ')[0]} guards ${guardTarget.name.split(' ')[0]}! [${ability.name}]`, type: 'buff' });
        }
      } else if (effect.stat === 'turretActive') {
        tgt.activeEffects.push({ id: abilityId, type: 'buff', stat: 'turretActive', modifier: effect.turretDmg || 15, remainingRounds: effect.duration, source: attackerId });
        log.push({ text: `${attacker.name.split(' ')[0]} deploys turret (${effect.duration} rounds)! [${ability.name}]`, type: 'buff' });
      } else {
        tgt.activeEffects.push({ id: abilityId, type: 'buff', stat: effect.stat, modifier: effect.modifier, remainingRounds: effect.duration, source: attackerId });
        log.push({ text: `${tgt.name.split(' ')[0]} +${ability.name} for ${effect.duration} rounds`, type: 'buff' });
      }
    };

    if (targetType === 'self') {
      applyBuff(attacker);
    } else if (targetType === 'allAllies') {
      for (const ally of s.filter(o => o.alive)) applyBuff(ally);
    } else if (targetType === 'ally') {
      if (!effect.interceptBy) {
        const ally = s.find(o => o.id === targetId);
        if (ally && ally.alive) applyBuff(ally);
      } else {
        applyBuff(attacker); // intercept is handled inside applyBuff for interceptBy case
      }
    }

  } else if (effectType === 'debuff') {
    if (targetType === 'allEnemies' && effect.stat === 'stunned') {
      // EMP Blast — stun all
      for (const en of e.filter(x => x.alive)) {
        en.stunned = true;
        if (!en.activeEffects) en.activeEffects = [];
      }
      log.push({ text: `${attacker.icon} ${attacker.name.split(' ')[0]} EMP stuns all enemies! [${ability.name}]`, type: 'stun' });
    } else {
      // Single-target debuff (Armor Shred, Mark Target)
      const target = e.find(x => x.id === targetId);
      if (!target || !target.alive) return { squad: s, enemies: e, log };
      if (!target.activeEffects) target.activeEffects = [];
      target.activeEffects.push({ id: abilityId, type: 'debuff', stat: effect.stat, modifier: effect.modifier, remainingRounds: effect.duration, source: attackerId });
      log.push({ text: `${target.name} debuffed: ${ability.name} (${effect.duration} rounds)`, type: 'debuff' });
    }

  } else if (effectType === 'heal') {
    const target = s.find(o => o.id === targetId);
    if (!target || !target.alive) return { squad: s, enemies: e, log };
    const maxHp = getEffectiveStats(target).hp;
    const healAmt = Math.round(maxHp * (effect.healPercent || 0.4) * getHealingModifier(target));
    target.currentHp = Math.min(maxHp, (target.currentHp || 0) + healAmt);
    log.push({ text: `${attacker.icon} ${attacker.name.split(' ')[0]} heals ${target.name.split(' ')[0]} +${healAmt} HP [${ability.name}]`, type: 'heal' });

  } else if (effectType === 'revive') {
    const target = s.find(o => o.id === targetId);
    if (!target || target.alive) return { squad: s, enemies: e, log };
    const maxHp = getEffectiveStats(target).hp;
    target.alive = true;
    target.currentHp = Math.round(maxHp * (effect.revivePercent || 0.3));
    if (!target.activeEffects) target.activeEffects = [];
    log.push({ text: `${attacker.icon} ${attacker.name.split(' ')[0]} revives ${target.name.split(' ')[0]}! [${ability.name}]`, type: 'heal' });

  } else if (effectType === 'cleanse') {
    const target = s.find(o => o.id === targetId);
    if (!target || !target.alive) return { squad: s, enemies: e, log };
    if (!target.activeEffects) target.activeEffects = [];
    const before = target.activeEffects.length;
    target.activeEffects = target.activeEffects.filter(eff => eff.type !== 'debuff');
    const removed = before - target.activeEffects.length;
    log.push({ text: `${attacker.icon} ${attacker.name.split(' ')[0]} cleanses ${target.name.split(' ')[0]} (${removed} debuffs removed) [${ability.name}]`, type: 'heal' });
  }

  return { squad: s, enemies: e, log };
}

// ─── Status Effect Functions (Phase 3) ───────────────────────────────────────
// All functions are PURE: they mutate the unit object passed in (caller must
// pass a clone) and return log entries / results.

/**
 * Apply a status effect to a unit (mutates unit.activeEffects in place).
 * Returns a log message string.
 *
 * @param {object} unit - the unit object (already a clone)
 * @param {string} effectId - key from STATUS_EFFECTS (e.g. 'bleed', 'poison')
 * @param {string} source - id of the unit applying the effect
 * @param {object} [options] - reserved for future use
 */
export function applyStatusEffect(unit, effectId, source, options = {}) {
  const def = STATUS_EFFECTS[effectId];
  if (!def) return `Unknown effect: ${effectId}`;
  if (!unit.activeEffects) unit.activeEffects = [];

  const unitName = unit.name ? unit.name.split(' ')[0] : 'Unit';
  const sourceName = source || 'unknown';

  if (def.type === 'dot' && def.maxStacks > 1) {
    // Stackable DoT (Bleed): each stack is a separate entry
    const existing = unit.activeEffects.filter(e => e.id === effectId);
    if (existing.length < def.maxStacks) {
      unit.activeEffects.push({
        id: effectId,
        type: def.type,
        damagePerStack: def.damagePerStack,
        remainingRounds: def.duration,
        source,
      });
    } else {
      // At max stacks — refresh duration of oldest
      const oldest = existing.reduce((a, b) => (a.remainingRounds <= b.remainingRounds ? a : b));
      oldest.remainingRounds = def.duration;
    }
  } else if (def.type === 'dot' && def.maxStacks === 1) {
    // Non-stacking DoT (Poison): refresh duration if already present
    const existing = unit.activeEffects.find(e => e.id === effectId);
    if (existing) {
      existing.remainingRounds = def.duration;
    } else {
      unit.activeEffects.push({
        id: effectId,
        type: def.type,
        damage: def.damage,
        remainingRounds: def.duration,
        source,
      });
    }
  } else {
    // Stat-based effect (slow, weaken, fortify)
    unit.activeEffects.push({
      id: effectId,
      type: def.type,
      stat: def.stat,
      modifier: def.modifier,
      remainingRounds: def.duration,
      source,
    });
  }

  return `${sourceName} applies ${def.name} to ${unitName}!`;
}

/**
 * Remove ALL instances of effectId from unit.activeEffects (mutates in place).
 * Returns a log message string.
 *
 * @param {object} unit - the unit object (already a clone)
 * @param {string} effectId - key from STATUS_EFFECTS
 */
export function removeStatusEffect(unit, effectId) {
  if (!unit.activeEffects) { unit.activeEffects = []; return `No effects to remove`; }
  const before = unit.activeEffects.length;
  unit.activeEffects = unit.activeEffects.filter(e => e.id !== effectId);
  const removed = before - unit.activeEffects.length;
  const unitName = unit.name ? unit.name.split(' ')[0] : 'Unit';
  return `${removed} ${effectId} effect(s) removed from ${unitName}`;
}

/**
 * Process all active effects on a unit for one turn (mutates unit in place):
 * - Apply DoT damage (bleed / poison)
 * - Decrement remainingRounds on ALL effects
 * - Remove expired effects
 * Returns { logEntries: Array<{text, type}>, totalDotDamage: number }
 *
 * @param {object} unit - the unit object (already a clone)
 */
export function tickStatusEffects(unit) {
  if (!unit.activeEffects) unit.activeEffects = [];
  const logEntries = [];
  let totalDotDamage = 0;
  const unitName = unit.name ? unit.name.split(' ')[0] : 'Unit';

  // Apply DoT damage first (before decrementing)
  for (const eff of unit.activeEffects) {
    if (eff.type !== 'dot') continue;
    if (eff.id === 'bleed') {
      const dmg = eff.damagePerStack || 5;
      const hpField = unit.currentHp !== undefined ? 'currentHp' : 'hp';
      unit[hpField] = Math.max(0, (unit[hpField] || 0) - dmg);
      totalDotDamage += dmg;
      logEntries.push({ text: `${unitName} takes ${dmg} bleed damage`, type: 'bleed' });
    } else if (eff.id === 'poison') {
      const dmg = eff.damage || 8;
      const hpField = unit.currentHp !== undefined ? 'currentHp' : 'hp';
      unit[hpField] = Math.max(0, (unit[hpField] || 0) - dmg);
      totalDotDamage += dmg;
      logEntries.push({ text: `${unitName} takes ${dmg} poison damage`, type: 'poison' });
    }
  }

  // Decrement all effects and collect expired
  const expired = [];
  unit.activeEffects = unit.activeEffects
    .map(eff => ({ ...eff, remainingRounds: eff.remainingRounds - 1 }))
    .filter(eff => {
      if (eff.remainingRounds <= 0) { expired.push(eff); return false; }
      return true;
    });

  for (const eff of expired) {
    logEntries.push({
      text: `${eff.id.charAt(0).toUpperCase() + eff.id.slice(1)} on ${unitName} expired`,
      type: 'expired',
    });
  }

  return { logEntries, totalDotDamage };
}

/**
 * Returns the healing modifier for a unit.
 * Poisoned units receive only 50% healing.
 *
 * @param {object} unit
 * @returns {number} 0.5 if poisoned, 1.0 otherwise
 */
export function getHealingModifier(unit) {
  const effects = unit.activeEffects || [];
  if (effects.some(e => e.id === 'poison')) return 0.5;
  return 1.0;
}

/**
 * Check whether an enemy should use an ability this turn and apply it.
 * Mutates the passed-in enemy and target objects (caller must pass clones).
 * Returns { used, abilityName, targetName, logEntry } if an ability fired,
 * or null if the enemy should make a normal attack.
 *
 * @param {object} enemy  - the enemy instance (already a clone)
 * @param {Array}  squad  - array of operative objects (already clones)
 * @param {Array}  enemies - full enemies array (already clones, used for self-target)
 */
export function executeEnemyAbility(enemy, squad, enemies) {
  if (!enemy.abilities || enemy.abilities.length === 0) return null;

  // Save-compatibility: ensure cooldown map exists
  if (!enemy.abilityCooldowns) enemy.abilityCooldowns = {};

  const aliveOperatives = squad.filter(o => o.alive);

  for (const ability of enemy.abilities) {
    // Skip if on cooldown
    if ((enemy.abilityCooldowns[ability.id] || 0) > 0) continue;

    // Chance roll
    if (Math.random() >= ability.chance) continue;

    // Ability fires — determine target
    let target = null;

    if (ability.appliesEffect) {
      if (ability.targetType === 'self') {
        target = enemy;
      } else {
        // 'random' or 'enemy' — pick a random alive operative
        if (aliveOperatives.length === 0) continue;
        target = aliveOperatives[Math.floor(Math.random() * aliveOperatives.length)];
      }
      applyStatusEffect(target, ability.appliesEffect, enemy.id || enemy.name);
    }

    if (ability.drainMp) {
      // Pick a random alive operative and drain their resource
      if (aliveOperatives.length === 0) continue;
      const drainTarget = aliveOperatives[Math.floor(Math.random() * aliveOperatives.length)];
      drainTarget.currentResource = Math.max(0, (drainTarget.currentResource || 0) - ability.drainMp);
      target = drainTarget;
    }

    // Set cooldown
    enemy.abilityCooldowns[ability.id] = ability.cooldown;

    const targetName = target ? target.name : 'unknown';
    return {
      used: true,
      abilityName: ability.name,
      targetName,
      logEntry: `${enemy.name} uses ${ability.name} on ${targetName}!`,
    };
  }

  return null;
}

/**
 * Decrement all cooldown values on an enemy by 1, clamped to 0.
 * Mutates enemy.abilityCooldowns in place.
 *
 * @param {object} enemy - the enemy instance
 */
export function tickEnemyCooldowns(enemy) {
  if (!enemy.abilityCooldowns) return;
  for (const key of Object.keys(enemy.abilityCooldowns)) {
    enemy.abilityCooldowns[key] = Math.max(0, enemy.abilityCooldowns[key] - 1);
  }
}
