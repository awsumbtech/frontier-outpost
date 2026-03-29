import { STORY_CHAPTERS } from '../../data/story';

export default function CommsTab({ game, updateGame }) {
  const mc = game.missionsCompleted;
  const unlockedChapters = STORY_CHAPTERS.filter(ch => mc >= ch.unlockAt);
  const allBeats = [];

  for (const ch of unlockedChapters) {
    allBeats.push({ type: "chapter", chapter: ch });
    for (const beat of ch.beats) {
      if (mc >= beat.at) allBeats.push({ type: "beat", beat, chapterId: ch.id });
    }
  }

  const unreadKeys = allBeats.filter(b => b.type === "beat" && !game.storyBeatsRead[`${b.chapterId}-${b.beat.at}`]).map(b => `${b.chapterId}-${b.beat.at}`);
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

  return (<div>
    {unlockedChapters.map((ch, ci) => {
      const isLatest = ci === unlockedChapters.length - 1;
      return (<div key={ch.id} style={{marginBottom:12}}>
        <div style={{
          background: isLatest ? "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(192,132,252,0.05))" : "var(--bg2)",
          border: `1px solid ${isLatest ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
          borderRadius: 6, padding: 10, marginBottom: 6
        }}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{color:"var(--accent)",fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:1}}>CH.{ci+1}</span>
            <span style={{fontSize:13,fontWeight:700,color:isLatest?"var(--accent)":"var(--text)"}}>{ch.title}</span>
          </div>
          <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.4}}>{ch.intro}</div>
        </div>

        {ch.beats.filter(b => mc >= b.at).map((beat, bi) => {
          const key = `${ch.id}-${beat.at}`;
          const isNew = !game.storyBeatsRead[key];
          return (<div key={bi} style={{
            background: isNew ? "rgba(0,212,255,0.04)" : "var(--bg3)",
            border: `1px solid ${isNew ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
            borderRadius: 5, padding: 8, marginBottom: 4, marginLeft: 12,
            borderLeft: `2px solid ${isNew ? "var(--accent)" : "var(--border2)"}`
          }}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
              <span style={{fontSize:10,color:"var(--accent)",fontFamily:"'Share Tech Mono',monospace"}}>◈</span>
              <span style={{fontSize:11,fontWeight:600,color:isNew?"var(--accent)":"var(--text)"}}>{beat.sender}</span>
              {isNew && <span style={{fontSize:8,background:"rgba(0,212,255,0.15)",color:"var(--accent)",padding:"0 4px",borderRadius:2,fontFamily:"'Share Tech Mono',monospace"}}>NEW</span>}
              <span style={{fontSize:8,color:"var(--text2)",marginLeft:"auto",fontFamily:"'Share Tech Mono',monospace"}}>M{beat.at}</span>
            </div>
            <div style={{fontSize:11,color:"var(--text)",lineHeight:1.4}}>{beat.text}</div>
          </div>);
        })}
      </div>);
    })}

    {mc < 19 && (<div style={{
      textAlign:"center",padding:12,color:"var(--text2)",fontSize:10,
      border:"1px dashed var(--border)",borderRadius:5,marginTop:8
    }}>
      <span style={{fontFamily:"'Share Tech Mono',monospace"}}>
        {(() => {
          const nextBeat = STORY_CHAPTERS.flatMap(ch => ch.beats).find(b => b.at > mc);
          const nextChapter = STORY_CHAPTERS.find(ch => ch.unlockAt > mc);
          if (nextChapter && (!nextBeat || nextChapter.unlockAt <= nextBeat.at)) return `Next chapter unlocks at mission ${nextChapter.unlockAt}`;
          if (nextBeat) return `Next transmission at mission ${nextBeat.at}`;
          return "Story complete";
        })()}
      </span>
    </div>)}
  </div>);
}
