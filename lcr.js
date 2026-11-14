// Left-Centre-Right game logic, plugged into server.js
const crypto = require('crypto');
let X; // shared helpers from server.js: { rooms, newCode, tok, push }
const MAXP = 16, DELAY = +process.env.LCR_DELAY || 2800, FACES = ['L', 'C', 'R', 'D', 'D', 'D'];
const hostOnly = (r, b) => { if (r.hostKey !== b.hostKey) throw 'Not the host'; };
const seated = r => [...r.players].sort((a, b) => a.seat - b.seat);
const renumber = r => seated(r).forEach((p, i) => { p.seat = i + 1; });

const view = r => ({ game: 'lcr', code: r.code, phase: r.phase, set: r.set, round: r.round, final: r.round >= r.set.rounds, pot: r.pot,
  turn: r.turn, last: r.last, busy: r.busy, history: r.history,
  players: seated(r).map(p => ({ id: p.id, name: p.name, seat: p.seat, tokens: p.tokens, wins: p.wins, on: p.on })) });

function startRound(r) {
  clearTimeout(r.timer); r.timer = null;
  r.players.forEach(p => { p.tokens = r.set.start; });
  const s = seated(r);
  Object.assign(r, { pot: 0, last: null, busy: false, phase: 'play', turn: s[(r.round - 1) % s.length].id });
}
function finish(r, i) {
  const s = seated(r), alive = s.filter(p => p.tokens > 0);
  if (alive.length === 1) {
    const w = alive[0];
    w.wins++; r.history.push({ round: r.round, id: w.id, name: w.name }); r.phase = 'roundover';
  } else {
    for (let k = 1; k <= s.length; k++) { const q = s[(i + k) % s.length]; if (q.tokens > 0) { r.turn = q.id; break; } }
  }
  X.push(r);
}
function doRoll(r, p) {
  if (r.phase !== 'play' || r.busy || r.turn !== p.id || p.tokens < 1) throw "It's not your turn";
  const s = seated(r), i = s.indexOf(p), left = s[(i + 1) % s.length], right = s[(i - 1 + s.length) % s.length];
  const faces = Array.from({ length: Math.min(3, p.tokens) }, () => FACES[crypto.randomInt(6)]);
  faces.forEach(f => {
    if (f === 'L') { p.tokens--; left.tokens++; } else if (f === 'R') { p.tokens--; right.tokens++; } else if (f === 'C') { p.tokens--; r.pot++; }
  });
  r.last = { seq: ++r.seq, id: p.id, faces, left: left.id, right: right.id }; r.busy = true;
  r.timer = setTimeout(() => { r.timer = null; r.busy = false; finish(r, i); }, DELAY);
  X.push(r);
}
const mine = (r, b) => r.players.find(p => b.key && p.key === b.key);

const A = {
  host(b) {
    let r = X.rooms.get(b.code);
    if (r && r.hostKey === b.hostKey) return { code: r.code, hostKey: r.hostKey };
    r = { game: 'lcr', code: X.newCode(), hostKey: X.tok(), phase: 'lobby', set: { value: '1', rounds: 3, start: 3 }, round: 1, turn: null,
      pot: 0, last: null, busy: false, history: [], players: [], clients: new Set(), seq: 0, timer: null, touch: Date.now() };
    X.rooms.set(r.code, r);
    return { code: r.code, hostKey: r.hostKey };
  },
  join(b, r) {
    let p = mine(r, b);
    if (!p) {
      if (r.phase !== 'lobby') throw 'This game has already started';
      if (r.players.length >= MAXP) throw `This table is full (${MAXP} players)`;
      const name = String(b.name || '').trim().slice(0, 14);
      if (!name) throw 'Enter your name';
      p = { id: X.tok().slice(0, 6), key: X.tok(), name, seat: r.players.length + 1, tokens: 0, wins: 0, on: false };
      r.players.push(p);
    }
    X.push(r); return { key: p.key, id: p.id, name: p.name };
  },
  settings(b, r) {
    hostOnly(r, b); if (r.phase !== 'lobby') throw 'Game already started';
    const s = r.set, clamp = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Math.round(+v) || d));
    if (b.value !== undefined) s.value = String(b.value).trim().slice(0, 8) || '1';
    if (b.rounds !== undefined) s.rounds = clamp(b.rounds, 1, 20, 3);
    if (b.start !== undefined) s.start = clamp(b.start, 1, 10, 3);
    X.push(r);
  },
  seat(b, r) {
    hostOnly(r, b); if (r.phase !== 'lobby') throw 'Game already started';
    const p = r.players.find(x => x.id === b.id), seat = +b.seat;
    if (!p || !(seat >= 1 && seat <= r.players.length)) throw 'Bad seat';
    const o = r.players.find(x => x.seat === seat); if (o) o.seat = p.seat; p.seat = seat; X.push(r);
  },
  shuffle(b, r) {
    hostOnly(r, b); if (r.phase !== 'lobby') throw 'Game already started';
    const seats = r.players.map((_, i) => i + 1);
    for (let i = seats.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [seats[i], seats[j]] = [seats[j], seats[i]]; }
    r.players.forEach((p, i) => { p.seat = seats[i]; }); X.push(r);
  },
  kick(b, r) { hostOnly(r, b); if (r.phase !== 'lobby') throw 'Game already started'; r.players = r.players.filter(p => p.id !== b.id); renumber(r); X.push(r); },
  start(b, r) {
    hostOnly(r, b); if (r.players.length < 2) throw 'Need at least 2 players';
    r.round = 1; r.history = []; r.players.forEach(p => { p.wins = 0; }); startRound(r); X.push(r);
  },
  next(b, r) {
    hostOnly(r, b); if (r.phase !== 'roundover') throw 'Round not finished';
    if (r.round >= r.set.rounds) r.phase = 'over'; else { r.round++; startRound(r); }
    X.push(r);
  },
  again(b, r) {
    hostOnly(r, b); clearTimeout(r.timer); r.timer = null;
    Object.assign(r, { phase: 'lobby', round: 1, pot: 0, last: null, busy: false, history: [], turn: null });
    r.players.forEach(p => { p.tokens = 0; p.wins = 0; }); X.push(r);
  },
  roll(b, r) { const p = mine(r, b); if (!p) throw 'Not in this game'; doRoll(r, p); },
  hostroll(b, r) { hostOnly(r, b); const p = r.players.find(p => p.id === r.turn); if (!p) throw 'No current player'; doRoll(r, p); },
};
module.exports = { A, view, init: ctx => { X = ctx; } };
