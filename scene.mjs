// The playroom, from the photo sent on 2026-09-26.
// Scale: 1 stud ≈ 10 cm, 1 plate ≈ 4 cm. The baseplate is the carpet.
// x runs left to right, z runs from the back wall to the front.
//
//   back wall (z=0): grey floral wallpaper      right wall (x=31): blue
//   bookshelf cubes against the back wall, a wicker basket on top
//   play kitchen front-left: tall wooden back panel with a window,
//     pale aqua cabinet, grey counter with sink and tap
//   market stall in the middle: yellow crate with six compartments and
//     three chalkboards, green shelf with a coffee machine and scales,
//     painted vegetable banner on top
//   terracotta cushion by the right wall, toy food shelf front-right
//   toys scattered on the floor: the game is to tidy them into the crate

import { rect, ring, union, minus, paint, rng } from './lib/cells.mjs';

export const PLAYER_START = [12, 24];
export const STALL = { x0: 13, z0: 10, x1: 22, z1: 14 };
// Crate compartments, where tidied toys go (cells without fruit).
export const CRATE_FLOOR_Y = 10;

const TAN = 19, WHITE = 15, YELLOW = 14, BLACK = 0, RED = 4, ORANGE = 25, LIME = 27, GREEN = 2;
const BOOK_COLORS = [RED, 1, YELLOW, WHITE, GREEN, ORANGE, 322, BLACK, 191, 320];

