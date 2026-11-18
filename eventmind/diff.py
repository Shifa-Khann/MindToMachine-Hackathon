"""What changed in the plan after a run? Plain code, no model. The UI turns these records into the
'Latest update' part of the event briefing, so the briefing differs after every message."""

# (area, key in plan[area], label id used by the UI, value kind)
FIELDS = [
    ("headcount", "total", "people", "num"), ("venue", "name", "venue", "name"), ("venue", "capacity", "venue_seats", "num"),
    ("venue", "price", "venue_price", "money"), ("food", "name", "food", "name"), ("food", "price_per_head", "food_price", "money"),
    ("food", "boxes", "meals", "num"), ("food", "cost", "food_cost", "money"), ("judging", "teams", "teams", "num"),
    ("judging", "used", "judges", "num"), ("judging", "cost", "judges_cost", "money"), ("schedule", "start", "start", "time"),
    ("schedule", "end", "end", "time"), ("schedule", "duration_min", "duration", "min"), ("budget", "cap", "cap", "money"),
    ("budget", "total", "total", "money"), ("budget", "remaining", "remaining", "money"),
]


def plan_changes(old, new):
    """List of {area, field, kind, old, new[, item]} for every value that differs between two plans."""
    old, new = old or {}, new or {}
    out = []
    for area, key, field, kind in FIELDS:
        a, b = (old.get(area) or {}).get(key), (new.get(area) or {}).get(key)
        if a != b:
            out.append({"area": area, "field": field, "kind": kind, "old": a, "new": b})
    old_lines = {l["item"]: l["amount"] for l in (old.get("budget") or {}).get("lines", [])}
    new_lines = {l["item"]: l["amount"] for l in (new.get("budget") or {}).get("lines", [])}
    for item in list(new_lines) + [i for i in old_lines if i not in new_lines]:
        if old_lines.get(item) != new_lines.get(item):
            out.append({"area": "budget", "field": "line", "kind": "money", "item": item,
                        "old": old_lines.get(item), "new": new_lines.get(item)})
    return out
