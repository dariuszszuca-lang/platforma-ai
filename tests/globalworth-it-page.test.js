const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'globalworth', 'index.html');
const scriptPath = path.join(root, 'globalworth', 'assets', 'it-questionnaire.js');

test('podstrona Globalworth jest materiałem nieindeksowanym dla klienta', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /<meta\s+name="robots"\s+content="noindex,\s*nofollow"/i);
  assert.match(html, /AI-Team\s*[×x]\s*Globalworth/i);
  assert.match(html, /Od 7 czasochłonnych procesów do programu/i);
  assert.match(html, /src="\.\.\/assets\/ai-team-logo-256\.png"/);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'ai-team-logo-256.png')), true);
});

test('formularz komunikuje trwały zapis i ograniczenia danych', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const script = fs.readFileSync(scriptPath, 'utf8');
  assert.match(script, /\/api\/globalworth-it-submit/);
  assert.match(script, /Zakończ i zapisz odpowiedzi/);
  assert.match(script, /numer zapisu/i);
  assert.match(script, /Nie wpisuj[^<]*(haseł|hasel)/i);
  assert.match(script, /kluczy/i);
  assert.match(script, /danych najemców/i);
  assert.match(script, /name="website"/);
  assert.doesNotMatch(script, /Prototyp lokalny/i);
  assert.doesNotMatch(script, /Panel prototypowy/i);
  assert.doesNotMatch(script, /Darek widzi/i);
  assert.doesNotMatch(script, /\?view=answers/);
});

test('formularz ładuje lokalne assety i zawiera awaryjny zestaw 16 pytań', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /assets\/it-questionnaire\.css/);
  assert.match(html, /assets\/it-questionnaire\.js/);
  const fallbackQuestions = html.match(/<li>[^<]+<\/li>/g) || [];
  assert.equal(fallbackQuestions.length, 16);
});
