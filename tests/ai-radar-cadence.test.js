const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('nowe zapisy AI Radar mają jawną zgodę na poniedziałki i czwartki', () => {
  const html = fs.readFileSync(path.join(root, 'ai-radar.html'), 'utf8');

  assert.match(html, /poniedziałek i czwartek o 18:00/i);
  assert.match(html, /ai-radar-2x/);
  assert.match(html, /2026-07-29-ai-radar-2x-v1/);
  assert.match(html, /okazjonalne informacje o usługach/i);
});

test('cron sprawdza zaplanowane wydania co godzinę', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const newsletterCron = config.crons.find((item) => item.path === '/api/newsletter-send');

  assert.equal(newsletterCron.schedule, '0 * * * *');
});

test('czwartek trafia tylko do zgody 2x, a poniedziałek do całej listy', () => {
  const thursday = JSON.parse(
    fs.readFileSync(path.join(root, 'newsletter', 'ai-radar-006-system-tygodnia.json'), 'utf8')
  );
  const monday = JSON.parse(
    fs.readFileSync(path.join(root, 'newsletter', 'ai-radar-007-starter-wdrozenia.json'), 'utf8')
  );

  assert.equal(thursday.group, 'ai-radar-2x');
  assert.equal(thursday.scheduled_at, '2026-07-30T18:00:00+02:00');
  assert.equal(monday.group, 'ai-radar');
  assert.equal(monday.scheduled_at, '2026-08-03T18:00:00+02:00');

  for (const issue of [thursday, monday]) {
    assert.match(issue.html, /ai-radar-wypis\?email=\{\{email_encoded\}\}/);
    assert.match(issue.text, /ai-radar-wypis\?email=\{\{email_encoded\}\}/);
  }
});
