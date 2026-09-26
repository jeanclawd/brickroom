/* Brickroom: isometric playroom game and step-by-step build viewer.
   Reads window.BRICKROOM (written by build.mjs). Needs three.js r128 as a global. */
(function () {
  'use strict';
  const M = window.BRICKROOM;
  const PH = 0.4; // plate height in stud units
  const N = M.size;
  const $ = (id) => document.getElementById(id);

  // Renderer, scene, camera
  const canvas = $('view');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#D9E1EA');
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -300, 300);
  const target = new THREE.Vector3(15, 3, 17);
  const UP = new THREE.Vector3(0, 1, 0);
  let yaw = 0; // quarter turns
  let yawShown = 0;
  let zoom = 1;
  const camOffset = () => new THREE.Vector3(-1, 1, 1).applyAxisAngle(UP, (yawShown * Math.PI) / 2);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8b78, 0.62));
  const sun = new THREE.DirectionalLight(0xfff4e6, 0.72);
  sun.castShadow = true;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);
  sun.target.position.set(16, 0, 16);
  sun.position.set(16 - 14, 40, 16 + 22);

  // Geometry and materials
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);
  const studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.18, 12);
  const colorOf = {};
  for (const k in M.colors) colorOf[k] = new THREE.Color(M.colors[k].hex);
  const instMat = new THREE.MeshPhongMaterial({ shininess: 38, specular: 0x1c1c1c });

  // Baseplate
  const base = new THREE.Mesh(new THREE.BoxGeometry(N, 0.24, N), new THREE.MeshPhongMaterial({ color: colorOf[19], shininess: 20 }));
  base.position.set(N / 2, -0.12, N / 2);
  base.receiveShadow = true;
  scene.add(base);
  const baseStuds = new THREE.InstancedMesh(studGeo, new THREE.MeshPhongMaterial({ color: colorOf[19], shininess: 20 }), N * N);
  {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) baseStuds.setMatrixAt(i++, m.makeTranslation(x + 0.5, 0.09, z + 0.5));
    baseStuds.receiveShadow = true;
    scene.add(baseStuds);
  }

  // Which step each part belongs to
  const stepOf = new Array(M.parts.length).fill(0);
  M.steps.forEach((s, si) => s.p.forEach((i) => (stepOf[i] = si)));

  // Walls are grouped so the one between the camera and the room can be hidden.
  const groupOf = (p) => (p.t ? 'toys' : p.o !== 'walls' ? 'room' : p.z === 0 && p.d === 1 ? 'back' : 'right');

  function partMatrix(p) {
    const m = new THREE.Matrix4();
    const h = p.h * PH - 0.012;
    const pos = new THREE.Vector3(p.x + p.w / 2, p.y * PH + h / 2 + 0.006, p.z + p.d / 2);
    const scl = p.r ? new THREE.Vector3(0.96, h, 0.96) : new THREE.Vector3(p.w - 0.03, h, p.d - 0.03);
    return m.compose(pos, new THREE.Quaternion(), scl);
  }
  function studCells(p) {
    const out = [];
    if (!p.s) return out;
    for (let x = p.x; x < p.x + p.w; x++) for (let z = p.z; z < p.z + p.d; z++) out.push([x + 0.5, (p.y + p.h) * PH + 0.09, z + 0.5]);
    return out;
  }

  // Instanced meshes, instances sorted by step so build mode can show a prefix.
  const layers = {}; // group -> {meshes:[{mesh, steps:[]}]}
  function buildInstanced() {
    const buckets = {};
    const push = (g, shape, step, matrix, color) => {
      const k = g + '|' + shape;
      (buckets[k] = buckets[k] || []).push({ step, matrix, color });
    };
    M.parts.forEach((p, i) => {
      const g = groupOf(p);
      push(g, p.r ? 'cyl' : 'box', stepOf[i], partMatrix(p), colorOf[p.c]);
      const m = new THREE.Matrix4();
      for (const [x, y, z] of studCells(p)) push(g, 'stud', stepOf[i], m.clone().makeTranslation(x, y, z), colorOf[p.c]);
    });
    for (const k in buckets) {
      const [g, shape] = k.split('|');
      const list = buckets[k].sort((a, b) => a.step - b.step);
      const geo = shape === 'box' ? boxGeo : shape === 'cyl' ? cylGeo : studGeo;
      const mesh = new THREE.InstancedMesh(geo, instMat, list.length);
      list.forEach((it, i) => {
        mesh.setMatrixAt(i, it.matrix);
        mesh.setColorAt(i, it.color);
      });
      mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = shape !== 'stud';
      mesh.receiveShadow = true;
      scene.add(mesh);
      (layers[g] = layers[g] || []).push({ mesh, steps: list.map((it) => it.step) });
    }
  }
  buildInstanced();

  // Show steps [0, n) in the instanced meshes.
  function showSteps(n) {
    for (const g in layers)
      for (const L of layers[g]) {
        let lo = 0, hi = L.steps.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (L.steps[mid] < n) lo = mid + 1;
          else hi = mid;
        }
        L.mesh.count = lo;
      }
  }

  // A single part as normal meshes (toys, and the parts of the current build step).
  function makePart(p) {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: colorOf[p.c], shininess: 38, specular: 0x1c1c1c });
    const body = new THREE.Mesh(p.r ? cylGeo : boxGeo, mat);
    body.applyMatrix4(partMatrix(p));
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    for (const [x, y, z] of studCells(p)) {
      const s = new THREE.Mesh(studGeo, mat);
      s.position.set(x, y, z);
      s.castShadow = true;
      g.add(s);
    }
    return g;
  }

  // Minifig
  const fig = new THREE.Group();
  const figMat = (hex) => new THREE.MeshPhongMaterial({ color: hex, shininess: 45, specular: 0x222222 });
  const addBox = (parent, w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(boxGeo, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.24, 1.3, 0);
  legR.position.set(0.24, 1.3, 0);
  addBox(legL, 0.44, 1.3, 0.62, 0, -0.65, 0, figMat('#1E5AA8'));
  addBox(legR, 0.44, 1.3, 0.62, 0, -0.65, 0, figMat('#1E5AA8'));
  fig.add(legL, legR);
  addBox(fig, 0.96, 0.24, 0.62, 0, 1.42, 0, figMat('#1E5AA8'));
  addBox(fig, 1.12, 1.25, 0.62, 0, 2.17, 0, figMat('#00852B'));
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.68, 2.65, 0);
  armR.position.set(0.68, 2.65, 0);
  addBox(armL, 0.26, 0.95, 0.34, 0, -0.45, 0, figMat('#00852B'));
  addBox(armR, 0.26, 0.95, 0.34, 0, -0.45, 0, figMat('#00852B'));
  addBox(armL, 0.24, 0.2, 0.3, 0, -1.0, 0.05, figMat('#FAC80A'));
  addBox(armR, 0.24, 0.2, 0.3, 0, -1.0, 0.05, figMat('#FAC80A'));
  fig.add(armL, armR);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.72, 20), figMat('#FAC80A'));
  head.position.set(0, 3.2, 0);
  head.castShadow = true;
  fig.add(head);
  addBox(fig, 0.9, 0.3, 0.9, 0, 3.66, -0.05, figMat('#5F3109'));
  addBox(fig, 0.9, 0.5, 0.25, 0, 3.4, -0.4, figMat('#5F3109'));
  const eyeMat = figMat('#1B2A34');
  addBox(fig, 0.09, 0.12, 0.05, -0.15, 3.28, 0.39, eyeMat);
  addBox(fig, 0.09, 0.12, 0.05, 0.15, 3.28, 0.39, eyeMat);
  scene.add(fig);

  // Game state
  const walk = M.walk.map((r) => r.split('').map(Number));
  const toys = [];
  M.parts.forEach((p, i) => {
    if (!p.t) return;
    const mesh = makePart(p);
    scene.add(mesh);
    toys.push({ i, p, name: p.t, mesh, state: 'floor' });
  });
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), new THREE.MeshBasicMaterial({ color: '#FAC80A' }));
  marker.rotation.x = Math.PI;
  const markers = toys.map(() => marker.clone());
  markers.forEach((m) => scene.add(m));

  let mode = 'play';
  let player, path, carrying, tweens, slotIdx, moves, won;
  function resetGame() {
    player = { x: M.start[0], z: M.start[1], px: M.start[0] + 0.5, pz: M.start[1] + 0.5, face: Math.PI };
    path = [];
    carrying = [];
    tweens = [];
    slotIdx = 0;
    moves = 0;
    won = false;
    for (const t of toys) {
      t.state = 'floor';
      scene.attach(t.mesh);
      t.mesh.position.set(0, 0, 0);
      t.mesh.rotation.set(0, 0, 0);
    }
    $('win').hidden = true;
    renderToyList();
  }

  const inside = (x, z) => x >= 0 && z >= 0 && x < N && z < N;
  function route(tx, tz) {
    const prev = new Map();
    const start = player.x + ',' + player.z;
    prev.set(start, null);
    const q = [[player.x, player.z]];
    let best = [player.x, player.z];
    let bestD = Math.abs(player.x - tx) + Math.abs(player.z - tz);
    for (let qi = 0; qi < q.length; qi++) {
      const [x, z] = q[qi];
      const dd = Math.abs(x - tx) + Math.abs(z - tz);
      if (dd < bestD) (bestD = dd), (best = [x, z]);
      if (dd === 0) break;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        const k = nx + ',' + nz;
        if (!inside(nx, nz) || !walk[nz][nx] || prev.has(k)) continue;
        prev.set(k, [x, z]);
        q.push([nx, nz]);
      }
    }
    const out = [];
    let cur = best;
    while (cur && cur[0] + ',' + cur[1] !== start) {
      out.unshift(cur);
      cur = prev.get(cur[0] + ',' + cur[1]);
    }
    return out;
  }

  const S = M.stall;
  const byStall = (x, z) => x >= S.x0 - 1 && x <= S.x1 + 1 && z >= S.z0 - 1 && z <= S.z1 + 1;

  function arrive() {
    moves++;
    for (const t of toys)
      if (t.state === 'floor' && t.p.x <= player.x && player.x < t.p.x + t.p.w && t.p.z <= player.z && player.z < t.p.z + t.p.d) {
        t.state = 'carried';
        carrying.push(t);
        fig.attach(t.mesh);
        t.mesh.rotation.set(0, 0, 0);
        const k = carrying.length - 1;
        t.mesh.position.set(-(t.p.x + t.p.w / 2), 4.0 + k * 0.55 - t.p.y * PH, -(t.p.z + t.p.d / 2));
        renderToyList();
      }
    if (carrying.length && byStall(player.x, player.z)) {
      for (const t of carrying) {
        const [sx, sz] = M.slots[slotIdx++ % M.slots.length];
        const p = t.p;
        const home = new THREE.Vector3(p.x + p.w / 2, (p.y + p.h / 2) * PH, p.z + p.d / 2);
        const now = new THREE.Vector3();
        t.mesh.children[0].getWorldPosition(now);
        scene.attach(t.mesh);
        t.mesh.rotation.set(0, 0, 0);
        const from = now.sub(home);
        const cx = sx + 0.5 + (p.w > 1 ? ([14, 17, 20].includes(sx) ? 0.5 : -0.5) : 0);
        const to = new THREE.Vector3(cx, (M.crateY + p.h / 2) * PH, sz + 0.5).sub(home);
        t.mesh.position.copy(from);
        tweens.push({ mesh: t.mesh, from, to, t0: performance.now(), dur: 650 });
        t.state = 'tidied';
      }
      carrying = [];
      renderToyList();
      if (toys.every((t) => t.state === 'tidied')) {
        won = true;
        setTimeout(() => {
          $('win-moves').textContent = String(moves);
          $('win').hidden = false;
        }, 700);
      }
    }
  }

  function goTo(x, z) {
    if (mode !== 'play' || won) return;
    path = route(x, z);
  }

  // HUD
  function renderToyList() {
    const ul = $('toylist');
    ul.textContent = '';
    for (const t of toys) {
      const li = document.createElement('li');
      li.className = 'toy ' + t.state;
      const sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = M.colors[t.p.c].hex;
      li.append(sw, document.createTextNode(t.name));
      const st = document.createElement('em');
      st.textContent = t.state === 'floor' ? 'on the floor' : t.state === 'carried' ? 'carrying' : 'tidied';
      li.append(st);
      ul.append(li);
    }
    const done = toys.filter((t) => t.state === 'tidied').length;
    $('toycount').textContent = `${done} of ${toys.length} tidied`;
  }

  const fmt = (n) => n.toLocaleString('en-US');
  $('stats').textContent = `${fmt(M.stats.parts)} parts · ${fmt(M.stats.studConnections)} stud connections · ${M.stats.collisions} collisions · ${M.stats.floating} floating`;

  // Build mode
  let step = 0;
  const current = new THREE.Group();
  scene.add(current);
  const edgeMat = new THREE.LineBasicMaterial({ color: '#B40000' });
  function renderStep() {
    showSteps(step);
    current.clear();
    const now = performance.now();
    const s = M.steps[step];
    for (const i of s.p) {
      const p = M.parts[i];
      const g = makePart(p);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), edgeMat);
      e.applyMatrix4(partMatrix(p));
      e.scale.x += 0.04;
      e.scale.z += 0.04;
      g.add(e);
      g.userData.t0 = now + Math.random() * 180;
      current.add(g);
    }
    $('stepr').value = String(step + 1);
    $('steplabel').textContent = `Step ${step + 1} of ${M.steps.length}`;
    $('stepobj').textContent = M.objectLabels[s.o];
    const lots = new Map();
    for (const i of s.p) {
      const p = M.parts[i];
      const k = p.p + '|' + p.c;
      lots.set(k, (lots.get(k) || 0) + 1);
    }
    const ul = $('steplist');
    ul.textContent = '';
    for (const [k, q] of lots) {
      const [pid, c] = k.split('|');
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = 'sw';
      sw.style.background = M.colors[c].hex;
      const qty = document.createElement('b');
      qty.textContent = q + '×';
      li.append(sw, qty, document.createTextNode(` ${M.partNames[pid]}, ${M.colors[c].name}`));
      const code = document.createElement('code');
      code.textContent = pid;
      li.append(code);
      ul.append(li);
    }
  }

  function setMode(m) {
    mode = m;
    $('tab-play').setAttribute('aria-selected', String(m === 'play'));
    $('tab-build').setAttribute('aria-selected', String(m === 'build'));
    $('play-panel').hidden = m !== 'play';
    $('build-panel').hidden = m !== 'build';
    fig.visible = m === 'play';
    markers.forEach((mk) => (mk.visible = m === 'play'));
    toys.forEach((t) => (t.mesh.visible = m === 'play'));
    for (const L of layers.toys || []) L.mesh.visible = m === 'build';
    if (m === 'build') {
      renderStep();
    } else {
      current.clear();
      showSteps(Infinity);
    }
  }
  $('tab-play').onclick = () => setMode('play');
  $('tab-build').onclick = () => setMode('build');
  $('stepr').max = String(M.steps.length);
  $('stepr').oninput = (e) => {
    step = +e.target.value - 1;
    renderStep();
  };
  $('prev').onclick = () => {
    if (step > 0) step--, renderStep();
  };
  $('next').onclick = () => {
    if (step < M.steps.length - 1) step++, renderStep();
  };
  $('again').onclick = resetGame;

  // View controls
  $('rotL').onclick = () => (yaw -= 1);
  $('rotR').onclick = () => (yaw += 1);
  $('zin').onclick = () => (zoom = Math.min(4, zoom * 1.25));
  $('zout').onclick = () => (zoom = Math.max(0.5, zoom / 1.25));

  // Pointer: tap to walk, drag to pan, pinch or wheel to zoom.
  const pointers = new Map();
  let drag = null, pinch = null;
  const ray = new THREE.Raycaster();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, moved: false, target: target.clone() };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag = null;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      zoom = Math.min(4, Math.max(0.5, (pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d));
    } else if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (drag.moved) {
        const k = (cam.top - cam.bottom) / zoom / canvas.clientHeight;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
        target.copy(drag.target).addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
      }
    }
  });
  const end = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (drag && !drag.moved && pointers.size === 0) {
      const r = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      const hit = new THREE.Vector3();
      if (ray.ray.intersectPlane(floor, hit)) goTo(Math.floor(hit.x), Math.floor(hit.z));
    }
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) drag = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom = Math.min(4, Math.max(0.5, zoom * Math.exp(-e.deltaY * 0.0015)));
  }, { passive: false });

  // Keyboard: arrows or WASD move one stud, relative to the screen.
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const dirs = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const k = dirs[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!k || mode !== 'play') return;
    e.preventDefault();
    const v = new THREE.Vector3(k[0], 0, k[1]).applyAxisAngle(UP, (yaw * Math.PI) / 2);
    const nx = player.x + Math.round(v.x), nz = player.z + Math.round(v.z);
    if (inside(nx, nz) && walk[nz][nx] && !path.length) goTo(nx, nz);
  });

  // Frame loop
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const half = w < 600 ? 20 : 17;
    const a = w / h;
    Object.assign(cam, { left: -half * a, right: half * a, top: half, bottom: -half });
  }
  window.addEventListener('resize', resize);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    yawShown += (yaw - yawShown) * (reduce ? 1 : Math.min(1, dt * 9));
    const off = camOffset();
    cam.position.copy(target).addScaledVector(off, 100);
    cam.lookAt(target);
    cam.zoom += (zoom - cam.zoom) * Math.min(1, dt * 12);
    cam.updateProjectionMatrix();
    for (const L of layers.back || []) L.mesh.visible = off.z > 0.05;
    for (const L of layers.right || []) L.mesh.visible = off.x < -0.05;

    // Walking
    let walking = false;
    if (mode === 'play' && path.length) {
      const [nx, nz] = path[0];
      const tx = nx + 0.5, tz = nz + 0.5;
      const dx = tx - player.px, dz = tz - player.pz;
      const dist = Math.hypot(dx, dz);
      const stepLen = 5.5 * dt;
      player.face = Math.atan2(dx, dz);
      walking = true;
      if (dist <= stepLen) {
        player.px = tx;
        player.pz = tz;
        player.x = nx;
        player.z = nz;
        path.shift();
        arrive();
      } else {
        player.px += (dx / dist) * stepLen;
        player.pz += (dz / dist) * stepLen;
      }
    }
    fig.position.set(player.px, 0, player.pz);
    let da = player.face - fig.rotation.y;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    fig.rotation.y += da * Math.min(1, dt * 14);
    const swing = walking && !reduce ? Math.sin(now / 90) * 0.6 : 0;
    legL.rotation.x = swing;
    legR.rotation.x = -swing;
    armL.rotation.x = carrying.length ? -2.6 : -swing;
    armR.rotation.x = carrying.length ? -2.6 : swing;

    // Toy markers bob over toys still on the floor.
    toys.forEach((t, i) => {
      const m = markers[i];
      m.visible = mode === 'play' && t.state === 'floor';
      m.position.set(t.p.x + t.p.w / 2, 2.2 + (reduce ? 0 : Math.sin(now / 300 + i) * 0.25), t.p.z + t.p.d / 2);
    });

    // Tweens: toys flying into the crate
    tweens = tweens.filter((tw) => {
      const k = Math.min(1, (now - tw.t0) / tw.dur);
      tw.mesh.position.lerpVectors(tw.from, tw.to, k);
      tw.mesh.position.y += Math.sin(k * Math.PI) * 4;
      return k < 1;
    });

    // Build mode: parts of the current step drop into place.
    if (mode === 'build') {
      for (const g of current.children) {
        const k = reduce ? 1 : Math.min(1, Math.max(0, (now - g.userData.t0) / 420));
        g.position.y = (1 - k) * (1 - k) * 3;
      }
    }
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  resize();
  resetGame();
  setMode('play');
  requestAnimationFrame(tick);
})();
