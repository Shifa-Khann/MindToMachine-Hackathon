// EventMind UI — works standalone: it only renders a state.json produced by the engine.
// Data source: GET /state.json (when served by serve.py) or a file the user loads/drops.
"use strict";

let STATE = null;
let LIVE = false;          // true when served by serve.py
let lastUpdated = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rs = (n) => (n === null || n === undefined || isNaN(n)) ? "—" : "Rs " + Math.round(n).toLocaleString("en-US");
const tag = (a) => `<span class="tag t-${esc(a)}">${esc(a)}</span>`;
const STATUS_LABEL = {used:"Used", stale:"Stale", rejected:"Rejected", irrelevant:"Irrelevant", optional:"Optional", needs_review:"Needs review"};

// ---------- tabs ----------
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("active", x === b));
  document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
  if (STATE) $("tab-" + b.dataset.tab).classList.remove("hidden");
});

// ---------- loading ----------
function load(state, source) {
  STATE = state;
  $("conn").textContent = source;
  $("conn").className = "pill " + (LIVE ? "pill-ok" : "pill-muted");
  $("empty").classList.add("hidden");
  const active = document.querySelector(".tabs button.active").dataset.tab;
  $("tab-" + active).classList.remove("hidden");
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
  r.onload = () => { try { LIVE = false; load(JSON.parse(r.result), "file: " + f.name); } catch (err) { alert("Not a valid state.json: " + err.message); } };
  r.readAsText(f);
}

async function poll() {
  try {
    const res = await fetch("/state.json?t=" + Date.now(), {cache: "no-store"});
    if (res.ok) {
      const s = await res.json();
      LIVE = true;
      if (s.updated !== lastUpdated) { lastUpdated = s.updated; load(s, "live"); }
    }
  } catch (_) { /* standalone mode: no backend */ }
}
poll(); setInterval(poll, 3000);

// ---------- add message ----------
$("sendMsg").addEventListener("click", async () => {
  const text = $("newMsg").value.trim();
  if (!text) return;
  $("sendMsg").disabled = true; $("sendStatus").textContent = "processing…";
  try {
    const res = await fetch("/api/message", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text})});
    const out = await res.json();
    $("sendStatus").textContent = out.ok ? "done — plan updated" : ("error: " + (out.error || "see terminal"));
    if (out.ok) $("newMsg").value = "";
    lastUpdated = null; await poll();
  } catch (err) {
    $("sendStatus").textContent = "backend not running (start: python serve.py)";
  } finally { $("sendMsg").disabled = false; }
});

