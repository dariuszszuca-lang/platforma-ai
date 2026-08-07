const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createHandler } = require('../api/globalworth-it-submit');

test('serwerowe helpery nie zawierają zapasowego klucza Firebase w kodzie', () => {
  for (const file of ['_async-firestore.js', 'newsletter-send.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'api', file), 'utf8');
    assert.doesNotMatch(source, /AIzaSy/);
    assert.match(source, /process\.env\.FIREBASE_API_KEY/);
  }
});

test('konfiguracja klienta Firebase pochodzi z env i nie jest cachowana', () => {
  const handler = createHandler({
    env: {
      FIREBASE_API_KEY: 'test-public-key',
      FIREBASE_PROJECT_ID: 'test-project',
    },
  });
  const res = responseRecorder();
  handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.match(res.textBody, /window\.__AITEAM_FIREBASE_CONFIG__/);
  assert.match(res.textBody, /test-public-key/);
});

function validPayload() {
  const ids = [
    'it-tools-01', 'it-tools-02', 'it-tools-03',
    'it-systems-04', 'it-systems-05', 'it-systems-06', 'it-systems-07',
    'it-data-08', 'it-data-09', 'it-data-10',
    'it-security-11', 'it-security-12', 'it-security-13', 'it-security-14', 'it-security-15',
    'it-owner-16',
  ];
  return {
    schemaVersion: 1,
    projectId: 'globalworth-property-ai',
    responseId: 'response-abc12345',
    status: 'draft',
    respondent: { name: 'Jan Kowalski', email: 'jan.kowalski@globalworth.com', role: 'IT' },
    dataNoticeAccepted: true,
    createdAt: '2026-08-07T08:00:00.000Z',
    updatedAt: '2026-08-07T09:00:00.000Z',
    answers: Object.fromEntries(ids.map((id) => [id, {
      state: 'answered',
      detail: 'Obowiązuje zatwierdzona procedura i wskazany właściciel procesu po stronie IT.',
      source: 'Polityka wewnętrzna IT',
    }])),
  };
}

function requestWith(body, overrides) {
  return {
    method: 'POST',
    headers: { origin: 'https://ai-team.pl', 'content-type': 'application/json' },
    body,
    ...(overrides || {}),
  };
}

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.textBody = value; return this; },
    end() { this.ended = true; return this; },
  };
}

function testHandler(overrides) {
  const writes = [];
  const handler = createHandler({
    getServerFirestoreToken: async () => 'server-token',
    getDoc: async () => null,
    setDoc: async (path, doc, token) => writes.push({ path, doc, token }),
    now: () => '2026-08-07T10:00:00.000Z',
    logger: { error() {} },
    ...(overrides || {}),
  });
  return { handler, writes };
}

test('odrzuca metodę inną niż POST', async () => {
  const { handler } = testHandler();
  const res = responseRecorder();
  await handler({ method: 'PUT', headers: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.ok, false);
});

test('odrzuca przeglądarkowy zapis z obcego origin', async () => {
  const { handler, writes } = testHandler();
  const res = responseRecorder();
  await handler(requestWith(validPayload(), { headers: { origin: 'https://example.com' } }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(writes.length, 0);
});

test('odrzuca zapis bez nagłówka origin', async () => {
  const { handler, writes } = testHandler();
  const res = responseRecorder();
  await handler(requestWith(validPayload(), { headers: { 'content-type': 'application/json' } }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(writes.length, 0);
});

test('pole-pułapka kończy żądanie bez zapisu', async () => {
  const { handler, writes } = testHandler();
  const res = responseRecorder();
  await handler(requestWith({ ...validPayload(), website: 'https://spam.example' }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true, skipped: true });
  assert.equal(writes.length, 0);
});

test('nie zapisuje niekompletnego formularza', async () => {
  const { handler, writes } = testHandler();
  const payload = validPayload();
  payload.answers['it-owner-16'].detail = '';
  const res = responseRecorder();
  await handler(requestWith(payload), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /szczegółową odpowiedź/i);
  assert.equal(writes.length, 0);
});

test('zapisuje kompletną odpowiedź pod stabilną ścieżką', async () => {
  const { handler, writes } = testHandler();
  const res = responseRecorder();
  await handler(requestWith(validPayload()), res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    ok: true,
    submissionId: 'response-abc12345',
    submittedAt: '2026-08-07T10:00:00.000Z',
  });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, 'globalworth_it_responses/response-abc12345');
  assert.equal(writes[0].token, 'server-token');
  assert.equal(writes[0].doc.status, 'submitted');
});

test('ponowienie zakończonego zapisu nie aktualizuje dokumentu ani nie tworzy duplikatu', async () => {
  const { handler, writes } = testHandler({
    getDoc: async () => ({
      response_id: 'response-abc12345',
      status: 'submitted',
      submitted_at: '2026-08-07T09:30:00.000Z',
    }),
  });
  const res = responseRecorder();
  await handler(requestWith(validPayload()), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.submissionId, 'response-abc12345');
  assert.equal(res.body.submittedAt, '2026-08-07T09:30:00.000Z');
  assert.equal(writes.length, 0);
});

test('błąd Firestore nie ujawnia szczegółów serwera', async () => {
  const { handler } = testHandler({
    setDoc: async () => { throw new Error('private credential detail'); },
  });
  const res = responseRecorder();
  await handler(requestWith(validPayload()), res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { ok: false, error: 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.' });
});
