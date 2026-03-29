import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';
import { STIM_TYPES } from '../../data/gear';
import { getEffectiveStats } from '../../engine/operatives';
import ClassBadge from '../shared/ClassBadge';

export default function InventoryTab({ game, invFilter, setInvFilter, stimTarget, setStimTarget, buyStim, useStim, scrapGear }) {
  const stims = game.stims || [];
  const types=["all","weapon","armor","implant","gadget"];
  const filtered=invFilter==="all"?game.inventory:game.inventory.filter(g=>g.type===invFilter);
  const sorted=[...filtered].sort((a,b)=>b.rarity-a.rarity);
  return (<div>
    <div style={{marginBottom:12}}>
      <div className="section-label">Stims ({stims.length})</div>
      {stims.length > 0 && (<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
        {stims.map((s,i)=>(
          <div key={i} style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:6,padding:"6px 10px",fontSize:"var(--font-xs)",display:"flex",alignItems:"center",gap:6,cursor:"pointer",minHeight:36}}
            onClick={()=>{
              if (s.id==="nano_kit"||s.id==="purge_shot") { useStim(i, null); }
              else { setStimTarget({stimIdx:i,stim:s}); }
            }}>
            <span>{s.icon}</span>
            <span style={{color:s.color,fontWeight:600}}>{s.name}</span>
            <span style={{color:"var(--text2)",fontSize:"var(--font-xxs)"}}>TAP</span>
          </div>
        ))}
      </div>)}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {STIM_TYPES.map(st=>(
          <button key={st.id} className="btn btn-sm" style={{display:"flex",alignItems:"center",gap:4}} disabled={game.credits<st.cost} onClick={()=>buyStim(st)}>
            <span>{st.icon}</span>{st.name}<span style={{color:"var(--warning)"}}>{st.cost}¢</span>
          </button>
        ))}
      </div>
    </div>

    <div className="section-label">Gear ({game.inventory.length})</div>
    {game.inventory.length===0?<div style={{color:"var(--text2)",fontSize:"var(--font-xs)",padding:12,textAlign:"center"}}>No gear. Complete missions.</div>:(
      <>
        <div className="inv-filters">{types.map(t=>(<button key={t} className={invFilter===t?"active":""} onClick={()=>setInvFilter(t)}>
          {t==="all"?`All (${game.inventory.length})`:`${t} (${game.inventory.filter(g=>g.type===t).length})`}
        </button>))}</div>
        {sorted.map(gear=>{
          const sv=(gear.rarity+1)*15+gear.level*5;
          return (<div className="inv-item" key={gear.id}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{color:RARITY_COLORS[gear.rarity],fontWeight:600,fontSize:"var(--font-sm)"}}>{gear.name}</span>
                <span className="tag" style={{background:RARITY_COLORS[gear.rarity]+"20",color:RARITY_COLORS[gear.rarity]}}>{RARITY_NAMES[gear.rarity]}</span>
                <ClassBadge classKey={gear.classKey}/>
              </div>
              <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginTop:2}}>
                {gear.type} L{gear.level}{gear.modSlots>0&&` · ${gear.modSlots} mod`} · {Object.entries(gear.stats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>`${k}+${v}`).join(" ")}
              </div>
            </div>
            <span className="scrap-value">{sv}¢</span>
            <button className="btn btn-sm" onClick={()=>scrapGear(gear.id)}>Scrap</button>
          </div>);
        })}
      </>
    )}

    {stimTarget && (<div className="modal-overlay" onClick={()=>setStimTarget(null)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>{stimTarget.stim.icon} Use {stimTarget.stim.name}</h3>
        <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:8}}>{stimTarget.stim.desc}</div>
        {game.squad.map(op=>{
          const s=getEffectiveStats(op);
          const hpPct=Math.round((op.currentHp/s.hp)*100);
          return (<div key={op.id} className="inv-item" onClick={()=>{useStim(stimTarget.stimIdx,op.id);setStimTarget(null);}}>
            <span style={{fontSize:18}}>{op.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"var(--font-sm)",fontWeight:600,color:op.color}}>{op.name}</div>
              <div style={{fontSize:"var(--font-xs)",color:"var(--text2)"}}>HP: {op.currentHp}/{s.hp} ({hpPct}%) · Shield: {op.currentShield}/{s.shield}</div>
            </div>
            <div className="bar-container" style={{width:50}}><div className="bar-fill" style={{width:`${hpPct}%`,background:hpPct>50?"var(--success)":hpPct>25?"var(--warning)":"var(--danger)"}}/></div>
          </div>);
        })}
        <button className="btn" style={{marginTop:8,width:"100%"}} onClick={()=>setStimTarget(null)}>Cancel</button>
      </div>
    </div>)}
  </div>);
}
