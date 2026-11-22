// FORTE — Steal the Music. Canvas 2D rendering only: floors, props, vision
// cones (yellow usher / pink camera / wide violet Diva), loot glints, the
// thief, the Mute Bag swirl, and the full HUD (VU alarm meter, Mute Bag
// slots, loot counter, SPOTTED banner, curtain timer). No images, no
// network — everything is drawn.
import {
  BLOCKERS, DOORS, EXIT, HIDES, LOOT, LOUD_ZONES, PROPS, WORLD,
} from './levels.js';
import {
  CAM_CONE_HALF, CAM_CONE_LEN, CONE_HALF, CONE_LEN, DIVA_CONE_HALF,
  DIVA_CONE_LEN, activeCameras, activeUshers, inHide, inLoud, nearestLoot,
} from './entities.js';

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function cone(c, x, y, angle, len, half, fill) {
  c.beginPath();
  c.moveTo(x, y);
  c.arc(x, y, len, angle - half, angle + half);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function text(c, s, x, y, size, color, align = 'left', bold = true) {
  c.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

const FLOOR = {
  'floor-foyer': '#c9b896',
  'floor-stage': '#4a3226',
  'floor-vault': '#3a3a44',
};

function drawProp(c, p, t) {
  const { x, y, w, h } = p;
  switch (p.kind) {
    case 'floor-foyer': case 'floor-stage': case 'floor-vault':
      c.fillStyle = FLOOR[p.kind];
      c.fillRect(x, y, w, h);
      // tile seams
      c.strokeStyle = 'rgba(0,0,0,0.08)';
      c.lineWidth = 1;
      for (let gx = x; gx <= x + w; gx += 80) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); }
      for (let gy = y; gy <= y + h; gy += 80) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w, gy); c.stroke(); }
      break;
    case 'carpet':
      c.fillStyle = '#8e1f2f'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#d4af37'; c.lineWidth = 3; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
      break;
    case 'platform':
      c.fillStyle = '#6b4423'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#d4af37'; c.lineWidth = 4; c.strokeRect(x, y, w, h);
      c.fillStyle = 'rgba(212,175,55,0.15)';
      for (let i = 0; i < 6; i++) c.fillRect(x + 40 + i * 90, y + 20, 50, h - 40);
      break;
    case 'balcony':
      c.fillStyle = '#5a1f28'; c.fillRect(x, y, w, h);
      c.fillStyle = '#d4af37'; c.fillRect(x, y + h - 8, w, 8);
      // the audience: rows of heads watching the aria
      for (let i = 0; i < 14; i++) {
        const ax = x + 24 + i * 42, ay = y + 30;
        c.fillStyle = ['#2b2b2b', '#6b4423', '#888', '#3a2a1a'][i % 4];
        c.beginPath(); c.arc(ax, ay, 9, 0, 7); c.fill();
        c.fillStyle = '#1a1a2e'; c.fillRect(ax - 9, ay + 8, 18, 14);
      }
      break;
    case 'curtain':
      c.fillStyle = '#7a1020'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 5; i++) c.fillRect(x + 4 + i * 8, y, 3, h);
      c.fillStyle = '#d4af37'; c.fillRect(x, y, w, 6);
      break;
    case 'pit':
      c.fillStyle = '#241a12'; c.fillRect(x, y, w, h);
      // 20+ orchestra chairs + music stands
      for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) {
        const cx = x + 40 + i * 80, cy = y + 40 + r * 70;
        c.fillStyle = '#3d2b1f'; c.fillRect(cx - 12, cy - 10, 24, 20);
        c.fillStyle = '#d8d8d8'; c.fillRect(cx - 2, cy - 26, 4, 14);
      }
      break;
    case 'stalls':
      c.fillStyle = '#2e1a24'; c.fillRect(x, y, w, h);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) {
        c.fillStyle = '#6e1f2f';
        c.beginPath(); c.arc(x + 30 + i * 56, y + 30 + r * 50, 12, 0, 7); c.fill();
      }
      break;
    case 'corridor': c.fillStyle = '#33333e'; c.fillRect(x, y, w, h); break;
    case 'costume': c.fillStyle = '#4a2a3a'; c.fillRect(x, y, w, h); break;
    case 'vipbox':
      c.fillStyle = '#5a1f28'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#d4af37'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      text(c, 'VIP', x + w / 2, y + 20, 13, '#d4af37', 'center');
      break;
    case 'vaultroom': c.fillStyle = '#26262e'; c.fillRect(x, y, w, h); break;
    case 'spotlight': {
      const g = c.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,240,180,0.55)');
      g.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = g; c.fillRect(x - 20, y - 20, w + 40, h + 40);
      break;
    }
    case 'statue':
      c.fillStyle = '#e8e0cc';
      c.beginPath(); c.arc(x + 13, y + 10, 10, 0, 7); c.fill();
      c.fillRect(x + 6, y + 18, 14, 8);
      break;
    case 'plant':
      c.fillStyle = '#2f6b2f';
      c.beginPath(); c.arc(x + 10, y + 10, 10, 0, 7); c.fill();
      c.fillStyle = '#8b5a2b'; c.fillRect(x + 7, y + 16, 6, 6);
      break;
    case 'poster':
      c.fillStyle = '#f3e6c8'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#8e1f2f'; c.lineWidth = 3; c.strokeRect(x, y, w, h);
      text(c, p.label || '', x + w / 2, y + h / 2 - 8, 9, '#8e1f2f', 'center');
      text(c, 'OPERA', x + w / 2, y + h / 2 + 12, 9, '#333', 'center');
      break;
    case 'candle':
      c.fillStyle = '#f3e6c8'; c.fillRect(x + 12, y + 8, 6, 16);
      c.fillStyle = '#ffb347';
      c.beginPath(); c.arc(x + 15, y + 5, 4 + Math.sin(t * 6 + x) * 1, 0, 7); c.fill();
      break;
    case 'bench': c.fillStyle = '#7a5a3a'; c.fillRect(x, y, w, h); break;
    case 'papers': c.fillStyle = '#f3e6c8'; c.fillRect(x, y, w, h); c.fillStyle = '#888'; c.fillRect(x + 4, y + 4, w - 8, 3); break;
    case 'luggage': c.fillStyle = '#5a3a1a'; c.fillRect(x, y, w, h); c.fillStyle = '#d4af37'; c.fillRect(x, y + h / 2 - 2, w, 4); break;
    case 'cello': c.fillStyle = '#8b4513'; c.beginPath(); c.ellipse(x + 23, y + 15, 20, 13, 0, 0, 7); c.fill(); break;
    case 'harp': c.fillStyle = '#d4af37'; c.fillRect(x + 8, y, 6, h); c.fillRect(x + 8, y, 30, 5); break;
    case 'tree': c.fillStyle = '#1f4a1f'; c.beginPath(); c.arc(x + 15, y + 30, 26, 0, 7); c.fill(); c.fillStyle = '#5a3a1a'; c.fillRect(x + 11, y + 50, 8, 40); break;
    case 'crate': c.fillStyle = '#6b4a2a'; c.fillRect(x, y, w, h); c.strokeStyle = '#3a2a1a'; c.strokeRect(x, y, w, h); break;
    case 'dress':
      c.fillStyle = '#c86a8a';
      c.beginPath(); c.moveTo(x + 20, y); c.lineTo(x + 4, y + h); c.lineTo(x + 36, y + h); c.closePath(); c.fill();
      break;
    case 'mirror': c.fillStyle = '#bcd8e8'; c.fillRect(x, y, w, h); c.strokeStyle = '#d4af37'; c.strokeRect(x, y, w, h); break;
    default: break;
  }
}

