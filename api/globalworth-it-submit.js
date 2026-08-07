const {
  buildFirestoreDocument,
  documentPathFor,
  normalizeSubmission,
  validateSubmission,
} = require('./_globalworth-it');
const firestore = require('./_async-firestore');

const ALLOWED_ORIGINS = new Set([
  'https://ai-team.pl',
  'https://www.ai-team.pl',
]);
const MAX_BODY_BYTES = 100000;

function createHandler(dependencies) {
  const deps = {
    getServerFirestoreToken: firestore.getServerFirestoreToken,
    getDoc: firestore.getDoc,
    setDoc: firestore.setDoc,
    now: () => new Date().toISOString(),
    logger: console,
    ...(dependencies || {}),
  };

  return async function handler(req, res) {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
      if (!allowedOrigin(req)) return sendJson(res, 403, { ok: false, error: 'Niedozwolone źródło żądania.' });
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    }
    if (!allowedOrigin(req)) {
      return sendJson(res, 403, { ok: false, error: 'Niedozwolone źródło żądania.' });
    }

    try {
      const body = parseBody(req);
      if (byteLength(body) > MAX_BODY_BYTES) {
        return sendJson(res, 413, { ok: false, error: 'Formularz jest zbyt duży.' });
      }
      if (clean(body.website)) return sendJson(res, 200, { ok: true, skipped: true });

      const submission = normalizeSubmission(body);
      validateSubmission(submission);
      const documentPath = documentPathFor(submission.responseId);
      const token = await deps.getServerFirestoreToken();
      const existing = await deps.getDoc(documentPath, token);
      if (existing && existing.status === 'submitted' && existing.response_id === submission.responseId) {
        return sendJson(res, 200, {
          ok: true,
          submissionId: submission.responseId,
          submittedAt: existing.submitted_at,
        });
      }
      if (existing) {
        const conflict = new Error('Ten identyfikator odpowiedzi jest już zajęty.');
        conflict.statusCode = 409;
        conflict.publicMessage = conflict.message;
        throw conflict;
      }
      const submittedAt = deps.now();
      const document = buildFirestoreDocument(submission, submittedAt);
      await deps.setDoc(documentPath, document, token);

      return sendJson(res, 200, {
        ok: true,
        submissionId: submission.responseId,
        submittedAt,
      });
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      if (status >= 500) deps.logger.error('globalworth-it-submit error:', safeError(error));
      if (status >= 500) {
        return sendJson(res, 500, {
          ok: false,
          error: 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.',
        });
      }
      return sendJson(res, status, {
        ok: false,
        error: error.publicMessage || error.message || 'Nieprawidłowe dane formularza.',
      });
    }
  };
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      const error = new Error('Nieprawidłowy format JSON.');
      error.statusCode = 400;
      error.publicMessage = error.message;
      throw error;
    }
  }
  return req.body;
}

function byteLength(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value || {}), 'utf8');
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

function clean(value) {
  return String(value || '').trim();
}

function allowedOrigin(req) {
  const origin = clean(req && req.headers && (req.headers.origin || req.headers.Origin));
  return ALLOWED_ORIGINS.has(origin);
}

function setCors(req, res) {
  const origin = clean(req && req.headers && (req.headers.origin || req.headers.Origin));
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function safeError(error) {
  return {
    message: error && error.message,
    statusCode: error && error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? error && error.stack : undefined,
  };
}

function sendJson(res, status, value) {
  return res.status(status).json(value);
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.allowedOrigin = allowedOrigin;
