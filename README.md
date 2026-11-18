# EventMind — Mind to Machine Hackathon

An agent system that reads a pack of messages (emails, WhatsApp, notices, **in any language**) and plans a hackathon:
**venue, schedule, food, judging, budget**. A model is used **only to read language**; every number, choice and check is **plain code**.

```
messages.txt ──► [privacy redaction: code] ──► [reading: 1 model call] ──► facts (fixed English JSON)
                                                                          │
           plan.md / trace.txt / state.json ◄── [planner + validator: code] ◄─ resolve (newest wins, authority, reject)
                         │
                         └──► UI (ui/ — works standalone or live via serve.py)
```

## Quick start

```bash
cp .env.example .env          # add your model key (Groq / Ollama / Gemini — any OpenAI-compatible endpoint)
python eventmind.py reset     # fresh start
python eventmind.py data/pack.txt         # full run (1 model call)
python eventmind.py data/new_message.txt  # update: same command, only new text is read
python serve.py               # UI at http://localhost:8000
python -m unittest -v         # engine tests (invented data, no model needed)
```

No dependencies for the core (Python 3.10+ standard library). `pip install -r requirements.txt` only adds .docx/.pdf input.

## The one command
`python eventmind.py <file>` — no flags or hints.
- No saved state → **full run**.
- Saved state → **update**: only text not seen before is sent to the model (new file, or the same pack file with messages appended). A file already processed → 0 calls.

## How each requirement is met

| Brief requirement | How |
|---|---|
| Read every message from a text file, exactly as given | `ingest.read_file` (txt/md, plus docx/pdf). Nothing about the pack is in code. |
| Same command for every message | `eventmind.py` decides full vs update from saved state only. |
| Trace: numbered calls, model, area tag, input, output, tokens, total | `llm.py` records every call. Tokens are copied from the provider's `usage`, never estimated. Printed + `out/trace.txt`. |
| Accept new messages and update the plan | `runner.new_text` sends only new text; the plan is recomputed in code (no model). |
| Conflicts: keep plan valid and say why | `engine.plan_with_rejections`: if a fact breaks a check, the newest lower-authority fact whose removal fixes it is rejected, with the exact failing rule in the trace. |
| Update ≤ 5 calls, ≤ 1 min | Normally 1 call (`reading`). Hard cap of 5 in `llm.py`, 40 s timeout per call. |
| Full run ≤ 2 min | 1 call for the whole pack. |
| UI | `ui/`: plan, checks, budget bar, schedule timeline, messages with status, rejected tab, trace, run history. |

## Message statuses
`used` · `stale` (superseded by a newer message on the same key) · `rejected` (breaks a rule or sender lacks authority) · `irrelevant` (no planning facts) · `optional` (request, not approved; shown with affordability) · `needs_review` (legal/disputed content — never applied automatically).

## Safety & privacy
- Phone numbers, emails, ID and card numbers are **removed in code before** text reaches the model, and logged in the trace.
- Messages the model flags as **legal** or **disputed** are not applied to the plan; they appear under *Needs review* for a human.
- Messages containing personal data are marked in the *Privacy* panel.

## Repo map
| File | Purpose |
|---|---|
| `eventmind.py` | The one command |
| `eventmind/ingest.py` | Read any file format; redact personal data |
| `eventmind/reading.py` | The only prompt: any language → fixed English JSON facts |
| `eventmind/engine.py` | Resolve facts, plan, validate, reject — pure code |
| `eventmind/runner.py` | Full vs update flow, statuses, saving |
| `eventmind/llm.py` | OpenAI-compatible client + trace recording |
| `eventmind/report.py` | Terminal output, trace.txt, plan.md |
| `serve.py` | Serves UI; "add message" runs the same command |
| `ui/` | Standalone dashboard (vanilla HTML/JS/CSS, no build step) |
| `docs/` | IDEA, PRD, TRD, CONTEXT, ARCHITECTURE, PROGRESS, RULES, JUDGE_QA, TEST_DAY |
| `AGENTS.md` | Rules for AI assistants + the system's agents |
| `SECURITY.md` | Secrets, privacy, untrusted input |
| `scripts/ship.sh` | Test → commit → push after each finished functionality |

## Team
| Member | Owns | Must also be able to explain |
|---|---|---|
| _name_ | Reading prompt + model setup | engine checks |
| _name_ | Engine (planner, validator, rejection) | trace + tokens |
| _name_ | UI + serve.py + test-day run | why each part exists |
