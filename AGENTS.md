# AGENTS.md — instructions for AI coding assistants (and the system's own agents)

## Part 1 — For AI coding assistants working on this repo
Read `docs/CONTEXT.md`, `docs/RULES.md` and `docs/ARCHITECTURE.md` first.

**Never:**
- put facts, numbers, names or messages from any message pack into code, prompts, tests or defaults
- estimate or fake token counts or model names in the trace
- add a model call where plain code can do the job
- add dependencies to the core (standard library only)
- commit `.env`, `out/` or `inbox/`

**Always:**
- run `python -m unittest -v` and make sure it passes
- update `docs/PROGRESS.md`, then commit and push after each finished functionality
- keep each module single-purpose and explainable in two sentences

## Part 2 — The system's agents
The brief rewards justified parts, not many agents. EventMind has **one model role and one optional checker**; everything else is code.

| Agent | Kind | Area tag | When it runs | Input | Output | Why it exists |
|---|---|---|---|---|---|---|
| Reader | Model | `reading` | Every run with new text (1 call) | New message text + existing keys (updates) | Fixed JSON facts | Only a model can read any language and phrasing |
| Rule checker | Model | the rule's area | Only for a rule whose metric code doesn't know; cached | Rule text + that area's plan section | `{ok, why, allowed}` | Handles constraint kinds we've never seen |
| Resolver | Code | — | Every run | All facts | Active / stale / rejected facts | Newest wins, authority, review flags |
| Planner | Code | — | Every run | Active facts | Best plan over all options | Arithmetic must be exact and free |
| Validator | Code | — | Inside the planner | Plan + rules | Pass/fail checks | Guarantees a valid plan |
| Rejector | Code | — | When checks fail | Facts + checks | Rejected fact + reason | Catches the wrong message |
| Redactor | Code | — | Before any model call | Raw text | Text without personal data | Privacy |

### Reader prompt contract
Lives in `eventmind/reading.py`. It describes the schema only, contains no example facts from any pack, and returns JSON only. Any language goes in; English and plain numbers come out.
