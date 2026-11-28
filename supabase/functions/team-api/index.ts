// Proview Team: the shared-data API (the Supabase version of server-kit/server.js).
//
// Every phone talks to this function, never to the tables. It keeps one JSON document per location
// (pt_site_state), hands each person only what they may see, and refuses changes they may not make.
//
// Who is calling:
//   1. The Supabase login (Authorization: Bearer <session>) says which business and location they may open
//      (pt_business_members, or the Proview master) and whether the location is licensed.
//   2. The person inside the location (x-token) says what they may see and change. A login whose email is on a
//      person's profile gets that person straight away (POST api/auto); on a shared device people pick their
//      name and type their PIN (POST api/login), exactly as with server.js.
//
// Routes (all under /team-api/, header x-site: <location id>):
//   GET  api/ping      → { proview, rev, priv, hasState, role, master }
//   POST api/init      { state }       first upload for an empty location (owner, admin or master only)
//   GET  api/people    → { org, people: [{ id, name, role, pin, trial }] }
//   POST api/auto      → { token, id } | { none: true }
//   POST api/login     { id, pin } → { token, id } | { setup: true }
//   POST api/setpin    { id, pin } → { token, id }      (the owner's first PIN)
//   POST api/logout
//   POST api/handover  { id } → { token, id }            (trial shift on a manager's phone)
//   POST api/kcheck    { id, pin } | { exit: true, pin } → { ok }   (kiosk: is this the person's PIN / may the kiosk be left)
//   POST api/kqr       { txt } → { id } | { err }                 (kiosk: is this QR code genuine and fresh)
//   GET  api/state     → { rev, state }
//   POST api/ops       { base, ops, cond? } → { rev, missed, dropped }
//   GET  api/changes?since=N → { rev, ops } | { rev, snapshot }
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-site, x-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const send = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// deno-lint-ignore no-explicit-any
type Any = any;
type Op = { k: string; set?: Any; unset?: boolean; up?: Any[]; del?: Any[] };

function applyOps(st: Any, ops: Op[]) {
  ops.forEach((o) => {
    const k = o.k;
    if (o.unset) { delete st[k]; return; }
    if ("set" in o) { st[k] = o.set; return; }
    let arr = st[k]; if (!Array.isArray(arr)) arr = st[k] = [];
    (o.up || []).forEach((x) => { const i = arr.findIndex((y: Any) => y && y.id === x.id); if (i >= 0) arr[i] = x; else arr.push(x); });
    (o.del || []).forEach((id) => { const i = arr.findIndex((y: Any) => y && String(y.id) === String(id)); if (i >= 0) arr.splice(i, 1); });
  });
}

// ---------- Who may see and change what (unchanged from server.js) ----------
const MGR_DEF = ["timesheets", "approvals", "rota", "tasks", "timeoff", "reports", "payslips", "people", "ai", "settings"];
const isAdminU = (u: Any) => u.role === "owner" || u.role === "admin";
function feat(u: Any, k: string) {
  if (isAdminU(u)) return true;
  if (u.feats && u.feats[k] !== undefined) return !!u.feats[k];
  return u.role === "manager" && MGR_DEF.includes(k);
}
const anyFeat = (u: Any, list: string[]) => isAdminU(u) || list.some((k) => feat(u, k));
const findIn = (st: Any, k: string, id: Any) => ((st && st[k]) || []).find((x: Any) => x && String(x.id) === String(id));

