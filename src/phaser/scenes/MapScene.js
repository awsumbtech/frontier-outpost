import Phaser from "phaser";
import { TILE, TILE_SIZE, TILE_WALKABLE } from "../../data/mapConstants";
import Player from "../entities/Player";
import EncounterSystem from "../systems/EncounterSystem";
import CameraSystem from "../systems/CameraSystem";

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: "MapScene" });
    this.player = null;
    this.encounterSystem = null;
    this.cameraSystem = null;
    this.mapData = null;
    this.eventBridge = null;
    this.exitMarker = null;
    this.exitActive = false;
  }

  init(data) {
    this.mapData = data.mapData;
    this.eventBridge = data.eventBridge;
    this.playerStartPos = data.playerPos || null;
  }

  create() {
    const { terrain, palette, width, height, entities, encounterConfig, seed } = this.mapData;

    // Render tilemap as colored rectangles
    this.renderTilemap(terrain, palette, width, height);

    // Render exit marker
    const exitEntity = entities.find(e => e.type === "exit");
    if (exitEntity) {
      this.exitMarker = this.add.rectangle(
        exitEntity.x * TILE_SIZE + TILE_SIZE / 2,
        exitEntity.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 2, TILE_SIZE - 2,
        0xffa502, 0.3
      );
      this.exitMarker.setStrokeStyle(2, 0xffa502);
      this.exitMarker.setDepth(5);
      // Pulse animation
      this.tweens.add({
        targets: this.exitMarker,
        alpha: { from: 0.3, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
      // Start dim/inactive until encounters are done
      this.exitMarker.setVisible(false);
    }

    // Create player at spawn or saved position
    const spawnEntity = entities.find(e => e.type === "spawn");
    const startX = this.playerStartPos?.x ?? spawnEntity?.x ?? 1;
    const startY = this.playerStartPos?.y ?? spawnEntity?.y ?? 1;
    this.player = new Player(this, startX, startY, terrain);

    // Camera follows player
    this.cameraSystem = new CameraSystem(this, width, height);
    this.cameraSystem.follow(this.player.sprite);

    // Encounter system
    this.encounterSystem = new EncounterSystem(encounterConfig, seed);

    // Listen for player steps
    this.events.on("player:step", this.onPlayerStep, this);

    // Listen for resume events from React
    this.eventBridge.on("map:resume", this.onResume.bind(this));

    // Capture movement keys to prevent page scrolling
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);

    // Notify React that map is ready
    this.eventBridge.emit("map:ready", {
      encounterState: this.encounterSystem.getState(),
    });
  }

  renderTilemap(terrain, palette, width, height) {
    const graphics = this.add.graphics();
    graphics.setDepth(0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = terrain[y][x];
        let color;
        switch (tile) {
          case TILE.VOID:
            color = 0x0a0a0a;
            break;
          case TILE.FLOOR:
          case TILE.SPAWN:
            color = Phaser.Display.Color.HexStringToColor(palette.floor).color;
            break;
          case TILE.WALL:
            color = Phaser.Display.Color.HexStringToColor(palette.wall).color;
            break;
          case TILE.OBSTACLE:
            color = Phaser.Display.Color.HexStringToColor(palette.obstacle).color;
            break;
          case TILE.ENCOUNTER_ZONE:
            color = Phaser.Display.Color.HexStringToColor(palette.encounterZone).color;
            break;
          case TILE.EXIT:
            color = Phaser.Display.Color.HexStringToColor(palette.floor).color;
            break;
          default:
            color = 0x0a0a0a;
        }
        graphics.fillStyle(color, 1);
        graphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Subtle grid lines for visual clarity
        if (TILE_WALKABLE.has(tile)) {
          graphics.lineStyle(1, 0xffffff, 0.03);
          graphics.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw obstacle shapes (small inner rectangles to differentiate from walls)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain[y][x] === TILE.OBSTACLE) {
          const oColor = Phaser.Display.Color.HexStringToColor(palette.obstacle).color;
          graphics.fillStyle(oColor, 1);
          const inset = 4;
          graphics.fillRect(
            x * TILE_SIZE + inset, y * TILE_SIZE + inset,
            TILE_SIZE - inset * 2, TILE_SIZE - inset * 2
          );
          graphics.lineStyle(1, 0xffffff, 0.08);
          graphics.strokeRect(
            x * TILE_SIZE + inset, y * TILE_SIZE + inset,
            TILE_SIZE - inset * 2, TILE_SIZE - inset * 2
          );
        }
      }
    }
  }

  onPlayerStep(data) {
    // Check for exit tile
    if (data.tile === TILE.EXIT && this.encounterSystem.isComplete()) {
      this.eventBridge.emit("map:exit", {
        stepsTotal: data.stepCount,
        encounterState: this.encounterSystem.getState(),
      });
      return;
    }

    // Update exit marker visibility
    if (this.exitMarker && this.encounterSystem.isComplete() && !this.exitActive) {
      this.exitActive = true;
      this.exitMarker.setVisible(true);
    }

    // Check for random encounter
    if (this.encounterSystem.checkStep(data.tile)) {
      // Freeze player movement
      this.player.moving = true; // prevent movement during transition

      // Flash effect
      this.cameras.main.flash(300, 255, 255, 255, true);

      this.time.delayedCall(350, () => {
        this.eventBridge.emit("map:encounter", {
          position: { x: data.x, y: data.y },
          stepCount: data.stepCount,
          encounterState: this.encounterSystem.getState(),
        });
      });
    }

    // Emit step update for HUD
    this.eventBridge.emit("map:step", {
      position: { x: data.x, y: data.y },
      encounterState: this.encounterSystem.getState(),
    });
  }

  onResume(data) {
    // Resume after combat
    if (this.player) {
      this.player.moving = false;
    }
    // Update exit visibility after encounter
    if (this.exitMarker && this.encounterSystem.isComplete() && !this.exitActive) {
      this.exitActive = true;
      this.exitMarker.setVisible(true);
    }
  }

  update() {
    if (this.player) {
      this.player.update();
    }
  }

  shutdown() {
    this.events.off("player:step", this.onPlayerStep, this);
    if (this.eventBridge) {
      this.eventBridge.off("map:resume");
    }
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
}
