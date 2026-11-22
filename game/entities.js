// FORTE — Steal the Music. Pure simulation: no DOM, no canvas, no audio.
// The browser shell (main.js) and the Node playtest both drive this module,
// so everything the game does — movement, vision cones, cameras, the Diva,
// the Mute Bag, the alarm VU meter, loot, win/lose — is testable headless.
import {
  ACTS, ACT_TIME, BLOCKERS, CAMERAS, DIVA, DOORS, EXIT, HIDES, LOOT,
  LOUD_ZONES, TILE, USHERS, WORLD,
} from './levels.js';

export const CONE_LEN = 190;
export const CONE_HALF = 0.61; // ~35 degrees
export const CAM_CONE_LEN = 230;
export const CAM_CONE_HALF = 0.52; // ~30 degrees
export const DIVA_CONE_LEN = 300;
export const DIVA_CONE_HALF = 0.87; // 50 degrees
export const CATCH_DIST = 48;

const TAU = Math.PI * 2;

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
export function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
export function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
export function pointInCone(px, py, cx, cy, angle, len, half) {
  const d = dist(px, py, cx, cy);
  if (d > len) return false;
  if (d < 24) return true;
  return Math.abs(angleDiff(angleTo(cx, cy, px, py), angle)) < half;
}

// Segment vs axis-aligned rectangle (for line of sight past blockers).
function segHitsRect(ax, ay, bx, by, r) {
  const dx = bx - ax, dy = by - ay;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, ax - r.x], [dx, r.x + r.w - ax], [-dy, ay - r.y], [dy, r.y + r.h - ay]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
export function losBlocked(ax, ay, bx, by, blockers) {
  for (const b of blockers) {
    if (b.kind === 'wall' || b.kind === 'stairs' || b.kind === 'safe' || b.kind === 'castle') {
      if (segHitsRect(ax, ay, bx, by, b)) return true;
    }
  }
  return false;
}
function circleHitsRect(x, y, rad, r) {
  const cx = clamp(x, r.x, r.x + r.w), cy = clamp(y, r.y, r.y + r.h);
  return dist(x, y, cx, cy) < rad;
}

export function createGame() {
  return {
    phase: 'menu', // menu | playing | paused | actclear | win | lose
    act: 1,
    time: 0, // seconds since the game (not the act) started
    actTimeLeft: ACT_TIME,
    alarm: 0,
    score: 0,
    lootTaken: 0,
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    bag: [null, null, null, null], // 4 Mute Bag slots: null or a sound name
    bagSounds: ['step', 'creak', 'chime', 'scream'],
    bagNext: 0,
    player: { x: 130, y: 1150, dir: -Math.PI / 2, crouch: false, moving: false, running: false, swallowing: false },
    ushers: USHERS.map((u) => ({
      ...u, angle: 0, wp: 0, state: 'patrol', suspicion: 0, unseenFor: 0,
      investigate: null, speedMul: 1, watchAngle: 0,
    })),
    diva: { ...DIVA, seen: 0, screamCd: 0, angleNow: DIVA.angle },
    cameras: CAMERAS.map((c) => ({ ...c, angle: c.center, gagged: 0, t: 0 })),
    projectiles: [], // thrown sounds flying to a point, then bursting
    bursts: [], // {x, y, t} expanding distraction rings
    doorsOpen: { 1: false, 2: false },
    exitOpen: false,
    spottedBy: null,
    spottedTimer: 0,
    message: '',
    messageTimer: 0,
    log: [],
    stats: { seen: 0, swallowed: 0, thrown: 0, caught: 0, hidden: 0 },
    loseReason: '',
    winRank: '',
    actClearTimer: 0,
    swallowTimer: 0,
    lastSeenBy: null,
    t: 0,
  };
}

export function actOf(g) { return ACTS[g.act - 1]; }
export function activeUshers(g) { return g.ushers.filter((u) => u.act <= g.act); }
export function activeCameras(g) { return g.cameras.filter((c) => c.act <= g.act); }
export function inHide(g, x, y) { return HIDES.some((h) => inRect(x, y, h)); }
export function inLoud(g, x, y) { return LOUD_ZONES.some((z) => inRect(x, y, z)); }
export function doorBlockers(g) {
  const out = [];
  for (const d of DOORS) if (!g.doorsOpen[d.id]) out.push({ ...d, kind: 'wall' });
  return out;
}
export function allBlockers(g) { return BLOCKERS.concat(doorBlockers(g)); }

function say(g, text) {
  g.message = text;
  g.messageTimer = 4;
  g.log.push(text);
  if (g.log.length > 6) g.log.shift();
}

