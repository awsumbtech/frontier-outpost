export const MISSIONS = [
  // CH1: Planetfall
  { id: "m1a", chapter: "ch1", name: "Perimeter Sweep", desc: "Clear hostiles along the outpost perimeter", encounters: 2, tier: 1, xpMult: 1, recLevel: 1, environment: "perimeter_sweep" },
  { id: "m1b", chapter: "ch1", name: "Salvage Recovery", desc: "Recover supplies from a downed cargo pod", encounters: 2, tier: 1, xpMult: 1.1, recLevel: 1, environment: "cargo_wreckage" },
  { id: "m1c", chapter: "ch1", name: "Eastern Ridge Patrol", desc: "Scout the ridge where movement was detected", encounters: 3, tier: 1, xpMult: 1.2, recLevel: 2, environment: "patrol_corridor" },
  { id: "m1d", chapter: "ch1", name: "Fauna Specimen Hunt", desc: "Collect samples for Dr. Osei's analysis", encounters: 3, tier: 1, xpMult: 1.3, recLevel: 2, environment: "crimson_clearing" },
  // CH2: Strange Signals
  { id: "m2a", chapter: "ch2", name: "Signal Source Recon", desc: "Locate the origin of underground transmissions", encounters: 3, tier: 2, xpMult: 1.5, recLevel: 3, environment: "underground_tunnels" },
  { id: "m2b", chapter: "ch2", name: "Comms Relay Defense", desc: "Protect Riley's relay while she decodes the signal", encounters: 3, tier: 2, xpMult: 1.6, recLevel: 3, environment: "comms_relay" },
  { id: "m2c", chapter: "ch2", name: "Governor's Cargo Intercept", desc: "Investigate Liang's sealed supply shipments", encounters: 4, tier: 2, xpMult: 1.8, recLevel: 4, environment: "cargo_depot" },
  { id: "m2d", chapter: "ch2", name: "Deep Tunnel Probe", desc: "Push into the tunnels beneath the eastern ridge", encounters: 4, tier: 2, xpMult: 2.0, recLevel: 4, environment: "underground_tunnels" },
  // CH3: The Hive
  { id: "m3a", chapter: "ch3", name: "Hive Perimeter Breach", desc: "Force entry into the outer hive tunnels", encounters: 4, tier: 3, xpMult: 2.2, recLevel: 5, environment: "hive_tunnels" },
  { id: "m3b", chapter: "ch3", name: "Drone Nest Purge", desc: "Destroy a drone production node", encounters: 4, tier: 3, xpMult: 2.4, recLevel: 5, environment: "hive_tunnels" },
  { id: "m3c", chapter: "ch3", name: "Data Core Extraction", desc: "Recover alien data from a sealed chamber", encounters: 5, tier: 3, xpMult: 2.6, recLevel: 6, environment: "hive_tunnels" },
  { id: "m3d", chapter: "ch3", name: "Liang's Lab Raid", desc: "Seize evidence from the Governor's hidden research site", encounters: 5, tier: 3, xpMult: 2.8, recLevel: 7, environment: "hidden_lab" },
  // CH4: Containment Breach
  { id: "m4a", chapter: "ch4", name: "Colony Defense", desc: "Hold the line as evolved creatures assault the colony", encounters: 5, tier: 3, xpMult: 3.0, recLevel: 7, environment: "outpost_perimeter" },
  { id: "m4b", chapter: "ch4", name: "Southern Settlement Rescue", desc: "Fight through to the cut-off southern settlers", encounters: 5, tier: 4, xpMult: 3.2, recLevel: 8, environment: "colony_perimeter" },
  { id: "m4c", chapter: "ch4", name: "Swarm Coordinator Hunt", desc: "Track and eliminate a new alpha-class creature", encounters: 4, tier: 4, xpMult: 3.5, recLevel: 9, environment: "swarm_territory" },
  { id: "m4d", chapter: "ch4", name: "Fortification Supply Run", desc: "Secure weapons cache from an overrun depot", encounters: 5, tier: 4, xpMult: 3.0, recLevel: 8, environment: "colony_perimeter" },
  // CH5: The Core
  { id: "m5a", chapter: "ch5", name: "Conduit Alpha Strike", desc: "Destroy the first power conduit feeding the Core", encounters: 5, tier: 4, xpMult: 3.5, recLevel: 9, environment: "core_conduits" },
  { id: "m5b", chapter: "ch5", name: "Conduit Beta Strike", desc: "Destroy the second power conduit under heavy guard", encounters: 6, tier: 4, xpMult: 3.8, recLevel: 10, environment: "core_conduits" },
  { id: "m5c", chapter: "ch5", name: "Conduit Gamma Strike", desc: "Destroy the final conduit deep in the hive core", encounters: 6, tier: 4, xpMult: 4.0, recLevel: 11, environment: "core_conduits" },
  { id: "m5d", chapter: "ch5", name: "The Core", desc: "Confront the alien intelligence. End this.", encounters: 7, tier: 4, xpMult: 5.0, recLevel: 12, environment: "the_core" },
];
