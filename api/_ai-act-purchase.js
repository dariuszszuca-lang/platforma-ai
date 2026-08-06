const crypto = require('node:crypto');

const AI_ACT_PAYMENT_LINK = 'plink_1TqfWqC5TxNbsygYDmHCsjJ8';
const AI_ACT_PRODUCT_ID = 'prod_UqMFmFSxB5XZ5x';
const AI_ACT_AMOUNT = 6700;
const AI_ACT_CURRENCY = 'pln';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function isAiActPurchase(session = {}) {
  return session.payment_link === AI_ACT_PAYMENT_LINK
    && session.amount_total === AI_ACT_AMOUNT
    && session.currency === AI_ACT_CURRENCY;
}

function shouldProcessStripeEvent(event = {}) {
  const supported = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
  ]);
  const session = event.data && event.data.object;
  return supported.has(event.type)
    && Boolean(session)
    && session.payment_status === 'paid'
    && isAiActPurchase(session);
}

function buildPurchaseEvent({ session, email, eventTime }) {
  if (!session || !session.id) {
    throw new Error('Brak ID sesji Stripe.');
  }
  const normalizedEmail = normalizeEmail(email);
  const userData = {};
  if (normalizedEmail) userData.em = [sha256(normalizedEmail)];
  if (session.client_reference_id) {
    userData.external_id = [sha256(session.client_reference_id)];
  }

  return {
    event_name: 'Purchase',
    event_time: Number(eventTime) || Math.floor(Date.now() / 1000),
    event_id: `stripe_${session.id}`,
    action_source: 'website',
    event_source_url: 'https://ai-team.pl/ai-act',
    user_data: userData,
    custom_data: {
      currency: 'PLN',
      value: AI_ACT_AMOUNT / 100,
      content_ids: [AI_ACT_PRODUCT_ID],
      content_type: 'product',
      content_name: 'AI Act dla małej firmy, pakiet zgodności',
      order_id: session.id,
    },
  };
}

async function sendCapiPurchase(purchaseEvent, options = {}) {
  const pixelId = String(options.pixelId || process.env.META_PIXEL_ID || '').trim();
  const accessToken = String(options.accessToken || process.env.META_CAPI_ACCESS_TOKEN || '').trim();
  if (!pixelId || !accessToken) {
    return { skipped: true, reason: 'not_configured' };
  }

  const apiVersion = String(options.apiVersion || process.env.META_API_VERSION || 'v25.0').trim();
  const fetchImpl = options.fetchImpl || fetch;
  const url = `https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: [purchaseEvent] }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`Meta CAPI HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }
  return {
    ok: true,
    status: response.status,
    eventsReceived: Number(payload.events_received || 0),
    traceId: String(payload.fbtrace_id || ''),
  };
}

module.exports = {
  AI_ACT_AMOUNT,
  AI_ACT_PAYMENT_LINK,
  AI_ACT_PRODUCT_ID,
  buildPurchaseEvent,
  isAiActPurchase,
  normalizeEmail,
  sendCapiPurchase,
  shouldProcessStripeEvent,
};
