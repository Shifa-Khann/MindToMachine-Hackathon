"""Terminal output, trace.txt and plan.md. The printed trace is required by the brief."""
import sys

try:  # Windows terminals: make Urdu/any script printable
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

B, DIM, G, R, Y, C, X = "\033[1m", "\033[2m", "\033[32m", "\033[31m", "\033[33m", "\033[36m", "\033[0m"


def rs(n):
    return "-" if n is None else f"Rs {n:,.0f}"


def trace_lines(state, run_no=None):
    out = []
    calls = [c for c in state["trace"] if run_no is None or c["run"] == run_no]
    for c in calls:
        out += [f"=== CALL #{c['n']} | run {c['run']} | model: {c['model']} | area: {c['area']} | "
                f"tokens in={c['prompt_tokens']} out={c['completion_tokens']} total={c['total_tokens']} | {c['ms']} ms"
                + (f" | ERROR {c['error']}" if c.get("error") else ""),
                "--- input ---", c["input"], "--- output ---", c["output"], ""]
    evs = [e for e in state["events"] if run_no is None or e["run"] == run_no]
    if evs:
        out.append("=== DECISIONS (conflicts, rejections, stale facts) ===")
        out += [f"[run {e['run']}] {e['kind'].upper()}: {e['text']}" for e in evs]
        out.append("")
    run_tot = sum((c.get("total_tokens") or 0) for c in calls)
    t = state["totals"]
    scope = f"run {run_no}" if run_no else "all runs"
    out.append(f"=== TOTAL TOKENS ({scope}): {run_tot}  | calls: {len(calls)}"
               + (f"  | grand total all runs: {t.get('total')} tokens, {t.get('calls')} calls" if run_no else ""))
    return out


def trace_text(state):
    return "\n".join(trace_lines(state)) + "\n"


def plan_markdown(state):
    p, L = state["plan"], []
    h, v, f, j, s, b = (p.get(k, {}) for k in ("headcount", "venue", "food", "judging", "schedule", "budget"))
    L += ["# Event plan", "", f"People on site: **{h.get('total')}** ({h.get('students')} students, {h.get('staff')} staff, "
          f"{h.get('judges')} judges, {h.get('other')} others)", "",
          "## Venue", f"{v.get('name')} - seats {v.get('capacity')} - {rs(v.get('price'))}", "",
          "## Food", f"{f.get('boxes')} x {f.get('name')} @ {rs(f.get('price_per_head'))} = {rs(f.get('cost'))}", "",
          "## Judging", f"{j.get('used')} judges for {j.get('teams')} teams (max {j.get('max_teams')} each, "
          f"{j.get('minutes_per_team')} min/team), honorarium {rs(j.get('cost'))}", "",
          "## Schedule", "| Start | End | Block | Min |", "|---|---|---|---|"]
    L += [f"| {x['start']} | {x['end']} | {x['item']} | {x['minutes']} |" for x in s.get("blocks", [])]
    L += ["", "## Budget", "| Item | Amount |", "|---|---|"]
    L += [f"| {x['item']} | {rs(x['amount'])} |" for x in b.get("lines", [])]
    L += [f"| **Total** | **{rs(b.get('total'))}** |", f"| Remaining of {rs(b.get('cap'))} | {rs(b.get('remaining'))} |", ""]
    for o in b.get("optional", []):
        L.append(f"- Optional (not included): {o['item']} {rs(o['amount'])} - {'fits' if o['fits'] else 'does not fit'}")
    L += ["", "## Checks"] + [f"- [{'x' if c['ok'] else ' '}] {c['label']} (expected {c['expected']}, actual {c['actual']})"
                               for c in state["checks"]]
    L += ["", "## Rejected messages"] + ([f"- #{r['n']} {r['sender']}: {r['reason']}" for r in state["rejected"]] or ["- none"])
    L += ["", "## Messages"] + [f"- #{m['n']} [{m.get('status')}] {m.get('sender')}: {m.get('gist')} - {m.get('reason')}"
                                for m in state["messages"]]
    L += ["", "## Decisions for a human"] + ([f"- {d}" for d in state["decisions"]] or ["- none"])
    L += ["", "## Privacy & safety"] + ([f"- {d}" for d in state["privacy"]] or ["- none"])
    return "\n".join(L) + "\n"


def print_run(state, run_no):
    run = state["runs"][-1]
    print(f"\n{B}{C}══ TRACE · run {run_no} ({run['kind']}) ══{X}")
    print("\n".join(trace_lines(state, run_no)))

    p = state["plan"]
    print(f"\n{B}{C}══ MESSAGES ══{X}")
    col = {"used": G, "stale": DIM, "rejected": R, "irrelevant": DIM, "optional": Y, "needs_review": Y}
    for m in state["messages"]:
        print(f" #{m['n']:<2} {col.get(m.get('status'), '')}{m.get('status', ''):<12}{X} {str(m.get('sender'))[:28]:<28} "
              f"{m.get('gist', '')[:50]}  {DIM}{m.get('reason', '')[:90]}{X}")

    if state["rejected"]:
        print(f"\n{B}{R}══ REJECTED ══{X}")
        for r in state["rejected"]:
            print(f" {R}✘ #{r['n']} {r['sender']}{X}: {r['reason']}")

    print(f"\n{B}{C}══ PLAN ══{X}")
    print(plan_markdown(state).split("## Checks")[0])
    print(f"{B}{C}══ CHECKS ══{X}")
    for c in state["checks"]:
        print(f" {G + '✔' if c['ok'] else R + '✘'}{X} {c['label']:<48} expected {c['expected']}, actual {c['actual']}")
    for d in state["decisions"]:
        print(f" {Y}! {d}{X}")
    print(f"\n{B}Run {run_no}: {run['calls']} model call(s), {run['tokens']['total']} tokens · areas with calls: "
          f"{', '.join(run['call_areas']) or 'none'} · plan areas changed: {', '.join(run['changed_areas']) or 'none'} · "
          f"{run['duration_ms']} ms{X}")
    print(f"{DIM}Saved: out/state.json, out/trace.txt, out/plan.md{X}\n")
