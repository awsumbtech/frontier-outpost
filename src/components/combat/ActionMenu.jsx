export default function ActionMenu({ operative, turnState, stims, onAttack, onDefend, onItem }) {
  if (!operative || !turnState || turnState.subPhase !== "awaitingAction") return null;

  const hasStims = stims && stims.length > 0;

  return (
    <div className="action-menu">
      <div className="action-menu-header">
        <span className="action-menu-icon">{operative.icon}</span>
        <span className="action-menu-name">{operative.name.split(" ")[0]}'s Turn</span>
      </div>
      <div className="action-menu-buttons">
        <button className="action-btn action-btn-attack" onClick={onAttack}>
          <span className="action-btn-icon">⚔</span>
          <span className="action-btn-label">Attack</span>
        </button>
        <button className="action-btn action-btn-defend" onClick={onDefend}>
          <span className="action-btn-icon">🛡</span>
          <span className="action-btn-label">Defend</span>
        </button>
        <button className="action-btn action-btn-item" onClick={onItem} disabled={!hasStims}>
          <span className="action-btn-icon">💊</span>
          <span className="action-btn-label">Item{hasStims ? ` (${stims.length})` : ''}</span>
        </button>
      </div>
    </div>
  );
}
