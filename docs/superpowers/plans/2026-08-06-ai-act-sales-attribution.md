# AI Act Sales Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zmierzyć prawdziwy zakup pakietu AI Act od maila po Stripe i Meta CAPI oraz dopuścić skalowanie dopiero po trzech rentownych zakupach.

**Architecture:** Rozbudowujemy istniejący webhook Stripe i zachowujemy Stripe jako źródło prawdy. Czyste moduły budują atrybucję i payload CAPI, landing propaguje UTM do Payment Linka, a lokalny strażnik tylko raportuje stan bez zmiany budżetu.

**Tech Stack:** statyczny HTML/JavaScript, Vercel Functions Node.js, Stripe Checkout/Payment Links, Meta Conversions API v25.0, Python 3, launchd, `node:test`, `unittest`.

---

### Task 1: Ścisła identyfikacja zakupu i payload CAPI

**Files:**
- Create: `api/_ai-act-purchase.js`
- Create: `tests/ai-act-purchase.test.js`
- Modify: `api/ai-act-webhook.js`

- [ ] **Step 1: Write the failing tests**

```js
test('odrzuca tę samą kwotę z innego Payment Linka', () => {
  assert.equal(isAiActPurchase({ payment_link: 'plink_inny', amount_total: 6700, currency: 'pln' }), false);
});

test('buduje Purchase bez jawnego emaila', () => {
  const event = buildPurchaseEvent({
    session: { id: 'cs_123', client_reference_id: 'meta_1_2_abcd' },
    email: 'Lead@Example.com',
    eventTime: 1785784923,
  });
  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_id, 'stripe_cs_123');
  assert.equal(event.custom_data.value, 67);
  assert.equal(event.custom_data.currency, 'PLN');
  assert.notEqual(event.user_data.em[0], 'lead@example.com');
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/ai-act-purchase.test.js`

Expected: FAIL because `api/_ai-act-purchase.js` does not exist.

- [ ] **Step 3: Implement the minimal pure module**

```js
const crypto = require('node:crypto');
const AI_ACT_PAYMENT_LINK = 'plink_1TqfWqC5TxNbsygYDmHCsjJ8';
const AI_ACT_PRODUCT = 'prod_UqMFmFSxB5XZ5x';

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function isAiActPurchase(session) {
  return session.payment_link === AI_ACT_PAYMENT_LINK
    && session.amount_total === 6700
    && session.currency === 'pln';
}
```

- [ ] **Step 4: Run GREEN and the full Node suite**

Run: `node --test tests/ai-act-purchase.test.js && node --test tests/*.test.js`

Expected: all tests PASS.

- [ ] **Step 5: Wire the existing webhook**

Handle `checkout.session.completed` and `checkout.session.async_payment_succeeded`, require `payment_status=paid`, call CAPI with `event_time=event.created`, then send the existing fulfillment email. Never log the token or raw email.

- [ ] **Step 6: Commit**

```bash
git add api/_ai-act-purchase.js api/ai-act-webhook.js tests/ai-act-purchase.test.js
git commit -m "feat: wyślij zakup AI Act do Meta CAPI"
```

### Task 2: Atrybucja maila i Payment Linka bez PII

**Files:**
- Create: `api/_ai-act-attribution.js`
- Create: `assets/ai-act-attribution.js`
- Create: `tests/ai-act-attribution.test.js`
- Modify: `api/fragment.js`
- Modify: `ai-act/index.html`

- [ ] **Step 1: Write failing tests for the server URL and browser propagation**

```js
test('URL maila ma UTM i nie zawiera emaila', () => {
  const url = buildAiActProductUrl({
    email: 'lead@example.com',
    attribution: { campaign_id: '1201', ad_id: '1202', lead_id: '1203' },
    secret: 'test-secret',
  });
  assert.match(url, /utm_source=meta/);
  assert.match(url, /utm_medium=lead_email/);
  assert.doesNotMatch(url, /lead%40example\.com|lead@example\.com/);
});

test('landing przepisuje tylko dozwolone parametry', () => {
  const url = buildCheckoutUrl(PAYMENT_LINK, new URLSearchParams('utm_source=meta&lead_ref=abc&email=x@y.pl'));
  assert.match(url, /utm_source=meta/);
  assert.match(url, /client_reference_id=abc/);
  assert.doesNotMatch(url, /email=/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/ai-act-attribution.test.js`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement HMAC reference and allowlisted UTM propagation**

