const test = require('node:test');
const assert = require('node:assert/strict');

const {
  COLLECTION,
  normalizeLeadInput,
  buildLeadDocument,
  leadDocumentId,
} = require('../server/venture03-lead.js');
const mapaSendHandler = require('../api/mapa-send.js');

test('normalizuje poprawny lead i zachowuje wyłącznie dozwolone UTM', () => {
  const lead = normalizeLeadInput({
    email: '  TEST@Example.COM ',
    stage: '3',
    stageName: 'Etap 3 · Procesy',
    consent: true,
    pageUrl: 'https://ai-team.pl/mapa-wdrozenia-diagnoza?utm_source=meta',
    referrer: 'https://facebook.com/',
    utm: {
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: 'mapa_wdrozenia_2026_07',
      utm_content: 'k1',
      utm_term: 'broad',
      email: 'nie-wolno@example.com',
    },
  });

  assert.equal(lead.email, 'test@example.com');
  assert.equal(lead.stage, 3);
  assert.equal(lead.stageName, 'Etap 3 · Procesy');
  assert.deepEqual(lead.utm, {
    utm_source: 'meta',
    utm_medium: 'paid_social',
    utm_campaign: 'mapa_wdrozenia_2026_07',
    utm_content: 'k1',
    utm_term: 'broad',
  });
});

test('odrzuca lead bez zgody', () => {
  assert.throws(
    () => normalizeLeadInput({ email: 'test@example.com', stage: 2, consent: false }),
    (error) => error.statusCode === 400 && /zgod/i.test(error.message)
  );
});

test('odrzuca wynik spoza etapów 0 do 5', () => {
  assert.throws(
    () => normalizeLeadInput({ email: 'test@example.com', stage: 6, consent: true }),
    (error) => error.statusCode === 400 && /wynik/i.test(error.message)
  );
});

test('buduje izolowany dokument VENTURE-03 z treścią zgody', () => {
  const lead = normalizeLeadInput({
    email: 'test@example.com',
    stage: 1,
    stageName: 'Etap 1 · Porządek',
    consent: true,
    pageUrl: 'https://ai-team.pl/mapa-wdrozenia-diagnoza',
    referrer: '',
    utm: { utm_source: 'meta' },
  });
  const now = '2026-07-22T12:00:00.000Z';
  const document = buildLeadDocument(lead, now);

  assert.equal(COLLECTION, 'venture_03_leads');
  assert.equal(document.product, 'mapa-wdrozenia-ai');
  assert.equal(document.source, 'mapa-wdrozenia-quiz');
  assert.equal(document.email, 'test@example.com');
  assert.equal(document.quiz.stage, 1);
  assert.equal(document.consent.contact, true);
  assert.equal(document.consent.accepted_at, now);
  assert.match(document.consent.text, /Mapy Wdrożenia AI/);
});

test('identyfikator dokumentu jest skrótem i nie ujawnia emaila', () => {
  const id = leadDocumentId('test@example.com');
  assert.match(id, /^[a-f0-9]{64}$/);
  assert.equal(id.includes('test'), false);
  assert.equal(id.includes('@'), false);
});

test('istniejąca funkcja Mapy obsługuje tryb venture03-lead bez uruchamiania generatora', async () => {
  const response = {
    statusCode: 0,
    payload: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return payload; },
    end() { return null; },
  };

  await mapaSendHandler({
    method: 'POST',
    headers: { origin: 'https://ai-team.pl', 'x-forwarded-for': '127.0.0.31' },
    body: { mode: 'venture03-lead', email: 'błędny-email', stage: 2, consent: true },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.payload.error, /email/i);
});
