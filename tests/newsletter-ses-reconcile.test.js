const test = require('node:test');
const assert = require('node:assert/strict');

const newsletter = require('../api/newsletter-send.js');

function response() {
  return {
    statusCode: 0,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return payload; },
  };
}

const sends = [
  {
    id: 'issue-011__sub-1',
    subscriber_id: 'sub-1',
    ses_message_id: 'ses-permanent',
    status: 'sent',
  },
  {
    id: 'issue-011__sub-2',
    subscriber_id: 'sub-2',
    ses_message_id: 'ses-transient',
    status: 'sent',
  },
  {
    id: 'issue-011__sub-3',
    subscriber_id: 'sub-3',
    ses_message_id: 'ses-complaint',
    status: 'sent',
  },
];

const subscribers = [
  { id: 'sub-1', email: 'one@example.com', status: 'active' },
  { id: 'sub-2', email: 'two@example.com', status: 'active' },
  { id: 'sub-3', email: 'three@example.com', status: 'active' },
];

test('permanent bounce blokuje kontakt i aktualizuje status wysyłki bez zapisu diagnostyki', () => {
  const result = newsletter.planSesEventReconciliation([
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-permanent' },
      bounce: {
        bounceType: 'Permanent',
        bounceSubType: 'General',
        bouncedRecipients: [{
          emailAddress: 'one@example.com',
          diagnosticCode: 'niezaufana treść z obcego serwera',
        }],
      },
    },
  ], sends, subscribers, { now: '2026-08-18T20:00:00.000Z' });

  assert.equal(result.summary.matched, 1);
  assert.equal(result.summary.suppressed, 1);
  assert.deepEqual(result.sendUpdates[0], {
    id: 'issue-011__sub-1',
    fields: {
      status: 'bounced',
      ses_event_type: 'bounce',
      bounce_type: 'Permanent',
      bounce_sub_type: 'General',
      updated_at: '2026-08-18T20:00:00.000Z',
    },
  });
  assert.deepEqual(result.subscriberUpdates[0], {
    id: 'sub-1',
    fields: {
      status: 'bounced',
      suppression_status: 'bounced',
      suppression_source: 'ses',
      suppressed_at: '2026-08-18T20:00:00.000Z',
      bounce_type: 'Permanent',
      bounce_sub_type: 'General',
    },
  });
  assert.doesNotMatch(JSON.stringify(result), /diagnostic|niezaufana|one@example\.com/i);
});

test('transient bounce aktualizuje wysyłkę, ale nie blokuje subskrybenta', () => {
  const result = newsletter.planSesEventReconciliation([
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-transient' },
      bounce: { bounceType: 'Transient', bounceSubType: 'MailboxFull' },
    },
  ], sends, subscribers, { now: '2026-08-18T20:00:00.000Z' });

  assert.equal(result.summary.matched, 1);
  assert.equal(result.summary.suppressed, 0);
  assert.equal(result.sendUpdates[0].fields.status, 'bounced');
  assert.deepEqual(result.subscriberUpdates, []);
});

test('complaint blokuje kontakt, a nieznane messageId nie zmienia danych', () => {
  const result = newsletter.planSesEventReconciliation([
    {
      eventType: 'COMPLAINT',
      mail: { messageId: 'ses-complaint' },
      complaint: { complaintFeedbackType: 'abuse' },
    },
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-unknown' },
      bounce: { bounceType: 'Permanent', bounceSubType: 'NoEmail' },
    },
  ], sends, subscribers, { now: '2026-08-18T20:00:00.000Z' });

  assert.equal(result.summary.matched, 1);
  assert.equal(result.summary.unmatched, 1);
  assert.equal(result.summary.suppressed, 1);
  assert.equal(result.sendUpdates.length, 1);
  assert.equal(result.subscriberUpdates.length, 1);
  assert.equal(result.subscriberUpdates[0].fields.status, 'complained');
});

test('zapis pojedynczego zdarzenia aktualizuje wyłącznie znane dokumenty i pola', async () => {
  const writes = [];
  const plan = newsletter.planSesEventReconciliation([
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-permanent' },
      bounce: { bounceType: 'Permanent', bounceSubType: 'General' },
    },
  ], sends, subscribers, { now: '2026-08-18T20:00:00.000Z' });

  const result = await newsletter.applySesEventReconciliation(plan, 'token', {
    setDoc: async (path, fields, token, mask) => {
      writes.push({ path, fields, token, mask });
    },
  });

  assert.equal(result.updatedSends, 1);
  assert.equal(result.updatedSubscribers, 1);
  assert.deepEqual(writes.map((write) => write.path), [
    'newsletter_sends/issue-011__sub-1',
    'newsletter_subscribers/sub-1',
  ]);
  assert.equal(writes[0].token, 'token');
  assert.deepEqual(writes[0].mask, Object.keys(writes[0].fields));
  assert.deepEqual(writes[1].mask, Object.keys(writes[1].fields));
});

