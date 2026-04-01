import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SquadTab from '../tabs/SquadTab';
import MissionTab from '../tabs/MissionTab';
import InventoryTab from '../tabs/InventoryTab';
import CommsTab from '../tabs/CommsTab';
import RecruitTab from '../tabs/RecruitTab';
import GearModal from '../shared/GearModal';
import { createOperative } from '../../engine/operatives';
import { generateGear } from '../../engine/gear';
import { MISSIONS } from '../../data/missions';
import { STIM_TYPES } from '../../data/gear';

function makeGame() {
  const op1 = createOperative('VANGUARD', 'Tank Alpha');
  const op2 = createOperative('RECON', 'Scout Beta');
  op1.gear.weapon = generateGear('weapon', 'VANGUARD', 1);
  op2.gear.weapon = generateGear('weapon', 'RECON', 1);
  return {
    squad: [op1, op2],
    inventory: [generateGear('armor', null, 1), generateGear('gadget', null, 1)],
    credits: 500,
    missionsCompleted: 0,
    storyBeatsRead: {},
    stims: [{ ...STIM_TYPES[0] }],
    completedMissions: {},
  };
}

describe('SquadTab', () => {
  it('renders squad list with operative names', () => {
    const game = makeGame();
    const { container } = render(
      <SquadTab game={game} selectedOp={null} setSelectedOp={vi.fn()} setGearModal={vi.fn()} unequipGear={vi.fn()} learnSkill={vi.fn()} dismissOp={vi.fn()} />
    );
    expect(container.textContent).toContain('Tank Alpha');
    expect(container.textContent).toContain('Scout Beta');
  });

  it('renders operative detail when selectedOp is set', () => {
    const game = makeGame();
    const { container } = render(
      <SquadTab game={game} selectedOp={game.squad[0].id} setSelectedOp={vi.fn()} setGearModal={vi.fn()} unequipGear={vi.fn()} learnSkill={vi.fn()} dismissOp={vi.fn()} />
    );
    expect(container.textContent).toContain('LVL 1');
    expect(container.textContent).toContain('Loadout');
    expect(container.textContent).toContain('Skills');
  });

  it('shows Back button in detail view', () => {
    const game = makeGame();
    const setSelectedOp = vi.fn();
    const { container } = render(
      <SquadTab game={game} selectedOp={game.squad[0].id} setSelectedOp={setSelectedOp} setGearModal={vi.fn()} unequipGear={vi.fn()} learnSkill={vi.fn()} dismissOp={vi.fn()} />
    );
    const backBtn = container.querySelector('button');
    expect(backBtn.textContent).toContain('Back');
    fireEvent.click(backBtn);
    expect(setSelectedOp).toHaveBeenCalledWith(null);
  });
});

