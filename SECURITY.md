# Security & privacy

## Secrets
- API keys live only in `.env` (gitignored). `.env.example` has placeholders only.
- Never paste keys into code, issues, the UI or the trace. The trace records prompts, never headers.
- If a key is pushed by mistake: revoke it at the provider immediately, then remove it from history.

## Personal data
- `eventmind/ingest.py` removes emails, phone numbers, national ID numbers and card/account numbers **in code before** any text is sent to a model. Each removal is logged in the trace and the Privacy panel.
- The model flags messages with other personal data (health, home address) as `privacy`; these are shown in the Privacy panel.
- `out/` and `inbox/` (which contain message text) are gitignored.

## Legal & disputed content
- Messages the model flags as `legal` (contracts, legal threats) or `disputed` (contested or unverified facts) are **never applied** to the plan. They are marked `needs_review` for a human.

## Untrusted input
- Message text is data, not instructions. The prompt asks only for extraction into a fixed schema, and code ignores any field outside the schema.
- Model output is parsed as JSON and validated by type. Numbers are coerced and bad values ignored. A message cannot make code run anything.
- A non-approver cannot change the event's fundamentals (budget, numbers, duration), whatever the message says.
- `serve.py` binds a local port for demo use only. It writes new messages to `inbox/` and runs the fixed CLI command with an argument list (no shell). Do not expose it to the internet.

## Reporting
Tell the team lead in person during the hackathon.
