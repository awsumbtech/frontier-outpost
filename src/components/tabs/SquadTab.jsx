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
      <div className="card">
        <div className="card-header"><span className="icon">{op.icon}</span><h3 style={{color:op.color}}>{op.name}</h3><span className="level">LVL {op.level}</span></div>
        <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:4}}>{cls.desc}</div>
        {(op.traits||[]).length>0&&<div className="trait-badges">{op.traits.map(t=><span className="trait-badge" key={t}>{t}</span>)}</div>}
        <div className="xp-bar-container"><div className="xp-bar" style={{width:`${(op.xp/op.xpToLevel)*100}%`}}/></div>
        <div style={{fontSize:"var(--font-xxs)",color:"var(--text2)"}}>XP: {op.xp}/{op.xpToLevel} · SP: <span style={{color:op.skillPoints>0?"var(--warning)":"var(--text2)"}}>{op.skillPoints}</span></div>
        <div className="stat-grid">
          {[["HP",stats.hp],["ARM",stats.armor],["SHD",stats.shield],["DMG",stats.damage],["SPD",stats.speed],["CRT",stats.crit+"%"],["EVA",(stats.evasion||0)+"%"],
            ...(stats.armorPen?[["PEN",stats.armorPen+"%"]]:[]),...(stats.turretDmg?[["TRT",stats.turretDmg]]:[]),...(stats.healPerRound?[["HPS",stats.healPerRound]]:[])
          ].map(([l,v])=><div className="stat" key={l}><span className="label">{l}</span><span className="value">{v}</span></div>)}
        </div>
        <div className="section-label">Loadout</div>
        {["weapon","armor","implant","gadget"].map(slot => {
          const gear = op.gear[slot];
          return (<div className="gear-slot" key={slot} onClick={() => setGearModal({opId:op.id,slot})}>
            <span className="slot-label">{slot}</span>
            {gear ? (<>
              <span style={{color:RARITY_COLORS[gear.rarity],flex:1,fontSize:"var(--font-sm)"}}>{gear.name}</span>
              <ClassBadge classKey={gear.classKey}/>
              <span style={{color:RARITY_COLORS[gear.rarity],fontSize:"var(--font-xxs)",fontFamily:"'Share Tech Mono',monospace"}}>{RARITY_NAMES[gear.rarity][0]}</span>
              <button className="btn btn-sm btn-danger" onClick={e=>{e.stopPropagation();unequipGear(op.id,slot);}}>✕</button>
            </>) : <span style={{color:"var(--text2)",fontStyle:"italic",fontSize:"var(--font-xs)"}}>Tap to equip</span>}
          </div>);
        })}
        <div className="section-label">Skills</div>
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
    </div>);
  }
  return (<div>{game.squad.map(op=>{
    const s=getEffectiveStats(op); const hp=(op.currentHp/s.hp)*100;
    return (<div className="card" key={op.id} onClick={()=>setSelectedOp(op.id)} style={{cursor:"pointer"}}>
      <div className="card-header"><span className="icon">{op.icon}</span><h3 style={{color:op.color}}>{op.name}</h3><span style={{fontSize:"var(--font-xs)",color:"var(--text2)"}}>{op.className}</span>{(op.traits||[]).length>0&&<span className="trait-tags">{op.traits.map(t=><span key={t} className="trait-tag">{t}</span>)}</span>}<span className="level">L{op.level}</span></div>
      <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:hp>50?"var(--success)":hp>25?"var(--warning)":"var(--danger)"}}/></div>
      <div className="squad-stats">
        <span className="stat-item"><span className="stat-label">HP</span> <span className="stat-val">{op.currentHp}/{s.hp}</span></span>
        <span className="stat-item"><span className="stat-label">DMG</span> <span className="stat-val">{s.damage}</span></span>
        <span className="stat-item"><span className="stat-label">ARM</span> <span className="stat-val">{s.armor}</span></span>
        <span className="stat-item"><span className="stat-label">SPD</span> <span className="stat-val">{s.speed}</span></span>
        {op.skillPoints>0&&<span className="stat-item" style={{marginLeft:"auto"}}><span style={{color:"var(--warning)",fontFamily:"'Share Tech Mono',monospace"}}>● {op.skillPoints} SP</span></span>}
      </div>
    </div>);
  })}</div>);
}