function drawBlocker(c, b) {
  const { x, y, w, h } = b;
  switch (b.kind) {
    case 'wall': c.fillStyle = '#2a1a12'; c.fillRect(x, y, w, h); break;
    case 'desk': c.fillStyle = '#7a5a3a'; c.fillRect(x, y, w, h); text(c, 'TICKETS', x + w / 2, y + h / 2, 12, '#f3e6c8', 'center'); break;
    case 'shelf':
      c.fillStyle = '#4a3226'; c.fillRect(x, y, w, h);
      c.fillStyle = '#c86a3a'; for (let i = 0; i < 5; i++) c.fillRect(x + 6, y + 10 + i * 38, w - 12, 22);
      break;
    case 'stairs':
      c.fillStyle = '#b8a888'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#8a7a5a'; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(x, y + 20 + i * 24); c.lineTo(x + w, y + 20 + i * 24); c.stroke(); }
      break;
    case 'bar':
      c.fillStyle = '#3a2418'; c.fillRect(x, y, w, h);
      c.fillStyle = '#d4af37'; c.fillRect(x, y, w, 6);
      text(c, 'BAR', x + w / 2, y + h / 2 + 8, 12, '#f3e6c8', 'center');
      break;
    case 'coat': c.fillStyle = '#3a2a4a'; c.fillRect(x, y, w, h); text(c, 'COATS', x + w / 2, y + 16, 10, '#ddd', 'center'); break;
    case 'podium':
      c.fillStyle = '#2a1a10'; c.fillRect(x, y, w, h);
      c.fillStyle = '#d4af37'; c.fillRect(x - 4, y - 4, w + 8, 6);
      break;
    case 'piano':
      c.fillStyle = '#111'; c.fillRect(x, y, w, h);
      c.fillStyle = '#f3e6c8'; for (let i = 0; i < 10; i++) c.fillRect(x + 6 + i * 11, y + h - 14, 9, 12);
      break;
    case 'castle':
      c.fillStyle = '#8a7a6a'; c.fillRect(x, y, w, h);
      c.fillStyle = '#6a5a4a'; c.fillRect(x + 6, y + 6, w - 12, 18);
      break;
    case 'vanity':
      c.fillStyle = '#6a4a5a'; c.fillRect(x, y, w, h);
      c.fillStyle = '#bcd8e8'; c.fillRect(x + w / 2 - 20, y - 16, 40, 26);
      break;
    case 'safe':
      c.fillStyle = '#555'; c.fillRect(x, y, w, h);
      c.strokeStyle = '#d4af37'; c.lineWidth = 3; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
      c.fillStyle = '#d4af37'; c.beginPath(); c.arc(x + w / 2, y + h / 2, 14, 0, 7); c.fill();
      break;
    case 'viprail': c.fillStyle = '#8e1f2f'; c.fillRect(x, y, w, h); break;
    default: break;
  }
}

