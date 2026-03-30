import React from 'react';

export default function MissionProgressDots({ current, total, roundNum, missionName }) {
  const nodes = [];
  // Briefing node
  nodes.push({ label: "BRIEF", done: current >= 1, current: false });
  // Encounter nodes with connectors
  for (let i = 1; i <= total; i++) {
    nodes.push({ label: `ENC ${i}`, done: i < current, current: i === current });
  }
  // End node
  nodes.push({ label: "END", done: false, current: false });

  return (
    <div className="mission-progress">
      {missionName && <span className="progress-name">{missionName}</span>}
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div className={`progress-connector${node.done || nodes[i-1].done ? " connector-done" : ""}`} />
          )}
          <div className="progress-node">
            <div className={`progress-dot${node.done ? " dot-done" : ""}${node.current ? " dot-current" : ""}`} />
            <span className={`progress-node-label${node.done ? " label-done" : ""}${node.current ? " label-current" : ""}`}>{node.label}</span>
          </div>
        </React.Fragment>
      ))}
      <span className="progress-info">{current}/{total}</span>
    </div>
  );
}
