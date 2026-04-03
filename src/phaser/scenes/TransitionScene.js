import Phaser from "phaser";

// Handles screen transition effects for combat entry/exit.
// Classic JRPG screen flash before battle.
export default class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: "TransitionScene" });
  }

  create() {
    // This scene runs alongside MapScene as an overlay.
    // It's started/stopped on demand for transition effects.
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
  }
}
