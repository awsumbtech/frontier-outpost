import Phaser from "phaser";

// Base Phaser game configuration.
// Scenes are added dynamically by PhaserGame.jsx.
export function createPhaserConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    width: 640,
    height: 480,
    pixelArt: true,
    backgroundColor: "#0a0c10",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [], // Added by PhaserGame.jsx
    audio: { noAudio: true },
  };
}
