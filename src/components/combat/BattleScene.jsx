import { getEffectiveStats } from '../../engine/operatives';
import UnitTile from './UnitTile';
import TurnOrderBar from './TurnOrderBar';
import MissionProgressDots from './MissionProgressDots';
import ActionBanner from './ActionBanner';
import CompactLog from './CompactLog';

export default function BattleScene({ squad, enemies, animation, currentEncounter, totalEncounters, roundNum, combatLog, logRef, missionTypeName }) {
  // Merge animation display states over real state
  const displaySquad = animation?.displayAllies
    ? squad.map(op => {
        const d = animation.displayAllies.find(a => a.id === op.id);
        return d ? { ...op, currentHp: d.currentHp, currentShield: d.currentShield, alive: d.alive } : op;
      })
    : squad;

  const displayEnemies = animation?.displayEnemies
    ? enemies.map(e => {
        const d = animation.displayEnemies.find(x => x.id === e.id);
        return d ? { ...e, hp: d.hp, alive: d.alive, stunned: d.stunned, bleed: d.bleed } : e;
      })
    : enemies;

  return (
    <div className="battlefield">
      <TurnOrderBar squad={displaySquad} enemies={displayEnemies} highlightId={animation?.highlightId} />
      <MissionProgressDots current={currentEncounter} total={totalEncounters} roundNum={roundNum} missionName={missionTypeName} />
      <div className="battle-field-area">
        <div className="ally-formation">
          {displaySquad.map(op => (
            <UnitTile
              key={op.id}
              unit={op}
              isAlly
              stats={getEffectiveStats(op)}
              highlight={animation?.highlightId === op.id}
            />
          ))}
        </div>
        <div className="action-zone">
          <ActionBanner animation={animation} />
        </div>
        <div className="enemy-formation">
          {(animation ? displayEnemies : displayEnemies.filter(e => e.alive)).map(e => (
            <UnitTile
              key={e.id}
              unit={e}
              isAlly={false}
              highlight={animation?.highlightId === e.id}
            />
          ))}
        </div>
      </div>
      <CompactLog combatLog={combatLog} logRef={logRef} />
    </div>
  );
}
