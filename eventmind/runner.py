"""Orchestrates one run: read file -> detect new text -> reading call -> plain-code planning.

Full run: no saved state. Update: saved state exists, so only the NEW text is sent to the model
(one 'reading' call), and the plan is recomputed in code. Area-tagged calls happen only when a
message brings a rule kind the code cannot evaluate.
"""
import hashlib
import json
import time
from datetime import datetime

from . import config, engine, ingest, reading, report
from .llm import LLM, parse_json, CallBudgetExceeded

AREA_CHECK_SYSTEM = ("You check one event-plan rule. Reply ONLY JSON: "
                     '{"ok":true|false,"why":"<=15 words","allowed":[option names that satisfy it, venue/food only]}')


def new_state():
    return {"version": 1, "updated": None, "runs": [], "messages": [], "raw_seen": [], "plan": {},
            "checks": [], "rejected": [], "decisions": [], "privacy": [], "trace": [], "events": [],
            "model_checks": {}, "totals": {}}


def load_state():
    if config.STATE_FILE.exists():
        return json.loads(config.STATE_FILE.read_text(encoding="utf-8"))
    return None


def new_text(state, raw):
    """Which part of this file has not been processed yet?"""
    h = hashlib.sha256(raw.encode()).hexdigest()
    seen = state["raw_seen"]
    if any(s["sha"] == h for s in seen):
        return ""
    for s in sorted(seen, key=lambda s: -len(s["text"])):
        if raw.startswith(s["text"]):           # the pack file was appended to
            return raw[len(s["text"]):].strip()
    return raw.strip()


def model_rule_checks(llm, state, messages):
    """Only for rules whose metric the code doesn't know. Cached so later updates don't repeat calls."""
    results = {}
    unknown = engine.unknown_rules(messages)
    if not unknown:
        return results
    base_plan, _, _, _ = engine.build_plan(engine.resolve(messages, {})[0])
    for r in unknown:
        area = r.get("area") if r.get("area") in engine.AREAS else "budget"
        section = base_plan.get(area)
        if area == "venue":
            section = base_plan["venue"]["options"]
        elif area == "food":
            section = base_plan["food"]["options"]
        user = f"Rule: {r.get('text') or r['key']}\nPlan {area}: {json.dumps(section, default=str)}"
        cache_key = hashlib.sha256(user.encode()).hexdigest()[:16]
        if cache_key in state["model_checks"]:
            res = state["model_checks"][cache_key]
        else:
            try:
                res = parse_json(llm.call(area, AREA_CHECK_SYSTEM, user, max_tokens=150))
            except (CallBudgetExceeded, Exception) as e:
                state["events"].append({"run": llm.run_no, "kind": "note", "text": f"Rule '{r['key']}' not checked: {e}"})
                continue
            state["model_checks"][cache_key] = res
        results[r["_id"]] = res
        allowed = [str(a).lower() for a in (res.get("allowed") or [])]
        if area in ("venue", "food") and allowed:
            results[f"_{area}_allowed"] = set(allowed)
    return results


