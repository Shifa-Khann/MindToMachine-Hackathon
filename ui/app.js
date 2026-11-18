// EventMind UI — standalone: renders any state.json produced by the engine.
// Source: GET /state.json (live via serve.py) or a file the user loads/drops.
"use strict";

let STATE = null, LIVE = false, lastUpdated = null, CHART = "budget";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rs = (n) => (n === null || n === undefined || isNaN(n)) ? "—" : "Rs " + Math.round(n).toLocaleString("en-US");
const short = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(Math.round(n));
const tag = (a) => `<span class="tag t-${esc(a)}">${esc(a)}</span>`;
const cap = (s) => String(s ?? "").replace(/^./, c => c.toUpperCase());
const STATUS = {used:["Used","var(--green)"], stale:["Stale","var(--hatch)"], rejected:["Rejected","var(--red)"],
  irrelevant:["Irrelevant","var(--blue)"], optional:["Optional","var(--yellow)"], needs_review:["Needs review","var(--purple)"]};
const TITLES = {overview:"Event plan dashboard", messages:"Messages", rejected:"Rejected messages", trace:"Model call trace", history:"Runs & changes"};

// ---------- theme ----------
function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("em-theme", t); } catch (_) {} }
try { setTheme(localStorage.getItem("em-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")); } catch (_) {}
$("themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

// ---------- navigation ----------
function showTab(name) {
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
  $("pageTitle").textContent = TITLES[name];
  if (STATE) $("tab-" + name).classList.remove("hidden");
}
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
  STATE = state;
  $("conn").textContent = source;
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
  r.onload = () => { try { LIVE = false; load(JSON.parse(r.result), "file · " + f.name); } catch (err) { alert("Not a valid state.json: " + err.message); } };
  r.readAsText(f);
}
async function poll() {
  try {
    const res = await fetch("/state.json?t=" + Date.now(), {cache: "no-store"});
    if (res.ok) { const s = await res.json(); LIVE = true; if (s.updated !== lastUpdated) { lastUpdated = s.updated; load(s, "● live"); } }
  } catch (_) { /* standalone mode */ }
}
poll(); setInterval(poll, 3000);

$("downloadBtn").onclick = () => {
  if (!STATE) return;
  const blob = new Blob([JSON.stringify(STATE, null, 2)], {type: "application/json"});
  const a = Object.assign(document.createElement("a"), {href: URL.createObjectURL(blob), download: "eventmind-state.json"});
  a.click(); URL.revokeObjectURL(a.href);
};

