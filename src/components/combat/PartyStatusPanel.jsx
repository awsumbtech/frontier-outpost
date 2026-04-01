import { getEffectiveStats } from '../../engine/operatives';
import { CLASS_RESOURCE_NAMES, CLASS_RESOURCE_COLORS, CLASS_BASE_RESOURCE, STATUS_EFFECTS } from '../../data/constants';

function EffectIconRow({ effects }) {
  if (!effects || effects.length === 0) return null;
  return (
    <div className="effect-icons">
      {effects.map((effect, i) => {
        const def = STATUS_EFFECTS[effect.id];
        const icon = def ? def.icon : (effect.type === 'buff' ? '▲' : '▼');
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
            {icon}<span className="effect-duration">{rounds}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function PartyStatusPanel({ squad, currentTurnId }) {
  return (
    <div className="party-status-panel">
      {squad.map(op => {
        const stats = getEffectiveStats(op);
        const hpPct = Math.max(0, (op.currentHp / stats.hp) * 100);
        const shieldPct = stats.shield > 0 ? Math.max(0, (op.currentShield / stats.shield) * 100) : 0;
        const hpColor = hpPct > 50 ? "var(--success)" : hpPct > 25 ? "var(--warning)" : "var(--danger)";
        const isCurrent = op.id === currentTurnId;
        const maxResource = CLASS_BASE_RESOURCE[op.classKey] || 0;
        const resourcePct = maxResource > 0 ? Math.max(0, ((op.currentResource || 0) / maxResource) * 100) : 0;
        const resourceColor = CLASS_RESOURCE_COLORS[op.classKey] || "#a78bfa";
        const resourceName = CLASS_RESOURCE_NAMES[op.classKey] || "MP";
        const activeEffects = op.activeEffects || [];

        return (
          <div key={op.id} className={`party-status-row${!op.alive ? " party-status-dead" : ""}${isCurrent ? " party-status-active" : ""}`}>
            <span className="party-status-icon">{op.icon}</span>
            <span className="party-status-name">{op.name.split(" ")[0]}</span>
            {op.defending && <span className="party-status-def">DEF</span>}
            <EffectIconRow effects={activeEffects} />
            <div className="party-status-bars">
              <div className="party-status-hp-bar">
                <div className="bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
              </div>
              {stats.shield > 0 && (
                <div className="party-status-shield-bar">
                  <div className="bar-fill" style={{ width: `${shieldPct}%` }} />
                </div>
              )}
              {maxResource > 0 && (
                <div className="party-status-resource-bar" title={`${resourceName}: ${op.currentResource || 0}/${maxResource}`}>
                  <div className="bar-fill" style={{ width: `${resourcePct}%`, background: resourceColor }} />
                </div>
              )}
            </div>
            <span className="party-status-hp-text">
              {op.alive ? `${op.currentHp}/${stats.hp}` : "DOWN"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
