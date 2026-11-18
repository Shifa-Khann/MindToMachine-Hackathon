# Context — read this first (humans and AI assistants)

## Event
- **Mind to Machine Hackathon**, Islamabad, Wed 18 Nov 2026
- 10:00 build starts · **13:25 code freeze** (push, submit repo link + commit hash) · 13:30 test run (whole room) · 14:30–16:30 judge visits
- Team of 3; a judge draws one member at random to explain the system

## Task summary
Plan a 4-hour hackathon (venue, schedule, food, judging, budget) from a pack of about 10 messages in English and Roman Urdu. Some messages are irrelevant, some are stale, and one later message is plausible but wrong. The unseen judging pack uses different numbers, wording, senders and constraint types.

## Hard constraints from the brief
- Read messages from a file exactly as given; **never type pack facts or messages into code** (disqualification)
- One command for all messages, with no flags or hints
- Print a trace: numbered calls, model, area tag (reading/venue/schedule/food/judging/budget), input, output, reported tokens, total
- Update after a new message: at most 5 model calls, 1 minute; full run 2 minutes
- No code changes after 13:25; the trace must not misreport tokens, models or areas

## Scoring
Output 30 · wrong message 20 · understanding 20 · change 10 · UI 10 · prediction 5 · tokens 5 · bonus 10 (small models only)

## Current state
See `PROGRESS.md`. The engine, UI, trace, tests and docs are done; a real-model run is still pending.

## Where things live
See the repo map in `README.md` and the design in `ARCHITECTURE.md`.
