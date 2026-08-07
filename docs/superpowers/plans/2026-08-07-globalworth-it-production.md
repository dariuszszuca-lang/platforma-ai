# Globalworth IT Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Current session:** execute inline. Project instructions prohibit spawning subagents unless Darek explicitly requests delegation.

**Goal:** Publish the approved Globalworth process page on ai-team.pl, persist final IT answers in Firestore, expose them in the authenticated panel, and repair the AI Radar schedule regression.

**Architecture:** Keep drafts in localStorage and send only the final validated payload to a Vercel function. The function validates a fixed 16-question schema and writes an idempotent document to the existing `ai-team-zlecenia` Firestore. The existing Firebase-authenticated panel reads the collection directly. AI Radar uses two daily UTC invocations and a Warsaw-local 18:00 guard for the welcome sequence.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js Vercel Functions, Firestore REST API, Firebase Auth, Node built-in test runner.

**Execution status (2026-08-07):** Tasks 1–6 completed and verified locally. Task 7 remains behind the explicit production approval gate.

---

### Task 1: Repair the AI Radar schedule regression

**Files:**
- Modify: `tests/ai-radar-cadence.test.js`
- Modify: `api/newsletter-send.js`
- Modify: `vercel.json`

- [ ] **Step 1: Change the failing test to express the desired daily, DST-safe contract**

```js
test('cron uruchamia się codziennie w obu godzinach UTC potrzebnych dla Warszawy', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const schedules = config.crons
    .filter((item) => item.path === '/api/newsletter-send')
    .map((item) => item.schedule)
    .sort();
  assert.deepEqual(schedules, ['0 16 * * *', '0 17 * * *']);
});

test('welcome uruchamia się tylko o 18 w Europe/Warsaw', () => {
  assert.equal(isWarsawNewsletterHour('2026-08-07T16:15:00Z'), true);
  assert.equal(isWarsawNewsletterHour('2026-08-07T17:15:00Z'), false);
  assert.equal(isWarsawNewsletterHour('2026-12-07T16:15:00Z'), false);
  assert.equal(isWarsawNewsletterHour('2026-12-07T17:15:00Z'), true);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/ai-radar-cadence.test.js`
Expected: FAIL because the second daily cron and exported Warsaw-hour helper do not exist.

- [ ] **Step 3: Add the smallest production fix**

```js
function isWarsawNewsletterHour(value) {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
  return hour === '18';
}
```

Call `processWelcomeSequence` only when this helper returns true. Configure
`0 16 * * *` and `0 17 * * *` in `vercel.json`.

- [ ] **Step 4: Run the focused and related tests**

Run: `node --test tests/ai-radar-cadence.test.js tests/ai-radar-lead-magnets-delivery.test.js`
Expected: all PASS.

- [ ] **Step 5: Commit the isolated fix**

```bash
git add vercel.json api/newsletter-send.js tests/ai-radar-cadence.test.js
git commit -m "fix: stabilizuj harmonogram AI Radar"
```

### Task 2: Define and test the Globalworth submission contract

**Files:**
- Create: `api/_globalworth-it.js`
- Create: `tests/globalworth-it-contract.test.js`

- [ ] **Step 1: Write failing tests for the fixed schema**

Tests must prove that the module accepts all three answer states, rejects a
missing detail, requires a reason for `not_applicable`, requires an owner for
`needs_clarification`, rejects unknown question IDs, normalizes respondent
fields, and builds a stable document path from `responseId`.

```js
const { normalizeSubmission, validateSubmission, documentPathFor } = require('../api/_globalworth-it');

test('wymaga uzasadnienia dla nie dotyczy', () => {
  const payload = validPayload();
  payload.answers['it-tools-01'] = { state: 'not_applicable', notApplicableReason: '' };
  assert.throws(() => validateSubmission(normalizeSubmission(payload)), /dlaczego/i);
});

test('buduje idempotentną ścieżkę dokumentu', () => {
  assert.equal(documentPathFor('response-abc12345'), 'globalworth_it_responses/response-abc12345');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/globalworth-it-contract.test.js`
Expected: FAIL with `Cannot find module '../api/_globalworth-it'`.

- [ ] **Step 3: Implement the minimal pure contract module**

Export `QUESTION_GROUPS`, `QUESTION_IDS`, `normalizeSubmission`,
`validateSubmission`, `summarizeSubmission`, `documentPathFor` and
`buildFirestoreDocument`. Enforce exact known IDs and conservative length
limits. Never accept IP, password, token, tenant data or arbitrary metadata.

- [ ] **Step 4: Run the contract test and verify GREEN**

Run: `node --test tests/globalworth-it-contract.test.js`
Expected: all PASS.

### Task 3: Implement and test the Vercel submission endpoint

**Files:**
- Create: `api/globalworth-it-submit.js`
- Create: `tests/globalworth-it-api.test.js`

- [ ] **Step 1: Write handler tests before the endpoint exists**

Cover method 405, invalid origin 403, honeypot no-write success, incomplete
payload 400, Firestore failure 500 without secret leakage, successful write and
idempotent document path.

```js
const { createHandler } = require('../api/globalworth-it-submit');

test('zapisuje kompletną odpowiedź pod stabilną ścieżką', async () => {
  const writes = [];
  const handler = createHandler({
    getServerFirestoreToken: async () => 'server-token',
    setDoc: async (path, doc) => writes.push({ path, doc }),
    now: () => '2026-08-07T10:00:00.000Z',
  });
  const res = responseRecorder();
  await handler(requestWith(validPayload()), res);
  assert.equal(res.statusCode, 200);
  assert.equal(writes[0].path, 'globalworth_it_responses/response-abc12345');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/globalworth-it-api.test.js`
