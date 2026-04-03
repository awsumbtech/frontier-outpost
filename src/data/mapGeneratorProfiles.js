// Per-environment map generation profiles.
// Each environment maps to a generator archetype with tuned parameters.
export const GENERATOR_PROFILES = {
  // ── CH1: Planetfall (organic) ──
  crimson_clearing: {
    archetype: "organic",
    width: 40, height: 30,
    params: {
      walkIterations: 6000,
      smoothPasses: 4,
      wallThreshold: 4,
      fillPercent: 0.45,
      encounterZonePercent: 0.15,
      encounterZoneClustering: 0.7,
      obstaclePercent: 0.03,
    },
    palette: {
      floor: "#3d2020", wall: "#1a0808", obstacle: "#5a2a1a",
      encounterZone: "#4d2828", ambient: "#ff220010",
    },
  },
  cargo_wreckage: {
    archetype: "organic",
    width: 35, height: 28,
    params: {
      walkIterations: 4500,
      smoothPasses: 3,
      wallThreshold: 4,
      fillPercent: 0.48,
      encounterZonePercent: 0.18,
      encounterZoneClustering: 0.5,
      obstaclePercent: 0.08,
    },
    palette: {
      floor: "#2a2a30", wall: "#151518", obstacle: "#44444a",
      encounterZone: "#353540", ambient: "#ff660008",
    },
  },
  eastern_ridge: {
    archetype: "organic",
    width: 45, height: 25,
    params: {
      walkIterations: 5000,
      smoothPasses: 5,
      wallThreshold: 5,
      fillPercent: 0.52,
      encounterZonePercent: 0.12,
      encounterZoneClustering: 0.8,
      obstaclePercent: 0.05,
    },
    palette: {
      floor: "#3a3025", wall: "#1e1810", obstacle: "#504030",
      encounterZone: "#453828", ambient: "#ddaa2208",
    },
  },

  // ── Circuit: Patrol / Perimeter environments ──
  patrol_corridor: {
    archetype: "circuit",
    width: 35,
    height: 28,
    params: {
      pathWidth: 3,
      shortcuts: 2,
      alcoves: 3,
      interiorDetail: 0.3,
      encounterZonePercent: 0.15,
      encounterZoneClustering: 0.7,
      obstaclePercent: 0.03,
    },
    palette: {
      floor: "#2a2a3a", wall: "#0f0f1a", obstacle: "#3a3a4a",
      encounterZone: "#4a2020", ambient: "#1a1a2e",
    },
  },
  outpost_perimeter: {
    archetype: "circuit",
    width: 42,
    height: 34,
    params: {
      pathWidth: 4,
      shortcuts: 1,
      alcoves: 4,
      interiorDetail: 0.2,
      encounterZonePercent: 0.18,
      encounterZoneClustering: 0.65,
      obstaclePercent: 0.04,
    },
    palette: {
      floor: "#252830", wall: "#101218", obstacle: "#383c48",
      encounterZone: "#3a2828", ambient: "#2244aa10",
    },
  },
  perimeter_sweep: {
    archetype: "circuit",
    width: 38,
    height: 30,
    params: {
      pathWidth: 3,
      shortcuts: 3,
      alcoves: 2,
      interiorDetail: 0.4,
      encounterZonePercent: 0.14,
      encounterZoneClustering: 0.6,
      obstaclePercent: 0.05,
    },
    palette: {
      floor: "#1e2830", wall: "#0c1018", obstacle: "#2e3c44",
      encounterZone: "#2a1e20", ambient: "#223344",
    },
  },

  // ── CH2: Strange Signals (cavern + grid) ──
  underground_tunnels: {
    archetype: "cavern",
    width: 38, height: 35,
    params: {
      tunnelCount: 5,
      tunnelWidth: 2,
      branchChance: 0.15,
      chamberCount: 4,
      chamberMinSize: 4,
      chamberMaxSize: 8,
      smoothPasses: 2,
      encounterZonePercent: 0.20,
      encounterZoneClustering: 0.6,
      obstaclePercent: 0.02,
    },
    palette: {
      floor: "#1a2030", wall: "#0a1018", obstacle: "#253040",
      encounterZone: "#1e2838", ambient: "#4488ff08",
    },
  },
  comms_relay: {
    archetype: "grid",
    width: 32, height: 28,
    params: {
      minRoomSize: 4,
      maxRoomSize: 9,
      roomCount: 6,
      corridorWidth: 1,
      extraCorridors: 2,
      encounterZonePercent: 0.12,
      encounterZoneClustering: 0.4,
      obstaclePercent: 0.04,
    },
    palette: {
      floor: "#2a2a2e", wall: "#141416", obstacle: "#3a3a40",
      encounterZone: "#333338", ambient: "#44ff4406",
    },
  },
  cargo_depot: {
    archetype: "grid",
    width: 35, height: 30,
    params: {
      minRoomSize: 5,
      maxRoomSize: 10,
      roomCount: 7,
      corridorWidth: 2,
      extraCorridors: 1,
      encounterZonePercent: 0.14,
      encounterZoneClustering: 0.5,
      obstaclePercent: 0.06,
    },
    palette: {
      floor: "#28282e", wall: "#121215", obstacle: "#444450",
      encounterZone: "#323238", ambient: "#ff880006",
    },
  },

  // ── CH3: The Hive (cavern + grid) ──
  hive_tunnels: {
    archetype: "cavern",
    width: 42, height: 38,
    params: {
      tunnelCount: 7,
      tunnelWidth: 3,
      branchChance: 0.25,
      chamberCount: 5,
      chamberMinSize: 5,
      chamberMaxSize: 10,
      smoothPasses: 3,
      encounterZonePercent: 0.25,
      encounterZoneClustering: 0.8,
      obstaclePercent: 0.02,
    },
    palette: {
      floor: "#1a1a28", wall: "#0a0a14", obstacle: "#252535",
      encounterZone: "#201e30", ambient: "#8844ff0a",
    },
  },
  hidden_lab: {
    archetype: "grid",
    width: 30, height: 30,
    params: {
      minRoomSize: 4,
      maxRoomSize: 7,
      roomCount: 8,
      corridorWidth: 1,
      extraCorridors: 3,
      encounterZonePercent: 0.16,
      encounterZoneClustering: 0.3,
      obstaclePercent: 0.05,
    },
    palette: {
      floor: "#1e2228", wall: "#0e1114", obstacle: "#2e3640",
      encounterZone: "#242a32", ambient: "#ff224408",
    },
  },

  // ── CH4: Containment Breach (grid + organic) ──
  colony_perimeter: {
    archetype: "grid",
    width: 40, height: 32,
    params: {
      minRoomSize: 5,
      maxRoomSize: 8,
      roomCount: 8,
      corridorWidth: 2,
      extraCorridors: 3,
      encounterZonePercent: 0.18,
      encounterZoneClustering: 0.6,
      obstaclePercent: 0.07,
    },
    palette: {
      floor: "#2e2622", wall: "#161210", obstacle: "#403830",
      encounterZone: "#383028", ambient: "#ff440008",
    },
  },
  swarm_territory: {
    archetype: "organic",
    width: 45, height: 35,
    params: {
      walkIterations: 7000,
      smoothPasses: 3,
      wallThreshold: 4,
      fillPercent: 0.43,
      encounterZonePercent: 0.30,
      encounterZoneClustering: 0.9,
      obstaclePercent: 0.02,
    },
    palette: {
      floor: "#2a1828", wall: "#120a14", obstacle: "#3a2238",
      encounterZone: "#351e30", ambient: "#ff00660a",
    },
  },

  // ── CH5: The Core (cavern) ──
  core_conduits: {
    archetype: "cavern",
    width: 40, height: 35,
    params: {
      tunnelCount: 4,
      tunnelWidth: 2,
      branchChance: 0.10,
      chamberCount: 3,
      chamberMinSize: 5,
      chamberMaxSize: 8,
      smoothPasses: 2,
      encounterZonePercent: 0.22,
      encounterZoneClustering: 0.7,
      obstaclePercent: 0.03,
    },
    palette: {
      floor: "#1a1828", wall: "#0a0814", obstacle: "#282638",
      encounterZone: "#221e32", ambient: "#6622ff0c",
    },
  },
  the_core: {
    archetype: "cavern",
    width: 45, height: 40,
    params: {
      tunnelCount: 6,
      tunnelWidth: 3,
      branchChance: 0.20,
      chamberCount: 6,
      chamberMinSize: 6,
      chamberMaxSize: 12,
      smoothPasses: 3,
      encounterZonePercent: 0.28,
      encounterZoneClustering: 0.85,
      obstaclePercent: 0.01,
    },
    palette: {
      floor: "#18142a", wall: "#080614", obstacle: "#241e3a",
      encounterZone: "#201a34", ambient: "#aa44ff0e",
    },
  },
};
