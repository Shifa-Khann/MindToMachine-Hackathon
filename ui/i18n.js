// EventMind UI labels — every interface string lives here (English + Urdu).
// Message text, plan facts and trace content are data and are never translated.
"use strict";

const I18N = {
  en: {
    "lang.name": "English",
    "five.empty": "Not planned yet", "five.issues": "{n} issue(s)", "five.ok": "OK", "five.blocks": "{n} blocks",
    "five.hint.budget": "Needs a budget amount in a message.", "five.hint.venue": "Needs venue options with seats and price.", "five.hint.schedule": "Needs the event length.",
    "five.hint.food": "Needs a food option with a price per head.", "five.hint.judging": "Needs judges, teams and per-judge limits.",
    "five.perteam": "{m} min per team · up to {x} teams each", "five.honorarium": "Honorarium {v}", "five.standby": "{n} more on standby",
    "tr.title": "Trace: how the plan was made", "tr.note": "Step order, agents, models, tokens and milliseconds are real. Only the animation pace is for viewing.",
    "tr.replay": "Replay", "tr.all": "Show all", "tr.none": "Process a message to record a trace.", "tr.steps": "steps", "tr.calls": "Every model call",
    "tr.code": "CODE", "tr.model": "MODEL", "tr.io": "FILE", "tr.callview": "View input and output of this call",
    "tr.s.input": "Message in", "tr.s.redact": "Privacy", "tr.s.read": "Reading", "tr.s.tag": "Tagging", "tr.s.rule": "Rule check", "tr.s.resolve": "Resolve",
    "tr.s.plan": "Plan", "tr.s.validate": "Validate", "tr.s.reject": "Reject", "tr.s.diff": "Changes", "tr.s.save": "Save",
    "more.title": "More details: summary, charts, checks, languages, tokens", "compare": "Compare options",
    "k.people": "People on site", "k.teams": "Teams", "k.meals": "Meals", "k.status": "Plan status",
    "strip.title": "Just processed (run {n})", "strip.read": "{n} messages read", "strip.created": "Plan created from {n} messages",
    "br.h.latest": "Latest update (run {n})", "br.lu.msg": "Message #{n} from {s}: {g} — {st}.", "br.lu.none": "No change to the plan.", "br.lu.more": "…and {n} more changes.",
    "br.ov.msgs": "Built from {n} messages: {used} used, {stale} superseded, {rej} rejected, {opt} optional.",
    "f.people": "People on site", "f.venue": "Venue", "f.venue_seats": "Venue seats", "f.venue_price": "Venue price", "f.food": "Food option", "f.food_price": "Food price per head", "f.meals": "Meals", "f.food_cost": "Food cost",
    "f.teams": "Teams", "f.judges": "Judges used", "f.judges_cost": "Judging cost", "f.start": "Start time", "f.end": "End time", "f.duration": "Duration", "f.cap": "Budget cap", "f.total": "Total cost", "f.remaining": "Remaining budget", "f.line": "Budget line: {item}",
    "br.title": "Event briefing", "br.sub": "A plain-language summary of the plan. Written by code from the validated plan — never guessed.", "br.copy": "Copy", "br.copied": "Copied", "br.download": "Download summary",
    "br.h.overview": "Overview", "br.h.venue": "Venue", "br.h.food": "Food", "br.h.judging": "Judging", "br.h.schedule": "Schedule", "br.h.budget": "Budget", "br.h.attention": "Needs attention",
    "br.ov.people": "{n} people will be on site.", "br.ov.teams": "{n} teams take part.", "br.ov.time": "The event runs from {start} to {end} ({d} minutes).",
    "br.ov.valid": "All {n} checks pass, so the plan is valid.", "br.ov.invalid": "{n} of {m} checks fail — see Needs attention.",
    "br.venue": "{name} is chosen: {cap} seats for {people} people at {price}.", "br.why": "Why: {why}.",
    "br.food": "{boxes} meals of {name} at {each} each, {cost} in total.",
    "br.judging": "{used} judges will see {teams} teams (up to {max} teams each). Honorarium cost: {cost}.", "br.judging.min": "Each team gets {m} minutes with a judge.", "br.judging.standby": "{n} more confirmed judges stay on standby.",
    "br.sch.span": "The day starts at {start} and ends at {end}:", "br.budget": "Total cost is {total} against a cap of {cap}; {left} is left.", "br.budget.nocap": "Total cost is {total}. No budget cap was given.",
    "br.opt": "Optional: {item} ({amt}) — {fit}.",
    "br.att.none": "Nothing needs attention.", "br.att.rej": "Message #{n} from {s} was not applied: {why}", "br.att.check": "Check failing: {c} (expected {e}, got {a}).", "br.att.q": "Open question for {s}: {q}",
    "sch.dl": "Download schedule", "sch.xlsx": "Excel", "sch.csv": "CSV",
    "nav.overview": "Plan", "nav.messages": "Messages", "nav.rejected": "Rejected", "nav.trace": "Trace", "nav.history": "Runs & changes",
    "title.overview": "Event plan dashboard", "title.messages": "Messages", "title.rejected": "Rejected messages",
    "title.trace": "Trace: agents and model calls", "title.history": "Runs & changes",
    "theme.toggle": "Toggle light / dark",
    "btn.open": "Open saved plan", "btn.excel": "Download Excel", "btn.message": "Message", "btn.process": "Process message", "btn.new": "New event", "new.confirm": "Start a new event? The current plan is cleared (a backup copy is kept in inbox/).", "pe.title": "Your plan is empty", "pe.text": "Add a message, email or document and the plan builds itself. Each section (venue, food, judging, schedule, budget, charts) appears only when your input contains that information.", "pe.add": "Add a message",
    "conn.none": "no data", "conn.live": "● live", "conn.file": "file",
    "empty.title": "No plan loaded yet", "empty.drop": "Drop state.json here",
    "empty.text": "Run python eventmind.py data/pack.txt and open python serve.py → http://localhost:8000, or drop an out/state.json file here.",
    "plan.title": "Event plan", "plan.valid": "Valid", "plan.issues": "{n} issue(s)", "plan.people": "{n} people", "plan.teams": "{n} teams",
    "plan.run": "run {n} ({kind})", "plan.calls": "{n} model call(s) last run", "plan.updated": "updated {t}",
    "step.read": "Read", "step.resolve": "Resolve", "step.plan": "Plan", "step.validate": "Validate", "step.trace": "Trace", "step.ready": "Ready",
    "card.spending": "Spending & time", "card.msgstatus": "Message status", "card.languages": "Languages", "card.headcount": "Headcount",
    "card.checksdonut": "Validation checks", "card.budgetused": "Budget used", "card.tokens": "Token use",
    "card.venue": "Venue", "card.food": "Food", "card.judging": "Judging", "card.schedule": "Schedule", "card.budgetlines": "Budget lines",
    "card.checks": "Checks", "card.decisions": "Decisions for a human", "card.privacy": "Privacy & safety",
    "legend.selected": "selected / largest", "legend.other": "other",
    "chart.budget": "Budget", "chart.schedule": "Schedule", "chart.venues": "Venues", "chart.food": "Food",
    "chart.total": "total {v}", "chart.chosen": "chosen: {v}", "chart.nodata": "No data for this view.", "chart.perhead": "per head",
    "unit.messages": "messages", "unit.passed": "passed", "unit.tokens": "tokens", "unit.calls": "calls", "unit.runs": "runs", "unit.min": "min",
    "tok.prompt": "prompt", "tok.completion": "completion", "tok.total": "Total tokens",
    "hc.students": "Students", "hc.staff": "Staff", "hc.judges": "Judges", "hc.other": "Other", "hc.total": "Total",
    "check.passed": "Passed", "check.failed": "Failed",
    "gauge.left": "{v} left", "gauge.of": "{a} of {b}",
    "status.used": "Used", "status.stale": "Stale", "status.rejected": "Rejected", "status.irrelevant": "Irrelevant",
    "status.optional": "Optional", "status.needs_review": "Needs review",
    "col.check": "Check", "col.area": "Area", "col.expected": "Expected", "col.actual": "Actual", "col.option": "Option",
    "col.seats": "Seats", "col.price": "Price", "col.perhead": "Per head",
    "t.total": "Total", "t.remaining": "Remaining of {v}", "t.optional": "optional", "t.fits": "fits remaining budget", "t.nofit": "does not fit",
    "venue.none": "No venue chosen", "venue.seats": "{c} seats for {h} people", "food.none": "No food option", "judging.none": "No judging data",
    "schedule.none": "No schedule", "budget.none": "No budget yet", "judging.assign": "Judge → team assignments",
    "none": "None", "privacy.none": "No personal data or legal/disputed content detected",
    "msg.add": "Add a new message", "msg.hint": "Runs the same command as every other message (needs python serve.py). Any language.",
    "msg.placeholder": "Paste a new message…", "msg.none": "No messages yet.", "msg.processing": "processing…", "res.title": "Result of your message", "res.meta": "run {n} · {c} model call(s) · {k} tokens", "res.changed": "Plan changed: {a}", "res.nochange": "No change to the plan.", "res.questions": "More details needed — please answer", "res.answer": "Your answer", "res.send": "Send answer", "res.noread": "The message could not be read. Nothing was changed.", "res.seen": "This text was already processed, so nothing new was added.", "res.notenough": "Not enough information to update the plan.", "res.g1": "Which part of the event is this about — venue, food, judging, schedule or budget?", "res.g2": "What exact number should we use (price in Rs, headcount, time or duration)?", "res.g3": "Does this change something already planned, or is it a new request?", "res.ask": "Needs more info", "msg.attach": "Attach", "msg.menuTitle": "Add document", "msg.menuEmail": "Add email", "msg.menuEmailDesc": "Paste or upload — no account needed", "em.from": "From", "em.date": "Date", "em.subject": "Subject", "em.body": "Email text", "em.add": "Add to message", "em.upload": "Upload .eml file", "em.cancel": "Cancel", "msg.menuDesc": "Upload from computer", "msg.attachhint": "Email (.eml), Word, PDF or text — up to 10 MB each", "msg.badfile": "Unsupported or too large: {n}",
    "msg.done": "done — plan updated", "msg.error": "error: {e}", "msg.nobackend": "backend not running — start: python serve.py",
    "msg.run": "run {n}", "msg.nodate": "no date", "msg.facts": "Extracted facts ({n})", "msg.summary": "EN",
    "lang.und": "Unknown", "lang.mixed": "Mixed", "lang.ur-Latn": "Roman Urdu", "lang.hi-Latn": "Roman Hindi",
    "lang.count": "{n} message(s)", "lang.none": "No language data yet — run a new message.",
    "rej.msg": "Message #{n}", "rej.fact": "Fact", "rej.why": "Why rejected", "rej.none": "No rejected messages. Any message that breaks a rule, or comes from a sender without authority, appears here with the reason.",
    "trace.calls": "Model calls", "trace.prompt": "Prompt tokens", "trace.completion": "Completion tokens", "trace.total": "Total tokens",
    "trace.allruns": "All runs", "trace.allareas": "All areas", "trace.run": "Run {n}", "trace.input": "Input", "trace.output": "Output",
    "trace.none": "No model calls.", "trace.decisions": "Decision log", "trace.nodecisions": "No decisions logged.",
    "hist.run": "Run {n} · {kind}", "hist.new": "New messages", "hist.calls": "Model calls", "hist.tokens": "Tokens", "hist.areas": "Areas that made model calls",
    "hist.changed": "Plan areas changed", "hist.skipped": "Skipped (no change, no calls)", "hist.none": "No runs yet.",
    "foot": "EventMind · a model reads, code decides ·", "page.title": "EventMind — Event plan dashboard",
    "xl.badfile": "Not a valid state.json: {e}", "xl.nodata": "Load a plan first."
  },
  ur: {
    "lang.name": "اردو",
    "five.empty": "ابھی منصوبہ نہیں بنا", "five.issues": "{n} مسئلہ", "five.ok": "ٹھیک", "five.blocks": "{n} حصے",
    "five.hint.budget": "کسی پیغام میں بجٹ کی رقم درکار ہے۔", "five.hint.venue": "نشستوں اور قیمت کے ساتھ مقام کے انتخاب درکار ہیں۔", "five.hint.schedule": "ایونٹ کا دورانیہ درکار ہے۔",
    "five.hint.food": "فی کس قیمت کے ساتھ کھانے کا انتخاب درکار ہے۔", "five.hint.judging": "جج، ٹیمیں اور فی جج حد درکار ہیں۔",
    "five.perteam": "فی ٹیم {m} منٹ · ہر جج زیادہ سے زیادہ {x} ٹیمیں", "five.honorarium": "اعزازیہ {v}", "five.standby": "مزید {n} متبادل",
    "tr.title": "ٹریس: پلان کیسے بنا", "tr.note": "مراحل کی ترتیب، ایجنٹ، ماڈل، ٹوکن اور ملی سیکنڈ اصلی ہیں۔ صرف اینیمیشن کی رفتار دیکھنے کے لیے ہے۔",
    "tr.replay": "دوبارہ چلائیں", "tr.all": "سب دکھائیں", "tr.none": "ٹریس ریکارڈ کرنے کے لیے کوئی پیغام پروسیس کریں۔", "tr.steps": "مراحل", "tr.calls": "ہر ماڈل کال",
    "tr.code": "کوڈ", "tr.model": "ماڈل", "tr.io": "فائل", "tr.callview": "اس کال کا ان پٹ اور آؤٹ پٹ دیکھیں",
    "tr.s.input": "پیغام موصول", "tr.s.redact": "رازداری", "tr.s.read": "پڑھنا", "tr.s.tag": "ٹیگنگ", "tr.s.rule": "اصول کی جانچ", "tr.s.resolve": "تصفیہ",
    "tr.s.plan": "منصوبہ", "tr.s.validate": "توثیق", "tr.s.reject": "مسترد", "tr.s.diff": "تبدیلیاں", "tr.s.save": "محفوظ",
    "more.title": "مزید تفصیل: خلاصہ، چارٹ، جانچ، زبانیں، ٹوکن", "compare": "انتخابات کا موازنہ",
    "k.people": "مقام پر افراد", "k.teams": "ٹیمیں", "k.meals": "کھانے", "k.status": "پلان کی حالت",
    "strip.title": "ابھی پروسیس ہوا (رن {n})", "strip.read": "{n} پیغامات پڑھے گئے", "strip.created": "{n} پیغامات سے پلان بنا",
    "br.h.latest": "تازہ ترین تبدیلی (رن {n})", "br.lu.msg": "{s} کا پیغام #{n}: {g} — {st}۔", "br.lu.none": "پلان میں کوئی تبدیلی نہیں۔", "br.lu.more": "…اور {n} مزید تبدیلیاں۔",
    "br.ov.msgs": "{n} پیغامات سے بنایا گیا: {used} استعمال شدہ، {stale} پرانے، {rej} مسترد، {opt} اختیاری۔",
    "f.people": "مقام پر افراد", "f.venue": "مقام", "f.venue_seats": "نشستیں", "f.venue_price": "مقام کی قیمت", "f.food": "کھانے کا انتخاب", "f.food_price": "فی کس کھانے کی قیمت", "f.meals": "کھانوں کی تعداد", "f.food_cost": "کھانے کی لاگت",
    "f.teams": "ٹیمیں", "f.judges": "جج", "f.judges_cost": "ججنگ کی لاگت", "f.start": "آغاز کا وقت", "f.end": "اختتام کا وقت", "f.duration": "دورانیہ", "f.cap": "بجٹ کی حد", "f.total": "کل لاگت", "f.remaining": "باقی بجٹ", "f.line": "بجٹ کی مد: {item}",
    "br.title": "ایونٹ کا خلاصہ", "br.sub": "پلان کا آسان زبان میں خلاصہ۔ توثیق شدہ پلان سے کوڈ نے لکھا ہے — اندازے سے نہیں۔", "br.copy": "نقل", "br.copied": "نقل ہو گیا", "br.download": "خلاصہ ڈاؤن لوڈ کریں",
    "br.h.overview": "جائزہ", "br.h.venue": "مقام", "br.h.food": "کھانا", "br.h.judging": "ججنگ", "br.h.schedule": "شیڈول", "br.h.budget": "بجٹ", "br.h.attention": "توجہ طلب",
    "br.ov.people": "مقام پر {n} افراد ہوں گے۔", "br.ov.teams": "{n} ٹیمیں شریک ہیں۔", "br.ov.time": "ایونٹ {start} سے {end} تک چلے گا ({d} منٹ)۔",
    "br.ov.valid": "تمام {n} جانچیں پاس ہیں، اس لیے پلان درست ہے۔", "br.ov.invalid": "{m} میں سے {n} جانچیں ناکام ہیں — توجہ طلب دیکھیں۔",
    "br.venue": "{name} منتخب ہوا: {people} افراد کے لیے {cap} نشستیں، {price} میں۔", "br.why": "وجہ: {why}۔",
    "br.food": "{name} کے {boxes} کھانے، فی کس {each}، کل {cost}۔",
    "br.judging": "{used} جج {teams} ٹیموں کو دیکھیں گے (ہر جج زیادہ سے زیادہ {max} ٹیمیں)۔ اعزازیے کی لاگت: {cost}۔", "br.judging.min": "ہر ٹیم کو جج کے ساتھ {m} منٹ ملتے ہیں۔", "br.judging.standby": "مزید {n} تصدیق شدہ جج متبادل رہیں گے۔",
    "br.sch.span": "دن {start} پر شروع اور {end} پر ختم ہوتا ہے:", "br.budget": "کل لاگت {total} ہے، حد {cap} ہے؛ {left} باقی ہے۔", "br.budget.nocap": "کل لاگت {total} ہے۔ بجٹ کی حد نہیں دی گئی۔",
    "br.opt": "اختیاری: {item} ({amt}) — {fit}۔",
    "br.att.none": "کسی چیز پر توجہ درکار نہیں۔", "br.att.rej": "{s} کا پیغام #{n} لاگو نہیں ہوا: {why}", "br.att.check": "جانچ ناکام: {c} (متوقع {e}، اصل {a})۔", "br.att.q": "{s} کے لیے کھلا سوال: {q}",
    "sch.dl": "شیڈول ڈاؤن لوڈ", "sch.xlsx": "ایکسل", "sch.csv": "CSV",
    "nav.overview": "منصوبہ", "nav.messages": "پیغامات", "nav.rejected": "مسترد", "nav.trace": "ٹریس", "nav.history": "رنز اور تبدیلیاں",
    "title.overview": "ایونٹ پلان ڈیش بورڈ", "title.messages": "پیغامات", "title.rejected": "مسترد پیغامات",
    "title.trace": "ماڈل کالز کا ٹریس", "title.history": "رنز اور تبدیلیاں",
    "theme.toggle": "روشن / تاریک تھیم",
    "btn.open": "محفوظ شدہ پلان کھولیں", "btn.excel": "ایکسل ڈاؤن لوڈ کریں", "btn.message": "پیغام", "btn.process": "پیغام پروسیس کریں", "btn.new": "نیا ایونٹ", "new.confirm": "نیا ایونٹ شروع کریں؟ موجودہ پلان صاف ہو جائے گا (بیک اپ نقل inbox/ میں رہے گی)۔", "pe.title": "آپ کا پلان خالی ہے", "pe.text": "کوئی پیغام، ای میل یا دستاویز شامل کریں تو پلان خود بنتا جائے گا۔ ہر حصہ (مقام، کھانا، ججنگ، شیڈول، بجٹ، چارٹ) تبھی نظر آئے گا جب آپ کے مواد میں اس کی معلومات ہوں۔", "pe.add": "پیغام شامل کریں",
    "conn.none": "کوئی ڈیٹا نہیں", "conn.live": "● لائیو", "conn.file": "فائل",
    "empty.title": "ابھی کوئی پلان لوڈ نہیں ہوا", "empty.drop": "state.json یہاں ڈراپ کریں",
    "empty.text": "python eventmind.py data/pack.txt چلائیں اور python serve.py کے ذریعے http://localhost:8000 کھولیں، یا out/state.json فائل یہاں ڈراپ کریں۔",
    "plan.title": "ایونٹ پلان", "plan.valid": "درست", "plan.issues": "{n} مسئلہ", "plan.people": "{n} افراد", "plan.teams": "{n} ٹیمیں",
    "plan.run": "رن {n} ({kind})", "plan.calls": "آخری رن میں {n} ماڈل کال", "plan.updated": "تازہ کاری: {t}",
    "step.read": "پڑھنا", "step.resolve": "تصفیہ", "step.plan": "منصوبہ", "step.validate": "توثیق", "step.trace": "ٹریس", "step.ready": "تیار",
    "card.spending": "اخراجات اور وقت", "card.msgstatus": "پیغامات کی حالت", "card.languages": "زبانیں", "card.headcount": "کل افراد",
    "card.checksdonut": "توثیقی جانچ", "card.budgetused": "استعمال شدہ بجٹ", "card.tokens": "ٹوکن کا استعمال",
    "card.venue": "مقام", "card.food": "کھانا", "card.judging": "ججنگ", "card.schedule": "شیڈول", "card.budgetlines": "بجٹ کی مدات",
    "card.checks": "جانچ", "card.decisions": "انسانی فیصلے کے لیے", "card.privacy": "رازداری اور تحفظ",
    "legend.selected": "منتخب / سب سے بڑا", "legend.other": "دیگر",
    "chart.budget": "بجٹ", "chart.schedule": "شیڈول", "chart.venues": "مقامات", "chart.food": "کھانا",
    "chart.total": "کل {v}", "chart.chosen": "منتخب: {v}", "chart.nodata": "اس منظر کے لیے کوئی ڈیٹا نہیں۔", "chart.perhead": "فی کس",
    "unit.messages": "پیغامات", "unit.passed": "کامیاب", "unit.tokens": "ٹوکن", "unit.calls": "کالز", "unit.runs": "رنز", "unit.min": "منٹ",
    "tok.prompt": "پرامپٹ", "tok.completion": "جواب", "tok.total": "کل ٹوکن",
    "hc.students": "طلبہ", "hc.staff": "عملہ", "hc.judges": "جج", "hc.other": "دیگر", "hc.total": "کل",
    "check.passed": "کامیاب", "check.failed": "ناکام",
    "gauge.left": "{v} باقی", "gauge.of": "{b} میں سے {a}",
    "status.used": "استعمال شدہ", "status.stale": "پرانا", "status.rejected": "مسترد", "status.irrelevant": "غیر متعلق",
    "status.optional": "اختیاری", "status.needs_review": "جائزہ درکار",
    "col.check": "جانچ", "col.area": "شعبہ", "col.expected": "متوقع", "col.actual": "اصل", "col.option": "انتخاب",
    "col.seats": "نشستیں", "col.price": "قیمت", "col.perhead": "فی کس",
    "t.total": "کل", "t.remaining": "{v} میں سے باقی", "t.optional": "اختیاری", "t.fits": "باقی بجٹ میں آ جاتا ہے", "t.nofit": "بجٹ میں نہیں آتا",
    "venue.none": "کوئی مقام منتخب نہیں", "venue.seats": "{h} افراد کے لیے {c} نشستیں", "food.none": "کھانے کا کوئی انتخاب نہیں", "judging.none": "ججنگ کا ڈیٹا نہیں",
    "schedule.none": "کوئی شیڈول نہیں", "budget.none": "ابھی بجٹ نہیں", "judging.assign": "ججوں کی ٹیموں کے لیے تقسیم",
    "none": "کوئی نہیں", "privacy.none": "کوئی ذاتی ڈیٹا یا قانونی/متنازع مواد نہیں ملا",
    "msg.add": "نیا پیغام شامل کریں", "msg.hint": "ہر دوسرے پیغام کی طرح وہی کمانڈ چلتی ہے (python serve.py درکار ہے)۔ کوئی بھی زبان۔",
    "msg.placeholder": "نیا پیغام یہاں چسپاں کریں…", "msg.none": "ابھی کوئی پیغام نہیں۔", "msg.processing": "پروسیس ہو رہا ہے…", "res.title": "آپ کے پیغام کا نتیجہ", "res.meta": "رن {n} · {c} ماڈل کال · {k} ٹوکن", "res.changed": "پلان میں تبدیلی: {a}", "res.nochange": "پلان میں کوئی تبدیلی نہیں۔", "res.questions": "مزید تفصیل درکار ہے — براہ کرم جواب دیں", "res.answer": "آپ کا جواب", "res.send": "جواب بھیجیں", "res.noread": "پیغام پڑھا نہ جا سکا۔ کچھ تبدیل نہیں ہوا۔", "res.seen": "یہ متن پہلے ہی پروسیس ہو چکا ہے، اس لیے کچھ نیا شامل نہیں ہوا۔", "res.notenough": "پلان اپ ڈیٹ کرنے کے لیے معلومات کافی نہیں ہیں۔", "res.g1": "یہ ایونٹ کے کس حصے کے بارے میں ہے — مقام، کھانا، ججنگ، شیڈول یا بجٹ؟", "res.g2": "ہمیں کون سا درست عدد استعمال کرنا چاہیے (قیمت روپوں میں، افراد کی تعداد، وقت یا دورانیہ)؟", "res.g3": "کیا یہ پہلے سے طے شدہ کسی چیز کو بدلتا ہے، یا نئی درخواست ہے؟", "res.ask": "مزید معلومات درکار", "msg.attach": "منسلک کریں", "msg.menuTitle": "دستاویز شامل کریں", "msg.menuEmail": "ای میل شامل کریں", "msg.menuEmailDesc": "چسپاں کریں یا اپ لوڈ کریں — اکاؤنٹ کی ضرورت نہیں", "em.from": "بھیجنے والا", "em.date": "تاریخ", "em.subject": "موضوع", "em.body": "ای میل کا متن", "em.add": "پیغام میں شامل کریں", "em.upload": ".eml فائل اپ لوڈ کریں", "em.cancel": "منسوخ", "msg.menuDesc": "کمپیوٹر سے اپ لوڈ کریں", "msg.attachhint": "ای میل (.eml)، ورڈ، پی ڈی ایف یا ٹیکسٹ — ہر ایک زیادہ سے زیادہ 10 MB", "msg.badfile": "غیر تعاون یافتہ یا بہت بڑی فائل: {n}",
    "msg.done": "مکمل — پلان اپ ڈیٹ ہو گیا", "msg.error": "خرابی: {e}", "msg.nobackend": "بیک اینڈ نہیں چل رہا — چلائیں: python serve.py",
    "msg.run": "رن {n}", "msg.nodate": "تاریخ نہیں", "msg.facts": "نکالے گئے حقائق ({n})", "msg.summary": "EN",
    "lang.und": "نامعلوم", "lang.mixed": "ملی جلی", "lang.ur-Latn": "رومن اردو", "lang.hi-Latn": "رومن ہندی",
    "lang.count": "{n} پیغام", "lang.none": "ابھی زبان کا ڈیٹا نہیں — نیا پیغام چلائیں۔",
    "rej.msg": "پیغام #{n}", "rej.fact": "حقیقت", "rej.why": "مسترد کرنے کی وجہ", "rej.none": "کوئی پیغام مسترد نہیں ہوا۔ جو پیغام کسی اصول کو توڑے یا بغیر اختیار کے بھیجنے والے کا ہو، وجہ کے ساتھ یہاں نظر آئے گا۔",
    "trace.calls": "ماڈل کالز", "trace.prompt": "پرامپٹ ٹوکن", "trace.completion": "جواب کے ٹوکن", "trace.total": "کل ٹوکن",
    "trace.allruns": "تمام رنز", "trace.allareas": "تمام شعبے", "trace.run": "رن {n}", "trace.input": "ان پٹ", "trace.output": "آؤٹ پٹ",
    "trace.none": "کوئی ماڈل کال نہیں۔", "trace.decisions": "فیصلوں کا لاگ", "trace.nodecisions": "کوئی فیصلہ درج نہیں۔",
    "hist.run": "رن {n} · {kind}", "hist.new": "نئے پیغامات", "hist.calls": "ماڈل کالز", "hist.tokens": "ٹوکن", "hist.areas": "جن شعبوں میں ماڈل کال ہوئی",
    "hist.changed": "تبدیل شدہ شعبے", "hist.skipped": "چھوڑے گئے (تبدیلی نہیں، کال نہیں)", "hist.none": "ابھی کوئی رن نہیں۔",
    "foot": "EventMind · ماڈل پڑھتا ہے، کوڈ فیصلہ کرتا ہے ·", "page.title": "EventMind — ایونٹ پلان ڈیش بورڈ",
    "xl.badfile": "درست state.json نہیں: {e}", "xl.nodata": "پہلے کوئی پلان لوڈ کریں۔"
  }
};

