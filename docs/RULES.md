# Team rules

## Competition rules (breaking these = disqualification)
1. **Never type facts or messages from any pack into code**, prompts, tests or defaults. Tests use invented data only.
2. **No code changes after 13:25.** Final push before then; submit `git log -1 --format=%H`.
3. **The trace must be honest:** tokens copied from the provider's `usage`, never estimated; real model name; correct area tag.
4. Same command for every message. No flags, hints or manual edits of the pack.

## Git workflow
5. **Commit and push to GitHub as soon as each functionality is done** and its tests pass. Don't batch, and don't leave the final push to the last minute.
6. Commit message: `<area>: <what changed>`, e.g. `engine: reject facts from lower-authority senders`.
7. Update `docs/PROGRESS.md` in the same commit.
8. Never commit `.env`, `out/`, `inbox/` or API keys. `git status` must be clean at the test run.
9. Pull before you start a new piece of work; one person owns each file at a time.

## Code rules
10. Model for language, code for arithmetic. Any new model call needs a written reason in ARCHITECTURE.md.
11. Every part must be explainable by every member ("what is it for, what breaks without it").
12. Keep the core dependency-free (standard library). UI has no build step.
13. Run `python -m unittest -v` before every push.

## Safety rules
14. Personal data is redacted before any model call.
15. Legal or disputed content is never applied automatically.
16. Never invent policies. Ambiguous decisions go to "Decisions for a human".