$("sendMsg").addEventListener("click", async () => {
  const text = $("newMsg").value.trim(); if (!text) return;
  $("sendMsg").disabled = true; $("sendStatus").textContent = "processing…";
  try {
    const res = await fetch("/api/message", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text})});
    const out = await res.json();
    $("sendStatus").textContent = out.ok ? "done — plan updated" : ("error: " + (out.error || "see terminal"));
    if (out.ok) $("newMsg").value = "";
    lastUpdated = null; await poll();
  } catch (_) { $("sendStatus").textContent = "backend not running — start: python serve.py"; }
  finally { $("sendMsg").disabled = false; }
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

  $("health").textContent = allOk ? "Valid" : `${checks.length - passed} issue(s)`;
  $("health").className = "tag-pill " + (allOk ? "ok" : "bad");
  $("heroTitle").textContent = "Event plan";
  const sc = plan.schedule || {};
  $("heroSub").textContent = [sc.start && `${sc.start} – ${sc.end}`, plan.headcount?.total && `${plan.headcount.total} people`,
    plan.judging?.teams && `${plan.judging.teams} teams`, `run ${lastRun.run || 0} (${lastRun.kind || "—"})`].filter(Boolean).join(" · ");
  $("heroCalls").textContent = `${lastRun.calls ?? 0} model call(s) last run`;
  $("updated").textContent = s.updated ? "updated " + s.updated : "";
  document.querySelectorAll("[data-area]").forEach(el => el.classList.toggle("changed", changed.has(el.dataset.area)));

  const steps = [["Read", (s.trace || []).length > 0 || (s.messages || []).length > 0], ["Resolve", (s.messages || []).length > 0],
    ["Plan", !!plan.venue?.name], ["Validate", !!allOk], ["Trace", (s.trace || []).length > 0], ["Ready", !!allOk]];
  $("stepper").innerHTML = steps.map(([l, d], i) => `<li class="${d ? "done" : ""}"><div class="node">${d ? "✓" : i + 1}</div>${l}</li>`).join("");

  renderBars();

  const counts = {}; (s.messages || []).forEach(m => counts[m.status] = (counts[m.status] || 0) + 1);
  const segs = Object.entries(STATUS).map(([k, [label, color]]) => ({label, color, value: counts[k] || 0}));
  $("msgDonut").innerHTML = donut(segs, (s.messages || []).length, "messages", 200, 30);
  $("msgLegend").innerHTML = segs.map(x => `<span><i style="background:${x.color}"></i>${x.label} <b>${x.value}</b></span>`).join("");

  const h = plan.headcount || {};
  const hb = [["Students", h.students], ["Staff", h.staff], ["Judges", h.judges], ["Other", h.other], ["Total", h.total]];
  const hmax = Math.max(1, ...hb.map(x => x[1] || 0));
  $("headBars").innerHTML = hb.map(([l, v], i) => `<div class="mb ${i === 4 ? "hi" : ""}"><em>${v ?? 0}</em><div style="height:${Math.max(4, 100 * (v || 0) / hmax)}%"></div><small>${l}</small></div>`).join("");

  $("checkDonut").innerHTML = donut([{label: "Passed", color: "var(--green)", value: passed}, {label: "Failed", color: "var(--red)", value: checks.length - passed}],
    `${passed}/${checks.length}`, "passed", 150, 22);
  $("checkLegend").innerHTML = `<span><i class="lg-green"></i>Passed (${passed})</span><span><i class="lg-red"></i>Failed (${checks.length - passed})</span>`;

  const b = plan.budget || {}, pct = b.cap ? 100 * b.total / b.cap : 0;
  $("gauge").innerHTML = gauge(pct, pct > 100 ? "var(--red)" : "var(--purple)") +
    `<b>${b.cap ? Math.round(pct) + "%" : "—"}</b><span>${rs(b.total)} of ${rs(b.cap)}</span><span class="small ${b.remaining >= 0 ? "ok" : "bad"}">${rs(b.remaining)} left</span>`;

  const t = s.totals || {};
  $("tokTotal").textContent = (t.total ?? 0).toLocaleString();
  $("tokCalls").textContent = t.calls ?? 0;
  $("tokRuns").textContent = runs.length;
  const pt = t.prompt || 0, ct = t.completion || 0, tt = Math.max(1, pt + ct);
  $("tokBar").innerHTML = `<span style="flex:${pt / tt};background:var(--green)" title="prompt ${pt}"></span><span style="flex:${ct / tt};background:var(--yellow)" title="completion ${ct}"></span>`;

  $("checks").innerHTML = `<table><tr><th></th><th>Check</th><th>Area</th><th>Expected</th><th>Actual</th></tr>` +
    checks.map(c => `<tr><td class="${c.ok ? "ok" : "bad"}">${c.ok ? "✔" : "✘"}</td><td>${esc(c.label)}</td><td>${tag(c.area)}</td><td>${esc(c.expected)}</td><td>${esc(c.actual)}</td></tr>`).join("") + `</table>`;
  renderBudget(b); renderVenue(plan.venue || {}, h); renderFood(plan.food || {}, h); renderJudging(plan.judging || {}); renderSchedule(sc);
  $("decisions").innerHTML = (s.decisions || []).map(d => `<li>${esc(d)}</li>`).join("") || `<li class="muted">None</li>`;
  $("privacy").innerHTML = (s.privacy || []).map(d => `<li>${esc(d)}</li>`).join("") || `<li class="muted">No personal data or legal/disputed content detected</li>`;

  renderMessages(s.messages || []); renderRejected(s.rejected || []); renderTrace(s); renderHistory(runs);
}

