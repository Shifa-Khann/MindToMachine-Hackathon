# Test results: the 10-message pack

Run on 2026-11-18 · reading model `openai/gpt-oss-120b` · 1 model call · 6,468 tokens (1,474 in, 4,994 out) · 12,184 ms for the reading call · run kind: full

**Summary: 9 of 10 messages handled correctly, 1 wrong.** The plan is valid (all checks pass) but it does not enforce the wheelchair requirement from message 3, so the venue is not the right one.

## Per-message results

| # | Sender | Role read | Language | Status | Verdict |
|---|---|---|---|---|---|
| 1 | Registrar's office | approver | en | used | **PASS** |
| 2 | Faisal Convention Centre | venue | en | used | **PASS** |
| 3 | Student disability office | participant | en | rejected | **FAIL** |
| 4 | Caterer | caterer | en | stale | **PASS** |
| 5 | Caterer | caterer | mixed | used | **PASS** |
| 6 | Judging lead | judging | en | used | **PASS** |
| 7 | Finance | finance | en | used | **PASS** |
| 8 | Student society | participant | en | optional | **PASS** |
| 9 | Faisal Convention Centre | venue | en | used | **PASS** |
| 10 | Library | other | en | irrelevant | **PASS** |

### Test 1: Registrar's office (2026-11-06) - PASS

- **Message:** Approval: 4-hour event, 120 students, teams of 4, budget Rs 400,000, 8 staff, 20-minute prayer break
- **Expected:** Event facts set; prayer break kept in the schedule
- **Actual:** status `used`, language `en`. Students 120, team size 4 (so 30 teams), 240 minutes, budget 400,000, staff 8, prayer break 20 min all applied. The model also asked for the event date and start time, so the schedule uses an assumed 10:00 start.
- **Facts read:**
  - `used` {"type": "event", "field": "duration_min", "value": 240}
  - `used` {"type": "event", "field": "students", "value": 120}
  - `used` {"type": "event", "field": "team_size", "value": 4}
  - `used` {"type": "event", "field": "budget", "value": 400000}
  - `used` {"type": "event", "field": "staff", "value": 8}
  - `used` {"type": "break", "name": "prayer", "minutes": 20}
- **Follow-up questions asked:** What is the event date?; What start time is planned?

### Test 2: Faisal Convention Centre (2026-11-02) - PASS

- **Message:** Four venues with seats and prices; only Halls 2 and 3 are ground floor with ramp
- **Expected:** Four venue options with their features
- **Actual:** status `used`, language `en`. Seminar Room, Hall 1, Hall 2, Hall 3 all read with seats and prices. Halls 2 and 3 carry the ground-floor and ramp features. Hall 3 later became superseded by message 9.
- **Facts read:**
  - `used` {"type": "venue", "name": "Seminar Room", "capacity": 100, "price": 35000, "features": []}
  - `used` {"type": "venue", "name": "Hall 1", "capacity": 160, "price": 90000, "features": []}
  - `used` {"type": "venue", "name": "Hall 2", "capacity": 180, "price": 110000, "features": ["ground floor", "ramp"]}
  - `stale` {"type": "venue", "name": "Hall 3", "capacity": 250, "price": 160000, "features": ["ground floor", "ramp"]}

### Test 3: Student disability office (2026-11-10) - FAIL

- **Message:** Two wheelchair users; venue must have step-free access throughout
- **Expected:** Venue must be step-free, so only a ramp/ground-floor hall (Hall 2) may be chosen
- **Actual:** status `rejected`, language `en`. The sender was read as a participant, so the step-free rule was treated as a request (optional) instead of a requirement. Hall 1, which has no ramp, was chosen. The side fact 'two other people' was rejected (only the approver sets event numbers).
- **Facts read:**
  - `rejected` {"type": "event", "field": "other_people", "value": 2}
  - `optional` {"type": "rule", "area": "venue", "metric": "venue_features", "op": "requires", "value": "step-free", "text": "venue must have step-free access throughout"}

### Test 4: Caterer (2026-10-25) - PASS

- **Message:** Biryani box Rs 700 per head (25 Oct)
- **Expected:** Older price, replaced by the newer rate in message 5
- **Actual:** status `stale`, language `en`. Marked stale: superseded by message 5.
- **Facts read:**
  - `stale` {"type": "food", "name": "biryani box", "tier": "standard", "price_per_head": 700}
- **Follow-up questions asked:** What is the delivery fee?

### Test 5: Caterer (2026-11-11) - PASS

- **Message:** Roman Urdu rates update: biryani Rs 850, sandwich Rs 600, 10% service charge on the total
- **Expected:** Newest prices win; 10% added to the food total; language tagged as mixed
- **Actual:** status `used`, language `mixed`. Both prices read, language tagged mixed, 10% service charge applied. Cheapest valid food is sandwich box: 136 x Rs 600 x 1.10 = Rs 89,760.
- **Facts read:**
  - `used` {"type": "food", "name": "biryani box", "tier": "standard", "price_per_head": 850, "service_charge_pct": 10}
  - `used` {"type": "food", "name": "sandwich box", "tier": "standard", "price_per_head": 600, "service_charge_pct": 10}

