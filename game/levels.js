// FORTE — Steal the Music. Level data for the Teatro del Silenzio.
// One building, three acts that open it up in stages. All coordinates are
// in world pixels; the world is 2080 x 1280. Foyer x 40-700, stage
// x 740-1420, under-stage vault x 1460-2040. Doors between areas stay locked
// until the act's loot objective is done.

export const WORLD = { w: 2080, h: 1280 };

// [x, y, w, h] rectangles the thief cannot walk through (walls + furniture).
// Door gaps are left in the divider walls; the doors themselves are added
// by the simulation as lockable blockers.
export const BLOCKERS = [
  // Divider walls (door gap y 600-680 in each).
  { x: 700, y: 40, w: 40, h: 560, kind: 'wall' },
  { x: 700, y: 680, w: 40, h: 560, kind: 'wall' },
  { x: 1420, y: 40, w: 40, h: 560, kind: 'wall' },
  { x: 1420, y: 680, w: 40, h: 560, kind: 'wall' },
  // Foyer furniture.
  { x: 90, y: 90, w: 180, h: 60, kind: 'desk' },
  { x: 90, y: 220, w: 60, h: 200, kind: 'shelf' },
  { x: 500, y: 90, w: 160, h: 220, kind: 'stairs' },
  { x: 90, y: 980, w: 220, h: 50, kind: 'bar' },
  { x: 560, y: 980, w: 100, h: 120, kind: 'coat' },
  // Stage furniture.
  { x: 1060, y: 280, w: 50, h: 40, kind: 'podium' },
  { x: 1150, y: 650, w: 120, h: 70, kind: 'piano' },
  { x: 800, y: 150, w: 60, h: 120, kind: 'castle' },
  { x: 1300, y: 150, w: 60, h: 120, kind: 'castle' },
  // Vault area furniture.
  { x: 1500, y: 150, w: 90, h: 50, kind: 'vanity' },
  { x: 1760, y: 920, w: 240, h: 60, kind: 'safe' },
  { x: 1830, y: 700, w: 200, h: 40, kind: 'viprail' },
];

// Decor props: drawn, never blocking. type drives the drawing + label.
export const PROPS = [
  // Foyer: marble lobby, ticket desk, bar, coat room, archive corner.
  { x: 40, y: 40, w: 660, h: 1200, kind: 'floor-foyer' },
  { x: 330, y: 120, w: 120, h: 200, kind: 'carpet' },
  { x: 340, y: 620, w: 320, h: 60, kind: 'carpet' },
  { x: 180, y: 420, w: 26, h: 26, kind: 'statue' },
  { x: 620, y: 420, w: 26, h: 26, kind: 'statue' },
  { x: 180, y: 760, w: 20, h: 20, kind: 'plant' },
  { x: 620, y: 760, w: 20, h: 20, kind: 'plant' },
  { x: 90, y: 480, w: 70, h: 90, kind: 'poster', label: 'NIGHTINGALE ARIA' },
  { x: 90, y: 600, w: 70, h: 90, kind: 'poster', label: 'TONIGHT ONLY' },
  { x: 600, y: 1080, w: 70, h: 90, kind: 'poster', label: 'LA TRAVIATA' },
  { x: 300, y: 1080, w: 30, h: 30, kind: 'candle' },
  { x: 420, y: 1080, w: 30, h: 30, kind: 'candle' },
  { x: 120, y: 700, w: 90, h: 40, kind: 'bench' },
  { x: 120, y: 820, w: 90, h: 40, kind: 'bench' },
  { x: 480, y: 700, w: 90, h: 40, kind: 'bench' },
  { x: 480, y: 820, w: 90, h: 40, kind: 'bench' },
  { x: 240, y: 480, w: 40, h: 26, kind: 'papers' },
  { x: 560, y: 480, w: 40, h: 26, kind: 'papers' },
  { x: 240, y: 900, w: 40, h: 26, kind: 'luggage' },
  { x: 560, y: 900, w: 40, h: 26, kind: 'luggage' },
  // Stage: platform, curtains, pit, balcony, set pieces.
  { x: 740, y: 40, w: 680, h: 1200, kind: 'floor-stage' },
  { x: 780, y: 120, w: 600, h: 380, kind: 'platform' },
  { x: 780, y: 40, w: 600, h: 60, kind: 'balcony' },
  { x: 770, y: 120, w: 40, h: 380, kind: 'curtain' },
  { x: 1340, y: 120, w: 40, h: 380, kind: 'curtain' },
  { x: 780, y: 560, w: 600, h: 240, kind: 'pit' },
  { x: 800, y: 860, w: 580, h: 120, kind: 'stalls' },
  { x: 900, y: 300, w: 90, h: 40, kind: 'spotlight' },
  { x: 1100, y: 300, w: 90, h: 40, kind: 'spotlight' },
  { x: 820, y: 420, w: 46, h: 30, kind: 'cello' },
  { x: 1240, y: 420, w: 46, h: 30, kind: 'harp' },
  { x: 980, y: 180, w: 30, h: 90, kind: 'tree' },
  { x: 1200, y: 180, w: 30, h: 90, kind: 'tree' },
  // Vault area: corridor, costume room, VIP box, vault.
  { x: 1460, y: 40, w: 580, h: 1200, kind: 'floor-vault' },
  { x: 1460, y: 560, w: 580, h: 160, kind: 'corridor' },
  { x: 1500, y: 120, w: 300, h: 280, kind: 'costume' },
  { x: 1820, y: 700, w: 220, h: 160, kind: 'vipbox' },
  { x: 1700, y: 900, w: 340, h: 340, kind: 'vaultroom' },
  { x: 1560, y: 1000, w: 60, h: 26, kind: 'crate' },
  { x: 1560, y: 1080, w: 60, h: 26, kind: 'crate' },
  { x: 1640, y: 1040, w: 60, h: 26, kind: 'crate' },
  { x: 1520, y: 300, w: 40, h: 80, kind: 'dress' },
  { x: 1700, y: 300, w: 40, h: 80, kind: 'dress' },
  { x: 1620, y: 340, w: 26, h: 26, kind: 'mirror' },
  { x: 1900, y: 900, w: 26, h: 26, kind: 'candle' },
  { x: 1750, y: 900, w: 26, h: 26, kind: 'candle' },
];

