import SpriteIcon from '../../sprites/SpriteIcon';

export default function StimSelector({ stims, onChoose, onCancel }) {
  // Group stims by id and count them
  const grouped = {};
  stims.forEach((stim, idx) => {
    if (!grouped[stim.id]) {
      grouped[stim.id] = { ...stim, count: 0, firstIndex: idx };
    }
    grouped[stim.id].count++;
  });

  return (
    <div className="stim-selector">
      <div className="stim-selector-header">
        <span>Select Item</span>
        <button className="stim-selector-cancel" onClick={onCancel}>Cancel</button>
      </div>
      <div className="stim-selector-list">
        {Object.values(grouped).map(stim => (
          <button
            key={stim.id}
            className="stim-selector-item"
            onClick={() => onChoose(stim.firstIndex)}
          >
            <span className="stim-icon"><SpriteIcon spriteId={stim.spriteId || stim.id} size={20} /></span>
            <div className="stim-info">
              <span className="stim-name">{stim.name}</span>
              <span className="stim-desc">{stim.desc}</span>
            </div>
            <span className="stim-count">x{stim.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
