import { useState } from 'react';
import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';
import { STIM_TYPES } from '../../data/gear';
import { getEffectiveStats } from '../../engine/operatives';
import ClassBadge from '../shared/ClassBadge';

export default function InventoryTab({ game, invFilter, setInvFilter, stimTarget, setStimTarget, buyStim, useStim, scrapGear }) {
  const stims = game.stims || [];
  const types=["all","weapon","armor","implant","gadget"];
  const filtered=invFilter==="all"?game.inventory:game.inventory.filter(g=>g.type===invFilter);
  const sorted=[...filtered].sort((a,b)=>b.rarity-a.rarity);

  // Find which operative has a gear item equipped
  const equippedBy = (gearId) => {
    for (const op of game.squad) {
      if (op.gear && Object.values(op.gear).some(g => g && g.id === gearId)) return op;
    }
    return null;
  };

  return (<div className="armory-tab">
    {/* COMBAT STIMS */}
    <div className="armory-section">
      <div className="armory-section-header">
        <span className="armory-section-title">COMBAT STIMS</span>
        <span className="armory-section-count">{stims.length} IN STOCK</span>
      </div>
      <div className="stim-tray">
        {STIM_TYPES.map(st => {
          const count = stims.filter(s => s.id === st.id).length;
          return (
            <div key={st.id} className="stim-card" style={{'--stim-color': st.color}}>
              <div className="stim-icon-bg"><span className="stim-icon">{st.icon}</span></div>
              <span className="stim-name">{st.name}</span>
              <span className="stim-desc">{st.desc}</span>
              <div className="stim-bottom">
                <span className="stim-count">×{count}</span>
                <button className="stim-buy" disabled={game.credits < st.cost} onClick={() => buyStim(st)}>{st.cost}¢</button>
              </div>
              {count > 0 && <button className="stim-use" onClick={() => {
                const idx = stims.findIndex(s => s.id === st.id);
                if (idx === -1) return;
                if (st.id === "nano_kit" || st.id === "purge_shot") { useStim(idx, null); }
                else { setStimTarget({ stimIdx: idx, stim: stims[idx] }); }
              }}>USE</button>}
            </div>
          );
        })}
      </div>
    </div>

    {/* GEAR LOCKER */}
    <div className="armory-section">
      <div className="armory-section-header">
        <span className="armory-section-title">GEAR LOCKER</span>
        <span className="armory-section-count">{game.inventory.length} ITEMS</span>
      </div>

      <div className="filter-pills">
        {types.map(t => {
          const count = t === "all" ? game.inventory.length : game.inventory.filter(g => g.type === t).length;
          return (
            <button key={t} className={`filter-pill${invFilter === t ? " filter-active" : ""}`} onClick={() => setInvFilter(t)}>
              <span>{t === "all" ? "ALL" : t.substring(0, 3).toUpperCase()}</span>
              <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {game.inventory.length === 0 ? (
        <div style={{color:"var(--text2)",fontSize:"var(--font-xs)",padding:24,textAlign:"center"}}>No gear yet. Complete missions to earn loot.</div>
      ) : (
        <div className="gear-grid">
          {sorted.map(gear => {
            const sv = (gear.rarity + 1) * 15 + gear.level * 5;
            const owner = equippedBy(gear.id);
            return (
              <div className="gear-card" key={gear.id} style={{'--rarity-color': RARITY_COLORS[gear.rarity]}}>
                <div className="gear-rarity-bar" />
                <div className="gear-card-body">
                  <div className="gear-meta-row">
                    <span className="gear-type-class">
                      {gear.type.substring(0, 3).toUpperCase()} · <ClassBadge classKey={gear.classKey} />
                    </span>
                    <span className="gear-rarity-badge">{RARITY_NAMES[gear.rarity]}</span>
                  </div>
                  <div className="gear-name">{gear.name}</div>
                  <div className="gear-stats">
                    {Object.entries(gear.stats).filter(([,v]) => typeof v === "number" && v > 0).map(([k, v]) => (
                      <span key={k} className="gear-stat">{k}+{v}</span>
                    ))}
                  </div>
                  <div className="gear-bottom-row">
                    <span className="gear-mods">
                      {gear.modSlots > 0 && Array.from({length: gear.modSlots}, (_, i) => <span key={i} className="mod-dot" />)}
                      {gear.modSlots > 0 && <span className="mod-label">MOD</span>}
                    </span>
                    {owner ? (
                      <span className="gear-equipped">✓ {owner.name.split(" ")[0]}</span>
                    ) : (
                      <button className="gear-scrap" onClick={() => scrapGear(gear.id)}>⊘ {sv}¢</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* STIM TARGET MODAL */}
    {stimTarget && (<div className="modal-overlay" onClick={() => setStimTarget(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{stimTarget.stim.icon} Use {stimTarget.stim.name}</h3>
        <div style={{fontSize:"var(--font-xs)",color:"var(--text2)",marginBottom:8}}>{stimTarget.stim.desc}</div>
        {game.squad.map(op => {
          const s = getEffectiveStats(op);
          const hpPct = Math.round((op.currentHp / s.hp) * 100);
          return (<div key={op.id} className="inv-item" onClick={() => { useStim(stimTarget.stimIdx, op.id); setStimTarget(null); }}>
            <span style={{fontSize:18}}>{op.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"var(--font-sm)",fontWeight:600,color:op.color}}>{op.name}</div>
              <div style={{fontSize:"var(--font-xs)",color:"var(--text2)"}}>HP: {op.currentHp}/{s.hp} ({hpPct}%) · Shield: {op.currentShield}/{s.shield}</div>
            </div>
            <div className="bar-container" style={{width:50}}><div className="bar-fill" style={{width:`${hpPct}%`,background:hpPct>50?"var(--success)":hpPct>25?"var(--warning)":"var(--danger)"}}/></div>
          </div>);
        })}
        <button className="btn" style={{marginTop:8,width:"100%"}} onClick={() => setStimTarget(null)}>Cancel</button>
      </div>
    </div>)}
  </div>);
}
