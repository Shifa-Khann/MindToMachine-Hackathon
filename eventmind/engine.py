"""Plain-code core: resolve facts -> plan -> validate -> reject what breaks the plan.

No model calls here except one optional area check for a rule the code cannot evaluate.
Nothing from any message pack is written in this file: all numbers come from extracted facts.
"""
import json
import math
import re
from collections import defaultdict

from .config import ROLE_RANK

AREAS = ["venue", "schedule", "food", "judging", "budget"]

# canonical field names (schema words, not pack facts)
EVENT_SYNONYMS = {"participants": "students", "attendees": "students", "team size": "team_size",
                  "duration": "duration_min", "duration_minutes": "duration_min", "hours": "duration_hours",
                  "duration_hours": "duration_hours", "total_budget": "budget", "volunteers": "other_people",
                  "guests": "other_people", "start": "start_time"}
JUDGE_SYNONYMS = {"count": "confirmed", "available": "confirmed", "honorarium": "fee_each", "fee": "fee_each",
                  "minutes_per_team": "min_per_team", "max_teams_per_judge": "max_teams"}
KNOWN_METRICS = {"headcount", "venue_capacity", "venue_price", "venue_features", "food_price_per_head",
                 "food_boxes", "total_cost", "remaining_budget", "judges", "teams_per_judge", "duration_min",
                 "start_time", "end_time", "teams", "students"}

FIXED = {"opening": 15, "meal": 30, "closing": 15}   # planning conventions, editable
MIN_BUILD = 30


def num(x):
    if isinstance(x, bool):
        return None
    if isinstance(x, (int, float)):
        return x
    try:
        return float(re.sub(r"[^\d.\-]", "", str(x)))
    except (TypeError, ValueError):
        return None


def hhmm_to_min(s):
    m = re.search(r"(\d{1,2})[:.](\d{2})\s*(am|pm)?", str(s or ""), re.I)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if m.group(3) and m.group(3).lower() == "pm" and h < 12:
        h += 12
    return h * 60 + mi


def min_to_hhmm(m):
    return f"{(m // 60) % 24:02d}:{m % 60:02d}"


def fact_areas(f):
    t = f.get("type")
    if t == "venue":
        return ["venue", "budget"]
    if t == "food":
        return ["food", "budget"]
    if t == "judges":
        return ["judging", "budget"] if f.get("field") == "fee_each" else ["judging", "schedule"]
    if t in ("expense", "optional"):
        return ["budget"]
    if t == "break":
        return ["schedule"]
    if t in ("quantity", "rule"):
        return [f.get("area") if f.get("area") in AREAS else "budget"]
    if t == "event":
        fld = f.get("field")
        if fld == "budget":
            return ["budget"]
        if fld in ("duration_min", "duration_hours", "start_time"):
            return ["schedule"]
        return ["venue", "food", "judging", "budget"]
    return []


# --------------------------------------------------------------------------- resolve
def flatten(messages):
    facts = []
    for m in messages:
        rank = ROLE_RANK.get(m.get("role"), 1)
        for i, f in enumerate(m.get("facts") or []):
            if not isinstance(f, dict) or not f.get("type"):
                continue
            g = dict(f)
            g.setdefault("key", f"{g['type']}:{g.get('field') or g.get('name') or g.get('item') or i}")
            g["key"] = str(g["key"]).lower().strip()
            g.update(_id=f"{m['n']}.{i}", _n=m["n"], _run=m["run"], _date=m.get("date") or "",
                     _rank=rank, _role=m.get("role"))
            facts.append(g)
    return facts


def sort_key(f):
    # dated messages by date; undated (new) messages count as newest; ties by arrival
    return (f["_date"] or "9999-12-31", f["_run"], f["_n"], f["_id"])


