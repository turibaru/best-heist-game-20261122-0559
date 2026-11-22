// FORTE — Steal the Music. Browser shell: canvas + input + game loop.
// The simulation lives in entities.js (pure, headless-testable); this file
// only wires it to the keyboard, the mouse, the canvas and the audio synth.
// ?shot=1..4 puts the game into a frozen, deterministic composition for the
// screenshots: same state every time, no input, no timer advancing.
import { ACTS, WORLD } from './levels.js';
import {
  advanceAct, createGame, startGame, updateGame,
} from './entities.js';
import { drawGame } from './render.js';
import {
  duckMix, initAudio, isMuted, resumeAudio, setMuted, setTension, sfx, startMusic,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shot = Number(params.get('shot') || 0);

const g = createGame();
let cam = { x: 0, y: 0 };
let vw = 1280, vh = 720;

function resize() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.width = vw;
  canvas.height = vh;
}
window.addEventListener('resize', resize);
resize();

const keys = {};
const input = {
  up: false, down: false, left: false, right: false,
  run: false, swallow: false, crouch: false,
  interact: false, discard: false, throwAt: null,
};

function syncKeys() {
  input.up = !!(keys.KeyW || keys.ArrowUp);
  input.down = !!(keys.KeyS || keys.ArrowDown);
  input.left = !!(keys.KeyA || keys.ArrowLeft);
  input.right = !!(keys.KeyD || keys.ArrowRight);
  input.run = !!keys.ShiftLeft || !!keys.ShiftRight;
  input.swallow = !!keys.Space;
  input.crouch = !!keys.KeyC;
}

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  syncKeys();
  initAudio(); resumeAudio(); startMusic();
  if (e.code === 'KeyE') input.interact = true;
  if (e.code === 'KeyQ') input.discard = true;
  if (e.code === 'KeyM') { setMuted(!isMuted()); }
  if (e.code === 'KeyR') {
    if (g.phase === 'win' || g.phase === 'lose') startGame(g);
    else if (g.phase === 'playing' || g.phase === 'paused') {
      const act = g.act;
      startGame(g);
      // restart the same act, not act 1
      while (g.act < act) { g.phase = 'actclear'; g.actClearTimer = 0; advanceAct(g); }
    }
    sfx.click();
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (g.phase === 'playing') g.phase = 'paused';
    else if (g.phase === 'paused') g.phase = 'playing';
    sfx.click();
  }
  if (e.code === 'Enter') {
    if (g.phase === 'menu') { startGame(g); sfx.door(); }
    else if (g.phase === 'paused') g.phase = 'playing';
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; syncKeys(); });