function drawLootIcon(c, icon, x, y, s, glow) {
  if (glow) {
    const g = c.createRadialGradient(x, y, 2, x, y, s * 1.6);
    g.addColorStop(0, 'rgba(255,215,0,0.7)');
    g.addColorStop(1, 'rgba(255,215,0,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, s * 1.6, 0, 7); c.fill();
  }
  c.fillStyle = '#ffd700';
  c.strokeStyle = '#7a5a00';
  c.lineWidth = 1.5;
  switch (icon) {
    case 'fork':
      c.beginPath(); c.moveTo(x - 5, y - s); c.lineTo(x - 5, y + 2); c.moveTo(x, y - s); c.lineTo(x, y + 2);
      c.moveTo(x + 5, y - s); c.lineTo(x + 5, y + 2); c.moveTo(x, y + 2); c.lineTo(x, y + s); c.stroke();
      break;
    case 'disc': c.beginPath(); c.arc(x, y, s * 0.8, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); break;
    case 'bell':
      c.beginPath(); c.arc(x, y + 2, s * 0.7, Math.PI, 0); c.closePath(); c.fill();
      c.fillRect(x - 2, y - s, 4, 4);
      break;
    case 'folio': c.fillRect(x - s * 0.7, y - s * 0.8, s * 1.4, s * 1.6); c.fillStyle = '#8e1f2f'; c.fillRect(x - s * 0.7, y - s * 0.8, s * 1.4, 5); break;
    case 'violin':
      c.beginPath(); c.ellipse(x, y, s * 0.45, s * 0.9, 0.4, 0, 7); c.fill();
      c.strokeStyle = '#7a5a00'; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x, y + s); c.stroke();
      break;
    case 'cylinder':
      c.fillStyle = '#c8b890'; c.fillRect(x - s * 0.8, y - s * 0.5, s * 1.6, s); c.fillStyle = '#8e1f2f'; c.fillRect(x - s * 0.8, y - s * 0.5, 5, s);
      break;
    case 'pearl': c.fillStyle = '#f8f0ff'; c.beginPath(); c.arc(x, y, s * 0.7, 0, 7); c.fill(); break;
    case 'baton': c.fillStyle = '#ffd700'; c.fillRect(x - s, y - 2, s * 2, 4); c.beginPath(); c.arc(x + s, y, 4, 0, 7); c.fill(); break;
    default: c.beginPath(); c.arc(x, y, s * 0.6, 0, 7); c.fill(); break;
  }
}

