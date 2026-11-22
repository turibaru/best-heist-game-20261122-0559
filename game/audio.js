// FORTE — Steal the Music. All sound is synthesized with WebAudio: no
// audio files, no network. Every sound routes through one master gain, and
// "swallowing" a sound really does duck the mixer — the Mute Bag is not
// just a visual. If audio is unavailable (headless, muted), every call is
// a safe no-op and the game plays on in silence.
let ctx = null;
let master = null;
let musicGain = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A tiny waltz in A minor for the orchestra — the Nightingale Aria, looped.
const ARIA = [
  [440, 0.5], [523, 0.5], [659, 0.5], [523, 0.5],
  [587, 0.5], [659, 0.5], [784, 1.0], [659, 0.5],
  [587, 0.5], [523, 0.5], [440, 0.5], [523, 0.5],
  [392, 1.0], [440, 0.5], [523, 0.5], [659, 1.5],
];

export function initAudio() {
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    return true;
  } catch {
    ctx = null;
    return false;
  }
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function setMuted(m) {
  muted = m;
  if (master && ctx) master.gain.setValueAtTime(m ? 0 : 0.5, ctx.currentTime);
}
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (!ctx || !master) return;
  try {
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch { /* sound is decoration; never break the game */ }
}

function noiseBurst(dur, vol, filterFreq) {
  if (!ctx || !master) return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  } catch { /* ignore */ }
}

export const sfx = {
  step(run) { noiseBurst(0.05, run ? 0.10 : 0.05, 500); },
  pickup() { tone(660, 0.12, 'sine', 0.25); tone(990, 0.18, 'sine', 0.2, 0.08); },
  swallow() { tone(900, 0.35, 'sine', 0.22, 0, 120); noiseBurst(0.3, 0.08, 900); },
  throwSound() { tone(500, 0.25, 'triangle', 0.2, 0, 1400); },
  burst() { noiseBurst(0.4, 0.3, 2400); tone(220, 0.3, 'square', 0.12, 0, 90); },
  alarm() { tone(880, 0.18, 'square', 0.10); tone(660, 0.18, 'square', 0.10, 0.2); },
  scream() { tone(1200, 0.7, 'sawtooth', 0.2, 0, 2400); tone(900, 0.7, 'sawtooth', 0.14, 0.1, 1800); },
  caught() { tone(330, 0.4, 'sawtooth', 0.2, 0, 110); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, 'sine', 0.22, i * 0.15)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.5, 'triangle', 0.2, i * 0.2)); },
  door() { tone(180, 0.3, 'triangle', 0.18, 0, 90); noiseBurst(0.25, 0.06, 300); },
  click() { tone(700, 0.06, 'sine', 0.15); },
};

// The orchestra: a slow music-box waltz. When the alarm is high the music
// turns tense (faster, minor second added); swallowing ducks the music
// gain for a beat, because the thief is literally stealing the sound.
export function startMusic() {
  if (!ctx || musicTimer) return;
  musicTimer = setInterval(() => {
    if (!ctx || muted) return;
    const [freq, dur] = ARIA[musicStep % ARIA.length];
    musicStep += 1;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.value = 0.5;
      o.connect(g); g.connect(musicGain);
      o.start(); o.stop(ctx.currentTime + dur * 0.9);
      if (musicStep % 4 === 0) {
        const b = ctx.createOscillator();
        const bg = ctx.createGain();
        b.type = 'sine'; b.frequency.value = freq / 2; bg.gain.value = 0.4;
        b.connect(bg); bg.connect(musicGain);
        b.start(); b.stop(ctx.currentTime + dur * 1.8);
      }
    } catch { /* ignore */ }
  }, 500);
}

export function setTension(high) {
  if (musicGain && ctx) {
    musicGain.gain.setTargetAtTime(high ? 0.26 : 0.16, ctx.currentTime, 0.5);
  }
}

// Duck the whole mix for a moment: the audible side of swallowing a sound.
export function duckMix() {
  if (master && ctx) {
    master.gain.setTargetAtTime(0.12, ctx.currentTime, 0.05);
    master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime + 0.4, 0.3);
  }
}
