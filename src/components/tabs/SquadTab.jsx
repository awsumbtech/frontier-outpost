import { useState } from 'react';
import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';
import { CLASSES } from '../../data/classes';
import { getEffectiveStats } from '../../engine/operatives';
import ClassBadge from '../shared/ClassBadge';

export default function SquadTab({ game, selectedOp, setSelectedOp, setGearModal, unequipGear, learnSkill, dismissOp }) {
  const [confirmDismiss, setConfirmDismiss] = useState(null);
  if (selectedOp) {
    const op = game.squad.find(o => o.id === selectedOp); if (!op) { setSelectedOp(null); return null; }
    const stats = getEffectiveStats(op); const cls = CLASSES[op.classKey];
    return (<div>
      <button className="btn btn-sm" onClick={() => setSelectedOp(null)} style={{marginBottom:6}}>← Back</button>
      <div className="split-panel">
        <div className="squad-detail-left">
          <div className="card" style={{marginBottom:0,'--op-color':op.color}}>
            <div className="op-detail-header">
              <div className="op-detail-portrait">
                <span className="op-detail-icon">{op.icon}</span>
              </div>
              <div className="op-detail-identity">
                <h3 className="op-card-name" style={{fontSize:'var(--font-lg)'}}>{op.name}</h3>
                <div className="op-card-class" style={{fontSize:'var(--font-xs)'}}>{cls.name} · LVL {op.level}</div>
                <div style={{fontSize:"var(--font-xxs)",color:"var(--text2)",marginTop:2}}>{cls.desc}</div>
                {(op.traits||[]).length>0&&<div className="trait-badges" style={{marginTop:4}}>{op.traits.map(t=><span className="trait-badge" key={t}>{t}</span>)}</div>}
              </div>
            </div>
            <div className="op-detail-xp">
              <div className="op-card-hp-label"><span>XP {op.xp}/{op.xpToLevel}</span>{op.skillPoints>0&&<span className="op-card-sp">● {op.skillPoints} SP</span>}</div>
              <div className="xp-bar-container"><div className="xp-bar" style={{width:`${(op.xp/op.xpToLevel)*100}%`}}/></div>
            </div>
            <div className="op-card-stats" style={{gridTemplateColumns:'repeat(auto-fill,minmax(70px,1fr))'}}>
              {[["HP",stats.hp],["ARM",stats.armor],["SHD",stats.shield],["DMG",stats.damage],["SPD",stats.speed],["CRT",stats.crit+"%"],["EVA",(stats.evasion||0)+"%"],
                ...(stats.armorPen?[["PEN",stats.armorPen+"%"]]:[]),...(stats.turretDmg?[["TRT",stats.turretDmg]]:[]),...(stats.healPerRound?[["HPS",stats.healPerRound]]:[])
              ].map(([l,v])=><div className="op-stat" key={l}><span className="op-stat-val">{v}</span><span className="op-stat-label">{l}</span></div>)}
            </div>
            <div className="section-label">Loadout</div>
            {["weapon","armor","implant","gadget"].map(slot => {
              const gear = op.gear[slot];
              return (<div className="gear-slot" key={slot} onClick={() => setGearModal({opId:op.id,slot})}>
                <span className="slot-label">{slot}</span>
                {gear ? (<>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{color:RARITY_COLORS[gear.rarity],fontSize:"var(--font-sm)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{gear.name}</span>
                      <span style={{color:RARITY_COLORS[gear.rarity],fontSize:"var(--font-xxs)",fontFamily:"'Share Tech Mono',monospace",background:`${RARITY_COLORS[gear.rarity]}18`,padding:"1px 5px",borderRadius:3,flexShrink:0}}>{RARITY_NAMES[gear.rarity]}</span>
                    </div>
                    <div style={{fontSize:"var(--font-xxs)",color:"var(--text2)",marginTop:2}}><ClassBadge classKey={gear.classKey}/></div>
                  </div>
                  <button className="btn btn-sm btn-danger" style={{flexShrink:0,padding:"4px 8px"}} onClick={e=>{e.stopPropagation();unequipGear(op.id,slot);}}>✕</button>
                </>) : <span style={{color:"var(--text2)",fontStyle:"italic",fontSize:"var(--font-xs)"}}>Tap to equip</span>}
              </div>);
            })}
            {game.squad.length>1&&(confirmDismiss===op.id?(
              <div style={{marginTop:8,padding:10,background:"rgba(0,0,0,.3)",border:"1px solid var(--danger)",borderRadius:6}}>
                <div style={{fontSize:"var(--font-sm)",color:"var(--danger)",marginBottom:6,fontWeight:600}}>Dismiss {op.name}?</div>
                <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:8}}>Equipped gear returns to inventory. This cannot be undone.</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn btn-sm" style={{flex:1}} onClick={()=>setConfirmDismiss(null)}>Cancel</button>
                  <button className="btn btn-danger btn-sm" style={{flex:1}} onClick={()=>{setConfirmDismiss(null);dismissOp(op.id);}}>Confirm</button>
                </div>
              </div>
            ):(
              <button className="btn btn-danger btn-sm" style={{marginTop:8,width:"100%"}} onClick={()=>setConfirmDismiss(op.id)}>Dismiss</button>
            ))}
          </div>
        </div>
        <div className="squad-detail-right">
          <div className="card" style={{marginBottom:0}}>
            <div className="section-label" style={{marginTop:0}}>Skills</div>
            {Object.entries(cls.branches).map(([bk,branch])=>(
              <div className="branch" key={bk}>
                <div className="branch-title"><span style={{color:op.color}}>◆</span>{branch.name}<span style={{fontSize:"var(--font-xxs)",color:"var(--text2)",marginLeft:"auto"}}>{branch.desc}</span></div>
                {branch.skills.map((skill,i)=>{
                  const learned=!!op.skills[skill.name]; const can=!learned&&op.skillPoints>=skill.cost; const prev=i===0||op.skills[branch.skills[i-1].name];
                  return (<div className={`skill-node${learned?" learned":""}`} key={skill.name} onClick={()=>can&&prev&&learnSkill(op.id,skill.name,skill.cost)} style={{opacity:!learned&&!prev?.35:1,cursor:can&&prev?"pointer":"default"}}>
                    <span style={{color:learned?"var(--success)":"var(--text2)",fontSize:14}}>{learned?"✓":"○"}</span>
                    <div style={{flex:1}}><div style={{fontSize:"var(--font-sm)",fontWeight:600}}>{skill.name}</div><div style={{fontSize:"var(--font-xs)",color:"var(--text2)"}}>{skill.desc}</div></div>
                    {!learned&&<span className="cost">{skill.cost}SP</span>}
                  </div>);
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>);
  }
  return (<div className="squad-card-grid">{game.squad.map(op=>{
    const s=getEffectiveStats(op); const hp=(op.currentHp/s.hp)*100;
    const hpColor = hp>50?"var(--success)":hp>25?"var(--warning)":"var(--danger)";
    return (<div className="op-card" key={op.id} onClick={()=>setSelectedOp(op.id)} style={{'--op-color':op.color}}>
      <div className="op-card-top">
        <div className="op-card-portrait">
          <span className="op-card-icon">{op.icon}</span>
          <span className="op-card-level">L{op.level}</span>
        </div>
        <div className="op-card-identity">
          <h3 className="op-card-name">{op.name}</h3>
          <div className="op-card-class">{op.className}</div>
          {(op.traits||[]).length>0&&<div className="op-card-traits">{op.traits.map(t=><span key={t} className="trait-tag">{t}</span>)}</div>}
          {op.skillPoints>0&&<div className="op-card-sp">● {op.skillPoints} SP available</div>}
        </div>
      </div>
      <div className="op-card-hp">
        <div className="op-card-hp-label">
          <span>HP</span>
          <span>{op.currentHp}/{s.hp}</span>
        </div>
        <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:hpColor}}/></div>
      </div>
      <div className="op-card-stats">
        <div className="op-stat"><span className="op-stat-val">{s.damage}</span><span className="op-stat-label">DMG</span></div>
        <div className="op-stat"><span className="op-stat-val">{s.armor}</span><span className="op-stat-label">ARM</span></div>
        <div className="op-stat"><span className="op-stat-val">{s.shield}</span><span className="op-stat-label">SHD</span></div>
        <div className="op-stat"><span className="op-stat-val">{s.speed}</span><span className="op-stat-label">SPD</span></div>
      </div>
    </div>);
  })}</div>);
}
