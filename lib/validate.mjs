// Independent checks on the finished part list. Nothing here trusts the packer.

import { PARTS } from './catalog.mjs';

export function validate(parts, steps, size = 32) {
  const issues = [];

  // 1. Collisions and bounds, on a fresh occupancy grid.
  const occ = new Map();
  let collisions = 0;
  parts.forEach((p, i) => {
    if (p.x < 0 || p.z < 0 || p.x + p.w > size || p.z + p.d > size || p.y < 0)
      issues.push(`part ${i} (${p.part}) is outside the baseplate`);
    for (let x = p.x; x < p.x + p.w; x++)
      for (let z = p.z; z < p.z + p.d; z++)
        for (let k = 0; k < p.h; k++) {
          const key = `${x},${p.y + k},${z}`;
          if (occ.has(key)) {
            collisions++;
            issues.push(`parts ${occ.get(key)} and ${i} overlap at ${key}`);
          } else occ.set(key, i);
        }
  });

  // 2. Stud connections. A part grips the studs of any studded part whose top
  //    is exactly at its bottom, wherever the footprints overlap.
  const tops = new Map();
  parts.forEach((p, i) => {
    if (!PARTS[p.part].studs) return;
    for (let x = p.x; x < p.x + p.w; x++)
      for (let z = p.z; z < p.z + p.d; z++) tops.set(`${x},${p.y + p.h},${z}`, i);
  });
  const below = parts.map(() => new Set());
  const adj = parts.map(() => new Set());
  const grounded = parts.map((p) => p.y === 0);
  let studConnections = 0;
  parts.forEach((p, i) => {
    for (let x = p.x; x < p.x + p.w; x++)
      for (let z = p.z; z < p.z + p.d; z++) {
        if (p.y === 0) {
          studConnections++;
          continue;
        }
        const j = tops.get(`${x},${p.y},${z}`);
        if (j !== undefined) {
          studConnections++;
          below[i].add(j);
          adj[i].add(j);
          adj[j].add(i);
        }
      }
  });

  // 3. Everything must hang together through the baseplate.
  const reached = new Array(parts.length).fill(false);
  const queue = [];
  grounded.forEach((g, i) => {
    if (g) {
      reached[i] = true;
      queue.push(i);
    }
  });
  while (queue.length) {
    const i = queue.pop();
    for (const j of adj[i]) if (!reached[j]) (reached[j] = true), queue.push(j);
  }
  const floating = reached.filter((r) => !r).length;
  if (floating) issues.push(`${floating} parts are not connected to the baseplate`);

  // 4. Buildable in instruction order: when a part goes on, it must click onto
  //    the baseplate or onto a part placed before it.
  const order = new Array(parts.length).fill(-1);
  let n = 0;
  for (const s of steps) for (const i of s.parts) order[i] = n++;
  const missing = order.filter((o) => o < 0).length;
  if (missing) issues.push(`${missing} parts are missing from the instructions`);
  let unbuildable = 0;
  parts.forEach((p, i) => {
    if (grounded[i]) return;
    const ok = [...below[i]].some((j) => order[j] < order[i]);
    if (!ok) {
      unbuildable++;
      issues.push(`part ${i} (${p.part} in ${p.obj}) has nothing to click onto when it is placed`);
    }
  });

  // 5. Balance: each object's centre of mass must sit over its ground footprint.
  const balance = {};
  const objs = [...new Set(parts.map((p) => p.obj))];
  for (const obj of objs) {
    const mine = parts.filter((p) => p.obj === obj);
    let m = 0, cx = 0, cz = 0;
    for (const p of mine) {
      const v = p.w * p.d * p.h;
      m += v;
      cx += v * (p.x + p.w / 2);
      cz += v * (p.z + p.d / 2);
    }
    cx /= m;
    cz /= m;
    const ground = mine.filter((p) => p.y === 0);
    const x0 = Math.min(...ground.map((p) => p.x)), x1 = Math.max(...ground.map((p) => p.x + p.w));
    const z0 = Math.min(...ground.map((p) => p.z)), z1 = Math.max(...ground.map((p) => p.z + p.d));
    const inside = cx >= x0 && cx <= x1 && cz >= z0 && cz <= z1;
    balance[obj] = { com: [+cx.toFixed(2), +cz.toFixed(2)], footprint: [x0, z0, x1, z1], inside };
    if (!inside) issues.push(`${obj}: centre of mass is outside its footprint`);
  }

  // 6. Interlock: share of stacked parts that grip two or more parts below.
  const stacked = parts.filter((p, i) => !grounded[i] && p.w * p.d > 1);
  const bonded = stacked.filter((p) => below[parts.indexOf(p)].size >= 2).length;

  return {
    ok: issues.length === 0,
    parts: parts.length,
    studConnections,
    collisions,
    floating,
    unbuildable,
    steps: steps.length,
    bondedShare: stacked.length ? bonded / stacked.length : 1,
    balance,
    issues,
  };
}
