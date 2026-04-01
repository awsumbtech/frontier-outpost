import { useState, useEffect } from "react";
import { STORY_CHAPTERS } from "./data/story";
import useGameState from "./hooks/useGameState";
import useMission from "./hooks/useMission";
import SquadTab from "./components/tabs/SquadTab";
import MissionTab from "./components/tabs/MissionTab";
import InventoryTab from "./components/tabs/InventoryTab";
import CommsTab from "./components/tabs/CommsTab";
import RecruitTab from "./components/tabs/RecruitTab";
import GearModal from "./components/shared/GearModal";
import IntroScreen from "./components/shared/IntroScreen";
import NewGameConfirm from "./components/shared/NewGameConfirm";
import SettingsModal from "./components/shared/SettingsModal";

const TABS = ["Squad", "Mission", "Comms", "Inventory", "Recruit"];
const TAB_DISPLAY = { Squad: "COMMAND", Mission: "OPS", Comms: "COMMS", Inventory: "ARMORY", Recruit: "RECRUIT" };
const TAB_ICONS = { Squad: "⊞", Mission: "◎", Comms: "◇", Inventory: "⬡", Recruit: "＋" };

export default function App() {
  const [tab, setTab] = useState("Squad");

  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const gs = useGameState();
  const { game, updateGame, loadGame, setGame, newGame,
    showIntro, setShowIntro,
    selectedOp, setSelectedOp, gearModal, setGearModal,
    invFilter, setInvFilter, stimTarget, setStimTarget,
    equipGear, unequipGear, scrapGear, learnSkill,
    recruitOp, dismissOp, buyStim, useStim, updateSettings } = gs;

  const ms = useMission(game, setGame, updateGame, setTab);
  const { mission, combatLog, decision, missionResult, logRef,
    turnState,
    banter, storyReactions,
    startMission, advanceMission, handleDecision, resetMission, advanceDebrief,
    selectAttack, selectDefend, selectItem,
    chooseStim, chooseTarget, cancelSelection } = ms;

  useEffect(() => { loadGame(); }, [loadGame]);

  if (showIntro) {
    return <IntroScreen onBegin={() => setShowIntro(false)} />;
  }

  return (
    <div className="app">
      <div className="top-bar">
        <h1>Frontier Outpost</h1>
        <div className="status-group"><span className="meta">M:{game.missionsCompleted}/20</span><span className="credits">◈{game.credits}</span><button className="btn btn-sm top-bar-settings" onClick={()=>setShowSettings(true)}>⚙</button><button className="btn btn-sm top-bar-new-game" onClick={()=>setShowNewGameConfirm(true)}>New Game</button></div>
      </div>
      <div className="nav">{TABS.map(t=>{
        const unread=t==="Comms"?STORY_CHAPTERS.flatMap(ch=>ch.beats.filter(b=>game.missionsCompleted>=b.at&&!game.storyBeatsRead[`${ch.id}-${b.at}`])).length:0;
        return(<button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
          <span className="nav-icon">{TAB_ICONS[t]}</span><span className="nav-label">{TAB_DISPLAY[t]}{unread>0&&<span style={{background:"var(--danger)",color:"#fff",fontSize:8,padding:"0 4px",borderRadius:8,marginLeft:3,fontFamily:"'Share Tech Mono',monospace",verticalAlign:"middle"}}>{unread}</span>}</span>
        </button>);
      })}</div>
      <div className="content" style={tab==="Mission"&&mission?{padding:6,display:"flex",flexDirection:"column"}:{}}>
        {tab==="Squad"&&<SquadTab game={game} selectedOp={selectedOp} setSelectedOp={setSelectedOp} setGearModal={setGearModal} unequipGear={unequipGear} learnSkill={learnSkill} dismissOp={dismissOp}/>}
        {tab==="Mission"&&<MissionTab game={game} mission={mission} combatLog={combatLog} decision={decision} missionResult={missionResult} logRef={logRef} turnState={turnState} banter={banter} storyReactions={storyReactions} startMission={startMission} advanceMission={advanceMission} handleDecision={handleDecision} resetMission={resetMission} advanceDebrief={advanceDebrief} selectAttack={selectAttack} selectDefend={selectDefend} selectItem={selectItem} chooseStim={chooseStim} chooseTarget={chooseTarget} cancelSelection={cancelSelection}/>}
        {tab==="Comms"&&<CommsTab game={game} updateGame={updateGame}/>}
        {tab==="Inventory"&&<InventoryTab game={game} invFilter={invFilter} setInvFilter={setInvFilter} stimTarget={stimTarget} setStimTarget={setStimTarget} buyStim={buyStim} useStim={useStim} scrapGear={scrapGear}/>}
        {tab==="Recruit"&&<RecruitTab game={game} recruitOp={recruitOp}/>}
      </div>
      <GearModal gearModal={gearModal} setGearModal={setGearModal} game={game} equipGear={equipGear}/>
      {showNewGameConfirm && <NewGameConfirm onConfirm={()=>{setShowNewGameConfirm(false);newGame();}} onCancel={()=>setShowNewGameConfirm(false)}/>}
      {showSettings && <SettingsModal settings={game.settings} updateSettings={updateSettings} onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}