function drawUsher(c, u, t) {
  const col = u.state === 'chase' ? 'rgba(255,40,40,0.45)'
    : u.state === 'suspicious' ? 'rgba(255,140,0,0.4)'
    : u.state === 'investigate' ? 'rgba(255,200,0,0.35)'
    : 'rgba(255,220,80,0.32)';
  cone(c, u.x, u.y, u.angle, CONE_LEN, CONE_HALF, col);
  // patrol route, faint dashed line
  c.strokeStyle = 'rgba(255,255,255,0.25)';
  c.setLineDash([4, 8]);
  c.beginPath();
  u.waypoints.forEach(([wx, wy], i) => { if (i === 0) c.moveTo(wx, wy); else c.lineTo(wx, wy); });
  c.closePath(); c.stroke();
  c.setLineDash([]);
  // body: maroon usher uniform + gold braid
  c.fillStyle = '#6e1f2f';
  c.beginPath(); c.arc(u.x, u.y, 15, 0, 7); c.fill();
  c.fillStyle = '#d4af37'; c.fillRect(u.x - 10, u.y - 3, 20, 3);
  c.fillStyle = '#f3e6c8'; c.beginPath(); c.arc(u.x, u.y - 4, 6, 0, 7); c.fill();
  c.fillStyle = '#111'; c.fillRect(u.x - 6, u.y - 12, 12, 4);
  // facing tick
  c.strokeStyle = '#fff'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(u.x, u.y); c.lineTo(u.x + Math.cos(u.angle) * 20, u.y + Math.sin(u.angle) * 20); c.stroke();
  if (u.state !== 'patrol') text(c, u.state === 'chase' ? '!' : '?', u.x, u.y - 24, 20, u.state === 'chase' ? '#ff4040' : '#ffb347', 'center');
  text(c, u.name, u.x, u.y + 26, 10, '#fff', 'center');
}

function drawDiva(c, g, t) {
  const d = g.diva;
  if (g.act < 3) return;
  cone(c, d.x, d.y, d.angleNow, DIVA_CONE_LEN, DIVA_CONE_HALF, 'rgba(180,120,255,0.30)');
  c.fillStyle = '#7a3aa0';
  c.beginPath(); c.arc(d.x, d.y, 17, 0, 7); c.fill();
  c.fillStyle = '#e8c8ff'; c.beginPath(); c.arc(d.x, d.y - 5, 7, 0, 7); c.fill();
  c.fillStyle = '#ffd700'; c.beginPath(); c.arc(d.x, d.y - 12, 4, 0, 7); c.fill();
  text(c, 'LA DIVA', d.x, d.y + 28, 11, '#e8c8ff', 'center');
}

