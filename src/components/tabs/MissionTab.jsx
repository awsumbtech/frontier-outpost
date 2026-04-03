import { useState, useEffect } from 'react';
import { MISSIONS } from '../../data/missions';
import { STORY_CHAPTERS } from '../../data/story';
import { ENEMY_TEMPLATES } from '../../data/enemies';
import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';
import BattleScene from '../combat/BattleScene';
import PhaserGame from '../../phaser/PhaserGame';

export default function MissionTab({
  game, mission, combatLog, decision, missionResult, logRef, turnState,
  banter, storyReactions,
  mapData, playerPos, eventBridge,
  startMission, advanceMission, handleDecision, resetMission, advanceDebrief,
  selectAttack, selectDefend, selectItem, chooseStim, chooseTarget, cancelSelection,
  selectAbility, chooseAbility, chooseAllyTarget,
}) {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [encounterInfo, setEncounterInfo] = useState(null);

  // Listen for step updates from Phaser to show live encounter info
  useEffect(() => {
    if (!eventBridge) return;
    function onStep(data) {
      setEncounterInfo(data.encounterState);
    }
    function onReady(data) {
      setEncounterInfo(data.encounterState);
    }
    eventBridge.on("map:step", onStep);
    eventBridge.on("map:ready", onReady);
    return () => {
      eventBridge.off("map:step", onStep);
      eventBridge.off("map:ready", onReady);
    };
  }, [eventBridge]);

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

    // Default to first unlocked chapter if none selected
    const activeChapter = selectedChapter || [...unlockedChapters].pop() || "ch1";
    const activeCh = STORY_CHAPTERS.find(c => c.id === activeChapter);
    const activeChMissions = MISSIONS.filter(m => m.chapter === activeChapter);
    const isActiveUnlocked = unlockedChapters.has(activeChapter);

    return (<div>
      <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:8}}>Avg Level {avg} · {game.missionsCompleted} completed</div>

      <div className="chapter-tabs">
        {chapterOrder.map((chId, ci) => {
          const ch = STORY_CHAPTERS.find(c => c.id === chId);
          if (!ch) return null;
          const chMissions = MISSIONS.filter(m => m.chapter === chId);
          const isUnlocked = unlockedChapters.has(chId);
          const allDone = chMissions.every(m => completed[m.id]);
          const doneCount = chMissions.filter(m => completed[m.id]).length;
          const isActive = chId === activeChapter;

          return (<button key={chId}
            className={`chapter-tab${isActive?" active":""}${allDone?" chapter-done":""}${!isUnlocked?" chapter-locked":""}`}
            onClick={() => isUnlocked && setSelectedChapter(chId)}
            disabled={!isUnlocked}>
            {allDone && <span>✓</span>}
            {!isUnlocked && <span>🔒</span>}
            <span>Ch.{ci+1}</span>
            <span className="ch-progress">{doneCount}/{chMissions.length}</span>
          </button>);
        })}
      </div>

      {isActiveUnlocked ? (
        <div className="mission-grid">
          {activeChMissions.map((mt, mi) => {
            const isDone = !!completed[mt.id];
            const timesCleared = completed[mt.id] || 0;
            const prevDone = mi === 0 || !!completed[activeChMissions[mi - 1].id];
            const isAvailable = isDone || prevDone;
            const levelDiff = avg - mt.recLevel;
            const diffColor = levelDiff >= 2 ? "var(--success)" : levelDiff >= 0 ? "var(--accent)" : levelDiff >= -2 ? "var(--warning)" : "var(--danger)";
            const diffLabel = levelDiff >= 2 ? "Easy" : levelDiff >= 0 ? "Fair" : levelDiff >= -2 ? "Hard" : "Brutal";

            return (<div className={`mission-card${!isAvailable?" mission-locked":""}`} key={mt.id} onClick={()=>isAvailable&&startMission(mt)}
              style={{borderLeftWidth:3,borderLeftStyle:"solid",borderLeftColor:isDone?"var(--success)":isAvailable?"var(--border2)":"var(--border)",opacity:isAvailable?1:0.4,cursor:isAvailable?"pointer":"default"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {isDone && <span style={{color:"var(--success)",fontSize:13,fontWeight:700}}>✓</span>}
                {!isDone && !isAvailable && <span style={{color:"var(--text2)",fontSize:12}}>🔒</span>}
                <h4 style={{flex:1,fontSize:"var(--font-sm)"}}>{mt.name}</h4>
                {isAvailable && <span style={{fontSize:"var(--font-xxs)",fontFamily:"'Share Tech Mono',monospace",color:diffColor,background:diffColor+"15",padding:"2px 6px",borderRadius:3}}>{diffLabel}</span>}
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
        </div>
      ) : (
        <div style={{padding:"16px",border:"1px dashed var(--border)",borderRadius:6,fontSize:"var(--font-xs)",color:"var(--text2)",textAlign:"center",fontStyle:"italic"}}>
          Complete previous chapter missions to unlock
        </div>
      )}
    </div>);
  }

  const isExploring = mission.phase === "exploration";
  const isCombat = mission.phase === "combat";
  const showMap = isExploring || isCombat; // Keep Phaser alive during combat (hidden)

  return (<div className="mission-layout">
    {/* Exploration map — visible during exploration, hidden (but alive) during combat */}
    {showMap && mapData && (
      <div style={{ display: isExploring ? "block" : "none" }}>
        <PhaserGame
          mapData={mapData}
          eventBridge={eventBridge}
          active={isExploring}
          playerPos={playerPos}
        />
        {isExploring && (
          <div style={{ textAlign: "center", padding: "8px 0", fontSize: "var(--font-xs)", color: "var(--text2)", fontFamily: "'Share Tech Mono', monospace" }}>
            WASD / Arrow keys to move · Find the exit
          </div>
        )}
      </div>
    )}

    {/* Battle scene — only during active combat */}
    {isCombat && (
      <BattleScene
        squad={game.squad}
        enemies={mission.enemies}
        turnState={turnState}
        currentEncounter={mission.currentEncounter}
        totalEncounters={mission.totalEncounters}
        roundNum={mission.roundNum}
        combatLog={combatLog}
        logRef={logRef}
        missionTypeName={mission.type.name}
        environment={mission.environment}
        stims={game.stims}
        selectAttack={selectAttack}
        selectDefend={selectDefend}
        selectItem={selectItem}
        chooseStim={chooseStim}
        chooseTarget={chooseTarget}
        cancelSelection={cancelSelection}
        selectAbility={selectAbility}
        chooseAbility={chooseAbility}
        chooseAllyTarget={chooseAllyTarget}
      />
    )}
    <div className="sticky-bar">
      {decision&&mission.phase==="decision"&&(
        <div className="decision-panel">
          <h3>⟐ {decision.title}</h3><p>{decision.desc}</p>
          {decision.choices.map((c,i)=>(<button className="choice-btn" key={i} onClick={()=>handleDecision(c)}>{c.text}<div className="choice-desc">{c.desc}</div></button>))}
        </div>
      )}

      {banter&&mission.phase==="combat"&&!decision&&(
        <div className="banter-panel">
          {banter.lines.map((line, i) => (
            <div key={i} className="banter-line"><span className="banter-speaker">{line.speaker}:</span> {line.text}</div>
          ))}
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
            {storyReactions&&storyReactions.length>0&&(
              <div className="story-reactions">
                {storyReactions.map((r, i) => (
                  <div key={i} className="story-reaction"><span className="reaction-speaker">{r.opName}:</span> "{r.text}"</div>
                ))}
              </div>
            )}
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
        {mission.phase==="result"&&mission.debriefPhase==="stats"&&<button className="btn btn-primary" style={{flex:1}} onClick={advanceDebrief}>Continue</button>}
        {mission.phase==="result"&&mission.debriefPhase==="comms"&&(()=>{
          const beats = missionResult?.newBeats||[];
          const isLast = (mission.commsIndex||0) >= beats.length-1;
          return <button className="btn btn-primary" style={{flex:1}} onClick={advanceDebrief}>{isLast?"Return to Base":"Next ▸"}</button>;
        })()}
        {mission.phase==="briefing"&&<button className="btn btn-danger" onClick={resetMission}>Abort</button>}
      </div>
    </div>
  </div>);
}
