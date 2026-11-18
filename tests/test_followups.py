"""Follow-up questions: built by plain code from invented facts, plus the model's own (capped)."""
import unittest

from eventmind import reading


class FollowUpTests(unittest.TestCase):
    def test_missing_number_becomes_question(self):
        m = {"facts": [{"type": "venue", "name": "invented hall", "capacity": 80}]}
        qs = reading.follow_ups(m)
        self.assertEqual(len(qs), 1)
        self.assertIn("price", qs[0])
        self.assertIn("invented hall", qs[0])

    def test_complete_facts_ask_nothing(self):
        m = {"facts": [{"type": "expense", "item": "invented item", "amount": 100}, {"type": "rule", "text": "x"}]}
        self.assertEqual(reading.follow_ups(m), [])

    def test_non_numeric_and_bool_count_as_missing(self):
        m = {"facts": [{"type": "expense", "item": "a", "amount": "lots"}, {"type": "break", "name": "b", "minutes": True}]}
        self.assertEqual(len(reading.follow_ups(m)), 2)

    def test_model_questions_kept_capped_and_cleaned(self):
        m = {"ask": ["How many people?", "", 5, "By when?", "Third?"], "facts": []}
        self.assertEqual(reading.follow_ups(m), ["How many people?", "By when?"])

    def test_prompt_mentions_ask(self):
        self.assertIn('"ask"', reading.SYSTEM)


if __name__ == "__main__":
    unittest.main()


class UnavailableTests(unittest.TestCase):
    def test_unavailable_option_asks_nothing(self):
        m = {"facts": [{"type": "venue", "name": "invented hall", "available": False}]}
        self.assertEqual(reading.follow_ups(m), [])


class OriginalTextTests(unittest.TestCase):
    def test_next_message_header_is_not_part_of_previous_text(self):
        raw = "first sender header\nalpha beta gamma delta\n\nsecond sender header\nepsilon zeta eta theta\n"
        msgs = [{"quote": "alpha beta gamma"}, {"quote": "epsilon zeta eta"}]
        out = reading.attach_original_text(msgs, raw)
        self.assertEqual(out[0]["text"], "alpha beta gamma delta")
        self.assertEqual(out[1]["text"], "epsilon zeta eta theta")
