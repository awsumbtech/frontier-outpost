import { MISSIONS } from '../../data/missions';
import { STORY_CHAPTERS } from '../../data/story';
import { ENEMY_TEMPLATES } from '../../data/enemies';
import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';
import BattleScene from '../combat/BattleScene';

export default function MissionTab({ game, mission, combatLog, decision, missionResult, logRef, animation, advanceAnimation, skipAnimation, startMission, advanceMission, handleDecision, resetMission, advanceDebrief }) {
  if (!mission) {
    const avg = game.squad.length>0?Math.round(game.squad.reduce((s,o)=>s+o.level,0)/game.squad.length):1;
    const completed = game.completedMissions || {};
    const chapterOrder = ["ch1","ch2","ch3","ch4","ch5"];
    const unlockedChapters = new Set(["ch1"]);
    for (let i = 1; i < chapterOrder.length; i++) {
      const prevChMissions = MISSIONS.filter(m => m.chapter === chapterOrder[i-1]);
      const allPrevDone = prevChMissions.every(m => completed[m.id]);
      if (allPrevDone) unlockedChapters.add(chapterOrder[i]);
      else break;
    }

    return (<div>
      <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:8}}>Avg Level {avg} · {game.missionsCompleted} completed</div>
      {chapterOrder.map(chId => {
        const ch = STORY_CHAPTERS.find(c => c.id === chId);
        if (!ch) return null;
        const chMissions = MISSIONS.filter(m => m.chapter === chId);
        const isUnlocked = unlockedChapters.has(chId);
        const allDone = chMissions.every(m => completed[m.id]);
        const doneCount = chMissions.filter(m => completed[m.id]).length;

        return (<div key={chId} style={{marginBottom:12}}>
          <div style={{
            display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
            background: isUnlocked ? (allDone ? "rgba(46,213,115,0.08)" : "rgba(0,212,255,0.06)") : "rgba(0,0,0,0.2)",
            border: `1px solid ${allDone ? "rgba(46,213,115,0.3)" : isUnlocked ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
            borderRadius:8,marginBottom:6,
            opacity: isUnlocked ? 1 : 0.45,minHeight:40
          }}>
            {allDone && <span style={{color:"var(--success)",fontSize:14}}>✓</span>}
            {!allDone && isUnlocked && <span style={{color:"var(--accent)",fontSize:12}}>▸</span>}
            {!isUnlocked && <span style={{color:"var(--text2)",fontSize:12}}>🔒</span>}
            <span style={{fontWeight:700,fontSize:"var(--font-sm)",color:allDone?"var(--success)":isUnlocked?"var(--accent)":"var(--text2)",flex:1}}>{ch.title}</span>
            <span style={{fontSize:"var(--font-xxs)",fontFamily:"'Share Tech Mono',monospace",color:"var(--text2)"}}>{doneCount}/{chMissions.length}</span>
          </div>

          {isUnlocked && chMissions.map(mt => {
            const isDone = !!completed[mt.id];
            const timesCleared = completed[mt.id] || 0;
            const levelDiff = avg - mt.recLevel;
            const diffColor = levelDiff >= 2 ? "var(--success)" : levelDiff >= 0 ? "var(--accent)" : levelDiff >= -2 ? "var(--warning)" : "var(--danger)";
            const diffLabel = levelDiff >= 2 ? "Easy" : levelDiff >= 0 ? "Fair" : levelDiff >= -2 ? "Hard" : "Brutal";

            return (<div className="mission-card" key={mt.id} onClick={()=>startMission(mt)}
              style={{borderLeftWidth:3,borderLeftStyle:"solid",borderLeftColor:isDone?"var(--success)":"var(--border2)",marginLeft:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {isDone && <span style={{color:"var(--success)",fontSize:13,fontWeight:700}}>✓</span>}
                <h4 style={{flex:1,fontSize:"var(--font-sm)"}}>{mt.name}</h4>
                <span style={{fontSize:"var(--font-xxs)",fontFamily:"'Share Tech Mono',monospace",color:diffColor,background:diffColor+"15",padding:"2px 6px",borderRadius:3}}>{diffLabel}</span>
              </div>
              <div className="mission-desc">{mt.desc}</div>
              <div className="mission-meta">
                <span>T{mt.tier}</span>
                <span>{mt.encounters}enc</span>
                <span>{mt.xpMult}xXP</span>
                <span>Rec L{mt.recLevel}</span>
                {timesCleared > 0 && <span style={{color:"var(--text2)"}}>x{timesCleared}</span>}
              </div>
            </div>);
          })}

          {!isUnlocked && (<div style={{marginLeft:8,padding:"8px 10px",border:"1px dashed var(--border)",borderRadius:6,fontSize:"var(--font-xs)",color:"var(--text2)",fontStyle:"italic"}}>
            Complete all {chapterOrder[chapterOrder.indexOf(chId)-1] && STORY_CHAPTERS.find(c=>c.id===chapterOrder[chapterOrder.indexOf(chId)-1])?.title} missions to unlock
          </div>)}
        </div>);
      })}
    </div>);
  }

  return (<div className="mission-layout">
    <BattleScene
      squad={game.squad}
      enemies={mission.enemies}
      animation={animation}
      currentEncounter={mission.currentEncounter}
      totalEncounters={mission.totalEncounters}
      roundNum={mission.roundNum}
      combatLog={combatLog}
      logRef={logRef}
      missionTypeName={mission.type.name}
      environment={mission.environment}
    />
    <div className="sticky-bar">
      {decision&&mission.phase==="decision"&&(
        <div className="decision-panel">
          <h3>⟐ {decision.title}</h3><p>{decision.desc}</p>
          {decision.choices.map((c,i)=>(<button className="choice-btn" key={i} onClick={()=>handleDecision(c)}>{c.text}<div className="choice-desc">{c.desc}</div></button>))}
        </div>
      )}

      {mission.phase==="result"&&mission.debriefPhase==="stats"&&(
        <div className="debrief-panel">
          <div className={`debrief-header ${missionResult?.success?"debrief-success":"debrief-failure"}`}>
            {missionResult?.success?"MISSION COMPLETE":"MISSION FAILED"}
          </div>
          <div className="debrief-stats">
            <div className="debrief-stat"><span className="debrief-stat-val">{missionResult?.combatStats?.totalRounds||0}</span><span className="debrief-stat-label">Rounds</span></div>
            <div className="debrief-stat"><span className="debrief-stat-val">{missionResult?.combatStats?.enemiesKilled||0}</span><span className="debrief-stat-label">Kills</span></div>
            <div className="debrief-stat"><span className="debrief-stat-val">{missionResult?.combatStats?.operativesDowned||0}</span><span className="debrief-stat-label">Downed</span></div>
          </div>
          {missionResult?.success?(
            <div className="debrief-rewards">
              <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:8}}>
                <span style={{color:"var(--warning)",fontFamily:"'Share Tech Mono',monospace"}}>+{missionResult.xp} XP</span>
                <span style={{color:"var(--accent)",fontFamily:"'Share Tech Mono',monospace"}}>+{missionResult.credits}¢</span>
              </div>
              {missionResult.loot?.length>0&&(
                <div className="debrief-loot">
                  {missionResult.loot.map((item,i)=>(
                    <div key={i} className="debrief-loot-item">
                      <span style={{color:RARITY_COLORS[item.rarity],fontSize:"var(--font-xs)"}}>{RARITY_NAMES[item.rarity][0]}</span>
                      <span style={{color:RARITY_COLORS[item.rarity],flex:1}}>{item.name}</span>
                      <span style={{color:"var(--text2)",fontSize:"var(--font-xxs)",textTransform:"capitalize"}}>{item.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ):(
            <div style={{textAlign:"center",color:"var(--text2)",fontSize:"var(--font-sm)",padding:"8px 0"}}>No rewards earned</div>
          )}
        </div>
      )}

      {mission.phase==="result"&&mission.debriefPhase==="comms"&&(()=>{
        const beats = missionResult?.newBeats||[];
        const idx = mission.commsIndex||0;
        const beat = beats[idx];
        if (!beat) return null;
        return (
          <div className="transmission-panel">
            <div className="transmission-header">INCOMING TRANSMISSION</div>
            <div className="transmission-sender">{beat.sender}</div>
            <div className="transmission-text">{beat.text}</div>
            {beats.length>1&&<div className="transmission-progress">{idx+1} of {beats.length}</div>}
          </div>
        );
      })()}

      <div style={{display:"flex",gap:5}}>
        {mission.phase==="briefing"&&mission.environment&&(
          <div className="env-briefing">
            <div className="env-briefing-header">
              <span className="env-briefing-location">Location</span>
            </div>
            <div className="env-briefing-name">{mission.environment.name}</div>
            <div className="env-briefing-desc">{mission.environment.description}</div>
            {(() => {
              const tierEnemies = ENEMY_TEMPLATES.filter(e => e.tier === mission.type.tier && e.lore);
              if (tierEnemies.length === 0) return null;
              return (
                <div className="threat-intel">
                  <div className="threat-intel-title">Threat Intel</div>
                  {tierEnemies.map(e => (
                    <div className="threat-intel-entry" key={e.name}>
                      <div className="threat-intel-name">{e.name}</div>
                      <div className="threat-intel-lore">{e.lore}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        {mission.phase==="briefing"&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceMission}>Begin Mission</button>}
        {mission.phase==="combat"&&!decision&&!animation&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceMission}>Next Round ▸</button>}
        {animation&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceAnimation}>Next ▸</button>}
        {animation&&<button className="btn" onClick={skipAnimation}>Skip ▸▸</button>}
        {mission.phase==="result"&&mission.debriefPhase==="stats"&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceDebrief}>Continue</button>}
        {mission.phase==="result"&&mission.debriefPhase==="comms"&&(()=>{
          const beats = missionResult?.newBeats||[];
          const isLast = (mission.commsIndex||0) >= beats.length-1;
          return <button className="btn btn-primary" style={{flex:1}} onClick={advanceDebrief}>{isLast?"Return to Base":"Next ▸"}</button>;
        })()}
        {mission.phase!=="result"&&<button className="btn btn-danger" onClick={resetMission}>Abort</button>}
      </div>
    </div>
  </div>);
}
