// Emoji Rush: one shared giant emoji map, phones as controllers (zoom or mouse). Plugged into server.js
const crypto = require('crypto');
let X; // shared helpers from server.js: { rooms, newCode, tok, push }
const MAXP = 20, COLS = 28, ROWS = 18, CELL = 60, W = COLS * CELL, H = ROWS * CELL, TOTAL = COLS * ROWS;
const COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#6a4c93', '#1d7ed8', '#e76f9b', '#7cb518', '#ff9f1c', '#00b4d8', '#8d5524',
  '#d62828', '#4361ee', '#2b9348', '#b5179e', '#fb5607', '#3a86ff', '#8338ec', '#06d6a0', '#ef476f', '#118ab2'];
// The emoji pool: the same 417 emojis as the Behind the Curtain game. Add or remove emojis here.
const POOL = [
  '🧮', '🪗', '🩹', '✈️', '⏰', '🚑', '🏈', '⚓', '🐜', '🍎', '🎨', '🥑', '🪓', '🍼', '🎒', '🥓', '🦡', '🏸', '🥯', '🥖', '🧶',
  '🎈', '🍌', '🪕', '🧺', '🏀', '🦇', '🛁', '🐻', '🦫', '🛏️', '🐝', '🍺', '🛎️', '🫑', '🚲', '👙', '🎱', '🐦', '🎂', '🫐', '💣',
  '🦴', '📚', '🪃', '🍾', '🏹', '🥣', '🎳', '🥊', '🧠', '🍞', '🧱', '💼', '🥦', '🧹', '🪣', '🐛', '🍔', '🌯', '🚌', '🧈', '🦋', '🌵',
  '📅', '🐫', '📷', '🕯️', '🍬', '🥫', '🛶', '🧢', '🚗', '🎠', '🪚', '🥕', '🏰', '🐱', '🪑', '🧀', '🏁', '🍒', '🌰', '🐤', '🐔',
  '🍫', '🥢', '🎄', '🎪', '🎬', '👏', '📋', '📕', '🧥', '🪳', '🍸', '🥥', '☕', '🧭', '🚧', '🍪', '🌽', '🐄', '🦀', '💳', '🦗', '🏏',
  '🐊', '🥐', '👑', '🥒', '🥤', '🧁', '🥌', '🌳', '🦌', '🎲', '🎯', '🤿', '🧬', '🦤', '🐶', '🐬', '🚪', '🍩', '🐉', '👗', '💧', '🥁',
  '🦆', '🦅', '🥚', '🐘', '👽', '👀', '🏭', '🪶', '🎡', '📁', '🚒', '🧯', '🧨', '🐟', '🎣', '🔥', '🦩', '💾', '🛸', '⚽', '👣', '🍴',
  '🥠', '🍀', '🦊', '🍟', '🐸', '🍳', '🧄', '💎', '👻', '🦒', '🥛', '👓', '🌍', '🧤', '🐐', '🥽', '🥇', '🦍', '🎓', '🍇', '🥗', '🎸',
  '🔨', '🐹', '👜', '🤝', '🎧', '💖', '🦔', '🚁', '🌿', '👠', '🥾', '🦛', '🍯', '🪝', '🐴', '🌭', '🏠', '🍦', '🧊', '🏒', '🎃', '👖',
  '🧩', '🦘', '🔑', '🪁', '🥝', '🐨', '🥍', '🪜', '🐞', '🍋', '🐆', '💡', '🦁', '💄', '🦎', '🦙', '🦞', '🍭', '🧳', '🫁', '🪄', '🧲',
  '📬', '🦣', '🥭', '🍁', '🍈', '🎤', '🪖', '🚐', '🪞', '📱', '💰', '🐵', '🌙', '🦟', '🛵', '🚠', '🐭', '🍄', '🎵', '💅', '🪆', '📰',
  '🍜', '📓', '🛑', '🐙', '🫒', '🧅', '📖', '💿', '🦧', '🦦', '🦉', '🦪', '📦', '🔒', '🌴', '🥞', '🐼', '📎', '🪂', '🦜', '🎉', '🐾',
  '🍑', '🦚', '🥜', '🍐', '✏️', '🐧', '🎭', '💻', '🎹', '🥧', '🐷', '💩', '💊', '🪅', '🌲', '🍍', '🍕', '🪠', '🚓', '🚨', '🍿',
  '📯', '📮', '🥔', '🪴', '🍗', '🎁', '🥨', '📢', '📌', '🐰', '🦝', '📻', '🌈', '🐀', '🪒', '🧾', '🦏', '🎀', '🍙', '💍', '🪐', '🍠',
  '🤖', '🚀', '🧻', '🎢', '🛼', '🐓', '🌹', '🧷', '⛵', '🍶', '🧂', '🥪', '🎷', '🧣', '✂️', '🛴', '🦂', '🪛', '📜', '🦭', '🪡',
  '🦈', '🐑', '🚢', '🛒', '🩳', '🚿', '🦐', '🛹', '🎿', '💀', '🦨', '🛷', '🎰', '🦥', '🐌', '🐍', '⛄', '🧦', '🍝', '🚤', '🐚', '🧽',
  '🧵', '🥄', '🦑', '⭐', '🗽', '🩺', '🍓', '☀️', '🌻', '🍣', '🦢', '💉', '🦖', '👕', '🏓', '🌮', '🥡', '🍊', '🚕', '🍵', '🫖',
  '🧸', '📞', '📺', '🎾', '🧪', '🩴', '👍', '🎫', '🐅', '🚽', '🍅', '🧰', '🦷', '🪥', '🎩', '🔦', '🚜', '🚂', '👟', '🚩', '🏆', '🍹',
  '🎺', '🌷', '🦃', '🐢', '☂️', '🦄', '🚦', '📹', '🎮', '📼', '🎻', '🌋', '🏐', '🧇', '⌚', '🌊', '🍉', '🐋', '🎐', '🪟', '🍷',
  '🐺', '👒', '🪵', '🪱', '🪀', '🦓',
];
const DEFAULT_NEED = { classic: 8, first: 5, triple: 3 };
const COUNTDOWN = +process.env.RUSH_COUNTDOWN || 3600;

