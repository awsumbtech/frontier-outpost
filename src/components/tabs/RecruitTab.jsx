import { CLASSES } from '../../data/classes';

export default function RecruitTab({ game, recruitOp }) {
  const can=game.squad.length<4;
  return (<div>
    <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:8}}>Squad: {game.squad.length}/4 · Cost: 150¢{!can&&<span style={{color:"var(--danger)",marginLeft:6}}>Squad Full</span>}</div>
    <div className="recruit-grid">{Object.entries(CLASSES).map(([key,cls])=>{
      const has=game.squad.some(o=>o.classKey===key);
      return (<div className="recruit-card" key={key}>
        <div className="class-icon">{cls.icon}</div><h4 style={{color:cls.color}}>{cls.name}</h4><p>{cls.desc}</p>
        <div className="op-card-stats" style={{marginTop:8}}>{Object.entries(cls.baseStats).slice(0,4).map(([k,v])=>(<div className="op-stat" key={k}><span className="op-stat-val">{v}</span><span className="op-stat-label">{k}</span></div>))}</div>
        <button className="btn btn-primary btn-sm" style={{marginTop:12,width:"100%"}} disabled={!can||game.credits<150} onClick={()=>recruitOp(key)}>{has?"Another":"Recruit"} 150¢</button>
      </div>);
    })}</div>
  </div>);
}
