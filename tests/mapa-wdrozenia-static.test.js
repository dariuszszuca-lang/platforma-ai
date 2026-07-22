const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('wszystkie trzy strony ładują Pixel i wspólny pomiar VENTURE-03', () => {
  for (const file of [
    'mapa-wdrozenia.html',
    'mapa-wdrozenia-diagnoza.html',
    'mapa-wdrozenia-dziekuje.html',
  ]) {
    const html = read(file);
    assert.match(html, /\/assets\/meta-pixel\.js/);
    assert.match(html, /\/assets\/venture03-tracking\.js/);
  }
});

test('quiz ma bramkę email, zgodę i zapis przed pokazaniem wyniku', () => {
  const html = read('mapa-wdrozenia-diagnoza.html');
  assert.match(html, /id="leadGate"/);
  assert.match(html, /id="leadEmail"/);
  assert.match(html, /id="leadConsent"/);
  assert.match(html, /\/api\/mapa-send/);
  assert.match(html, /mode:'venture03-lead'/);
  assert.match(html, /Venture03Tracking\.track\('Lead'/);
});

test('landing mierzy start płatności, a podziękowanie zakup', () => {
  const landing = read('mapa-wdrozenia.html');
  const thanks = read('mapa-wdrozenia-dziekuje.html');
  assert.match(landing, /data-venture03-checkout/);
  assert.match(thanks, /trackPurchaseOnce/);
});