def resolve(messages, forced_rejects):
    """Returns (active_facts, status dict fact_id -> (status, reason))."""
    facts = flatten(messages)
    status = {}
    by_msg = {m["n"]: m for m in messages}
    approver_exists = any(f["_rank"] >= 3 for f in facts)

    for f in facts:
        m = by_msg[f["_n"]]
        flags = set(m.get("flags") or [])
        if flags & {"legal", "disputed"}:
            status[f["_id"]] = ("needs_review", "Message flagged as " + "/".join(sorted(flags & {"legal", "disputed"}))
                                + " content - not applied automatically, needs a human decision")
        elif f["_id"] in forced_rejects:
            status[f["_id"]] = ("rejected", forced_rejects[f["_id"]])
        elif f["type"] == "event" and approver_exists and f["_rank"] < 3:
            status[f["_id"]] = ("rejected", f"Only the approving authority can set event '{f.get('field')}'; "
                                            f"sender role '{f['_role']}' cannot change it")
        elif f["type"] == "rule" and f["_rank"] <= 1:
            status[f["_id"]] = ("optional", "Request from a participant, not an approved rule")
        elif f["type"] == "optional":
            status[f["_id"]] = ("optional", "Requested, not approved - shown with affordability, not added to plan")

    groups = defaultdict(list)
    for f in facts:
        if f["_id"] not in status:
            groups[f["key"]].append(f)
    active = []
    for key, fs in groups.items():
        fs.sort(key=sort_key)
        current = None
        for f in fs:
            if current and f["_rank"] < current["_rank"]:
                status[f["_id"]] = ("rejected", f"Sender role '{f['_role']}' cannot override '{key}' set by a "
                                                f"higher-authority sender in message #{current['_n']}")
                continue
            if current:
                status[current["_id"]] = ("stale", f"Superseded by newer message #{f['_n']}")
            current = f
        if current:
            status[current["_id"]] = ("used", "")
            active.append(current)
    return active, status, facts


# --------------------------------------------------------------------------- plan
def _collect(active):
    ev, jd = {}, {}
    venues, foods, expenses, breaks, qty, rules = [], [], [], [], [], []
    for f in active:
        t = f["type"]
        if t == "event":
            fld = str(f.get("field", "")).lower()
            fld = EVENT_SYNONYMS.get(fld, fld)
            ev[fld] = f.get("value")
        elif t == "judges":
            fld = str(f.get("field", "")).lower()
            jd[JUDGE_SYNONYMS.get(fld, fld)] = num(f.get("value"))
        elif t == "venue":
            venues.append(f)
        elif t == "food":
            foods.append(f)
        elif t == "expense":
            expenses.append(f)
        elif t == "break":
            breaks.append(f)
        elif t == "quantity":
            qty.append(f)
        elif t == "rule":
            rules.append(f)
    return ev, jd, venues, foods, expenses, breaks, qty, rules


