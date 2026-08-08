const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'assets', 'ai-reset.js');
const stylePath = path.join(root, 'assets', 'ai-reset.css');
const htmlPath = path.join(root, 'ai-reset.html');
const readHtml = () => (fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '');

test('moduł interakcji AI RESET istnieje', () => {
  assert.ok(fs.existsSync(scriptPath), 'brakuje assets/ai-reset.js');
});

const {
  calculateProgress,
  normalizeChecklistState,
  parseStoredObject,
} = require('../assets/ai-reset.js');

test('postęp zwraca zaokrąglony procent', () => {
  assert.equal(calculateProgress(3, 8), 38);
});

test('postęp pustej listy wynosi zero', () => {
  assert.equal(calculateProgress(0, 0), 0);
});

test('postęp jest ograniczony do przedziału od zera do stu', () => {
  assert.equal(calculateProgress(-2, 8), 0);
  assert.equal(calculateProgress(12, 8), 100);
});

test('stan checklisty zachowuje tylko znane klucze boolean', () => {
  assert.deepEqual(
    normalizeChecklistState({ a: true, b: 'yes', obcy: true }, ['a', 'b']),
    { a: true, b: false },
  );
});

test('niepoprawny JSON stanu zwraca pusty obiekt', () => {
  assert.deepEqual(parseStoredObject('{źle'), {});
});

test('poprawny JSON obiektu zostaje odczytany', () => {
  assert.deepEqual(parseStoredObject('{"a":true}'), { a: true });
});

test('tablica w pamięci nie jest akceptowana jako stan', () => {
  assert.deepEqual(parseStoredObject('["a"]'), {});
});

test('workbook AI RESET istnieje i pozostaje poza indeksem', () => {
  assert.ok(fs.existsSync(htmlPath), 'brakuje ai-reset.html');
  const html = readHtml();
  assert.match(html, /<meta name="robots" content="noindex,\s*nofollow">/i);
  assert.match(html, /<title>AI RESET/);
  assert.match(html, /<link rel="icon" href="assets\/favicon\.svg">/);
  assert.match(html, /<link rel="stylesheet" href="assets\/ai-reset\.css">/);
  assert.match(html, /<script src="assets\/ai-reset\.js"><\/script>/);
});

test('workbook zawiera osiem modułów i pięciu asystentów', () => {
  const html = readHtml();
  assert.equal((html.match(/data-module=/g) || []).length, 8);
  assert.equal((html.match(/data-assistant-card/g) || []).length, 5);
  assert.equal((html.match(/data-copy-target=/g) || []).length, 5);
});

test('workbook ma pola kontekstu, druk i kontrolę lokalnego stanu', () => {
  const html = readHtml();
  assert.ok((html.match(/data-context-field/g) || []).length >= 4);
  assert.match(html, /id="printReset"/);
  assert.match(html, /id="clearReset"/);
  assert.match(html, /id="resetProgress"/);
});

test('workbook nie zawęża odbiorcy do małych firm', () => {
  const html = readHtml();
  assert.doesNotMatch(html, /mał(?:a|e|ej|ych|ą)\s+firm/i);
});

test('skrypt obsługuje zapis, kopiowanie, postęp, druk i czyszczenie', () => {
  const script = fs.readFileSync(scriptPath, 'utf8');
  assert.match(script, /ai-reset-checklist-v1/);
  assert.match(script, /ai-reset-fields-v1/);
  assert.match(script, /querySelectorAll\('\[data-reset-check\]'\)/);
  assert.match(script, /clipboard\.writeText/);
  assert.match(script, /\.print\(\)/);
  assert.match(script, /\.removeItem\(CHECKLIST_STORAGE_KEY\)/);
});

test('arkusz AI RESET zawiera responsywność, dostępność i druk', () => {
  assert.ok(fs.existsSync(stylePath), 'brakuje assets/ai-reset.css');
  const css = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf8') : '';
  assert.match(css, /--reset-copper:/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s+print/);
});

test('widok druku ukrywa link dostępności przeznaczony tylko dla ekranu', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  const printStyles = css.slice(css.indexOf('@media print'));
  assert.match(printStyles, /\.skip-link[\s\S]*?display:\s*none\s*!important/);
});