function renderBars() {
  if (!STATE) return;
  const p = STATE.plan || {};
  let items = [], fmt = rs, note = "";
  if (CHART === "budget") {
    items = (p.budget?.lines || []).map(l => ({label: l.item.replace(/^(Venue|Food|Judges): /, ""), value: l.amount}));
    const mx = Math.max(0, ...items.map(i => i.value)); items.forEach(i => i.hi = i.value === mx && mx > 0);
    note = `total ${rs(p.budget?.total)}`;
  } else if (CHART === "schedule") {
    items = (p.schedule?.blocks || []).map(b => ({label: b.item.replace(" session", ""), value: b.minutes, sub: `${b.start}–${b.end}`, hi: b.kind === "judging"}));
    fmt = (v) => v + " min"; note = `${p.schedule?.duration_min ?? 0} min`;
  } else if (CHART === "venues") {
    items = (p.venue?.options || []).map(o => ({label: o.name, value: o.price, sub: `${o.capacity} seats · ${o.note || ""}`, hi: o.chosen}));
    note = p.venue?.name ? "chosen: " + p.venue.name : "";
  } else {
    items = (p.food?.options || []).map(o => ({label: o.name, value: o.price_per_head, sub: "per head", hi: o.chosen}));
    note = p.food?.name ? "chosen: " + p.food.name : "";
  }
  $("barNote").textContent = note;
  if (!items.length) { $("barChart").innerHTML = `<p class="muted">No data for this view.</p>`; return; }
  const max = niceMax(Math.max(...items.map(i => i.value || 0)));
  const ticks = [1, .75, .5, .25, 0].map(f => CHART === "schedule" ? Math.round(max * f) : short(max * f));
  $("barChart").innerHTML = `<div class="yaxis">${ticks.map(t => `<span>${t}</span>`).join("")}</div>` +
    items.map((i, idx) => `<div class="col" title="${esc(i.label)}: ${esc(fmt(i.value))}">
      ${i.hi ? `<div class="tip${idx >= items.length / 2 ? " left" : ""}" style="bottom:calc(${100 * (i.value || 0) / max}% - 10px)"><span class="muted">${esc(i.label)}</span><b>${esc(fmt(i.value))}</b>${i.sub ? `<span class="muted">${esc(i.sub)}</span>` : ""}</div>` : ""}
      <div class="bar ${i.hi ? "hi" : ""}" style="height:${100 * (i.value || 0) / max}%"></div><span class="lbl">${esc(cap(i.label))}</span></div>`).join("");
}