const hostOnly = (r, b) => { if (r.hostKey !== b.hostKey) throw 'Not the host'; };
const mine = (r, b) => r.players.find(p => b.key && p.key === b.key);
const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Math.round(+v) || d));
const clearTimers = r => { clearTimeout(r.timer); r.timer = null; };
// Coalesce rapid-fire updates (lots of taps) into at most ~16 broadcasts a second
function sched(r) { if (r.pt) return; r.pt = setTimeout(() => { r.pt = null; X.push(r); }, 60); }

const view = r => ({ game: 'rush', code: r.code, phase: r.phase, set: r.set, round: r.round, rid: r.rid, removed: r.removed, targets: r.targets, need: r.need,
  left: r.targets.map(e => r.left[e]), startsAt: r.startsAt, endsAt: r.endsAt, t0: r.t0, now: Date.now(), last: r.last, winners: r.winners, history: r.history,
  players: r.players.map(p => ({ id: p.id, name: p.name, color: p.color, on: p.on, wins: p.wins, found: p.found, total: p.total, fz: p.frozenUntil })) });

// Build a fresh map: ~500 emojis, ~50 types, with exactly enough of the target emoji(s) hidden in it
function build(r) {
  const s = r.set, n = Math.max(1, r.players.length), pool = shuf([...POOL]);
  const nt = s.type === 'triple' ? 3 : 1, targets = pool.slice(0, nt), others = pool.slice(nt, nt + 46);
  const timed = s.type === 'timed';
  const counts = targets.map(() => timed ? Math.min(150, Math.max(40, n * 20)) : Math.min(100, Math.ceil(s.need * Math.max(2.5, n * 0.6))));
  const e = [];
  targets.forEach((t, i) => { for (let k = 0; k < counts[i]; k++) e.push(t); });
  while (e.length < TOTAL) e.push(others[crypto.randomInt(others.length)]);
  shuf(e);
  const jit = () => crypto.randomInt(-7, 8), x = [], y = [];
  for (let i = 0; i < TOTAL; i++) { x.push(Math.round((i % COLS) * CELL + CELL / 2 + jit())); y.push(Math.round(Math.floor(i / COLS) * CELL + CELL / 2 + jit())); }
  r.map = { w: W, h: H, e, x, y }; r.targets = targets; r.need = targets.map(() => timed ? 0 : s.need);
  r.left = Object.fromEntries(targets.map((t, i) => [t, counts[i]])); r.gone = new Array(TOTAL).fill(false); r.removed = [];
}
function startRound(r) {
  clearTimers(r); build(r); r.round++; r.rid = X.tok().slice(0, 8); r.phase = 'countdown';
  r.startsAt = Date.now() + COUNTDOWN; r.endsAt = 0; r.t0 = 0; r.winners = []; r.last = null;
  r.players.forEach(p => { p.found = r.targets.map(() => 0); p.total = 0; p.frozenUntil = 0; p.cx = 0.5; p.cy = 0.5; });
  r.timer = setTimeout(() => {
    r.phase = 'play'; r.t0 = Date.now(); r.timer = null;
    if (r.set.type === 'timed') { r.endsAt = r.t0 + r.set.secs * 1000; r.timer = setTimeout(() => endRound(r), r.set.secs * 1000); }
    X.push(r);
  }, COUNTDOWN);
  X.push(r);
}
function endRound(r, win) {
  if (r.phase !== 'play') return;
  clearTimers(r);
  let w = [];
  if (win) w = [win]; else { const m = Math.max(...r.players.map(p => p.total)); if (m > 0) w = r.players.filter(p => p.total === m); }
  w.forEach(p => { p.wins++; });
  r.winners = w.map(p => p.id); r.history.push({ round: r.round, names: w.map(p => p.name) }); r.phase = 'roundover';
  X.push(r);
}
function tryClaim(r, p, id) {
  const now = Date.now();
  if (r.phase !== 'play') return { res: 'none' };
  if (now < p.frozenUntil) return { res: 'frozen', until: p.frozenUntil };
  id = +id;
  if (!Number.isInteger(id) || id < 0 || id >= TOTAL || r.gone[id]) return { res: 'none' };
  const e = r.map.e[id], ti = r.targets.indexOf(e), timed = r.set.type === 'timed';
  if (ti >= 0 && !timed && p.found[ti] >= r.need[ti]) return { res: 'none' }; // already have enough of this one
  if (ti < 0) { // wrong emoji: freeze penalty
    if (r.set.freeze) p.frozenUntil = now + r.set.freeze * 1000;
    r.last = { seq: ++r.seq, id: p.id, ok: false, item: id }; sched(r);
    return { res: 'wrong', until: p.frozenUntil };
  }
  r.gone[id] = true; r.removed.push(id); r.left[e]--; p.found[ti]++; p.total++;
  r.last = { seq: ++r.seq, id: p.id, ok: true, item: id };
  if (!timed && p.found.every((f, i) => f >= r.need[i])) { endRound(r, p); return { res: 'ok' }; }
  if (r.targets.every(t => r.left[t] <= 0)) { endRound(r); return { res: 'ok' }; }
  sched(r); return { res: 'ok' };
}

