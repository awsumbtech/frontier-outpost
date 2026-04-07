const SAVE_KEY = 'frontier-outpost-save';
const SAVE_VERSION = 2;

export function saveGame(game) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, _saveVersion: SAVE_VERSION }));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data._saveVersion || data._saveVersion < SAVE_VERSION) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Failed to load game:', e);
    return null;
  }
}