test('bezpiecznik odrzuca więcej niż dwa zablokowania w jednym wywołaniu', async () => {
  const plan = {
    sendUpdates: [],
    subscriberUpdates: [
      { id: 'sub-1', fields: { status: 'bounced' } },
      { id: 'sub-2', fields: { status: 'bounced' } },
      { id: 'sub-3', fields: { status: 'bounced' } },
    ],
    summary: { suppressed: 3 },
  };

  await assert.rejects(
    () => newsletter.applySesEventReconciliation(plan, 'token', { setDoc: async () => {} }),
    /bezpiecznik.*2/i,
  );
});

test('reconcile pobiera kolekcje raz i zwraca wyłącznie zbiorcze liczby bez PII', async () => {
  const reads = [];
  const writes = [];
  const result = await newsletter.reconcileSesEvents([
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-permanent' },
      bounce: {
        bounceType: 'Permanent',
        bounceSubType: 'General',
        bouncedRecipients: [{ emailAddress: 'one@example.com' }],
      },
    },
  ], 'token', {
    listCollection: async (name) => {
      reads.push(name);
      return name === 'newsletter_sends' ? sends : subscribers;
    },
    setDoc: async (path) => { writes.push(path); },
    now: '2026-08-18T20:00:00.000Z',
  });

  assert.deepEqual(reads, ['newsletter_sends', 'newsletter_subscribers']);
  assert.deepEqual(writes, [
    'newsletter_sends/issue-011__sub-1',
    'newsletter_subscribers/sub-1',
  ]);
  assert.deepEqual(result, {
    ok: true,
    received: 1,
    matched: 1,
    unmatched: 0,
    ignored: 0,
    suppressed: 1,
    updatedSends: 1,
    updatedSubscribers: 1,
  });
  assert.doesNotMatch(JSON.stringify(result), /one@example\.com|ses-permanent/i);
});

test('produkcyjna reconciliacja wyszukuje tylko wysyłki po ses_message_id bez pełnego skanu', async () => {
  const sendLookups = [];
  const subscriberLookups = [];
  const writes = [];
  const result = await newsletter.reconcileSesEvents([
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-permanent' },
      bounce: { bounceType: 'Permanent', bounceSubType: 'General' },
    },
    {
      eventType: 'BOUNCE',
      mail: { messageId: 'ses-unknown' },
      bounce: { bounceType: 'Permanent', bounceSubType: 'NoEmail' },
    },
  ], 'token', {
    listCollection: async () => { throw new Error('full scan forbidden'); },
    findSendByMessageId: async (messageId) => {
      sendLookups.push(messageId);
      return sends.find((send) => send.ses_message_id === messageId) || null;
    },
    getSubscriberById: async (id) => {
      subscriberLookups.push(id);
      return subscribers.find((subscriber) => subscriber.id === id) || null;
    },
    setDoc: async (path) => { writes.push(path); },
    now: '2026-08-18T20:00:00.000Z',
  });

  assert.deepEqual(sendLookups, ['ses-permanent', 'ses-unknown']);
  assert.deepEqual(subscriberLookups, ['sub-1']);
  assert.deepEqual(writes, [
    'newsletter_sends/issue-011__sub-1',
    'newsletter_subscribers/sub-1',
  ]);
  assert.equal(result.matched, 1);
  assert.equal(result.unmatched, 1);
});

test('token Firebase jest współdzielony w ciepłej instancji i odświeżany przed wygaśnięciem', async () => {
  const cache = { token: '', expiresAt: 0, pending: null };
  let loads = 0;
  const loader = async () => `token-${++loads}`;

  const first = await newsletter.getCachedToken(cache, loader, 1_000, 3_000);
  const cached = await newsletter.getCachedToken(cache, loader, 2_000, 3_000);
  const refreshed = await newsletter.getCachedToken(cache, loader, 4_001, 3_000);

  assert.equal(first, 'token-1');
  assert.equal(cached, 'token-1');
  assert.equal(refreshed, 'token-2');
  assert.equal(loads, 2);
});

test('endpoint SES przyjmuje maksymalnie 10 zdarzeń i wymaga tokenu serwerowego', async () => {
  const req = { headers: { authorization: 'Bearer test' } };
  const res = response();
  let tokenChecks = 0;
  let reconciles = 0;

  await newsletter.handleSesReconcileRequest(req, res, {
    sesEvents: Array.from({ length: 11 }, () => ({ eventType: 'BOUNCE' })),
  }, {
    requireToken: async () => { tokenChecks += 1; return 'token'; },
    reconcile: async () => { reconciles += 1; return { ok: true }; },
  });

  assert.equal(res.statusCode, 400);
  assert.equal(tokenChecks, 1);
  assert.equal(reconciles, 0);
  assert.match(res.payload.error, /maksymalnie 10/i);
});

test('endpoint SES zwraca wyłącznie podsumowanie reconciliacji', async () => {
  const req = { headers: { authorization: 'Bearer test' } };
  const res = response();
  const event = { eventType: 'BOUNCE', mail: { messageId: 'ses-permanent' } };

  await newsletter.handleSesReconcileRequest(req, res, { sesEvents: [event] }, {
    requireToken: async () => 'token',
    reconcile: async (events, token) => ({
      ok: true,
      received: events.length,
      matched: token === 'token' ? 1 : 0,
      suppressed: 1,
    }),
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { ok: true, received: 1, matched: 1, suppressed: 1 });
  assert.doesNotMatch(JSON.stringify(res.payload), /ses-permanent/i);
});