describe('MissionTab', () => {
  it('renders mission select when no active mission', () => {
    const game = makeGame();
    const { container } = render(
      <MissionTab game={game} mission={null} combatLog={[]} decision={null} missionResult={null} logRef={{ current: null }} turnState={null} startMission={vi.fn()} advanceMission={vi.fn()} handleDecision={vi.fn()} resetMission={vi.fn()} advanceDebrief={vi.fn()} selectAttack={vi.fn()} selectDefend={vi.fn()} selectItem={vi.fn()} chooseStim={vi.fn()} chooseTarget={vi.fn()} cancelSelection={vi.fn()} />
    );
    expect(container.textContent).toContain('Avg Level');
    expect(container.textContent).toContain('0 completed');
    // Should show chapter 1 missions
    const firstMission = MISSIONS.find(m => m.chapter === 'ch1');
    expect(container.textContent).toContain(firstMission.name);
  });

  it('renders active mission combat view', () => {
    const game = makeGame();
    const mission = {
      type: MISSIONS[0],
      currentEncounter: 1,
      totalEncounters: 3,
      phase: 'combat',
      enemies: [{ id: 'e1', name: 'Test Bot', hp: 50, maxHp: 50, damage: 10, armor: 5, speed: 8, alive: true, stunned: false }],
      roundNum: 1,
      decisionApplied: {},
    };
    const log = [{ text: 'Round 1', type: 'round' }];
    const { container } = render(
      <MissionTab game={game} mission={mission} combatLog={log} decision={null} missionResult={null} logRef={{ current: null }} turnState={null} startMission={vi.fn()} advanceMission={vi.fn()} handleDecision={vi.fn()} resetMission={vi.fn()} advanceDebrief={vi.fn()} selectAttack={vi.fn()} selectDefend={vi.fn()} selectItem={vi.fn()} chooseStim={vi.fn()} chooseTarget={vi.fn()} cancelSelection={vi.fn()} />
    );
    expect(container.textContent).toContain(MISSIONS[0].name);
    expect(container.textContent).toContain('1/3');
    expect(container.textContent).toContain('Abort');
  });

  it('renders debrief panel on result phase', () => {
    const game = makeGame();
    const mission = {
      type: MISSIONS[0],
      currentEncounter: 2,
      totalEncounters: 2,
      phase: 'result',
      debriefPhase: 'stats',
      enemies: [],
      roundNum: 5,
      decisionApplied: {},
      combatStats: { totalRounds: 5, enemiesKilled: 4, operativesDowned: 1 },
    };
    const result = { success: true, xp: 100, credits: 50, loot: [], combatStats: mission.combatStats, newBeats: [] };
    const advanceDebrief = vi.fn();
    const { container } = render(
      <MissionTab game={game} mission={mission} combatLog={[]} decision={null} missionResult={result} logRef={{ current: null }} turnState={null} startMission={vi.fn()} advanceMission={vi.fn()} handleDecision={vi.fn()} resetMission={vi.fn()} advanceDebrief={advanceDebrief} selectAttack={vi.fn()} selectDefend={vi.fn()} selectItem={vi.fn()} chooseStim={vi.fn()} chooseTarget={vi.fn()} cancelSelection={vi.fn()} />
    );
    expect(container.textContent).toContain('MISSION COMPLETE');
    expect(container.textContent).toContain('5'); // rounds
    expect(container.textContent).toContain('4'); // kills
    expect(container.textContent).toContain('+100 XP');
    expect(container.textContent).toContain('+50¢');
    expect(container.textContent).toContain('Continue');
    fireEvent.click(screen.getByText('Continue'));
    expect(advanceDebrief).toHaveBeenCalled();
  });

  it('renders transmission panel on comms phase', () => {
    const game = makeGame();
    const mission = {
      type: MISSIONS[0],
      currentEncounter: 2,
      totalEncounters: 2,
      phase: 'result',
      debriefPhase: 'comms',
      commsIndex: 0,
      enemies: [],
      roundNum: 3,
      decisionApplied: {},
      combatStats: { totalRounds: 3, enemiesKilled: 2, operativesDowned: 0 },
    };
    const result = { success: true, xp: 100, credits: 50, loot: [], combatStats: mission.combatStats, newBeats: [{ sender: 'CMD Vasquez', text: 'Good work on the sweep.', chapterId: 'ch1', at: 1 }] };
    const { container } = render(
      <MissionTab game={game} mission={mission} combatLog={[]} decision={null} missionResult={result} logRef={{ current: null }} turnState={null} startMission={vi.fn()} advanceMission={vi.fn()} handleDecision={vi.fn()} resetMission={vi.fn()} advanceDebrief={vi.fn()} selectAttack={vi.fn()} selectDefend={vi.fn()} selectItem={vi.fn()} chooseStim={vi.fn()} chooseTarget={vi.fn()} cancelSelection={vi.fn()} />
    );
    expect(container.textContent).toContain('INCOMING TRANSMISSION');
    expect(container.textContent).toContain('CMD Vasquez');
    expect(container.textContent).toContain('Good work on the sweep.');
    expect(container.textContent).toContain('Return to Base');
  });
});

