// Simple event emitter for React ↔ Phaser communication.
// Both React hooks and Phaser scenes hold the same EventBridge instance.
export default class EventBridge {
  constructor() {
    this._listeners = {};
  }

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return this;
  }

  off(event, fn) {
    const list = this._listeners[event];
    if (!list) return this;
    if (fn) {
      this._listeners[event] = list.filter(f => f !== fn);
    } else {
      delete this._listeners[event];
    }
    return this;
  }

  emit(event, data) {
    const list = this._listeners[event];
    if (!list) return;
    for (const fn of list) fn(data);
  }

  removeAll() {
    this._listeners = {};
  }
}
