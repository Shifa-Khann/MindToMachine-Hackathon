"""Language tagging tests. The Urdu-script message below is invented for this test."""
import json
import unittest

from eventmind import reading

URDU = "ہال میں پچاس نشستیں ہیں اور کرایہ کم ہے۔"   # invented, not from any pack


class FakeLLM:
    def __init__(self, payload):
        self.payload = payload

    def call(self, area, system, user, max_tokens=0):
        assert area == "reading"
        self.seen = user
        return json.dumps(self.payload, ensure_ascii=False)


class LanguageTests(unittest.TestCase):
    def test_prompt_asks_for_lang(self):
        self.assertIn('"lang"', reading.SYSTEM)

    def test_clean_lang(self):
        c = reading.clean_lang
        self.assertEqual(c("ur"), "ur")
        self.assertEqual(c("UR"), "ur")
        self.assertEqual(c("ur-latn"), "ur-Latn")
        self.assertEqual(c("ur_Latn"), "ur-Latn")
        self.assertEqual(c("Mixed"), "mixed")
        for bad in (None, "", "urdu language", "12", 5):
            self.assertEqual(c(bad), "und")

    def test_urdu_script_message_flows_through(self):
        llm = FakeLLM({"messages": [{"sender": "s1", "role": "venue", "date": None, "lang": "ur",
                                     "quote": URDU[:12], "gist": "invented gist", "flags": [], "facts": []}]})
        msgs = reading.read(llm, URDU, set(), False)
        msgs = reading.attach_original_text(msgs, URDU)
        self.assertEqual(msgs[0]["text"], URDU)                 # original script kept verbatim
        self.assertEqual(reading.clean_lang(msgs[0]["lang"]), "ur")
        self.assertIn(URDU, llm.seen)                           # sent to the model unchanged


if __name__ == "__main__":
    unittest.main()


class EmailReadTests(unittest.TestCase):
    def test_eml_body_and_headers(self):
        from eventmind import ingest
        head = ["From: Sender <s@example.org>", "Subject: invented", "Content-Type: text/plain; charset=utf-8", "", URDU]
        raw = "\r\n".join(head).encode("utf-8")
        out = ingest.read_eml(raw)
        self.assertIn("Subject: invented", out)
        self.assertIn(URDU, out)
