import { getEffectiveStats } from '../../engine/operatives';
import useAnimationQueue from '../../hooks/useAnimationQueue';
import UnitTile from './UnitTile';
import TurnOrderBar from './TurnOrderBar';

import CompactLog from './CompactLog';
import ActionMenu from './ActionMenu';
import PartyStatusPanel from './PartyStatusPanel';
import StimSelector from './StimSelector';
import AbilitySelector from './AbilitySelector';

export default function BattleScene({
  squad, enemies, turnState, currentEncounter, totalEncounters, roundNum, combatLog, logRef,
  missionTypeName, environment, stims,
  selectAttack, selectDefend, selectItem, chooseStim, chooseTarget, cancelSelection,
  selectAbility, chooseAbility, chooseAllyTarget,
  lastAction,
}) {
  const currentTurnEntry = turnState?.turnQueue?.[turnState.turnIndex];
  const currentTurnId = currentTurnEntry?.unitId;
  const isAllyTurn = currentTurnEntry?.isAlly;
  const subPhase = turnState?.subPhase;

  const { getUnitAnimState, screenShake } = useAnimationQueue(lastAction);

  // Determine which operative is acting
  const currentOp = isAllyTurn ? squad.find(o => o.id === currentTurnId) : null;

  // Targeting mode: enemies are clickable when selecting attack target or ability target
  const enemyTargetable = subPhase === "selectTarget" || subPhase === "selectAbilityTarget";
  // Ally targeting: allies are clickable when selecting item target or ability ally target
  const allyTargetable = subPhase === "selectItemTarget" || subPhase === "selectAbilityAllyTarget";

  // Determine the correct handler for choosing a target
  function handleEnemyClick(enemyId) {
    if (subPhase === "selectAbilityTarget") {
      chooseTarget(enemyId);
    } else {
      chooseTarget(enemyId);
    }
  }

  function handleAllyClick(allyId) {
    if (subPhase === "selectAbilityAllyTarget") {
      chooseAllyTarget(allyId);
    } else {
      chooseTarget(allyId);
    }
  }

  return (
    <div className={`battlefield battlefield-ff ${environment?.cssClass || ''}${screenShake ? ' battlefield-shake' : ''}`}>
      {environment && (
        <>
          <div className="env-background" style={{ backgroundImage: `url(${environment.backgroundImage})` }} />
          <div className={`env-atmosphere ${environment.atmosphere.map(a => `atmo-${a}`).join(' ')}`} />
        </>
      )}
      <TurnOrderBar squad={squad} enemies={enemies} highlightId={currentTurnId} />

      <div className="battle-field-area battle-field-ff">
        {/* Enemies on LEFT (FF style) */}
        <div className="enemy-formation ff-formation">
          {enemies.filter(e => e.alive).map(e => (
            <UnitTile
              key={e.id}
              unit={e}
              isAlly={false}
              highlight={currentTurnId === e.id}
              isCurrentTurn={currentTurnId === e.id && !isAllyTurn}
              selectable={enemyTargetable}
              onClick={enemyTargetable ? () => handleEnemyClick(e.id) : undefined}
              animState={getUnitAnimState(e.id, false)}
            />
          ))}
        </div>

        <div className="action-zone ff-action-zone">
          {subPhase === "selectTarget" && <div className="targeting-prompt">Select enemy target</div>}
          {subPhase === "selectAbilityTarget" && <div className="targeting-prompt">Select enemy target</div>}
          {subPhase === "selectItemTarget" && <div className="targeting-prompt">Select ally target</div>}
          {subPhase === "selectAbilityAllyTarget" && <div className="targeting-prompt">Select ally target</div>}
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
              selectable={allyTargetable && (op.alive || turnState?.selectedAbilityId === 'revive')}
              onClick={allyTargetable && (op.alive || turnState?.selectedAbilityId === 'revive') ? () => handleAllyClick(op.id) : undefined}
              animState={getUnitAnimState(op.id, true)}
            />
          ))}
        </div>
      </div>

      {/* Bottom panels — FF style dialog boxes */}
      <div className="ff-bottom-panels">
        <div className="combat-dialog-box dialog-left">
          <div className="combat-dialog-label">Comms Log</div>
          <CompactLog combatLog={combatLog} logRef={logRef} />
        </div>
        <div className="combat-dialog-box dialog-right">
          <PartyStatusPanel squad={squad} currentTurnId={currentTurnId} />
          <hr className="dialog-separator" />
          <div className="ff-right-panel">
            {subPhase === "selectItem" && (
              <StimSelector stims={stims || []} onChoose={chooseStim} onCancel={cancelSelection} />
            )}
            {subPhase === "selectAbility" && (
              <AbilitySelector
                operative={currentOp}
                onChoose={chooseAbility}
                onCancel={cancelSelection}
              />
            )}
            {(subPhase === "awaitingAction" || subPhase === "selectTarget" || subPhase === "selectItemTarget" || subPhase === "selectAbilityTarget" || subPhase === "selectAbilityAllyTarget") && (
              <ActionMenu
                operative={currentOp}
                turnState={turnState}
                stims={stims}
                onAttack={selectAttack}
                onDefend={selectDefend}
                onItem={selectItem}
                onAbility={selectAbility}
              />
            )}
            {(subPhase === "selectTarget" || subPhase === "selectAbilityTarget" || subPhase === "selectAbilityAllyTarget") && (
              <button className="action-cancel-btn" onClick={cancelSelection}>Cancel</button>
            )}
            {subPhase === "selectItemTarget" && (
              <button className="action-cancel-btn" onClick={cancelSelection}>Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
