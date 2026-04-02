import { TILE_SIZE } from "../../data/mapConstants";

// Camera management — follows the player sprite, clamped to map bounds.
export default class CameraSystem {
  constructor(scene, mapWidth, mapHeight) {
    this.scene = scene;
    this.camera = scene.cameras.main;

    // Set world bounds to map dimensions
    const worldW = mapWidth * TILE_SIZE;
    const worldH = mapHeight * TILE_SIZE;
    this.camera.setBounds(0, 0, worldW, worldH);
  }

  follow(playerSprite) {
    this.camera.startFollow(playerSprite, true, 0.1, 0.1);
  }

  stopFollow() {
    this.camera.stopFollow();
  }
}