function toWorld(e) {
  return { x: e.clientX + cam.x, y: e.clientY + cam.y };
}
canvas.addEventListener('mousedown', (e) => {
  initAudio(); resumeAudio(); startMusic();
  if (g.phase === 'menu') { startGame(g); return; }
  if (e.button === 2) { input.discard = true; return; }
  if (e.button === 0 && g.phase === 'playing') input.throwAt = toWorld(e);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// --- deterministic shot compositions (see shots.json) ---
function applyShot(n) {
  startGame(g);
  g.t = 2.0;
  if (n === 1) {
    // COVER: stage, spotlight pool, usher + yellow cone, dome camera +
    // pink cone, Diamond Tuning Fork on the podium, VU meter in the HUD.
    g.act = 2; g.alarm = 35;
    g.player.x = 1060; g.player.y = 420; g.player.dir = -0.6;
    g.bag = ['step', 'creak', null, null];
    g.message = 'The Diamond Tuning Fork glints on the conductor’s podium.';
    g.messageTimer = 99;
    const dario = g.ushers.find((u) => u.name === 'Dario');
    dario.x = 920; dario.y = 420; dario.angle = 0; dario.state = 'patrol';
    const elif = g.ushers.find((u) => u.name === 'Elif');
    elif.x = 1250; elif.y = 700; elif.angle = Math.PI;
    const balc = g.cameras.find((c) => c.name === 'Balcony Dome');
    balc.angle = Math.PI / 2 + 0.5;
    const stage = g.cameras.find((c) => c.name === 'Stage Dome');
    stage.angle = Math.PI * 0.8;
    cam = { x: 700, y: 40 };
  } else if (n === 2) {
    // MUTE BAG IN ACTION: Hush swallowing sound, bag full, a thrown sound
    // bursting down the corridor while the usher turns to investigate.
    g.act = 1; g.alarm = 25;
    g.player.x = 230; g.player.y = 1060; g.player.dir = 0.5; g.player.swallowing = true;
    g.bag = ['step', 'creak', 'chime', 'scream'];
    g.bursts = [{ x: 650, y: 780, t: 0.3 }];
    const bruno = g.ushers.find((u) => u.name === 'Bruno');
    bruno.x = 430; bruno.y = 850; bruno.angle = 0.7; bruno.state = 'investigate';
    bruno.investigate = { x: 650, y: 780, t: 4 };
    g.message = 'Swallowed a sound — alarm −15. Mute Bag 4/4.';
    g.messageTimer = 99;
    cam = { x: 40, y: 680 };
  } else if (n === 3) {
    // SPOTTED: alarm deep in the red, two ushers chasing, Hush crouched
    // behind the velvet curtain, SPOTTED! banner flashing.
    g.act = 2; g.alarm = 78;
    g.player.x = 795; g.player.y = 300; g.player.crouch = true; g.player.dir = 0;
    g.bag = ['step', null, null, null];
    const dario = g.ushers.find((u) => u.name === 'Dario');
    dario.x = 1010; dario.y = 360; dario.angle = Math.PI; dario.state = 'chase'; dario.suspicion = 2;
    const elif = g.ushers.find((u) => u.name === 'Elif');
    elif.x = 980; elif.y = 480; elif.angle = -Math.PI / 2; elif.state = 'chase'; elif.suspicion = 2;
    g.message = 'Two ushers closing in — stay behind the curtain!';
    g.messageTimer = 99;
    g.spottedBy = 'Usher Dario sees you!';
    g.spottedTimer = 99;
    const stage = g.cameras.find((c) => c.name === 'Stage Dome');
    stage.angle = Math.PI * 0.75;
    cam = { x: 700, y: 80 };
  } else if (n === 4) {
    // THE VAULT: all 8 artifacts stolen, Hush at the open vault, La Diva
    // watching from her VIP box with her wide cone, exit glowing.
    g.act = 3; g.alarm = 12; g.exitOpen = true;
    for (const l of g.loot) l.taken = true;
    g.lootTaken = 8;
    g.score = 4550;
    g.player.x = 1740; g.player.y = 1060; g.player.dir = 0.4;
    g.bag = ['step', 'chime', null, null];
    g.diva.angleNow = Math.PI / 2 + 0.3;
    const greta = g.ushers.find((u) => u.name === 'Greta');
    greta.x = 1650; greta.y = 720; greta.angle = Math.PI / 2;
    const hugo = g.ushers.find((u) => u.name === 'Hugo');
    hugo.x = 1980; hugo.y = 1000; hugo.angle = Math.PI;
    const vault = g.cameras.find((c) => c.name === 'Vault Dome');
    vault.angle = Math.PI * 1.25;
    g.message = 'The master recording. The first Nightingale Aria, in your bag.';
    g.messageTimer = 99;
    cam = { x: 760, y: 700 };
  }
  g.phase = 'playing';
}

if (shot >= 1 && shot <= 4) {
  applyShot(shot);
  document.title = `FORTE — shot ${shot}`;
} else {
  g.phase = 'menu';
}

window.__forte = g;

let last = performance.now();
let stepSfxAt = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (shot >= 1 && shot <= 4) {
    // frozen composition: render the same frame, forever
    drawGame(ctx, g, cam, vw, vh);
    requestAnimationFrame(frame);
    return;
  }
  if (g.phase === 'playing') {
    const wasAlarm = g.alarm;
    updateGame(g, input, dt);
    input.interact = false;
    input.discard = false;
    input.throwAt = null;
    if (g.player.swallowing && g.stats.swallowed > 0 && Math.random() < dt * 2) duckMix();
    if (g.player.moving && now - stepSfxAt > (g.player.running ? 260 : 420)) {
      stepSfxAt = now;
      if (!g.player.swallowing) sfx.step(g.player.running);
    }
    if (g.alarm >= 70 && wasAlarm < 70) sfx.alarm();
    setTension(g.alarm >= 70);
    // camera follows the thief
    cam.x = Math.max(0, Math.min(WORLD.w - vw, g.player.x - vw / 2));
    cam.y = Math.max(0, Math.min(WORLD.h - vh, g.player.y - vh / 2));
    if (g.phase === 'actclear') {
      g.actClearTimer -= dt;
      if (g.actClearTimer <= 0) advanceAct(g);
    }
    if (g.phase === 'win') sfx.win();
    if (g.phase === 'lose') sfx.lose();
  }
  drawGame(ctx, g, cam, vw, vh);
  if (statusEl) {
    statusEl.textContent = `FORTE Act ${g.act}, alarm ${Math.round(g.alarm)}, loot ${g.lootTaken}/8, ${g.phase}.`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