const PSTRIP = ["pin", "rate", "email", "phone", "payNo", "payName", "contract", "otp", "code", "invited"];
function docsLite(d: Any) {
  if (!d || typeof d !== "object") return d;
  const o: Any = {};
  for (const k in d) { const x = d[k]; o[k] = (x && typeof x === "object" && x.file && x.file.data) ? { ...x, file: { ...x.file, data: "" } } : x; }
  return o;
}
function redactPerson(p: Any, u: Any) {
  if (isAdminU(u) || p.id === u.id) return p;
  // pinLen: how many digits the hidden PIN has, so a kiosk knows when to ask the server to check it (POST api/kcheck)
  if (feat(u, "people")) { if (!isAdminU(p) || !p.pin) return p; const q = { ...p }; q.pinLen = String(p.pin).length; delete q.pin; return q; }
  const o = { ...p };
  o.pinLen = p.pin ? String(p.pin).length : 0;
  PSTRIP.forEach((k) => delete o[k]);
  if (u.role === "manager" || feat(u, "rota") || feat(u, "timesheets")) o.docs = docsLite(p.docs); else delete o.docs;
  return o;
}
function visible(k: string, x: Any, u: Any, st: Any) {
  switch (k) {
    case "payslips": return anyFeat(u, ["payslips"]) || x.pid === u.id;
    case "payMap": return anyFeat(u, ["payslips"]);
    case "entries":
      if (anyFeat(u, ["timesheets", "approvals"]) || x.pid === u.id) return true;
      return !!(st.perms && st.perms.memWho) && (x.out == null || x.out === "");
    case "leave": case "avail": return anyFeat(u, ["timeoff", "rota"]) || x.pid === u.id;
    case "chat": return x.from === u.id || x.to === u.id || x.to === "all";
    case "notifs": return x.to === u.id || (!x.to && (isAdminU(u) || u.role === "manager"));
    case "exports": return anyFeat(u, ["reports"]);
    default: return true;
  }
}
const FILTERED = new Set(["people", "payslips", "payMap", "entries", "leave", "avail", "chat", "notifs", "exports"]);
const viewItem = (k: string, x: Any, u: Any) => k === "people" ? redactPerson(x, u) : x;
function viewState(st: Any, u: Any) {
  const o: Any = {};
  for (const k in st) {
    const v = st[k];
    o[k] = (FILTERED.has(k) && Array.isArray(v)) ? v.filter((x: Any) => x && visible(k, x, u, st)).map((x: Any) => viewItem(k, x, u)) : v;
  }
  return o;
}
function viewOps(ops: Op[], u: Any, st: Any) {
  const out: Op[] = [];
  ops.forEach((o) => {
    if (!FILTERED.has(o.k) || o.unset) { out.push(o); return; }
    if ("set" in o) { out.push({ k: o.k, set: Array.isArray(o.set) ? o.set.filter((x: Any) => x && visible(o.k, x, u, st)).map((x: Any) => viewItem(o.k, x, u)) : o.set }); return; }
    const up: Any[] = [], del = (o.del || []).slice();
    (o.up || []).forEach((x) => { if (visible(o.k, x, u, st)) up.push(viewItem(o.k, x, u)); else del.push(x.id); });
    if (up.length || del.length) out.push({ k: o.k, up, del });
  });
  return out;
}

