const test = require('node:test');
const assert = require('node:assert/strict');

const {
  QUESTION_IDS,
  buildFirestoreDocument,
  documentPathFor,
  normalizeSubmission,
  summarizeSubmission,
  validateSubmission,
} = require('../api/_globalworth-it');

function answered(detail) {
  return {
    state: 'answered',
    detail: detail || 'Obowiązuje zatwierdzona procedura i wskazany właściciel procesu po stronie IT.',
    source: 'Polityka wewnętrzna IT',
  };
}

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
    respondent: {
      name: 'Jan Kowalski',
      email: 'JAN.KOWALSKI@GLOBALWORTH.COM',
      role: 'IT Security',
    },
    dataNoticeAccepted: true,
    createdAt: '2026-08-07T08:00:00.000Z',
    updatedAt: '2026-08-07T09:00:00.000Z',
    answers: Object.fromEntries(ids.map((id) => [id, answered()])),
  };
}

test('kontrakt zawiera dokładnie 16 pytań', () => {
  assert.equal(QUESTION_IDS.length, 16);
  assert.equal(new Set(QUESTION_IDS).size, 16);
});

test('normalizuje respondenta i akceptuje kompletny zestaw', () => {
  const value = normalizeSubmission(validPayload());
  assert.equal(value.respondent.email, 'jan.kowalski@globalworth.com');
  assert.equal(value.respondent.name, 'Jan Kowalski');
  assert.doesNotThrow(() => validateSubmission(value));
});

test('wymaga szczegółowej odpowiedzi dla stanu answered', () => {
  const payload = validPayload();
  payload.answers['it-tools-01'] = answered('Za krótko');
  assert.throws(
    () => validateSubmission(normalizeSubmission(payload)),
    (error) => error.statusCode === 400 && /szczegółową odpowiedź/i.test(error.message)
  );
});

test('wymaga brakującej informacji i właściciela dla do ustalenia', () => {
  const payload = validPayload();
  payload.answers['it-data-08'] = {
    state: 'needs_clarification',
    missingInfo: 'Do potwierdzenia przez zespół ochrony danych.',
    owner: '',
    targetDate: '2026-08-14',
  };
  assert.throws(
    () => validateSubmission(normalizeSubmission(payload)),
    (error) => error.statusCode === 400 && /właściciela/i.test(error.message)
  );
});

test('wymaga wyjaśnienia dlaczego pytanie nie dotyczy', () => {
  const payload = validPayload();
  payload.answers['it-systems-05'] = {
    state: 'not_applicable',
    notApplicableReason: '',
    confirmedBy: 'IT Operations',
  };
  assert.throws(
    () => validateSubmission(normalizeSubmission(payload)),
    (error) => error.statusCode === 400 && /dlaczego pytanie nie dotyczy/i.test(error.message)
  );
});

test('odrzuca nieznane pytania i brak potwierdzenia komunikatu o danych', () => {
  const unknown = validPayload();
  unknown.answers['it-secret-99'] = answered();
  assert.throws(
    () => validateSubmission(normalizeSubmission(unknown)),
    (error) => error.statusCode === 400 && /nieznane pytanie/i.test(error.message)
  );

  const noNotice = validPayload();
  noNotice.dataNoticeAccepted = false;
  assert.throws(
    () => validateSubmission(normalizeSubmission(noNotice)),
    (error) => error.statusCode === 400 && /komunikat o danych/i.test(error.message)
  );
});

test('buduje idempotentną ścieżkę i dokument bez danych technicznych przeglądarki', () => {
  const value = normalizeSubmission(validPayload());
  validateSubmission(value);
  const summary = summarizeSubmission(value);
  const document = buildFirestoreDocument(value, '2026-08-07T10:00:00.000Z');

  assert.equal(documentPathFor(value.responseId), 'globalworth_it_responses/response-abc12345');
  assert.equal(summary.complete, 16);
  assert.equal(summary.answered, 16);
  assert.equal(document.status, 'submitted');
  assert.equal(document.submitted_at, '2026-08-07T10:00:00.000Z');
  assert.equal(Object.hasOwn(document, 'ip'), false);
  assert.equal(Object.hasOwn(document, 'userAgent'), false);
});
