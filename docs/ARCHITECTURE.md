# Architecture & design decisions

## Principle
**Model for language, code for arithmetic.** Fewer tokens score higher, and code is never wrong at sums.

## Pipeline
1. **ingest** (code): read the file as given. Remove personal identifiers (phones, emails, IDs, card numbers) by pattern. Digits look the same in every language, so this is language-independent.
2. **reading** (1 model call, tag `reading`): the whole pack goes in once. Out comes a fixed English JSON schema:
   messages → sender, role, date, verbatim quote, English gist, flags, facts.
   Fact types: event, venue, food, judges, expense, optional, break, quantity, rule.
   On updates, the model also gets the list of existing keys, so a correction reuses the same key ("expense:printing").
3. **resolve** (code):
   - legal/disputed flag → `needs_review`, not applied
   - event fundamentals (budget, students, duration…) can only be set by the `approver` role
   - same key → newest date wins (undated new messages count as newest); older one becomes `stale`
   - a lower-authority sender cannot override a higher-authority one
   - `optional` requests are never auto-added
4. **plan** (code): try every venue × food option. For each, compute headcount, judges, schedule and budget, then run the validator. Pick: fewest failed checks → standard food tier → lowest total cost.
5. **validate** (code): all areas planned, venue fits, food for all, within budget, enough judges, judge load, schedule length, required breaks, plus every extracted `rule`.
6. **reject loop** (code): if checks still fail, try removing the newest lower-authority fact. If that makes every check pass, reject it and print the failing rule as the reason.
7. **unknown rule kinds**: if a rule uses a metric the code doesn't know, one small model call tagged with that rule's **area** answers ok/not ok (and, for venue/food, which options satisfy it). The result is cached, so later updates don't repeat it.

## Formulas (all from extracted facts)
- teams = ceil(students / team_size) (or teams given directly)
- judges needed = ceil(teams / max teams per judge); used = needed if enough confirmed
- headcount = students + staff + judges used + other people
- judging block = teams per judge × minutes per team (judges work in parallel)
- schedule = opening 15 + build 1 + lunch 30 + required breaks + build 2 + judging + closing 15 = event length
- total = committed expenses + venue + meals × price (+ delivery) + judges × honorarium

## What breaks without each part
| Part | Without it |
|---|---|
| Redaction | Personal data sent to a third-party model |
| Reading call | No way to understand any language or new phrasing |
| Fixed schema | Code can't plan; every new pack would need new code |
| Existing keys in update prompt | Corrections create duplicate facts instead of replacing |
| Newest-wins | Old prices (stale quotes) used |
| Authority ranks | A vendor could change the budget |
| Option search + validator | Plan could exceed budget or not fit people |
| Reject loop | A wrong message silently breaks the plan |
| Trace | Disqualification; judges can't verify tokens/areas |
| State + new-text detection | Every update would re-read everything (more tokens, more calls) |
