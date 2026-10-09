const KEY = 'wear-the-bear-save-v1';
export function saveWorld(world, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, JSON.stringify(world.serialize())); return true; } catch { return false; }
}
export function loadWorld(world, storage = globalThis.localStorage) {
  try { const raw = storage?.getItem(KEY); return raw ? world.restore(JSON.parse(raw)) : false; } catch { return false; }
}
export function clearSave(storage = globalThis.localStorage) { try { storage?.removeItem(KEY); return true; } catch { return false; } }
