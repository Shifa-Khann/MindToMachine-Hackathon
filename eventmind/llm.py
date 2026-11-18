"""One thin client for any OpenAI-compatible endpoint (Groq, Ollama, Gemini, OpenRouter...).

Every call is recorded in the trace with: number, model, area tag, input, output and the
token counts exactly as the provider reports them (never estimated).
"""
import json
import time
import urllib.request
import urllib.error

from . import config

AREAS = {"reading", "venue", "schedule", "food", "judging", "budget"}


class CallBudgetExceeded(Exception):
    pass


class LLM:
    def __init__(self, state, run_no, is_update):
        self.state = state
        self.run_no = run_no
        self.max_calls = config.MAX_UPDATE_CALLS if is_update else None
        self.timeout = config.CALL_TIMEOUT_UPDATE if is_update else config.CALL_TIMEOUT_FULL
        self.calls_this_run = 0

    def call(self, area, system, user, max_tokens=1500):
        assert area in AREAS, area
        if self.max_calls is not None and self.calls_this_run >= self.max_calls:
            raise CallBudgetExceeded(f"update limit of {self.max_calls} model calls reached")
        self.calls_this_run += 1
        trace = self.state["trace"]
        entry = {"n": len(trace) + 1, "run": self.run_no, "model": config.MODEL, "area": area,
                 "input": f"[system]\n{system}\n\n[user]\n{user}", "output": "",
                 "prompt_tokens": None, "completion_tokens": None, "total_tokens": None,
                 "ms": 0, "error": None}
        body = {"model": config.MODEL, "temperature": 0, "max_tokens": max_tokens,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
        if config.JSON_MODE:
            body["response_format"] = {"type": "json_object"}
        req = urllib.request.Request(
            config.BASE_URL + "/chat/completions", data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {config.API_KEY}"})
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                data = json.loads(r.read().decode("utf-8"))
            entry["output"] = data["choices"][0]["message"]["content"] or ""
            usage = data.get("usage") or {}
            entry["prompt_tokens"] = usage.get("prompt_tokens")
            entry["completion_tokens"] = usage.get("completion_tokens")
            entry["total_tokens"] = usage.get("total_tokens")
            # Some providers report model name differently; record what the server says it used.
            entry["model"] = data.get("model") or config.MODEL
        except urllib.error.HTTPError as e:
            entry["error"] = f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}"
        except Exception as e:  # network/timeout
            entry["error"] = f"{type(e).__name__}: {e}"
        entry["ms"] = int((time.time() - t0) * 1000)
        trace.append(entry)
        if entry["error"]:
            raise RuntimeError(entry["error"])
        return entry["output"]


def parse_json(text):
    """Models sometimes wrap JSON in prose or ``` fences; take the outermost object."""
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`")
        t = t[t.find("\n") + 1:] if "\n" in t else t
    start, end = t.find("{"), t.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in model output")
    return json.loads(t[start:end + 1])
