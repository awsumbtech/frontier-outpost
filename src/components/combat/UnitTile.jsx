import { useState, useRef, useEffect } from 'react';

const ENEMY_ICONS = {
  "Feral Drone": "🤖", "Scav Raider": "🏴", "Spore Beast": "🍄",
  "Rogue Mech": "⚙️", "Xeno Stalker": "👾", "Hive Swarm": "🐝",
  "Heavy Sentinel": "🛡️", "Psi-Wraith": "👻",
  "Apex Predator": "🦎", "Core Guardian": "💎",
};

export default function UnitTile({ unit, isAlly, highlight, stats }) {
  const [flashing, setFlashing] = useState(false);
  const hp = isAlly ? unit.currentHp : unit.hp;
  const maxHp = isAlly ? stats.hp : unit.maxHp;
  const prevHp = useRef(hp);

  useEffect(() => {
    if (hp < prevHp.current) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 400);
      prevHp.current = hp;
      return () => clearTimeout(t);
    }
    prevHp.current = hp;
  }, [hp]);

  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 50 ? "var(--success)" : hpPct > 25 ? "var(--warning)" : "var(--danger)";
  const shieldMax = isAlly ? stats.shield : 0;
  const shieldPct = shieldMax > 0 ? Math.max(0, (unit.currentShield / shieldMax) * 100) : 0;

  const icon = isAlly ? unit.icon : (ENEMY_ICONS[unit.name] || unit.name[0]);
  const name = isAlly ? unit.name.split(" ")[0] : unit.name;
  const unitColor = isAlly ? unit.color : undefined;

  const cls = [
    "unit-tile",
    isAlly ? "unit-ally" : "unit-enemy",
    !unit.alive && "unit-dead",
    highlight && "unit-highlight",
    flashing && "unit-damage-flash",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} style={unitColor ? { '--unit-color': unitColor } : undefined}>
      {isAlly && <span className="unit-tile-level">L{unit.level}</span>}
      <div className="unit-tile-icon">{icon}</div>
      <div className="unit-tile-name">{name}</div>
      <div className="unit-tile-hp-bar">
        <div className="bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
      </div>
      {shieldMax > 0 && (
        <div className="unit-tile-shield-bar">
          <div className="bar-fill" style={{ width: `${shieldPct}%` }} />
        </div>
      )}
      {unit.stunned && <div className="unit-tile-status">STUN</div>}
      {!unit.alive && <div className="unit-tile-dead-overlay">✕</div>}
    </div>
  );
}