const A = {
  host(b) {
    let r = X.rooms.get(b.code);
    if (r && r.hostKey === b.hostKey) return { code: r.code, hostKey: r.hostKey };
    r = { game: 'rush', code: X.newCode(), hostKey: X.tok(), phase: 'lobby', set: { type: 'classic', need: 8, secs: 60, mode: 'zoom', shuffle: false, freeze: 3, audio: true },
      round: 0, rid: '', map: null, targets: [], need: [], left: {}, gone: [], removed: [], startsAt: 0, endsAt: 0, t0: 0, last: null, winners: [], history: [],
      players: [], clients: new Set(), seq: 0, timer: null, pt: null, touch: Date.now() };
    X.rooms.set(r.code, r);
    return { code: r.code, hostKey: r.hostKey };
  },
  join(b, r) {
    let p = mine(r, b);
    if (!p) {
      if (!['lobby', 'roundover'].includes(r.phase)) throw 'A round is in progress. Join between rounds!';
      if (r.players.length >= MAXP) throw `This room is full (${MAXP} players)`;
      const name = String(b.name || '').trim().slice(0, 14);
      if (!name) throw 'Enter your name';
      p = { id: X.tok().slice(0, 6), key: X.tok(), name, color: COLORS[r.players.length % COLORS.length], on: false, wins: 0, found: r.targets.map(() => 0), total: 0, frozenUntil: 0, cx: 0.5, cy: 0.5 };
      r.players.push(p);
    }
    X.push(r); return { key: p.key, id: p.id, name: p.name };
  },
  settings(b, r) {
    hostOnly(r, b); if (r.phase !== 'lobby') throw 'Game already started';
    const s = r.set;
    if (b.type !== undefined && ['classic', 'first', 'triple', 'timed'].includes(b.type)) { s.type = b.type; if (DEFAULT_NEED[b.type]) s.need = DEFAULT_NEED[b.type]; }
    if (b.need !== undefined) s.need = clamp(b.need, 1, 30, DEFAULT_NEED[s.type] || 8);
    if (b.secs !== undefined) s.secs = clamp(b.secs, 10, 300, 60);
    if (b.mode !== undefined && ['zoom', 'mouse'].includes(b.mode)) s.mode = b.mode;
    if (b.shuffle !== undefined) s.shuffle = b.shuffle === true || b.shuffle === 'true';
    if (b.freeze !== undefined) s.freeze = clamp(b.freeze, 0, 10, 3);
    if (b.audio !== undefined) s.audio = b.audio === true || b.audio === 'true';
    X.push(r);
  },
  kick(b, r) { hostOnly(r, b); if (r.phase !== 'lobby') throw 'Game already started'; r.players = r.players.filter(p => p.id !== b.id); X.push(r); },
  start(b, r) {
    hostOnly(r, b); if (r.phase !== 'lobby') throw 'Already started'; if (!r.players.length) throw 'Waiting for players';
    r.round = 0; r.history = []; r.players.forEach(p => { p.wins = 0; }); startRound(r);
  },
  next(b, r) { hostOnly(r, b); if (r.phase !== 'roundover') throw 'Round not finished'; startRound(r); },
  lobby(b, r) {
    hostOnly(r, b); clearTimers(r); Object.assign(r, { phase: 'lobby', targets: [], need: [], left: {}, removed: [], last: null, winners: [] });
    r.players.forEach(p => { p.found = []; p.total = 0; p.frozenUntil = 0; }); X.push(r);
  },
  map(b, r) { if (!r.map || r.phase === 'lobby') throw 'No map yet'; return { rid: r.rid, w: W, h: H, e: r.map.e, x: r.map.x, y: r.map.y }; },
  claim(b, r) { const p = mine(r, b); if (!p) throw 'Not in this game'; return tryClaim(r, p, b.id); },
  move(b, r) {
    const p = mine(r, b); if (!p) throw 'Not in this game';
    const c = v => Math.max(-0.5, Math.min(0.5, +v || 0));
    p.cx = Math.max(0, Math.min(1, p.cx + c(b.dx))); p.cy = Math.max(0, Math.min(1, p.cy + c(b.dy))); p.cd = true; r.curDirty = true;
  },
  click(b, r) {
    const p = mine(r, b); if (!p) throw 'Not in this game';
    if (r.phase !== 'play') return { res: 'none' };
    const px = p.cx * W, py = p.cy * H; let best = -1, bd = 34 * 34;
    for (let i = 0; i < TOTAL; i++) { if (r.gone[i]) continue; const dx = r.map.x[i] - px, dy = r.map.y[i] - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    return best < 0 ? { res: 'none' } : tryClaim(r, p, best);
  },
};
module.exports = {
  A, view,
  init: ctx => {
    X = ctx;
    // Mouse-mode pointers go to the host screen only, as a lightweight stream
    setInterval(() => {
      X.rooms.forEach(r => {
        if (r.game !== 'rush' || !r.curDirty) return;
        r.curDirty = false; const m = {};
        r.players.forEach(p => { if (p.cd) { m[p.id] = [+p.cx.toFixed(4), +p.cy.toFixed(4)]; p.cd = false; } });
        const s = 'event: cur\ndata: ' + JSON.stringify(m) + '\n\n';
        r.clients.forEach(c => { if (!c.key) c.res.write(s); });
      });
    }, 50);
  },
};