describe('InventoryTab', () => {
  it('renders gear list and stims', () => {
    const game = makeGame();
    const { container } = render(
      <InventoryTab game={game} invFilter="all" setInvFilter={vi.fn()} stimTarget={null} setStimTarget={vi.fn()} buyStim={vi.fn()} useStim={vi.fn()} scrapGear={vi.fn()} />
    );
    expect(container.textContent).toContain('COMBAT STIMS');
    expect(container.textContent).toContain('GEAR LOCKER');
    expect(container.textContent).toContain('2 ITEMS');
  });

  it('filters gear by type', () => {
    const game = makeGame();
    const { container } = render(
      <InventoryTab game={game} invFilter="armor" setInvFilter={vi.fn()} stimTarget={null} setStimTarget={vi.fn()} buyStim={vi.fn()} useStim={vi.fn()} scrapGear={vi.fn()} />
    );
    // Should only show armor items
    const gearCards = container.querySelectorAll('.gear-card');
    expect(gearCards.length).toBe(1); // only the 1 armor piece
  });

  it('shows empty state when no gear', () => {
    const game = makeGame();
    game.inventory = [];
    const { container } = render(
      <InventoryTab game={game} invFilter="all" setInvFilter={vi.fn()} stimTarget={null} setStimTarget={vi.fn()} buyStim={vi.fn()} useStim={vi.fn()} scrapGear={vi.fn()} />
    );
    expect(container.textContent).toContain('No gear');
  });
});

describe('CommsTab', () => {
  it('shows chapter 1 content even at 0 missions (unlockAt: 0)', () => {
    const game = makeGame();
    const { container } = render(
      <CommsTab game={game} updateGame={vi.fn()} />
    );
    expect(container.textContent).toContain('CH.1');
    expect(container.textContent).toContain('PLANETFALL');
  });

  it('shows story content when missions completed', () => {
    const game = makeGame();
    game.missionsCompleted = 5;
    const { container } = render(
      <CommsTab game={game} updateGame={vi.fn()} />
    );
    expect(container.textContent).toContain('CH.1');
  });
});

describe('RecruitTab', () => {
  it('renders all 4 class cards', () => {
    const game = makeGame();
    const { container } = render(
      <RecruitTab game={game} recruitOp={vi.fn()} />
    );
    expect(container.textContent).toContain('Vanguard');
    expect(container.textContent).toContain('Recon');
    expect(container.textContent).toContain('Medic');
    expect(container.textContent).toContain('Engineer');
  });

  it('shows Full when squad is at capacity', () => {
    const game = makeGame();
    game.squad = [
      createOperative('VANGUARD', 'A'),
      createOperative('RECON', 'B'),
      createOperative('MEDIC', 'C'),
      createOperative('ENGINEER', 'D'),
    ];
    const { container } = render(
      <RecruitTab game={game} recruitOp={vi.fn()} />
    );
    expect(container.textContent).toContain('Full');
    expect(container.textContent).toContain('4/4');
  });
});

describe('GearModal', () => {
  it('returns null when gearModal is null', () => {
    const { container } = render(
      <GearModal gearModal={null} setGearModal={vi.fn()} game={makeGame()} equipGear={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders gear modal with available gear', () => {
    const game = makeGame();
    const opId = game.squad[0].id;
    const { container } = render(
      <GearModal gearModal={{ opId, slot: 'armor' }} setGearModal={vi.fn()} game={game} equipGear={vi.fn()} />
    );
    expect(container.textContent).toContain('Equip armor');
    // Should show available armor from inventory
    expect(container.querySelectorAll('.inv-item').length).toBeGreaterThan(0);
  });

  it('shows empty message when no gear available for slot', () => {
    const game = makeGame();
    game.inventory = []; // no gear
    const opId = game.squad[0].id;
    const { container } = render(
      <GearModal gearModal={{ opId, slot: 'implant' }} setGearModal={vi.fn()} game={game} equipGear={vi.fn()} />
    );
    expect(container.textContent).toContain('No implants available');
  });
});
