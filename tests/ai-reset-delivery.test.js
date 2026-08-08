const test = require('node:test');
const assert = require('node:assert/strict');

const mailLib = require('../api/newsletter-send.js');
const fragmentHandler = require('../api/fragment.js');

function response() {
  return {
    statusCode: 0,
    payload: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return payload; },
    end() { return null; },
  };
}

async function callAiReset({
  step = 1,
  authorization = '',
  deliveredBy = 'meta-automat',
  ip = '127.0.0.71',
} = {}) {
  const res = response();
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://ai-team.pl',
      'x-forwarded-for': ip,
      authorization,
    },
    body: {
      type: 'ai-reset',
      step,
      email: 'lead@example.com',
      consent: true,
      delivered_by: deliveredBy,
    },
  };
  await fragmentHandler(req, res);
  return res;
}

test('etap 1 od razu dostarcza AI RESET jednym głównym CTA', async (t) => {
  const sent = [];
  t.mock.method(mailLib, 'getAwsConfig', () => ({}));
  t.mock.method(mailLib, 'sendSesEmail', async (message) => {
    sent.push(message);
    return { status: 200 };
  });

  const res = await callAiReset({ step: 1, ip: '127.0.0.72' });

  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /AI RESET/i);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/ai-reset\.html#modul-1/);
  assert.equal((sent[0].html.match(/data-primary-cta/g) || []).length, 1);
});

test('etapy 2 i 3 są zablokowane bez tokenu automatyzacji', async (t) => {
  const sent = [];
  t.mock.method(mailLib, 'getAwsConfig', () => ({}));
  t.mock.method(mailLib, 'sendSesEmail', async (message) => {
    sent.push(message);
    return { status: 200 };
  });

  const day2 = await callAiReset({ step: 2, ip: '127.0.0.73' });
  const day5 = await callAiReset({ step: 3, ip: '127.0.0.74' });

  assert.equal(day2.statusCode, 401);
  assert.equal(day5.statusCode, 401);
  assert.equal(sent.length, 0);
});

test('etap 2 prowadzi do wyboru jednego asystenta', async (t) => {
  const sent = [];
  const previousToken = process.env.AI_RESET_AUTOMATION_TOKEN;
  process.env.AI_RESET_AUTOMATION_TOKEN = 'test-token';
  t.after(() => {
    if (previousToken === undefined) delete process.env.AI_RESET_AUTOMATION_TOKEN;
    else process.env.AI_RESET_AUTOMATION_TOKEN = previousToken;
  });
  t.mock.method(mailLib, 'getAwsConfig', () => ({}));
  t.mock.method(mailLib, 'sendSesEmail', async (message) => {
    sent.push(message);
    return { status: 200 };
  });

  const res = await callAiReset({
    step: 2,
    authorization: 'Bearer test-token',
    ip: '127.0.0.75',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /pięciu asystentów/i);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/ai-reset\.html#modul-4/);
});

test('etap 3 prowadzi do powtórzenia jednego workflow', async (t) => {
  const sent = [];
  const previousToken = process.env.AI_RESET_AUTOMATION_TOKEN;
  process.env.AI_RESET_AUTOMATION_TOKEN = 'test-token';
  t.after(() => {
    if (previousToken === undefined) delete process.env.AI_RESET_AUTOMATION_TOKEN;
    else process.env.AI_RESET_AUTOMATION_TOKEN = previousToken;
  });
  t.mock.method(mailLib, 'getAwsConfig', () => ({}));
  t.mock.method(mailLib, 'sendSesEmail', async (message) => {
    sent.push(message);
    return { status: 200 };
  });

  const res = await callAiReset({
    step: 3,
    authorization: 'Bearer test-token',
    ip: '127.0.0.76',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /działa drugi raz/i);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/ai-reset\.html#modul-6/);
});

test('treści AI RESET nie zawężają odbiorcy do małych firm', () => {
  for (const step of [1, 2, 3]) {
    const message = fragmentHandler.buildAiResetEmail(step);
    const content = `${message.subject}\n${message.text}\n${message.html}`;
    assert.doesNotMatch(content, /mał(e|ej|ych|a)\s+firm/i);
  }
});
