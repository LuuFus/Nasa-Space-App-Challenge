// The single Engine instance, reachable from any panel (e.g. to fly somewhere).
let current = null;
const waiters = [];

export function setEngine(e) {
  current = e;
  if (import.meta.env.DEV) window.__engine = e; // handy for debugging in the browser console
  if (e) while (waiters.length) waiters.shift()(e);
}
export function getEngine() { return current; }
export function whenEngine() {
  return current ? Promise.resolve(current) : new Promise((res) => waiters.push(res));
}