function drawCamera(c, cam, t) {
  if (cam.gagged > 0) {
    cone(c, cam.x, cam.y, cam.angle, CAM_CONE_LEN, CAM_CONE_HALF, 'rgba(255,120,180,0.10)');
  } else {
    cone(c, cam.x, cam.y, cam.angle, CAM_CONE_LEN, CAM_CONE_HALF, 'rgba(255,120,180,0.30)');
  }
  c.fillStyle = '#ddd';
  c.beginPath(); c.arc(cam.x, cam.y, 11, 0, 7); c.fill();
  c.fillStyle = '#333'; c.beginPath(); c.arc(cam.x, cam.y, 6, 0, 7); c.fill();
  const blink = Math.sin(t * 6) > 0;
  c.fillStyle = cam.gagged > 0 ? '#888' : blink ? '#ff2020' : '#701010';
  c.beginPath(); c.arc(cam.x + 8, cam.y - 8, 3.5, 0, 7); c.fill();
  if (cam.gagged > 0) text(c, 'MUTED', cam.x, cam.y - 20, 10, '#ffb6d5', 'center');
}

function drawPlayer(c, g, t) {
  const p = g.player;
  // swallow swirl: sound spiralling into the bag
  if (p.swallowing) {
    c.strokeStyle = 'rgba(140,220,255,0.8)';
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = t * 5 + (i * Math.PI * 2) / 3;
      const r = 34 - ((t * 30 + i * 12) % 30);
      c.beginPath();
      c.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 5, 0, 7);
      c.stroke();
    }
    c.beginPath(); c.arc(p.x, p.y, 40, 0, 7); c.strokeStyle = 'rgba(140,220,255,0.25)'; c.stroke();
  }
  // shadow
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath(); c.ellipse(p.x, p.y + 12, 13, 6, 0, 0, 7); c.fill();
  // body: dark cloak, wide-brim hat
  c.fillStyle = p.crouch ? '#1a1a2e' : '#22223a';
  c.beginPath(); c.arc(p.x, p.y, p.crouch ? 11 : 14, 0, 7); c.fill();
  c.fillStyle = '#111';
  c.beginPath(); c.ellipse(p.x, p.y - 4, 13, 5, 0, 0, 7); c.fill();
  c.fillStyle = '#f3e6c8'; c.beginPath(); c.arc(p.x, p.y - 2, 5, 0, 7); c.fill();
  // facing tick + bag
  c.strokeStyle = '#ffd700'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + Math.cos(p.dir) * 18, p.y + Math.sin(p.dir) * 18); c.stroke();
  c.fillStyle = '#3a2a1a'; c.fillRect(p.x - 20, p.y + 4, 10, 12);
  text(c, 'HUSH', p.x, p.y + 26, 10, '#fff', 'center');
}

function drawNotes(c, g, t) {
  // flowing music notes over the loud zones
  c.fillStyle = 'rgba(255,240,180,0.85)';
  c.font = 'bold 20px sans-serif';
  const notes = ['♪', '♫', '♩'];
  for (let i = 0; i < 10; i++) {
    const zx = 800 + ((i * 137 + t * 22) % 560);
    const zy = 180 + ((i * 89) % 600);
    c.fillText(notes[i % 3], zx, zy);
  }
}

function alarmZone(alarm) {
  if (alarm >= 100) return ['CURTAIN CALL', '#ff2020'];
  if (alarm >= 70) return ['Fortissimo', '#ff4040'];
  if (alarm >= 40) return ['Mezzo-Forte', '#ffb347'];
  return ['Pianissimo', '#7ddc7d'];
}

