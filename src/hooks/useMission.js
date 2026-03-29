import { useState, useRef, useEffect } from "react";
import { RARITY, CLASS_KEYS } from "../data/constants";
import { STORY_CHAPTERS } from "../data/story";
import { DECISION_EVENTS } from "../data/decisions";
import { rng, pick } from "../engine/utils";
import { generateGear } from "../engine/gear";
import { getEffectiveStats, xpForLevel } from "../engine/operatives";
import { generateEncounter, combatRound } from "../engine/combat";

export default function useMission(game, setGame, updateGame, setTab) {
  const [mission, setMission] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [decision, setDecision] = useState(null);
  const [missionResult, setMissionResult] = useState(null);
  const logRef = useRef(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [combatLog]);

  function betweenEncounterHeal() {
    setGame(prev => ({
      ...prev,
      squad: prev.squad.map(o => {
        if (!o.alive) return o;
        const maxHp = getEffectiveStats(o).hp;
        const maxSh = getEffectiveStats(o).shield;
        return {
          ...o,
          currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.15)),
          currentShield: Math.min(maxSh, o.currentShield + Math.round(maxSh * 0.25)),
        };
      })
    }));
  }

  function startMission(mt) {
    if (game.squad.filter(o => o.alive).length === 0) return;
    updateGame(g => ({ ...g, squad: g.squad.map(o => { const s = getEffectiveStats(o); return { ...o, alive: true, currentHp: s.hp, currentShield: s.shield }; }) }));
    setMission({ type: mt, currentEncounter: 0, totalEncounters: mt.encounters, phase: "briefing", enemies: [], roundNum: 0, decisionApplied: {}, combatStats: { totalRounds: 0, enemiesKilled: 0, operativesDowned: 0 }, debriefPhase: null, prevMissionsCompleted: game.missionsCompleted });
    const currentChapter = STORY_CHAPTERS.filter(ch => game.missionsCompleted >= ch.unlockAt).pop();
    const storyFlavor = currentChapter ? [{ text: `[${currentChapter.title}]`, type: "decision" }] : [];
    setCombatLog([{ text: `MISSION: ${mt.name.toUpperCase()}`, type: "header" }, { text: mt.desc, type: "info" }, ...storyFlavor]);
    setDecision(null); setMissionResult(null); setTab("Mission");
  }

  function advanceMission() {
    if (!mission) return;
    if (mission.phase === "briefing") {
      const enemies = generateEncounter(mission.type.tier, 0);
      setCombatLog(p => [...p, { text: `Encounter 1/${mission.totalEncounters}`, type: "round" }, { text: enemies.map(e => e.name).join(", "), type: "info" }]);
      setMission(m => ({ ...m, phase: "combat", enemies, currentEncounter: 1, roundNum: 0 })); return;
    }
    if (mission.phase === "combat") {
      const log = []; const rn = mission.roundNum + 1;
      log.push({ text: `Round ${rn}`, type: "round" });
      const squad = [...game.squad.filter(o => o.alive)]; const enemies = [...mission.enemies];
      const aliveEnemiesBefore = enemies.filter(e => e.alive).length;
      const aliveSquadBefore = squad.filter(o => o.alive).length;
      if (rn === 1) for (const op of squad) { const s = getEffectiveStats(op); if (s.minesDmg) { for (const e of enemies.filter(e => e.alive)) { e.hp -= s.minesDmg; if (e.hp <= 0) e.alive = false; } log.push({ text: `💣 Mines ${s.minesDmg} AoE!`, type: "aoe" }); }}
      if (rn % 4 === 0) for (const op of squad) { const s = getEffectiveStats(op); if (s.orbitalDmg) { for (const e of enemies.filter(e => e.alive)) { const d = Math.max(1, s.orbitalDmg - Math.floor(e.armor*.2)); e.hp -= d; if (e.hp <= 0) e.alive = false; } log.push({ text: `🛰 ORBITAL ${s.orbitalDmg} AoE!`, type: "aoe" }); }}
      if (mission.decisionApplied.counterAmbush && rn === 1) log.push({ text: `Counter-ambush! +30% dmg`, type: "decision" });
      if (mission.decisionApplied.overload && rn === 1) { for (const e of enemies.filter(e => e.alive)) { e.hp -= 25; if (e.hp <= 0) e.alive = false; } log.push({ text: `Overload 25 AoE!`, type: "aoe" }); }
      combatRound(squad, enemies, log);
      const killsThisRound = aliveEnemiesBefore - enemies.filter(e => e.alive).length;
      const downsThisRound = aliveSquadBefore - squad.filter(o => o.alive).length;
      setGame(prev => ({ ...prev, squad: prev.squad.map(o => { const m = squad.find(s => s.id === o.id); return m ? { ...o, currentHp: m.currentHp, currentShield: m.currentShield, alive: m.alive } : o; }) }));
      setCombatLog(p => [...p, ...log]);
      const updatedStats = { totalRounds: mission.combatStats.totalRounds + 1, enemiesKilled: mission.combatStats.enemiesKilled + killsThisRound, operativesDowned: mission.combatStats.operativesDowned + downsThisRound };
      if (squad.every(o => !o.alive)) {
        setCombatLog(p => [...p, { text: "MISSION FAILED", type: "header" }]);
        setMission(m => ({ ...m, phase: "result", debriefPhase: "stats", combatStats: updatedStats }));
        setMissionResult({ success: false, combatStats: updatedStats, newBeats: [] }); return;
      }
      if (enemies.every(e => !e.alive)) {
        const ne = mission.currentEncounter + 1;
        if (ne > mission.totalEncounters) {
          const tm = mission.type.tier; const loot = Array.from({ length: rng(1, 2 + tm) }, () => generateGear(pick(["weapon","armor","implant","gadget"]), pick(CLASS_KEYS), game.squad[0]?.level || 1));
          const isFirstClear = !game.completedMissions?.[mission.type.id];
          const repeatPenalty = isFirstClear ? 1 : 0.5;
          const xp = Math.round(50 * mission.type.xpMult * tm * repeatPenalty); const creds = Math.round(rng(30, 60) * tm * repeatPenalty);
          const prevMC = mission.prevMissionsCompleted;
          const newMC = prevMC + (isFirstClear ? 1 : 0);
          const newBeats = STORY_CHAPTERS.flatMap(ch => ch.beats.filter(b => b.at > prevMC && b.at <= newMC).map(b => ({ ...b, chapterId: ch.id })));
          setCombatLog(p => [...p, { text: "MISSION COMPLETE", type: "header" }, { text: `+${xp}XP +${creds}¢ ${loot.length} items${!isFirstClear ? " (repeat)" : " ★FIRST CLEAR"}`, type: "info" }]);
          setMission(m => ({ ...m, phase: "result", debriefPhase: "stats", combatStats: updatedStats }));
          setMissionResult({ success: true, loot, xp, credits: creds, combatStats: updatedStats, newBeats });
          updateGame(g => { const wasFirstClear = !g.completedMissions?.[mission.type.id]; const ng = { ...g, inventory: [...g.inventory, ...loot], credits: g.credits + creds, missionsCompleted: g.missionsCompleted + (wasFirstClear ? 1 : 0), completedMissions: { ...(g.completedMissions || {}), [mission.type.id]: (g.completedMissions?.[mission.type.id] || 0) + 1 } };
            ng.squad = ng.squad.map(o => { if (!o.alive) return o; let nx = o.xp + xp, lv = o.level, sp = o.skillPoints, xn = xpForLevel(lv);
              while (nx >= xn) { nx -= xn; lv++; sp++; xn = xpForLevel(lv); } return { ...o, xp: nx, level: lv, skillPoints: sp, xpToLevel: xn }; }); return ng; }); return;
        }
        if (Math.random() > 0.4) { const evt = pick(DECISION_EVENTS); setDecision(evt); setMission(m => ({ ...m, phase: "decision", roundNum: 0, combatStats: updatedStats })); setCombatLog(p => [...p, { text: `⟐ ${evt.title}`, type: "decision" }]); betweenEncounterHeal(); return; }
        const newE = generateEncounter(mission.type.tier, ne - 1);
        betweenEncounterHeal();
        setCombatLog(p => [...p, { text: `💚 Squad recovers between encounters`, type: "heal" }, { text: `Encounter ${ne}/${mission.totalEncounters}`, type: "round" }, { text: newE.map(e => e.name).join(", "), type: "info" }]);
        setMission(m => ({ ...m, enemies: newE, currentEncounter: ne, roundNum: 0, decisionApplied: {}, combatStats: updatedStats })); return;
      }
      if (rn % 3 === 0 && !decision) { const evt = pick(DECISION_EVENTS); setDecision(evt); setMission(m => ({ ...m, phase: "decision", roundNum: rn, combatStats: updatedStats })); setCombatLog(p => [...p, { text: `⟐ ${evt.title}`, type: "decision" }]); return; }
      setMission(m => ({ ...m, enemies, roundNum: rn, combatStats: updatedStats }));
    }
  }

  function handleDecision(choice) {
    const applied = { [choice.effect]: true };
    if (choice.effect === "shields") setGame(p => ({ ...p, squad: p.squad.map(o => o.alive ? { ...o, currentShield: o.currentShield + 25 } : o) }));
    if (choice.effect === "pushThrough") { setGame(p => ({ ...p, squad: p.squad.map(o => { if (!o.alive) return o; return { ...o, currentHp: Math.max(1, o.currentHp - Math.round(getEffectiveStats(o).hp * .15)) }; }) })); setMission(m => ({ ...m, currentEncounter: m.currentEncounter + 1 })); }
    if (choice.effect === "avoid") setMission(m => ({ ...m, currentEncounter: m.currentEncounter + 1 }));
    if (choice.effect === "salvage") { const b = generateGear(pick(["weapon","armor"]), pick(CLASS_KEYS), (game.squad[0]?.level||1)+1); b.rarity = Math.max(RARITY.RARE, b.rarity); updateGame(g => ({ ...g, inventory: [...g.inventory, b] })); }
    setCombatLog(p => [...p, { text: `>> ${choice.text}`, type: "decision" }]); setDecision(null);
    const enemies = generateEncounter(mission.type.tier, mission.currentEncounter);
    setCombatLog(p => [...p, { text: `Encounter ${mission.currentEncounter}/${mission.totalEncounters}`, type: "round" }, { text: enemies.map(e => e.name).join(", "), type: "info" }]);
    setMission(m => ({ ...m, phase: "combat", enemies, roundNum: 0, decisionApplied: { ...m.decisionApplied, ...applied } }));
  }

  function resetMission() {
    setMission(null); setDecision(null); setMissionResult(null); setCombatLog([]);
    updateGame(g => ({ ...g, squad: g.squad.map(o => { const s = getEffectiveStats(o); return { ...o, alive: true, currentHp: s.hp, currentShield: s.shield }; }) })); setTab("Squad");
  }

  function advanceDebrief() {
    if (!mission || mission.phase !== "result") return;
    if (mission.debriefPhase === "stats") {
      const hasNewComms = missionResult?.newBeats?.length > 0;
      if (hasNewComms) {
        setMission(m => ({ ...m, debriefPhase: "comms", commsIndex: 0 }));
      } else {
        resetMission();
      }
      return;
    }
    if (mission.debriefPhase === "comms") {
      const beats = missionResult?.newBeats || [];
      if (mission.commsIndex < beats.length - 1) {
        setMission(m => ({ ...m, commsIndex: m.commsIndex + 1 }));
      } else {
        updateGame(g => {
          const newRead = { ...g.storyBeatsRead };
          for (const b of beats) newRead[`${b.chapterId}-${b.at}`] = true;
          return { ...g, storyBeatsRead: newRead };
        });
        resetMission();
      }
      return;
    }
  }

  return {
    mission, combatLog, decision, missionResult, logRef,
    startMission, advanceMission, handleDecision, resetMission, advanceDebrief,
  };
}