// ---------- render ----------
function render() {
  const s = STATE, plan = s.plan || {}, checks = s.checks || [];
  const lastRun = (s.runs || []).slice(-1)[0] || {};
  const changed = new Set(lastRun.kind === "update" ? (lastRun.changed_areas || []) : []);
  const allOk = checks.length && checks.every(c => c.ok);

  $("health").textContent = allOk ? "all checks passed" : `${checks.filter(c => !c.ok).length} check(s) failing`;
  $("health").className = "pill " + (allOk ? "pill-ok" : "pill-bad");
  $("updated").textContent = s.updated ? "updated " + s.updated : "";

  document.querySelectorAll("[data-area]").forEach(el => el.classList.toggle("changed", changed.has(el.dataset.area)));

  const t = s.totals || {}, b = plan.budget || {}, h = plan.headcount || {};
  $("kpis").innerHTML = [
    ["People on site", h.total ?? "—"],
    ["Teams", plan.judging?.teams ?? "—"],
    ["Total cost", rs(b.total)],
    ["Budget cap", rs(b.cap)],
    ["Remaining", rs(b.remaining)],
    ["Checks", `${checks.filter(c => c.ok).length}/${checks.length}`],
    ["Model calls", t.calls ?? 0],
    ["Total tokens", (t.total ?? 0).toLocaleString()],
  ].map(([l, v]) => `<div class="kpi"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");

  // checks
  $("checks").innerHTML = `<table><tr><th></th><th>Check</th><th>Area</th><th>Expected</th><th>Actual</th></tr>` +
    checks.map(c => `<tr><td class="${c.ok ? "ok" : "bad"}">${c.ok ? "✔" : "✘"}</td><td>${esc(c.label)}</td><td>${tag(c.area)}</td><td>${esc(c.expected)}</td><td>${esc(c.actual)}</td></tr>`).join("") + `</table>`;

  renderBudget(b);
  renderVenue(plan.venue || {}, h);
  renderFood(plan.food || {}, h);
  renderJudging(plan.judging || {});
  renderSchedule(plan.schedule || {});
  $("decisions").innerHTML = (s.decisions || []).map(d => `<li>${esc(d)}</li>`).join("") || `<li class="muted">None</li>`;
  $("privacy").innerHTML = (s.privacy || []).map(d => `<li>${esc(d)}</li>`).join("") || `<li class="muted">No personal data or legal/disputed content detected</li>`;

  renderMessages(s.messages || []);
  renderRejected(s.rejected || []);
  renderTrace(s);
  renderHistory(s.runs || []);
}

function renderBudget(b) {
  if (!b.cap) { $("budget").innerHTML = `<p class="muted">No budget yet</p>`; return; }
  const colors = {committed:"#ff7b72", venue:"#79c0ff", food:"#ffa657", judging:"#f2cc60", schedule:"#7ee787", other:"#d2a8ff"};
  const lines = b.lines || [];
  const bar = lines.map(l => `<span title="${esc(l.item)}: ${rs(l.amount)}" style="width:${Math.max(0, 100 * l.amount / b.cap)}%;background:${colors[l.kind] || colors[l.area] || "#888"}"></span>`).join("");
  $("budget").innerHTML = `<div class="bar">${bar}</div>
    <table>${lines.map(l => `<tr><td>${esc(l.item)}</td><td>${tag(l.area)}</td><td class="num">${rs(l.amount)}</td></tr>`).join("")}
    <tr><th>Total</th><th></th><th class="num">${rs(b.total)}</th></tr>
    <tr><td>Remaining of ${rs(b.cap)}</td><td></td><td class="num ${b.remaining >= 0 ? "ok" : "bad"}">${rs(b.remaining)}</td></tr></table>
    ${(b.optional || []).length ? `<h4 style="margin:12px 0 4px;font-size:.85rem">Optional requests (not in plan)</h4>` +
      b.optional.map(o => `<div class="row"><span class="badge b-optional">optional</span> ${esc(o.item)} — ${rs(o.amount)} <span class="${o.fits ? "ok" : "bad"}">${o.fits ? "fits in remaining budget" : "does not fit"}</span></div>`).join("") : ""}`;
}

function renderVenue(v, h) {
  if (!v.name) { $("venue").innerHTML = `<p class="bad">No venue chosen</p>`; return; }
  $("venue").innerHTML = `<div class="kpi"><div class="v">${esc(v.name)}</div><div class="l">capacity ${esc(v.capacity)} for ${esc(h.total)} people · ${rs(v.price)}</div></div>
    <table style="margin-top:8px"><tr><th>Option</th><th class="num">Seats</th><th class="num">Price</th><th>Note</th></tr>
    ${(v.options || []).map(o => `<tr><td>${o.chosen ? "▶ " : ""}${esc(o.name)}</td><td class="num">${esc(o.capacity)}</td><td class="num">${rs(o.price)}</td><td class="muted">${esc(o.note || "")}</td></tr>`).join("")}</table>`;
}

function renderFood(f, h) {
  if (!f.name) { $("food").innerHTML = `<p class="bad">No food option</p>`; return; }
  $("food").innerHTML = `<div class="kpi"><div class="v">${esc(f.boxes)} × ${esc(f.name)}</div><div class="l">${rs(f.price_per_head)} each · total ${rs(f.cost)}</div></div>
    <p class="muted" style="font-size:.82rem">Headcount: ${esc(h.students)} students + ${esc(h.staff)} staff + ${esc(h.judges)} judges${h.other ? " + " + esc(h.other) + " others" : ""} = <b>${esc(h.total)}</b></p>
    <table><tr><th>Option</th><th class="num">Per head</th><th>Note</th></tr>
    ${(f.options || []).map(o => `<tr><td>${o.chosen ? "▶ " : ""}${esc(o.name)}</td><td class="num">${rs(o.price_per_head)}</td><td class="muted">${esc(o.note || "")}</td></tr>`).join("")}</table>`;
}

function renderJudging(j) {
  if (!j.teams) { $("judging").innerHTML = `<p class="bad">No judging data</p>`; return; }
  $("judging").innerHTML = `<div class="kpi"><div class="v">${esc(j.used)} judges</div><div class="l">${esc(j.teams)} teams · max ${esc(j.max_teams)} each · ${esc(j.minutes_per_team)} min/team · ${esc(j.confirmed)} confirmed</div></div>
    <p class="muted" style="font-size:.82rem">Honorarium: ${esc(j.used)} × ${rs(j.fee_each)} = ${rs(j.cost)}</p>
    <details><summary class="muted">Judge → team assignments</summary><table>
    ${(j.assignments || []).map(a => `<tr><td>${esc(a.judge)}</td><td>teams ${esc(a.teams.join(", "))}</td><td class="muted">${esc(a.slots.join(" · "))}</td></tr>`).join("")}</table></details>`;
}

function renderSchedule(sc) {
  const blocks = sc.blocks || [];
  if (!blocks.length) { $("schedule").innerHTML = `<p class="bad">No schedule</p>`; return; }
  const total = blocks.reduce((a, b) => a + b.minutes, 0) || 1;
  $("schedule").innerHTML = `<div class="timeline">${blocks.map(b => `<div class="k-${esc(b.kind)}" style="width:${100 * b.minutes / total}%" title="${esc(b.item)} ${b.start}-${b.end}">${esc(b.item)}</div>`).join("")}</div>
    <table><tr><th>Start</th><th>End</th><th>Block</th><th class="num">Minutes</th></tr>
    ${blocks.map(b => `<tr><td>${esc(b.start)}</td><td>${esc(b.end)}</td><td>${esc(b.item)}</td><td class="num">${b.minutes}</td></tr>`).join("")}
    <tr><th colspan="3">Total</th><th class="num">${total}</th></tr></table>`;
}

function renderMessages(msgs) {
  const counts = {};
  msgs.forEach(m => counts[m.status] = (counts[m.status] || 0) + 1);
  $("legend").innerHTML = Object.keys(STATUS_LABEL).map(k => `<span class="badge b-${k}">${STATUS_LABEL[k]}: ${counts[k] || 0}</span>`).join("");
  $("messages").innerHTML = msgs.map(m => `
    <div class="msg s-${esc(m.status)}">
      <div class="head"><b>#${m.n}</b><span class="badge b-${esc(m.status)}">${esc(STATUS_LABEL[m.status] || m.status)}</span>
        <span>${esc(m.sender)}</span><span class="muted">${esc(m.role)}</span><span class="muted">${esc(m.date || "no date")}</span>
        <span class="muted">run ${m.run}</span>${(m.areas || []).map(tag).join("")}${(m.flags || []).map(f => `<span class="badge b-needs_review">${esc(f)}</span>`).join("")}</div>
      <div class="orig">${esc(m.text)}</div>
      <div class="gist">EN: ${esc(m.gist)}</div>
      ${m.reason ? `<div class="reason">→ ${esc(m.reason)}</div>` : ""}
      ${(m.facts || []).length ? `<details><summary>Extracted facts (${m.facts.length})</summary><table>
        ${m.facts.map(f => `<tr><td><code>${esc(f.key)}</code></td><td><span class="badge b-${esc(f.status)}">${esc(f.status)}</span></td><td><code>${esc(JSON.stringify(stripMeta(f)))}</code></td><td class="muted">${esc(f.reason || "")}</td></tr>`).join("")}</table></details>` : ""}
    </div>`).join("");
}
const stripMeta = (f) => { const o = {...f}; ["key","status","reason"].forEach(k => delete o[k]); return o; };

function renderRejected(rej) {
  $("rejCount").textContent = rej.length;
  $("rejected").innerHTML = rej.length ? rej.map(r => `
    <div class="rej"><h4>✘ Message #${r.n} — ${esc(r.sender)}</h4>
      <div class="orig" style="white-space:pre-wrap">${esc(r.text)}</div>
      <p><b>Fact:</b> <code>${esc(r.fact_key)}</code></p>
      <p><b>Why rejected:</b> ${esc(r.reason)}</p>
      </div>`).join("")
    : `<div class="card muted">No rejected messages. Messages that would break a rule, or that come from a sender without authority, appear here with the reason.</div>`;
}

function renderTrace(s) {
  const trace = s.trace || [], t = s.totals || {};
  $("traceKpis").innerHTML = [["Calls", t.calls ?? 0], ["Prompt tokens", t.prompt ?? 0], ["Completion tokens", t.completion ?? 0], ["Total tokens", t.total ?? 0]]
    .map(([l, v]) => `<div class="kpi"><div class="v">${Number(v).toLocaleString()}</div><div class="l">${l}</div></div>`).join("");
  const runSel = $("traceRun"), areaSel = $("traceArea");
  const runs = [...new Set(trace.map(c => c.run))], areas = [...new Set(trace.map(c => c.area))];
  const keepR = runSel.value, keepA = areaSel.value;
  runSel.innerHTML = `<option value="">All runs</option>` + runs.map(r => `<option value="${r}">Run ${r}</option>`).join("");
  areaSel.innerHTML = `<option value="">All areas</option>` + areas.map(a => `<option>${esc(a)}</option>`).join("");
  runSel.value = keepR; areaSel.value = keepA;
  const draw = () => {
    const list = trace.filter(c => (!runSel.value || String(c.run) === runSel.value) && (!areaSel.value || c.area === areaSel.value));
    $("trace").innerHTML = list.map(c => `
      <details class="call"><summary><span class="n">#${c.n}</span>${tag(c.area)}<span>${esc(c.model)}</span><span class="muted">run ${c.run}</span>
        <span class="muted">in ${c.prompt_tokens ?? "n/a"} · out ${c.completion_tokens ?? "n/a"} · total ${c.total_tokens ?? "n/a"}</span>
        <span class="muted">${c.ms} ms</span>${c.error ? `<span class="bad">error: ${esc(c.error)}</span>` : ""}</summary>
        <div class="io"><div><b>Input</b><pre>${esc(c.input)}</pre></div><div><b>Output</b><pre>${esc(c.output)}</pre></div></div></details>`).join("")
      || `<div class="card muted">No model calls.</div>`;
  };
  runSel.onchange = areaSel.onchange = draw; draw();
  $("events").innerHTML = (s.events || []).map(e => `<div class="row" style="font-size:.85rem;margin-bottom:4px"><span class="muted">run ${e.run}</span><span class="badge b-${e.kind === "reject" ? "rejected" : e.kind === "stale" ? "stale" : "needs_review"}">${esc(e.kind)}</span>${esc(e.text)}</div>`).join("") || `<p class="muted">No decisions logged.</p>`;
}

function renderHistory(runs) {
  $("history").innerHTML = runs.slice().reverse().map(r => `
    <div class="card"><h3>Run ${r.run} — ${esc(r.kind)} · ${esc(r.file)}</h3>
      <div class="row"><span>New messages: ${(r.new_messages || []).map(n => "#" + n).join(", ") || "none"}</span>
      <span>Model calls: <b>${r.calls}</b></span><span>Tokens: <b>${r.tokens?.total ?? 0}</b></span><span class="muted">${r.duration_ms} ms</span></div>
      <p>Areas that made model calls: ${(r.call_areas || []).map(tag).join("") || "<span class='muted'>none</span>"}</p>
      <p>Plan areas that changed: ${(r.changed_areas || []).map(tag).join("") || "<span class='muted'>none</span>"}</p>
      ${r.kind === "update" ? `<p class="muted">Skipped (no change, no calls): ${["venue","schedule","food","judging","budget"].filter(a => !(r.changed_areas || []).includes(a)).join(", ")}</p>` : ""}
    </div>`).join("") || `<div class="card muted">No runs yet.</div>`;
}
