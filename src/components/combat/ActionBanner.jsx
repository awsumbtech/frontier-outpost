export default function ActionBanner({ animation }) {
  if (!animation || animation.index === 0) return null;

  const snapshot = animation.queue[animation.index - 1];
  if (!snapshot || !snapshot.logEntries || snapshot.logEntries.length === 0) return null;

  // Show all log entries for this action (attack + turret + double + AoE etc.)
  const primary = snapshot.logEntries[0];
  const bannerType = primary.type || "info";

  return (
    <div key={animation.index} className={`action-banner banner-${bannerType}`}>
      {snapshot.logEntries.map((entry, i) => (
        <div key={i} className={i === 0 ? "banner-primary" : "banner-secondary"}>
          {entry.text}
        </div>
      ))}
    </div>
  );
}
