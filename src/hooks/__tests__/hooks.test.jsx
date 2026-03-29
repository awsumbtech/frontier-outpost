import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useGameState from '../useGameState';
import useMission from '../useMission';
import { MISSIONS } from '../../data/missions';
import { STIM_TYPES } from '../../data/gear';
import { getEffectiveStats } from '../../engine/operatives';

// Mock window.storage for save/load tests
beforeEach(() => {
  window.storage = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  };
});

describe('useGameState', () => {
  it('initializes with 2 squad members and 200 credits', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.game.squad).toHaveLength(2);
    expect(result.current.game.credits).toBe(200);
    expect(result.current.game.inventory).toHaveLength(3);
  });

  it('recruitOp adds operative and deducts credits', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.recruitOp('MEDIC'); });
    expect(result.current.game.squad).toHaveLength(3);
    expect(result.current.game.credits).toBe(50);
    expect(result.current.game.squad[2].classKey).toBe('MEDIC');
  });

  it('recruitOp respects 4-squad limit', () => {
    const { result } = renderHook(() => useGameState());
    // Give enough credits for 2 more recruits
    act(() => { result.current.setGame(prev => ({ ...prev, credits: 600 })); });
    act(() => { result.current.recruitOp('MEDIC'); });
    act(() => { result.current.recruitOp('ENGINEER'); });
    expect(result.current.game.squad).toHaveLength(4);
    // squad is now 4, try adding a 5th
    act(() => { result.current.recruitOp('VANGUARD'); });
    expect(result.current.game.squad).toHaveLength(4);
  });

  it('recruitOp respects credit requirement', () => {
    const { result } = renderHook(() => useGameState());
    // Spend credits down below 150
    act(() => { result.current.recruitOp('MEDIC'); }); // 200 - 150 = 50
    act(() => { result.current.recruitOp('ENGINEER'); }); // can't afford (50 < 150)
    expect(result.current.game.squad).toHaveLength(3);
  });

  it('scrapGear adds credits and removes item', () => {
    const { result } = renderHook(() => useGameState());
    const gearId = result.current.game.inventory[0].id;
    const gear = result.current.game.inventory[0];
    const expectedValue = (gear.rarity + 1) * 15 + gear.level * 5;
    act(() => { result.current.scrapGear(gearId); });
    expect(result.current.game.inventory).toHaveLength(2);
    expect(result.current.game.credits).toBe(200 + expectedValue);
  });

  it('equipGear swaps gear and closes modal', () => {
    const { result } = renderHook(() => useGameState());
    const opId = result.current.game.squad[0].id;
    // Find an armor piece in inventory
    const armor = result.current.game.inventory.find(g => g.type === 'armor');
    if (!armor) return; // skip if no armor generated (unlikely but possible)

    act(() => { result.current.setGearModal({ opId, slot: 'armor' }); });
    expect(result.current.gearModal).toBeTruthy();

    // The op already has armor equipped from init, so equipping new one should swap
    const oldArmor = result.current.game.squad[0].gear.armor;
    act(() => { result.current.equipGear(opId, 'armor', armor.id); });
    expect(result.current.gearModal).toBeNull();
    expect(result.current.game.squad[0].gear.armor.id).toBe(armor.id);
    // Old armor should be back in inventory
    if (oldArmor) {
      expect(result.current.game.inventory.some(g => g.id === oldArmor.id)).toBe(true);
    }
  });

  it('dismissOp returns gear to inventory', () => {
    const { result } = renderHook(() => useGameState());
    const op = result.current.game.squad[0];
    const gearCount = Object.values(op.gear).filter(Boolean).length;
    const invBefore = result.current.game.inventory.length;
    act(() => { result.current.dismissOp(op.id); });
    expect(result.current.game.squad).toHaveLength(1);
    expect(result.current.game.inventory.length).toBe(invBefore + gearCount);
  });

  it('buyStim deducts credits and adds stim', () => {
    const { result } = renderHook(() => useGameState());
    const stimsBefore = (result.current.game.stims || []).length;
    const st = STIM_TYPES[0];
    act(() => { result.current.buyStim(st); });
    expect(result.current.game.stims.length).toBe(stimsBefore + 1);
    expect(result.current.game.credits).toBe(200 - st.cost);
  });

  it('useStim applies health_stim to target', () => {
    const { result } = renderHook(() => useGameState());
    // Damage an operative first
    const opId = result.current.game.squad[0].id;
    act(() => {
      result.current.setGame(prev => ({
        ...prev,
        squad: prev.squad.map(o => o.id === opId ? { ...o, currentHp: 10 } : o),
        stims: [{ ...STIM_TYPES.find(s => s.id === 'health_stim') }],
      }));
    });
    const hpBefore = result.current.game.squad[0].currentHp;
    expect(hpBefore).toBe(10);
    act(() => { result.current.useStim(0, opId); });
    expect(result.current.game.squad[0].currentHp).toBeGreaterThan(10);
    expect(result.current.game.stims).toHaveLength(0);
  });

  it('learnSkill deducts skill points', () => {
    const { result } = renderHook(() => useGameState());
    // Give an operative skill points
    const opId = result.current.game.squad[0].id;
    act(() => {
      result.current.setGame(prev => ({
        ...prev,
        squad: prev.squad.map(o => o.id === opId ? { ...o, skillPoints: 5 } : o),
      }));
    });
    expect(result.current.game.squad[0].skillPoints).toBe(5);
    // Learn the first skill of the first branch
    const { CLASSES } = require('../../data/classes');
    const cls = CLASSES[result.current.game.squad[0].classKey];
    const firstBranch = Object.values(cls.branches)[0];
    const firstSkill = firstBranch.skills[0];
    act(() => { result.current.learnSkill(opId, firstSkill.name, firstSkill.cost); });
    expect(result.current.game.squad[0].skillPoints).toBe(5 - firstSkill.cost);
    expect(result.current.game.squad[0].skills[firstSkill.name]).toBe(true);
  });
});

