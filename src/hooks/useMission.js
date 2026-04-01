import { useState, useRef, useEffect, useCallback } from "react";
import { RARITY, CLASS_KEYS, CLASS_BASE_RESOURCE, CLASS_RESOURCE_NAMES } from "../data/constants";
import { CLASSES } from "../data/classes";
import { STORY_CHAPTERS } from "../data/story";
import { DECISION_EVENTS } from "../data/decisions";
import { rng, pick } from "../engine/utils";
import { generateGear } from "../engine/gear";
import { getEffectiveStats, xpForLevel } from "../engine/operatives";
import {
  generateEncounter,
  buildTurnQueue,
  applyRoundStartEffects,
  applyTurnStartEffects,
  executeAllyAttack,
  executeAllyDefend,
  executeItemUse,
  applyAllyPassives,
  executeEnemyTurn,
  applyRoundEndEffects,
  checkCombatEnd,
  getAvailableAbilities,
  executeAbility,
  executeEnemyAbility,
  tickEnemyCooldowns,
} from "../engine/combat";
import { getEnvironmentForMission } from "../engine/environments";
import { selectBark, selectBanter, getInlineStory, getDecisionEcho, getEnvFlavor, selectStoryReaction, selectDeathReaction } from "../engine/personality";

export default function useMission(game, setGame, updateGame, setTab) {
  const [mission, setMission] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [decision, setDecision] = useState(null);
  const [missionResult, setMissionResult] = useState(null);
  const [turnState, setTurnState] = useState(null);
  const [banter, setBanter] = useState(null);
  const [storyReactions, setStoryReactions] = useState([]);
  const logRef = useRef(null);
  const recentBarksRef = useRef([]);
  const barkBudgetRef = useRef(2);
  const enemyTimerRef = useRef(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [combatLog]);

  // Cleanup enemy turn timers
  useEffect(() => {
    return () => { if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current); };
  }, []);

  function betweenEncounterHeal() {
    setGame(prev => ({
      ...prev,
      squad: prev.squad.map(o => {
        if (!o.alive) return o;
        const maxHp = getEffectiveStats(o).hp;
        const maxSh = getEffectiveStats(o).shield;
        const maxResource = CLASS_BASE_RESOURCE[o.classKey] || 0;
        return {
          ...o,
          currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.15)),
          currentShield: Math.min(maxSh, o.currentShield + Math.round(maxSh * 0.25)),
          currentResource: Math.min(maxResource, (o.currentResource || 0) + Math.round(maxResource * 0.25)),
        };
      })
    }));
  }

  // ── Sync game state from pure function results ──
  // Applies updated squad/enemy state from pure combat function returns.
  function applySquadState(newSquad) {
    setGame(prev => ({
      ...prev,
      squad: prev.squad.map(o => {
        const updated = newSquad.find(s => s.id === o.id);
        return updated ? {
          ...o,
          currentHp: updated.currentHp,
          currentShield: updated.currentShield,
          alive: updated.alive,
          defending: updated.defending || false,
          currentResource: updated.currentResource ?? o.currentResource,
          activeEffects: updated.activeEffects || [],
        } : o;
      })
    }));
  }

  function applyEnemyState(newEnemies) {
    setMission(m => m ? { ...m, enemies: newEnemies } : m);
  }

  // ── Turn-Based Combat State Machine ──

  function startRound(currentMission, currentSquad, roundNum) {
    const rn = roundNum + 1;
    setCombatLog(p => [...p, { text: `Round ${rn}`, type: "round" }]);

    // Apply round-start effects (mines, orbital, decision effects)
    const { squad: rsSquad, enemies: rsEnemies, log: rsLog } = applyRoundStartEffects(
      rn, currentSquad, currentMission.enemies, currentMission.decisionApplied || {}
    );
    if (rsLog.length > 0) setCombatLog(p => [...p, ...rsLog]);
    applySquadState(rsSquad);

    // Build turn queue
    const queue = buildTurnQueue(rsSquad, rsEnemies);

    // Update mission state
    const updatedEnemies = rsEnemies;
    setMission(m => m ? { ...m, enemies: updatedEnemies, roundNum: rn, combatStats: { ...m.combatStats, totalRounds: m.combatStats.totalRounds + 1 } } : m);

    // Set turn state and advance to first turn
    const newTurnState = {
      turnQueue: queue,
      turnIndex: 0,
      roundNum: rn,
      subPhase: "processing",
      selectedAction: null,
      selectedStimIndex: null,
      defendingUnitIds: [],
    };
    setTurnState(newTurnState);

    // Use setTimeout to let state settle, then process first turn
    setTimeout(() => advanceTurn(newTurnState, rsSquad, updatedEnemies), 50);
  }

  function advanceTurn(ts, currentSquad, currentEnemies) {
    // If all turns done, end round
    if (ts.turnIndex >= ts.turnQueue.length) {
      endRound(ts, currentSquad, currentEnemies);
      return;
    }

    const entry = ts.turnQueue[ts.turnIndex];

    // Apply turn-start effects
    const { squad: tsSquad, enemies: tsEnemies, log: tsLog, canAct } =
      applyTurnStartEffects(entry.unitId, entry.isAlly, currentSquad, currentEnemies);
    if (tsLog.length > 0) setCombatLog(p => [...p, ...tsLog]);
    applySquadState(tsSquad);
    applyEnemyState(tsEnemies);

    if (!canAct) {
      // Skip this turn (stunned / dead)
      const nextTs = { ...ts, turnIndex: ts.turnIndex + 1 };
      setTurnState(nextTs);
      setTimeout(() => advanceTurn(nextTs, tsSquad, tsEnemies), 400);
      return;
    }

    if (entry.isAlly) {
      // Player's turn — show action menu
      setTurnState({ ...ts, subPhase: "awaitingAction", selectedAction: null, selectedStimIndex: null });
    } else {
      // Enemy's turn — auto-execute
      setTurnState({ ...ts, subPhase: "enemyActing" });
      processEnemyTurn(ts, entry, tsSquad, tsEnemies);
    }
  }

  function processEnemyTurn(ts, entry, currentSquad, currentEnemies) {
    // Check if enemy should use an ability instead of a normal attack
    const abilitySquad = currentSquad.map(o => ({ ...o }));
    const abilityEnemies = currentEnemies.map(e => ({ ...e }));
    const abilityEnemy = abilityEnemies.find(e => e.id === entry.unitId);

    if (abilityEnemy) {
      const abilityResult = executeEnemyAbility(abilityEnemy, abilitySquad, abilityEnemies);
      if (abilityResult !== null) {
        // Ability was used — apply the mutated state and log, skip normal attack
        setCombatLog(p => [...p, { text: abilityResult.logEntry, type: "ability" }]);
        applySquadState(abilitySquad);
        applyEnemyState(abilityEnemies);

        injectBark([{ text: abilityResult.logEntry }], abilitySquad, abilityEnemies);

        const endResult = checkCombatEnd(abilitySquad, abilityEnemies);
        if (endResult) {
          handleCombatEnd(endResult, abilitySquad, abilityEnemies, ts);
          return;
        }

        const nextTs = { ...ts, turnIndex: ts.turnIndex + 1 };
        setTurnState(nextTs);
        enemyTimerRef.current = setTimeout(() => advanceTurn(nextTs, abilitySquad, abilityEnemies), 600);
        return;
      }
    }

    const { squad: etSquad, enemies: etEnemies, log: etLog } =
      executeEnemyTurn(entry.unitId, currentSquad, currentEnemies);
    if (etLog.length > 0) setCombatLog(p => [...p, ...etLog]);
    applySquadState(etSquad);
    applyEnemyState(etEnemies);

    // Inject bark on enemy action
    injectBark(etLog, etSquad, currentEnemies);

    // Check for combat end
    const endResult = checkCombatEnd(etSquad, etEnemies);
    if (endResult) {
      handleCombatEnd(endResult, etSquad, etEnemies, ts);
      return;
    }

    // Advance to next turn with delay so player can see enemy action
    const nextTs = { ...ts, turnIndex: ts.turnIndex + 1 };
    setTurnState(nextTs);
    enemyTimerRef.current = setTimeout(() => advanceTurn(nextTs, etSquad, etEnemies), 600);
  }

  // ── Player Action Handlers ──

  function selectAttack() {
    setTurnState(ts => ts ? { ...ts, subPhase: "selectTarget", selectedAction: "attack" } : ts);
  }

  function selectDefend() {
    setTurnState(ts => {
      if (!ts) return ts;
      const entry = ts.turnQueue[ts.turnIndex];

      // Get current state from game and mission
      const currentSquad = game.squad;
      const currentEnemies = mission?.enemies || [];

      const { squad: dSquad, log: dLog } = executeAllyDefend(entry.unitId, currentSquad);
      if (dLog.length > 0) setCombatLog(p => [...p, ...dLog]);
      applySquadState(dSquad);

      // Track defending units
      const newDefending = [...(ts.defendingUnitIds || []), entry.unitId];

      // Medic heals still fire on defend
      const { squad: pSquad, enemies: pEnemies, log: pLog } = applyMedicPassives(entry.unitId, dSquad, currentEnemies);
      if (pLog.length > 0) setCombatLog(p => [...p, ...pLog]);
      applySquadState(pSquad);
      applyEnemyState(pEnemies);

      const nextTs = { ...ts, turnIndex: ts.turnIndex + 1, subPhase: "processing", defendingUnitIds: newDefending };

      setTimeout(() => advanceTurn(nextTs, pSquad, pEnemies), 300);
      return nextTs;
    });
  }

  function selectItem() {
    setTurnState(ts => ts ? { ...ts, subPhase: "selectItem", selectedAction: "item" } : ts);
  }

  function selectAbility() {
    setTurnState(ts => ts ? { ...ts, subPhase: "selectAbility", selectedAction: "ability" } : ts);
  }

  function chooseAbility(abilityId) {
    if (!turnState) return;
    const entry = turnState.turnQueue[turnState.turnIndex];
    const operative = game.squad.find(o => o.id === entry.unitId);
    if (!operative) return;

    const cls = CLASSES[operative.classKey];
    const ability = cls?.abilities?.find(a => a.id === abilityId);
    if (!ability) return;

    // Check if sufficient resource
    if (operative.currentResource < ability.cost) return;

    const currentSquad = game.squad;
    const currentEnemies = mission?.enemies || [];

    if (ability.targetType === "self" || ability.targetType === "allEnemies" || ability.targetType === "allAllies") {
      // Execute immediately — no target needed
      const selfTargetId = ability.targetType === "self" ? entry.unitId : null;
      executeAbilityAndAdvance(abilityId, selfTargetId, currentSquad, currentEnemies);
    } else if (ability.targetType === "enemy") {
      setTurnState(ts => ts ? { ...ts, subPhase: "selectAbilityTarget", selectedAbilityId: abilityId } : ts);
    } else if (ability.targetType === "ally") {
      setTurnState(ts => ts ? { ...ts, subPhase: "selectAbilityAllyTarget", selectedAbilityId: abilityId } : ts);
    }
  }

  function executeAbilityAndAdvance(abilityId, targetId, currentSquad, currentEnemies) {
    if (!turnState) return;
    const entry = turnState.turnQueue[turnState.turnIndex];

    const { squad: aSquad, enemies: aEnemies, log: aLog } = executeAbility(entry.unitId, abilityId, targetId, currentSquad, currentEnemies);
    if (aLog.length > 0) setCombatLog(p => [...p, ...aLog]);
    applySquadState(aSquad);
    applyEnemyState(aEnemies);

    // Inject bark
    injectBark(aLog, aSquad, aEnemies);

    // Check combat end
    const endResult = checkCombatEnd(aSquad, aEnemies);
    if (endResult) {
      handleCombatEnd(endResult, aSquad, aEnemies, turnState);
      return;
    }

    // Advance to next turn
    const nextTs = { ...turnState, turnIndex: turnState.turnIndex + 1, subPhase: "processing" };
    setTurnState(nextTs);
    setTimeout(() => advanceTurn(nextTs, aSquad, aEnemies), 300);
  }

  function chooseAllyTarget(allyId) {
    if (!turnState || !turnState.selectedAbilityId) return;
    const currentSquad = game.squad;
    const currentEnemies = mission?.enemies || [];
    executeAbilityAndAdvance(turnState.selectedAbilityId, allyId, currentSquad, currentEnemies);
  }

  function chooseStim(stimIndex) {
    const stim = game.stims[stimIndex];
    if (!stim) return;

    if (stim.id === "nano_kit") {
      // AoE stim — no target needed
      executeStimAndAdvance(stimIndex, null);
    } else {
      setTurnState(ts => ts ? { ...ts, subPhase: "selectItemTarget", selectedStimIndex: stimIndex } : ts);
    }
  }

  function chooseTarget(targetId) {
    if (!turnState) return;
    const entry = turnState.turnQueue[turnState.turnIndex];
    const currentSquad = game.squad;
    const currentEnemies = mission?.enemies || [];

    if (turnState.selectedAction === "attack") {
      // Execute attack
      const { squad: aSquad, enemies: aEnemies, log: aLog } = executeAllyAttack(entry.unitId, targetId, currentSquad, currentEnemies);
      if (aLog.length > 0) setCombatLog(p => [...p, ...aLog]);
      applySquadState(aSquad);
      applyEnemyState(aEnemies);

      // Apply passives (turrets, double act, AoE, heals)
      const { squad: pSquad, enemies: pEnemies, log: pLog } = applyAllyPassives(entry.unitId, aSquad, aEnemies);
      if (pLog.length > 0) setCombatLog(p => [...p, ...pLog]);
      applySquadState(pSquad);
      applyEnemyState(pEnemies);

      // Inject bark
      injectBark([...aLog, ...pLog], pSquad, pEnemies);

      // Check combat end
      const endResult = checkCombatEnd(pSquad, pEnemies);
      if (endResult) {
        handleCombatEnd(endResult, pSquad, pEnemies, turnState);
        return;
      }

      // Advance to next turn
      const nextTs = { ...turnState, turnIndex: turnState.turnIndex + 1, subPhase: "processing" };
      setTurnState(nextTs);
      setTimeout(() => advanceTurn(nextTs, pSquad, pEnemies), 300);

    } else if (turnState.selectedAction === "item") {
      executeStimAndAdvance(turnState.selectedStimIndex, targetId);
    } else if (turnState.selectedAction === "ability") {
      executeAbilityAndAdvance(turnState.selectedAbilityId, targetId, currentSquad, currentEnemies);
    }
  }

  function executeStimAndAdvance(stimIndex, targetId) {
    if (!turnState) return;
    const entry = turnState.turnQueue[turnState.turnIndex];
    const stim = game.stims[stimIndex];
    if (!stim) return;

    const currentSquad = game.squad;
    const currentEnemies = mission?.enemies || [];

    const { squad: iSquad, stims: newStims, log: iLog } = executeItemUse(stim.id, targetId, currentSquad, game.stims);
    if (iLog.length > 0) setCombatLog(p => [...p, ...iLog]);
    applySquadState(iSquad);

    // Update stims in game state
    setGame(prev => ({ ...prev, stims: newStims }));

    // Medic heals fire on item use too
    const { squad: pSquad, enemies: pEnemies, log: pLog } = applyMedicPassives(entry.unitId, iSquad, currentEnemies);
    if (pLog.length > 0) setCombatLog(p => [...p, ...pLog]);
    applySquadState(pSquad);

    const nextTs = { ...turnState, turnIndex: turnState.turnIndex + 1, subPhase: "processing" };
    setTurnState(nextTs);
    setTimeout(() => advanceTurn(nextTs, pSquad, pEnemies), 300);
  }

  function cancelSelection() {
    setTurnState(ts => {
      if (!ts) return ts;
      // From ability target sub-menus, go back to ability list first
      if (ts.subPhase === "selectAbilityTarget" || ts.subPhase === "selectAbilityAllyTarget") {
        return { ...ts, subPhase: "selectAbility", selectedAbilityId: null };
      }
      // From ability list or other, go back to main menu
      return { ...ts, subPhase: "awaitingAction", selectedAction: null, selectedStimIndex: null, selectedAbilityId: null };
    });
  }

  // Medic passives (heals) fire regardless of action type
  function applyMedicPassives(attackerId, squad, enemies) {
    const attacker = squad.find(o => o.id === attackerId);
    if (!attacker) return { squad, enemies, log: [] };
    const stats = getEffectiveStats(attacker);
    const s = squad.map(o => ({ ...o }));
    const e = enemies.map(x => ({ ...x }));
    const log = [];

    if ((stats.healPerRound || 0) > 0) {
      const wounded = s.filter(o => o.alive && o.currentHp < getEffectiveStats(o).hp).sort((a, b) => a.currentHp - b.currentHp);
      if (wounded.length > 0) {
        const mhp = getEffectiveStats(wounded[0]).hp;
        wounded[0].currentHp = Math.min(mhp, wounded[0].currentHp + stats.healPerRound);
        log.push({ text: `  💚 Heal ${wounded[0].name.split(" ")[0]} +${stats.healPerRound}`, type: "heal" });
      }
    }
    if (stats.aoeHeal) {
      for (const ally of s.filter(o => o.alive)) {
        const mhp = getEffectiveStats(ally).hp;
        ally.currentHp = Math.min(mhp, ally.currentHp + stats.aoeHeal);
      }
      log.push({ text: `  💚 Regen +${stats.aoeHeal} all`, type: "heal" });
    }

    return { squad: s, enemies: e, log };
  }

  // ── End-of-Round / Combat End ──

  function endRound(ts, currentSquad, currentEnemies) {
    // Apply round-end effects (EMP stun)
    const { squad: reSquad, enemies: reEnemies, log: reLog } = applyRoundEndEffects(currentSquad, currentEnemies);
    if (reLog.length > 0) setCombatLog(p => [...p, ...reLog]);
    applySquadState(reSquad);

    // Tick enemy ability cooldowns at end of each round
    const cdEnemies = reEnemies.map(e => ({ ...e }));
    for (const enemy of cdEnemies.filter(e => e.alive)) {
      tickEnemyCooldowns(enemy);
    }
    applyEnemyState(cdEnemies);

    // Check for mid-round decision (every 3 rounds)
    if (ts.roundNum % 3 === 0) {
      const evt = pick(DECISION_EVENTS);
      setCombatLog(p => [...p, { text: `⟐ ${evt.title}`, type: "decision" }]);
      setDecision(evt);
      setMission(m => m ? { ...m, phase: "decision", roundNum: ts.roundNum } : m);
      setTurnState(null);
      return;
    }

    // Continue to next round
    // startRound reads mission via closure; just call it directly after a delay
    const missionSnapshot = { ...mission, enemies: cdEnemies };
    setTimeout(() => startRound(missionSnapshot, reSquad, ts.roundNum), 200);
  }

  function handleCombatEnd(endResult, finalSquad, finalEnemies, ts) {
    setTurnState(null);

    if (endResult === "allAlliesDead") {
      // Mission failed
      setCombatLog(p => [...p, { text: "MISSION FAILED", type: "header" }]);
      const fallen = finalSquad.filter(o => !o.alive);
      const alive = finalSquad.filter(o => o.alive);
      const deathLogs = [];
      for (const f of fallen) {
        const reaction = selectDeathReaction(f, alive);
        if (reaction) deathLogs.push({ text: `⟨${reaction.opName}⟩ ${reaction.text}`, type: "bark" });
      }
      if (deathLogs.length > 0) setCombatLog(p => [...p, ...deathLogs]);

      setMission(m => m ? { ...m, phase: "result", debriefPhase: "stats" } : m);
      setMissionResult({ success: false, combatStats: mission?.combatStats || {}, newBeats: [] });

    } else if (endResult === "allEnemiesDead") {
      // Encounter complete — compute everything OUTSIDE setMission callback to avoid StrictMode double-fire
      const m = mission;
      if (!m) return;
      const ne = m.currentEncounter + 1;

      if (ne > m.totalEncounters) {
        // Mission complete
        const tm = m.type.tier;
        const loot = Array.from({ length: rng(1, 2 + tm) }, () => generateGear(pick(["weapon","armor","implant","gadget"]), pick(CLASS_KEYS), game.squad[0]?.level || 1));
        const isFirstClear = !game.completedMissions?.[m.type.id];
        const repeatPenalty = isFirstClear ? 1 : 0.5;
        const xp = Math.round(50 * m.type.xpMult * tm * repeatPenalty);
        const creds = Math.round(rng(30, 60) * tm * repeatPenalty);
        const prevMC = m.prevMissionsCompleted;
        const newMC = prevMC + (isFirstClear ? 1 : 0);
        const newBeats = STORY_CHAPTERS.flatMap(ch => ch.beats.filter(b => b.at > prevMC && b.at <= newMC).map(b => ({ ...b, chapterId: ch.id })));

        setCombatLog(p => [...p, { text: "MISSION COMPLETE", type: "header" }, { text: `+${xp}XP +${creds}¢ ${loot.length} items${!isFirstClear ? " (repeat)" : " ★FIRST CLEAR"}`, type: "info" }]);
        setMissionResult({ success: true, loot, xp, credits: creds, combatStats: m.combatStats, newBeats });
        setMission(prev => prev ? { ...prev, phase: "result", debriefPhase: "stats" } : prev);

        updateGame(g => {
          const wasFirstClear = !g.completedMissions?.[m.type.id];
          const ng = { ...g, inventory: [...g.inventory, ...loot], credits: g.credits + creds, missionsCompleted: g.missionsCompleted + (wasFirstClear ? 1 : 0), completedMissions: { ...(g.completedMissions || {}), [m.type.id]: (g.completedMissions?.[m.type.id] || 0) + 1 } };
          ng.squad = ng.squad.map(o => { if (!o.alive) return o; let nx = o.xp + xp, lv = o.level, sp = o.skillPoints, xn = xpForLevel(lv);
            while (nx >= xn) { nx -= xn; lv++; sp++; xn = xpForLevel(lv); } return { ...o, xp: nx, level: lv, skillPoints: sp, xpToLevel: xn }; });
          return ng;
        });
      } else {
        // More encounters — decision event or next encounter
        if (Math.random() > 0.4) {
          const evt = pick(DECISION_EVENTS);
          setCombatLog(p => [...p, { text: `⟐ ${evt.title}`, type: "decision" }]);
          setDecision(evt);
          betweenEncounterHeal();
          const banterResult = selectBanter(game.squad.filter(o => o.alive));
          setBanter(banterResult);
          setMission(prev => prev ? { ...prev, phase: "decision", roundNum: 0, combatStats: prev.combatStats } : prev);
        } else {
          const newE = generateEncounter(m.type.tier, ne - 1);
          const betweenStory = getInlineStory(m.type.id, 'betweenEncounter', m.currentEncounter);
          const storyLog = betweenStory.map(s => ({ text: `${s.sender}: ${s.text}`, type: "story" }));
          const envFlavor2 = getEnvFlavor(m.environment?.id);
          const flavorLog = envFlavor2 ? [{ text: envFlavor2, type: "flavor" }] : [];
          setCombatLog(p => [...p, ...storyLog, ...flavorLog, { text: `💚 Squad recovers between encounters`, type: "heal" }, { text: `Encounter ${ne}/${m.totalEncounters}`, type: "round" }, { text: newE.map(en => en.name).join(", "), type: "info" }]);
          betweenEncounterHeal();
          barkBudgetRef.current = 2; recentBarksRef.current = [];
          const banterResult = selectBanter(game.squad.filter(o => o.alive));
          setBanter(banterResult);

          // Start new encounter's first round after a brief delay
          const newMission = { ...m, enemies: newE, currentEncounter: ne, roundNum: 0, decisionApplied: {}, combatStats: m.combatStats };
          setMission(newMission);
          setTimeout(() => startRound(newMission, finalSquad, 0), 500);
        }
      }
    }
  }

  // ── Bark Injection ──

  function injectBark(actionLog, currentSquad, currentEnemies) {
    if (barkBudgetRef.current <= 0) return;
    const barkEvents = [];
    const logText = actionLog.map(e => e.text || '').join(' ');
    if (logText.includes('✘KILL')) barkEvents.push('onKill');
    if (logText.includes('☠DOWN')) barkEvents.push('onAllyDown');
    if (logText.includes('★CRIT')) barkEvents.push('onCrit');
    const heavyDmg = currentSquad.some(o => {
      const prev = game.squad.find(s => s.id === o.id);
      if (!prev || !o.alive) return false;
      const maxHp = getEffectiveStats(prev).hp || 1;
      return (prev.currentHp - o.currentHp) > maxHp * 0.3;
    });
    if (heavyDmg) barkEvents.push('onHeavyDamage');

    for (const evt of barkEvents) {
      if (barkBudgetRef.current <= 0) break;
      const aliveSquad = currentSquad.filter(o => o.alive && (o.traits || []).length > 0);
      if (aliveSquad.length === 0) break;
      const barker = pick(aliveSquad);
      const bark = selectBark(evt, barker, recentBarksRef.current);
      if (bark) {
        setCombatLog(p => [...p, { text: `⟨${bark.opName}⟩ ${bark.text}`, type: "bark" }]);
        recentBarksRef.current.push(bark.text);
        barkBudgetRef.current--;
        break;
      }
    }
  }

  // ── Mission Lifecycle ──

  function startMission(mt) {
    if (game.squad.filter(o => o.alive).length === 0) return;
    updateGame(g => ({ ...g, squad: g.squad.map(o => { const s = getEffectiveStats(o); return { ...o, alive: true, currentHp: s.hp, currentShield: s.shield, defending: false, currentResource: CLASS_BASE_RESOURCE[o.classKey], activeEffects: [] }; }) }));
    const environment = getEnvironmentForMission(mt.id);
    setMission({ type: mt, currentEncounter: 0, totalEncounters: mt.encounters, phase: "briefing", enemies: [], roundNum: 0, decisionApplied: {}, combatStats: { totalRounds: 0, enemiesKilled: 0, operativesDowned: 0 }, debriefPhase: null, prevMissionsCompleted: game.missionsCompleted, environment });
    const currentChapter = STORY_CHAPTERS.filter(ch => game.missionsCompleted >= ch.unlockAt).pop();
    const storyFlavor = currentChapter ? [{ text: `[${currentChapter.title}]`, type: "decision" }] : [];
    const inlineStoryEntries = getInlineStory(mt.id, 'preEncounter', 0).map(s => ({ text: `${s.sender}: ${s.text}`, type: "story" }));
    const echoEntries = getDecisionEcho(mt.id, game.decisionHistory || {}).map(s => ({ text: `${s.sender ? s.sender + ': ' : ''}${s.text}`, type: "story" }));
    setCombatLog([...storyFlavor, ...inlineStoryEntries, ...echoEntries]);
    setDecision(null); setMissionResult(null); setTurnState(null); setTab("Mission");
  }

  function advanceMission() {
    if (!mission) return;
    if (mission.phase === "briefing") {
      const enemies = generateEncounter(mission.type.tier, 0);
      barkBudgetRef.current = 2; recentBarksRef.current = [];
      const envFlavor = getEnvFlavor(mission.environment?.id);
      const flavorEntry = envFlavor ? [{ text: envFlavor, type: "flavor" }] : [];
      setCombatLog(p => [...p, ...flavorEntry, { text: `Encounter 1/${mission.totalEncounters}`, type: "round" }, { text: enemies.map(e => e.name).join(", "), type: "info" }]);

      const newMission = { ...mission, phase: "combat", enemies, currentEncounter: 1, roundNum: 0 };
      setMission(newMission);

      // Start the first round
      const currentSquad = game.squad.map(o => ({ ...o }));
      setTimeout(() => startRound(newMission, currentSquad, 0), 200);
      return;
    }
  }

  function handleDecision(choice) {
    const applied = { [choice.effect]: true };
    if (choice.effect === "shields") setGame(p => ({ ...p, squad: p.squad.map(o => o.alive ? { ...o, currentShield: o.currentShield + 25 } : o) }));
    if (choice.effect === "pushThrough") { setGame(p => ({ ...p, squad: p.squad.map(o => { if (!o.alive) return o; return { ...o, currentHp: Math.max(1, o.currentHp - Math.round(getEffectiveStats(o).hp * .15)) }; }) })); setMission(m => m ? ({ ...m, currentEncounter: m.currentEncounter + 1 }) : m); }
    if (choice.effect === "avoid") setMission(m => m ? ({ ...m, currentEncounter: m.currentEncounter + 1 }) : m);
    if (choice.effect === "salvage") { const b = generateGear(pick(["weapon","armor"]), pick(CLASS_KEYS), (game.squad[0]?.level||1)+1); b.rarity = Math.max(RARITY.RARE, b.rarity); updateGame(g => ({ ...g, inventory: [...g.inventory, b] })); }
    setCombatLog(p => [...p, { text: `>> ${choice.text}`, type: "decision" }]);
    updateGame(g => ({ ...g, decisionHistory: { ...(g.decisionHistory || {}), [choice.effect]: mission.type.id } }));
    setDecision(null);
    setBanter(null);
    barkBudgetRef.current = 2; recentBarksRef.current = [];
    const enemies = generateEncounter(mission.type.tier, mission.currentEncounter);
    setCombatLog(p => [...p, { text: `Encounter ${mission.currentEncounter}/${mission.totalEncounters}`, type: "round" }, { text: enemies.map(e => e.name).join(", "), type: "info" }]);

    const newMission = { ...mission, phase: "combat", enemies, roundNum: 0, decisionApplied: { ...(mission.decisionApplied || {}), ...applied } };
    setMission(newMission);

    // Start combat for new encounter
    const currentSquad = game.squad.map(o => ({ ...o }));
    setTimeout(() => startRound(newMission, currentSquad, 0), 200);
  }

  function resetMission() {
    if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
    setMission(null); setDecision(null); setMissionResult(null); setCombatLog([]); setTurnState(null);
    setBanter(null); setStoryReactions([]);
    updateGame(g => ({ ...g, squad: g.squad.map(o => { const s = getEffectiveStats(o); return { ...o, alive: true, currentHp: s.hp, currentShield: s.shield, defending: false, currentResource: CLASS_BASE_RESOURCE[o.classKey] || 0, activeEffects: [] }; }) })); setTab("Squad");
  }

  function advanceDebrief() {
    if (!mission || mission.phase !== "result") return;
    if (mission.debriefPhase === "stats") {
      const hasNewComms = missionResult?.newBeats?.length > 0;
      if (hasNewComms) {
        const firstBeat = missionResult.newBeats[0];
        if (firstBeat) {
          const beatKey = `${firstBeat.chapterId}-${firstBeat.at}`;
          setStoryReactions(selectStoryReaction(beatKey, game.squad));
        }
        setMission(m => m ? ({ ...m, debriefPhase: "comms", commsIndex: 0 }) : m);
      } else {
        resetMission();
      }
      return;
    }
    if (mission.debriefPhase === "comms") {
      const beats = missionResult?.newBeats || [];
      if (mission.commsIndex < beats.length - 1) {
        const nextBeat = beats[mission.commsIndex + 1];
        if (nextBeat) {
          const beatKey = `${nextBeat.chapterId}-${nextBeat.at}`;
          setStoryReactions(selectStoryReaction(beatKey, game.squad));
        }
        setMission(m => m ? ({ ...m, commsIndex: m.commsIndex + 1 }) : m);
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
    turnState,
    banter, storyReactions,
    startMission, advanceMission, handleDecision, resetMission, advanceDebrief,
    // Turn-based action handlers
    selectAttack, selectDefend, selectItem,
    chooseStim, chooseTarget, cancelSelection,
    selectAbility, chooseAbility, chooseAllyTarget,
  };
}
