import Phaser from "phaser";
import { TILE_SIZE, TILE_WALKABLE } from "../../data/mapConstants";

const MOVE_SPEED = 160; // pixels per second
const TILE_MOVE_TIME = (TILE_SIZE / MOVE_SPEED) * 1000; // ms per tile

// Player entity — grid-based movement with smooth tweening.
export default class Player {
  constructor(scene, tileX, tileY, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.tileX = tileX;
    this.tileY = tileY;
    this.moving = false;
    this.stepCount = 0;
    this.facingDir = "down";

    // Create a simple colored rectangle as the player sprite (v1: no sprite sheets)
    const px = tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = tileY * TILE_SIZE + TILE_SIZE / 2;

    this.sprite = scene.add.container(px, py);

    // Body: cyan square
    const body = scene.add.rectangle(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, 0x00d4ff);
    body.setStrokeStyle(1, 0x00aacc);

    // Direction indicator: small triangle showing facing direction
    this.dirIndicator = scene.add.triangle(0, -8, 0, -4, -4, 2, 4, 2, 0x00ffff);

    this.sprite.add([body, this.dirIndicator]);
    this.sprite.setDepth(10);

    // Set up keyboard input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update() {
    if (this.moving) return;

    let dx = 0, dy = 0;

    if (this.cursors.up.isDown || this.wasd.w.isDown) { dy = -1; this.facingDir = "up"; }
    else if (this.cursors.down.isDown || this.wasd.s.isDown) { dy = 1; this.facingDir = "down"; }
    else if (this.cursors.left.isDown || this.wasd.a.isDown) { dx = -1; this.facingDir = "left"; }
    else if (this.cursors.right.isDown || this.wasd.d.isDown) { dx = 1; this.facingDir = "right"; }

    if (dx === 0 && dy === 0) return;

    const newX = this.tileX + dx;
    const newY = this.tileY + dy;

    // Check bounds and walkability
    if (newY < 0 || newY >= this.terrain.length) return;
    if (newX < 0 || newX >= this.terrain[0].length) return;
    if (!TILE_WALKABLE.has(this.terrain[newY][newX])) return;

    // Update direction indicator
    this.updateDirectionIndicator();

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

  updateDirectionIndicator() {
    switch (this.facingDir) {
      case "up":
        this.dirIndicator.setPosition(0, -8);
        this.dirIndicator.setAngle(0);
        break;
      case "down":
        this.dirIndicator.setPosition(0, 8);
        this.dirIndicator.setAngle(180);
        break;
      case "left":
        this.dirIndicator.setPosition(-8, 0);
        this.dirIndicator.setAngle(-90);
        break;
      case "right":
        this.dirIndicator.setPosition(8, 0);
        this.dirIndicator.setAngle(90);
        break;
    }
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