describe('useMission', () => {
  function setup() {
    const gameHook = renderHook(() => useGameState());
    const { game, setGame, updateGame } = gameHook.result.current;
    const setTab = vi.fn();
    const missionHook = renderHook(() =>
      useMission(gameHook.result.current.game, gameHook.result.current.setGame, gameHook.result.current.updateGame, setTab)
    );
    return { gameHook, missionHook, setTab };
  }

  it('starts with no active mission', () => {
    const { missionHook } = setup();
    expect(missionHook.result.current.mission).toBeNull();
    expect(missionHook.result.current.combatLog).toEqual([]);
  });

  it('startMission sets mission state and switches to Mission tab', () => {
    const { gameHook, missionHook, setTab } = setup();
    const mt = MISSIONS[0];
    act(() => { missionHook.result.current.startMission(mt); });
    expect(missionHook.result.current.mission).toBeTruthy();
    expect(missionHook.result.current.mission.phase).toBe('briefing');
    expect(missionHook.result.current.mission.type.id).toBe(mt.id);
    expect(setTab).toHaveBeenCalledWith('Mission');
    expect(missionHook.result.current.combatLog.length).toBeGreaterThan(0);
  });

  it('startMission initializes combatStats and prevMissionsCompleted', () => {
    const { missionHook } = setup();
    act(() => { missionHook.result.current.startMission(MISSIONS[0]); });
    const m = missionHook.result.current.mission;
    expect(m.combatStats).toEqual({ totalRounds: 0, enemiesKilled: 0, operativesDowned: 0 });
    expect(m.debriefPhase).toBeNull();
    expect(m.prevMissionsCompleted).toBe(0);
  });

  it('advanceDebrief is exported', () => {
    const { missionHook } = setup();
    expect(typeof missionHook.result.current.advanceDebrief).toBe('function');
  });

  it('advanceMission transitions from briefing to combat', () => {
    const { missionHook } = setup();
    const mt = MISSIONS[0];
    act(() => { missionHook.result.current.startMission(mt); });
    act(() => { missionHook.result.current.advanceMission(); });
    expect(missionHook.result.current.mission.phase).toBe('combat');
    expect(missionHook.result.current.mission.enemies.length).toBeGreaterThan(0);
    expect(missionHook.result.current.mission.currentEncounter).toBe(1);
  });

  it('resetMission clears all mission state', () => {
    const { missionHook, setTab } = setup();
    act(() => { missionHook.result.current.startMission(MISSIONS[0]); });
    act(() => { missionHook.result.current.resetMission(); });
    expect(missionHook.result.current.mission).toBeNull();
    expect(missionHook.result.current.combatLog).toEqual([]);
    expect(missionHook.result.current.decision).toBeNull();
    expect(missionHook.result.current.missionResult).toBeNull();
    expect(setTab).toHaveBeenCalledWith('Squad');
  });
});
