import { useState, useRef, useEffect } from 'react';

export default function CombatEnemy({ e }) {
  const hp = Math.max(0, (e.hp / e.maxHp) * 100);
  const [flashing, setFlashing] = useState(false);
  const prevHp = useRef(e.hp);
  useEffect(() => {
    if (e.hp < prevHp.current) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 400);
      prevHp.current = e.hp;
      return () => clearTimeout(t);
    }
    prevHp.current = e.hp;
  }, [e.hp]);
  return (<div className={`enemy-unit${flashing?" damage-flash":""}`}>
    <div className="unit-header"><span style={{flex:1}}>{e.name}</span>{e.stunned&&<span style={{fontSize:"var(--font-xxs)",color:"var(--warning)",fontWeight:600}}>STUNNED</span>}</div>
    <div className="bar-container"><div className="bar-fill" style={{width:`${hp}%`,background:"var(--danger)"}}/></div>
    <div className="bar-label"><span>{e.hp}/{e.maxHp}</span></div>
    <div className="mini-stats"><span>DMG <span className="ms-val">{e.damage}</span></span><span>ARM <span className="ms-val">{e.armor}</span></span><span>SPD <span className="ms-val">{e.speed}</span></span></div>
  </div>);
}
