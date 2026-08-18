import json
import os
import urllib.request


_AUTH_TOKEN = None


def extract_ses_payload(body):
    value = json.loads(body) if isinstance(body, str) else body
    if not isinstance(value, dict):
        raise ValueError("Invalid SQS body")

    message = value.get("Message")
    if message is not None:
        value = json.loads(message) if isinstance(message, str) else message
    if not isinstance(value, dict):
        raise ValueError("Invalid SNS message")
    return value


def get_auth_token():
    global _AUTH_TOKEN
    if _AUTH_TOKEN:
        return _AUTH_TOKEN

    parameter_name = os.environ.get("AUTH_PARAMETER_NAME", "")
    if not parameter_name:
        raise RuntimeError("Missing AUTH_PARAMETER_NAME")

    import boto3

    response = boto3.client("ssm").get_parameter(
        Name=parameter_name,
        WithDecryption=True,
    )
    _AUTH_TOKEN = response["Parameter"]["Value"]
    return _AUTH_TOKEN


def post_reconciliation(url, token, events):
    body = json.dumps({"sesEvents": events}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "ai-team-ses-reconciler/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        response_body = json.loads(response.read().decode("utf-8") or "{}")
        if response.status < 200 or response.status >= 300 or response_body.get("ok") is not True:
            raise RuntimeError("Reconciliation endpoint rejected the event")
        return response_body


def lambda_handler(event, context):
    failures = []
    endpoint = os.environ.get("RECONCILE_URL", "")

    for record in event.get("Records", []):
        sqs_message_id = str(record.get("messageId", ""))
        try:
            payload = extract_ses_payload(record.get("body", ""))
            event_type = str(
                payload.get("eventType") or payload.get("notificationType") or ""
            ).strip().upper()
            if event_type not in {"BOUNCE", "COMPLAINT"}:
                continue
            if not endpoint:
                raise RuntimeError("Missing RECONCILE_URL")

            post_reconciliation(endpoint, get_auth_token(), [payload])
        except Exception:
            print(json.dumps({"level": "error", "kind": "ses_reconcile_failed"}))
            if sqs_message_id:
                failures.append({"itemIdentifier": sqs_message_id})

    return {"batchItemFailures": failures}