const WF: Record<string, string[]> = {
  entries: ["timesheets", "approvals"], shifts: ["rota"], cover: ["rota"], rotaRules: ["rota"], schedules: ["rota", "settings"],
  tasks: ["tasks"], tkLib: ["tasks"], tkPhotos: ["tasks"], deliv: ["tasks"], delivSup: ["tasks", "settings"], leave: ["timeoff"], policies: ["timeoff", "settings"], calendars: ["settings", "timeoff"],
  avail: ["rota", "timeoff"], exports: ["reports"], payslips: ["payslips"], payMap: ["payslips"], docSet: ["people", "settings"],
  org: ["settings"], perms: ["settings"], tt: ["settings"], locations: ["settings"], groups: ["people", "settings"],
  activities: ["settings"], projects: ["settings"], clients: ["settings"], onb: ["settings"], otPol: ["settings"],
};
// Things a person can never change about themselves. "email" is here because, in this version, the email on a
// profile decides which login becomes that person.
const IMMUT = ["role", "feats", "rate", "locs", "licensed", "archived", "g", "sched", "contract", "earliest", "flex", "trial", "noTrack", "payNo", "payName", "start", "otp", "code", "email"];
function statusOK(x: Any, ex: Any) { return !ex ? (x.st == null || x.st === "pending") : (x.st === ex.st || x.st === "pending"); }
function ownUp(k: string, x: Any, ex: Any, u: Any) {
  switch (k) {
    case "entries": case "leave": return x.pid === u.id && (!ex || ex.pid === u.id) && statusOK(x, ex);
    case "avail": return x.pid === u.id && (!ex || ex.pid === u.id);
    case "chat": return x.from === u.id && (!ex || ex.from === u.id);
    case "notifs": return true;
    case "tasks": return true;
    case "tkPhotos": return x.by === u.id && !ex && typeof x.data === "string" && x.data.length < 400000; // staff add their own task photos, never change one
    case "deliv": return x.by === u.id && !ex && !x.rep && !x.got && (!x.ph || (typeof x.ph === "string" && x.ph.length < 400000)); // staff note a delivery problem, never change one
    case "shifts":
      return !!ex && (ex.pid === u.id || (!ex.pid && ex.cover && ex.cover.open)) && (x.pid == null || x.pid === u.id);
    default: return false;
  }
}
function ownDel(k: string, ex: Any, u: Any) {
  if (!ex) return true;
  switch (k) {
    case "entries": case "leave": case "avail": return ex.pid === u.id;
    case "chat": return ex.from === u.id;
    case "tkPhotos": return ex.by === u.id;
    case "notifs": return ex.to === u.id;
    default: return false;
  }
}
function checkOps(st: Any, ops: Op[], u: Any) {
  if (isAdminU(u)) return { ops, dropped: 0 };
  const ok: Op[] = []; let dropped = 0;
  ops.forEach((o) => {
    const k = o.k;
    if (k === "people") {
      if (o.unset || "set" in o) { dropped++; return; }
      const up: Any[] = [];
      (o.up || []).forEach((x) => {
        const ex = findIn(st, "people", x.id);
        if (x.id === u.id && ex) { const m = { ...x }; IMMUT.forEach((f) => { if (f in ex) m[f] = ex[f]; else delete m[f]; }); if (m.docs && ex.docs && ex.docs.ovr !== undefined) m.docs = { ...m.docs, ovr: ex.docs.ovr }; up.push(m); }
        else if (feat(u, "people") && ex && !isAdminU(ex)) { up.push({ ...x, role: ex.role, feats: ex.feats }); }
        else if (feat(u, "people") && !ex) { up.push({ ...x, role: "member", feats: {} }); }
        else dropped++;
      });
      const del: Any[] = [];
      (o.del || []).forEach((id) => { const ex = findIn(st, "people", id); if (!ex || (feat(u, "people") && !isAdminU(ex) && id !== u.id)) del.push(id); else dropped++; });
      if (up.length || del.length) ok.push({ k, up, del });
      return;
    }
    if (o.unset) { dropped++; return; }
    const wf = WF[k];
    if (wf && wf.some((f) => feat(u, f))) {
      // tasks and the deliveries log: managers add and change, only the owner or an admin deletes
      if (k === "tasks" || k === "deliv") {
        if ("set" in o) { dropped++; return; }
        const nd = (o.del || []).filter((id) => !findIn(st, k, id)); dropped += (o.del || []).length - nd.length;
        if ((o.up || []).length || nd.length) ok.push({ k, up: o.up || [], del: nd });
        return;
      }
      ok.push(o); return;
    }
    if ("set" in o) { dropped++; return; }
    const up: Any[] = [], del: Any[] = [];
    (o.up || []).forEach((x) => { if (ownUp(k, x, findIn(st, k, x.id), u)) up.push(x); else dropped++; });
    (o.del || []).forEach((id) => { if (ownDel(k, findIn(st, k, id), u)) del.push(id); else dropped++; });
    if (up.length || del.length) ok.push({ k, up, del });
  });
  return { ops: ok, dropped };
}

