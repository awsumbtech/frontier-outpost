import { useState, useCallback } from "react";
import { STIM_TYPES } from "../data/gear";
import { OP_NAMES } from "../data/operativeNames";
import { pick } from "../engine/utils";
import { generateGear } from "../engine/gear";
import { createOperative, getEffectiveStats } from "../engine/operatives";
import { selectTraits, selectDeathReaction } from "../engine/personality";

function initState() {
  const s1 = createOperative("VANGUARD", OP_NAMES[0], selectTraits());
  const s2 = createOperative("RECON", OP_NAMES[1], selectTraits());
  s1.gear.weapon = generateGear("weapon", "VANGUARD", 1);
  s1.gear.armor = generateGear("armor", "VANGUARD", 1);
  s2.gear.weapon = generateGear("weapon", "RECON", 1);
  s2.gear.armor = generateGear("armor", "RECON", 1);
  const es1 = getEffectiveStats(s1); s1.currentHp = es1.hp; s1.currentShield = es1.shield;
  const es2 = getEffectiveStats(s2); s2.currentHp = es2.hp; s2.currentShield = es2.shield;
  return { squad: [s1, s2], inventory: [generateGear("gadget", null, 1), generateGear("implant", null, 1), generateGear("weapon", "ENGINEER", 1)], credits: 200, missionsCompleted: 0, storyBeatsRead: {}, stims: [{ ...STIM_TYPES[0] }, { ...STIM_TYPES[0] }], completedMissions: {}, decisionHistory: {}, memorial: [], settings: { stepThroughCombat: true } };
}

