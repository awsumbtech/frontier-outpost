import { useState, useEffect, useRef, useCallback } from 'react';

// Animation durations in ms — shared between hook and useMission
export const ANIM_DURATIONS = {
  melee: 750,
  ranged: 700,
  aoe: 650,
  heal: 650,
  buff: 550,
  debuff: 550,
  defend: 400,
  item: 500,
};

// Phase timings per attack type
const PHASE_TIMINGS = {
  melee:  { dash: 250, impact: 200, ret: 250 },
  ranged: { dash: 150, impact: 350, ret: 150 },
  aoe:    { dash: 200, impact: 400, ret: 0 },
  heal:   { dash: 200, impact: 400, ret: 0 },
  buff:   { dash: 150, impact: 350, ret: 0 },
  debuff: { dash: 150, impact: 350, ret: 0 },
  defend: { dash: 0, impact: 350, ret: 0 },
  item:   { dash: 150, impact: 300, ret: 0 },
};

/**
 * Classifies an action into an animation type based on context.
 */
export function classifyAttackType(action) {
  if (!action) return 'melee';
  if (action.type === 'defend') return 'defend';
  if (action.type === 'item') return 'item';
  if (action.type === 'ability') {
    const eff = action.effectType;
    if (eff === 'heal' || eff === 'revive') return 'heal';
    if (eff === 'buff') return 'buff';
    if (eff === 'debuff') return 'debuff';
    if (action.targetType === 'allEnemies') return 'aoe';
    return 'melee';
  }
  if (action.type === 'enemyAbility') return 'debuff';
  // Default for basic attacks
  return 'melee';
}

/**
 * useAnimationQueue — Manages combat animation state decoupled from game logic.
 *
 * Watches `lastAction` for new actions and plays animation phases via CSS classes.
 * Returns `getUnitAnimState(unitId)` for each UnitTile to merge into its class list.
 */
export default function useAnimationQueue(lastAction) {
  const [animState, setAnimState] = useState({
    phase: 'idle',        // 'idle' | 'dash' | 'impact' | 'return'
    attackerId: null,
    targetId: null,
    targetIds: null,       // For AoE: array of all target IDs
    attackType: 'melee',
    isCrit: false,
    screenShake: false,
    droneFiring: null,     // Engineer unit ID when drone fires
  });

  const timerRef = useRef(null);
  const processedRef = useRef(null);

  // Cleanup timers
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Watch for new actions
  useEffect(() => {
    // Reset animation state when lastAction is cleared (new encounter)
    if (!lastAction) {
      if (timerRef.current) clearTimeout(timerRef.current);
      processedRef.current = null;
      setAnimState(prev => prev.phase !== 'idle' ? { ...prev, phase: 'idle', screenShake: false, droneFiring: null } : prev);
      return;
    }
    if (lastAction === processedRef.current) return;
    processedRef.current = lastAction;

    const attackType = classifyAttackType(lastAction);
    const timing = PHASE_TIMINGS[attackType] || PHASE_TIMINGS.melee;

    // Check for turret entries (drone firing)
    const hasTurret = lastAction.logEntries?.some(e => e.type === 'turret');
    const engineerId = hasTurret ? lastAction.attackerId : null;

    // Check for crits
    const isCrit = lastAction.logEntries?.some(e =>
      e.type === 'crit' || e.type === 'critkill'
    ) || false;

    // AoE: collect all enemy IDs as targets
    const targetIds = attackType === 'aoe' ? lastAction.allEnemyIds : null;

    // Phase 1: Dash
    setAnimState({
      phase: 'dash',
      attackerId: lastAction.attackerId,
      targetId: lastAction.targetId,
      targetIds,
      attackType,
      isCrit,
      screenShake: false,
      droneFiring: engineerId,
    });

    // Phase 2: Impact
    timerRef.current = setTimeout(() => {
      setAnimState(prev => ({
        ...prev,
        phase: 'impact',
        screenShake: isCrit,
      }));

      // Phase 3: Return (or idle if no return phase)
      timerRef.current = setTimeout(() => {
        if (timing.ret > 0) {
          setAnimState(prev => ({
            ...prev,
            phase: 'return',
            screenShake: false,
          }));
          timerRef.current = setTimeout(() => {
            setAnimState(prev => ({ ...prev, phase: 'idle', droneFiring: null }));
          }, timing.ret);
        } else {
          setAnimState(prev => ({ ...prev, phase: 'idle', screenShake: false, droneFiring: null }));
        }
      }, timing.impact);
    }, timing.dash);

  }, [lastAction]);

  /**
   * Returns animation CSS classes and inline styles for a specific unit.
   */
  const getUnitAnimState = useCallback((unitId, isAlly) => {
    const { phase, attackerId, targetId, targetIds, attackType, droneFiring } = animState;

    const result = { className: '', droneFiring: droneFiring === unitId };

    if (phase === 'idle') return result;

    const isAttacker = unitId === attackerId;
    const isTarget = unitId === targetId || (targetIds && targetIds.includes(unitId));

    if (isAttacker) {
      if (phase === 'dash') {
        if (attackType === 'melee') {
          // Dash toward the opposing side
          result.className = isAlly ? 'anim-dash-left' : 'anim-dash-right';
        } else if (attackType === 'ranged') {
          result.className = isAlly ? 'anim-recoil-left' : 'anim-recoil-right';
        } else {
          // Buff/heal/aoe: glow windup
          result.className = 'anim-windup';
        }
      } else if (phase === 'impact') {
        if (attackType === 'melee') {
          result.className = isAlly ? 'anim-dash-left' : 'anim-dash-right';
        }
      } else if (phase === 'return') {
        // Return to original position (no class = transition back)
        result.className = '';
      }
    }

    if (isTarget) {
      if (phase === 'impact') {
        if (attackType === 'aoe') {
          result.className = 'anim-aoe-impact';
        } else if (attackType === 'heal') {
          result.className = 'anim-heal-glow';
        } else if (attackType === 'buff') {
          result.className = 'anim-buff-pulse';
        } else if (attackType === 'debuff') {
          result.className = 'anim-debuff-pulse';
        } else {
          // Melee/ranged: shake
          result.className = 'anim-impact-shake';
        }
      }
    }

    return result;
  }, [animState]);

  return {
    getUnitAnimState,
    screenShake: animState.screenShake,
    animPhase: animState.phase,
  };
}
