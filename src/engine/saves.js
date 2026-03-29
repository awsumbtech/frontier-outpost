const SAVE_KEY = 'frontier-outpost-save';

export function saveGame(game) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (e) {
    console.warn('Failed to save game:', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to load game:', e);
    return null;
  }
}
