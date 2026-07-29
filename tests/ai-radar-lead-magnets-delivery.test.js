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

async function callLeadMagnet(type, ip) {
  const res = response();
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://ai-team.pl',
      'x-forwarded-for': ip,
    },
    body: {
      type,
      email: 'lead@example.com',
      consent: true,
      company: '',
      delivered_by: 'meta-automat',
    },
  };
  await fragmentHandler(req, res);
  return res;
}

test('Starter dostarcza w pierwszej wiadomości pełny HTML i PDF', async (t) => {
  const sent = [];
  t.mock.method(mailLib, 'getAwsConfig', () => ({}));
  t.mock.method(mailLib, 'sendSesEmail', async (message) => {
    sent.push(message);
    return { status: 200 };
  });

  const res = await callLeadMagnet('starter-wdrozen-ai', '127.0.0.81');

  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /Starter Wdrożeń AI/i);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/starter-wdrozen-ai/);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/assets\/starter-wdrozen-ai\.pdf/);
  assert.match(sent[0].html, /poniedział/i);
  assert.match(sent[0].html, /czwart/i);
  assert.equal((sent[0].html.match(/data-primary-cta/g) || []).length, 1);
});

test('System AI tygodnia dostarcza w pierwszej wiadomości pełny HTML i PDF', async (t) => {
  const sent = [];
  t.mock.method(mailLib, 'getAwsConfig', () => ({}));
  t.mock.method(mailLib, 'sendSesEmail', async (message) => {
    sent.push(message);
    return { status: 200 };
  });

  const res = await callLeadMagnet('system-ai-tygodnia', '127.0.0.82');

  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /System #01/i);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/system-ai-tygodnia-01/);
  assert.match(sent[0].html, /https:\/\/ai-team\.pl\/assets\/system-ai-tygodnia-01\.pdf/);
  assert.match(sent[0].html, /poniedział/i);
  assert.match(sent[0].html, /czwart/i);
  assert.equal((sent[0].html.match(/data-primary-cta/g) || []).length, 1);
});