### Test 6: Judging lead (2026-11-09) - PASS

- **Message:** 15 judges confirmed, Rs 4,000 each, 20 minutes per team, at most four teams per judge
- **Expected:** 30 teams / 4 per judge = 8 judges needed; honorarium for those 8
- **Actual:** status `used`, language `en`. 8 judges used (Rs 32,000), 7 on standby, 20 minutes per team. The standby note asks organizers to confirm.
- **Facts read:**
  - `used` {"type": "judges", "field": "confirmed", "value": 15}
  - `used` {"type": "judges", "field": "fee_each", "value": 4000}
  - `used` {"type": "judges", "field": "min_per_team", "value": 20}
  - `used` {"type": "judges", "field": "max_teams", "value": 4}

### Test 7: Finance (2026-11-08) - PASS

- **Message:** Already paid: trophies Rs 60,000 and banners Rs 15,000
- **Expected:** Two committed expenses in the budget
- **Actual:** status `used`, language `en`. Both expenses added to the budget lines.
- **Facts read:**
  - `used` {"type": "expense", "item": "trophies", "amount": 60000}
  - `used` {"type": "expense", "item": "banners", "amount": 15000}

### Test 8: Student society (2026-11-12) - PASS

- **Message:** Photo booth request, quote Rs 30,000
- **Expected:** Optional request: shown with affordability, not added to the total
- **Actual:** status `optional`, language `en`. Marked optional; the budget shows it fits the remaining money. Not in the total.
- **Facts read:**
  - `optional` {"type": "optional", "item": "photo booth", "amount": 30000}

### Test 9: Faisal Convention Centre (2026-11-13) - PASS

- **Message:** Hall 3 under maintenance on the event date, cannot be booked
- **Expected:** Hall 3 removed from the options
- **Actual:** status `used`, language `en`. Hall 3 marked unavailable and dropped from the venue options.
- **Facts read:**
  - `used` {"type": "venue", "name": "Hall 3", "available": false}

### Test 10: Library (2026-11-14) - PASS

- **Message:** Library closes at 3 pm on Friday for stock-taking
- **Expected:** Irrelevant to the plan
- **Actual:** status `irrelevant`, language `en`. Marked irrelevant; nothing changed.

## Resulting plan

| Part | Result |
|---|---|
| People on site | 136 (120 students, 8 staff, 8 judges) |
| Venue | Hall 1 - 160 seats, Rs 90,000 |
| Food | 136 x Sandwich Box at Rs 600 + 10% service = Rs 89,760 |
| Judging | 8 judges for 30 teams, 20 min per team, honorarium Rs 32,000 |
| Schedule | 10:00-14:00, 240 min, 7 blocks |
| Budget | Rs 286,760 of Rs 400,000; Rs 113,240 left |

Schedule:

- 10:00-10:15  Opening & briefing (15 min)
- 10:15-10:55  Build session 1 (40 min)
- 10:55-11:25  Lunch (30 min)
- 11:25-11:45  Prayer break (20 min)
- 11:45-12:25  Build session 2 (40 min)
- 12:25-13:45  Judging at tables (80 min)
- 13:45-14:00  Closing & prizes (15 min)

Budget lines:

- trophies: Rs 60,000
- banners: Rs 15,000
- Venue: Hall 1: Rs 90,000
- Food: 136 x sandwich box: Rs 89,760
- Judges: 8 x honorarium: Rs 32,000
- optional, not counted: photo booth Rs 30,000 (fits)

## Validation checks

- PASS: All five areas planned (expected venue, food, judging, schedule, budget, actual venue, food, judging, schedule, budget)
- PASS: Venue fits everyone (expected >= 136 seats, actual 160)
- PASS: Food for every person (expected >= 136 meals, actual 136)
- PASS: Within budget (expected <= 400,000, actual 286,760)
- PASS: Enough judges (expected >= 8, actual 15)
- PASS: No judge over team limit (expected <= 4 teams, actual 4)
- PASS: Schedule fills event length exactly (expected 240 min, build >= 30, actual 240 min, build 80)
- PASS: Prayer break included (expected 20 min, actual 20)

## Known problems found by this run

1. **Wheelchair requirement not enforced (test 3).** The disability office was labelled `participant`, so its venue rule became an optional request. Hall 1 (no ramp) is chosen; Hall 2 (ground floor, ramp, Rs 110,000) should be. Checks still show 8/8 because the rule was not applied.
2. **Model matters.** With `openai/gpt-oss-20b` the same pack returned only 2 of 10 messages in one try and was rate limited (8,000 tokens per minute) in others. `openai/gpt-oss-120b` read all 10 each time it was run.
3. **Food choice.** The planner picks the cheapest valid option (sandwich box at Rs 600 + 10%), not the biryani box. Organizers may prefer otherwise.
4. **Open questions** (also noted in the plan): confirm whether all 15 judges should be paid or only the 8 needed; no event date or start time was given, so 10:00 is assumed.

Source: `out/state.json` of this run. Every number above is copied from it; the Expected and Verdict columns are written by reading the messages.
