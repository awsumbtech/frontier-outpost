import { getEffectiveStats } from '../../engine/operatives';
import UnitTile from './UnitTile';
import TurnOrderBar from './TurnOrderBar';
import MissionProgressDots from './MissionProgressDots';
import CompactLog from './CompactLog';
import ActionMenu from './ActionMenu';
import PartyStatusPanel from './PartyStatusPanel';
import StimSelector from './StimSelector';

export default function BattleScene({
  squad, enemies, turnState, currentEncounter, totalEncounters, roundNum, combatLog, logRef,
  missionTypeName, environment, stims,
  selectAttack, selectDefend, selectItem, chooseStim, chooseTarget, cancelSelection,
}) {
  const currentTurnEntry = turnState?.turnQueue?.[turnState.turnIndex];
  const currentTurnId = currentTurnEntry?.unitId;
  const isAllyTurn = currentTurnEntry?.isAlly;
  const subPhase = turnState?.subPhase;

  // Determine which operative is acting
  const currentOp = isAllyTurn ? squad.find(o => o.id === currentTurnId) : null;

  // Targeting mode: enemies are clickable when selecting attack target
  const enemyTargetable = subPhase === "selectTarget";
  // Ally targeting: allies are clickable when selecting item target
  const allyTargetable = subPhase === "selectItemTarget";

  return (
    <div className={`battlefield battlefield-ff ${environment?.cssClass || ''}`}>
      {environment && (
        <>
          <div className="env-background" style={{ backgroundImage: `url(${environment.backgroundImage})` }} />
          <div className={`env-atmosphere ${environment.atmosphere.map(a => `atmo-${a}`).join(' ')}`} />
        </>
      )}
      <TurnOrderBar squad={squad} enemies={enemies} highlightId={currentTurnId} />
      <MissionProgressDots current={currentEncounter} total={totalEncounters} roundNum={roundNum} missionName={missionTypeName} />

      <div className="battle-field-area battle-field-ff">
        {/* Enemies on LEFT (FF style) */}
        <div className="enemy-formation ff-formation">
          {enemies.filter(e => e.alive).map(e => (
            <UnitTile
              key={e.id}
              unit={e}
              isAlly={false}
              highlight={currentTurnId === e.id}
              selectable={enemyTargetable}
              onClick={enemyTargetable ? () => chooseTarget(e.id) : undefined}
            />
          ))}
        </div>

        <div className="action-zone ff-action-zone">
          {subPhase === "selectTarget" && <div className="targeting-prompt">Select enemy target</div>}
          {subPhase === "selectItemTarget" && <div className="targeting-prompt">Select ally target</div>}
          {subPhase === "enemyActing" && <div className="targeting-prompt enemy-acting">Enemy turn...</div>}
          {subPhase === "processing" && <div className="targeting-prompt">...</div>}
        </div>

        {/* Allies on RIGHT (FF style) */}
        <div className="ally-formation ff-formation">
          {squad.map(op => (
            <UnitTile
              key={op.id}
              unit={op}
              isAlly
              stats={getEffectiveStats(op)}
              highlight={currentTurnId === op.id}
              isCurrentTurn={currentTurnId === op.id && isAllyTurn}
              defending={op.defending}
              selectable={allyTargetable && op.alive}
              onClick={allyTargetable && op.alive ? () => chooseTarget(op.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Bottom panels — FF style */}
      <div className="ff-bottom-panels">
        <PartyStatusPanel squad={squad} currentTurnId={currentTurnId} />
        <div className="ff-right-panel">
          {subPhase === "selectItem" && (
            <StimSelector stims={stims || []} onChoose={chooseStim} onCancel={cancelSelection} />
          )}
          {(subPhase === "awaitingAction" || subPhase === "selectTarget" || subPhase === "selectItemTarget") && (
            <ActionMenu
              operative={currentOp}
              turnState={turnState}
              stims={stims}
              onAttack={selectAttack}
              onDefend={selectDefend}
              onItem={selectItem}
            />
          )}
          {subPhase === "selectTarget" && (
            <button className="action-cancel-btn" onClick={cancelSelection}>Cancel</button>
          )}
          {subPhase === "selectItemTarget" && (
            <button className="action-cancel-btn" onClick={cancelSelection}>Cancel</button>
          )}
        </div>
      </div>

      <CompactLog combatLog={combatLog} logRef={logRef} />
    </div>
  );
}
