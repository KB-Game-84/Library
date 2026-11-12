// Dice-build party game server. No dependencies: `node server.js`
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000, PARTS = 6, MAX = 8, rooms = new Map();
const COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#6a4c93', '#1d7ed8', '#e76f9b', '#7cb518', '#ff9f1c'];
const tok = () => crypto.randomBytes(8).toString('hex');
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[crypto.randomInt(24)]).join(''); } while (rooms.has(c)); return c; };
const page = fs.readFileSync(path.join(__dirname, 'index.html'));
const full = p => p.parts.size >= PARTS;

const view = r => ({ code: r.code, mode: r.mode, phase: r.phase, round: r.round, turn: r.turn, last: r.last, winners: r.winners, busy: r.busy,
  players: r.players.map(p => ({ id: p.id, name: p.name, color: p.color, parts: [...p.parts], rolled: p.rolled, on: p.on })) });
const push = r => { r.touch = Date.now(); const s = 'data: ' + JSON.stringify(view(r)) + '\n\n'; r.clients.forEach(c => c.res.write(s)); };
const presence = r => r.players.forEach(p => { p.on = [...r.clients].some(c => c.key === p.key); });
const hostOnly = (r, b) => { if (r.hostKey !== b.hostKey) throw 'Not the host'; };
const clear = r => { r.players.forEach(p => { p.parts = new Set(); p.rolled = false; }); r.winners = []; r.last = null; r.round = 1; r.turn = 0; r.busy = false; clearTimeout(r.timer); r.timer = null; };

function next(r) {
  const n = r.players.length;
  for (let k = 1; k <= n; k++) { const i = (r.turn + k) % n; if (r.players[i].on) { if (i <= r.turn) r.round++; r.turn = i; break; } }
  r.players.forEach(p => { p.rolled = false; });
}
// Decide whether the round / turn is finished and move the game on.
function settle(r) {
  if (r.phase !== 'play' || r.timer) return;
  const on = r.players.filter(p => p.on);
  if (!on.length) return;
  if (r.mode === 'simul') {
    if (on.every(p => p.rolled)) {
      r.busy = true;
      r.timer = setTimeout(() => {
        r.timer = null; r.busy = false;
        const w = r.players.filter(full);
        if (w.length) { r.phase = 'over'; r.winners = w.map(p => p.id); }
        else { r.round++; r.players.forEach(p => { p.rolled = false; }); }
        push(r); settle(r);
      }, 2600);
    }
  } else {
    const cur = r.players[r.turn];
    if (!cur) return;
    if (cur.rolled) {
      r.busy = true;
      r.timer = setTimeout(() => {
        r.timer = null; r.busy = false;
        if (full(cur)) { r.phase = 'over'; r.winners = [cur.id]; } else next(r);
        push(r); settle(r);
      }, 2300);
    } else if (!cur.on) { next(r); push(r); settle(r); }
  }
}

const A = {
  host(b) {
    let r = rooms.get(b.code);
    if (r && r.hostKey === b.hostKey) return { code: r.code, hostKey: r.hostKey };
    r = { code: newCode(), hostKey: tok(), mode: 'simul', phase: 'lobby', round: 1, turn: 0, last: null, winners: [], busy: false,
      players: [], clients: new Set(), seq: 0, timer: null, touch: Date.now() };
    rooms.set(r.code, r);
    return { code: r.code, hostKey: r.hostKey };
  },
  join(b, r) {
    let p = r.players.find(p => b.key && p.key === b.key);
    if (!p) {
      if (r.phase !== 'lobby') throw 'This game has already started';
      if (r.players.length >= MAX) throw 'This room is full (8 players)';
      const name = String(b.name || '').trim().slice(0, 14);
      if (!name) throw 'Enter your name';
      p = { id: tok().slice(0, 6), key: tok(), name, color: COLORS[r.players.length % COLORS.length], parts: new Set(), rolled: false, on: false };
      r.players.push(p);
    }
    push(r); return { key: p.key, id: p.id, name: p.name };
  },
  mode(b, r) { hostOnly(r, b); if (r.phase === 'lobby') r.mode = b.mode === 'turns' ? 'turns' : 'simul'; push(r); },
  start(b, r) { hostOnly(r, b); if (!r.players.length) throw 'Waiting for players'; clear(r); r.phase = 'play'; presence(r); push(r); settle(r); },
  again(b, r) { hostOnly(r, b); clear(r); r.phase = 'lobby'; push(r); },
  roll(b, r) {
    const p = r.players.find(p => b.key && p.key === b.key);
    if (!p || r.phase !== 'play' || r.busy || p.rolled) throw "You can't roll right now";
    if (r.mode === 'turns' && r.players[r.turn] !== p) throw 'Not your turn';
    const n = 1 + crypto.randomInt(PARTS), isNew = !p.parts.has(n);
    p.parts.add(n); p.rolled = true; r.last = { id: p.id, n, isNew, seq: ++r.seq };
    settle(r); push(r);
  },
};

http.createServer((q, s) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/events') {
    const r = rooms.get(u.searchParams.get('room'));
    if (!r) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const c = { res: s, key: u.searchParams.get('key') || '' };
    r.clients.add(c); presence(r); push(r);
    q.on('close', () => { r.clients.delete(c); presence(r); push(r); settle(r); });
    return;
  }
  if (u.pathname === '/api' && q.method === 'POST') {
    let d = '';
    q.on('data', x => { d += x; if (d.length > 5e3) q.destroy(); });
    q.on('end', () => {
      try {
        const b = JSON.parse(d || '{}');
        if (!Object.hasOwn(A, b.a)) throw 'Bad request';
        const r = rooms.get(b.room);
        if (b.a !== 'host' && !r) throw 'Room not found';
        const out = A[b.a](b, r) || {};
        s.writeHead(200, { 'Content-Type': 'application/json' }); s.end(JSON.stringify(out));
      } catch (e) {
        s.writeHead(400, { 'Content-Type': 'application/json' });
        s.end(JSON.stringify({ error: typeof e === 'string' ? e : 'Bad request' }));
      }
    });
    return;
  }
  s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); s.end(page);
}).listen(PORT, () => console.log('Game running on http://localhost:' + PORT));

setInterval(() => {
  const now = Date.now();
  rooms.forEach((r, k) => { r.clients.forEach(c => c.res.write(': ping\n\n')); if (!r.clients.size && now - r.touch > 6 * 3600e3) rooms.delete(k); });
}, 20000);
