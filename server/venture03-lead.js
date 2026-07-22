const { createHash } = require('crypto');
const lib = require('../api/newsletter-send.js');

const COLLECTION = 'venture_03_leads';
const PRODUCT = 'mapa-wdrozenia-ai';
const CONSENT_TEXT = 'Zgoda na zapis wyniku diagnozy i kontakt mailowy AI-Team dotyczący Mapy Wdrożenia AI.';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function validationError(message) {
  return lib.publicError(400, message);
}

function leadDocumentId(email) {
  return createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex');
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanUtm(input) {
  const source = input && typeof input === 'object' ? input : {};
  return Object.fromEntries(
    UTM_KEYS
      .map((key) => [key, cleanText(source[key], 160)])
      .filter(([, value]) => value)
  );
}

function normalizeLeadInput(input) {
  const body = input && typeof input === 'object' ? input : {};
  const email = lib.cleanEmail(body.email);
  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on';
  const stage = Number(body.stage);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError('Podaj poprawny adres email.');
  }
  if (!consent) {
    throw validationError('Zaznacz zgodę na zapis wyniku i kontakt dotyczący Mapy.');
  }
  if (!Number.isInteger(stage) || stage < 0 || stage > 5) {
    throw validationError('Nieprawidłowy wynik diagnozy.');
  }

  return {
    email,
    stage,
    stageName: cleanText(body.stageName, 120),
    pageUrl: cleanText(body.pageUrl, 700),
    referrer: cleanText(body.referrer, 700),
    utm: cleanUtm(body.utm),
  };
}

function buildLeadDocument(lead, now = new Date().toISOString(), existing = null) {
  const id = leadDocumentId(lead.email);
  return {
    id,
    product: PRODUCT,
    status: existing && existing.status ? existing.status : 'new',
    source: 'mapa-wdrozenia-quiz',
    email: lead.email,
    quiz: {
      stage: lead.stage,
      stage_name: lead.stageName,
    },
    attribution: {
      page_url: lead.pageUrl,
      referrer: lead.referrer,
      utm: lead.utm,
    },
    consent: {
      contact: true,
      text: CONSENT_TEXT,
      accepted_at: now,
      privacy_url: 'https://ai-team.pl/privacy',
      privacy_version: '2026-07-22',
    },
    created_at: existing && existing.created_at ? existing.created_at : now,
    updated_at: now,
    last_signup_at: now,
  };
}

async function saveVenture03Lead(input) {
  const lead = normalizeLeadInput(input);
  const id = leadDocumentId(lead.email);
  const token = await lib.getServerFirestoreToken();
  const existing = await lib.getDoc(`${COLLECTION}/${id}`, token);
  const document = buildLeadDocument(lead, new Date().toISOString(), existing);
  await lib.setDoc(`${COLLECTION}/${id}`, document, token);
  return { ok: true, lead_id: id, stage: lead.stage };
}

module.exports = {
  COLLECTION,
  normalizeLeadInput,
  buildLeadDocument,
  leadDocumentId,
  saveVenture03Lead,
};
