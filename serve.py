#!/usr/bin/env python3
"""Serves the UI and state.json. 'Add message' in the UI saves the text to inbox/ and runs
the SAME command as the terminal: python eventmind.py <file>.

    python serve.py            -> http://localhost:8000
"""
import json
import subprocess
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UI, OUT, INBOX = ROOT / "ui", ROOT / "out", ROOT / "inbox"


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
        res = {"ok": False}
        if text:
            INBOX.mkdir(exist_ok=True)
            path = INBOX / f"msg_{int(time.time() * 1000)}.txt"
            path.write_text(text, encoding="utf-8")
            p = subprocess.run([sys.executable, str(ROOT / "eventmind.py"), str(path)], cwd=ROOT,
                               capture_output=True, text=True, encoding="utf-8", timeout=90)
            print(p.stdout, p.stderr)
            res = {"ok": p.returncode == 0, "error": p.stderr[-400:] if p.returncode else None}
        body = json.dumps(res).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"EventMind UI on http://localhost:{port}")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
