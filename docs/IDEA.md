# Idea — EventMind

## Problem
Event planning information arrives as scattered emails, WhatsApp texts and notices, in several languages. Some messages are out of date, some are irrelevant and some are simply wrong. A planner has to read them all, keep the latest facts, ignore noise, catch bad information, and still produce a plan that fits the budget, the venue and the rules.

## Challenge (Mind to Machine Hackathon, 18 Nov 2026)
Build an agent system that reads a pack of about 10 messages and plans a 4-hour hackathon. The plan covers venue, schedule, food, judging and budget. At judging, the system gets an unseen pack plus three new messages; one of them is plausible but wrong.

## Our idea in one line
**A model reads; code decides.** A single model call turns any message, in any language, into structured facts. Deterministic code then resolves conflicts, plans, validates and rejects anything that would break the plan, explaining why in a trace.

## Why this wins
| Scoring item | Our angle |
|---|---|
| Output (30) | The planner searches every venue × food option and checks each against the validator |
| Catching the wrong message (20) | A rejection loop: any fact that breaks a check is removed, with the failing rule printed |
| Understanding (20) | A small system: 7 modules, each with one job (see ARCHITECTURE) |
| Handling change (10) | Updates read only the new text in 1 call; the plan is recomputed in code |
| UI (10) | A dashboard with plan, checks, messages, rejected list, trace and run history |
| Prediction (5) | The rule is simple: 1 `reading` call per update |
| Token use (5) + bonus (10) | 1 call for the full run; works with small or local models |

## Wow factors
- Any language and script, including mixed and informal texts
- Privacy redaction in code before any text reaches the model
- Legal or disputed messages go to human review and are never applied automatically
- Explainable rejections (rule, expected value, actual value)
- Message statuses: used, stale, rejected, irrelevant, optional, needs review
- Change view: which plan areas changed, and which made model calls
- Optional requests (such as a DJ) shown with whether they fit the remaining budget
