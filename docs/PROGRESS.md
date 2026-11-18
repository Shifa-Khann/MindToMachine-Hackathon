# Progress log

Update this file and **push after every finished functionality** (see RULES.md).

## Status board
| # | Functionality | Status | Commit |
|---|---|---|---|
| 1 | Repo scaffold (.gitignore, .env.example, requirements, README) | ✅ done | initial |
| 2 | Standalone UI (plan, checks, messages, rejected, trace, runs) | ✅ done | initial |
| 3 | Ingest any file + privacy redaction | ✅ done | initial |
| 4 | Reading call (any language → fixed JSON schema) | ✅ done (fake-model tested) | initial |
| 5 | Engine: resolve, plan, validate, reject loop | ✅ done, 8 unit tests | initial |
| 6 | Trace + token totals + plan.md/trace.txt/state.json | ✅ done | initial |
| 7 | Incremental updates (new-text detection, 0 calls on repeat) | ✅ done | initial |
| 8 | serve.py live UI + add-message | ✅ done | initial |
| 9 | Project docs (idea, PRD, TRD, context, rules, security, agents) | ✅ done | docs commit |
| 9b | UI redesign: soft-card dashboard, light + dark theme, stepper, hatched bar chart, donuts, gauge, mobile | ✅ done | ui commit |
| 9c | Multi-language: `lang` per message (reading → runner), language badge + Languages card, UI switch English/اردو (RTL, `ui/i18n.js`), invented Urdu-script test | ✅ done | |
| 9d | Offline Excel export (`ui/xlsx.js`, 10 sheets), "Open saved plan", display-time title case, `scripts/package.*`, ship.sh tracked-file check | ✅ done | |
| 9e | Attach email/document to "Add message": .eml (stdlib reader), .docx, .pdf, .txt; served via /api/message, same command | ✅ done | |
| 9f | Result panel after each message + follow-up questions (model `ask` + code-detected missing numbers), answer box sends a reply message | ✅ done | |
| 9g | Dynamic page: starts empty, "New event" button (backup kept), sections/charts appear only when input has that data | ✅ done | |
| 9h | Event briefing (code-written summary, copy/download), schedule download (Excel/CSV), JSON-mode retry, no doubled "break" name, no empty judging block, stricter message-splitting prompt | ✅ done | |
| 9i | Briefing changes with every message: per-run plan diff (`eventmind/diff.py`) + "Latest update" section + live message counts | ✅ done | |
| 10 | Real model run on sample pack (< 2 min, JSON parses) | ⏳ todo | |
| 11 | Multilingual test with `data/invented_multilingual_pack.txt` | ⏳ todo | |
| 12 | Push to GitHub, add organizers if private | ⏳ todo (GitHub not linked yet) | |
| 13 | Rehearse test-day runbook + prediction slip | ⏳ todo | |
| 14 | Final push before 13:25, record commit hash | ⏳ todo | |

## Verified results (fake model replaying sample extraction)
- Full run: 1 call · 177 people · cheapest valid hall · total within budget · 8/8 checks
- Printing change: 1 call · only budget changed
- "100 boxes" message: rejected (food for every person: expected ≥ 177, would be 100) · plan valid
- Same file again: 0 calls

## Open questions (ask at help desk)
- Should all confirmed judges get the honorarium, or only those needed?
- Should optional requests (such as a DJ) be included if they fit the budget?

## Log
- 11:00 — scaffold, UI, engine, tests, docs
- 11:25 — UI redesigned to reference style, light/dark themes
- 12:10 — multi-language (lang tag, badge, Languages card, Urdu UI), offline .xlsx export, packaging scripts
