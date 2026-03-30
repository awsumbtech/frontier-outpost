import { useState, useRef, useEffect } from 'react';
import { getEffectiveStats } from '../../engine/operatives';

export default function CombatAlly({ op, highlight }) {
  const s = getEffectiveStats(op); const hp = Math.max(0, (op.currentHp / s.hp) * 100); const sh = s.shield > 0 ? Math.max(0, (op.currentShield / s.shield) * 100) : 0;
  const [flashing, setFlashing] = useState(false);
  const prevHp = useRef(op.currentHp);
  useEffect(() => {
    if (op.currentHp < prevHp.current) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 400);
      prevHp.current = op.currentHp;
      return () => clearTimeout(t);
    }
    prevHp.current = op.currentHp;
  }, [op.currentHp]);
  return (<div className={`combat-unit${!op.alive?" dead":""}${flashing?" damage-flash":""}${highlight?" unit-acting":""}`}>
    <div className="unit-header"><span style={{fontSize:14}}>{op.icon}</span><span style={{color:op.color,flex:1}}>{op.name.split(" ")[0]}</span><span style={{fontSize:"var(--font-xxs)",color:"var(--text2)"}}>L{op.level}</span></div>
    <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:hp>50?"var(--success)":hp>25?"var(--warning)":"var(--danger)"}}/></div>
    {s.shield>0&&<div className="bar-container" style={{height:4}}><div className="bar-fill" style={{width:`${sh}%`,background:"var(--accent)"}}/></div>}
    <div className="bar-label"><span>{op.currentHp}/{s.hp}</span>{s.shield>0&&<span style={{color:"var(--accent)"}}>{op.currentShield} shd</span>}</div>
    <div className="mini-stats"><span>DMG <span className="ms-val">{s.damage}</span></span><span>ARM <span className="ms-val">{s.armor}</span></span><span>SPD <span className="ms-val">{s.speed}</span></span><span>CRT <span className="ms-val">{s.crit}%</span></span></div>
  </div>);
}
