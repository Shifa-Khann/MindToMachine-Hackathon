"""Step-by-step record of everything one run does: every code agent and every model call, in order,
with real timings. The UI plays it back as the animated Trace page. Nothing here is estimated:
model calls are copied from the call trace (model, tokens, ms as the provider reported them)."""
import time


class Steps:
    def __init__(self, state, run_no):
        self.state, self.run_no = state, run_no
        self.t0 = time.perf_counter()
        self.items = state.setdefault("pipeline", [])
        self.count = 0

    def _now(self):
        return int((time.perf_counter() - self.t0) * 1000)

    def add(self, stage, agent, kind, title, detail="", ms=None, **extra):
        """kind: 'io' (reading/writing files), 'code' (plain code agent) or 'model'."""
        self.count += 1
        end = self._now()
        step = {"run": self.run_no, "i": self.count, "stage": stage, "agent": agent, "kind": kind, "title": title,
                "detail": detail, "ms": ms, "at": max(0, end - (ms or 0))}
        step.update(extra)
        self.items.append(step)
        return step

    def timed(self):
        """t = steps.timed(); ...; ms = t()  -> milliseconds since the first call."""
        start = time.perf_counter()
        return lambda: int((time.perf_counter() - start) * 1000)

    def calls(self, since, agent, stage):
        """One step per model call recorded in the call trace after index `since`, in call order."""
        for c in self.state["trace"][since:]:
            if c.get("error"):
                detail = f"{c.get('model')} · FAILED: {str(c['error']).strip()[:120]}"
            else:
                tok = [("in", c.get("prompt_tokens")), ("out", c.get("completion_tokens")), ("total", c.get("total_tokens"))]
                detail = f"{c.get('model')} · " + " · ".join(f"{k} {v if v is not None else 'n/a'}" for k, v in tok)
            self.add(stage, agent, "model", f"Model call #{c['n']} — {c['area']}", detail, ms=c.get("ms"),
                     call=c["n"], area=c["area"], model=c.get("model"), ok=not c.get("error"),
                     tokens={"prompt": c.get("prompt_tokens"), "completion": c.get("completion_tokens"),
                             "total": c.get("total_tokens")})
