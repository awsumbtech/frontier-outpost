import { useRef, useEffect } from "react";
import Phaser from "phaser";
import { createPhaserConfig } from "./config/phaserConfig";
import MapScene from "./scenes/MapScene";
import TransitionScene from "./scenes/TransitionScene";

// React wrapper for the Phaser game instance.
// Manages Phaser lifecycle within React's component lifecycle.
export default function PhaserGame({ mapData, eventBridge, active, playerPos }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const mapDataRef = useRef(mapData);
  const playerPosRef = useRef(playerPos);

  // Keep refs current
  mapDataRef.current = mapData;
  playerPosRef.current = playerPos;

  // Create Phaser game on mount
  useEffect(() => {
    if (!containerRef.current || !mapDataRef.current) return;

    const config = createPhaserConfig(containerRef.current);
    // Don't auto-start scenes — add them manually and start with data
    config.scene = [];

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Wait for boot, then add and start scenes with data
    game.events.once("ready", () => {
      game.scene.add("MapScene", MapScene, false);
      game.scene.add("TransitionScene", TransitionScene, false);
      game.scene.start("MapScene", {
        mapData: mapDataRef.current,
        eventBridge,
        playerPos: playerPosRef.current,
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // Only mount once — map changes handled via events

  // Handle new map data (new mission or regeneration)
  useEffect(() => {
    if (!gameRef.current || !mapData) return;
    const mapScene = gameRef.current.scene.getScene("MapScene");
    if (mapScene && mapScene.scene.isActive()) {
      // Restart MapScene with new data
      mapScene.scene.restart({
        mapData,
        eventBridge,
        playerPos: playerPosRef.current,
      });
    }
  }, [mapData?.id]); // Restart when map ID changes

  // Handle active/pause state (pause during combat)
  useEffect(() => {
    if (!gameRef.current) return;
    const mapScene = gameRef.current.scene.getScene("MapScene");
    if (!mapScene) return;

    if (active) {
      if (mapScene.scene.isPaused()) {
        mapScene.scene.resume();
      }
      if (mapScene.input?.keyboard) {
        mapScene.input.keyboard.enabled = true;
      }
      // Focus canvas for keyboard input
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) canvas.focus();
    } else {
      if (!mapScene.scene.isPaused() && mapScene.scene.isActive()) {
        mapScene.scene.pause();
      }
      if (mapScene.input?.keyboard) {
        mapScene.input.keyboard.enabled = false;
      }
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: 640,
        margin: "0 auto",
        aspectRatio: "4/3",
        background: "#0a0c10",
        borderRadius: "var(--radius-md, 8px)",
        overflow: "hidden",
        border: "1px solid var(--border, #1e2536)",
      }}
      tabIndex={0}
    />
  );
}
