const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildAiActProductUrl,
  buildLeadReference,
} = require('../api/_ai-act-attribution.js');
const {
  buildCheckoutUrl,
  buildInitiateCheckoutParams,
  sanitizeTrackingValue,
} = require('../assets/ai-act-attribution.js');

const PAYMENT_LINK = 'https://buy.stripe.com/eVq8wOczQ1HU6J243c1kA0K';
const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('mail Meta ma pełne UTM i nie ujawnia emaila ani ID leada', () => {
  const url = buildAiActProductUrl({
    email: 'lead@example.com',
    secret: 'sekret-testowy',
    attribution: {
      lead_id: '987654321',
      campaign_id: '120249805466630295',
      adset_id: '120249805487990295',
      ad_id: '120250102620060295',
    },
  });
  const parsed = new URL(url);

  assert.equal(parsed.searchParams.get('utm_source'), 'meta');
  assert.equal(parsed.searchParams.get('utm_medium'), 'lead_email');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'ai_act_radar_120249805466630295');
  assert.equal(parsed.searchParams.get('utm_content'), 'ad_120250102620060295');
  assert.equal(parsed.searchParams.get('utm_term'), 'adset_120249805487990295');
  assert.match(parsed.searchParams.get('lead_ref'), /^meta_[A-Za-z0-9_-]+$/);
  assert.equal(url.includes('lead@example.com'), false);
  assert.equal(url.includes('lead%40example.com'), false);
  assert.equal(url.includes('987654321'), false);
  assert.equal(parsed.hash, '#pakiet');
});

test('strona daje stabilną nieodwracalną referencję bez danych osobowych', () => {
  const first = buildLeadReference({
    email: 'lead@example.com',
    secret: 'sekret-testowy',
    attribution: {},
  });
  const second = buildLeadReference({
    email: ' LEAD@example.com ',
    secret: 'sekret-testowy',
    attribution: {},
  });
  assert.equal(first, second);
  assert.match(first, /^web_[a-f0-9]{20}$/);
  assert.equal(first.includes('lead'), false);
});

test('brak sekretu nie blokuje linku, ale pomija lead_ref', () => {
  const url = buildAiActProductUrl({ email: 'lead@example.com', secret: '' });
  assert.equal(new URL(url).searchParams.has('lead_ref'), false);
});

test('landing przepisuje tylko dozwolone UTM i client_reference_id', () => {
  const query = new URLSearchParams({
    utm_source: 'meta',
    utm_medium: 'lead_email',
    utm_campaign: 'ai_act_radar',
    utm_content: 'ad_1202',
    utm_term: 'adset_1201',
    lead_ref: 'meta_1201_abcd',
    email: 'lead@example.com',
    phone: '500600700',
  });
  const url = buildCheckoutUrl(PAYMENT_LINK, query);
  const parsed = new URL(url);

  assert.equal(parsed.searchParams.get('utm_source'), 'meta');
  assert.equal(parsed.searchParams.get('client_reference_id'), 'meta_1201_abcd');
  assert.equal(parsed.searchParams.has('lead_ref'), false);
  assert.equal(parsed.searchParams.has('email'), false);
  assert.equal(parsed.searchParams.has('phone'), false);
});

test('landing odrzuca niedozwolone znaki i za długie wartości', () => {
  assert.equal(sanitizeTrackingValue('meta lead!'), '');
  assert.equal(sanitizeTrackingValue('meta_lead-1'), 'meta_lead-1');
  assert.equal(sanitizeTrackingValue('x'.repeat(151)), '');
});

test('zdarzenie rozpoczęcia płatności ma wartość produktu', () => {
  assert.deepEqual(buildInitiateCheckoutParams(), {
    content_ids: ['prod_UqMFmFSxB5XZ5x'],
    content_type: 'product',
    content_name: 'AI Act dla małej firmy, pakiet zgodności',
    value: 67,
    currency: 'PLN',
  });
});

test('mail powitalny buduje indywidualny URL z atrybucją żądania', () => {
  const fragment = read('api/fragment.js');
  assert.match(fragment, /buildAiActProductUrl/);
  assert.match(fragment, /body\.attribution/);
  assert.match(fragment, /userHtml\(productUrl\)/);
  assert.match(fragment, /userText\(productUrl\)/);
});

test('landing ładuje Pixel, propagację atrybucji i oznacza wszystkie linki Stripe', () => {
  const html = read('ai-act/index.html');
  assert.match(html, /src="\/assets\/meta-pixel\.js"/);
  assert.match(html, /src="\/assets\/ai-act-attribution\.js"/);
  const stripeLinks = html.match(/href="https:\/\/buy\.stripe\.com\/eVq8wOczQ1HU6J243c1kA0K"/g) || [];
  const trackedLinks = html.match(/data-ai-act-checkout/g) || [];
  assert.ok(stripeLinks.length >= 2);
  assert.equal(trackedLinks.length, stripeLinks.length);
});
