export default function NewGameConfirm({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Start New Game?</h3>
        <p style={{ color: "var(--text2)", fontSize: "var(--font-sm)", marginBottom: 12 }}>
          All progress will be lost. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>New Game</button>
        </div>
      </div>
    </div>
  );
}