function startAct(g, n) {
  g.act = n;
  g.actTimeLeft = ACT_TIME;
  const a = ACTS[n - 1];
  g.player.x = a.spawn.x;
  g.player.y = a.spawn.y;
  g.player.dir = -Math.PI / 2;
  g.alarm = Math.max(0, g.alarm - 20);
  for (const u of g.ushers) {
    u.state = 'patrol'; u.suspicion = 0; u.wp = 0; u.investigate = null;
    u.x = u.waypoints[0][0]; u.y = u.waypoints[0][1];
  }
  g.diva.seen = 0;
  g.projectiles = []; g.bursts = [];
  say(g, `${a.title} — ${a.room}. ${a.objective}.`);
}

export function startGame(g) {
  const fresh = createGame();
  Object.assign(g, fresh);
  g.phase = 'playing';
  startAct(g, 1);
  say(g, 'Act 1 — "Overture". Steal the 3 foyer artifacts. Hold SPACE to swallow sound.');
}

function rankFor(g) {
  const ghost = g.stats.seen === 0;
  const all = g.lootTaken === 8;
  if (ghost && all) return 'Silent Virtuoso';
  if (ghost) return 'Ghost of the Opera';
  if (all) return 'Master of Silence';
  if (g.lootTaken >= 6) return 'Seasoned Second-Story';
  return 'Noisy Amateur';
}

function caughtByGuard(g, usher) {
  g.stats.caught += 1;
  g.alarm = Math.min(100, g.alarm + 30);
  say(g, `${usher.name} grabs you! Alarm +30 — thrown back to the start of the act.`);
  if (g.stats.caught >= 3) {
    g.phase = 'lose';
    g.loseReason = 'Caught three times — the ushers escort you out in handcuffs.';
    return;
  }
  const a = ACTS[g.act - 1];
  g.player.x = a.spawn.x; g.player.y = a.spawn.y;
  for (const u of g.ushers) { u.state = 'patrol'; u.suspicion = 0; u.investigate = null; }
}

function checkActDone(g) {
  const a = ACTS[g.act - 1];
  const done = a.lootIds.every((id) => g.loot.find((l) => l.id === id).taken);
  if (!done) return;
  if (a.door) {
    g.doorsOpen[a.door] = true;
    say(g, `${a.door === 1 ? 'The stage door' : 'The vault door'} swings open. Onward!`);
  }
  if (g.act < 3) {
    g.phase = 'actclear';
    g.actClearTimer = 2.5;
  }
}

function checkExit(g) {
  const fork = g.loot.find((l) => l.id === 'fork').taken;
  const cyl = g.loot.find((l) => l.id === 'cylinder').taken;
  if (fork && cyl) g.exitOpen = true;
  if (g.exitOpen && inRect(g.player.x, g.player.y, EXIT)) {
    g.phase = 'win';
    g.score += Math.max(0, Math.round(g.actTimeLeft)) * 2; // time bonus
    if (g.stats.seen === 0) g.score += 500; // ghost bonus
    g.winRank = rankFor(g);
  }
}

