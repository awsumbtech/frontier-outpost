import { useState } from 'react';
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

  const [selectedCommsChapter, setSelectedCommsChapter] = useState(null);

  // Default to most recent unlocked chapter
  const activeCommsId = selectedCommsChapter || (unlockedChapters.length > 0 ? unlockedChapters[unlockedChapters.length - 1].id : null);
  const activeCommsCh = STORY_CHAPTERS.find(c => c.id === activeCommsId);
  const activeCommsIdx = STORY_CHAPTERS.findIndex(c => c.id === activeCommsId);
  const isActiveUnlocked = activeCommsCh ? mc >= activeCommsCh.unlockAt : false;
  const isActiveComplete = activeCommsIdx < unlockedChapters.length - 1 && isActiveUnlocked;
  const isActiveCurrent = activeCommsIdx === unlockedChapters.length - 1 && isActiveUnlocked;
  const activeStatusColor = isActiveComplete ? "var(--success)" : isActiveCurrent ? "var(--accent)" : "var(--text2)";

  return (<div className="comms-tab">
    <div className="split-panel-sidebar">
      <div className="comms-sidebar">
        {STORY_CHAPTERS.map((ch, ci) => {
          const isUnlocked = mc >= ch.unlockAt;
          const isComplete = ci < unlockedChapters.length - 1 && isUnlocked;
          const isCurrent = ci === unlockedChapters.length - 1 && isUnlocked;
          const isLocked = !isUnlocked;
          const isActive = ch.id === activeCommsId;
          const beatCount = isUnlocked ? ch.beats.filter(b => mc >= b.at).length : 0;
          const hasNew = isUnlocked && ch.beats.some(b => mc >= b.at && !game.storyBeatsRead[`${ch.id}-${b.at}`]);

          return (<div key={ch.id}
            className={`comms-sidebar-item${isActive?" comms-sidebar-active":""}${isComplete?" comms-sidebar-done":""}${isLocked?" comms-sidebar-locked":""}`}
            onClick={() => isUnlocked && setSelectedCommsChapter(ch.id)}>
            <span className="comms-sidebar-ch">CH.{ci+1}</span>
            <span className="comms-sidebar-title">{ch.title}</span>
            {hasNew && <span className="comms-new-badge">NEW</span>}
            {isUnlocked && <span className="comms-sidebar-status" style={{color:isComplete?"var(--success)":"var(--accent)",border:`1px solid ${isComplete?"var(--success)":"var(--accent)"}`,background:isComplete?"rgba(46,213,115,0.1)":"rgba(0,212,255,0.1)"}}>{isComplete?"DONE":"ACTIVE"}</span>}
            {isLocked && <span className="comms-sidebar-status" style={{color:"var(--text2)",border:"1px solid var(--border)"}}>🔒</span>}
          </div>);
        })}

        {(game.memorial||[]).length>0&&(
          <div className="memorial-section" style={{marginTop:8}}>
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

        {mc < 19 && (<div className="comms-hint" style={{marginTop:8}}>
          {(() => {
            const nextBeat = STORY_CHAPTERS.flatMap(ch => ch.beats).find(b => b.at > mc);
            const nextChapter = STORY_CHAPTERS.find(ch => ch.unlockAt > mc);
            if (nextChapter && (!nextBeat || nextChapter.unlockAt <= nextBeat.at)) return `Next chapter unlocks at mission ${nextChapter.unlockAt}`;
            if (nextBeat) return `Next transmission at mission ${nextBeat.at}`;
            return "Story complete";
          })()}
        </div>)}
      </div>

      <div className="comms-content">
        {activeCommsCh && isActiveUnlocked ? (
          <div className="comms-doc" style={{'--doc-color': activeStatusColor}}>
            <div className="comms-doc-header">
              <span className="comms-ch-label">CH.{activeCommsIdx + 1} — {activeCommsCh.title.toUpperCase()}</span>
              <span className="comms-status-stamp">{isActiveComplete?"CLEARED":isActiveCurrent?"ACTIVE":"CLASSIFIED"}</span>
            </div>
            <div className="comms-intro">{activeCommsCh.intro}</div>
            <div className="comms-timeline">
              {activeCommsCh.beats.filter(b => mc >= b.at).map((beat, bi) => {
                const key = `${activeCommsCh.id}-${beat.at}`;
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
          </div>
        ) : activeCommsCh ? (
          <div className="comms-doc comms-locked" style={{'--doc-color': 'var(--text2)'}}>
            <div className="comms-doc-header">
              <span className="comms-ch-label">CH.{activeCommsIdx + 1} — {activeCommsCh.title.toUpperCase()}</span>
              <span className="comms-status-stamp">CLASSIFIED</span>
            </div>
            <div className="comms-classified">COMPLETE CHAPTER {activeCommsIdx} TO UNLOCK</div>
          </div>
        ) : null}
      </div>
    </div>
  </div>);
}
