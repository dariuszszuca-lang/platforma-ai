const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'panel.html'), 'utf8');

test('automat używa istniejącego pola utm bez rozszerzania publicznego kontraktu Firestore', () => {
  assert.match(rules, /'utm'/);
  assert.doesNotMatch(rules, /'source_detail'/);
  assert.doesNotMatch(rules, /'lead_magnet'/);
  assert.doesNotMatch(rules, /'owner_notification'/);
});

test('panel pokazuje rzeczywisty status dostawy zamiast wyliczać go z rodzaju leada', () => {
  assert.match(panel, /function leadDeliveryStatus\(sub\)/);
  assert.match(panel, /sub\.utm\?\.delivery\?\.status/);
  assert.match(panel, /Nie udało się wysłać materiału/);
  assert.match(panel, /Oczekuje na wysyłkę materiału/);
  assert.doesNotMatch(panel, /else if \(sub\.source === 'meta-lead-ad'\) \{\s*chips\.push\('Checklista AI Act/);
});

test('panel pokazuje status powiadomienia oraz pełną atrybucję Meta', () => {
  assert.match(panel, /function leadOwnerNotificationStatus\(sub\)/);
  assert.match(panel, /Powiadomienie do Ciebie/);
  assert.match(panel, /sub\.utm\?\.owner_notification\?\.status/);
  assert.match(panel, /sub\.utm\?\.attribution/);
  assert.match(panel, /attribution\?\.form_name/);
  assert.match(panel, /attribution\?\.campaign_name/);
  assert.match(panel, /attribution\?\.adset_name/);
  assert.match(panel, /attribution\?\.ad_name/);
});
