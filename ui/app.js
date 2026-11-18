// EventMind UI — standalone: renders any state.json produced by the engine.
// Source: GET /state.json (live via serve.py) or a file the user loads/drops.
"use strict";

let STATE = null, LIVE = false, lastUpdated = null, CHART = "budget", TAB = "overview", SOURCE = "";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rs = (n) => (n === null || n === undefined || isNaN(n)) ? "—" : "Rs " + Math.round(n).toLocaleString("en-US");
const short = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(Math.round(n));
const tag = (a) => `<span class="tag t-${esc(a)}">${esc(a)}</span>`;
// Display-only title case for names that come from extracted facts ("room d" -> "Room D"); stored data is untouched.
const title = (s) => String(s ?? "").replace(/(^|[\s\-\/(:])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/(\d) X /g, "$1 x ");
const STATUS_COLOR = {used:"var(--green)", stale:"var(--hatch)", rejected:"var(--red)", irrelevant:"var(--blue)", optional:"var(--yellow)", needs_review:"var(--purple)"};
const statusLabel = (k) => t("status." + k);
const langBadge = (code) => { const c = code || "und"; return `<span class="badge b-lang" title="${esc(langName(c))}" dir="ltr">${esc(c === "und" ? "?" : c)}</span>`; };

// ---------- theme ----------
function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("em-theme", t); } catch (_) {} }
try { setTheme(localStorage.getItem("em-theme") || "light"); } catch (_) {}
$("themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

applyI18n(); $("emptyText").textContent = t("empty.text");

// ---------- navigation ----------
function showTab(name) {
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
  TAB = name;
  $("pageTitle").textContent = t("title." + name);
  if (STATE) $("tab-" + name).classList.remove("hidden");
}
// ---------- UI language ----------
function refreshLang() {
  applyI18n();
  $("emptyText").textContent = t("empty.text");
  $("pageTitle").textContent = t("title." + TAB);
  if (STATE) { $("conn").textContent = connLabel(); render(); }
  else $("conn").textContent = t("conn.none");
}
$("langSwitch").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { setUiLang(b.dataset.lang); refreshLang(); } });
const connLabel = () => LIVE ? t("conn.live") : SOURCE;

$("tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showTab(b.dataset.tab); });
$("addBtn").onclick = () => { showTab("messages"); $("newMsg").focus(); };
$("barTabs").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  CHART = b.dataset.chart;
  document.querySelectorAll("#barTabs button").forEach(x => x.classList.toggle("active", x === b));
  renderBars();
});

// ---------- loading ----------
function load(state, source) {
  STATE = state; SOURCE = source;
  $("conn").textContent = connLabel();
  $("conn").className = "chip" + (LIVE ? " live" : "");
  $("empty").classList.add("hidden");
  showTab(document.querySelector("#tabs button.active").dataset.tab);
  render();
}
$("fileInput").addEventListener("change", (e) => readFile(e.target.files[0]));
const dz = $("dropzone");
["dragover","dragenter"].forEach(ev => document.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
["dragleave","drop"].forEach(ev => document.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
document.addEventListener("drop", (e) => { if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); });
function readFile(f) {
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { LIVE = false; load(JSON.parse(r.result), t("conn.file") + " · " + f.name); } catch (err) { alert(t("xl.badfile", {e: err.message})); } };
  r.readAsText(f);
}
async function poll() {
  try {
    const res = await fetch("/state.json?t=" + Date.now(), {cache: "no-store"});
    if (res.ok) { const s = await res.json(); LIVE = true; if (s.updated !== lastUpdated) { lastUpdated = s.updated; load(s, ""); } }
  } catch (_) { /* standalone mode */ }
}
poll(); setInterval(poll, 3000);

$("downloadBtn").onclick = () => { if (!STATE) { alert(t("xl.nodata")); return; } downloadExcel(STATE, title); };

