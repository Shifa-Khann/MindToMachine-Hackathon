"""Plain-code tests with INVENTED messages (no sample-pack facts). Run: python -m unittest -v"""
import unittest

from eventmind import engine


def msg(n, role, date, facts, flags=None, run=1):
    return {"n": n, "run": run, "sender": f"sender{n}", "role": role, "date": date, "flags": flags or [],
            "facts": facts}


def base():
    return [
        msg(1, "approver", "2030-03-01", [
            {"key": "event:students", "type": "event", "field": "students", "value": 60},
            {"key": "event:team_size", "type": "event", "field": "team_size", "value": 4},
            {"key": "event:duration_min", "type": "event", "field": "duration_min", "value": 300},
            {"key": "event:budget", "type": "event", "field": "budget", "value": 300000},
            {"key": "event:staff", "type": "event", "field": "staff", "value": 5},
            {"key": "break:tea", "type": "break", "name": "tea", "minutes": 20}]),
        msg(2, "venue", "2030-02-20", [
            {"key": "venue:small room", "type": "venue", "name": "small room", "capacity": 50, "price": 10000},
            {"key": "venue:big room", "type": "venue", "name": "big room", "capacity": 90, "price": 40000},
            {"key": "venue:grand room", "type": "venue", "name": "grand room", "capacity": 150, "price": 90000}]),
        msg(3, "caterer", "2030-02-25", [
            {"key": "food:standard", "type": "food", "name": "standard", "tier": "standard", "price_per_head": 700}]),
        msg(4, "caterer", "2030-03-02", [
            {"key": "food:standard", "type": "food", "name": "standard", "tier": "standard", "price_per_head": 900}]),
        msg(5, "judging", "2030-03-01", [
            {"key": "judges:confirmed", "type": "judges", "field": "confirmed", "value": 8},
            {"key": "judges:fee_each", "type": "judges", "field": "fee_each", "value": 2000},
            {"key": "judges:min_per_team", "type": "judges", "field": "min_per_team", "value": 10},
            {"key": "judges:max_teams", "type": "judges", "field": "max_teams", "value": 4}]),
        msg(6, "finance", "2030-03-01", [{"key": "expense:stickers", "type": "expense", "item": "stickers", "amount": 5000}]),
        msg(7, "participant", "2030-03-03", [{"key": "optional:magician", "type": "optional", "item": "magician", "amount": 20000}]),
        msg(8, "other", "2030-03-04", []),
    ]


class EngineTests(unittest.TestCase):
    def run_plan(self, messages, mres=None):
        return engine.plan_with_rejections(messages, {}, mres or {})

    def test_figures_and_checks(self):
        plan, checks, notes, status, facts, _ = self.run_plan(base())
        self.assertTrue(all(c["ok"] for c in checks), [c for c in checks if not c["ok"]])
        self.assertEqual(plan["judging"]["teams"], 15)
        self.assertEqual(plan["judging"]["needed"], 4)           # ceil(15/4)
        self.assertEqual(plan["headcount"]["total"], 60 + 5 + 4)
        self.assertEqual(plan["venue"]["name"], "big room")      # cheapest that fits 69
        self.assertEqual(plan["food"]["price_per_head"], 900)    # newest quote wins
        self.assertEqual(plan["budget"]["total"], 5000 + 40000 + 69 * 900 + 4 * 2000)
        self.assertEqual(plan["schedule"]["duration_min"], 300)
        self.assertTrue(any("standby" in n for n in notes))

    def test_stale_and_optional(self):
        _, _, _, status, _, _ = self.run_plan(base())
        self.assertEqual(status["3.0"][0], "stale")
        self.assertEqual(status["7.0"][0], "optional")

    def test_wrong_quantity_rejected(self):
        m = base() + [msg(9, "caterer", None, [{"key": "quantity:food", "type": "quantity", "area": "food",
                                                 "item": "meals", "value": 30}], run=2)]
        plan, checks, _, status, _, _ = self.run_plan(m)
        self.assertEqual(status["9.0"][0], "rejected")
        self.assertTrue(all(c["ok"] for c in checks))
        self.assertEqual(plan["food"]["boxes"], 69)

    def test_true_change_accepted(self):
        m = base() + [msg(9, "finance", None, [{"key": "expense:stickers", "type": "expense", "item": "stickers",
                                                 "amount": 8000}], run=2)]
        plan, checks, _, status, _, _ = self.run_plan(m)
        self.assertEqual(status["9.0"][0], "used")
        self.assertEqual(status["6.0"][0], "stale")
        self.assertIn(8000, [l["amount"] for l in plan["budget"]["lines"]])

    def test_non_approver_cannot_change_budget(self):
        m = base() + [msg(9, "caterer", None, [{"key": "event:budget", "type": "event", "field": "budget",
                                                 "value": 900000}], run=2)]
        plan, _, _, status, _, _ = self.run_plan(m)
        self.assertEqual(status["9.0"][0], "rejected")
        self.assertEqual(plan["budget"]["cap"], 300000)

    def test_new_rule_kind_generator(self):
        m = base()
        m[1]["facts"][2]["features"] = ["generator"]
        m.append(msg(9, "approver", None, [{"key": "rule:power", "type": "rule", "area": "venue",
                                            "metric": "venue_features", "op": "requires", "value": "generator",
                                            "text": "venue must have a generator"}], run=2))
        plan, checks, _, _, _, _ = self.run_plan(m)
        self.assertEqual(plan["venue"]["name"], "grand room")
        self.assertTrue(all(c["ok"] for c in checks))

    def test_price_rise_switches_option_instead_of_breaking(self):
        m = base() + [msg(9, "venue", None, [{"key": "venue:big room", "type": "venue", "name": "big room",
                                               "capacity": 90, "price": 280000}], run=2)]
        plan, checks, _, _, _, _ = self.run_plan(m)
        self.assertTrue(all(c["ok"] for c in checks))
        self.assertEqual(plan["venue"]["name"], "grand room")

    def test_legal_flag_needs_review(self):
        m = base() + [msg(9, "venue", None, [{"key": "venue:big room", "type": "venue", "name": "big room",
                                               "capacity": 10, "price": 1}], flags=["legal"], run=2)]
        _, checks, _, status, _, _ = self.run_plan(m)
        self.assertEqual(status["9.0"][0], "needs_review")
        self.assertTrue(all(c["ok"] for c in checks))