// Curtains / drapes the thief can hide behind (alarm drains faster, cones
// read the thief at half length while inside one).
export const HIDES = [
  { x: 770, y: 120, w: 40, h: 380 },
  { x: 1340, y: 120, w: 40, h: 380 },
  { x: 660, y: 300, w: 40, h: 220 },
  { x: 1460, y: 900, w: 40, h: 200 },
];

// Loud-cover zones: the orchestra drowns out footsteps here, so running
// does not raise the alarm (drawn with flowing music notes).
export const LOUD_ZONES = [
  { x: 780, y: 560, w: 600, h: 240, label: 'ORCHESTRA PIT' },
  { x: 780, y: 120, w: 600, h: 380, label: 'STAGE' },
];

export const LOOT = [
  { id: 'folio', name: "The Lost Verdi Requiem Folio", act: 1, x: 140, y: 330, value: 300, icon: 'folio',
    line: 'You stole the lost Requiem. Verdi will never know it was found.' },
  { id: 'applause', name: 'The First Applause Recording', act: 1, x: 330, y: 1005, value: 250, icon: 'disc',
    line: 'You stole the applause. The audience will never know.' },
  { id: 'bell', name: 'The Mute Bell of Saint Cecilia', act: 1, x: 200, y: 140, value: 200, icon: 'bell',
    line: 'A bell that makes no sound. The perfect loot for a sound thief.' },
  { id: 'fork', name: "The Conductor's Diamond Tuning Fork", act: 2, x: 1085, y: 265, value: 1000, icon: 'fork',
    line: 'The Diamond Tuning Fork! The whole hall hums — alarm +15.' },
  { id: 'violin', name: "The 'Red Duchess' Stradivarius", act: 2, x: 900, y: 680, value: 800, icon: 'violin',
    line: 'The Red Duchess, warm as a held note. Careful — it almost sings.' },
  { id: 'cylinder', name: 'The Nightingale Aria Wax Cylinder', act: 3, x: 1900, y: 1080, value: 900, icon: 'cylinder',
    line: 'The master recording. The first Nightingale Aria, in your bag.' },
  { id: 'earring', name: "The Diva's Pearl Earring (Left)", act: 3, x: 1620, y: 200, value: 500, icon: 'pearl',
    line: 'One pearl earring. She will blame the right ear for the rest of the run.' },
  { id: 'baton', name: 'The Golden Baton of Maestro Bellini', act: 3, x: 1860, y: 740, value: 600, icon: 'baton',
    line: 'The Golden Baton. Tonight, you conduct the silence.' },
];