def run(path):
    t0 = time.time()
    state = load_state()
    is_update = state is not None and bool(state.get("messages"))
    state = state or new_state()
    run_no = len(state["runs"]) + 1
    raw = ingest.read_file(path)
    text = new_text(state, raw)
    llm = LLM(state, run_no, is_update)
    calls_before = len(state["trace"])
    new_ns = []

    if text:
        safe_text, pii_notes = ingest.redact(text)
        for n in pii_notes:
            state["privacy"].append(f"Run {run_no}: {n}")
            state["events"].append({"run": run_no, "kind": "privacy", "text": n})
        known = {f["key"] for f in engine.flatten(state["messages"])}
        read_failed = False
        try:
            msgs = reading.read(llm, safe_text, known, is_update)
        except Exception as e:
            print(f"\n!! Reading failed: {e}\n   Plan left unchanged. Run the same command again to retry.")
            msgs, read_failed = [], True
        msgs = reading.attach_original_text(msgs, safe_text)
        for m in msgs:
            m["n"] = len(state["messages"]) + 1
            m["run"] = run_no
            m["lang"] = reading.clean_lang(m.get("lang"))
            m["ask"] = reading.follow_ups(m)
            m["flags"] = [f for f in (m.get("flags") or []) if f in ("legal", "disputed", "privacy")]
            if "privacy" in m["flags"]:
                state["privacy"].append(f"Message #{m['n']} contains personal data - used only for planning facts.")
            if set(m["flags"]) & {"legal", "disputed"}:
                state["privacy"].append(f"Message #{m['n']} flagged {'/'.join(m['flags'])} - not applied, needs human review.")
            state["messages"].append(m)
            new_ns.append(m["n"])
        if not read_failed:                 # a failed read must stay "new" so the next run retries it
            state["raw_seen"].append({"sha": hashlib.sha256(raw.encode()).hexdigest(), "text": raw})
    else:
        print("No new messages in this file - plan unchanged, 0 model calls.")

    old_sections = engine.area_sections(state["plan"]) if state["plan"] else {}
    old_status = {str(f["key"]).lower() + "@" + str(m["n"]): f.get("status") for m in state["messages"] for f in (m.get("facts") or [])
                  if isinstance(f, dict) and "key" in f}

    mres = model_rule_checks(llm, state, state["messages"])
    plan, checks, notes, status, facts, _ = engine.plan_with_rejections(state["messages"], {}, mres)
    apply_statuses(state, status, facts, run_no, old_status)

    state["plan"], state["checks"], state["decisions"] = plan, checks, notes
    new_sections = engine.area_sections(plan)
    changed = [a for a in engine.AREAS if old_sections.get(a) != new_sections.get(a)]
    run_calls = state["trace"][calls_before:]
    tok = lambda k: sum((c.get(k) or 0) for c in run_calls)
    state["runs"].append({"run": run_no, "kind": "update" if is_update else "full", "file": str(path),
                          "started": datetime.now().isoformat(timespec="seconds"), "calls": len(run_calls),
                          "tokens": {"prompt": tok("prompt_tokens"), "completion": tok("completion_tokens"),
                                     "total": tok("total_tokens")},
                          "call_areas": sorted({c["area"] for c in run_calls}), "changed_areas": changed,
                          "new_messages": new_ns, "duration_ms": int((time.time() - t0) * 1000)})
    all_calls = state["trace"]
    state["totals"] = {"calls": len(all_calls),
                       "prompt": sum((c.get("prompt_tokens") or 0) for c in all_calls),
                       "completion": sum((c.get("completion_tokens") or 0) for c in all_calls),
                       "total": sum((c.get("total_tokens") or 0) for c in all_calls)}
    state["updated"] = datetime.now().isoformat(timespec="seconds")
    save(state)
    report.print_run(state, run_no)
    return state


def apply_statuses(state, status, facts, run_no, old_status):
    by_id = {f["_id"]: f for f in facts}
    rejected = []
    for m in state["messages"]:
        fstat = []
        for i, f in enumerate(m.get("facts") or []):
            if not isinstance(f, dict):
                continue
            st, why = status.get(f"{m['n']}.{i}", ("irrelevant", "Not a usable fact"))
            f["status"], f["reason"] = st, why
            fstat.append((st, why, f))
            prev = old_status.get(str(f.get("key", "")).lower() + "@" + str(m["n"]))
            if st != prev and st in ("rejected", "stale", "needs_review"):
                kind = {"rejected": "reject", "stale": "stale", "needs_review": "review"}[st]
                state["events"].append({"run": run_no, "kind": kind,
                                        "text": f"Message #{m['n']} ({m.get('sender')}) {f.get('key')}: {why}"})
            if st == "rejected":
                rejected.append({"n": m["n"], "sender": m.get("sender"), "text": m.get("text"),
                                 "fact_key": f.get("key"), "reason": why})
        sts = [s for s, _, _ in fstat]
        if set(m.get("flags") or []) & {"legal", "disputed"}:
            m["status"], m["reason"] = "needs_review", fstat[0][1] if fstat else "Flagged legal/disputed - needs human review"
        elif not sts:
            m["status"], m["reason"] = "irrelevant", "No planning facts in this message"
        elif "rejected" in sts:
            m["status"], m["reason"] = "rejected", next(w for s, w, _ in fstat if s == "rejected")
        elif all(s == "stale" for s in sts):
            m["status"], m["reason"] = "stale", fstat[0][1]
        elif all(s == "optional" for s in sts):
            m["status"], m["reason"] = "optional", fstat[0][1]
        else:
            m["status"] = "used"
            stale = [w for s, w, _ in fstat if s == "stale"]
            m["reason"] = ("Partly superseded: " + stale[0]) if stale else "Facts applied to the plan"
        m["areas"] = sorted({a for _, _, f in fstat for a in engine.fact_areas(f)})
    state["rejected"] = rejected


def save(state):
    config.OUT.mkdir(exist_ok=True)
    config.STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    config.TRACE_FILE.write_text(report.trace_text(state), encoding="utf-8")
    config.PLAN_FILE.write_text(report.plan_markdown(state), encoding="utf-8")