// ---------- attachments (email / document) ----------
const ATTACH_OK = [".eml", ".txt", ".md", ".csv", ".json", ".docx", ".pdf"], ATTACH_MAX = 10 * 1024 * 1024;
let ATTACH = [];
function addAttachments(list) {
  for (const f of list) {
    const ext = (f.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
    if (!ATTACH_OK.includes(ext) || f.size > ATTACH_MAX || !f.size) { $("sendStatus").textContent = t("msg.badfile", {n: f.name}); continue; }
    ATTACH.push(f);
  }
  drawAttach();
}
function drawAttach() {
  $("attachList").innerHTML = ATTACH.map((f, i) => `<span class="chip">${esc(f.name)} <button class="x" data-i="${i}" aria-label="remove">×</button></span>`).join("");
}
$("attachList").addEventListener("click", (e) => { const b = e.target.closest("button.x"); if (b) { ATTACH.splice(+b.dataset.i, 1); drawAttach(); } });
const menu = $("attachMenu");
const setMenu = (open) => { menu.classList.toggle("hidden", !open); $("attachBtn").setAttribute("aria-expanded", String(open)); };
$("attachBtn").addEventListener("click", (e) => { e.stopPropagation(); setMenu(menu.classList.contains("hidden")); });
$("attachPick").addEventListener("click", () => { setMenu(false); $("attachInput").click(); });
document.addEventListener("click", (e) => { if (!menu.contains(e.target)) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
// "Add email": no account or connection - paste the email's parts (or upload an .eml); it joins the message box as plain text.
const setEmail = (open) => { $("emailForm").classList.toggle("hidden", !open); if (open) $("emFrom").focus(); };
$("menuEmail").addEventListener("click", () => { setMenu(false); setEmail(true); });
$("emCancel").addEventListener("click", () => setEmail(false));
$("emUpload").addEventListener("click", () => $("emlInput").click());
$("emlInput").addEventListener("change", (e) => { addAttachments(e.target.files); e.target.value = ""; setEmail(false); });
$("emAdd").addEventListener("click", () => {
  const f = {From: $("emFrom").value.trim(), Date: $("emDate").value.trim(), Subject: $("emSubject").value.trim()}, body = $("emBody").value.trim();
  if (!body) { $("emBody").focus(); return; }
  const NL = String.fromCharCode(10), head = Object.entries(f).filter(([, v]) => v).map(([k, v]) => k + ": " + v).join(NL);
  const box = $("newMsg"); box.value = (box.value.trim() ? box.value.trim() + NL + NL : "") + (head ? head + NL + NL : "") + body;
  ["emFrom", "emDate", "emSubject", "emBody"].forEach(id => $(id).value = ""); setEmail(false); box.focus();
});
$("attachInput").addEventListener("change", (e) => { addAttachments(e.target.files); e.target.value = ""; });
const addCard = $("addCard");
["dragover", "dragenter", "drop"].forEach(ev => addCard.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); if (ev === "drop") addAttachments(e.dataTransfer.files); }));
const toB64 = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res({name: f.name, b64: String(r.result).split(",")[1] || ""}); r.onerror = rej; r.readAsDataURL(f); });

$("sendMsg").addEventListener("click", async () => {
  const text = $("newMsg").value.trim(); if (!text && !ATTACH.length) return;
  $("sendMsg").disabled = true; $("sendStatus").textContent = t("msg.processing");
  try {
    const files = await Promise.all(ATTACH.map(toB64));
    const res = await fetch("/api/message", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text, files})});
    const out = await res.json();
    $("sendStatus").textContent = out.ok ? t("msg.done") : t("msg.error", {e: out.error || "see terminal"});
    if (out.ok) { $("newMsg").value = ""; ATTACH = []; drawAttach(); }
    lastUpdated = null; await poll();
    if (out.ok) showResult();
  } catch (_) { $("sendStatus").textContent = t("msg.nobackend"); }
  finally { $("sendMsg").disabled = false; }
});

