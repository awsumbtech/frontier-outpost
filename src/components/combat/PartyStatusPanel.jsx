import { getEffectiveStats } from '../../engine/operatives';
import { CLASS_RESOURCE_NAMES, CLASS_RESOURCE_COLORS, CLASS_BASE_RESOURCE } from '../../data/constants';

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
        const buffs = (op.activeEffects || []).filter(e => e.type === "buff");
        const debuffs = (op.activeEffects || []).filter(e => e.type === "debuff");

        return (
          <div key={op.id} className={`party-status-row${!op.alive ? " party-status-dead" : ""}${isCurrent ? " party-status-active" : ""}`}>
            <span className="party-status-icon">{op.icon}</span>
            <span className="party-status-name">{op.name.split(" ")[0]}</span>
            {op.defending && <span className="party-status-def">DEF</span>}
            {buffs.length > 0 && <span className="party-status-buff" title={buffs.map(b => b.id).join(', ')}>▲{buffs.length}</span>}
            {debuffs.length > 0 && <span className="party-status-debuff" title={debuffs.map(d => d.id).join(', ')}>▼{debuffs.length}</span>}
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
