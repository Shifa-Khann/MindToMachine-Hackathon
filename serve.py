#!/usr/bin/env python3
"""Serves the UI and state.json. 'Add message' in the UI saves the text to inbox/ and runs
the SAME command as the terminal: python eventmind.py <file>.

    python serve.py            -> http://localhost:8000
"""
import base64
import json
import subprocess
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UI, OUT, INBOX = ROOT / "ui", ROOT / "out", ROOT / "inbox"
ALLOWED_EXT = {".txt", ".md", ".eml", ".csv", ".json", ".docx", ".pdf"}   # same readers as ingest.read_file
MAX_BYTES = 10 * 1024 * 1024


def run_file(path):
    p = subprocess.run([sys.executable, str(ROOT / "eventmind.py"), str(path)], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8", timeout=90)
    out = (p.stdout or "") + (p.stderr or "")
    print(out.encode("ascii", "replace").decode())          # a Windows console can't print every character
    if "Reading failed" in out:                             # eventmind.py exits 0 but the plan did not change
        return False, out[out.index("Reading failed"):][:300]
    return p.returncode == 0, (out[-400:] if p.returncode else None)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(UI), **kw)

    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path.startswith("/state.json"):
            f = OUT / "state.json"
            body = f.read_bytes() if f.exists() else b"{}"
            self.send_response(200 if f.exists() else 404)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/message":
            self.send_error(404)
            return
        data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        text = (data.get("text") or "").strip()
        res = {"ok": False, "error": "nothing to process"}
        jobs = []                                   # files to run, in order: typed text first, then attachments
        INBOX.mkdir(exist_ok=True)
        stamp = int(time.time() * 1000)
        if text:
            path = INBOX / f"msg_{stamp}.txt"
            path.write_text(text, encoding="utf-8")
            jobs.append(path)
        for i, f in enumerate(data.get("files") or []):
            ext = Path(str(f.get("name", ""))).suffix.lower()      # only the extension of the user's name is used
            try:
                raw = base64.b64decode(f.get("b64") or "", validate=True)
            except Exception:
                raw = b""
            if ext not in ALLOWED_EXT or not raw or len(raw) > MAX_BYTES:
                res = {"ok": False, "error": f"unsupported or oversized file: {Path(str(f.get('name', ''))).name[:60]}"}
                jobs = []
                break
            path = INBOX / f"att_{stamp}_{i}{ext}"
            path.write_bytes(raw)
            jobs.append(path)
        for path in jobs:
            ok, err = run_file(path)
            res = {"ok": ok, "error": err}
            if not ok:
                break
        body = json.dumps(res).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"EventMind UI on http://localhost:{port}")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