export const USHERS = [
  { name: 'Bruno', act: 1, x: 380, y: 300, waypoints: [[380, 300], [380, 900]], speed: 62 },
  { name: 'Celia', act: 1, x: 560, y: 250, waypoints: [[560, 250], [620, 600], [400, 600]], speed: 58 },
  { name: 'Dario', act: 2, x: 850, y: 480, waypoints: [[850, 480], [1330, 480]], speed: 70 },
  { name: 'Elif', act: 2, x: 850, y: 700, waypoints: [[850, 700], [1300, 700]], speed: 66 },
  { name: 'Felix', act: 2, x: 720, y: 640, waypoints: [[720, 640]], speed: 0, watch: true },
  { name: 'Greta', act: 3, x: 1560, y: 640, waypoints: [[1560, 640], [2000, 640]], speed: 78 },
  { name: 'Hugo', act: 3, x: 1750, y: 950, waypoints: [[1750, 950], [2000, 950], [2000, 1200], [1750, 1200]], speed: 74 },
  { name: 'Ines', act: 3, x: 1560, y: 260, waypoints: [[1560, 260], [1750, 260]], speed: 70 },
  { name: 'Jules', act: 3, x: 1500, y: 900, waypoints: [[1500, 900], [1500, 1200]], speed: 72 },
];

// The Diva: Act 3, stands in the VIP box, never patrols. Her 100-degree
// cone is the widest in the game; seen for >1s she screams (+50 alarm).
export const DIVA = { name: 'La Diva', act: 3, x: 1930, y: 790, angle: Math.PI / 2, sweep: 0.7 };

export const CAMERAS = [
  { name: 'Lobby Dome', act: 1, x: 380, y: 90, center: Math.PI / 2, arc: 2.1, speed: 0.5 },
  { name: 'Balcony Dome', act: 2, x: 1080, y: 70, center: Math.PI / 2, arc: 2.1, speed: 0.6 },
  { name: 'Stage Dome', act: 2, x: 1300, y: 520, center: Math.PI * 0.75, arc: 1.6, speed: 0.8 },
  { name: 'Corridor Dome', act: 3, x: 1600, y: 600, center: Math.PI / 2, arc: 2.1, speed: 0.7 },
  { name: 'Vault Dome', act: 3, x: 1900, y: 920, center: 0, arc: Math.PI * 2, speed: 0.25 },
  { name: 'Costume Dome', act: 3, x: 1650, y: 420, center: Math.PI / 2, arc: 1.75, speed: 0.9 },
];

export const ACTS = [
  { n: 1, title: 'Act 1 — "Overture"', room: 'Foyer & Lobby',
    objective: 'Steal the 3 foyer artifacts, then reach the stage door',
    spawn: { x: 200, y: 1150 }, door: 1, lootIds: ['folio', 'applause', 'bell'] },
  { n: 2, title: 'Act 2 — "The Stage"', room: 'Stage & Orchestra',
    objective: 'Steal the Diamond Tuning Fork and the Red Duchess',
    spawn: { x: 780, y: 640 }, door: 2, lootIds: ['fork', 'violin'] },
  { n: 3, title: 'Act 3 — "Encore"', room: 'Vault & the Diva’s Box',
    objective: 'Steal the Wax Cylinder, the Pearl and the Baton, then escape',
    spawn: { x: 1500, y: 640 }, door: 0, lootIds: ['cylinder', 'earring', 'baton'] },
];

// Doors between areas: [x, y, w, h], locked until their act is done.
export const DOORS = [
  { id: 1, x: 700, y: 600, w: 40, h: 80, label: 'STAGE DOOR' },
  { id: 2, x: 1420, y: 600, w: 40, h: 80, label: 'VAULT DOOR' },
];

// The emergency exit (lobby). Opens once the Fork + the Wax Cylinder are
// both stolen; reaching it wins the game.
export const EXIT = { x: 60, y: 1150, w: 80, h: 60, label: 'EMERGENCY EXIT' };

export const ACT_TIME = 300; // seconds per act
export const TILE = 48; // one tile, for the "within 6 tiles" throw range