export function updateGame(g, input, dt) {
  if (g.phase !== 'playing') return;
  dt = Math.min(dt, 0.05);
  g.t += dt;
  g.actTimeLeft -= dt;
  if (g.actTimeLeft <= 0) {
    g.phase = 'lose';
    g.loseReason = 'The curtain falls — you are still inside the Teatro.';
    return;
  }
  const p = g.player;
  const blockers = allBlockers(g);
  const hide = inHide(g, p.x, p.y);
  const loud = inLoud(g, p.x, p.y);

  // --- movement ---
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(mx, my);
  p.crouch = !!input.crouch;
  p.running = !!input.run && mag > 0 && !p.crouch;
  p.moving = mag > 0;
  p.swallowing = !!input.swallow;
  if (mag > 0) {
    mx /= mag; my /= mag;
    p.dir = Math.atan2(my, mx);
    const speed = p.crouch ? 95 : p.running ? 265 : 175;
    const nx = p.x + mx * speed * dt, ny = p.y + my * speed * dt;
    if (!blockers.some((b) => circleHitsRect(nx, p.y, 14, b))) p.x = nx;
    if (!blockers.some((b) => circleHitsRect(p.x, ny, 14, b))) p.y = ny;
    p.x = clamp(p.x, 54, WORLD.w - 54);
    p.y = clamp(p.y, 54, WORLD.h - 54);
  }

  // --- running noise (silenced by swallowing, or by the loud orchestra) ---
  if (p.running && !p.swallowing && !loud) g.alarm = Math.min(100, g.alarm + 5 * dt);

  // --- Mute Bag: hold SPACE to swallow sound ---
  if (p.swallowing) {
    const empty = g.bag.indexOf(null);
    if (empty !== -1 && g.alarm > 0) {
      g.swallowTimer += dt;
      if (g.swallowTimer >= 1.0) {
        g.swallowTimer = 0;
        g.bag[empty] = g.bagSounds[g.bagNext % g.bagSounds.length];
        g.bagNext += 1;
        g.alarm = Math.max(0, g.alarm - 15);
        g.stats.swallowed += 1;
        say(g, `Swallowed a sound — alarm −15. Mute Bag ${g.bag.filter(Boolean).length}/4.`);
      }
    } else if (empty === -1) {
      g.swallowTimer = 0;
    }
  } else {
    g.swallowTimer = 0;
  }

  // --- throw a stored sound (click) / discard (Q) ---
  if (input.throwAt) {
    const slot = g.bag.findIndex(Boolean);
    if (slot !== -1) {
      const tx = clamp(input.throwAt.x, p.x - TILE * 6, p.x + TILE * 6);
      const ty = clamp(input.throwAt.y, p.y - TILE * 6, p.y + TILE * 6);
      g.bag[slot] = null;
      g.stats.thrown += 1;
      g.projectiles.push({ x: p.x, y: p.y, tx, ty, t: 0, dur: 0.35 });
      say(g, 'You throw a stolen sound down the hall…');
    }
  }
  if (input.discard) {
    const slot = g.bag.findIndex(Boolean);
    if (slot !== -1) { g.bag[slot] = null; say(g, 'You let a sound go. The hall breathes again.'); }
  }

  // --- projectiles + bursts ---
  for (const pr of g.projectiles) {
    pr.t += dt;
    if (pr.t >= pr.dur) {
      g.bursts.push({ x: pr.tx, y: pr.ty, t: 0 });
      for (const u of activeUshers(g)) {
        if (dist(u.x, u.y, pr.tx, pr.ty) < 300) {
          u.state = 'investigate'; u.investigate = { x: pr.tx, y: pr.ty, t: 4 };
        }
      }
      for (const c of activeCameras(g)) {
        if (dist(c.x, c.y, pr.tx, pr.ty) < 220) c.gagged = 8;
      }
      if (dist(g.diva.x, g.diva.y, pr.tx, pr.ty) < 320) {
        g.diva.angleNow = angleTo(g.diva.x, g.diva.y, pr.tx, pr.ty);
        g.diva.seen = 0;
      }
    }
  }
  g.projectiles = g.projectiles.filter((pr) => pr.t < pr.dur);
  for (const b of g.bursts) b.t += dt;
  g.bursts = g.bursts.filter((b) => b.t < 0.9);

  // --- loot pickup (E) ---
  if (input.interact) {
    for (const l of g.loot) {
      if (!l.taken && l.act <= g.act && dist(p.x, p.y, l.x, l.y) < 44) {
        l.taken = true;
        g.lootTaken += 1;
        g.score += l.value;
        say(g, l.line);
        if (l.id === 'fork') g.alarm = Math.min(100, g.alarm + 15);
        checkActDone(g);
        checkExit(g);
        break;
      }
    }
  }

  // --- ushers ---
  const alarmBoost = g.alarm >= 40 ? 1.25 : 1;
  let anyoneSees = false;
  for (const u of activeUshers(g)) {
    const coneLen = CONE_LEN * (g.alarm >= 40 ? 1.2 : 1) * (p.crouch ? 0.6 : 1) * (hide ? 0.5 : 1);
    const sees = pointInCone(p.x, p.y, u.x, u.y, u.angle, coneLen, CONE_HALF)
      && !losBlocked(u.x, u.y, p.x, p.y, blockers);
    if (sees) {
      u.suspicion += dt;
      u.unseenFor = 0;
      if (u.suspicion > 0.4) { u.state = 'suspicious'; }
      if (u.suspicion > 1.0) {
        u.state = 'chase';
        anyoneSees = true;
        g.spottedBy = `Usher ${u.name} sees you!`;
        g.stats.seen += dt;
        g.alarm = Math.min(100, g.alarm + 20 * dt);
      }
    } else {
      u.suspicion = Math.max(0, u.suspicion - dt * 0.8);
      u.unseenFor += dt;
      if (u.state === 'suspicious' && u.suspicion <= 0.1) u.state = 'patrol';
      if (u.state === 'chase' && u.unseenFor > 2) { u.state = 'patrol'; u.suspicion = 0; }
    }
    // Movement by state.
    if (u.state === 'chase') {
      const a = angleTo(u.x, u.y, p.x, p.y);
      u.angle = a;
      const sp = 150 * alarmBoost;
      u.x += Math.cos(a) * sp * dt;
      u.y += Math.sin(a) * sp * dt;
      if (dist(u.x, u.y, p.x, p.y) < CATCH_DIST) { caughtByGuard(g, u); return; }
    } else if (u.state === 'investigate' && u.investigate) {
      const a = angleTo(u.x, u.y, u.investigate.x, u.investigate.y);
      u.angle = a;
      const sp = 110 * alarmBoost;
      u.x += Math.cos(a) * sp * dt;
      u.y += Math.sin(a) * sp * dt;
      u.investigate.t -= dt;
      if (u.investigate.t <= 0 || dist(u.x, u.y, u.investigate.x, u.investigate.y) < 20) {
        u.state = 'patrol'; u.investigate = null; u.suspicion = 0;
      }
    } else if (u.state === 'patrol') {
      if (u.watch) {
        u.watchAngle += dt * 0.9;
        u.angle = Math.sin(u.watchAngle) * Math.PI * 0.9 + Math.PI / 2;
      } else {
        const [tx, ty] = u.waypoints[u.wp];
        const d = dist(u.x, u.y, tx, ty);
        if (d < 12) { u.wp = (u.wp + 1) % u.waypoints.length; }
        else {
          const a = angleTo(u.x, u.y, tx, ty);
          u.angle = a;
          const sp = u.speed * alarmBoost;
          u.x += Math.cos(a) * sp * dt;
          u.y += Math.sin(a) * sp * dt;
        }
      }
    }
  }

  // --- Diva (Act 3) ---
  if (g.act >= 3) {
    const d = g.diva;
    d.screamCd = Math.max(0, d.screamCd - dt);
    d.angleNow = DIVA.angle + Math.sin(g.t * DIVA.sweep) * 0.7;
    const sees = pointInCone(p.x, p.y, d.x, d.y, d.angleNow, DIVA_CONE_LEN, DIVA_CONE_HALF)
      && !losBlocked(d.x, d.y, p.x, p.y, blockers);
    if (sees) {
      d.seen += dt;
      if (d.seen > 1 && d.screamCd <= 0) {
        d.screamCd = 3;
        d.seen = 0;
        g.alarm = Math.min(100, g.alarm + 50);
        g.stats.seen += 1;
        g.spottedBy = 'La Diva SCREAMS!';
        say(g, 'La Diva screams! Alarm +50 — every usher turns to the VIP box.');
        for (const u of activeUshers(g)) {
          u.state = 'investigate';
          u.investigate = { x: d.x, y: d.y, t: 4 };
        }
      }
      if (d.seen > 0.4) { anyoneSees = true; g.spottedBy = 'La Diva sees you!'; }
    } else {
      d.seen = Math.max(0, d.seen - dt * 2);
    }
  }

  // --- cameras ---
  for (const c of activeCameras(g)) {
    c.t += dt * (g.alarm >= 70 ? 1.5 : 1);
    if (c.gagged > 0) { c.gagged -= dt; continue; }
    c.angle = c.arc >= Math.PI * 2
      ? (c.center + c.t * c.speed) % TAU
      : c.center + Math.sin(c.t * c.speed) * c.arc / 2;
    if (pointInCone(p.x, p.y, c.x, c.y, c.angle, CAM_CONE_LEN, CAM_CONE_HALF)
      && !losBlocked(c.x, c.y, p.x, p.y, blockers)) {
      anyoneSees = true;
      g.spottedBy = `${c.name} sees you!`;
      g.stats.seen += dt;
      g.alarm = Math.min(100, g.alarm + 10 * dt);
    }
  }

  // --- alarm decay when unseen and quiet (standing still, not running
  // noisily: running adds +5/s, so it must not decay faster than it grows) ---
  if (!anyoneSees) {
    const makingNoise = p.running && !p.swallowing && !loud;
    if (!makingNoise) g.alarm = Math.max(0, g.alarm - (hide ? 12 : 8) * dt);
    g.spottedTimer = Math.max(0, g.spottedTimer - dt);
  } else {
    g.spottedTimer = 1.2;
    if (hide) g.stats.hidden += dt;
  }
  if (g.messageTimer > 0) g.messageTimer -= dt;

  // --- lose by alarm ---
  if (g.alarm >= 100) {
    g.phase = 'lose';
    g.loseReason = 'CURTAIN CALL — the alarm hits 100 and the whole house hears you.';
    return;
  }
  checkExit(g);
  if (g.phase === 'playing' && g.actClearTimer > 0) { /* act clear handled by main */ }
}

// Advance out of the act-clear interlude (called by main.js when the timer ends).
export function advanceAct(g) {
  if (g.phase !== 'actclear') return;
  startAct(g, g.act + 1);
  g.phase = 'playing';
}

export function nearestLoot(g) {
  let best = null, bd = 1e9;
  for (const l of g.loot) {
    if (l.taken || l.act > g.act) continue;
    const d = dist(g.player.x, g.player.y, l.x, l.y);
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}