export default function useGameState() {
  const [game, setGame] = useState(initState);
  const [selectedOp, setSelectedOp] = useState(null);
  const [gearModal, setGearModal] = useState(null);
  const [invFilter, setInvFilter] = useState("all");
  const [stimTarget, setStimTarget] = useState(null);
  const [showIntro, setShowIntro] = useState(false);

  // Load from storage on mount (called once in App via useEffect)
  const loadGame = useCallback(async () => {
    try {
      const r = await window.storage.get("frontier-v2");
      if (r?.value) { const d = JSON.parse(r.value); if (d.squad) { d.decisionHistory = d.decisionHistory || {}; d.memorial = d.memorial || []; d.squad = d.squad.map(o => ({ ...o, traits: o.traits || [] })); setGame(d); } }
      else { setShowIntro(true); }
    } catch(e){ setShowIntro(true); }
  }, []);

  const newGame = useCallback(async () => {
    try { await window.storage.set("frontier-v2", ""); } catch(e){}
    setGame(initState());
    setSelectedOp(null);
    setShowIntro(true);
  }, []);

  const saveGame = useCallback(async (s) => { try { await window.storage.set("frontier-v2", JSON.stringify(s)); } catch(e){} }, []);
  const updateGame = useCallback((fn) => { setGame(prev => { const next = fn(prev); saveGame(next); return next; }); }, [saveGame]);

  function equipGear(opId, slot, gearId) {
    updateGame(g => {
      const ng = { ...g, squad: [...g.squad], inventory: [...g.inventory] };
      const oi = ng.squad.findIndex(o => o.id === opId); if (oi < 0) return g;
      const op = { ...ng.squad[oi], gear: { ...ng.squad[oi].gear } };
      const gi = ng.inventory.findIndex(i => i.id === gearId); if (gi < 0) return g;
      if (op.gear[slot]) ng.inventory.push(op.gear[slot]);
      op.gear[slot] = ng.inventory[gi]; ng.inventory.splice(gi, 1);
      const stats = getEffectiveStats(op); op.currentHp = Math.min(op.currentHp, stats.hp); op.currentShield = Math.min(op.currentShield, stats.shield);
      ng.squad[oi] = op; return ng;
    }); setGearModal(null);
  }

  function unequipGear(opId, slot) {
    updateGame(g => {
      const ng = { ...g, squad: [...g.squad], inventory: [...g.inventory] };
      const oi = ng.squad.findIndex(o => o.id === opId); if (oi < 0) return g;
      const op = { ...ng.squad[oi], gear: { ...ng.squad[oi].gear } };
      if (op.gear[slot]) { ng.inventory.push(op.gear[slot]); op.gear[slot] = null; }
      ng.squad[oi] = op; return ng;
    });
  }

  function scrapGear(gearId) {
    updateGame(g => { const i = g.inventory.findIndex(x => x.id === gearId); if (i < 0) return g;
      const val = (g.inventory[i].rarity + 1) * 15 + g.inventory[i].level * 5; const inv = [...g.inventory]; inv.splice(i, 1);
      return { ...g, inventory: inv, credits: g.credits + val }; });
  }

  function learnSkill(opId, skillName, cost) {
    updateGame(g => { const ng = { ...g, squad: [...g.squad] }; const i = ng.squad.findIndex(o => o.id === opId); if (i < 0) return g;
      const op = { ...ng.squad[i], skills: { ...ng.squad[i].skills } }; if (op.skillPoints < cost) return g;
      op.skills[skillName] = true; op.skillPoints -= cost; const s = getEffectiveStats(op); op.currentHp = s.hp; op.currentShield = s.shield;
      ng.squad[i] = op; return ng; });
  }

  function recruitOp(classKey) {
    if (game.squad.length >= 4 || game.credits < 150) return;
    const used = game.squad.map(o => o.name); const name = pick(OP_NAMES.filter(n => !used.includes(n)));
    const op = createOperative(classKey, name, selectTraits()); op.gear.weapon = generateGear("weapon", classKey, 1);
    const es = getEffectiveStats(op); op.currentHp = es.hp; op.currentShield = es.shield;
    updateGame(g => ({ ...g, squad: [...g.squad, op], credits: g.credits - 150 }));
  }

  function dismissOp(opId) {
    updateGame(g => { const op = g.squad.find(o => o.id === opId); if (!op) return g;
      const inv = [...g.inventory]; for (const s of ["weapon","armor","implant","gadget"]) if (op.gear[s]) inv.push(op.gear[s]);
      const memorial = [...(g.memorial || []), { name: op.name, classKey: op.classKey, icon: op.icon, traits: op.traits || [], reason: 'dismissed' }];
      return { ...g, squad: g.squad.filter(o => o.id !== opId), inventory: inv, memorial }; }); setSelectedOp(null);
  }

  function buyStim(stimType) {
    if (game.credits < stimType.cost) return;
    updateGame(g => ({ ...g, credits: g.credits - stimType.cost, stims: [...(g.stims || []), { ...stimType }] }));
  }

  function useStim(stimIdx, targetOpId) {
    const stim = (game.stims || [])[stimIdx];
    if (!stim) return;
    updateGame(g => {
      const ng = { ...g, stims: [...(g.stims || [])], squad: [...g.squad] };
      ng.stims.splice(stimIdx, 1);
      if (stim.id === "health_stim" && targetOpId) {
        ng.squad = ng.squad.map(o => {
          if (o.id !== targetOpId) return o;
          const maxHp = getEffectiveStats(o).hp;
          return { ...o, currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.4)), alive: true };
        });
      } else if (stim.id === "shield_cell" && targetOpId) {
        ng.squad = ng.squad.map(o => {
          if (o.id !== targetOpId) return o;
          const maxSh = getEffectiveStats(o).shield;
          return { ...o, currentShield: maxSh };
        });
      } else if (stim.id === "nano_kit") {
        ng.squad = ng.squad.map(o => {
          const maxHp = getEffectiveStats(o).hp;
          return { ...o, currentHp: Math.min(maxHp, o.currentHp + Math.round(maxHp * 0.25)), alive: true };
        });
      }
      return ng;
    });
  }

  function updateSettings(patch) {
    updateGame(g => ({ ...g, settings: { ...(g.settings || {}), ...patch } }));
  }

  return {
    game, setGame, updateGame, loadGame, newGame,
    showIntro, setShowIntro,
    selectedOp, setSelectedOp,
    gearModal, setGearModal,
    invFilter, setInvFilter,
    stimTarget, setStimTarget,
    equipGear, unequipGear, scrapGear, learnSkill,
    recruitOp, dismissOp, buyStim, useStim, updateSettings,
  };
}
