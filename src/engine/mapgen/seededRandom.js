// Mulberry32 — fast 32-bit seeded PRNG for deterministic map generation.
// Allows regenerating the same map from a seed (no need to store terrain in saves).
export function createRng(seed) {
  let s = seed | 0;
  function next() {
    s |= 0;
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  return {
    next,
    nextInt(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    nextFloat(min, max) {
      return min + next() * (max - min);
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    chance(probability) {
      return next() < probability;
    },
    seed,
  };
}
