import { getEffectiveStats } from '../../engine/operatives';
import SpriteIcon from '../../sprites/SpriteIcon';
import { enemySpriteKey } from '../../sprites/index';

export default function TurnOrderBar({ squad, enemies, highlightId }) {
  const allUnits = [
    ...squad.map(o => ({
      id: o.id, spriteId: o.spriteId, color: o.color, name: o.name.split(" ")[0], isAlly: true,
      speed: getEffectiveStats(o).speed, alive: o.alive,
    })),
    ...enemies.map(e => ({
      id: e.id, spriteId: enemySpriteKey(e.name), name: e.name, isAlly: false,
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
          <SpriteIcon spriteId={u.spriteId} size={16} state={!u.alive ? 'dead' : 'idle'} color={u.color} />
          <span className="turn-name">{(u.name || "").substring(0, 4)}</span>
        </div>
      ))}
    </div>
  );
}
