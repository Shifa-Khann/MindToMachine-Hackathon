"""Read a message file exactly as given (any language, any script), plus privacy redaction.

Supported: .txt/.md/.csv/.json (UTF-8), .docx and .pdf if the optional libraries are installed.
Redaction runs in plain code BEFORE text reaches the model: personal identifiers are not
needed to plan an event, so they never leave the machine.
"""
import re
from pathlib import Path

# Language-independent patterns (digits/emails look the same in every language).
PII_PATTERNS = [
    ("email address", re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")),
    ("national ID number", re.compile(r"\b\d{5}-\d{7}-\d\b")),
    ("phone number", re.compile(r"(?<![\d,])(?:\+\d{1,3}[\s-]?)?\(?0?3\d{2}\)?[\s-]?\d{7}(?![\d,])")),
    ("phone number", re.compile(r"\+\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}")),
    ("card/account number", re.compile(r"\b(?:\d[ -]?){13,19}\b")),
]


def read_file(path):
    p = Path(path)
    ext = p.suffix.lower()
    if ext == ".docx":
        try:
            import docx  # python-docx (pretrained/ready library, nothing custom)
        except ImportError:
            raise SystemExit("Reading .docx needs: pip install python-docx")
        return "\n".join(par.text for par in docx.Document(str(p)).paragraphs)
    if ext == ".pdf":
        try:
            from pypdf import PdfReader
        except ImportError:
            raise SystemExit("Reading .pdf needs: pip install pypdf")
        return "\n".join((pg.extract_text() or "") for pg in PdfReader(str(p)).pages)
    raw = p.read_bytes()
    for enc in ("utf-8-sig", "utf-16"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def redact(text):
    """Returns (redacted_text, list_of_notes)."""
    notes = []
    for label, pat in PII_PATTERNS:
        found = pat.findall(text)
        if found:
            text = pat.sub(f"[{label} removed]", text)
            notes.append(f"{len(found)} {label}(s) removed before sending text to the model")
    return text, notes
