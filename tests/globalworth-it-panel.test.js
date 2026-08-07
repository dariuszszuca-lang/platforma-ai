const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const panel = fs.readFileSync(path.join(root, 'panel.html'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');

test('panel ma chronioną sekcję odpowiedzi Globalworth', () => {
  assert.match(panel, /id="globalworthPanel"/);
  assert.match(panel, /Globalworth IT/);
  assert.match(panel, /auth\.currentUser/);
  assert.match(panel, /db\.collection\(['"]globalworth_it_responses['"]\)/);
  assert.match(panel, /orderBy\(['"]submitted_at['"],\s*['"]desc['"]\)/);
});

test('panel pobiera publiczną konfigurację Firebase z Vercel zamiast trzymać klucz w HTML', () => {
  assert.match(panel, /src="\/api\/firebase-client-config"/);
  assert.match(panel, /window\.__AITEAM_FIREBASE_CONFIG__/);
  assert.doesNotMatch(panel, /AIzaSy/);
});

test('panel pokazuje szczegóły, otwarte ustalenia, eksport i wydruk', () => {
  assert.match(panel, /function renderGlobalworthResponses\s*\(/);
  assert.match(panel, /Otwarte ustalenia/);
  assert.match(panel, /function exportGlobalworthResponse\s*\(/);
  assert.match(panel, /function printGlobalworthResponse\s*\(/);
  assert.match(panel, /Eksport JSON/);
  assert.match(panel, /Drukuj/);
  assert.doesNotMatch(panel, /window\.open\('',\s*'_blank',\s*'noopener,noreferrer'\)/);
});

test('reguły blokują publiczny odczyt i nie pozwalają zmieniać finalnych odpowiedzi', () => {
  assert.match(rules, /match \/globalworth_it_responses\/\{responseId\}/);
  assert.match(rules, /allow read:\s*if isSignedIn\(\)/);
  assert.match(rules, /allow create:\s*if isSignedIn\(\)\s*&&\s*hasGlobalworthResponseShape\(responseId\)/);
  assert.match(rules, /request\.resource\.data\.response_id\s*==\s*responseId/);
  assert.match(rules, /responseId\.matches\('\^\[A-Za-z0-9_-\]\{8,80\}\$'\)/);
  assert.match(rules, /request\.resource\.data\.answers\.keys\(\)\.hasOnly/);
  assert.match(rules, /allow update, delete:\s*if false/);
});

test('panel nie zawiera operacji edycji ani kasowania odpowiedzi Globalworth', () => {
  assert.doesNotMatch(panel, /globalworth_it_responses[^\n]{0,200}\.update\s*\(/);
  assert.doesNotMatch(panel, /globalworth_it_responses[^\n]{0,200}\.delete\s*\(/);
});