let UI_LANG = "en";
try { const v = localStorage.getItem("em-lang"); if (v === "en" || v === "ur") UI_LANG = v; } catch (_) { /* private mode */ }

// t("plan.people", {n: 5}) -> translated string with {n} filled in; falls back to English, then the key.
function t(key, vars) {
  let s = (I18N[UI_LANG] && I18N[UI_LANG][key]) ?? I18N.en[key] ?? key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

// Display name for a language code in the current UI language (works offline via Intl).
function langName(code) {
  const own = I18N[UI_LANG]["lang." + code]; if (own) return own;
  try { const n = new Intl.DisplayNames([UI_LANG], {type: "language"}).of(code); if (n && n !== code) return n; } catch (_) { /* ignore */ }
  return code.toUpperCase();
}

// Applies the language to the static page: <html lang/dir>, data-i18n text, data-i18n-title tooltips.
function applyI18n() {
  const h = document.documentElement;
  h.lang = UI_LANG; h.dir = UI_LANG === "ur" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.title = t("page.title");
  document.querySelectorAll("#langSwitch button").forEach(b => b.classList.toggle("active", b.dataset.lang === UI_LANG));
}

function setUiLang(code) {
  UI_LANG = code === "ur" ? "ur" : "en";
  try { localStorage.setItem("em-lang", UI_LANG); } catch (_) { /* private mode */ }
  applyI18n();
}
