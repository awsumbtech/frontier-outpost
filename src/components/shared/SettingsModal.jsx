export default function SettingsModal({ settings, updateSettings, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>Settings</h3>
        <div style={{ fontSize: "var(--font-xs)", color: "var(--text2)", padding: "12px 0", textAlign: "center" }}>
          Turn-based combat — no settings to configure yet.
        </div>
        <button className="btn" style={{ width: "100%", marginTop: 16 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