if __name__ == "__main__":
    unittest.main()


class ScheduleNameTests(unittest.TestCase):
    def test_break_name_not_doubled(self):
        self.assertEqual(engine.break_name({"name": "tea break"}), "Tea break")
        self.assertEqual(engine.break_name({"name": "tea"}), "Tea break")
        self.assertEqual(engine.break_name({}), "Break")

    def test_zero_minute_judging_block_is_skipped(self):
        blocks, _ = engine.make_schedule(600, 240, [], False, 0)
        self.assertNotIn("judging", [b["kind"] for b in blocks])
        blocks, _ = engine.make_schedule(600, 240, [], False, 30)
        self.assertIn("judging", [b["kind"] for b in blocks])


class ExtractionRobustnessTests(unittest.TestCase):
    def test_rules_without_keys_do_not_supersede_each_other(self):
        m1 = msg(1, "approver", "2030-03-01", [{"type": "rule", "area": "venue", "metric": "venue_features", "op": "requires", "value": "ramp"}])
        m2 = msg(2, "approver", "2030-03-02", [{"type": "rule", "area": "food", "metric": "food_price_per_head", "op": "<=", "value": 500}])
        keys = {f["key"] for f in engine.flatten([m1, m2])}
        self.assertEqual(len(keys), 2)

    def test_unavailable_venue_is_not_an_option(self):
        msgs = base() + [msg(9, "venue", "2030-03-05", [{"key": "venue:grand room", "type": "venue", "name": "grand room", "available": False}])]
        plan = engine.plan_with_rejections(msgs, {}, {})[0]
        self.assertNotIn("grand room", [o["name"] for o in plan["venue"]["options"]])

    def test_service_charge_rule_raises_food_cost(self):
        plain = engine.plan_with_rejections(base(), {}, {})[0]["food"]["cost"]
        extra = msg(9, "caterer", "2030-03-05", [{"type": "rule", "area": "food", "metric": "service_charge", "op": "==", "value": 10}])
        with_fee = engine.plan_with_rejections(base() + [extra], {}, {})[0]["food"]["cost"]
        self.assertEqual(with_fee, round(plain * 1.1))

    def test_judge_limits_given_as_rules_are_used(self):
        extra = msg(9, "judging", "2030-03-05", [{"type": "rule", "area": "judges", "metric": "teams_per_judge", "op": "<=", "value": 2}])
        msgs = base()
        msgs[4]["facts"] = [f for f in msgs[4]["facts"] if f["key"] != "judges:max_teams"]   # only the rule supplies the limit
        plan = engine.plan_with_rejections(msgs + [extra], {}, {})[0]
        self.assertEqual(plan["judging"]["max_teams"], 2)
