import Phaser from "phaser";
import { TILE, TILE_SIZE } from "../../data/mapConstants";
import Player from "../entities/Player";
import EncounterSystem from "../systems/EncounterSystem";
import CameraSystem from "../systems/CameraSystem";
import { generateTileset } from "../assets/tilesetGen";

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
    this.tilesetKey = null;
  }

  init(data) {
    this.mapData = data.mapData;
    this.eventBridge = data.eventBridge;
    this.playerStartPos = data.playerPos || null;
    this.squadLeaderClass = (data.mapData && data.mapData.squadLeaderClass) || 'vanguard';
  }

  create() {
    const { terrain, palette, width, height, entities, encounterConfig, seed } = this.mapData;

    // Generate tileset texture and render tilemap as sprites
    const paletteId = this.mapData.id || "default";
    generateTileset(this, palette, paletteId);
    this.tilesetKey = `tileset-${paletteId}`;
    this.renderTilemap(terrain, width, height);

    // Render exit marker
    const isLinear = this.mapData.layout === "linear";
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
      this.exitPulseTween = this.tweens.add({
        targets: this.exitMarker,
        alpha: { from: 0.3, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      if (isLinear) {
        // Linear: exit starts locked — dimmed, no pulse, inactive
        this.exitMarker.setVisible(true);
        this.exitMarker.setFillStyle(0x555555, 0.15);
        this.exitMarker.setStrokeStyle(2, 0x555555);
        this.exitPulseTween.pause();
        this.exitMarker.setAlpha(0.2);
        this.exitActive = false;
      } else {
        // Open: exit always active
        this.exitMarker.setVisible(true);
        this.exitActive = true;
      }
    }

    // Create player at spawn or saved position
    const spawnEntity = entities.find(e => e.type === "spawn");
    const startX = this.playerStartPos?.x ?? spawnEntity?.x ?? 1;
    const startY = this.playerStartPos?.y ?? spawnEntity?.y ?? 1;
    this.player = new Player(this, startX, startY, terrain, this.squadLeaderClass || "vanguard");

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

  renderTilemap(terrain, width, height) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < terrain[y].length; x++) {
        const tileType = terrain[y][x];
        const sprite = this.add.sprite(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          this.tilesetKey,
          tileType  // frame index matches TILE constant
        );
        sprite.setDepth(0);
      }
    }
  }

  onPlayerStep(data) {
    // Check for exit tile
    if (data.tile === TILE.EXIT && this.exitActive) {
      this.eventBridge.emit("map:exit", {
        stepsTotal: data.stepCount,
        encounterState: this.encounterSystem.getState(),
      });
      return;
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

    // On linear maps: activate exit once all encounters are cleared
    if (!this.exitActive && this.encounterSystem.isComplete() && this.exitMarker) {
      this.exitActive = true;
      this.exitMarker.setFillStyle(0xffa502, 0.3);
      this.exitMarker.setStrokeStyle(2, 0xffa502);
      this.exitMarker.setAlpha(0.3);
      if (this.exitPulseTween) this.exitPulseTween.resume();
      // Brief flash to draw attention to the now-active exit
      this.cameras.main.flash(200, 255, 165, 2, true);
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
