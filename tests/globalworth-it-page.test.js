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

test('nagłówek mocniej eksponuje logo AI-Team i grupuje linki menu', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(html, /<span class="brand-mark">\s*<img[^>]+width="48"[^>]+height="48"[^>]*>\s*<\/span>/s);
  assert.match(html, /<span class="brand-name">AI-Team<\/span>/);
  assert.match(html, /\.nav \.brand-mark\{[^}]*width:54px[^}]*height:54px[^}]*\}/s);
  assert.match(html, /\.nav-links\{[^}]*border:1px solid var\(--line-soft\)[^}]*border-radius:13px[^}]*\}/s);
  assert.match(html, /\.nav-links a\{[^}]*min-height:40px[^}]*\}/s);
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

test('formularz pozwala na rozbudowane odpowiedzi własnym językiem', () => {
  const script = fs.readFileSync(scriptPath, 'utf8');

  assert.match(script, /Odpowiedzi mogą być rozbudowane i napisane własnym językiem/);
  assert.match(script, /Nie wymagamy formalnego stylu ani skrótowych odpowiedzi/);
  assert.match(script, /Możesz odpowiedzieć własnymi słowami/);
  assert.match(script, /Możesz podać pełny kontekst/);
  assert.match(script, /Możesz szerzej opisać stan organizacji, systemu lub procesu/);
});

test('formularz ładuje lokalne assety i zawiera awaryjny zestaw 16 pytań', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /assets\/it-questionnaire\.css/);
  assert.match(html, /assets\/it-questionnaire\.js/);
  const fallbackQuestions = html.match(/<li>[^<]+<\/li>/g) || [];
  assert.equal(fallbackQuestions.length, 16);
});

test('materiał używa języka procesu wdrożeniowego zamiast pilotażu', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const withoutProductName = html.replace(/Microsoft 365 Copilot/gi, 'Microsoft 365');

  assert.doesNotMatch(withoutProductName, /\bpilot\w*|\bpilotaż\w*/i);
  assert.match(html, /pierwszy proces wdrożeniowy/i);
  assert.match(html, /kroków do wdrożenia/i);
});

test('docelowy model AI jest ostatnią sekcją merytoryczną i ma link w menu', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const resultsPosition = html.indexOf('id="rezultaty"');
  const modelPosition = html.indexOf('id="model-ai"');
  const ctaPosition = html.indexOf('<section class="cta"');

  assert.ok(resultsPosition > -1);
  assert.ok(modelPosition > resultsPosition);
  assert.ok(ctaPosition > modelPosition);
  assert.match(html, /<a href="#model-ai">Model AI<\/a>/);
  assert.match(html, /Docelowy model operacyjny AI/i);
});

test('model AI pokazuje wspólny kontekst i cztery poziomy widoczności', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(html, /Wspólny kontekst operacyjny/i);
  assert.match(html, />Pracownik</);
  assert.match(html, />Proces</);
  assert.match(html, />Manager</);
  assert.match(html, />Dyrektor</);
  assert.match(html, /Wspólna warstwa informacji i automatyzacji/i);
  assert.doesNotMatch(html, /Zewnętrzny Dział AI/);
});
