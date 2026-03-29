import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';
import ClassBadge from './ClassBadge';
import StatDiff from './StatDiff';

export default function GearModal({ gearModal, setGearModal, game, equipGear }) {
  if (!gearModal) return null;
  const {opId,slot}=gearModal; const op=game.squad.find(o=>o.id===opId); if (!op) return null;
  const cur=op.gear[slot]; const avail=game.inventory.filter(g=>g.type===slot);
  return (<div className="modal-overlay" onClick={()=>setGearModal(null)}>
    <div className="modal" onClick={e=>e.stopPropagation()}>
      <h3>Equip {slot} for {op.name.split(" ")[0]}</h3>
      {cur&&<div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:6,padding:"6px 8px",background:"rgba(0,0,0,.2)",borderRadius:6}}>
        Current: <span style={{color:RARITY_COLORS[cur.rarity]}}>{cur.name}</span> · {Object.entries(cur.stats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>`${k}: ${v}`).join(" · ")}
      </div>}
      {avail.length===0?<div style={{color:"var(--text2)",padding:16,textAlign:"center",fontSize:"var(--font-sm)"}}>No {slot}s available</div>:
        avail.sort((a,b)=>b.rarity-a.rarity).map(gear=>(<div className="inv-item" key={gear.id} onClick={()=>equipGear(opId,slot,gear.id)}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{color:RARITY_COLORS[gear.rarity],fontWeight:600,fontSize:"var(--font-sm)"}}>{gear.name}</span>
              <ClassBadge classKey={gear.classKey}/>
            </div>
            <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginTop:2}}>{Object.entries(gear.stats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>`${k}+${v}`).join(" · ")}</div>
            <StatDiff currentGear={cur} newGear={gear}/>
          </div>
          <span className="tag" style={{background:RARITY_COLORS[gear.rarity]+"20",color:RARITY_COLORS[gear.rarity]}}>{RARITY_NAMES[gear.rarity][0]}</span>
        </div>))}
      <button className="btn" style={{marginTop:8,width:"100%"}} onClick={()=>setGearModal(null)}>Close</button>
    </div>
  </div>);
}