// ---------- storage ----------
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (s: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const SESS_DAYS = 90;

async function loadState(db: SupabaseClient, site: string): Promise<{ rev: number; state: Any | null }> {
  const r = await db.from("pt_site_state").select("rev,data").eq("id", site).maybeSingle();
  if (r.error) throw r.error;
  return r.data ? { rev: Number(r.data.rev), state: r.data.data } : { rev: 0, state: null };
}
async function commit(db: SupabaseClient, site: string, rev: number, state: Any, ops: Op[] | null): Promise<number | null> {
  const r = await db.rpc("pt_state_commit", { p_site: site, p_rev: rev, p_data: state, p_ops: ops });
  if (r.error) throw r.error;
  return r.data == null ? null : Number(r.data);
}
async function syncPeople(db: SupabaseClient, site: string, st: Any) {
  const list = ((st && st.people) || []).filter((p: Any) => p && !p.archived && p.email).map((p: Any) => ({ email: p.email, name: p.name, role: p.role }));
  const r = await db.rpc("pt_sync_people", { p_site: site, p_people: list });
  if (r.error) console.error("sync people", r.error);
}
async function newToken(db: SupabaseClient, site: string, pid: string, uid: string, days = SESS_DAYS) {
  const t = hex(crypto.getRandomValues(new Uint8Array(24)).buffer);
  await db.from("pt_site_sessions").delete().lt("exp", new Date().toISOString());
  const r = await db.from("pt_site_sessions").insert({ token_sha256: await sha(t), site, pid, user_id: uid, exp: new Date(Date.now() + days * 864e5).toISOString() });
  if (r.error) throw r.error;
  return t;
}
async function logSince(db: SupabaseClient, site: string, since: number, rev: number): Promise<Op[][] | null> {
  if (since >= rev) return [];
  const r = await db.from("pt_site_log").select("rev,ops").eq("site", site).gt("rev", since).order("rev");
  if (r.error) throw r.error;
  const rows = r.data || [];
  // every revision after "since" must be in the log, otherwise the phone gets a full copy
  if (rows.length !== rev - since || (rows.length && Number(rows[0].rev) !== since + 1)) return null;
  return rows.map((x) => x.ops as Op[]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/team-api\/?/, "").replace(/\/+$/, "");
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: ud } = await db.auth.getUser(jwt);
    const user = ud?.user;
    if (!user) return send({ error: "auth" }, 401);
    const email = String(user.email || "").toLowerCase();
    const site = String(req.headers.get("x-site") || "");
    if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(site)) return send({ error: "site" }, 400);
    const g = await db.rpc("pt_gate", { p_user: user.id, p_site: site });
    if (g.error) throw g.error;
    const gate = g.data as Any;
    if (!gate?.exists || (!gate.master && !gate.role)) return send({ error: "site" }, 403);
    if (!gate.master && !gate.ok) return send({ error: "licence", suspended: !!gate.suspended }, 402);
    const boss = gate.master || gate.role === "Admin";
    const body = async () => { try { return await req.json(); } catch (_) { return {}; } };

    let { rev, state } = await loadState(db, site);

    if (path === "api/ping") return send({ proview: true, rev, priv: true, hasState: !!state, role: gate.role, master: !!gate.master });

    if (path === "api/init" && req.method === "POST") {
      const b = await body();
      if (!state && b.state) {
        if (!boss) return send({ error: "Only an admin can set this business up." }, 403);
        const nr = await commit(db, site, 0, b.state, null);
        if (nr) { rev = nr; await syncPeople(db, site, b.state); } else rev = (await loadState(db, site)).rev;
      }
      return send({ rev });
    }
    if (!state) return send({ error: "no state" }, 409);

    // ----- who is this person? -----
    if (path === "api/people" && req.method === "GET") {
      const list = (state.people || []).filter((p: Any) => p && !p.archived && p.licensed !== false)
        .map((p: Any) => ({ id: p.id, name: p.name, role: p.role, pin: !!p.pin, trial: !!p.trial }));
      return send({ org: (state.org && state.org.name) || gate.site_name || "", people: list });
    }
    if (path === "api/auto" && req.method === "POST") {
      const rank = (p: Any) => p.role === "owner" ? 4 : p.role === "admin" ? 3 : p.role === "manager" ? 2 : 1;
      const live = (state.people || []).filter((p: Any) => p && !p.archived);
      let p = live.filter((x: Any) => String(x.email || "").trim().toLowerCase() === email).sort((a: Any, b: Any) => rank(b) - rank(a))[0];
      // a business admin (or Proview) with no profile of their own comes in as the first admin
      if (!p && boss) p = live.find((x: Any) => x.role === "owner") || live.find((x: Any) => x.role === "admin");
      if (!p) return send({ none: true });
      return send({ token: await newToken(db, site, p.id, user.id), id: p.id });
    }
    if (path === "api/login" && req.method === "POST") {
      const b = await body();
      const p = findIn(state, "people", b.id);
      if (!p || p.archived) return send({ error: "person" }, 404);
      const k1 = site + "|" + user.id + "|" + p.id, k2 = site + "|id|" + p.id;
      const bl = await Promise.all([db.rpc("pt_pin_blocked", { p_key: k1, p_max: 8 }), db.rpc("pt_pin_blocked", { p_key: k2, p_max: 25 })]);
      if (bl[0].data || bl[1].data) return send({ error: "wait" }, 429);
      if (!p.pin) return p.role === "owner" ? send({ setup: true }) : send({ error: "nopin" }, 403);
      if (String(b.pin || "") !== String(p.pin)) {
        await db.rpc("pt_pin_failed", { p_key: k1 }); await db.rpc("pt_pin_failed", { p_key: k2 });
        return send({ error: "pin" }, 401);
      }
      return send({ token: await newToken(db, site, p.id, user.id), id: p.id });
    }
    if (path === "api/setpin" && req.method === "POST") {
      const b = await body();
      const p = findIn(state, "people", b.id);
      if (!p || p.archived || p.role !== "owner" || p.pin || !boss) return send({ error: "no" }, 403);
      if (!/^\d{3,6}$/.test(String(b.pin || ""))) return send({ error: "format" }, 400);
      p.pin = String(b.pin);
      const nr = await commit(db, site, rev, state, [{ k: "people", up: [p], del: [] }]);
      if (!nr) return send({ error: "busy" }, 409);
      return send({ token: await newToken(db, site, p.id, user.id), id: p.id });
    }

    // ----- everything below needs a signed-in person -----
    const tk = req.headers.get("x-token") || "";
    const th = tk ? await sha(tk) : "";
    const ss = th ? await db.from("pt_site_sessions").select("pid,exp,user_id").eq("token_sha256", th).eq("site", site).maybeSingle() : null;
    // a person-token only works for the login it was given to: a token left on a shared device is useless to the next email
    const sess = ss?.data && new Date(ss.data.exp).getTime() > Date.now() && (!ss.data.user_id || ss.data.user_id === user.id) ? ss.data : null;
    let u = sess ? findIn(state, "people", sess.pid) : null;
    if (!u || u.archived) return send({ error: "token" }, 401);

    if (path === "api/logout" && req.method === "POST") { await db.from("pt_site_sessions").delete().eq("token_sha256", th); return send({ ok: true }); }

    if (path === "api/handover" && req.method === "POST") {
      const b = await body();
      const t = findIn(state, "people", b.id);
      if (!feat(u, "people") || !t || !t.trial || t.archived) return send({ error: "no" }, 403);
      return send({ token: await newToken(db, site, t.id, user.id, 0.25), id: t.id });
    }

    // ----- kiosk checks: the tablet's login cannot see PINs or kiosk codes, so the server checks them -----
    if (path === "api/kcheck" && req.method === "POST") {
      if (!(isAdminU(u) || u.role === "manager") || !feat(u, "timesheets")) return send({ error: "no" }, 403);   // only a manager-level login runs a kiosk
      const b = await body();
      const pin = String(b.pin || "");
      const exit = !!b.exit;
      const p = exit ? null : findIn(state, "people", b.id);
      if (!exit && (!p || p.archived)) return send({ error: "person" }, 404);
      const k1 = site + "|k|" + u.id + "|" + (exit ? "exit" : p.id), k2 = site + "|kid|" + (exit ? "exit" : p.id);
      const bl = await Promise.all([db.rpc("pt_pin_blocked", { p_key: k1, p_max: 8 }), db.rpc("pt_pin_blocked", { p_key: k2, p_max: 25 })]);
      if (bl[0].data || bl[1].data) return send({ error: "wait" }, 429);
      // leaving the kiosk: any manager's, admin's or owner's PIN, or the PIN of the login the kiosk runs under
      const ok = !!pin && (exit
        ? (state.people || []).some((x: Any) => x && !x.archived && x.pin && (isAdminU(x) || x.role === "manager" || x.id === u.id) && String(x.pin) === pin)
        : (!!p.pin && String(p.pin) === pin));
      if (!ok) { await db.rpc("pt_pin_failed", { p_key: k1 }); await db.rpc("pt_pin_failed", { p_key: k2 }); }
      return send({ ok });
    }
    if (path === "api/kqr" && req.method === "POST") {
      if (!(isAdminU(u) || u.role === "manager") || !feat(u, "timesheets")) return send({ error: "no" }, 403);   // only a manager-level login runs a kiosk
      const b = await body();
      const m = /^PVQ1\.([A-Za-z0-9_-]+)\.(\d+)\.([0-9a-f]{12})$/.exec(String(b.txt || "").trim());
      if (!m) return send({ err: "other" });
      const p = findIn(state, "people", m[1]);
      if (!p || p.archived) return send({ err: "who" });
      if (!p.code) return send({ err: "bad", id: p.id });   // no kiosk code on the profile: nothing to sign with
      const w = Number(m[2]);
      if (Math.abs(Math.floor(Date.now() / 2000) - w) > 5) return send({ err: "old", id: p.id });
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode("pvq1|" + String(p.code || "") + "|" + p.id), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = hex(await crypto.subtle.sign("HMAC", key, enc.encode(p.id + "." + w))).slice(0, 12);
      if (sig !== m[3]) return send({ err: "bad", id: p.id });
      return send({ id: p.id });
    }

    if (path === "api/state" && req.method === "GET") return send({ rev, state: viewState(state, u) });

    if (path === "api/ops" && req.method === "POST") {
      const b = await body();
      const base = Number(b.base) || 0;
      for (let attempt = 0; attempt < 6; attempt++) {
        if (attempt) { ({ rev, state } = await loadState(db, site)); u = findIn(state, "people", sess!.pid); if (!state || !u || u.archived) return send({ error: "token" }, 401); }
        const chk = checkOps(state, Array.isArray(b.ops) ? b.ops : [], u);
        const ops = chk.ops;
        // "Only if still free": e.g. taking a cover shift. If someone else got there first, nothing is changed.
        if (Array.isArray(b.cond)) {
          for (const c of b.cond) {
            const it = findIn(state, c.k, c.id); const cur = it ? it[c.f] : undefined;
            if (!(c.v == null ? cur == null : cur === c.v)) return send({ conflict: true, rev }, 409);
          }
        }
        const log = await logSince(db, site, base, rev);
        const missed = log ? log.map((e) => viewOps(e, u, state)).filter((x) => x.length) : [];
        const stale = log === null;                       // too far behind: tell the phone to reload everything
        if (!ops.length) return send({ rev, missed, dropped: chk.dropped + (stale ? 1 : 0) });
        const touchesPeople = ops.some((o) => o.k === "people");
        applyOps(state, ops);
        const nr = await commit(db, site, rev, state, ops);
        if (!nr) continue;                                // someone else saved first: read again and retry
        if (touchesPeople) await syncPeople(db, site, state);
        return send({ rev: nr, missed, dropped: chk.dropped + (stale ? 1 : 0) });
      }
      return send({ error: "busy" }, 503);
    }

    if (path === "api/changes" && req.method === "GET") {
      const since = Number(url.searchParams.get("since")) || 0;
      if (since >= rev) return send({ rev, ops: [] });
      const log = await logSince(db, site, since, rev);
      if (!log) return send({ rev, snapshot: viewState(state, u) });
      return send({ rev, ops: log.map((e) => viewOps(e, u, state)).filter((x) => x.length) });
    }
    return send({ error: "not found" }, 404);
  } catch (e) {
    console.error(e);
    return send({ error: String((e as Error)?.message || e) }, 500);
  }
});
