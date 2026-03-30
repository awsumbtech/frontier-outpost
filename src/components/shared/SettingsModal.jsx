export default function SettingsModal({ settings, updateSettings, onClose }) {
  const stepThrough = settings?.stepThroughCombat || false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>Settings</h3>
        <div className="settings-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>Step-Through Combat</div>
            <div style={{ fontSize: "var(--font-xxs)", color: "var(--text2)", marginTop: 2 }}>
              Reveal each action one at a time during combat
            </div>
          </div>
          <button
            className={`settings-toggle ${stepThrough ? "active" : ""}`}
            onClick={() => updateSettings({ stepThroughCombat: !stepThrough })}
          >
            {stepThrough ? "ON" : "OFF"}
          </button>
        </div>
        <button className="btn" style={{ width: "100%", marginTop: 16 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