The server uses `ATTRIBUTION_HMAC_SECRET`. The browser accepts only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` and maps `lead_ref` to `client_reference_id`. Values must match `[A-Za-z0-9_-]+` and fit Stripe limits.

- [ ] **Step 4: Inject the unique product URL into HTML and text welcome emails**

Change `userHtml()` and `userText()` to accept `productUrl`, and build it from the request body. Website signups use `utm_source=website`; Meta deliveries use the attribution object passed by the exporter.

- [ ] **Step 5: Add Pixel and checkout tracking to the landing**

```html
<script src="/assets/meta-pixel.js" defer></script>
<script src="/assets/ai-act-attribution.js" defer></script>
```

Mark every 67 zł Stripe link with `data-ai-act-checkout`; on click send browser `InitiateCheckout` with `value:67` and `currency:'PLN'`.

- [ ] **Step 6: Run GREEN and commit**

Run: `node --test tests/ai-act-attribution.test.js && node --test tests/*.test.js`

```bash
git add api/_ai-act-attribution.js api/fragment.js assets/ai-act-attribution.js ai-act/index.html tests/ai-act-attribution.test.js
git commit -m "feat: dodaj atrybucję maila do zakupu AI Act"
```

### Task 3: Copy po 2 sierpnia

**Files:**
- Create: `tests/ai-act-copy.test.js`
- Modify: `ai-act/index.html`
- Modify: `api/fragment.js`

- [ ] **Step 1: Write the failing stale-copy test**

```js
for (const text of [read('ai-act/index.html'), read('api/fragment.js')]) {
  assert.doesNotMatch(text, /przed 2 sierpnia|promo(?:cyjna)? do 2 sierpnia|jeszcze przed 2 sierpnia/i);
}
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/ai-act-copy.test.js`

Expected: FAIL on the current landing and audit email.

- [ ] **Step 3: Replace the expired deadline language**

Use present-tense copy: the transparency rules apply from 2 August 2026; the audit helps order the current state; 290 zł is the current price without a fake deadline. Keep the education/not-legal-advice disclaimer.

- [ ] **Step 4: Run GREEN and commit**

Run: `node --test tests/ai-act-copy.test.js && node --test tests/*.test.js`

```bash
git add ai-act/index.html api/fragment.js tests/ai-act-copy.test.js
git commit -m "fix: odśwież komunikację AI Act po terminie"
```

### Task 4: Przekazanie atrybucji z eksportera Meta

**Files:**
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/tools/meta-ads/export_leads.py`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/tools/meta-ads/test_export_leads.py`
- Modify: `/Users/dariu/.codex/memories/meta-lead-export/export_leads.py`

- [ ] **Step 1: Write a failing Python test**

Patch `urllib.request.urlopen`, call `send_welcome_checklist(email, row)` and assert the JSON body contains only `lead_id`, campaign/adset/ad IDs and names under `attribution`.

- [ ] **Step 2: Run RED**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Expected: FAIL because the function does not accept `row` and does not send attribution.

- [ ] **Step 3: Pass the row through the delivery path**

Change `send_delivery_step(email, form, step, row=None)` and the caller in `main()`. Do not add email or phone to the attribution object.

- [ ] **Step 4: Run GREEN and update the installed launchd copy**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Apply the same focused change to the installed copy, then run `python3 -m py_compile` on both files.

### Task 5: Read-only scale guard

**Files:**
- Create: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/VENTURE-01/monitoring/scale_guard.py`
- Create: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/VENTURE-01/monitoring/test_scale_guard.py`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/VENTURE-01/monitoring/monitor_venture.py`
- Create: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/VENTURE-01/monitoring/pl.ai-team.ai-act-sales-guard.plist`

- [ ] **Step 1: Write failing guard tests**

```python
self.assertEqual(evaluate_scale(455.31, 1, 67)["status"], "OBSERWUJ")
self.assertEqual(evaluate_scale(60, 3, 201)["status"], "NIE_SKALUJ")
self.assertEqual(evaluate_scale(48, 3, 201)["status"], "SKALUJ_CZEKA_NA_OK")
```

- [ ] **Step 2: Run RED**

Run: `python3 -m unittest PROJEKTY/VENTURE-01/monitoring/test_scale_guard.py`

Expected: FAIL because `scale_guard.py` does not exist.

- [ ] **Step 3: Implement the pure calculation and refactor the monitor**

Use campaign `120249805466630295`, Payment Link `plink_1TqfWqC5TxNbsygYDmHCsjJ8`, minimum 3 purchases, max CPA 16.75 PLN and minimum ROAS 4. Never call a Meta write endpoint.

- [ ] **Step 4: Run tests and one real read-only report**

Run: `python3 -m unittest PROJEKTY/VENTURE-01/monitoring/test_scale_guard.py`

Run: `python3 PROJEKTY/VENTURE-01/monitoring/monitor_venture.py`

Expected current status: `OBSERWUJ`, because there is only one paid session.

- [ ] **Step 5: Install a daily local launchd job**

Schedule once daily and write only local logs/reports. Load it without sending mail and without changing campaign state.

### Task 6: Production configuration and verification

**Files:**
- Vercel env for project `platforma-ai`
- Stripe webhook endpoint `we_1U0SKHC5TxNbsygYdXtOoE0P`

- [ ] **Step 1: Add production secrets without exposing values**

Add `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`, `META_API_VERSION=v25.0` and a generated `ATTRIBUTION_HMAC_SECRET` to Vercel production. Use `printf`, never echo secret values.

- [ ] **Step 2: Extend the Stripe endpoint event list**

Keep `checkout.session.completed` and add `checkout.session.async_payment_succeeded`.

- [ ] **Step 3: Verify and push the repo branch**

Run: `node --test tests/*.test.js`, `node --check api/ai-act-webhook.js`, `node --check api/fragment.js`, `git diff --check`, secret-pattern scan and `git status --short`.

Push the branch, merge only the scoped commits to `main`, then verify the Vercel deployment.

- [ ] **Step 4: Smoke-test production**

Confirm `/ai-act`, the checklist and the 67 zł Payment Link return 200. Confirm unsigned POST to `/api/ai-act-webhook` returns 400. Confirm Vercel env names exist and Stripe endpoint events are correct.

- [ ] **Step 5: Backfill the one real purchase**

Send the existing paid session to Meta CAPI with its original event time and deterministic `event_id`. Do not create a fake checkout or payment. Record only the Meta response status and trace ID, never buyer PII.

### Task 7: Meta replacement ads and gate

**Files:**
- Create: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/AUTOFIRMA/REKLAMY/campaigns/2026-08-06_ai-act-copy-refresh.md`

- [ ] **Step 1: Prepare the dry-run**

Reuse adset `120249805487990295`, form `839834505727824`, CTA `DOWNLOAD` and the three current image hashes. Use current-tense copy and create three new ads as PAUSED. Budget remains unchanged.

- [ ] **Step 2: Present the exact dry-run**

List object count, names, message, headline, description, image hash, form, status PAUSED and unchanged budget. Do not write to Meta yet.

- [ ] **Step 3: Wait for the required Meta gate**

Only after Darek answers `OK` to this dry-run create the three PAUSED ads. Only after a later exact `OK aktywuj` pause the stale active ads and activate the replacements.

### Task 8: Handoff and project memory

**Files:**
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/claude-shared/memory/reference_stripe_aiteam.md`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/claude-shared/memory/reference_playbook_reklamy_meta.md`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/_STAN.md`

- [ ] **Step 1: Record the verified implementation**

Add the AI Act product/price/link IDs, CAPI event contract, attribution convention and scale thresholds. Do not record secret values or buyer data.

- [ ] **Step 2: Final verification**

Re-run local tests, production smoke tests, Stripe/Meta read-only status and confirm total configured budget remains 60 PLN/day.
