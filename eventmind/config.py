"""Settings. Only infrastructure lives here - never facts from a message pack."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
STATE_FILE = OUT / "state.json"
TRACE_FILE = OUT / "trace.txt"
PLAN_FILE = OUT / "plan.md"


def _load_dotenv():
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()

BASE_URL = os.environ.get("EVENTMIND_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
API_KEY = os.environ.get("EVENTMIND_API_KEY", "")
MODEL = os.environ.get("EVENTMIND_MODEL", "llama-3.1-8b-instant")
JSON_MODE = os.environ.get("EVENTMIND_JSON_MODE", "1") == "1"

# Limits from the brief
FULL_RUN_SECONDS = 120
UPDATE_RUN_SECONDS = 60
MAX_UPDATE_CALLS = 5
CALL_TIMEOUT_FULL = 90
CALL_TIMEOUT_UPDATE = 40

# Who may change what. Ranks are about the sender's role, not about any specific pack.
ROLE_RANK = {"approver": 3, "venue": 2, "caterer": 2, "judging": 2, "finance": 2, "vendor": 2,
             "participant": 1, "other": 1}
