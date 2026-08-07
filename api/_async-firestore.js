const { createSign } = require("crypto");

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "ai-team-zlecenia";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function getServerFirestoreToken() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return getServiceAccountAccessToken(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_AUTH_EMAIL && process.env.FIREBASE_AUTH_PASSWORD) {
    if (!FIREBASE_API_KEY) {
      throw publicError(500, "Brak FIREBASE_API_KEY w Vercel.");
    }
    return signInWithPassword(process.env.FIREBASE_AUTH_EMAIL, process.env.FIREBASE_AUTH_PASSWORD);
  }

  throw publicError(500, "Brak FIREBASE_SERVICE_ACCOUNT_JSON albo FIREBASE_AUTH_EMAIL/FIREBASE_AUTH_PASSWORD w Vercel.");
}

async function signInWithPassword(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
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

module.exports = {
  getDoc,
  getServerFirestoreToken,
  publicError,
  setDoc,
};