function renderBudget(b) {
  if (!b.cap) { $("budget").innerHTML = `<p class="muted">No budget yet</p>`; return; }
  $("budget").innerHTML = `<table>${(b.lines || []).map(l => `<tr><td>${esc(cap(l.item))}</td><td>${tag(l.area)}</td><td class="num">${rs(l.amount)}</td></tr>`).join("")}
    <tr><th>Total</th><th></th><th class="num">${rs(b.total)}</th></tr>
    <tr><td>Remaining of ${rs(b.cap)}</td><td></td><td class="num ${b.remaining >= 0 ? "ok" : "bad"}">${rs(b.remaining)}</td></tr></table>
    ${(b.optional || []).map(o => `<div class="row" style="margin-top:10px"><span class="badge b-optional">optional</span>${esc(cap(o.item))} · ${rs(o.amount)} <span class="small ${o.fits ? "ok" : "bad"}">${o.fits ? "fits remaining budget" : "does not fit"}</span></div>`).join("")}`;
}
function renderVenue(v, h) {
  if (!v.name) { $("venue").innerHTML = `<p class="bad">No venue chosen</p>`; return; }
  $("venue").innerHTML = `<div class="kpi"><div class="v">${esc(v.name)}</div><div class="l">${esc(v.capacity)} seats for ${esc(h.total)} people · ${rs(v.price)}</div></div>
    <table><tr><th>Option</th><th class="num">Seats</th><th class="num">Price</th></tr>
    ${(v.options || []).map(o => `<tr title="${esc(o.note)}"><td>${o.chosen ? "<b class='ok'>●</b> " : ""}${esc(cap(o.name))}<div class="muted small">${esc(o.note || "")}</div></td><td class="num">${esc(o.capacity)}</td><td class="num">${rs(o.price)}</td></tr>`).join("")}</table>`;
}
function renderFood(f, h) {
  if (!f.name) { $("food").innerHTML = `<p class="bad">No food option</p>`; return; }
  $("food").innerHTML = `<div class="kpi"><div class="v">${esc(f.boxes)} × ${esc(f.name)}</div><div class="l">${rs(f.price_per_head)} each · ${rs(f.cost)}</div></div>
    <p class="muted small">${esc(h.students)} students + ${esc(h.staff)} staff + ${esc(h.judges)} judges${h.other ? " + " + esc(h.other) + " others" : ""} = <b>${esc(h.total)}</b></p>
    <table><tr><th>Option</th><th class="num">Per head</th></tr>${(f.options || []).map(o => `<tr><td>${o.chosen ? "<b class='ok'>●</b> " : ""}${esc(cap(o.name))}</td><td class="num">${rs(o.price_per_head)}</td></tr>`).join("")}</table>`;
}
function renderJudging(j) {
  if (!j.teams) { $("judging").innerHTML = `<p class="bad">No judging data</p>`; return; }
  $("judging").innerHTML = `<div class="kpi"><div class="v">${esc(j.used)} judges</div><div class="l">${esc(j.teams)} teams · max ${esc(j.max_teams)} each · ${esc(j.minutes_per_team)} min/team</div></div>
    <p class="muted small">${esc(j.confirmed)} confirmed · honorarium ${esc(j.used)} × ${rs(j.fee_each)} = ${rs(j.cost)}</p>
    <details><summary class="small">Judge → team assignments</summary><table>${(j.assignments || []).map(a => `<tr><td>${esc(a.judge)}</td><td>teams ${esc(a.teams.join(", "))}</td><td class="muted">${esc(a.slots.join(" · "))}</td></tr>`).join("")}</table></details>`;
}
function renderSchedule(sc) {
  const blocks = sc.blocks || [];
  if (!blocks.length) { $("schedule").innerHTML = `<p class="bad">No schedule</p>`; return; }
  const total = blocks.reduce((a, b) => a + b.minutes, 0) || 1;
  $("schedule").innerHTML = `<div class="timeline">${blocks.map(b => `<div class="k-${esc(b.kind)}" style="flex:${b.minutes / total}" title="${esc(b.item)} ${b.start}-${b.end}">${b.minutes >= 25 ? esc(b.item) : ""}</div>`).join("")}</div>
    <table>${blocks.map(b => `<tr><td>${esc(b.start)}–${esc(b.end)}</td><td>${esc(b.item)}</td><td class="num">${b.minutes} min</td></tr>`).join("")}
    <tr><th colspan="2">Total</th><th class="num">${total} min</th></tr></table>`;
}

function renderMessages(msgs) {
  const counts = {}; msgs.forEach(m => counts[m.status] = (counts[m.status] || 0) + 1);
  $("legend").innerHTML = Object.entries(STATUS).map(([k, [l]]) => `<span class="badge b-${k}">${l}: ${counts[k] || 0}</span>`).join("");
  $("messages").innerHTML = msgs.map(m => `
    <div class="msg s-${esc(m.status)}">
      <div class="head"><b>#${m.n}</b><span class="badge b-${esc(m.status)}">${esc(STATUS[m.status]?.[0] || m.status)}</span>
        <b>${esc(m.sender)}</b><span class="muted">${esc(m.role)} · ${esc(m.date || "no date")} · run ${m.run}</span>
        ${(m.areas || []).map(tag).join("")}${(m.flags || []).map(f => `<span class="badge b-needs_review">${esc(f)}</span>`).join("")}</div>
      <div class="orig">${esc(m.text)}</div>
      <div class="gist">EN · ${esc(m.gist)}</div>
      ${m.reason ? `<div class="reason">→ ${esc(m.reason)}</div>` : ""}
      ${(m.facts || []).length ? `<details><summary>Extracted facts (${m.facts.length})</summary><table>
        ${m.facts.map(f => `<tr><td><code>${esc(f.key)}</code></td><td><span class="badge b-${esc(f.status)}">${esc(f.status)}</span></td><td><code>${esc(JSON.stringify(stripMeta(f)))}</code></td><td class="muted">${esc(f.reason || "")}</td></tr>`).join("")}</table></details>` : ""}
    </div>`).join("") || `<div class="card muted">No messages yet.</div>`;
}
const stripMeta = (f) => { const o = {...f}; ["key","status","reason"].forEach(k => delete o[k]); return o; };

