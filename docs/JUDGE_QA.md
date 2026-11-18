# Judge Q&A prep — every member must be able to answer these

**What does the system do, in one sentence?**
It reads messy messages in any language with one model call and turns them into structured facts. Plain code then plans and checks the event.

**Why only one model call?**
Language is the only thing a model is needed for. Arithmetic, choosing the cheapest valid hall and checking rules are exact in code and cost zero tokens.

**Which areas make model calls in an update?**
Normally only `reading` (1 call). An area-tagged call (venue/food/…) happens only if the new message contains a rule kind the code can't evaluate.

**How do you know a message is out of date?**
Each fact has a key, like `food:standard`. For the same key, the newest dated message wins and the older one is marked stale, with "superseded by #n".

**How do you catch the wrong message?**
After applying all facts, the validator runs. If a check fails, we remove the newest lower-authority fact. If the plan then passes, that fact is rejected, and the trace shows the failed rule with its expected and actual values.

**What if a true change makes the plan expensive?**
The planner tries every venue × food combination. It switches to another valid option before anything gets rejected.

**Who can change the budget?**
Only the sender the model labels `approver`. Anyone else changing an event fundamental is rejected.

**How do you handle constraints you've never seen?**
The model extracts them as a generic `rule` (area, metric, op, value). Known metrics are checked in code. Unknown ones get one small area-tagged model check, cached.

**How do you handle any language?**
The prompt says messages can be in any language or script. The model must output English and plain numbers (lakh, words and local digits are converted). Code never reads raw text.

**Privacy?**
Phone numbers, emails and ID/card numbers are removed by code before anything is sent to the model. Legal or disputed messages are never auto-applied; they go to "needs review".

**Are token counts real?**
Yes. They're copied from the provider's `usage` field. If the provider doesn't report them, we show `None`, never a guess.

**Why 17 judges, not 20?**
Max 3 teams per judge for 50 teams gives ceil(50/3) = 17. The extra confirmed judges are noted as standby for a human decision.

**What would break without X?** → see docs/ARCHITECTURE.md table.
