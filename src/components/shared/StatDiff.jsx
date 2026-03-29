export default function StatDiff({ currentGear, newGear }) {
  if (!newGear) return null; const cs = currentGear?.stats||{}; const ns = newGear.stats||{};
  const keys = [...new Set([...Object.keys(cs),...Object.keys(ns)])].filter(k => typeof(ns[k]??cs[k])==="number");
  return (<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:1}}>
    {keys.map(k => { const d = (ns[k]||0)-(cs[k]||0); if (d === 0 && currentGear) return null; if (d === 0) return <span key={k} style={{fontSize:9,color:"var(--text2)"}}>{k}+{ns[k]}</span>;
      return <span key={k} className={d>0?"stat-diff-pos":"stat-diff-neg"}>{k}:{d>0?"+":""}{d}</span>; })}
  </div>);
}
