// Helpers for footprints: lists of [x, z] stud cells, corners inclusive.

export function rect(x0, z0, x1, z1) {
  const out = [];
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) out.push([x, z]);
  return out;
}

export function ring(x0, z0, x1, z1) {
  return rect(x0, z0, x1, z1).filter(([x, z]) => x === x0 || x === x1 || z === z0 || z === z1);
}

const key = ([x, z]) => `${x},${z}`;

export function union(...lists) {
  const seen = new Map();
  for (const list of lists) for (const c of list) if (!seen.has(key(c))) seen.set(key(c), c);
  return [...seen.values()];
}

export function minus(list, ...remove) {
  const drop = new Set(remove.flat().map(key));
  return list.filter((c) => !drop.has(key(c)));
}

export function paint(list, color) {
  return list.map(([x, z]) => [x, z, color]);
}

// Deterministic PRNG (mulberry32) so every build gives the same model.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