export function describe(S) {
  const R = rng(20260926);
  const pick = (list) => list[Math.floor(R() * list.length)];

  // Walls: 12 courses. The corner stud alternates between walls to tie them.
  S.object('walls');
  for (let i = 0; i < 12; i++) {
    const cells = [];
    for (let x = 0; x <= 30; x++) cells.push([x, 0, i % 2 === 0 && (x + 3 * i) % 7 === 2 ? WHITE : 71]);
    cells.push([31, 0, i % 2 === 0 ? 71 : 379]);
    for (let z = 1; z <= 31; z++) cells.push([31, z, 379]);
    S.fill('brick', i * 3, cells);
  }
  S.fill('tile', 36, union(rect(0, 0, 31, 0), rect(31, 1, 31, 31)), WHITE);

  // Cushion by the right wall.
  S.object('rug');
  S.fill('plate', 0, rect(23, 4, 30, 9), 484);

  // Bookshelf: two cubes below, two above, basket on top.
  S.object('bookshelf');
  S.fill('plate', 0, rect(2, 1, 17, 3), TAN);
  for (let c = 0; c < 3; c++) {
    const y = 1 + 3 * c;
    S.fill('brick', y, [
      ...paint(union(rect(2, 1, 2, 3), rect(9, 1, 9, 3), rect(17, 1, 17, 3)), TAN),
      ...paint(rect(3, 1, 8, 1), 320),
      ...paint(rect(10, 1, 16, 1), 1),
    ]);
  }
  const book = (x, y) => {
    const col = pick(BOOK_COLORS);
    S.put('3004', col, x, 2, y, { alongZ: true });
    if (R() < 0.6) S.put('3004', col, x, 2, y + 3, { alongZ: true });
    else S.put('3023', col, x, 2, y + 3, { alongZ: true });
  };
  for (const x of [3, 4, 5, 7, 8, 10, 11, 12]) book(x, 1);
  S.fill('plate', 10, rect(2, 1, 17, 3), TAN);
  for (let c = 0; c < 3; c++) {
    const y = 11 + 3 * c;
    S.fill('brick', y, [
      ...paint(union(rect(5, 1, 5, 3), rect(10, 1, 10, 3), rect(14, 1, 14, 3)), TAN),
      ...paint(rect(6, 1, 9, 1), 320),
      ...paint(rect(11, 1, 13, 1), WHITE),
    ]);
  }
  for (const x of [6, 7, 9, 11, 12]) book(x, 11);
  S.fill('plate', 20, rect(5, 1, 14, 3), TAN);
  for (const y of [21, 24]) S.fill('brick', y, ring(6, 1, 9, 3), 70);
  S.put('3004', WHITE, 7, 2, 21);
  S.put('3004', WHITE, 7, 2, 24);
  S.put('3023', WHITE, 7, 2, 27);
  S.put('3623', RED, 11, 2, 21);
  S.put('3623', WHITE, 11, 2, 22);

  // Play kitchen.
  S.object('kitchen');
  const band = [ORANGE, YELLOW, 322, 191];
  for (let i = 0; i < 10; i++) {
    const cells = [];
    for (let x = 2; x <= 10; x++) {
      if (i >= 5 && i <= 7 && x >= 5 && x <= 7) continue; // window
      cells.push([x, 8, i === 4 ? band[x % 4] : TAN]);
    }
    if (i < 8) for (let z = 8; z <= 14; z++) cells.push([1, z, TAN]);
    S.fill('brick', i * 3, cells);
  }
  S.fill('tile', 24, rect(1, 8, 1, 14), TAN);
  S.fill('tile', 30, rect(2, 8, 10, 8), TAN);
  for (let i = 0; i < 4; i++) {
    let cells = ring(3, 9, 9, 12);
    if (i === 1 || i === 2) cells = minus(cells, rect(5, 12, 7, 12)); // cupboard opening
    S.fill('brick', i * 3, cells, 323);
  }
  S.fill('plate', 12, rect(3, 9, 9, 12), 71);
  S.fill('tile', 13, [
    ...paint(minus(rect(3, 9, 9, 12), rect(5, 10, 7, 11), [[6, 9]]), 71),
    ...paint(rect(5, 10, 7, 11), 72),
  ]);
  S.put('3062b', 179, 6, 9, 13); // tap
  S.put('3023', 179, 6, 9, 16, { alongZ: true }); // spout over the sink

  // Market stall.
  S.object('stall');
  const { x0, z0, x1, z1 } = STALL;
  const posts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
  S.fill('brick', 0, union(posts, rect(x0 + 1, z0, x1 - 1, z0), rect(x0 + 1, z1, x1 - 1, z1)), TAN);
  for (const y of [3, 6]) S.fill('brick', y, posts, TAN);
  S.fill('plate', 9, rect(x0, z0, x1, z1), YELLOW);
  const crate = union(ring(x0, z0, x1, z1), rect(16, 11, 16, 13), rect(19, 11, 19, 13), rect(14, 12, 21, 12));
  const chalk = new Set(['14,14', '15,14', '17,14', '18,14', '20,14', '21,14']);
  for (const [i, y] of [10, 13].entries())
    S.fill('brick', y, crate.map(([x, z]) => [x, z, i === 0 && chalk.has(`${x},${z}`) ? BLACK : YELLOW]));
  for (const [x, z, c] of [[14, 11, RED], [15, 11, RED], [17, 13, ORANGE], [20, 11, LIME], [21, 13, GREEN], [18, 11, YELLOW]])
    S.put('4073', c, x, z, CRATE_FLOOR_Y);
  for (const y of [16, 19]) S.fill('brick', y, posts, TAN);
  S.fill('plate', 22, rect(x0, z0, x1, z1), 378);
  for (const y of [23, 26]) S.fill('brick', y, rect(14, 10, 16, 11), WHITE); // coffee machine
  S.put('4073', ORANGE, 15, 10, 29);
  S.put('3062b', WHITE, 15, 12, 23); // cup
  S.put('3022', WHITE, 18, 10, 23); // scales
  S.put('3068b', WHITE, 18, 10, 24);
  S.put('4073', WHITE, 19, 12, 23); // bowl
  for (const y of [23, 26, 29]) S.fill('brick', y, posts, TAN);
  S.fill('plate', 32, rect(x0, z0, x1, z1), TAN);
  const bannerRows = [
    [WHITE, RED, WHITE, ORANGE, WHITE, LIME, WHITE, YELLOW, WHITE, GREEN],
    [WHITE, WHITE, ORANGE, WHITE, RED, WHITE, GREEN, WHITE, LIME, WHITE],
  ];
  for (const [i, y] of [33, 36].entries())
    S.fill('brick', y, rect(x0, z1, x1, z1).map(([x, z]) => [x, z, bannerRows[i][x - x0]]));
  S.fill('tile', 39, rect(x0, z1, x1, z1), WHITE);

  // Toy food shelf, front right.
  S.object('toyshelf');
  for (const y of [0, 3]) S.fill('brick', y, union(ring(23, 21, 29, 26), rect(26, 22, 26, 25)), TAN);
  S.put('4073', YELLOW, 24, 22, 0);
  S.put('3024', YELLOW, 25, 24, 0);
  S.put('4073', 26, 27, 23, 0);
  S.put('4073', ORANGE, 28, 25, 0);
  S.put('3062b', 322, 29, 21, 6); // tin
  S.put('3062b', 322, 29, 21, 9);
  S.put('98138', 322, 29, 21, 12);

  // Toys on the floor: the game's collectibles.
  S.object('toys');
  S.put('3005', RED, 16, 21, 0, { toy: 'Red block' });
  S.put('4073', BLACK, 6, 16, 0, { toy: 'Spider' });
  S.put('3062b', YELLOW, 9, 18, 0, { toy: 'Corn' });
  S.put('3023', YELLOW, 3, 17, 0, { toy: 'Banana' });
  S.put('4073', 26, 20, 27, 0, { toy: 'Aubergine' });
}

export const OBJECT_LABELS = {
  walls: 'Walls',
  rug: 'Cushion',
  bookshelf: 'Bookshelf',
  kitchen: 'Play kitchen',
  stall: 'Market stall',
  toyshelf: 'Toy food shelf',
  toys: 'Toys',
};
