import { getEffectiveStats } from '../../engine/operatives';

export default function PartyStatusPanel({ squad, currentTurnId }) {
  return (
    <div className="party-status-panel">
      {squad.map(op => {
        const stats = getEffectiveStats(op);
        const hpPct = Math.max(0, (op.currentHp / stats.hp) * 100);
        const shieldPct = stats.shield > 0 ? Math.max(0, (op.currentShield / stats.shield) * 100) : 0;
        const hpColor = hpPct > 50 ? "var(--success)" : hpPct > 25 ? "var(--warning)" : "var(--danger)";
        const isCurrent = op.id === currentTurnId;

        return (
          <div key={op.id} className={`party-status-row${!op.alive ? " party-status-dead" : ""}${isCurrent ? " party-status-active" : ""}`}>
            <span className="party-status-icon">{op.icon}</span>
            <span className="party-status-name">{op.name.split(" ")[0]}</span>
            {op.defending && <span className="party-status-def">DEF</span>}
            <div className="party-status-bars">
              <div className="party-status-hp-bar">
                <div className="bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
              </div>
              {stats.shield > 0 && (
                <div className="party-status-shield-bar">
                  <div className="bar-fill" style={{ width: `${shieldPct}%` }} />
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