// ---------- result of the last processed message(s) + follow-up questions ----------
function showResult() {
  const card = $("resultCard"), run = (STATE?.runs || []).slice(-1)[0];
  if (!run) { card.classList.add("hidden"); return; }
  const msgs = (STATE.messages || []).filter(m => (run.new_messages || []).includes(m.n));
  const changed = (run.changed_areas || []).map(a => t("chart." + a) !== "chart." + a ? t("chart." + a) : a).join(", ");
  const GENERIC = [t("res.g1"), t("res.g2"), t("res.g3")];
  const seen = !msgs.length && !run.calls;                       // same text sent again: nothing new was read
  // a message that gave the planner nothing to use gets the general questions, unless it already carries specific ones
  const thin = msgs.some(m => m.status === "irrelevant" && !(m.ask || []).length);
  const asks = msgs.flatMap(m => ((m.ask || []).length ? m.ask : (m.status === "irrelevant" ? GENERIC : [])).map(q => ({q, n: m.n})));
  if (seen || (!msgs.length && !run.calls)) GENERIC.forEach(q => asks.push({q, n: 0}));
  const notice = seen ? t("res.seen") : (thin || asks.length ? t("res.notenough") : "");
  card.innerHTML = `<h3>${t("res.title")}</h3>
    <div class="muted small">${t("res.meta", {n: run.run, c: run.calls, k: run.tokens?.total ?? 0})}</div>
    ${msgs.length ? msgs.map(m => `<div class="resmsg"><div class="row">${langBadge(m.lang)}<span class="badge b-${esc(m.status)}">${esc(STATUS_COLOR[m.status] ? statusLabel(m.status) : m.status)}</span><b>${esc(title(m.sender))}</b></div>
        <div class="gist" dir="ltr">${esc(m.gist)}</div><div class="small">→ ${esc(m.reason || "")}</div></div>`).join("")
      : (seen ? "" : `<p class="bad">${t("res.noread")}</p>`)}
    ${notice ? `<p class="warn"><b>⚠ ${notice}</b></p>` : ""}
    <p class="${changed ? "ok" : "muted"}"><b>${changed ? t("res.changed", {a: esc(changed)}) : t("res.nochange")}</b></p>
    ${asks.length ? `<div class="asks"><h3>${t("res.questions")}</h3>${asks.map((x, i) => `<div class="ask"><label>${esc(x.q)}<input type="text" data-q="${i}" placeholder="${t("res.answer")}"></label><button class="btn btn-dark" data-send="${i}">${t("res.send")}</button></div>`).join("")}</div>` : ""}`;
  card.classList.remove("hidden");
  card.dataset.asks = JSON.stringify(asks.map(x => x.q));
}
$("resultCard").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-send]"); if (!b) return;
  const card = $("resultCard"), q = JSON.parse(card.dataset.asks || "[]")[+b.dataset.send];
  const ans = card.querySelector(`input[data-q="${b.dataset.send}"]`).value.trim(); if (!ans) return;
  $("newMsg").value = "Re: " + q + String.fromCharCode(10) + ans; $("sendMsg").click();
});

