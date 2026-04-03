import { narrativeWrap } from '../../engine/narrativeFlavor';

// Map entry types to CSS classes. Covers engine-generated types and legacy types.
const LOG_TYPE_CLASS = {
  ability: 'log-ability',
  dot: 'log-dot',
  expired: 'log-expired',
};

export default function CompactLog({ combatLog, logRef }) {
  return (
    <div className="compact-log" ref={logRef}>
      {combatLog.map((entry, i) => {
        if (typeof entry === "string") return <div key={i} className="log-line log-info">{entry || "\u00A0"}</div>;
        const wrapped = narrativeWrap(entry);
        const typeClass = LOG_TYPE_CLASS[entry.type] || `log-${entry.type}`;
        return (
          <div key={i} className={`log-line ${typeClass}`}>
            {wrapped.flavor && <span className="log-flavor">{wrapped.flavor} </span>}
            {entry.text}
          </div>
        );
      })}
    </div>
  );
}
