import { ENEMY_TEMPLATES } from '../data/enemies';
import { rng, pick, uid } from './utils';
import { getEffectiveStats } from './operatives';

export function generateEncounter(tier, encounterNum) {
  const enemies = ENEMY_TEMPLATES.filter(e => e.tier <= tier && e.tier >= tier - 1);
  const count = tier <= 2 ? rng(2, 3) : rng(2, 4);
  return Array.from({ length: count }, () => {
    const t = pick(enemies);
    const scale = 1 + (tier - 1) * 0.15 + encounterNum * 0.05;
    return { id: uid(), ...t, hp: Math.round(t.hp * scale), maxHp: Math.round(t.hp * scale),
      armor: Math.round(t.armor * scale), damage: Math.round(t.damage * scale), speed: t.speed, alive: true, stunned: false, bleed: 0 };
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
  } else {
    const unit = e.find(x => x.id === unitId);
    if (!unit || !unit.alive) return { squad: s, enemies: e, log, canAct: false };
    if (unit.stunned) { unit.stunned = false; log.push({ text: `${unit.name} stunned!`, type: "stun" }); canAct = false; }
    if (canAct && unit.bleed > 0) {
      unit.hp -= unit.bleed;
      log.push({ text: `${unit.name} bleeds ${unit.bleed}`, type: "bleed" });
      if (unit.hp <= 0) { unit.alive = false; log.push({ text: `${unit.name} bleeds out!`, type: "kill" }); canAct = false; }
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

  const stats = getEffectiveStats(attacker);
  let dmg = stats.damage + rng(-2, 4);
  const isCrit = Math.random() * 100 < (stats.crit || 0);
  if (isCrit) {
    dmg = Math.round(dmg * 1.8);
    if (stats.executeCrit && target.hp < target.maxHp * 0.3) dmg *= 2;
    if (stats.critBleed) target.bleed = (target.bleed || 0) + stats.critBleed;
  }
  const armor = Math.max(0, target.armor - (stats.armorPen || 0));
  dmg = Math.max(1, dmg - Math.floor(armor * 0.4));
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

  const taunters = targets.filter(o => getEffectiveStats(o).taunt);
  const target = taunters.length > 0 && Math.random() > 0.3 ? pick(taunters) : pick(targets);
  const stats = getEffectiveStats(target);

  // Evasion check
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
