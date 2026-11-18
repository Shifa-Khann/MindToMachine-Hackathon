"""Plan-change records, from invented plans."""
import unittest

from eventmind import diff


class DiffTests(unittest.TestCase):
    def test_no_change(self):
        p = {"venue": {"name": "a", "price": 5}, "budget": {"total": 9, "lines": [{"item": "x", "amount": 1}]}}
        self.assertEqual(diff.plan_changes(p, p), [])

    def test_changed_values_and_lines(self):
        old = {"venue": {"name": "a", "price": 5}, "budget": {"total": 9, "lines": [{"item": "x", "amount": 1}, {"item": "y", "amount": 2}]}}
        new = {"venue": {"name": "b", "price": 5}, "budget": {"total": 12, "lines": [{"item": "x", "amount": 4}, {"item": "z", "amount": 3}]}}
        ch = {(c["field"], c.get("item")): (c["old"], c["new"]) for c in diff.plan_changes(old, new)}
        self.assertEqual(ch[("venue", None)], ("a", "b"))
        self.assertEqual(ch[("total", None)], (9, 12))
        self.assertEqual(ch[("line", "x")], (1, 4))
        self.assertEqual(ch[("line", "z")], (None, 3))
        self.assertEqual(ch[("line", "y")], (2, None))
        self.assertNotIn(("venue_price", None), ch)

    def test_first_plan_from_nothing(self):
        self.assertTrue(diff.plan_changes({}, {"headcount": {"total": 7}}))


if __name__ == "__main__":
    unittest.main()
