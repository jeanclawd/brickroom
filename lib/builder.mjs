// Turns a scene description into placed LEGO parts.
//
// Coordinates: x and z in studs (0..31 on the baseplate), y in plates above the
// baseplate top. A brick is 3 plates tall.
//
// The scene makes two kinds of requests:
//   fill(kind, y, cells, color): cover these cells at height y with bricks,
//     plates or tiles. The packer picks the part sizes.
//   put(part, color, x, z, y): place one specific part.
// Requests are applied bottom-up, so every part can look at what is under it.

import { PARTS, packable } from './catalog.mjs';

export function createScene() {
  const reqs = [];
  const objects = [];
  let obj = 'misc';
  let seq = 0;
  const S = {
    object(name) {
      obj = name;
      if (!objects.includes(name)) objects.push(name);
    },
    fill(kind, y, cells, color) {
      const painted = cells.map((c) => [c[0], c[1], c[2] ?? color]);
      reqs.push({ t: 'fill', kind, y, cells: painted, obj, seq: seq++ });
    },
    put(part, color, x, z, y, opts = {}) {
      if (!PARTS[part]) throw new Error(`unknown part ${part}`);
      reqs.push({ t: 'put', part, color, x, z, y, alongZ: !!opts.alongZ, toy: opts.toy, obj, seq: seq++ });
    },
  };
  return { S, reqs, objects };
}

const K = (x, y, z) => `${x},${y},${z}`;

export function realize(reqs) {
  const parts = [];
  const occ = new Map(); // "x,y,z" (one plate-sized cell) -> part index

  const isFree = (x, z, y, h) => {
    for (let k = 0; k < h; k++) if (occ.has(K(x, y + k, z))) return false;
    return true;
  };
  const add = (p) => {
    const i = parts.length;
    parts.push(p);
    for (let x = p.x; x < p.x + p.w; x++)
      for (let z = p.z; z < p.z + p.d; z++)
        for (let k = 0; k < p.h; k++) occ.set(K(x, p.y + k, z), i);
    return i;
  };
  // Parts directly under a footprint whose studs this footprint would grip.
  const partsBelow = (x, z, w, d, y) => {
    const ids = new Set();
    if (y === 0) return ids;
    for (let cx = x; cx < x + w; cx++)
      for (let cz = z; cz < z + d; cz++) {
        const id = occ.get(K(cx, y - 1, cz));
        if (id !== undefined && PARTS[parts[id].part].studs) ids.add(id);
      }
    return ids;
  };

  function pack(cells, kind, y, color, obj) {
    const h = kind === 'brick' ? 3 : 1;
    for (const [x, z] of cells)
      if (!isFree(x, z, y, h)) throw new Error(`${obj}: ${kind} at ${x},${z},y${y} collides with part ${occ.get(K(x, y, z))}`);
    const inSet = new Set(cells.map(([x, z]) => `${x},${z}`));
    const covered = new Set();
    // Alternate the scan direction on every course so seams move around.
    const odd = Math.floor(y / h) % 2 === 1;
    const order = [...cells].sort((a, b) => (odd ? a[0] - b[0] || a[1] - b[1] : a[1] - b[1] || a[0] - b[0]));
    const cands = packable(kind);

    for (const [x, z] of order) {
      if (covered.has(`${x},${z}`)) continue;
      let best = null;
      let bestScore = -1;
      for (const P of cands) {
        for (const alongZ of P.L === P.W ? [false] : [false, true]) {
          const w = alongZ ? P.W : P.L;
          const d = alongZ ? P.L : P.W;
          let fits = true;
          for (let cx = x; cx < x + w && fits; cx++)
            for (let cz = z; cz < z + d && fits; cz++) {
              const k = `${cx},${cz}`;
              if (!inSet.has(k) || covered.has(k)) fits = false;
            }
          if (!fits) continue;
          const below = partsBelow(x, z, w, d, y);
          if (y > 0 && below.size === 0) continue; // would float
          let score = w * d;
          if (below.size >= 2) score *= 1.6; // bridges a seam: stronger
          else if (below.size === 1) {
            const b = parts[[...below][0]];
            if (b.x === x && b.z === z && b.w === w && b.d === d) score *= 0.4; // stacked seam on seam
          }
          if (alongZ === odd) score += 0.05;
          if (score > bestScore) {
            bestScore = score;
            best = { P, w, d };
          }
        }
      }
      if (!best) throw new Error(`${obj}: no supported part fits at ${x},${z},y${y}`);
      add({ part: best.P.id, color, x, z, y, w: best.w, d: best.d, h, obj });
      for (let cx = x; cx < x + best.w; cx++) for (let cz = z; cz < z + best.d; cz++) covered.add(`${cx},${cz}`);
    }
  }

  const sorted = [...reqs].sort((a, b) => a.y - b.y || a.seq - b.seq);
  for (const r of sorted) {
    if (r.t === 'put') {
      const P = PARTS[r.part];
      const w = r.alongZ ? P.W : P.L;
      const d = r.alongZ ? P.L : P.W;
      for (let cx = r.x; cx < r.x + w; cx++)
        for (let cz = r.z; cz < r.z + d; cz++)
          if (!isFree(cx, cz, r.y, P.h)) throw new Error(`${r.obj}: ${r.part} at ${r.x},${r.z},y${r.y} collides`);
      add({ part: r.part, color: r.color, x: r.x, z: r.z, y: r.y, w, d, h: P.h, obj: r.obj, toy: r.toy });
    } else {
      const groups = new Map();
      for (const c of r.cells) {
        if (!groups.has(c[2])) groups.set(c[2], []);
        groups.get(c[2]).push([c[0], c[1]]);
      }
      const bySize = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
      for (const [color, cells] of bySize) pack(cells, r.kind, r.y, color, r.obj);
    }
  }
  return parts;
}

// Instruction steps: one object at a time, bottom-up, at most `max` parts per step.
export function makeSteps(parts, objects, max = 10) {
  const steps = [];
  for (const obj of objects) {
    const mine = parts
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.obj === obj)
      .sort((a, b) => a.p.y - b.p.y || a.p.z - b.p.z || a.p.x - b.p.x);
    let cur = [];
    let curY = null;
    for (const { p, i } of mine) {
      if (cur.length && (p.y !== curY || cur.length >= max)) {
        steps.push({ obj, parts: cur });
        cur = [];
      }
      curY = p.y;
      cur.push(i);
    }
    if (cur.length) steps.push({ obj, parts: cur });
  }
  return steps;
}
