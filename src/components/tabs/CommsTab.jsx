import { STORY_CHAPTERS } from '../../data/story';

export default function CommsTab({ game, updateGame }) {
  const mc = game.missionsCompleted;
  const unlockedChapters = STORY_CHAPTERS.filter(ch => mc >= ch.unlockAt);

  const unreadKeys = [];
  for (const ch of unlockedChapters) {
    for (const beat of ch.beats) {
      if (mc >= beat.at && !game.storyBeatsRead[`${ch.id}-${beat.at}`]) {
        unreadKeys.push(`${ch.id}-${beat.at}`);
      }
    }
  }
  if (unreadKeys.length > 0) {
    setTimeout(() => {
      updateGame(g => {
        const newRead = { ...g.storyBeatsRead };
        for (const k of unreadKeys) newRead[k] = true;
        return { ...g, storyBeatsRead: newRead };
      });
    }, 500);
  }

  if (unlockedChapters.length === 0) {
    return (<div className="empty-state">
      <div className="big-icon">📡</div>
      <div>No transmissions yet</div>
      <div style={{fontSize:10,marginTop:2}}>Complete your first mission</div>
    </div>);
  }

  const totalChapters = STORY_CHAPTERS.length;

  return (<div className="comms-tab">
    {STORY_CHAPTERS.map((ch, ci) => {
      const isUnlocked = mc >= ch.unlockAt;
      const isComplete = ci < unlockedChapters.length - 1 && isUnlocked;
      const isCurrent = ci === unlockedChapters.length - 1 && isUnlocked;
      const isLocked = !isUnlocked;

      const status = isComplete ? "CLEARED" : isCurrent ? "ACTIVE" : "CLASSIFIED";
      const statusColor = isComplete ? "var(--success)" : isCurrent ? "var(--accent)" : "var(--text2)";

      return (<div key={ch.id} className={`comms-doc${isLocked ? " comms-locked" : ""}`} style={{'--doc-color': statusColor}}>
        <div className="comms-doc-header">
          <span className="comms-ch-label">CH.{ci + 1} — {ch.title.toUpperCase()}</span>
          <span className="comms-status-stamp">{status}</span>
        </div>

        {isLocked ? (
          <div className="comms-classified">COMPLETE CHAPTER {ci} TO UNLOCK</div>
        ) : (
          <>
            <div className="comms-intro">{ch.intro}</div>
            <div className="comms-timeline">
              {ch.beats.filter(b => mc >= b.at).map((beat, bi) => {
                const key = `${ch.id}-${beat.at}`;
                const isNew = !game.storyBeatsRead[key];
                return (<div key={bi} className={`comms-beat${isNew ? " comms-beat-new" : ""}`}>
                  <div className="comms-beat-header">
                    <span className="comms-sender">{beat.sender}</span>
                    {isNew && <span className="comms-new-badge">NEW</span>}
                    <span className="comms-mission-tag">M{beat.at}</span>
                  </div>
                  <div className="comms-beat-text">{beat.text}</div>
                </div>);
              })}
            </div>
          </>
        )}
      </div>);
    })}

    {mc < 19 && (<div className="comms-hint">
      {(() => {
        const nextBeat = STORY_CHAPTERS.flatMap(ch => ch.beats).find(b => b.at > mc);
        const nextChapter = STORY_CHAPTERS.find(ch => ch.unlockAt > mc);
        if (nextChapter && (!nextBeat || nextChapter.unlockAt <= nextBeat.at)) return `Next chapter unlocks at mission ${nextChapter.unlockAt}`;
        if (nextBeat) return `Next transmission at mission ${nextBeat.at}`;
        return "Story complete";
      })()}
    </div>)}

    {(game.memorial||[]).length>0&&(
      <div className="memorial-section">
        <div className="memorial-header">IN MEMORIAM</div>
        {game.memorial.map((m, i) => (
          <div key={i} className="memorial-entry">
            <span className="memorial-icon">{m.icon||'◆'}</span>
            <span className="memorial-name">{m.name}</span>
            {(m.traits||[]).length>0&&<span className="memorial-traits">{m.traits.join(' · ')}</span>}
          </div>
        ))}
      </div>
    )}
  </div>);
}
