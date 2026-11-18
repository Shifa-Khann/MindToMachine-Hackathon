// EventMind UI labels — every interface string lives here (English + Urdu).
// Message text, plan facts and trace content are data and are never translated.
"use strict";

const I18N = {
  en: {
    "lang.name": "English",
    "nav.overview": "Plan", "nav.messages": "Messages", "nav.rejected": "Rejected", "nav.trace": "Trace", "nav.history": "Runs & changes",
    "title.overview": "Event plan dashboard", "title.messages": "Messages", "title.rejected": "Rejected messages",
    "title.trace": "Model call trace", "title.history": "Runs & changes",
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
