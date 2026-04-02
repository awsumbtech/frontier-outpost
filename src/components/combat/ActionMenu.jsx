import { CLASS_RESOURCE_NAMES, CLASS_RESOURCE_COLORS, CLASS_BASE_RESOURCE } from '../../data/constants';
import SpriteIcon from '../../sprites/SpriteIcon';

export default function ActionMenu({ operative, turnState, stims, onAttack, onDefend, onItem, onAbility }) {
  if (!operative || !turnState || turnState.subPhase !== "awaitingAction") return null;

  const hasStims = stims && stims.length > 0;
  const resourceName = CLASS_RESOURCE_NAMES[operative.classKey] || "MP";
  const resourceColor = CLASS_RESOURCE_COLORS[operative.classKey] || "#a78bfa";
  const maxResource = CLASS_BASE_RESOURCE[operative.classKey] || 0;
  const currentResource = operative.currentResource || 0;

  return (
    <div className="action-menu">
      <div className="action-menu-header">
        <span className="action-menu-icon"><SpriteIcon spriteId={operative.spriteId} size={20} color={operative.color} /></span>
        <span className="action-menu-name">{operative.name.split(" ")[0]}'s Turn</span>
        {maxResource > 0 && (
          <span className="action-menu-resource" style={{ color: resourceColor }}>
            {resourceName}: {currentResource}/{maxResource}
          </span>
        )}
      </div>
      <div className="action-menu-buttons">
        <button className="action-btn action-btn-attack" onClick={onAttack}>
          <span className="action-btn-icon"><SpriteIcon spriteId="action_attack" size={16} /></span>
          <span className="action-btn-label">Attack</span>
        </button>
        <button className="action-btn action-btn-ability" onClick={onAbility}>
          <span className="action-btn-icon"><SpriteIcon spriteId="action_ability" size={16} /></span>
          <span className="action-btn-label">Ability</span>
        </button>
        <button className="action-btn action-btn-item" onClick={onItem} disabled={!hasStims}>
          <span className="action-btn-icon"><SpriteIcon spriteId="action_item" size={16} /></span>
          <span className="action-btn-label">Item{hasStims ? ` (${stims.length})` : ''}</span>
        </button>
        <button className="action-btn action-btn-defend" onClick={onDefend}>
          <span className="action-btn-icon"><SpriteIcon spriteId="action_defend" size={16} /></span>
          <span className="action-btn-label">Defend</span>
        </button>
      </div>
    </div>
  );
}