function renderRejected(rej) {
  $("rejDot").classList.toggle("hidden", !rej.length);
  $("rejected").innerHTML = rej.length ? rej.map(r => `
    <div class="rej"><h4>✘ Message #${r.n} · ${esc(r.sender)}</h4>
      <div class="orig">${esc(r.text)}</div>
      <p><b>Fact:</b> <code>${esc(r.fact_key)}</code></p>
      <p><b>Why rejected:</b> ${esc(r.reason)}</p></div>`).join("")
    : `<div class="card muted">No rejected messages. Any message that breaks a rule, or comes from a sender without authority, appears here with the reason.</div>`;
}

function renderTrace(s) {
  const trace = s.trace || [], t = s.totals || {};
  $("traceKpis").innerHTML = [["Model calls", t.calls ?? 0], ["Prompt tokens", t.prompt ?? 0], ["Completion tokens", t.completion ?? 0], ["Total tokens", t.total ?? 0]]
    .map(([l, v]) => `<div class="card"><div class="big-num" style="margin:0"><span>${Number(v).toLocaleString()}</span></div><div class="muted small">${l}</div></div>`).join("");
  const runSel = $("traceRun"), areaSel = $("traceArea"), keepR = runSel.value, keepA = areaSel.value;
  runSel.innerHTML = `<option value="">All runs</option>` + [...new Set(trace.map(c => c.run))].map(r => `<option value="${r}">Run ${r}</option>`).join("");
  areaSel.innerHTML = `<option value="">All areas</option>` + [...new Set(trace.map(c => c.area))].map(a => `<option>${esc(a)}</option>`).join("");
  runSel.value = keepR; areaSel.value = keepA;
  const draw = () => {
    const list = trace.filter(c => (!runSel.value || String(c.run) === runSel.value) && (!areaSel.value || c.area === areaSel.value));
    $("trace").innerHTML = list.map(c => `
      <details class="call"><summary><span class="n">#${c.n}</span>${tag(c.area)}<b>${esc(c.model)}</b><span class="muted">run ${c.run}</span>
        <span class="muted">in ${c.prompt_tokens ?? "n/a"} · out ${c.completion_tokens ?? "n/a"} · total ${c.total_tokens ?? "n/a"}</span>
        <span class="muted">${c.ms} ms</span>${c.error ? `<span class="bad">error: ${esc(c.error)}</span>` : ""}</summary>
        <div class="io"><div><b>Input</b><pre>${esc(c.input)}</pre></div><div><b>Output</b><pre>${esc(c.output)}</pre></div></div></details>`).join("")
      || `<div class="card muted">No model calls.</div>`;
  };
  runSel.onchange = areaSel.onchange = draw; draw();
  const kind = {reject: "rejected", stale: "stale", privacy: "needs_review", review: "needs_review", note: "irrelevant"};
  $("events").innerHTML = (s.events || []).map(e => `<div class="row small" style="margin-bottom:6px"><span class="muted">run ${e.run}</span><span class="badge b-${kind[e.kind] || "irrelevant"}">${esc(e.kind)}</span>${esc(e.text)}</div>`).join("") || `<p class="muted">No decisions logged.</p>`;
}

function renderHistory(runs) {
  $("history").innerHTML = runs.slice().reverse().map(r => `
    <div class="card"><div class="card-head"><h3>Run ${r.run} · ${esc(r.kind)}</h3><span class="chip">${esc(r.file)}</span></div>
      <div class="row small"><span>New messages: <b>${(r.new_messages || []).map(n => "#" + n).join(", ") || "none"}</b></span>
      <span>Model calls: <b>${r.calls}</b></span><span>Tokens: <b>${r.tokens?.total ?? 0}</b></span><span class="muted">${r.duration_ms} ms</span></div>
      <p class="small">Areas that made model calls: ${(r.call_areas || []).map(tag).join("") || "<span class='muted'>none</span>"}</p>
      <p class="small">Plan areas changed: ${(r.changed_areas || []).map(tag).join("") || "<span class='muted'>none</span>"}</p>
      ${r.kind === "update" ? `<p class="muted small">Skipped (no change, no calls): ${["venue","schedule","food","judging","budget"].filter(a => !(r.changed_areas || []).includes(a)).join(", ")}</p>` : ""}
    </div>`).join("") || `<div class="card muted">No runs yet.</div>`;
}
