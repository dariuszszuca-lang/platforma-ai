import importlib.util
import json
import os
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch


MODULE_PATH = Path(__file__).parents[1] / "infra" / "ses-reconciler" / "lambda_function.py"
if MODULE_PATH.exists():
    spec = importlib.util.spec_from_file_location("ses_reconciler_lambda", MODULE_PATH)
    reconciler = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reconciler)
else:
    reconciler = SimpleNamespace(
        os=os,
        extract_ses_payload=lambda body: None,
        get_auth_token=lambda: "",
        post_reconciliation=lambda url, token, events: {},
        lambda_handler=lambda event, context: {"batchItemFailures": []},
    )


def sqs_record(message_id, payload):
    envelope = {"Type": "Notification", "Message": json.dumps(payload)}
    return {"messageId": message_id, "body": json.dumps(envelope)}


class SesReconcilerLambdaTest(unittest.TestCase):
    def test_extracts_ses_payload_from_sns_envelope(self):
        payload = {
            "eventType": "BOUNCE",
            "mail": {"messageId": "ses-1"},
            "bounce": {"bounceType": "Permanent"},
        }

        extracted = reconciler.extract_ses_payload(sqs_record("sqs-1", payload)["body"])

        self.assertEqual(extracted, payload)

    def test_delivery_event_is_ignored_without_secret_or_http_call(self):
        payload = {"eventType": "DELIVERY", "mail": {"messageId": "ses-delivery"}}
        event = {"Records": [sqs_record("sqs-delivery", payload)]}

        with patch.object(reconciler, "get_auth_token") as get_token, patch.object(
            reconciler, "post_reconciliation"
        ) as post:
            result = reconciler.lambda_handler(event, None)

        self.assertEqual(result, {"batchItemFailures": []})
        get_token.assert_not_called()
        post.assert_not_called()

    def test_bounce_is_posted_once_with_token_and_endpoint(self):
        payload = {
            "eventType": "BOUNCE",
            "mail": {"messageId": "ses-bounce"},
            "bounce": {"bounceType": "Permanent", "bounceSubType": "General"},
        }
        event = {"Records": [sqs_record("sqs-bounce", payload)]}

        with patch.dict(
            reconciler.os.environ,
            {"RECONCILE_URL": "https://ai-team.pl/api/newsletter-send"},
            clear=False,
        ), patch.object(reconciler, "get_auth_token", return_value="secret-token"), patch.object(
            reconciler, "post_reconciliation", return_value={"ok": True}
        ) as post:
            result = reconciler.lambda_handler(event, None)

        self.assertEqual(result, {"batchItemFailures": []})
        post.assert_called_once_with(
            "https://ai-team.pl/api/newsletter-send", "secret-token", [payload]
        )

    def test_failed_post_returns_only_sqs_item_for_retry(self):
        payload = {"eventType": "COMPLAINT", "mail": {"messageId": "ses-complaint"}}
        event = {"Records": [sqs_record("sqs-complaint", payload)]}

        with patch.dict(
            reconciler.os.environ,
            {"RECONCILE_URL": "https://ai-team.pl/api/newsletter-send"},
            clear=False,
        ), patch.object(reconciler, "get_auth_token", return_value="secret-token"), patch.object(
            reconciler, "post_reconciliation", side_effect=RuntimeError("upstream failed")
        ):
            result = reconciler.lambda_handler(event, None)

        self.assertEqual(result, {"batchItemFailures": [{"itemIdentifier": "sqs-complaint"}]})


if __name__ == "__main__":
    unittest.main()
