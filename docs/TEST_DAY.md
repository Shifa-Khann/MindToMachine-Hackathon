# Test-day runbook (1:30 test run)

## Before 1:25 code freeze
- [ ] `python -m unittest -v` passes
- [ ] Real model tested on the sample pack: full run < 2 min, update < 1 min
- [ ] `git status` clean (out/, inbox/ and .env are gitignored)
- [ ] Push, then submit the repo link + `git log -1 --format=%H`

## At the test run
1. Volunteer checks `git status` and `git log -1`.
2. `python eventmind.py reset`
3. Save the unseen pack as `pack.txt` exactly as given → `python eventmind.py pack.txt`
4. Start `python serve.py` and open http://localhost:8000 for the UI.
5. For each new message: save it as `m1.txt`, `m2.txt`, `m3.txt` → `python eventmind.py m1.txt`
   (or paste it into the UI "Add a new message" box — it runs the same command).

## Prediction slip (write BEFORE running the chosen message)
Rule: **every update makes exactly 1 model call, tagged `reading`.**
Add an area tag only if the message states a *new kind of rule* the code can't evaluate (for example "lunch must be halal-certified" → a `food` call).

Slip template:
> Message: "…"
> Model calls: reading (1 call). Plan areas that will change: ______

Plan areas that change by message kind:
| Message is about | Plan areas that change |
|---|---|
| committed expense / honorarium | budget (+ judging if honorarium) |
| food price / food option | food, budget |
| venue price / capacity | venue, budget |
| judges count / time per team / team limit | judging, schedule, budget |
| break / start time / duration | schedule |
| student / staff numbers | venue, food, judging, budget |
| wrong / rejected message | none |

## Saving for the upload form
`out/plan.md` (plan) and `out/trace.txt` (full trace). `out/state.json` holds everything.
