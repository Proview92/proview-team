// Proview Employee: small shared-data server. No packages needed, only Node.js 16 or newer.
// Run:  node server.js        Then open http://YOUR-SERVER:3000 on every phone.
// Optional settings (environment variables):
//   PORT=3000           the port to listen on
//   APP_CODE=secret     an access code every phone is asked for once (recommended when public)
//   DATA_FILE=/path/data.json   where the data is saved (default: data.json next to this file)
//   PRIVATE=0           turn OFF personal sign-in (everyone then sees everything; not recommended)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = Number(process.env.PORT || 3000);
const CODE = process.env.APP_CODE || '';
const DATA = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const HTML = path.join(__dirname, 'index.html');
const PRIV = process.env.PRIVATE !== '0';   // personal sign-in with a PIN, and each person only receives what they may see

let db = { rev: 0, state: null, sess: {} };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) {}
db.sess = db.sess || {};
let log = [];                 // recent changes: { rev, ops }
let logFloor = db.rev;        // changes older than this are not in the log (clients get a full copy instead)

let saveT = null;
function persist() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    const tmp = DATA + '.tmp';
    fs.writeFile(tmp, JSON.stringify(db), err => { if (!err) fs.rename(tmp, DATA, () => { dailyBackup(); }); });
  }, 400);
}
// One backup copy per day in a "backups" folder next to the data file. The newest 30 are kept.
function dailyBackup() {
  try {
    const dir = path.join(path.dirname(DATA), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const name = 'data-' + new Date().toISOString().slice(0, 10) + '.json';
    const f = path.join(dir, name);
    if (!fs.existsSync(f)) {
      fs.copyFileSync(DATA, f);
      fs.readdirSync(dir).filter(x => /^data-\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort().reverse().slice(30)
        .forEach(x => { try { fs.unlinkSync(path.join(dir, x)); } catch (e) {} });
    }
  } catch (e) {}
}

// Slow down anyone guessing the access code: after 30 wrong tries in 10 minutes, wait.
const fails = {};
function blocked(ip) { const f = fails[ip]; return !!f && f.n >= 30 && Date.now() - f.t < 10 * 60 * 1000; }
function failed(ip) { const f = fails[ip] && Date.now() - fails[ip].t < 10 * 60 * 1000 ? fails[ip] : (fails[ip] = { n: 0, t: Date.now() }); f.n++; f.t = Date.now(); }

function applyOps(st, ops) {
  ops.forEach(o => {
    const k = o.k;
    if (o.unset) { delete st[k]; return; }
    if ('set' in o) { st[k] = o.set; return; }
    let arr = st[k]; if (!Array.isArray(arr)) arr = st[k] = [];
    (o.up || []).forEach(x => { const i = arr.findIndex(y => y && y.id === x.id); if (i >= 0) arr[i] = x; else arr.push(x); });
    (o.del || []).forEach(id => { const i = arr.findIndex(y => y && String(y.id) === String(id)); if (i >= 0) arr.splice(i, 1); });
  });
}


// ---------- Who may see and change what ----------
const MGR_DEF = ['timesheets', 'approvals', 'rota', 'tasks', 'timeoff', 'reports', 'payslips', 'people', 'ai', 'settings'];
const isAdminU = u => u.role === 'owner' || u.role === 'admin';
function feat(u, k) {
  if (isAdminU(u)) return true;
  if (u.feats && u.feats[k] !== undefined) return !!u.feats[k];
  return u.role === 'manager' && MGR_DEF.includes(k);
}
const anyFeat = (u, list) => isAdminU(u) || list.some(k => feat(u, k));
const findIn = (k, id) => ((db.state && db.state[k]) || []).find(x => x && String(x.id) === String(id));
const isoDay = () => new Date().toISOString().slice(0, 10);

const PSTRIP = ['pin', 'rate', 'email', 'phone', 'payNo', 'payName', 'contract', 'otp', 'code', 'invited'];
function docsLite(d) {
  if (!d || typeof d !== 'object') return d;
  const o = {};
  for (const k in d) { const x = d[k]; o[k] = (x && typeof x === 'object' && x.file && x.file.data) ? { ...x, file: { ...x.file, data: '' } } : x; }
  return o;
}
function redactPerson(p, u) {
  if (isAdminU(u) || p.id === u.id) return p;
  if (feat(u, 'people')) { if (!isAdminU(p) || !p.pin) return p; const q = { ...p }; delete q.pin; return q; }   // managers never see an owner's or admin's PIN
  const o = { ...p };
  PSTRIP.forEach(k => delete o[k]);
  if (u.role === 'manager' || feat(u, 'rota') || feat(u, 'timesheets')) o.docs = docsLite(p.docs); else delete o.docs;
  return o;
}
function visible(k, x, u, st) {
  switch (k) {
    case 'payslips': return anyFeat(u, ['payslips']) || x.pid === u.id;
    case 'payMap': return anyFeat(u, ['payslips']);
    case 'entries':
      if (anyFeat(u, ['timesheets', 'approvals']) || x.pid === u.id) return true;
      return !!(st.perms && st.perms.memWho) && (x.out == null || x.out === '');
    case 'leave': case 'avail': return anyFeat(u, ['timeoff', 'rota']) || x.pid === u.id;
    case 'chat': return x.from === u.id || x.to === u.id || x.to === 'all';
    case 'notifs': return x.to === u.id || (!x.to && (isAdminU(u) || u.role === 'manager'));
    case 'exports': return anyFeat(u, ['reports']);
    default: return true;
  }
}
const FILTERED = new Set(['people', 'payslips', 'payMap', 'entries', 'leave', 'avail', 'chat', 'notifs', 'exports']);
function viewItem(k, x, u, st) { return k === 'people' ? redactPerson(x, u) : x; }
function viewState(st, u) {
  if (!u) return st;
  const o = {};
  for (const k in st) {
    const v = st[k];
    o[k] = (FILTERED.has(k) && Array.isArray(v)) ? v.filter(x => x && visible(k, x, u, st)).map(x => viewItem(k, x, u, st)) : v;
  }
  return o;
}
// The same filter for a list of changes that other phones receive.
function viewOps(ops, u, st) {
  if (!u) return ops;
  const out = [];
  ops.forEach(o => {
    if (!FILTERED.has(o.k)) { out.push(o); return; }
    if (o.unset) { out.push(o); return; }
    if ('set' in o) { out.push({ k: o.k, set: Array.isArray(o.set) ? o.set.filter(x => x && visible(o.k, x, u, st)).map(x => viewItem(o.k, x, u, st)) : o.set }); return; }
    const up = [], del = (o.del || []).slice();
    (o.up || []).forEach(x => { if (visible(o.k, x, u, st)) up.push(viewItem(o.k, x, u, st)); else del.push(x.id); });
    if (up.length || del.length) out.push({ k: o.k, up, del });
  });
  return out;
}

// What each feature switch lets a manager change.
const WF = {
  entries: ['timesheets', 'approvals'], shifts: ['rota'], cover: ['rota'], rotaRules: ['rota'], schedules: ['rota', 'settings'],
  tasks: ['tasks'], tkLib: ['tasks'], leave: ['timeoff'], policies: ['timeoff', 'settings'], calendars: ['settings', 'timeoff'],
  avail: ['rota', 'timeoff'], exports: ['reports'], payslips: ['payslips'], payMap: ['payslips'], docSet: ['people', 'settings'],
  org: ['settings'], perms: ['settings'], tt: ['settings'], locations: ['settings'], groups: ['people', 'settings'],
  activities: ['settings'], projects: ['settings'], clients: ['settings'], onb: ['settings'], otPol: ['settings']
};
// Things a person can never change about themselves.
const IMMUT = ['role', 'feats', 'rate', 'locs', 'licensed', 'archived', 'g', 'sched', 'contract', 'earliest', 'flex', 'trial', 'noTrack', 'payNo', 'payName', 'start', 'otp', 'code'];
function statusOK(x, ex) { return !ex ? (x.st == null || x.st === 'pending') : (x.st === ex.st || x.st === 'pending'); }
// A person's own items (their clock entries, requests, messages...).
function ownUp(k, x, ex, u) {
  switch (k) {
    case 'entries': case 'leave': return x.pid === u.id && (!ex || ex.pid === u.id) && statusOK(x, ex);
    case 'avail': return x.pid === u.id && (!ex || ex.pid === u.id);
    case 'chat': return x.from === u.id && (!ex || ex.from === u.id);
    case 'notifs': return true;
    case 'tasks': return true;
    case 'shifts':
      return !!ex && (ex.pid === u.id || (!ex.pid && ex.cover && ex.cover.open)) && (x.pid == null || x.pid === u.id);
    default: return false;
  }
}
function ownDel(k, ex, u) {
  if (!ex) return true;
  switch (k) {
    case 'entries': case 'leave': case 'avail': return ex.pid === u.id;
    case 'chat': return ex.from === u.id;
    case 'notifs': return ex.to === u.id;
    default: return false;
  }
}
function checkOps(ops, u) {
  if (!u || isAdminU(u)) return { ops, dropped: 0 };
  const ok = []; let dropped = 0;
  ops.forEach(o => {
    const k = o.k;
    if (k === 'people') {
      if (o.unset || 'set' in o) { dropped++; return; }
      const up = [];
      (o.up || []).forEach(x => {
        const ex = findIn('people', x.id);
        if (x.id === u.id && ex) { const m = { ...x }; IMMUT.forEach(f => { if (f in ex) m[f] = ex[f]; else delete m[f]; }); if (m.docs && ex.docs && ex.docs.ovr !== undefined) m.docs = { ...m.docs, ovr: ex.docs.ovr }; up.push(m); }
        else if (feat(u, 'people') && ex && !isAdminU(ex)) { up.push({ ...x, role: ex.role, feats: ex.feats }); }
        else if (feat(u, 'people') && !ex) { up.push({ ...x, role: 'member', feats: {} }); }
        else dropped++;
      });
      const del = [];
      (o.del || []).forEach(id => { const ex = findIn('people', id); if (!ex || (feat(u, 'people') && !isAdminU(ex) && id !== u.id)) del.push(id); else dropped++; });
      if (up.length || del.length) ok.push({ k, up, del });
      return;
    }
    if (o.unset) { dropped++; return; }
    const wf = WF[k];
    if (wf && wf.some(f => feat(u, f))) { ok.push(o); return; }
    if ('set' in o) { dropped++; return; }
    const up = [], del = [];
    (o.up || []).forEach(x => { if (ownUp(k, x, findIn(k, x.id), u)) up.push(x); else dropped++; });
    (o.del || []).forEach(id => { if (ownDel(k, findIn(k, id), u)) del.push(id); else dropped++; });
    if (up.length || del.length) ok.push({ k, up, del });
  });
  return { ops: ok, dropped };
}

// ---------- Personal sign-in ----------
const SESS_DAYS = 90;
function newToken(id, days) {
  const t = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  Object.keys(db.sess).forEach(x => { if (db.sess[x].exp < now) delete db.sess[x]; });
  db.sess[t] = { id, exp: now + (days || SESS_DAYS) * 864e5 };
  persist();
  return t;
}
function authOf(req) {
  if (!PRIV) return { open: true, u: null };
  const t = req.headers['x-token'];
  const s = t && db.sess[t];
  if (!s || s.exp < Date.now() || !db.state) return null;
  const p = findIn('people', s.id);
  if (!p || p.archived) return null;
  return { u: p, t };
}
const pinFails = {};
function pinBlocked(key, max) { const f = pinFails[key]; return !!f && f.n >= max && Date.now() - f.t < 10 * 60 * 1000; }
function pinFailed(key) { const f = pinFails[key] && Date.now() - pinFails[key].t < 10 * 60 * 1000 ? pinFails[key] : (pinFails[key] = { n: 0, t: Date.now() }); f.n++; f.t = Date.now(); }

function send(res, code, obj, type) {
  const body = type ? obj : JSON.stringify(obj);
  res.writeHead(code, { 'content-type': type || 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}
function readBody(req, limit) {
  return new Promise((ok, no) => {
    let n = 0; const b = [];
    req.on('data', c => { n += c.length; if (n > limit) { no(new Error('too big')); req.destroy(); } else b.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(b).toString() || '{}')); } catch (e) { no(e); } });
    req.on('error', no);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return send(res, 200, fs.readFileSync(HTML), 'text/html; charset=utf-8');
    }
    if (url.pathname === '/healthz') return send(res, 200, { ok: true });
    if (!url.pathname.startsWith('/api/')) return send(res, 404, { error: 'not found' });
    if (url.pathname === '/api/ping') return send(res, 200, { proview: true, rev: db.rev, code: !!CODE, priv: PRIV, hasState: !!db.state });
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (CODE) {
      if (blocked(ip)) return send(res, 429, { error: 'too many tries, wait a few minutes' });
      if (req.headers['x-code'] !== CODE) { failed(ip); return send(res, 401, { error: 'code' }); }
    }

    // ----- sign-in (no token needed) -----
    if (PRIV && url.pathname === '/api/people' && req.method === 'GET') {
      if (!db.state) return send(res, 200, { org: '', people: [] });
      const list = (db.state.people || []).filter(p => p && !p.archived && p.licensed !== false).map(p => ({ id: p.id, name: p.name, role: p.role, pin: !!p.pin, trial: !!p.trial }));
      return send(res, 200, { org: (db.state.org && db.state.org.name) || '', people: list });
    }
    if (PRIV && url.pathname === '/api/login' && req.method === 'POST') {
      const b = await readBody(req, 1e5);
      const p = findIn('people', b.id);
      if (!p || p.archived) return send(res, 404, { error: 'person' });
      if (pinBlocked(ip + '|' + p.id, 8) || pinBlocked('id|' + p.id, 25)) return send(res, 429, { error: 'wait' });
      if (!p.pin) {
        if (p.role === 'owner') return send(res, 200, { setup: true });   // the owner creates the first PIN
        return send(res, 403, { error: 'nopin' });
      }
      if (String(b.pin || '') !== String(p.pin)) { pinFailed(ip + '|' + p.id); pinFailed('id|' + p.id); return send(res, 401, { error: 'pin' }); }
      return send(res, 200, { token: newToken(p.id), id: p.id });
    }
    if (PRIV && url.pathname === '/api/setpin' && req.method === 'POST') {
      const b = await readBody(req, 1e5);
      const p = findIn('people', b.id);
      if (!p || p.archived || p.role !== 'owner' || p.pin) return send(res, 403, { error: 'no' });
      if (!/^\d{3,6}$/.test(String(b.pin || ''))) return send(res, 400, { error: 'format' });
      p.pin = String(b.pin);
      db.rev += 1; log.push({ rev: db.rev, ops: [{ k: 'people', up: [p], del: [] }] });
      persist();
      return send(res, 200, { token: newToken(p.id), id: p.id });
    }

    if (url.pathname === '/api/init' && req.method === 'POST') {
      const b = await readBody(req, 40e6);
      if (!db.state && b.state) { db.state = b.state; db.rev = 1; logFloor = 1; log = []; persist(); }
      return send(res, 200, PRIV ? { rev: db.rev } : { rev: db.rev, state: db.state });
    }

    // ----- everything below needs a signed-in person -----
    const au = authOf(req);
    if (!au) return send(res, 401, { error: 'token' });
    const u = au.u;

    if (url.pathname === '/api/logout' && req.method === 'POST') { if (au.t) { delete db.sess[au.t]; persist(); } return send(res, 200, { ok: true }); }

    // A manager hands their phone to a person on a trial shift for the day.
    if (url.pathname === '/api/handover' && req.method === 'POST') {
      const b = await readBody(req, 1e5);
      const t = findIn('people', b.id);
      if (!u || !feat(u, 'people') || !t || !t.trial || t.archived) return send(res, 403, { error: 'no' });
      return send(res, 200, { token: newToken(t.id, 0.25), id: t.id });
    }

    if (url.pathname === '/api/state' && req.method === 'GET') return send(res, 200, { rev: db.rev, state: db.state ? viewState(db.state, u) : null });

    if (url.pathname === '/api/ops' && req.method === 'POST') {
      const b = await readBody(req, 40e6);
      if (!db.state) return send(res, 409, { error: 'no state' });
      const base = Number(b.base) || 0;
      const chk = checkOps(Array.isArray(b.ops) ? b.ops : [], u);
      const ops = chk.ops;
      // "Only if still free": e.g. taking a cover shift. If someone else got there first, nothing is changed.
      if (Array.isArray(b.cond)) {
        for (const c of b.cond) {
          const it = findIn(c.k, c.id); const cur = it ? it[c.f] : undefined;
          if (!(c.v == null ? cur == null : cur === c.v)) return send(res, 409, { conflict: true, rev: db.rev });
        }
      }
      const missed = (base >= logFloor ? log.filter(e => e.rev > base).map(e => viewOps(e.ops, u, db.state)).filter(x => x.length) : []);
      if (!ops.length) return send(res, 200, { rev: db.rev, missed, dropped: chk.dropped });
      applyOps(db.state, ops);
      db.rev += 1;
      log.push({ rev: db.rev, ops });
      if (log.length > 2000) { const cut = log.length - 1000; logFloor = log[cut - 1].rev; log = log.slice(cut); }
      persist();
      return send(res, 200, { rev: db.rev, missed, dropped: chk.dropped });
    }

    if (url.pathname === '/api/changes' && req.method === 'GET') {
      const since = Number(url.searchParams.get('since')) || 0;
      if (since >= db.rev) return send(res, 200, { rev: db.rev, ops: [] });
      if (since < logFloor) return send(res, 200, { rev: db.rev, snapshot: viewState(db.state, u) });
      const entries = log.filter(e => e.rev > since);
      return send(res, 200, { rev: db.rev, ops: entries.map(e => viewOps(e.ops, u, db.state)).filter(x => x.length) });
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, () => console.log('Proview Employee is running on http://localhost:' + PORT + (CODE ? ' (access code on)' : '')));
