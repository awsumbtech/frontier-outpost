import { getAvailableAbilities } from '../../engine/combat';
import { CLASS_RESOURCE_NAMES, CLASS_RESOURCE_COLORS, CLASS_BASE_RESOURCE } from '../../data/constants';

export default function AbilitySelector({ operative, onChoose, onCancel }) {
  if (!operative) return null;

  const abilities = getAvailableAbilities(operative);
  const resourceName = CLASS_RESOURCE_NAMES[operative.classKey] || "MP";
  const resourceColor = CLASS_RESOURCE_COLORS[operative.classKey] || "#a78bfa";
  const maxResource = CLASS_BASE_RESOURCE[operative.classKey] || 0;
  const currentResource = operative.currentResource || 0;

  if (abilities.length === 0) {
    return (
      <div className="ability-selector">
        <div className="ability-selector-header">
          <span>{operative.icon} {operative.name.split(" ")[0]}</span>
          <span className="ability-resource" style={{ color: resourceColor }}>
            {resourceName}: {currentResource}
          </span>
        </div>
        <div className="ability-empty">No abilities learned yet</div>
        <button className="ability-back-btn" onClick={onCancel}>◄ Back</button>
      </div>
    );
  }

  return (
    <div className="ability-selector">
      <div className="ability-selector-header">
        <span>{operative.icon} {operative.name.split(" ")[0]} — Abilities</span>
        <span className="ability-resource" style={{ color: resourceColor }}>
          {resourceName}: {currentResource}/{maxResource}
        </span>
      </div>
      <div className="ability-list">
        {abilities.map(a => (
          <button
            key={a.id}
            className={`ability-item${!a.available ? " ability-disabled" : ""}`}
            onClick={() => a.available && onChoose(a.id)}
            disabled={!a.available}
          >
            <div className="ability-item-top">
              <span className="ability-name">{a.name}</span>
              <span className="ability-cost" style={{ color: a.available ? resourceColor : "var(--text-dim)" }}>
                {a.cost} {resourceName}
              </span>
            </div>
            <div className="ability-desc">{a.desc}</div>
          </button>
        ))}
      </div>
      <button className="ability-back-btn" onClick={onCancel}>◄ Back</button>
    </div>
  );
}
