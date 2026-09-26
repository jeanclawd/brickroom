// LEGO parts the packer and the scene may use.
// L is the long side, W the short side, both in studs; h is the height in plates.
// In the LDraw files every part below has its long side along X.
// LDraw and BrickLink share these part numbers; BrickLink also lists 4073 as 6141.

export const PARTS = {
  // Bricks
  '3005': { name: 'Brick 1 x 1', kind: 'brick', L: 1, W: 1, h: 3, studs: true },
  '3004': { name: 'Brick 1 x 2', kind: 'brick', L: 2, W: 1, h: 3, studs: true },
  '3622': { name: 'Brick 1 x 3', kind: 'brick', L: 3, W: 1, h: 3, studs: true },
  '3010': { name: 'Brick 1 x 4', kind: 'brick', L: 4, W: 1, h: 3, studs: true },
  '3009': { name: 'Brick 1 x 6', kind: 'brick', L: 6, W: 1, h: 3, studs: true },
  '3008': { name: 'Brick 1 x 8', kind: 'brick', L: 8, W: 1, h: 3, studs: true },
  '3003': { name: 'Brick 2 x 2', kind: 'brick', L: 2, W: 2, h: 3, studs: true },
  '3002': { name: 'Brick 2 x 3', kind: 'brick', L: 3, W: 2, h: 3, studs: true },
  '3001': { name: 'Brick 2 x 4', kind: 'brick', L: 4, W: 2, h: 3, studs: true },
  '2456': { name: 'Brick 2 x 6', kind: 'brick', L: 6, W: 2, h: 3, studs: true },
  '3007': { name: 'Brick 2 x 8', kind: 'brick', L: 8, W: 2, h: 3, studs: true },
  // Plates
  '3024': { name: 'Plate 1 x 1', kind: 'plate', L: 1, W: 1, h: 1, studs: true },
  '3023': { name: 'Plate 1 x 2', kind: 'plate', L: 2, W: 1, h: 1, studs: true },
  '3623': { name: 'Plate 1 x 3', kind: 'plate', L: 3, W: 1, h: 1, studs: true },
  '3710': { name: 'Plate 1 x 4', kind: 'plate', L: 4, W: 1, h: 1, studs: true },
  '3666': { name: 'Plate 1 x 6', kind: 'plate', L: 6, W: 1, h: 1, studs: true },
  '3460': { name: 'Plate 1 x 8', kind: 'plate', L: 8, W: 1, h: 1, studs: true },
  '3022': { name: 'Plate 2 x 2', kind: 'plate', L: 2, W: 2, h: 1, studs: true },
  '3021': { name: 'Plate 2 x 3', kind: 'plate', L: 3, W: 2, h: 1, studs: true },
  '3020': { name: 'Plate 2 x 4', kind: 'plate', L: 4, W: 2, h: 1, studs: true },
  '3795': { name: 'Plate 2 x 6', kind: 'plate', L: 6, W: 2, h: 1, studs: true },
  '3034': { name: 'Plate 2 x 8', kind: 'plate', L: 8, W: 2, h: 1, studs: true },
  '3031': { name: 'Plate 4 x 4', kind: 'plate', L: 4, W: 4, h: 1, studs: true },
  '3032': { name: 'Plate 4 x 6', kind: 'plate', L: 6, W: 4, h: 1, studs: true },
  '3035': { name: 'Plate 4 x 8', kind: 'plate', L: 8, W: 4, h: 1, studs: true },
  // Tiles (smooth top: nothing can attach on top)
  '3070b': { name: 'Tile 1 x 1', kind: 'tile', L: 1, W: 1, h: 1, studs: false },
  '3069b': { name: 'Tile 1 x 2', kind: 'tile', L: 2, W: 1, h: 1, studs: false },
  '63864': { name: 'Tile 1 x 3', kind: 'tile', L: 3, W: 1, h: 1, studs: false },
  '2431': { name: 'Tile 1 x 4', kind: 'tile', L: 4, W: 1, h: 1, studs: false },
  '6636': { name: 'Tile 1 x 6', kind: 'tile', L: 6, W: 1, h: 1, studs: false },
  '3068b': { name: 'Tile 2 x 2', kind: 'tile', L: 2, W: 2, h: 1, studs: false },
  '87079': { name: 'Tile 2 x 4', kind: 'tile', L: 4, W: 2, h: 1, studs: false },
  // Round parts: placed by hand, never by the packer
  '4073': { name: 'Plate Round 1 x 1', kind: 'round', L: 1, W: 1, h: 1, studs: true, round: true },
  '3062b': { name: 'Brick Round 1 x 1', kind: 'round', L: 1, W: 1, h: 3, studs: true, round: true },
  '98138': { name: 'Tile Round 1 x 1', kind: 'round', L: 1, W: 1, h: 1, studs: false, round: true },
};

export const BASEPLATE = { id: '3811', name: 'Baseplate 32 x 32', size: 32 };

// LDraw colour code -> display name, hex (LDraw config), BrickLink colour id.
// Check the BrickLink ids before placing a real order.
export const COLORS = {
  0: { name: 'Black', hex: '#1B2A34', bl: 11 },
  1: { name: 'Blue', hex: '#1E5AA8', bl: 7 },
  2: { name: 'Green', hex: '#00852B', bl: 6 },
  4: { name: 'Red', hex: '#B40000', bl: 5 },
  14: { name: 'Yellow', hex: '#FAC80A', bl: 3 },
  15: { name: 'White', hex: '#F4F4F4', bl: 1 },
  19: { name: 'Tan', hex: '#D7BA8C', bl: 2 },
  25: { name: 'Orange', hex: '#D67923', bl: 4 },
  26: { name: 'Magenta', hex: '#901F76', bl: 71 },
  27: { name: 'Lime', hex: '#A5CA18', bl: 34 },
  70: { name: 'Reddish Brown', hex: '#5F3109', bl: 88 },
  71: { name: 'Light Bluish Gray', hex: '#A0A5A9', bl: 86 },
  72: { name: 'Dark Bluish Gray', hex: '#6C6E68', bl: 85 },
  179: { name: 'Flat Silver', hex: '#898788', bl: 95 },
  191: { name: 'Bright Light Orange', hex: '#FCAC00', bl: 110 },
  320: { name: 'Dark Red', hex: '#720012', bl: 59 },
  322: { name: 'Medium Azure', hex: '#36AEBF', bl: 156 },
  323: { name: 'Light Aqua', hex: '#ADC3C0', bl: 152 },
  378: { name: 'Sand Green', hex: '#A0BCAC', bl: 48 },
  379: { name: 'Sand Blue', hex: '#6074A1', bl: 55 },
  484: { name: 'Dark Orange', hex: '#91501C', bl: 68 },
};

export function packable(kind) {
  return Object.entries(PARTS)
    .filter(([, p]) => p.kind === kind)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.L * b.W - a.L * a.W || b.L - a.L);
}