// ---------- chart helpers ----------
function donut(segments, centerBig, centerSmall, size = 160, width = 26) {
  const r = (size - width) / 2, c = size / 2, total = segments.reduce((a, s) => a + s.value, 0);
  const gap = segments.filter(s => s.value > 0).length > 1 ? 7 : 0;
  let start = 0, arcs = "";
  segments.forEach(s => {
    if (!s.value) return;
    const len = 100 * s.value / total, vis = Math.max(len - gap, 0.5);
    arcs += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${width}" pathLength="100"
      stroke-dasharray="${vis} ${100 - vis}" stroke-dashoffset="${-start - gap / 2}" stroke-linecap="round"><title>${esc(s.label)}: ${s.value}</title></circle>`;
    start += len;
  });
  return `<svg viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="url(#hatch)" stroke-width="${width - 6}"/>${total ? arcs : ""}</svg>
    <div class="donut-center"><b>${esc(centerBig)}</b><span class="muted small">${esc(centerSmall)}</span></div>`;
}
function gauge(pct, color) {
  const p = Math.max(0, Math.min(100, pct || 0));
  const arc = "M 20 100 A 75 75 0 0 1 170 100";
  return `<svg viewBox="0 0 190 110"><path d="${arc}" fill="none" stroke="url(#hatch)" stroke-width="22" stroke-linecap="round"/>
    <path d="${arc}" fill="none" stroke="${color}" stroke-width="22" stroke-linecap="round" pathLength="100" stroke-dasharray="${p} 100"/></svg>`;
}
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p * 1.1) * p; }

// ---------- render ----------
function render() {
  const s = STATE, plan = s.plan || {}, checks = s.checks || [];
  const runs = s.runs || [], lastRun = runs.slice(-1)[0] || {};
  const changed = new Set(lastRun.kind === "update" ? (lastRun.changed_areas || []) : []);
  const passed = checks.filter(c => c.ok).length, allOk = checks.length && passed === checks.length;

  $("health").textContent = allOk ? t("plan.valid") : t("plan.issues", {n: checks.length - passed});
  $("health").className = "tag-pill " + (allOk ? "ok" : "bad");
  $("heroTitle").textContent = t("plan.title");
  const sc = plan.schedule || {};
  $("heroSub").textContent = [sc.start && `${sc.start} – ${sc.end}`, plan.headcount?.total && t("plan.people", {n: plan.headcount.total}),
    plan.judging?.teams && t("plan.teams", {n: plan.judging.teams}), t("plan.run", {n: lastRun.run || 0, kind: lastRun.kind || "—"})].filter(Boolean).join(" · ");
  $("heroCalls").textContent = t("plan.calls", {n: lastRun.calls ?? 0});
  $("updated").textContent = s.updated ? t("plan.updated", {t: s.updated}) : "";
  document.querySelectorAll("[data-area]").forEach(el => el.classList.toggle("changed", changed.has(el.dataset.area)));

  const steps = [[t("step.read"), (s.trace || []).length > 0 || (s.messages || []).length > 0], [t("step.resolve"), (s.messages || []).length > 0],
    [t("step.plan"), !!plan.venue?.name], [t("step.validate"), !!allOk], [t("step.trace"), (s.trace || []).length > 0], [t("step.ready"), !!allOk]];
  $("stepper").innerHTML = steps.map(([l, d], i) => `<li class="${d ? "done" : ""}"><div class="node">${d ? "✓" : i + 1}</div>${l}</li>`).join("");

  renderBars();

  const counts = {}; (s.messages || []).forEach(m => counts[m.status] = (counts[m.status] || 0) + 1);
  const segs = Object.entries(STATUS_COLOR).map(([k, color]) => ({label: statusLabel(k), color, value: counts[k] || 0}));
  $("msgDonut").innerHTML = donut(segs, (s.messages || []).length, t("unit.messages"), 200, 30);
  $("msgLegend").innerHTML = segs.map(x => `<span><i style="background:${x.color}"></i>${x.label} <b>${x.value}</b></span>`).join("");

  const h = plan.headcount || {};
  const hb = [[t("hc.students"), h.students], [t("hc.staff"), h.staff], [t("hc.judges"), h.judges], [t("hc.other"), h.other], [t("hc.total"), h.total]];
  const hmax = Math.max(1, ...hb.map(x => x[1] || 0));
  $("headBars").innerHTML = hb.map(([l, v], i) => `<div class="mb ${i === 4 ? "hi" : ""}"><em>${v ?? 0}</em><div style="height:${Math.max(4, 100 * (v || 0) / hmax)}%"></div><small>${l}</small></div>`).join("");

  $("checkDonut").innerHTML = donut([{label: t("check.passed"), color: "var(--green)", value: passed}, {label: t("check.failed"), color: "var(--red)", value: checks.length - passed}],
    `${passed}/${checks.length}`, t("unit.passed"), 150, 22);
  $("checkLegend").innerHTML = `<span><i class="lg-green"></i>${t("check.passed")} (${passed})</span><span><i class="lg-red"></i>${t("check.failed")} (${checks.length - passed})</span>`;

  const b = plan.budget || {}, pct = b.cap ? 100 * b.total / b.cap : 0;
  $("gauge").innerHTML = gauge(pct, pct > 100 ? "var(--red)" : "var(--purple)") +
    `<b>${b.cap ? Math.round(pct) + "%" : "—"}</b><span>${t("gauge.of", {a: rs(b.total), b: rs(b.cap)})}</span><span class="small ${b.remaining >= 0 ? "ok" : "bad"}">${t("gauge.left", {v: rs(b.remaining)})}</span>`;

  const tot = s.totals || {};
  $("tokTotal").textContent = (tot.total ?? 0).toLocaleString();
  $("tokCalls").textContent = tot.calls ?? 0;
  $("tokRuns").textContent = runs.length;
  const pt = tot.prompt || 0, ct = tot.completion || 0, tt = Math.max(1, pt + ct);
  $("tokBar").innerHTML = `<span style="flex:${pt / tt};background:var(--green)" title="prompt ${pt}"></span><span style="flex:${ct / tt};background:var(--yellow)" title="completion ${ct}"></span>`;

  $("checks").innerHTML = `<table><tr><th></th><th>${t("col.check")}</th><th>${t("col.area")}</th><th>${t("col.expected")}</th><th>${t("col.actual")}</th></tr>` +
    checks.map(c => `<tr><td class="${c.ok ? "ok" : "bad"}">${c.ok ? "✔" : "✘"}</td><td>${esc(c.label)}</td><td>${tag(c.area)}</td><td>${esc(c.expected)}</td><td>${esc(c.actual)}</td></tr>`).join("") + `</table>`;
  renderBudget(b); renderVenue(plan.venue || {}, h); renderFood(plan.food || {}, h); renderJudging(plan.judging || {}); renderSchedule(sc);
  $("decisions").innerHTML = (s.decisions || []).map(d => `<li>${esc(d)}</li>`).join("") || `<li class="muted">${t("none")}</li>`;
  $("privacy").innerHTML = (s.privacy || []).map(d => `<li>${esc(d)}</li>`).join("") || `<li class="muted">${t("privacy.none")}</li>`;

  renderLangs(s.messages || []); renderMessages(s.messages || []); renderRejected(s.rejected || []); renderTrace(s); renderHistory(runs);
}

function renderBars() {
  if (!STATE) return;
  const p = STATE.plan || {};
  let items = [], fmt = rs, note = "";
  if (CHART === "budget") {
    items = (p.budget?.lines || []).map(l => ({label: title(l.item.replace(/^(Venue|Food|Judges): /, "")), value: l.amount}));
    const mx = Math.max(0, ...items.map(i => i.value)); items.forEach(i => i.hi = i.value === mx && mx > 0);
    note = t("chart.total", {v: rs(p.budget?.total)});
  } else if (CHART === "schedule") {
    items = (p.schedule?.blocks || []).map(b => ({label: title(b.item.replace(" session", "")), value: b.minutes, sub: `${b.start}–${b.end}`, hi: b.kind === "judging"}));
    fmt = (v) => v + " " + t("unit.min"); note = `${p.schedule?.duration_min ?? 0} ${t("unit.min")}`;
  } else if (CHART === "venues") {
    items = (p.venue?.options || []).map(o => ({label: title(o.name), value: o.price, sub: `${o.capacity} seats · ${o.note || ""}`, hi: o.chosen}));
    note = p.venue?.name ? t("chart.chosen", {v: title(p.venue.name)}) : "";
  } else {
    items = (p.food?.options || []).map(o => ({label: title(o.name), value: o.price_per_head, sub: t("chart.perhead"), hi: o.chosen}));
    note = p.food?.name ? t("chart.chosen", {v: title(p.food.name)}) : "";
  }
  $("barNote").textContent = note;
  if (!items.length) { $("barChart").innerHTML = `<p class="muted">${t("chart.nodata")}</p>`; return; }
  const max = niceMax(Math.max(...items.map(i => i.value || 0)));
  const ticks = [1, .75, .5, .25, 0].map(f => CHART === "schedule" ? Math.round(max * f) : short(max * f));
  $("barChart").innerHTML = `<div class="yaxis">${ticks.map(t => `<span>${t}</span>`).join("")}</div>` +
    items.map((i, idx) => `<div class="col" title="${esc(i.label)}: ${esc(fmt(i.value))}">
      ${i.hi ? `<div class="tip${idx >= items.length / 2 ? " left" : ""}" style="bottom:calc(${100 * (i.value || 0) / max}% - 10px)"><span class="muted">${esc(i.label)}</span><b>${esc(fmt(i.value))}</b>${i.sub ? `<span class="muted">${esc(i.sub)}</span>` : ""}</div>` : ""}
      <div class="bar ${i.hi ? "hi" : ""}" style="height:${100 * (i.value || 0) / max}%"></div><span class="lbl">${esc(i.label)}</span></div>`).join("");
}

function renderBudget(b) {
  if (!b.cap) { $("budget").innerHTML = `<p class="muted">${t("budget.none")}</p>`; return; }
  $("budget").innerHTML = `<table>${(b.lines || []).map(l => `<tr><td>${esc(title(l.item))}</td><td>${tag(l.area)}</td><td class="num">${rs(l.amount)}</td></tr>`).join("")}
    <tr><th>${t("t.total")}</th><th></th><th class="num">${rs(b.total)}</th></tr>
    <tr><td>${t("t.remaining", {v: rs(b.cap)})}</td><td></td><td class="num ${b.remaining >= 0 ? "ok" : "bad"}">${rs(b.remaining)}</td></tr></table>
    ${(b.optional || []).map(o => `<div class="row" style="margin-top:10px"><span class="badge b-optional">${t("t.optional")}</span>${esc(title(o.item))} · ${rs(o.amount)} <span class="small ${o.fits ? "ok" : "bad"}">${o.fits ? t("t.fits") : t("t.nofit")}</span></div>`).join("")}`;
}
function renderVenue(v, h) {
  if (!v.name) { $("venue").innerHTML = `<p class="bad">${t("venue.none")}</p>`; return; }
  $("venue").innerHTML = `<div class="kpi"><div class="v">${esc(title(v.name))}</div><div class="l">${esc(t("venue.seats", {c: v.capacity, h: h.total}))} · ${rs(v.price)}</div></div>
    <table><tr><th>${t("col.option")}</th><th class="num">${t("col.seats")}</th><th class="num">${t("col.price")}</th></tr>
    ${(v.options || []).map(o => `<tr title="${esc(o.note)}"><td>${o.chosen ? "<b class='ok'>●</b> " : ""}${esc(title(o.name))}<div class="muted small">${esc(o.note || "")}</div></td><td class="num">${esc(o.capacity)}</td><td class="num">${rs(o.price)}</td></tr>`).join("")}</table>`;
}
function renderFood(f, h) {
  if (!f.name) { $("food").innerHTML = `<p class="bad">${t("food.none")}</p>`; return; }
  $("food").innerHTML = `<div class="kpi"><div class="v">${esc(f.boxes)} × ${esc(title(f.name))}</div><div class="l">${rs(f.price_per_head)} each · ${rs(f.cost)}</div></div>
    <p class="muted small">${esc(h.students)} students + ${esc(h.staff)} staff + ${esc(h.judges)} judges${h.other ? " + " + esc(h.other) + " others" : ""} = <b>${esc(h.total)}</b></p>
    <table><tr><th>${t("col.option")}</th><th class="num">${t("col.perhead")}</th></tr>${(f.options || []).map(o => `<tr><td>${o.chosen ? "<b class='ok'>●</b> " : ""}${esc(title(o.name))}</td><td class="num">${rs(o.price_per_head)}</td></tr>`).join("")}</table>`;
}
function renderJudging(j) {
  if (!j.teams) { $("judging").innerHTML = `<p class="bad">${t("judging.none")}</p>`; return; }
  $("judging").innerHTML = `<div class="kpi"><div class="v">${esc(j.used)} judges</div><div class="l">${esc(j.teams)} teams · max ${esc(j.max_teams)} each · ${esc(j.minutes_per_team)} min/team</div></div>
    <p class="muted small">${esc(j.confirmed)} confirmed · honorarium ${esc(j.used)} × ${rs(j.fee_each)} = ${rs(j.cost)}</p>
    <details><summary class="small">${t("judging.assign")}</summary><table>${(j.assignments || []).map(a => `<tr><td>${esc(title(a.judge))}</td><td>teams ${esc(a.teams.join(", "))}</td><td class="muted">${esc(a.slots.join(" · "))}</td></tr>`).join("")}</table></details>`;
}
function renderSchedule(sc) {
  const blocks = sc.blocks || [];
  if (!blocks.length) { $("schedule").innerHTML = `<p class="bad">${t("schedule.none")}</p>`; return; }
  const total = blocks.reduce((a, b) => a + b.minutes, 0) || 1;
  $("schedule").innerHTML = `<div class="timeline">${blocks.map(b => `<div class="k-${esc(b.kind)}" style="flex:${b.minutes / total}" title="${esc(title(b.item))} ${b.start}-${b.end}">${b.minutes >= 25 ? esc(title(b.item)) : ""}</div>`).join("")}</div>
    <table>${blocks.map(b => `<tr><td>${esc(b.start)}–${esc(b.end)}</td><td>${esc(title(b.item))}</td><td class="num">${b.minutes} ${t("unit.min")}</td></tr>`).join("")}
    <tr><th colspan="2">${t("t.total")}</th><th class="num">${total} ${t("unit.min")}</th></tr></table>`;
}

function renderMessages(msgs) {
  const counts = {}; msgs.forEach(m => counts[m.status] = (counts[m.status] || 0) + 1);
  $("legend").innerHTML = Object.keys(STATUS_COLOR).map(k => `<span class="badge b-${k}">${statusLabel(k)}: ${counts[k] || 0}</span>`).join("");
  $("messages").innerHTML = msgs.map(m => `
    <div class="msg s-${esc(m.status)}">
      <div class="head"><b>#${m.n}</b><span class="badge b-${esc(m.status)}">${esc(STATUS_COLOR[m.status] ? statusLabel(m.status) : m.status)}</span>
        <b>${esc(title(m.sender))}</b><span class="muted">${esc(m.role)} · ${esc(m.date || t("msg.nodate"))} · ${t("msg.run", {n: m.run})}</span>
        ${langBadge(m.lang)}${(m.areas || []).map(tag).join("")}${(m.flags || []).map(f => `<span class="badge b-needs_review">${esc(f)}</span>`).join("")}</div>
      <div class="orig">${esc(m.text)}</div>
      <div class="gist" dir="ltr">${t("msg.summary")} · ${esc(m.gist)}</div>
      ${m.reason ? `<div class="reason">→ ${esc(m.reason)}</div>` : ""}
      ${(m.ask || []).length ? `<div class="reason ask-note">❓ ${t("res.ask")}: ${(m.ask || []).map(esc).join(" · ")}</div>` : ""}
      ${(m.facts || []).length ? `<details><summary>${t("msg.facts", {n: m.facts.length})}</summary><table>
        ${m.facts.map(f => `<tr><td><code>${esc(f.key)}</code></td><td><span class="badge b-${esc(f.status)}">${esc(f.status)}</span></td><td><code>${esc(JSON.stringify(stripMeta(f)))}</code></td><td class="muted">${esc(f.reason || "")}</td></tr>`).join("")}</table></details>` : ""}
    </div>`).join("") || `<div class="card muted">${t("msg.none")}</div>`;
}
const stripMeta = (f) => { const o = {...f}; ["key","status","reason"].forEach(k => delete o[k]); return o; };

function renderRejected(rej) {
  $("rejDot").classList.toggle("hidden", !rej.length);
  $("rejected").innerHTML = rej.length ? rej.map(r => `
    <div class="rej"><h4>✘ ${t("rej.msg", {n: r.n})} · ${esc(title(r.sender))}</h4>
      <div class="orig">${esc(r.text)}</div>
      <p><b>${t("rej.fact")}:</b> <code>${esc(r.fact_key)}</code></p>
      <p><b>${t("rej.why")}:</b> ${esc(r.reason)}</p></div>`).join("")
    : `<div class="card muted">${t("rej.none")}</div>`;
}

function renderTrace(s) {
  const trace = s.trace || [], tot = s.totals || {};
  $("traceKpis").innerHTML = [[t("trace.calls"), tot.calls ?? 0], [t("trace.prompt"), tot.prompt ?? 0], [t("trace.completion"), tot.completion ?? 0], [t("trace.total"), tot.total ?? 0]]
    .map(([l, v]) => `<div class="card"><div class="big-num" style="margin:0"><span>${Number(v).toLocaleString()}</span></div><div class="muted small">${l}</div></div>`).join("");
  const runSel = $("traceRun"), areaSel = $("traceArea"), keepR = runSel.value, keepA = areaSel.value;
  runSel.innerHTML = `<option value="">${t("trace.allruns")}</option>` + [...new Set(trace.map(c => c.run))].map(r => `<option value="${r}">${t("trace.run", {n: r})}</option>`).join("");
  areaSel.innerHTML = `<option value="">${t("trace.allareas")}</option>` + [...new Set(trace.map(c => c.area))].map(a => `<option>${esc(a)}</option>`).join("");
  runSel.value = keepR; areaSel.value = keepA;
  const draw = () => {
    const list = trace.filter(c => (!runSel.value || String(c.run) === runSel.value) && (!areaSel.value || c.area === areaSel.value));
    $("trace").innerHTML = list.map(c => `
      <details class="call"><summary><span class="n">#${c.n}</span>${tag(c.area)}<b>${esc(c.model)}</b><span class="muted">${t("msg.run", {n: c.run})}</span>
        <span class="muted">in ${c.prompt_tokens ?? "n/a"} · out ${c.completion_tokens ?? "n/a"} · total ${c.total_tokens ?? "n/a"}</span>
        <span class="muted">${c.ms} ms</span>${c.error ? `<span class="bad">error: ${esc(c.error)}</span>` : ""}</summary>
        <div class="io"><div><b>${t("trace.input")}</b><pre>${esc(c.input)}</pre></div><div><b>${t("trace.output")}</b><pre>${esc(c.output)}</pre></div></div></details>`).join("")
      || `<div class="card muted">${t("trace.none")}</div>`;
  };
  runSel.onchange = areaSel.onchange = draw; draw();
  const kind = {reject: "rejected", stale: "stale", privacy: "needs_review", review: "needs_review", note: "irrelevant"};
  $("events").innerHTML = (s.events || []).map(e => `<div class="row small" style="margin-bottom:6px"><span class="muted">${t("msg.run", {n: e.run})}</span><span class="badge b-${kind[e.kind] || "irrelevant"}">${esc(e.kind)}</span>${esc(e.text)}</div>`).join("") || `<p class="muted">${t("trace.nodecisions")}</p>`;
}

function renderHistory(runs) {
  $("history").innerHTML = runs.slice().reverse().map(r => `
    <div class="card"><div class="card-head"><h3>${t("hist.run", {n: r.run, kind: esc(r.kind)})}</h3><span class="chip">${esc(r.file)}</span></div>
      <div class="row small"><span>${t("hist.new")}: <b>${(r.new_messages || []).map(n => "#" + n).join(", ") || "none"}</b></span>
      <span>${t("hist.calls")}: <b>${r.calls}</b></span><span>${t("hist.tokens")}: <b>${r.tokens?.total ?? 0}</b></span><span class="muted">${r.duration_ms} ms</span></div>
      <p class="small">${t("hist.areas")}: ${(r.call_areas || []).map(tag).join("") || "<span class='muted'>none</span>"}</p>
      <p class="small">${t("hist.changed")}: ${(r.changed_areas || []).map(tag).join("") || "<span class='muted'>none</span>"}</p>
      ${r.kind === "update" ? `<p class="muted small">${t("hist.skipped")}: ${["venue","schedule","food","judging","budget"].filter(a => !(r.changed_areas || []).includes(a)).join(", ")}</p>` : ""}
    </div>`).join("") || `<div class="card muted">${t("hist.none")}</div>`;
}

// Languages card: how many messages arrived in each language (from each message's "lang" tag).
function renderLangs(msgs) {
  const counts = {}; msgs.forEach(m => { const c = m.lang || "und"; counts[c] = (counts[c] || 0) + 1; });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(r => r[1]));
  $("langs").innerHTML = !msgs.some(m => m.lang)
    ? `<p class="muted small">${t("lang.none")}</p>`
    : rows.map(([c, n]) => `<div class="langrow">${langBadge(c)}<span class="lname">${esc(langName(c))}</span>
        <span class="lbar"><i style="width:${100 * n / max}%"></i></span><b>${n}</b></div>`).join("");
}
