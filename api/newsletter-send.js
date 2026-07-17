// Vercel Serverless Function - AI Radar newsletter sender
// GET  /api/newsletter-send              cron: sends due scheduled issues
// POST /api/newsletter-send { issueId }  panel: dry run, test send, or live send

const { createHash, createHmac, createSign } = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ai-team-zlecenia";
const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY || ["AIzaSyDKmfXRkX", "BhYa6yk9idY4QFZdRRhU5eV9I"].join("");
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const RESERVED_PLACEHOLDERS = new Set(["amazonSESUnsubscribeUrl"]);

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const token = await requireCronToken(req);
      const result = await sendDueIssues({ token });
      return sendJson(res, 200, result);
    }

    if (req.method !== "POST") {
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    const body = parseBody(req);
    const token = await requirePanelOrServerToken(req);
    const issueId = String(body.issueId || body.id || "").trim();
    if (!issueId) return sendJson(res, 400, { ok: false, error: "Brak issueId." });

    const result = await sendIssueById(issueId, {
      token,
      dryRun: body.dryRun !== false && body.mode !== "send",
      resend: body.resend === true,
      testTo: cleanEmail(body.testTo || ""),
      limit: parseLimit(body.limit),
    });

    return sendJson(res, 200, result);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("newsletter-send error:", safeError(error));
    return sendJson(res, status, { ok: false, error: error.publicMessage || error.message || "Błąd wysyłki." });
  }
};

async function sendDueIssues({ token }) {
  const allIssues = await listNewsletterIssues(token);
  const now = Date.now();
  const dueIssues = allIssues
    .filter((issue) => ["scheduled", "sending", "partial"].includes(issue.status || "scheduled"))
    .filter((issue) => {
      const scheduledAt = Date.parse(issue.scheduled_at || issue.scheduledAt || "");
      return Number.isFinite(scheduledAt) && scheduledAt <= now;
    })
    .slice(0, Number(process.env.NEWSLETTER_CRON_ISSUE_LIMIT || 3));

  const results = [];
  for (const issue of dueIssues) {
    results.push(await sendIssue(issue, {
      token,
      dryRun: false,
      resend: false,
      limit: parseLimit(process.env.NEWSLETTER_BATCH_LIMIT || 25),
    }));
  }

  return {
    ok: true,
    mode: "cron",
    due: dueIssues.length,
    processed: results.length,
    results,
  };
}

async function sendIssueById(issueId, options) {
  const issue = await getNewsletterIssue(issueId, options.token);
  if (!issue) {
    const error = new Error(`Nie znaleziono wydania ${issueId}.`);
    error.statusCode = 404;
    throw error;
  }
  return sendIssue(issue, options);
}

