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
