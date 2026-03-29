import { useState, useEffect } from "react";
import { INTRO_SEQUENCE } from "../../data/story";

export default function IntroScreen({ onBegin }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const isNarrative = step < INTRO_SEQUENCE.length;
  const beat = isNarrative ? INTRO_SEQUENCE[step] : null;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [step]);

  function advance() {
    if (isNarrative) {
      setStep(s => s + 1);
    } else {
      onBegin();
    }
  }

  return (
    <div className="intro-overlay">
      <div className="intro-content">
        <div className="intro-title">FRONTIER OUTPOST</div>
        <div className="intro-subtitle">Kepler-442b | Outpost Sigma</div>

        {isNarrative ? (
          <div className={`intro-beat ${visible ? "intro-beat-visible" : ""}`} key={step}>
            <div className="intro-beat-label">{beat.label}</div>
            <div className="intro-story">
              <p>{beat.text}</p>
            </div>
            <div className="intro-progress">
              {INTRO_SEQUENCE.map((_, i) => (
                <span key={i} className={`intro-dot ${i <= step ? "intro-dot-active" : ""}`} />
              ))}
            </div>
            <button className="btn btn-primary intro-advance" onClick={advance}>
              CONTINUE
            </button>
            <button className="intro-skip" onClick={onBegin}>
              Skip intro
            </button>
          </div>
        ) : (
          <div className={`intro-beat ${visible ? "intro-beat-visible" : ""}`}>
            <div className="intro-how-to-play">
              <h2>How to Play</h2>
              <ul>
                <li><strong>Missions</strong> — Deploy your squad on tactical operations. Combat auto-resolves round by round.</li>
                <li><strong>Squad</strong> — Manage your operatives, equip gear, and learn skills as they level up.</li>
                <li><strong>Comms</strong> — Read incoming transmissions that reveal the unfolding story.</li>
                <li><strong>Inventory</strong> — Equip loot, scrap unwanted gear for credits, and buy combat stims.</li>
                <li><strong>Recruit</strong> — Hire new operatives to fill out your 4-person squad.</li>
              </ul>
            </div>
            <button className="btn btn-primary intro-begin" onClick={onBegin}>
              BEGIN MISSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
