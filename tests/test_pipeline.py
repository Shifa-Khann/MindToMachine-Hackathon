"""Pipeline step recording, from an invented call trace (no model, no real data)."""
import unittest

from eventmind.pipeline import Steps


class PipelineTests(unittest.TestCase):
    def test_model_calls_are_copied_not_estimated(self):
        state = {"trace": [
            {"n": 1, "area": "reading", "model": "m-a", "prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15, "ms": 40, "error": None},
            {"n": 2, "area": "food", "model": "m-a", "prompt_tokens": None, "completion_tokens": None, "total_tokens": None, "ms": 7, "error": "HTTP 429"},
        ]}
        steps = Steps(state, 3)
        steps.add("input", "Ingest", "io", "received", "x")
        steps.calls(0, "Reader", "read")
        items = state["pipeline"]
        self.assertEqual([s["i"] for s in items], [1, 2, 3])
        self.assertTrue(all(s["run"] == 3 for s in items))
        self.assertEqual(items[1]["tokens"]["total"], 15)
        self.assertEqual(items[1]["call"], 1)
        self.assertTrue(items[1]["ok"])
        self.assertFalse(items[2]["ok"])
        self.assertIsNone(items[2]["tokens"]["total"])        # unknown stays unknown
        self.assertIn("FAILED", items[2]["detail"])

    def test_calls_since_index_only(self):
        state = {"trace": [{"n": 1, "area": "reading", "model": "m", "ms": 1}, {"n": 2, "area": "venue", "model": "m", "ms": 2}]}
        steps = Steps(state, 1)
        steps.calls(1, "Rule checker", "rule")
        self.assertEqual([s["call"] for s in state["pipeline"]], [2])

    def test_timed_returns_milliseconds(self):
        t = Steps({"trace": []}, 1).timed()
        self.assertGreaterEqual(t(), 0)


if __name__ == "__main__":
    unittest.main()
