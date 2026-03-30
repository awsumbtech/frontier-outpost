import { getEffectiveStats } from '../../engine/operatives';

const ENEMY_ICONS = {
  "Feral Drone": "🤖", "Scav Raider": "🏴", "Spore Beast": "🍄",
  "Rogue Mech": "⚙️", "Xeno Stalker": "👾", "Hive Swarm": "🐝",
  "Heavy Sentinel": "🛡️", "Psi-Wraith": "👻",
  "Apex Predator": "🦎", "Core Guardian": "💎",
};

export default function TurnOrderBar({ squad, enemies, highlightId }) {
  const allUnits = [
    ...squad.map(o => ({
      id: o.id, icon: o.icon, name: o.name.split(" ")[0], isAlly: true,
      speed: getEffectiveStats(o).speed, alive: o.alive,
    })),
    ...enemies.map(e => ({
      id: e.id, icon: ENEMY_ICONS[e.name] || e.name[0], name: e.name, isAlly: false,
      speed: e.speed, alive: e.alive,
    })),
  ].sort((a, b) => (b.speed || 0) - (a.speed || 0));

  return (
    <div className="turn-order-bar">
      {allUnits.map(u => (
        <div
          key={u.id}
          className={[
            "turn-icon",
            u.isAlly ? "turn-ally" : "turn-enemy",
            highlightId === u.id && "turn-active",
            !u.alive && "turn-dead",
          ].filter(Boolean).join(" ")}
        >
          {u.icon}
          <span className="turn-name">{(u.name || "").substring(0, 4)}</span>
        </div>
      ))}
    </div>
  );
}
