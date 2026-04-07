import Phaser from "phaser";
import { TILE_SIZE, TILE_WALKABLE } from "../../data/mapConstants";
import { generatePlayerSprite } from "../assets/spriteGen";

const MOVE_SPEED = 160; // pixels per second
const TILE_MOVE_TIME = (TILE_SIZE / MOVE_SPEED) * 1000; // ms per tile

// Player entity — grid-based movement with smooth tweening.
export default class Player {
  constructor(scene, tileX, tileY, terrain, classId = "vanguard") {
    this.scene = scene;
    this.terrain = terrain;
    this.tileX = tileX;
    this.tileY = tileY;
    this.moving = false;
    this.stepCount = 0;
    this.facing = "down";
    this.classId = classId;

    // Generate sprite texture (idempotent — safe to call every time)
    generatePlayerSprite(scene, classId);
    const textureKey = `player-${classId}`;

    // Create animated sprite at player tile position
    const px = tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.sprite(px, py, textureKey, 0);
    this.sprite.setDepth(10);

    // Define animations (keyed by classId to avoid conflicts between classes)
    this._createAnimations(textureKey);

    // Start in idle-down pose
    this.sprite.play(`${classId}-idle-down`);

    // Set up keyboard input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  _createAnimations(textureKey) {
    const { classId } = this;
    const anims = this.scene.anims;

    const defs = [
      { key: `${classId}-walk-down`,  frames: [0, 1, 2, 1], frameRate: 8, repeat: -1 },
      { key: `${classId}-walk-left`,  frames: [3, 4, 5, 4], frameRate: 8, repeat: -1 },
      { key: `${classId}-walk-right`, frames: [6, 7, 8, 7], frameRate: 8, repeat: -1 },
      { key: `${classId}-walk-up`,    frames: [9, 10, 11, 10], frameRate: 8, repeat: -1 },
      { key: `${classId}-idle-down`,  frames: [0],  frameRate: 1, repeat: 0 },
      { key: `${classId}-idle-left`,  frames: [3],  frameRate: 1, repeat: 0 },
      { key: `${classId}-idle-right`, frames: [6],  frameRate: 1, repeat: 0 },
      { key: `${classId}-idle-up`,    frames: [9],  frameRate: 1, repeat: 0 },
    ];

    for (const def of defs) {
      if (anims.exists(def.key)) continue;
      anims.create({
        key: def.key,
        frames: def.frames.map(f => ({ key: textureKey, frame: f })),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
  }

  update() {
    if (this.moving) return;

    let dx = 0, dy = 0;

    if (this.cursors.up.isDown || this.wasd.w.isDown) { dy = -1; this.facing = "up"; }
    else if (this.cursors.down.isDown || this.wasd.s.isDown) { dy = 1; this.facing = "down"; }
    else if (this.cursors.left.isDown || this.wasd.a.isDown) { dx = -1; this.facing = "left"; }
    else if (this.cursors.right.isDown || this.wasd.d.isDown) { dx = 1; this.facing = "right"; }

    if (dx === 0 && dy === 0) return;

    const newX = this.tileX + dx;
    const newY = this.tileY + dy;

    // Check bounds and walkability
    if (newY < 0 || newY >= this.terrain.length) return;
    if (newX < 0 || newX >= this.terrain[0].length) return;
    if (!TILE_WALKABLE.has(this.terrain[newY][newX])) return;

    // Start walk animation for the current facing direction
    this.sprite.play(`${this.classId}-walk-${this.facing}`);

    // Move
    this.moving = true;
    this.tileX = newX;
    this.tileY = newY;
    this.stepCount++;

    const targetX = newX * TILE_SIZE + TILE_SIZE / 2;
    const targetY = newY * TILE_SIZE + TILE_SIZE / 2;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: TILE_MOVE_TIME,
      ease: "Linear",
      onComplete: () => {
        this.moving = false;
        // Return to idle pose for current facing direction
        this.sprite.play(`${this.classId}-idle-${this.facing}`);
        // Emit step event for encounter checking
        this.scene.events.emit("player:step", {
          x: this.tileX,
          y: this.tileY,
          tile: this.terrain[this.tileY][this.tileX],
          stepCount: this.stepCount,
        });
      },
    });
  }

  getPosition() {
    return { x: this.tileX, y: this.tileY };
  }

  setPosition(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.sprite.setPosition(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2
    );
  }

  destroy() {
    this.sprite.destroy();
  }
}