Expected: FAIL because the endpoint does not exist.

- [ ] **Step 3: Implement the endpoint with dependency injection for tests**

The default export uses `_async-firestore`; `createHandler` accepts the same
dependencies for deterministic tests. Return only `{ok, submissionId,
submittedAt}` on success. Do not echo answers or server errors.

- [ ] **Step 4: Run endpoint and contract tests**

Run: `node --test tests/globalworth-it-contract.test.js tests/globalworth-it-api.test.js`
Expected: all PASS.

### Task 4: Move the approved page and connect final submission

**Files:**
- Create: `globalworth/index.html`
- Create: `globalworth/assets/it-questionnaire.css`
- Create: `globalworth/assets/it-questionnaire.js`
- Create: `tests/globalworth-it-page.test.js`

- [ ] **Step 1: Write page-level tests before copying the page**

Verify `noindex,nofollow`, the 16-question asset, `/api/globalworth-it-submit`,
the warning against tenant data/passwords/keys, absence of prototype-local-only
copy, and a final confirmation state with submission reference.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/globalworth-it-page.test.js`
Expected: FAIL because `globalworth/index.html` does not exist.

- [ ] **Step 3: Copy the approved prototype mechanically and patch behavior**

Reuse the three approved files from `PROJEKTY/GLOBALWORTH/oferta/`. Keep
localStorage for drafts. Add `submitFinal(response)` using same-origin `fetch`,
an in-flight button state, data notice acknowledgement, error handling that
preserves the draft, and success data returned by the API.

- [ ] **Step 4: Run page tests and the existing questionnaire behavior tests**

Run: `node --test tests/globalworth-it-page.test.js tests/globalworth-it-questionnaire.test.js`
Expected: all PASS.

### Task 5: Add authenticated answers to the existing panel

**Files:**
- Modify: `panel.html`
- Modify: `firestore.rules`
- Create: `tests/globalworth-it-panel.test.js`

- [ ] **Step 1: Write failing static panel and rules tests**

Assert that the panel contains a `globalworth` tab, reads
`globalworth_it_responses` only after Firebase Auth, renders summaries and
supports JSON/print. Assert that Firestore rules deny public reads and permit
reads only for signed-in users; update/delete remain denied.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/globalworth-it-panel.test.js`
Expected: FAIL because the tab and rules do not exist.

- [ ] **Step 3: Implement the minimal read-only panel section and rules**

Use the panel's existing `auth.onAuthStateChanged`. Add one query ordered by
`submitted_at`, list cards, detail expansion, safe `textContent` rendering,
download JSON and `window.print()`. Do not add edit or delete controls.

- [ ] **Step 4: Run panel tests**

Run: `node --test tests/globalworth-it-panel.test.js`
Expected: all PASS.

### Task 6: Verify locally and review security

**Files:**
- Modify only if a failing test reveals an in-scope defect.

- [ ] **Step 1: Run all Globalworth and AI Radar tests**

Run: `node --test tests/globalworth-it-*.test.js tests/ai-radar-cadence.test.js tests/ai-radar-lead-magnets-delivery.test.js`
Expected: all PASS.

- [ ] **Step 2: Run the full repository test suite**

Run: `node --test tests/*.test.js`
Expected: all PASS, including the previously failing AI Radar cadence test.

- [ ] **Step 3: Run syntax and secret-diff checks**

```bash
node --check api/_globalworth-it.js
node --check api/globalworth-it-submit.js
node --check globalworth/assets/it-questionnaire.js
git diff --check
git diff | rg -n 'PRIVATE KEY|SECRET_KEY=|TOKEN=' && exit 1 || true
```

Expected: syntax clean, no whitespace errors, no secret material.

- [ ] **Step 4: Serve the static project and run browser smoke tests**

Run a local static server. Verify the page at mobile and desktop widths,
complete a 16-answer flow against a stubbed success response, test a failed
submission, reload the draft, and verify no horizontal overflow.

- [ ] **Step 5: Commit the feature**

```bash
git add globalworth api/_globalworth-it.js api/globalworth-it-submit.js panel.html firestore.rules tests/globalworth-it-*.test.js docs/superpowers
git commit -m "feat: dodaj formularz Globalworth z trwałym zapisem"
```

### Task 7: Production gate and deployment

**Files:**
- No further source changes unless verification finds a defect.

- [ ] **Step 1: Show Darek the exact deployment diff and request explicit PROD approval**

State that pushing the branch to `origin/main` triggers Vercel production and
updates Firestore rules only if separately deployed. Do not deploy yet.

- [ ] **Step 2: After approval, update Firestore rules with the narrow target**

Run the rules test once more, then deploy only `firestore:rules` to
`ai-team-zlecenia`. Do not deploy hosting or other Firebase resources.

- [ ] **Step 3: Push the verified commit to `origin/main`**

Run: `git push origin HEAD:main`
Expected: fast-forward accepted and Vercel production deployment starts.

- [ ] **Step 4: Verify production**

Check:

- `GET https://ai-team.pl/globalworth/` returns 200 and HTML,
- title and `noindex` are present,
- invalid `POST /api/globalworth-it-submit` returns 400 without writing,
- one controlled, clearly marked test record writes successfully,
- the authenticated panel can read that record,
- AI Radar production cron list contains the two daily UTC entries,
- no duplicate newsletter send was triggered by deployment.

- [ ] **Step 5: Update AI-Team memory and `_STAN.md`**

Record the production URL, Firestore collection, panel location, schema version,
AI Radar scheduling rule, test results and any operational caveat. Commit and
push the documentation update only if it belongs in the same repository;
workspace memory is updated separately after production verification.
