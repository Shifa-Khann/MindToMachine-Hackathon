# PRD — Product Requirements

## Users
- **Organizer**: wants a valid plan and to know which messages were ignored, and why.
- **Hackathon volunteer/judge**: runs the system, checks the trace, plan and UI.
- **Team member**: must be able to explain every part.

## Goals
1. Produce a plan that passes six checks: correct figures, within budget, venue fits, schedule valid, enough judges, all areas covered.
2. Keep the plan valid when a wrong message arrives, and explain the rejection.
3. Update incrementally after new messages, with model calls only where needed.
4. Use the fewest tokens possible.

## Non-goals
- Training models or building datasets
- Booking or paying vendors
- Deciding legal or disputed matters (these are flagged for a human)

## Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| F1 | Read every message from a file exactly as given (txt; docx/pdf optional) | P0 |
| F2 | One command for the full pack and for each new message, with no flags or hints | P0 |
| F3 | Understand any language or script, including mixed and informal | P0 |
| F4 | Extract facts into a fixed schema; no pack facts in code | P0 |
| F5 | The newest message on the same item wins; older ones marked stale | P0 |
| F6 | Plan venue, schedule, food, judging and budget | P0 |
| F7 | Validate the plan against built-in and extracted rules | P0 |
| F8 | Reject facts that break the plan or come from senders without authority, with the reason in the trace | P0 |
| F9 | Trace each model call: number, model, area tag, input, output, reported tokens; total at the end | P0 |
| F10 | Persist state; updates send only new text to the model; at most 5 calls and 1 minute | P0 |
| F11 | UI: plan, checks, messages with status, rejected tab, trace, run history, add-message box | P1 |
| F12 | Remove personal data before model calls; flag legal/disputed messages for review | P1 |
| F13 | Show optional requests with affordability; never add them automatically | P1 |
| F14 | Generic rules for constraint types never seen before (code check, else one area model check) | P1 |

## Success metrics
- Sample pack: 1 call, all checks pass, under 2 minutes
- Practice change: 1 call, only budget changes
- Practice wrong message: rejected with the failing rule, plan still valid
- Every team member can answer docs/JUDGE_QA.md
