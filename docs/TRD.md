# TRD — Technical Requirements

## Stack
- **Python 3.10+, standard library only** for the core (urllib, json, http.server). No install step is needed for the test run.
- **Model:** any pretrained model behind an OpenAI-compatible `/chat/completions` endpoint (Groq, Ollama local, Gemini, OpenRouter). Configured in `.env`.
- **UI:** vanilla HTML/CSS/JS with no build step, served by `serve.py` or opened standalone with a `state.json` file.
- **Optional:** `python-docx` and `pypdf` for .docx and .pdf input.

## Interfaces
| Interface | Contract |
|---|---|
| CLI | `python eventmind.py <file>`; `python eventmind.py reset` |
| Model | POST `{BASE_URL}/chat/completions`, temperature 0, `response_format: json_object` (toggle with `EVENTMIND_JSON_MODE`) |
| HTTP | `GET /state.json`; `POST /api/message {text}` saves to `inbox/` and runs the same CLI command |
| Outputs | `out/state.json` (everything), `out/trace.txt`, `out/plan.md` |

## Fact schema (model output)
```json
{"messages":[{"sender":"","role":"approver|venue|caterer|judging|finance|vendor|participant|other",
  "date":"YYYY-MM-DD|null","quote":"first 6 words verbatim","gist":"<=12 English words",
  "flags":["legal|disputed|privacy"],"facts":[{"key":"type:thing","type":"...", "...":"..."}]}]}
```
Fact types: `event`, `venue`, `food`, `judges`, `expense`, `optional`, `break`, `quantity`, `rule`. Full field list in `eventmind/reading.py`.

## Algorithms
- **Resolution:** group facts by key and sort by (date or newest, run, message number). The latest fact wins, unless its sender ranks lower than the current fact's sender, in which case it is rejected.
- **Authority ranks:** approver 3; venue/caterer/judging/finance/vendor 2; participant/other 1. Event fundamentals require rank 3.
- **Planning:** exhaustive search over venue × food options (tiny). Sort by (failed checks, standard-tier preference, total cost).
- **Rejection:** while checks fail, drop the newest rank < 3 fact whose removal makes all checks pass. Up to 5 iterations.
- **Unknown metrics:** one area-tagged model call returns `{ok, why, allowed}`, cached by SHA-256 of its input.
- **Incremental input:** SHA-256 of the file means 0 calls if already seen. If the file starts with previously processed text, only the remainder is new.

## Limits & performance
| Limit | Implementation |
|---|---|
| Full run ≤ 2 min | 1 call, 90 s timeout |
| Update ≤ 5 calls, ≤ 1 min | Hard cap of 5 in `llm.py`, 40 s per call |
| Tokens | Whole pack in one call; update prompt = new text + list of keys only |

## Testing
- `python -m unittest -v`: engine tests with invented data (figures, stale, optional, wrong quantity, true change, authority, new rule kind, price rise switching option, legal flag).
- End-to-end runs against a fake OpenAI-compatible server (kept outside the repo).
- A real model run on the sample pack before code freeze.
