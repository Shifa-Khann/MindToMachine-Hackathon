"""The ONLY place where language is understood. One model call turns raw messages in any
language into a fixed English JSON schema. Everything after this is plain code."""
import re

from .llm import parse_json

_LANG = re.compile(r"^[A-Za-z]{2,3}(-[A-Za-z]{2,4})?$")


# numbers the planner needs for each fact type; a missing one becomes a follow-up question (plain code, no model call)
REQUIRED = {"event": [("value", "number")], "venue": [("capacity", "seating capacity"), ("price", "price in Rs")],
            "food": [("price_per_head", "price per head in Rs")], "judges": [("value", "number")],
            "expense": [("amount", "amount in Rs")], "optional": [("amount", "amount in Rs")],
            "break": [("minutes", "length in minutes")], "quantity": [("value", "quantity")]}


def _num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def follow_ups(m):
    """Questions to ask about one message: the model's own (max 2) plus any required number that is missing."""
    qs = [str(q).strip() for q in (m.get("ask") or []) if isinstance(q, (str,)) and str(q).strip()][:2]
    for f in m.get("facts") or []:
        if not isinstance(f, dict):
            continue
        what = f.get("name") or f.get("item") or f.get("field") or f.get("key") or f.get("type")
        for field, label in REQUIRED.get(f.get("type"), []):
            if not _num(f.get(field)):
                q = f"What is the {label} for '{what}'?"
                if q not in qs:
                    qs.append(q)
    return qs[:5]


def clean_lang(value):
    """Normalise the model's language tag; anything unusable becomes 'und' (undetermined)."""
    v = str(value or "").strip().replace("_", "-")
    if v.lower() == "mixed":
        return "mixed"
    if _LANG.match(v):
        head, _, tail = v.partition("-")
        return head.lower() + ("-" + tail.capitalize() if tail else "")
    return "und"

SYSTEM = """You extract event-planning facts from messages (emails, chats, notices) for ONE event.
Messages can be in ANY language or script, mixed, informal, with typos. Split the text into separate messages, in order: one object per message (a new sender/date header or a blank line starts a new message). Never merge messages and never skip one, even if it has no facts.
Return ONLY JSON: {"messages":[{"sender":str,"role":ROLE,"date":"YYYY-MM-DD"|null,"lang":LANG,"quote":"first 6 words of the message, verbatim","gist":"<=12 English words","ask":[QUESTION...],"flags":[FLAG...],"facts":[FACT...]}]}
QUESTION: <=2 short English questions for the sender, ONLY if the message is about the event but a number or detail needed to plan it is missing or unclear (price, headcount, date, amount, time). Otherwise [].
LANG: ISO 639-1 code of the message language (en, ur, hi, ar...); Roman-script Urdu or Hindi = "ur-Latn" / "hi-Latn"; several languages in one message = "mixed".
ROLE: approver (gives official approval/budget/rules for the event) | venue | caterer | judging | finance | vendor | participant | other
FLAG: "legal" (contract terms, legal threat, lawsuit) | "disputed" (contests or doubts another fact) | "privacy" (personal data: health, home address, IDs). Usually [].
date: if the year is missing, use the year of other messages.
Numbers: always plain numbers (convert words, local digits, lakh=100000, k=1000, "4 hours"=240 minutes). Text values in English, lowercase.
FACT types (one object per fact, always with "key" and "type"):
 {"type":"event","field":"students|team_size|teams|duration_min|budget|staff|other_people|start_time","value":n}
 {"type":"venue","name":s,"capacity":n,"price":n,"features":[s]}
 {"type":"food","name":s,"tier":"standard|basic|premium|other","price_per_head":n,"delivery_fee":n}
 {"type":"judges","field":"confirmed|fee_each|min_per_team|max_teams","value":n}
 {"type":"expense","item":s,"amount":n}          already ordered/paid from the event budget
 {"type":"optional","item":s,"amount":n}         a request or suggestion, not approved
 {"type":"break","name":s,"minutes":n}           required break in the schedule
 {"type":"quantity","area":"food|venue|judging|schedule|budget","item":s,"value":n}  a count someone says they ordered/booked/changed
 {"type":"rule","area":"venue|schedule|food|judging|budget","metric":M,"op":"<=|>=|==|requires|excludes","value":n|s,"text":"rule in English"}
   M: headcount|venue_capacity|venue_price|venue_features|food_price_per_head|food_boxes|total_cost|remaining_budget|judges|teams_per_judge|duration_min|start_time|end_time|teams|students|other
key: short stable id "<type>:<thing>", e.g. "venue:hall x", "food:standard", "expense:printing", "event:budget", "judges:fee_each", "break:prayer". Same thing = same key.
Messages with nothing for planning (greetings, delays, chit-chat) get "facts":[]. Do not invent facts."""

UPDATE_HINT = ("These message(s) arrived AFTER all earlier ones. Reuse an existing key when the message "
               "changes the same thing.\nExisting keys: {keys}\n\nNEW MESSAGE(S):\n{text}")


def read(llm, text, known_keys, is_update):
    if is_update:
        user = UPDATE_HINT.format(keys=", ".join(sorted(known_keys)) or "none", text=text)
        max_tokens = 2500
    else:
        user = "MESSAGES:\n" + text
        max_tokens = 6000
    out = llm.call("reading", SYSTEM, user, max_tokens=max_tokens)
    try:
        data = parse_json(out)
    except Exception:
        # one repair attempt, still tagged "reading"
        out = llm.call("reading", "Fix this into valid JSON of the same shape. Output JSON only.", out,
                       max_tokens=max_tokens)
        data = parse_json(out)
    msgs = data.get("messages") or []
    return [m for m in msgs if isinstance(m, dict)]


def attach_original_text(msgs, raw):
    """Use each message's verbatim quote to slice the original text for display."""
    pos = []
    cursor = 0
    for m in msgs:
        q = (m.get("quote") or "").strip()
        i = raw.find(q, cursor) if q else -1
        if i == -1 and q:
            i = raw.find(q[:20], cursor)
        pos.append(i)
        if i != -1:
            cursor = i + 1
    for idx, m in enumerate(msgs):
        start = pos[idx]
        if start == -1:
            m["text"] = m.get("gist") or ""
            continue
        nxt = [p for p in pos[idx + 1:] if p != -1 and p > start]
        end = nxt[0] if nxt else len(raw)
        m["text"] = raw[start:end].strip()
    if len(msgs) == 1 and pos[0] == -1:
        msgs[0]["text"] = raw.strip()
    return msgs
