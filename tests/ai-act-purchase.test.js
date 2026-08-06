const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  AI_ACT_PAYMENT_LINK,
  AI_ACT_PRODUCT_ID,
  buildPurchaseEvent,
  isAiActPurchase,
  normalizeEmail,
  sendCapiPurchase,
  shouldProcessStripeEvent,
} = require('../api/_ai-act-purchase.js');

test('rozpoznaje wyłącznie opłaconą sesję właściwego Payment Linka', () => {
  assert.equal(isAiActPurchase({
    payment_link: AI_ACT_PAYMENT_LINK,
    amount_total: 6700,
    currency: 'pln',
  }), true);
  assert.equal(isAiActPurchase({
    payment_link: 'plink_innego_produktu',
    amount_total: 6700,
    currency: 'pln',
  }), false);
  assert.equal(isAiActPurchase({
    payment_link: AI_ACT_PAYMENT_LINK,
    amount_total: 9700,
    currency: 'pln',
  }), false);
});

test('przetwarza płatne zdarzenie synchroniczne i asynchroniczne', () => {
  const session = {
    payment_status: 'paid',
    payment_link: AI_ACT_PAYMENT_LINK,
    amount_total: 6700,
    currency: 'pln',
  };
  assert.equal(shouldProcessStripeEvent({
    type: 'checkout.session.completed',
    data: { object: session },
  }), true);
  assert.equal(shouldProcessStripeEvent({
    type: 'checkout.session.async_payment_succeeded',
    data: { object: session },
  }), true);
  assert.equal(shouldProcessStripeEvent({
    type: 'checkout.session.completed',
    data: { object: { ...session, payment_status: 'unpaid' } },
  }), false);
  assert.equal(shouldProcessStripeEvent({
    type: 'payment_intent.succeeded',
    data: { object: session },
  }), false);
});

test('normalizuje email przed hashowaniem', () => {
  assert.equal(normalizeEmail('  Lead@Example.COM '), 'lead@example.com');
});

test('buduje zdarzenie Purchase bez jawnego emaila', () => {
  const event = buildPurchaseEvent({
    session: {
      id: 'cs_123',
      client_reference_id: 'meta_1201_1202_abcd',
    },
    email: ' Lead@Example.COM ',
    eventTime: 1785784923,
  });

  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_time, 1785784923);
  assert.equal(event.event_id, 'stripe_cs_123');
  assert.equal(event.action_source, 'website');
  assert.equal(event.custom_data.value, 67);
  assert.equal(event.custom_data.currency, 'PLN');
  assert.deepEqual(event.custom_data.content_ids, [AI_ACT_PRODUCT_ID]);
  assert.equal(
    event.user_data.em[0],
    crypto.createHash('sha256').update('lead@example.com').digest('hex'),
  );
  assert.equal(JSON.stringify(event).includes('lead@example.com'), false);
});

test('pomija CAPI bez pełnej konfiguracji', async () => {
  let called = false;
  const result = await sendCapiPurchase({ event_name: 'Purchase' }, {
    pixelId: '',
    accessToken: '',
    fetchImpl: async () => { called = true; },
  });
  assert.deepEqual(result, { skipped: true, reason: 'not_configured' });
  assert.equal(called, false);
});

test('wysyła payload do właściwej wersji Graph API', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ events_received: 1, fbtrace_id: 'trace-1' }),
    };
  };
  const purchase = { event_name: 'Purchase', event_id: 'stripe_cs_123' };

  const result = await sendCapiPurchase(purchase, {
    pixelId: '2530116617406428',
    accessToken: 'token-testowy',
    apiVersion: 'v25.0',
    fetchImpl,
  });

  assert.match(request.url, /^https:\/\/graph\.facebook\.com\/v25\.0\/2530116617406428\/events\?/);
  assert.match(request.url, /access_token=token-testowy/);
  assert.deepEqual(JSON.parse(request.options.body), { data: [purchase] });
  assert.deepEqual(result, { ok: true, status: 200, eventsReceived: 1, traceId: 'trace-1' });
});

test('zwraca bezpieczny błąd CAPI bez tokenu i danych odpowiedzi', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: { message: 'sekret w komunikacie' } }),
  });

  await assert.rejects(
    sendCapiPurchase({ event_name: 'Purchase' }, {
      pixelId: '2530116617406428',
      accessToken: 'token-testowy',
      apiVersion: 'v25.0',
      fetchImpl,
    }),
    /Meta CAPI HTTP 400/,
  );
});
