import { CLASSES } from '../../data/classes';

export default function ClassBadge({ classKey }) {
  if (!classKey) return <span className="class-badge" style={{background:"rgba(255,255,255,.05)",color:"var(--text2)"}}>ANY</span>;
  const c = CLASSES[classKey]; if (!c) return null;
  return <span className="class-badge" style={{background:c.color+"20",color:c.color}}>{c.icon}{c.name}</span>;
}
