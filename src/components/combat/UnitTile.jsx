import { useState, useRef, useEffect } from 'react';
import { STATUS_EFFECTS } from '../../data/constants';
import SpriteIcon from '../../sprites/SpriteIcon';
import { enemySpriteKey } from '../../sprites/index';


export default function UnitTile({ unit, isAlly, highlight, stats, isCurrentTurn, defending, selectable, onClick, animState }) {
  const [flashing, setFlashing] = useState(false);
  const hp = isAlly ? unit.currentHp : unit.hp;
  const maxHp = isAlly ? stats.hp : unit.maxHp;
  const prevHp = useRef(hp);

  useEffect(() => {
    if (hp < prevHp.current) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 400);
      prevHp.current = hp;
      return () => clearTimeout(t);
    }
    prevHp.current = hp;
  }, [hp]);

  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 50 ? "var(--success)" : hpPct > 25 ? "var(--warning)" : "var(--danger)";
  const shieldMax = isAlly ? stats.shield : 0;
  const shieldPct = shieldMax > 0 ? Math.max(0, (unit.currentShield / shieldMax) * 100) : 0;

  const name = isAlly ? unit.name.split(" ")[0] : unit.name;
  const unitColor = isAlly ? unit.color : undefined;

  const cls = [
    "unit-tile",
    isAlly ? "unit-ally" : "unit-enemy",
    !unit.alive && "unit-dead",
    highlight && "unit-highlight",
    flashing && "unit-damage-flash",
    isCurrentTurn && "unit-current-turn",
    isCurrentTurn && "unit-step-forward",
    defending && "unit-defending",
    selectable && "unit-selectable",
    animState?.className,
  ].filter(Boolean).join(" ");

  return (
    <div
      className={cls}
      style={unitColor ? { '--unit-color': unitColor } : undefined}
      onClick={selectable && onClick ? onClick : undefined}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      {isAlly && <span className="unit-tile-level">L{unit.level}</span>}
      <div className="unit-tile-icon">
        <SpriteIcon
          spriteId={isAlly ? unit.spriteId : enemySpriteKey(unit.name)}
          size={28}
          state={!unit.alive ? 'dead' : flashing ? 'damage' : defending ? 'defending' : unit.stunned ? 'stunned' : 'idle'}
          color={unitColor}
        />
      </div>
      <div className="unit-tile-name">{name}</div>
      <div className="unit-tile-hp-bar">
        <div className="bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
      </div>
      {shieldMax > 0 && (
        <div className="unit-tile-shield-bar">
          <div className="bar-fill" style={{ width: `${shieldPct}%` }} />
        </div>
      )}
      {unit.activeEffects?.length > 0 && (
        <div className="effect-icons">
          {unit.activeEffects.map((effect, i) => {
            const def = STATUS_EFFECTS[effect.id];
            const name = def ? def.name : effect.id;
            const desc = def ? def.desc : '';
            const rounds = effect.remainingRounds ?? effect.duration ?? '?';
            const isBuff = effect.type === 'buff';
            const tooltipText = `${name}${desc ? ': ' + desc : ''} (${rounds} round${rounds !== 1 ? 's' : ''} left)`;
            return (
              <span
                key={`${effect.id}-${i}`}
                className={`effect-icon ${isBuff ? 'effect-icon-buff' : 'effect-icon-debuff'}`}
                title={tooltipText}
              >
                <SpriteIcon spriteId={def?.spriteId || effect.id} size={12} /><span className="effect-duration">{rounds}</span>
              </span>
            );
          })}
        </div>
      )}
      {isAlly && unit.activeEffects?.some(e => e.stat === 'turretActive') && (
        <div className={`drone-companion${animState?.droneFiring ? ' drone-firing' : ''}`} />
      )}
      {unit.stunned && <div className="unit-tile-status">STUN</div>}
      {defending && <div className="unit-tile-status unit-tile-defend-status">DEF</div>}
      {!unit.alive && <div className="unit-tile-dead-overlay">✕</div>}
    </div>
  );
}