function drawHUD(c, g, vw, vh) {
  const a = g.act;
  // Top-left: act + objective
  c.fillStyle = 'rgba(0,0,0,0.55)'; rr(c, 10, 10, 430, 54, 8); c.fill();
  text(c, `FORTE — Act ${a}: ${['', 'Overture', 'The Stage', 'Encore'][a]}`, 22, 28, 16, '#ffd700');
  const act = { 1: 'Steal the 3 foyer artifacts', 2: 'Steal the Fork + the Red Duchess', 3: 'Steal the last 3, then escape!' }[a];
  text(c, act, 22, 50, 13, '#fff', 'left', false);

  // Top-right: VU alarm meter with needle + number + zone
  const mx = vw - 250, my = 10, mw = 240, mh = 86;
  c.fillStyle = 'rgba(0,0,0,0.6)'; rr(c, mx, my, mw, mh, 8); c.fill();
  const [zone, zcol] = alarmZone(g.alarm);
  text(c, `ALARM  ${Math.round(g.alarm)}`, mx + 14, my + 18, 15, '#fff');
  text(c, zone, mx + mw - 14, my + 18, 13, zcol, 'right');
  // gauge bar with zones
  const bx = mx + 14, by = my + 34, bw = mw - 28, bh = 16;
  c.fillStyle = '#2fdc5f'; c.fillRect(bx, by, bw * 0.4, bh);
  c.fillStyle = '#ffc832'; c.fillRect(bx + bw * 0.4, by, bw * 0.3, bh);
  c.fillStyle = '#ff4040'; c.fillRect(bx + bw * 0.7, by, bw * 0.3, bh);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.fillRect(bx + (bw * g.alarm) / 100 - 2, by - 4, 4, bh + 8); // needle
  text(c, '0', bx, by + bh + 12, 10, '#ccc', 'center', false);
  text(c, '100', bx + bw, by + bh + 12, 10, '#ccc', 'center', false);
  text(c, 'VU · dB', mx + mw / 2, by + bh + 12, 10, '#ccc', 'center', false);

  // Top-centre: curtain timer
  const mm = Math.floor(Math.max(0, g.actTimeLeft) / 60);
  const ss = Math.floor(Math.max(0, g.actTimeLeft) % 60);
  text(c, `Curtain in ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, vw / 2, 26, 15, '#fff', 'center');
  if (g.exitOpen) text(c, '◆ EMERGENCY EXIT OPEN ◆', vw / 2, 48, 13, '#7ddc7d', 'center');

  // SPOTTED banner
  if (g.spottedTimer > 0 && g.spottedBy) {
    const blink = Math.sin(g.t * 12 + 1.0) > -0.2;
    if (blink) {
      c.fillStyle = 'rgba(180,0,0,0.85)'; rr(c, vw / 2 - 190, 66, 380, 40, 8); c.fill();
      text(c, `SPOTTED!  ${g.spottedBy}`, vw / 2, 86, 18, '#fff', 'center');
    }
  }

  // Bottom-left: Mute Bag, 4 slots
  const bx0 = 10, by0 = vh - 66;
  c.fillStyle = 'rgba(0,0,0,0.6)'; rr(c, bx0, by0, 250, 56, 8); c.fill();
  text(c, 'MUTE BAG', bx0 + 12, by0 + 16, 13, '#8cdcff');
  for (let i = 0; i < 4; i++) {
    const sx = bx0 + 92 + i * 38, sy = by0 + 28;
    c.fillStyle = g.bag[i] ? '#1f4a6b' : 'rgba(255,255,255,0.12)';
    rr(c, sx - 15, sy - 15, 30, 30, 5); c.fill();
    c.strokeStyle = '#8cdcff'; c.lineWidth = 1.5; rr(c, sx - 15, sy - 15, 30, 30, 5); c.stroke();
    if (g.bag[i]) {
      const icon = { step: '👣', creak: '🚪', chime: '🔔', scream: '😱' }[g.bag[i]] || '♪';
      text(c, icon, sx, sy + 1, 16, '#fff', 'center');
    } else {
      text(c, '·', sx, sy + 1, 16, '#888', 'center');
    }
  }
  text(c, `${g.bag.filter(Boolean).length}/4 sounds`, bx0 + 12, by0 + 42, 11, '#ccc', 'left', false);

  // Bottom-right: loot counter
  const lx = vw - 260, ly = vh - 66;
  c.fillStyle = 'rgba(0,0,0,0.6)'; rr(c, lx, ly, 250, 56, 8); c.fill();
  text(c, `LOOT  ${g.lootTaken}/8`, lx + 12, ly + 18, 16, '#ffd700');
  text(c, `Score ${g.score}`, lx + 12, ly + 42, 13, '#fff', 'left', false);
  const last = [...g.loot].reverse().find((l) => l.taken);
  if (last) text(c, last.name.slice(0, 22), lx + 238, ly + 42, 11, '#ccc', 'right', false);

  // Bottom-centre: context hints + message
  if (g.messageTimer > 0 && g.message) {
    text(c, g.message, vw / 2, vh - 84, 14, '#ffe9a8', 'center');
  }
  const hint = g.phase === 'playing'
    ? 'WASD move · SHIFT run · SPACE hold = swallow sound · CLICK throw a sound · E loot · C crouch · P pause'
    : '';
  if (hint) text(c, hint, vw / 2, vh - 14, 12, 'rgba(255,255,255,0.75)', 'center', false);

  // Edge arrow to the nearest loot off-screen
  const nl = nearestLoot(g);
  if (nl && g.phase === 'playing') {
    const dx = nl.x - g.player.x, dy = nl.y - g.player.y;
    if (Math.hypot(dx, dy) > 420) {
      const ang = Math.atan2(dy, dx);
      const ax = vw / 2 + Math.cos(ang) * (vw / 2 - 40);
      const ay = vh / 2 + Math.sin(ang) * (vh / 2 - 40);
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.moveTo(ax + Math.cos(ang) * 14, ay + Math.sin(ang) * 14);
      c.lineTo(ax + Math.cos(ang + 2.5) * 10, ay + Math.sin(ang + 2.5) * 10);
      c.lineTo(ax + Math.cos(ang - 2.5) * 10, ay + Math.sin(ang - 2.5) * 10);
      c.closePath(); c.fill();
    }
  }
}

function overlay(c, vw, vh, title, lines, accent) {
  c.fillStyle = 'rgba(5,5,15,0.72)';
  c.fillRect(0, 0, vw, vh);
  text(c, title, vw / 2, vh / 2 - 90, 44, accent, 'center');
  lines.forEach((ln, i) => text(c, ln, vw / 2, vh / 2 - 30 + i * 30, 17, '#fff', 'center', false));
}

export function drawGame(c, g, cam, vw, vh) {
  const t = g.t;
  c.clearRect(0, 0, vw, vh);
  c.fillStyle = '#0a0a14';
  c.fillRect(0, 0, vw, vh);
  c.save();
  c.translate(-cam.x, -cam.y);

  // world bounds
  c.fillStyle = '#111';
  c.fillRect(0, 0, WORLD.w, WORLD.h);

  // floors + props
  for (const p of PROPS) drawProp(c, p, t);
  // loud zones shimmer
  for (const z of LOUD_ZONES) {
    c.fillStyle = `rgba(255,240,180,${0.05 + 0.03 * Math.sin(t * 2)})`;
    c.fillRect(z.x, z.y, z.w, z.h);
  }
  drawNotes(c, g, t);
  // hide spots glow faintly
  for (const h of HIDES) {
    c.fillStyle = 'rgba(140,220,255,0.06)';
    c.fillRect(h.x, h.y, h.w, h.h);
  }
  // doors
  for (const d of DOORS) {
    const open = g.doorsOpen[d.id];
    c.fillStyle = open ? '#2f6b2f' : '#8e1f2f';
    c.fillRect(d.x, d.y, d.w, d.h);
    text(c, open ? 'OPEN' : 'LOCKED', d.x + d.w / 2, d.y + d.h / 2, 10, '#fff', 'center');
  }
  // emergency exit
  c.fillStyle = g.exitOpen ? '#2fdc5f' : '#555';
  c.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  text(c, 'EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2, 12, '#fff', 'center');
  if (g.exitOpen) {
    const gl = c.createRadialGradient(EXIT.x + 40, EXIT.y + 30, 4, EXIT.x + 40, EXIT.y + 30, 90);
    gl.addColorStop(0, 'rgba(120,255,150,0.5)'); gl.addColorStop(1, 'rgba(120,255,150,0)');
    c.fillStyle = gl; c.fillRect(EXIT.x - 60, EXIT.y - 60, 200, 180);
  }
  // blockers (furniture)
  for (const b of BLOCKERS) drawBlocker(c, b);
  // loot
  for (const l of g.loot) {
    if (l.taken || l.act > g.act) continue;
    const pulse = 1 + 0.15 * Math.sin(t * 4 + l.x);
    drawLootIcon(c, l.icon, l.x, l.y, 12 * pulse, true);
    text(c, l.name, l.x, l.y - 26, 11, '#ffe9a8', 'center');
  }
  // bursts + projectiles
  for (const b of g.bursts) {
    c.strokeStyle = `rgba(140,220,255,${1 - b.t})`;
    c.lineWidth = 3;
    c.beginPath(); c.arc(b.x, b.y, 20 + b.t * 160, 0, 7); c.stroke();
    text(c, '♪!', b.x, b.y, 20, '#8cdcff', 'center');
  }
  for (const pr of g.projectiles) {
    const k = pr.t / pr.dur;
    const x = pr.x + (pr.tx - pr.x) * k, y = pr.y + (pr.ty - pr.y) * k;
    c.fillStyle = '#8cdcff';
    c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill();
    text(c, '♪', x, y - 14, 14, '#8cdcff', 'center');
  }
  // actors
  for (const u of activeUshers(g)) drawUsher(c, u, t);
  drawDiva(c, g, t);
  for (const cam2 of activeCameras(g)) drawCamera(c, cam2, t);
  drawPlayer(c, g, t);
  c.restore();

  // HUD + overlays (screen space)
  drawHUD(c, g, vw, vh);
  if (g.phase === 'menu') {
    overlay(c, vw, vh, 'FORTE — Steal the Music', [
      '“Tonight, the loudest thing in the opera house is silence.”',
      'Hush Marlowe steals sound itself. Slip past 9 ushers, 6 dome cameras and La Diva.',
      'Steal 8 named artifacts — the Diamond Tuning Fork, the Wax Cylinder, the Red Duchess…',
      'Hold SPACE to swallow sound into your Mute Bag. CLICK to throw a sound as a distraction.',
      'WASD move · SHIFT run · E loot · C crouch · P pause · R restart · M mute',
      'Press ENTER or click to begin Act 1 — “Overture”',
    ], '#ffd700');
  } else if (g.phase === 'paused') {
    overlay(c, vw, vh, 'PAUSED', [
      'The orchestra holds its breath…',
      'P / Esc resume · R restart act · M mute · ENTER back to menu',
    ], '#8cdcff');
  } else if (g.phase === 'actclear') {
    overlay(c, vw, vh, `Act ${g.act} complete!`, [
      'The audience applauds — and never notices a thing.',
      'Alarm −20. The next act begins…',
    ], '#7ddc7d');
  } else if (g.phase === 'win') {
    overlay(c, vw, vh, 'CURTAIN DOWN — YOU DID IT!', [
      `Rank: ${g.winRank}`,
      `Loot ${g.lootTaken}/8 · Score ${g.score} · Times seen ${Math.round(g.stats.seen)}s · Sounds swallowed ${g.stats.swallowed}`,
      'The house is silent. The music is yours. Press R to play again.',
    ], '#ffd700');
  } else if (g.phase === 'lose') {
    overlay(c, vw, vh, 'CAUGHT!', [
      g.loseReason,
      `Loot ${g.lootTaken}/8 · Score ${g.score}`,
      'Press R to try again — quieter this time.',
    ], '#ff4040');
  }
}

export { LOOT };
