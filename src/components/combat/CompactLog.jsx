export default function CompactLog({ combatLog, logRef }) {
  return (
    <div className="compact-log" ref={logRef}>
      {combatLog.map((entry, i) => {
        if (typeof entry === "string") return <div key={i} className="log-line log-info">{entry || "\u00A0"}</div>;
        return <div key={i} className={`log-line log-${entry.type}`}>{entry.text}</div>;
      })}
    </div>
  );
}
