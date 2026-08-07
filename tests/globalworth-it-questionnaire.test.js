const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const modulePath = path.join(__dirname, '..', 'globalworth', 'assets', 'it-questionnaire.js');
const api = require(modulePath);

test('eksportuje kontrakt formularza i trwałego zapisu', () => {
  assert.equal(typeof api.createEmptyResponse, 'function');
  assert.equal(typeof api.validateAnswer, 'function');
  assert.equal(typeof api.validateResponse, 'function');
  assert.equal(typeof api.summarizeResponse, 'function');
  assert.equal(typeof api.LocalStorageAdapter, 'function');
  assert.equal(typeof api.submitFinal, 'function');
});

test('zawiera pięć grup i szesnaście stabilnych pytań', () => {
  const questions = api.QUESTION_GROUPS.flatMap((group) => group.questions);
  assert.equal(api.QUESTION_GROUPS.length, 5);
  assert.equal(questions.length, 16);
  assert.equal(new Set(questions.map((question) => question.id)).size, 16);
  assert.equal(questions[0].id, 'it-tools-01');
  assert.equal(questions.at(-1).id, 'it-owner-16');
});

test('nowy szkic wymaga potwierdzenia komunikatu o danych', () => {
  const response = api.createEmptyResponse('2026-08-07T10:00:00.000Z', 'response-1');
  assert.equal(response.schemaVersion, 1);
  assert.equal(response.projectId, 'globalworth-property-ai');
  assert.equal(response.responseId, 'response-1');
  assert.equal(response.status, 'draft');
  assert.equal(response.dataNoticeAccepted, false);
  assert.equal(response.website, '');
  assert.equal(Object.keys(response.answers).length, 16);
});

test('wymaga szczegółów dla odpowiedzi i ostrzega o krótkiej treści', () => {
  assert.deepEqual(api.validateAnswer({ state: 'answered', detail: '' }).errors, ['detail']);
  assert.equal(api.validateAnswer({ state: 'answered', detail: 'Copilot jest dopuszczony.' }).qualityWarning, true);
  assert.equal(api.validateAnswer({
    state: 'answered',
    detail: 'Microsoft Copilot jest dopuszczony w firmowym tenantcie i podlega wewnętrznej polityce danych.',
  }).qualityWarning, false);
});

test('wymaga przyczyny dla nie dotyczy oraz właściciela dla do ustalenia', () => {
  assert.deepEqual(
    api.validateAnswer({ state: 'not_applicable', notApplicableReason: '' }).errors,
    ['notApplicableReason']
  );
  assert.deepEqual(
    api.validateAnswer({ state: 'needs_clarification', missingInfo: '', owner: '' }).errors,
    ['missingInfo', 'owner']
  );
});

test('waliduje 16 odpowiedzi i potwierdzenie komunikatu przed finalizacją', () => {
  const response = completeResponse();
  response.dataNoticeAccepted = false;
  assert.equal(api.validateResponse(response).complete, false);
  assert.deepEqual(api.validateResponse(response).respondentErrors, ['dataNoticeAccepted']);
  response.dataNoticeAccepted = true;
  assert.equal(api.validateResponse(response).complete, true);
});

test('zapis finalny wysyła JSON do API i zwraca numer zapisu', async () => {
  const calls = [];
  const response = completeResponse();
  const result = await api.submitFinal(response, async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        ok: true,
        submissionId: 'response-1',
        submittedAt: '2026-08-07T11:00:00.000Z',
      }),
    };
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/globalworth-it-submit');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(JSON.parse(calls[0].options.body).answers['it-owner-16'].state, 'not_applicable');
  assert.equal(result.submissionId, 'response-1');
});

test('błąd finalnego zapisu nie jest traktowany jak sukces', async () => {
  await assert.rejects(
    () => api.submitFinal(completeResponse(), async () => ({
      ok: false,
      json: async () => ({ ok: false, error: 'Baza jest chwilowo niedostępna.' }),
    })),
    /Baza jest chwilowo niedostępna/
  );
});

test('zapisuje i odczytuje szkic z localStorage', () => {
  const storage = new MemoryStorage();
  const adapter = new api.LocalStorageAdapter(storage);
  const response = api.createEmptyResponse('2026-08-07T10:00:00.000Z', 'response-4');
  adapter.save(response);
  assert.deepEqual(adapter.load(), response);
  adapter.clear();
  assert.equal(adapter.load(), null);
});

test('ucieka dane użytkownika przy prezentacji HTML', () => {
  assert.equal(api.escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('buduje eksport ze wszystkimi pytaniami', () => {
  const response = completeResponse();
  const payload = api.buildExportPayload(response);
  assert.equal(payload.groups.length, 5);
  assert.equal(payload.groups.flatMap((group) => group.answers).length, 16);
});

function completeResponse() {
  const response = api.createEmptyResponse('2026-08-07T10:00:00.000Z', 'response-1');
  response.respondent = { name: 'Anna Kowalska', email: 'anna@globalworth.pl', role: 'IT' };
  response.dataNoticeAccepted = true;
  for (const answer of Object.values(response.answers)) {
    answer.state = 'not_applicable';
    answer.notApplicableReason = 'Pytanie nie dotyczy obecnego procesu i zostało sprawdzone z jego właścicielem.';
  }
  return response;
}

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
