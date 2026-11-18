// EventMind briefing: explains the plan and summarises the event in plain language.
// It is written by plain code from the validated plan (no model call, so it can never invent a number)
// and follows the UI language. Returns sections: [{h: heading, lines: [text...]}].
"use strict";

function buildBriefing(state) {
  const p = state.plan || {}, h = p.headcount || {}, v = p.venue || {}, f = p.food || {}, j = p.judging || {},
    sc = p.schedule || {}, b = p.budget || {}, checks = state.checks || [], msgs = state.messages || [];
  const out = [], sec = (key, lines) => { lines = lines.filter(Boolean); if (lines.length) out.push({h: t("br.h." + key), lines}); };
  const failing = checks.filter(c => !c.ok);

  sec("overview", [
    h.total > 0 && t("br.ov.people", {n: h.total}),
    j.teams && t("br.ov.teams", {n: j.teams}),
    sc.start && sc.end && t("br.ov.time", {start: sc.start, end: sc.end, d: sc.duration_min}),
    checks.length && (failing.length ? t("br.ov.invalid", {n: failing.length, m: checks.length}) : t("br.ov.valid", {n: checks.length}))
  ]);
  sec("venue", v.name ? [t("br.venue", {name: title(v.name), cap: v.capacity, people: h.total || "?", price: rs(v.price)}),
    (v.options || []).find(o => o.chosen)?.note && t("br.why", {why: (v.options || []).find(o => o.chosen).note})] : []);
  sec("food", f.name ? [t("br.food", {boxes: f.boxes, name: title(f.name), each: rs(f.price_per_head), cost: rs(f.cost)})] : []);
  sec("judging", j.teams ? [
    t("br.judging", {used: j.used, teams: j.teams, max: j.max_teams ?? "?", cost: rs(j.cost)}),
    j.minutes_per_team > 0 && t("br.judging.min", {m: j.minutes_per_team}),
    j.confirmed > j.used && t("br.judging.standby", {n: j.confirmed - j.used})] : []);
  sec("schedule", (sc.blocks || []).length ? [t("br.sch.span", {start: sc.start, end: sc.end}),
    ...sc.blocks.map(x => `${x.start}–${x.end}  ${title(x.item)} (${x.minutes} ${t("unit.min")})`)] : []);
  sec("budget", b.cap || (b.lines || []).length ? [
    b.cap ? t("br.budget", {total: rs(b.total), cap: rs(b.cap), left: rs(b.remaining)}) : t("br.budget.nocap", {total: rs(b.total)}),
    ...(b.optional || []).map(o => t("br.opt", {item: title(o.item), amt: rs(o.amount), fit: o.fits ? t("t.fits") : t("t.nofit")}))] : []);

  const att = [
    ...(state.rejected || []).map(r => t("br.att.rej", {n: r.n, s: title(r.sender), why: r.reason})),
    ...failing.map(c => t("br.att.check", {c: c.label, e: c.expected, a: c.actual})),
    ...msgs.flatMap(m => (m.ask || []).map(q => t("br.att.q", {s: title(m.sender), q}))),
    ...(state.decisions || [])
  ];
  if (msgs.length) out.push({h: t("br.h.attention"), lines: att.length ? att : [t("br.att.none")]});
  return out;
}

function briefingText(state) {
  return buildBriefing(state).map(s => s.h.toUpperCase() + "\n" + s.lines.map(l => "- " + l).join("\n")).join("\n\n") + "\n";
}

function renderBriefing(state) {
  const secs = buildBriefing(state);
  $("briefBody").innerHTML = secs.map(s => `<div class="brsec"><h4>${esc(s.h)}</h4><ul>${s.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>`).join("");
}