def make_schedule(start_min, duration, breaks, has_food, judging_min):
    blocks = [("Opening & briefing", FIXED["opening"], "ceremony")]
    middle = []
    if has_food:
        middle.append(("Lunch", FIXED["meal"], "meal"))
    for b in breaks:
        mins = int(num(b.get("minutes")) or 0)
        if mins:
            middle.append((str(b.get("name") or "break").capitalize() + " break", mins, "break"))
    fixed = FIXED["opening"] + sum(x[1] for x in middle) + judging_min + FIXED["closing"]
    build = int(duration - fixed)
    b1 = (build // 2) // 5 * 5
    b2 = build - b1
    blocks += [("Build session 1", b1, "build")] + middle + [("Build session 2", b2, "build"),
               ("Judging at tables", judging_min, "judging"), ("Closing & prizes", FIXED["closing"], "ceremony")]
    out, t = [], start_min
    for item, mins, kind in blocks:
        out.append({"start": min_to_hhmm(t), "end": min_to_hhmm(t + mins), "item": item, "minutes": mins, "kind": kind})
        t += mins
    return out, build


def _metric(name, ctx):
    return ctx.get(name)


def eval_rule(rule, ctx):
    """Returns True/False, or None if code cannot evaluate this metric."""
    metric, op, val = rule.get("metric"), rule.get("op"), rule.get("value")
    if metric not in KNOWN_METRICS:
        return None
    if metric == "venue_features":
        feats = " ".join(ctx.get("venue_features") or []).lower()
        has = str(val).lower() in feats
        return has if op != "excludes" else not has
    actual = ctx.get(metric)
    if metric in ("start_time", "end_time"):
        actual, val = hhmm_to_min(actual), hhmm_to_min(val)
    else:
        val = num(val)
    if actual is None or val is None:
        return None
    return {"<=": actual <= val, ">=": actual >= val, "==": actual == val}.get(op)


def build_plan(active, model_rule_results=None):
    """Search every venue x food option, return the best plan that passes all checks."""
    model_rule_results = model_rule_results or {}
    ev, jd, venues, foods, expenses, breaks, qty, rules = _collect(active)
    notes = []

    students = num(ev.get("students"))
    team_size = num(ev.get("team_size"))
    teams = num(ev.get("teams"))
    if not teams and students and team_size:
        teams = math.ceil(students / team_size)
    if not students and teams and team_size:
        students = teams * team_size
    teams = int(teams) if teams else None
    staff = num(ev.get("staff")) or 0
    other = num(ev.get("other_people")) or 0
    duration = num(ev.get("duration_min")) or ((num(ev.get("duration_hours")) or 0) * 60) or None
    budget = num(ev.get("budget"))
    start = hhmm_to_min(ev.get("start_time"))
    if start is None:
        start = 10 * 60
        notes.append("No start time in messages - schedule shown from an assumed 10:00 start.")

    max_t = jd.get("max_teams")
    mpt = jd.get("min_per_team") or 0
    confirmed = jd.get("confirmed")
    fee = jd.get("fee_each") or 0
    needed = math.ceil(teams / max_t) if teams and max_t else (int(confirmed) if confirmed else 0)
    used = needed if confirmed is None or confirmed >= needed else int(confirmed)
    if confirmed and confirmed > needed:
        notes.append(f"{int(confirmed)} judges confirmed but {needed} are enough ({teams} teams / max {int(max_t)} each). "
                     f"Honorarium budgeted for {needed}; {int(confirmed - needed)} on standby - confirm with organizers.")
    per_judge = math.ceil(teams / used) if teams and used else None
    judging_min = int((per_judge or 0) * mpt)

    headcount = int((students or 0) + staff + used + other)
    committed = [{"item": e.get("item") or e["key"], "amount": num(e.get("amount")) or 0} for e in expenses]
    committed_total = sum(c["amount"] for c in committed)
    food_qty = next((num(q.get("value")) for q in qty if q.get("area") == "food"), None)

    schedule, build_min = make_schedule(start, duration or 0, breaks, bool(foods), judging_min)

    # judges -> teams -> time slots (all judges work in parallel)
    assignments = []
    jstart = next((hhmm_to_min(b["start"]) for b in schedule if b["kind"] == "judging"), start)
    for j in range(used or 0):
        tms = [t for t in range(j * (per_judge or 0) + 1, min((j + 1) * (per_judge or 0), teams or 0) + 1)]
        assignments.append({"judge": f"J{j + 1}", "teams": tms,
                            "slots": [min_to_hhmm(jstart + k * int(mpt)) for k in range(len(tms))]})

    venue_allowed = model_rule_results.get("_venue_allowed")
    food_allowed = model_rule_results.get("_food_allowed")
    candidates = []
    for v in (venues or [None]):
        if v and venue_allowed is not None and str(v.get("name")).lower() not in venue_allowed:
            continue
        for fo in (foods or [None]):
            if fo and food_allowed is not None and str(fo.get("name")).lower() not in food_allowed:
                continue
            boxes = int(food_qty if food_qty is not None else headcount)
            pph = num(fo.get("price_per_head")) if fo else None
            food_cost = (boxes * (pph or 0) + (num(fo.get("delivery_fee")) or 0)) if fo else 0
            vprice = num(v.get("price")) if v else None
            judges_cost = used * fee
            total = committed_total + (vprice or 0) + food_cost + judges_cost
            ctx = {"headcount": headcount, "venue_capacity": num(v.get("capacity")) if v else None,
                   "venue_price": vprice, "venue_features": (v.get("features") or []) if v else [],
                   "food_price_per_head": pph, "food_boxes": boxes, "total_cost": total,
                   "remaining_budget": (budget - total) if budget is not None else None, "judges": used,
                   "teams_per_judge": per_judge, "duration_min": sum(b["minutes"] for b in schedule),
                   "start_time": schedule[0]["start"], "end_time": schedule[-1]["end"],
                   "teams": teams, "students": students}
            checks = validate(ctx, v, fo, budget, duration, confirmed, needed, max_t, mpt, judging_min,
                              build_min, breaks, schedule, rules, model_rule_results)
            fails = sum(1 for c in checks if not c["ok"])
            tier_pref = 0 if fo and (str(fo.get("tier")) == "standard" or "standard" in str(fo.get("name"))) else 1
            candidates.append((fails, tier_pref, total, v, fo, boxes, pph, food_cost, vprice, judges_cost, checks, ctx))

    candidates.sort(key=lambda c: (c[0], c[1], c[2]))
    fails, _, total, v, fo, boxes, pph, food_cost, vprice, judges_cost, checks, ctx = candidates[0]

    def opt_note(o, kind):
        if kind == "venue":
            cap = num(o.get("capacity")) or 0
            if cap < headcount:
                return f"too small for {headcount}"
            if venue_allowed is not None and str(o.get("name")).lower() not in venue_allowed:
                return "fails a stated requirement"
            return "chosen: cheapest that meets every check" if o is v else "fits, but costs more"
        return "chosen" if o is fo else ""

    lines = [{"item": c["item"], "amount": c["amount"], "area": "budget", "kind": "committed"} for c in committed]
    if v:
        lines.append({"item": f"Venue: {v.get('name')}", "amount": vprice or 0, "area": "venue", "kind": "venue"})
    if fo:
        lines.append({"item": f"Food: {boxes} x {fo.get('name')}", "amount": food_cost, "area": "food", "kind": "food"})
    if used and fee:
        lines.append({"item": f"Judges: {used} x honorarium", "amount": judges_cost, "area": "judging", "kind": "judging"})
    remaining = (budget - total) if budget is not None else None

    plan = {
        "headcount": {"students": int(students or 0), "staff": int(staff), "judges": used, "other": int(other),
                      "total": headcount},
        "venue": {"name": v.get("name") if v else None, "capacity": num(v.get("capacity")) if v else None,
                  "price": vprice, "features": (v.get("features") or []) if v else [],
                  "options": [{"name": o.get("name"), "capacity": num(o.get("capacity")), "price": num(o.get("price")),
                               "chosen": o is v, "note": opt_note(o, "venue")} for o in venues]},
        "food": {"name": fo.get("name") if fo else None, "tier": fo.get("tier") if fo else None,
                 "price_per_head": pph, "boxes": boxes, "cost": food_cost,
                 "options": [{"name": o.get("name"), "price_per_head": num(o.get("price_per_head")),
                              "chosen": o is fo, "note": opt_note(o, "food")} for o in foods]},
        "judging": {"teams": teams, "confirmed": int(confirmed) if confirmed is not None else None, "needed": needed,
                    "used": used, "fee_each": fee, "cost": judges_cost, "minutes_per_team": mpt,
                    "max_teams": max_t, "assignments": assignments},
        "schedule": {"start": schedule[0]["start"], "end": schedule[-1]["end"],
                     "duration_min": sum(b["minutes"] for b in schedule), "blocks": schedule},
        "budget": {"cap": budget, "lines": lines, "total": total, "remaining": remaining, "optional": []},
    }
    return plan, checks, notes, ctx


def validate(ctx, v, fo, budget, duration, confirmed, needed, max_t, mpt, judging_min, build_min,
             breaks, schedule, rules, model_rule_results):
    C = []

    def add(cid, area, label, ok, expected, actual):
        C.append({"id": cid, "area": area, "label": label, "ok": bool(ok), "expected": expected, "actual": actual})

    hc = ctx["headcount"]
    add("areas", "budget", "All five areas planned",
        all([v, fo, ctx["teams"], duration, budget is not None]), "venue, food, judging, schedule, budget",
        ", ".join(n for n, x in [("venue", v), ("food", fo), ("judging", ctx["teams"]), ("schedule", duration),
                                 ("budget", budget is not None)] if x) or "none")
    add("venue_fits", "venue", "Venue fits everyone", v and (ctx["venue_capacity"] or 0) >= hc,
        f">= {hc} seats", ctx["venue_capacity"])
    add("food_covers", "food", "Food for every person", fo and ctx["food_boxes"] >= hc, f">= {hc} meals",
        ctx["food_boxes"])
    add("budget", "budget", "Within budget", budget is not None and ctx["total_cost"] <= budget,
        f"<= {budget:,.0f}" if budget is not None else "a budget", f"{ctx['total_cost']:,.0f}")
    add("judges_enough", "judging", "Enough judges", confirmed is None or confirmed >= needed,
        f">= {needed}", confirmed)
    if max_t:
        add("judge_load", "judging", "No judge over team limit", (ctx["teams_per_judge"] or 0) <= max_t,
            f"<= {int(max_t)} teams", ctx["teams_per_judge"])
    add("duration", "schedule", "Schedule fills event length exactly",
        duration and ctx["duration_min"] == duration and build_min >= MIN_BUILD,
        f"{int(duration or 0)} min, build >= {MIN_BUILD}", f"{ctx['duration_min']} min, build {build_min}")
    for b in breaks:
        name = str(b.get("name") or "break").capitalize() + " break"
        blk = next((x for x in schedule if x["item"] == name), None)
        add(f"break:{b['key']}", "schedule", f"{name} included",
            blk and blk["minutes"] >= (num(b.get("minutes")) or 0), f"{b.get('minutes')} min",
            blk["minutes"] if blk else "missing")
    for r in rules:
        res = eval_rule(r, ctx)
        if res is None:
            res = model_rule_results.get(r["_id"], {}).get("ok")
            how = "checked by model" if res is not None else "could not be checked"
        else:
            how = "checked by code"
        add(f"rule:{r['key']}", r.get("area") or "budget", f"Rule: {r.get('text') or r['key']} ({how})",
            res is not False, f"{r.get('metric')} {r.get('op')} {r.get('value')}", ctx.get(r.get("metric"), "-"))
    return C


# --------------------------------------------------------------------------- reject loop
def failing(checks):
    return [c for c in checks if not c["ok"]]


def plan_with_rejections(messages, prior_rejects, model_rule_results):
    """Apply all facts; if the plan breaks, find the single newest lower-authority fact whose
    removal makes every check pass, reject it with the exact failing rule, and repeat."""
    forced = dict(prior_rejects)
    for _ in range(5):
        active, status, facts = resolve(messages, forced)
        plan, checks, notes, ctx = build_plan(active, model_rule_results)
        bad = failing(checks)
        if not bad:
            break
        # newest first: the latest lower-authority message is the most likely culprit
        suspects = sorted([f for f in active if f["_rank"] < 3], key=sort_key, reverse=True)
        fixed = False
        for s in suspects:
            trial = dict(forced)
            trial[s["_id"]] = "x"
            a2, _, _ = resolve(messages, trial)
            p2, c2, _, _ = build_plan(a2, model_rule_results)
            if not failing(c2):
                why = "; ".join(f"{c['label']}: expected {c['expected']}, would be {c['actual']}" for c in bad)
                forced[s["_id"]] = f"Conflicts with a rule - applying it breaks the plan ({why}). Plan kept valid without it."
                fixed = True
                break
        if not fixed:
            break
    # optional requests: show affordability, never auto-add
    for f in facts:
        if status.get(f["_id"], ("",))[0] == "optional" and f["type"] == "optional":
            amt = num(f.get("amount")) or 0
            rem = plan["budget"]["remaining"]
            plan["budget"]["optional"].append({"item": f.get("item"), "amount": amt, "source": f["_n"],
                                               "fits": rem is not None and amt <= rem})
    return plan, checks, notes, status, facts, forced


def unknown_rules(messages):
    active, _, _ = resolve(messages, {})
    return [f for f in active if f["type"] == "rule" and f.get("metric") not in KNOWN_METRICS]


def area_sections(plan):
    return {a: json.dumps(plan.get(a), sort_keys=True, default=str) for a in AREAS}
