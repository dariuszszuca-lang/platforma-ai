const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseAttribution,
  sanitizeEventParams,
} = require('../assets/venture03-tracking.js');

test('odczytuje wyłącznie pięć parametrów UTM', () => {
  const params = new URLSearchParams({
    utm_source: 'meta',
    utm_medium: 'paid_social',
    utm_campaign: 'mapa_wdrozenia_2026_07',
    utm_content: 'hero_a',
    utm_term: 'broad',
    email: 'test@example.com',
    fbclid: 'abc',
  });

  assert.deepEqual(parseAttribution(params), {
    utm_source: 'meta',
    utm_medium: 'paid_social',
    utm_campaign: 'mapa_wdrozenia_2026_07',
    utm_content: 'hero_a',
    utm_term: 'broad',
  });
});
test('usuwa dane osobowe z parametrów zdarzenia Meta', () => {
  assert.deepEqual(sanitizeEventParams({
    content_name: 'Mapa Wdrożenia AI',
    value: 147,
    currency: 'PLN',
    email: 'test@example.com',
    phone: '500600700',
    name: 'Jan',
    user_data: { em: 'hash' },
  }), {
    content_name: 'Mapa Wdrożenia AI',
    value: 147,
    currency: 'PLN',
  });
});