async function sendIssue(issue, options) {
  const dryRun = Boolean(options.dryRun);
  const testTo = cleanEmail(options.testTo || "");
  const limit = Number(options.limit || process.env.NEWSLETTER_BATCH_LIMIT || 25);
  const issueId = issue.id;
  const subject = issue.subject || issue.name || issue.title || "AI Radar";

  if (!issue.text && !issue.html) {
    throw publicError(400, "Wydanie nie ma treści text/html do wysyłki.");
  }

  await upsertNewsletterIssueMetadata(issue, options.token, {
    status: issue.status || "scheduled",
    last_checked_at: new Date().toISOString(),
  });

  const subscribers = testTo
    ? [testSubscriber(testTo)]
    : await listEligibleSubscribers(issue, options.token);

  const existingSends = testTo ? [] : await listIssueSends(issueId, options.token);
  const sentRecipientIds = new Set(
    existingSends
      .filter((send) => ["sent", "delivered", "opened", "clicked"].includes(send.status))
      .map((send) => send.subscriber_id)
  );

  const candidates = subscribers
    .filter((subscriber) => options.resend || testTo || !sentRecipientIds.has(subscriber.id))
    .slice(0, limit);

  if (dryRun) {
    return {
      ok: true,
      mode: testTo ? "test-dry-run" : "dry-run",
      issueId,
      subject,
      eligible: subscribers.length,
      skippedAlreadySent: Math.max(0, subscribers.length - candidates.length),
      planned: candidates.length,
      recipients: candidates.map((subscriber) => subscriber.email),
    };
  }

  const aws = getAwsConfig();
  const results = [];
  let sent = 0;
  let failed = 0;

  if (!testTo) {
    await upsertNewsletterIssueMetadata(issue, options.token, {
      status: "sending",
      send_started_at: new Date().toISOString(),
    });
  }

  for (const subscriber of candidates) {
    const rendered = renderIssueForSubscriber(issue, subscriber, { testTo });
    const sendDocId = buildSendDocId(issueId, subscriber.id);
    const startedAt = new Date().toISOString();

    try {
      const sesResult = await sendSesEmail(rendered, aws);
      sent += 1;

      const item = {
        id: sendDocId,
        issue_id: issueId,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        status: "sent",
        subject: rendered.subject,
        ses_message_id: sesResult.MessageId || "",
        test: Boolean(testTo),
        started_at: startedAt,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      results.push(item);

      if (!testTo) await setDoc(`newsletter_sends/${sendDocId}`, item, options.token);
    } catch (error) {
      failed += 1;
      const item = {
        id: sendDocId,
        issue_id: issueId,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        status: "failed",
        subject: rendered.subject,
        test: Boolean(testTo),
        error: error.message || "SES send failed",
        started_at: startedAt,
        updated_at: new Date().toISOString(),
      };
      results.push(item);
      if (!testTo) await setDoc(`newsletter_sends/${sendDocId}`, item, options.token);
    }

    const delayMs = Number(process.env.NEWSLETTER_SEND_DELAY_MS || 250);
    if (delayMs > 0 && candidates.length > 1) await sleep(delayMs);
  }

  if (!testTo) {
    const updatedSends = await listIssueSends(issueId, options.token);
    const sentCount = updatedSends.filter((send) =>
      ["sent", "delivered", "opened", "clicked"].includes(send.status)
    ).length;
    const done = failed === 0 && sentCount >= subscribers.length;

    await upsertNewsletterIssueMetadata(issue, options.token, {
      status: done ? "sent" : "partial",
      sent_count: sentCount,
      eligible_count: subscribers.length,
      last_send_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return {
    ok: failed === 0,
    mode: testTo ? "test-send" : "send",
    issueId,
    subject,
    eligible: subscribers.length,
    attempted: candidates.length,
    sent,
    failed,
    recipients: results.map((item) => ({ email: item.email, status: item.status, error: item.error || "" })),
  };
}

async function getNewsletterIssue(issueId, token) {
  const localIssues = loadLocalIssues();
  const localIssue = localIssues.find((issue) => issue.id === issueId);

  try {
    const remote = await getDoc(`newsletter_issues/${issueId}`, token);
    if (remote) return normalizeIssue({ ...(localIssue || {}), ...remote });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }

  return localIssue ? normalizeIssue(localIssue) : null;
}

async function listNewsletterIssues(token) {
  const localIssues = loadLocalIssues();
  let remoteIssues = [];

  try {
    remoteIssues = await listCollection("newsletter_issues", token);
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }

  const byId = new Map(localIssues.map((issue) => [issue.id, issue]));
  for (const remote of remoteIssues) {
    byId.set(remote.id, normalizeIssue({ ...(byId.get(remote.id) || {}), ...remote }));
  }

  return [...byId.values()].map(normalizeIssue);
}

function loadLocalIssues() {
  const dir = path.join(process.cwd(), "newsletter");
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        return normalizeIssue({
          ...raw,
          source: raw.source || "local-file",
          preview_url: raw.preview_url || `/newsletter/${file.replace(/\.json$/, ".html")}`,
        });
      } catch (error) {
        console.warn(`Skipping invalid newsletter issue ${file}:`, error.message);
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeIssue(issue) {
  return {
    ...issue,
    id: String(issue.id || "").trim(),
    number: issue.number || "",
    name: issue.name || issue.title || issue.id || "AI Radar",
    title: issue.title || issue.name || "AI Radar",
    group: issue.group || "ai-radar",
    status: issue.status || "draft",
    scheduled_at: issue.scheduled_at || issue.scheduledAt || "",
    preheader: issue.preheader || issue.data?.preheader || "",
    data: issue.data || {},
  };
}

async function listEligibleSubscribers(issue, token) {
  const all = await listCollection("newsletter_subscribers", token);
  const group = issue.group || "ai-radar";

  return all
    .filter((subscriber) => cleanEmail(subscriber.email))
    .filter((subscriber) => (subscriber.status || "active") === "active")
    .filter((subscriber) => subscriber.consent?.newsletter === true)
    .filter((subscriber) => group === "all" || subscriber.group === group || (subscriber.groups || []).includes(group))
    .map((subscriber) => ({
      ...subscriber,
      id: subscriber.id || docIdFromEmail(subscriber.email),
      email: cleanEmail(subscriber.email),
    }));
}

async function listIssueSends(issueId, token) {
  const sends = await listCollection("newsletter_sends", token).catch((error) => {
    if (error.statusCode === 404) return [];
    throw error;
  });
  return sends.filter((send) => send.issue_id === issueId);
}

async function upsertNewsletterIssueMetadata(issue, token, extra = {}) {
  const metadata = {
    id: issue.id,
    number: issue.number || "",
    name: issue.name || issue.title || issue.id,
    title: issue.title || issue.name || "AI Radar",
    subject: issue.subject || "",
    preheader: issue.preheader || issue.data?.preheader || "",
    group: issue.group || "ai-radar",
    status: issue.status || "draft",
    scheduled_at: issue.scheduled_at || "",
    preview_url: issue.preview_url || "",
    source: issue.source || "firestore",
    updated_at: new Date().toISOString(),
    ...extra,
  };
  await setDoc(`newsletter_issues/${issue.id}`, metadata, token, Object.keys(metadata));
}

function renderIssueForSubscriber(issue, subscriber, options = {}) {
  const data = {
    ...(issue.data || {}),
    campaign_id: issue.id,
    campaign_name: issue.name || issue.title || issue.id,
    issue_id: issue.id,
    issue_number: issue.number || issue.data?.issue_number || "",
    issue_title: issue.title || issue.name || "AI Radar",
    email: subscriber.email,
    email_encoded: encodeURIComponent(subscriber.email || ""),
    name: subscriber.name || "",
    first_name: firstName(subscriber.name),
    firstName: firstName(subscriber.name),
    group: subscriber.group || "",
    source: subscriber.source || "",
    subscriber_id: subscriber.id || "",
  };

  return {
    campaignId: issue.id,
    contactId: subscriber.id,
    to: subscriber.email,
    from: issue.from || process.env.SES_FROM || "",
    replyTo: issue.replyTo || process.env.SES_REPLY_TO || "",
    configurationSetName: issue.configurationSetName || process.env.SES_CONFIGURATION_SET || "",
    contactListName: issue.contactListName || process.env.SES_CONTACT_LIST || "",
    topicName: issue.topicName || process.env.SES_TOPIC || "",
    subject: `${options.testTo ? "[TEST] " : ""}${renderTemplate(issue.subject || issue.name || issue.title, data)}`,
    text: renderTemplate(issue.text || "", data),
    html: renderTemplate(issue.html || "", data),
    tags: {
      newsletter: "ai_radar",
      issue: issue.id,
      subscriber: subscriber.id || "",
      test: options.testTo ? "true" : "false",
    },
  };
}

function renderTemplate(template, data) {
  return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    if (RESERVED_PLACEHOLDERS.has(key)) return match;
    const value = key.split(".").reduce((current, part) => current && current[part], data);
    if (value === undefined || value === null || value === "") return match;
    return String(value);
  });
}

async function requirePanelOrServerToken(req) {
  const bearer = bearerToken(req);
  const cronSecret = getCronSecret();

  if (bearer && bearer !== cronSecret) return bearer;
  if (bearer && cronSecret && bearer === cronSecret) return getServerFirestoreToken();

  throw publicError(401, "Brak autoryzacji panelu.");
}

async function requireCronToken(req) {
  const cronSecret = getCronSecret();
  const bearer = bearerToken(req);

  if (!cronSecret) {
    throw publicError(500, "Brak sekretu crona w Vercel.");
  }

  if (bearer !== cronSecret) {
    throw publicError(401, "Brak autoryzacji crona.");
  }

  return getServerFirestoreToken();
}

function getCronSecret() {
  return process.env.NEWSLETTER_CRON_SECRET || process.env.CRON_SECRET || "";
}

async function getServerFirestoreToken() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return getServiceAccountAccessToken(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_AUTH_EMAIL && process.env.FIREBASE_AUTH_PASSWORD) {
    return signInWithPassword(process.env.FIREBASE_AUTH_EMAIL, process.env.FIREBASE_AUTH_PASSWORD);
  }

  throw publicError(500, "Brak FIREBASE_SERVICE_ACCOUNT_JSON albo FIREBASE_AUTH_EMAIL/FIREBASE_AUTH_PASSWORD w Vercel.");
}

async function signInWithPassword(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.idToken) {
    throw publicError(500, "Nie udało się zalogować użytkownika technicznego Firebase.");
  }
  return body.idToken;
}

async function getServiceAccountAccessToken(rawJson) {
  let account;
  try {
    account = JSON.parse(rawJson);
  } catch {
    throw publicError(500, "FIREBASE_SERVICE_ACCOUNT_JSON nie jest poprawnym JSON.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(account.private_key);
  const assertion = `${unsigned}.${base64url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw publicError(500, "Nie udało się pobrać tokenu Firebase service account.");
  }
  return body.access_token;
}

async function listCollection(collection, token) {
  const docs = [];
  let pageToken = "";

  do {
    const url = new URL(`${FIRESTORE_BASE}/${collection}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const body = await firestoreRequest(url, { method: "GET", token });
    for (const document of body.documents || []) docs.push(decodeDocument(document));
    pageToken = body.nextPageToken || "";
  } while (pageToken);

  return docs;
}

async function getDoc(docPath, token) {
  try {
    const body = await firestoreRequest(`${FIRESTORE_BASE}/${docPath}`, { method: "GET", token });
    return decodeDocument(body);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

async function setDoc(docPath, data, token, updateFields = null) {
  const url = new URL(`${FIRESTORE_BASE}/${docPath}`);
  if (Array.isArray(updateFields) && updateFields.length) {
    for (const field of updateFields) url.searchParams.append("updateMask.fieldPaths", field);
  }

  return firestoreRequest(url, {
    method: "PATCH",
    token,
    body: { fields: encodeFields(data) },
  });
}

async function firestoreRequest(url, { method, token, body }) {
  const response = await fetch(String(url), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = publicError(response.status, responseBody.error?.message || "Firestore request failed.");
    error.statusCode = response.status;
    throw error;
  }
  return responseBody;
}

function decodeDocument(document) {
  if (!document) return null;
  const id = String(document.name || "").split("/").pop();
  return { id, ...decodeFields(document.fields || {}) };
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function decodeValue(value) {
  if (Object.hasOwn(value, "stringValue")) return value.stringValue;
  if (Object.hasOwn(value, "booleanValue")) return value.booleanValue;
  if (Object.hasOwn(value, "integerValue")) return Number(value.integerValue);
  if (Object.hasOwn(value, "doubleValue")) return Number(value.doubleValue);
  if (Object.hasOwn(value, "timestampValue")) return value.timestampValue;
  if (Object.hasOwn(value, "arrayValue")) return (value.arrayValue.values || []).map(decodeValue);
  if (Object.hasOwn(value, "mapValue")) return decodeFields(value.mapValue.fields || {});
  if (Object.hasOwn(value, "nullValue")) return null;
  return undefined;
}

function encodeFields(data) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encodeValue(value)])
  );
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") return { mapValue: { fields: encodeFields(value) } };
  return { stringValue: String(value) };
}

async function sendSesEmail(input, aws) {
  const payload = buildSesPayload(input);
  const result = await signedJsonRequest({
    method: "POST",
    service: "ses",
    region: aws.region,
    host: `email.${aws.region}.amazonaws.com`,
    path: "/v2/email/outbound-emails",
    body: payload,
    credentials: aws.credentials,
  });

  if (!result.ok) {
    throw new Error(`SES ${result.status}: ${JSON.stringify(result.body)}`);
  }

  return result.body;
}

function buildSesPayload(input) {
  if (!input.from) throw new Error("Missing SES_FROM.");
  if (!input.to) throw new Error("Missing recipient.");
  if (!input.subject) throw new Error("Missing subject.");
  if (!input.text && !input.html) throw new Error("Missing text/html body.");
  if (hasSesUnsubscribePlaceholder(input) && !input.contactListName) {
    throw new Error("SES unsubscribe placeholder requires SES_CONTACT_LIST.");
  }

  const body = {};
  if (input.text) body.Text = { Data: input.text, Charset: "UTF-8" };
  if (input.html) body.Html = { Data: input.html, Charset: "UTF-8" };

  const payload = {
    FromEmailAddress: input.from,
    Destination: { ToAddresses: [input.to] },
    Content: {
      Simple: {
        Subject: { Data: input.subject, Charset: "UTF-8" },
        Body: body,
      },
    },
  };

  if (input.replyTo) payload.ReplyToAddresses = [input.replyTo];
  if (input.configurationSetName) payload.ConfigurationSetName = input.configurationSetName;

  const tags = Object.entries(input.tags || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([Name, Value]) => ({ Name: sesTag(Name), Value: sesTag(Value) }))
    .filter((tag) => tag.Name && tag.Value);
  if (tags.length) payload.EmailTags = tags.slice(0, 50);

  if (input.contactListName) {
    payload.ListManagementOptions = { ContactListName: input.contactListName };
    if (input.topicName) payload.ListManagementOptions.TopicName = input.topicName;
  }

  return payload;
}

async function signedJsonRequest({ method = "POST", service, region, host, path, body, credentials }) {
  const bodyText = body === undefined ? "" : JSON.stringify(body);
  const result = await signedRequest({
    method,
    service,
    region,
    host,
    path,
    bodyText,
    contentType: "application/json",
    credentials,
  });

  return { ...result, body: parseJson(result.text) };
}

async function signedRequest({ method, service, region, host, path, bodyText, contentType, credentials }) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(bodyText);

  const headers = {
    "content-type": contentType,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (credentials.sessionToken) headers["x-amz-security-token"] = credentials.sessionToken;

  const { canonicalHeaders, signedHeaders } = canonicalizeHeaders(headers);
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [algorithm, amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = getSignatureKey(credentials.secretAccessKey, dateStamp, region, service);
  const signature = hmacHex(signingKey, stringToSign);

  headers.authorization =
    `${algorithm} Credential=${credentials.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return httpsRequest({ method, host, path, headers, bodyText });
}

function httpsRequest({ method, host, path: requestPath, headers, bodyText }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, host, path: requestPath, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text });
      });
    });
    req.on("error", reject);
    if (bodyText) req.write(bodyText);
    req.end();
  });
}

function getAwsConfig() {
  const region = process.env.AWS_REGION || "eu-central-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN || "";

  if (!accessKeyId || !secretAccessKey) {
    throw publicError(500, "Brak AWS_ACCESS_KEY_ID albo AWS_SECRET_ACCESS_KEY w Vercel.");
  }

  return { region, credentials: { accessKeyId, secretAccessKey, sessionToken } };
}

function canonicalizeHeaders(headers) {
  const entries = Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), String(value).trim().replace(/\s+/g, " ")])
    .sort(([a], [b]) => a.localeCompare(b));

  return {
    canonicalHeaders: `${entries.map(([key, value]) => `${key}:${value}\n`).join("")}`,
    signedHeaders: entries.map(([key]) => key).join(";"),
  };
}

function getSignatureKey(secretAccessKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key, value) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function parseJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function hasSesUnsubscribePlaceholder(input) {
  return String(`${input.text || ""}\n${input.html || ""}`).includes("{{amazonSESUnsubscribeUrl}}");
}

function sesTag(value) {
  return String(value).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 256);
}

function bearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function parseLimit(value) {
  const limit = Number(value || 0);
  if (!Number.isFinite(limit) || limit <= 0) return 25;
  return Math.min(Math.floor(limit), 200);
}

function testSubscriber(email) {
  return {
    id: `test_${sha256Hex(email).slice(0, 16)}`,
    email,
    name: "Darek",
    group: "ai-radar",
    groups: ["ai-radar"],
    status: "active",
    consent: { newsletter: true },
    source: "panel-test",
  };
}

function buildSendDocId(issueId, subscriberId) {
  return `${safeId(issueId)}__${safeId(subscriberId)}`.slice(0, 140);
}

function safeId(value) {
  const clean = String(value || "").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 70);
  return clean || sha256Hex(String(value || "empty")).slice(0, 20);
}

function docIdFromEmail(email) {
  return cleanEmail(email).replace(/[^a-z0-9]/g, "_");
}

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function base64url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function publicError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function safeError(error) {
  return {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  };
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

// Named exports for reuse by sibling functions (e.g. api/mapa-send.js).
// Append-only — does not change the default handler export above.
Object.assign(module.exports, {
  getServerFirestoreToken,
  setDoc,
  getDoc,
  sendSesEmail,
  getAwsConfig,
  setCors,
  sendJson,
  parseBody,
  cleanEmail,
  publicError,
  firstName,
  docIdFromEmail,
  renderIssueForSubscriber,
  buildSesPayload,
});
