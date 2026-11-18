// EventMind animated trace: plays back every step of a run (input, redaction, each model call, every code agent,
// save) in order. The step order, agent names, model names, token counts and milliseconds are the real ones
// recorded by the engine (state.pipeline + state.trace); only the pace of the animation is for viewing.
"use strict";

const STAGES = ["input", "redact", "read", "tag", "rule", "resolve", "plan", "validate", "reject", "diff", "save"];
const TP = {timer: null, run: null, shown: 0, speed: 1, playedKey: null, forced: false};

function pipeRuns(state) { return [...new Set((state.pipeline || []).map(s => s.run))]; }
function runSteps(state, run) { return (state.pipeline || []).filter(s => s.run === run); }
const speedDelay = (step) => (step.kind === "model" ? 1300 : 520) / (TP.speed || 1);

function renderPipeline(state) {
  const card = $("pipeCard"); if (!card) return;
  const runs = pipeRuns(state);
  if (!runs.length) {
    $("pipeBody").innerHTML = `<p class="muted">${t("tr.none")}</p>`; $("pipeControls").classList.add("hidden"); return;
  }
  $("pipeControls").classList.remove("hidden");
  if (!runs.includes(TP.run)) TP.run = runs[runs.length - 1];
  $("pipeRun").innerHTML = runs.map(r => `<option value="${r}" ${r === TP.run ? "selected" : ""}>${t("trace.run", {n: r})}</option>`).join("");
  const steps = runSteps(state, TP.run);
  const key = TP.run + ":" + steps.length + ":" + (state.updated || "");
  drawPipeline(state, steps);
  if (key !== TP.playedKey && TAB === "trace") { TP.playedKey = key; playPipeline(state, steps); }
  else if (key !== TP.playedKey) { /* new run recorded while another tab is open: it will play when the Trace tab opens */ setPipeProgress(steps, 0); TP.pending = true; }
  else setPipeProgress(steps, steps.length);
}

// called when the Trace tab is opened
function maybePlayTrace() {
  if (!STATE || !TP.pending) return;
  TP.pending = false; renderPipeline(STATE);
}

function stageLabel(st) { return t("tr.s." + st); }

function drawPipeline(state, steps) {
  const stages = STAGES.filter(s => steps.some(x => x.stage === s));
  $("pipeRail").innerHTML = stages.map((st, i) => {
    const ss = steps.filter(x => x.stage === st), kind = ss.some(x => x.kind === "model") ? "model" : ss[0].kind;
    return `<div class="pnode ${kind}" data-stage="${st}"><div class="pdot">${kind === "model" ? "◆" : kind === "io" ? "⇄" : "●"}</div>
      <div class="plabel">${esc(stageLabel(st))}</div><div class="pagent">${esc(ss[0].agent)}</div></div>${i < stages.length - 1 ? '<div class="pline"><i></i></div>' : ""}`;
  }).join("");
  $("pipeSteps").innerHTML = steps.map((s, i) => {
    const call = s.call ? (state.trace || []).find(c => c.n === s.call) : null;
    return `<div class="pstep ${s.kind}" data-i="${i}">
      <div class="pnum">${s.i}</div>
      <div class="pbody">
        <div class="phead"><span class="kindb k-${s.kind}">${t("tr." + s.kind)}</span><b>${esc(s.agent)}</b><span class="ptitle">${esc(s.title)}</span>
          ${s.ms != null ? `<span class="pms">${s.ms} ms</span>` : ""}${s.ok === false ? `<span class="bad">✘</span>` : s.kind === "model" ? `<span class="ok">✔</span>` : ""}</div>
        <div class="pdetail">${esc(s.detail || "")}</div>
        ${call ? `<details class="pio"><summary>${t("tr.callview")}</summary><div class="io"><div><b>${t("trace.input")}</b><pre>${esc(call.input)}</pre></div><div><b>${t("trace.output")}</b><pre>${esc(call.output)}</pre></div></div></details>` : ""}
      </div></div>`;
  }).join("");
}

// Marks the first `n` steps as reached (n = steps.length means finished) and updates rail, counters and progress.
function setPipeProgress(steps, n, running) {
  document.querySelectorAll("#pipeSteps .pstep").forEach((el, i) => { el.classList.toggle("on", i < n); el.classList.toggle("now", !!running && i === n - 1); });
  const reached = steps.slice(0, n), reachedStages = new Set(reached.map(x => x.stage)), lastStage = reached.length ? reached[reached.length - 1].stage : null;
  const nodes = [...document.querySelectorAll("#pipeRail .pnode")];
  nodes.forEach(nd => {
    nd.classList.toggle("done", reachedStages.has(nd.dataset.stage) && !(running && nd.dataset.stage === lastStage));
    nd.classList.toggle("active", !!running && nd.dataset.stage === lastStage);
  });
  document.querySelectorAll("#pipeRail .pline").forEach((ln, i) => {
    const next = nodes[i + 1]; ln.classList.toggle("fill", !!next && reachedStages.has(next.dataset.stage));
  });
  const calls = reached.filter(x => x.kind === "model"), tok = calls.reduce((a, x) => a + (x.tokens?.total || 0), 0);
  $("pipeStats").innerHTML = `<span><b>${n}</b>/${steps.length} ${t("tr.steps")}</span><span><b>${calls.length}</b> ${t("trace.calls")}</span><span><b>${tok.toLocaleString()}</b> ${t("unit.tokens")}</span>
    <span><b>${reached.length ? (reached[reached.length - 1].at + (reached[reached.length - 1].ms || 0)) : 0}</b> ms</span>`;
  const bar = $("pipeBar"); if (bar) bar.style.width = (steps.length ? 100 * n / steps.length : 0) + "%";
}

function playPipeline(state, steps, instant) {
  clearTimeout(TP.timer);
  if (instant) { setPipeProgress(steps, steps.length); return; }
  let n = 0;
  setPipeProgress(steps, 0);
  const next = () => {
    if (n >= steps.length) { setPipeProgress(steps, steps.length); $("pipeReplay").disabled = false; return; }
    n++; setPipeProgress(steps, n, true);
    const el = document.querySelector(`#pipeSteps .pstep[data-i="${n - 1}"]`); if (el) el.scrollIntoView({block: "nearest", behavior: "smooth"});
    TP.timer = setTimeout(next, speedDelay(steps[n - 1]));
  };
  $("pipeReplay").disabled = true;
  TP.timer = setTimeout(next, 250);
}

function initPipelineControls() {
  $("pipeReplay").addEventListener("click", () => { if (STATE) { TP.playedKey = null; renderPipeline(STATE); } });
  $("pipeAll").addEventListener("click", () => { if (STATE) { clearTimeout(TP.timer); $("pipeReplay").disabled = false; setPipeProgress(runSteps(STATE, TP.run), runSteps(STATE, TP.run).length); } });
  $("pipeRun").addEventListener("change", (e) => { TP.run = +e.target.value; TP.playedKey = null; if (STATE) renderPipeline(STATE); });
  $("pipeSpeed").addEventListener("change", (e) => { TP.speed = +e.target.value; });
}
