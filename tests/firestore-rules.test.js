const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

test('tylko konto techniczne Vercela może obsługiwać leady VENTURE-03 bez prawa usuwania', () => {
  assert.match(rules, /match \/venture_03_leads\/\{leadId\}/);
  assert.match(rules, /function isVenture03Backend\(\)/);
  assert.match(rules, /request\.auth\.uid == 'DHIZgFx0UsPQZgdVAJ574v9UoEE3'/);
  assert.match(rules, /allow read, create, update: if isVenture03Backend\(\);/);
  assert.doesNotMatch(rules, /match \/venture_03_leads\/\{leadId\}[\s\S]*?allow read, create, update: if isSignedIn\(\);/);
  assert.match(rules, /allow delete: if false;/);
});
