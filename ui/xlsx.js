// EventMind — real .xlsx export with no libraries (works offline).
// Three small parts: crc32 + a "store" (no compression) zip writer, SpreadsheetML with inline strings,
// and the sheet layout built from state.json. Plan names are title-cased at display time only.
"use strict";

// ---------- zip (store method) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function zipStore(files) {                       // files: [{name, data:Uint8Array}] -> Uint8Array
  const enc = new TextEncoder(), now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals = [], centrals = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);   // UTF-8 names
    lh.setUint16(8, 0, true); lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);    // method 0 = stored
    lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true); ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    locals.push(new Uint8Array(lh.buffer), name, f.data);
    centrals.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = centrals.reduce((a, p) => a + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const parts = [...locals, ...centrals, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

// ---------- SpreadsheetML ----------
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const xmlEsc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const colName = (i) => { let s = ""; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; };

// cell style ids (see STYLES_XML): 0 plain · 1 header (bold white on green) · 2 wrapped text · 3 money #,##0
const S_PLAIN = 0, S_HEAD = 1, S_WRAP = 2, S_MONEY = 3;
const STYLES_XML = XML_HEAD + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F9E55"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const MAX_CELL = 32000;                          // Excel's per-cell limit is 32,767 characters
function cellXml(ref, value, style) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  let s = String(value); if (s.length > MAX_CELL) s = s.slice(0, MAX_CELL) + " …[truncated]";
  return `<c r="${ref}" s="${style === S_PLAIN && (s.length > 40 || s.includes("\n")) ? S_WRAP : style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(s)}</t></is></c>`;
}

// sheet = {name, cols:[{h, money?, wrap?}], rows:[[value | {v, money?}]]}
function sheetXml(sheet) {
  const widths = sheet.cols.map(c => Math.min(60, Math.max(10, String(c.h).length + 2)));
  sheet.rows.forEach(r => r.forEach((cell, i) => {
    const v = cell && typeof cell === "object" ? cell.v : cell;
    if (v !== null && v !== undefined) widths[i] = Math.min(60, Math.max(widths[i] || 10, ...String(v).split("\n").map(l => l.length + 2)));
  }));
  const head = `<row r="1" ht="22" customHeight="1">${sheet.cols.map((c, i) => `<c r="${colName(i)}1" s="${S_HEAD}" t="inlineStr"><is><t>${xmlEsc(c.h)}</t></is></c>`).join("")}</row>`;
  const body = sheet.rows.map((r, ri) => `<row r="${ri + 2}">` + r.map((cell, i) => {
    const o = cell && typeof cell === "object" ? cell : {v: cell};
    const col = sheet.cols[i] || {};
    return cellXml(`${colName(i)}${ri + 2}`, o.v, (o.money || col.money) && typeof o.v === "number" ? S_MONEY : (col.wrap ? S_WRAP : S_PLAIN));
  }).join("") + "</row>").join("");
  return XML_HEAD + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${colName(Math.max(0, sheet.cols.length - 1))}${sheet.rows.length + 1}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${head}${body}</sheetData></worksheet>`;
}

function workbookBytes(sheets) {
  const enc = new TextEncoder(), f = (name, text) => ({name, data: enc.encode(text)});
  const files = [
    f("[Content_Types].xml", XML_HEAD + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`),
    f("_rels/.rels", XML_HEAD + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    f("xl/workbook.xml", XML_HEAD + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`),
    f("xl/_rels/workbook.xml.rels", XML_HEAD + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    f("xl/styles.xml", STYLES_XML),
    ...sheets.map((s, i) => f(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)))
  ];
  return zipStore(files);
}

// ---------- the EventMind workbook ----------
// `nice` title-cases a name for display; stored data is never changed.
function buildSheets(state, nice) {
  const p = state.plan || {}, b = p.budget || {}, v = p.venue || {}, fd = p.food || {}, j = p.judging || {}, sc = p.schedule || {}, h = p.headcount || {};
  const checks = state.checks || [], runs = state.runs || [], tot = state.totals || {}, last = runs[runs.length - 1] || {};
  const M = (n) => ({v: n, money: true});
  const yn = (x) => x ? "Yes" : "No";
  const summary = {name: "Summary", cols: [{h: "Item"}, {h: "Value"}], rows: [
    ["Plan status", checks.length && checks.every(c => c.ok) ? "Valid — all checks passed" : `${checks.filter(c => !c.ok).length} check(s) failing`],
    ["Start", sc.start], ["End", sc.end], ["Duration (min)", sc.duration_min],
    ["People on site", h.total], ["Students", h.students], ["Staff", h.staff], ["Judges", h.judges], ["Other people", h.other], ["Teams", j.teams],
    ["Venue", nice(v.name)], ["Venue seats", v.capacity], ["Venue price", M(v.price)],
    ["Food option", nice(fd.name)], ["Meals", fd.boxes], ["Food price per head", M(fd.price_per_head)], ["Food cost", M(fd.cost)],
    ["Judges used", j.used], ["Judge fee each", M(j.fee_each)], ["Judging cost", M(j.cost)],
    ["Total cost", M(b.total)], ["Budget cap", M(b.cap)], ["Remaining", M(b.remaining)],
    ["Runs", runs.length], ["Last run", last.kind], ["Model calls (all runs)", tot.calls], ["Total tokens (all runs)", tot.total], ["Updated", state.updated]]};
  const budget = {name: "Budget", cols: [{h: "Item"}, {h: "Area"}, {h: "Amount (Rs)", money: true}, {h: "Kind"}], rows: [
    ...(b.lines || []).map(l => [nice(l.item), l.area, l.amount, l.kind]),
    ["TOTAL", "", b.total, ""], ["Budget cap", "", b.cap, ""], ["Remaining", "", b.remaining, ""],
    ...(b.optional || []).map(o => [`Optional: ${nice(o.item)}`, "", o.amount, o.fits ? "fits remaining budget" : "does not fit"])]};
  const schedule = {name: "Schedule", cols: [{h: "Start"}, {h: "End"}, {h: "Item"}, {h: "Minutes"}, {h: "Kind"}],
    rows: (sc.blocks || []).map(x => [x.start, x.end, nice(x.item), x.minutes, x.kind])};
  const venues = {name: "Venue options", cols: [{h: "Venue"}, {h: "Seats"}, {h: "Price (Rs)", money: true}, {h: "Chosen"}, {h: "Note", wrap: true}],
    rows: (v.options || []).map(o => [nice(o.name), o.capacity, o.price, yn(o.chosen), o.note])};
  const food = {name: "Food options", cols: [{h: "Option"}, {h: "Price per head (Rs)", money: true}, {h: "Chosen"}, {h: "Note", wrap: true}],
    rows: (fd.options || []).map(o => [nice(o.name), o.price_per_head, yn(o.chosen), o.note])};
  const judges = {name: "Judges", cols: [{h: "Judge"}, {h: "Teams"}, {h: "Slots", wrap: true}],
    rows: (j.assignments || []).map(a => [nice(a.judge), (a.teams || []).join(", "), (a.slots || []).join(" · ")])};
  const checksS = {name: "Checks", cols: [{h: "Check", wrap: true}, {h: "Area"}, {h: "Expected", wrap: true}, {h: "Actual", wrap: true}, {h: "Result"}],
    rows: checks.map(c => [c.label, c.area, c.expected, c.actual, c.ok ? "Pass" : "Fail"])};
  const messages = {name: "Messages", cols: [{h: "#"}, {h: "Sender"}, {h: "Role"}, {h: "Date"}, {h: "Language"}, {h: "Status"}, {h: "Areas"}, {h: "Original text", wrap: true}, {h: "English summary", wrap: true}, {h: "Reason", wrap: true}],
    rows: (state.messages || []).map(m => [m.n, nice(m.sender), m.role, m.date, m.lang, m.status, (m.areas || []).join(", "), m.text, m.gist, m.reason])};
  const rejected = {name: "Rejected", cols: [{h: "#"}, {h: "Sender"}, {h: "Fact"}, {h: "Reason", wrap: true}, {h: "Message text", wrap: true}],
    rows: (state.rejected || []).map(r => [r.n, nice(r.sender), r.fact_key, r.reason, r.text])};
  const trace = {name: "Trace", cols: [{h: "#"}, {h: "Run"}, {h: "Area"}, {h: "Model"}, {h: "Prompt tokens"}, {h: "Completion tokens"}, {h: "Total tokens"}, {h: "ms"}, {h: "Error"}, {h: "Input", wrap: true}, {h: "Output", wrap: true}],
    rows: (state.trace || []).map(c => [c.n, c.run, c.area, c.model, c.prompt_tokens, c.completion_tokens, c.total_tokens, c.ms, c.error, c.input, c.output])};
  return [summary, budget, schedule, venues, food, judges, checksS, messages, rejected, trace];
}

function downloadExcel(state, nice) {
  const bytes = workbookBytes(buildSheets(state, nice || (x => x ?? "")));
  const blob = new Blob([bytes], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  const d = new Date(), pad = (n) => String(n).padStart(2, "0");
  const a = Object.assign(document.createElement("a"), {href: URL.createObjectURL(blob), download: `event-plan-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`});
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
