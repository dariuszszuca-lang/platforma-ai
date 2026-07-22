# VENTURE-03 Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać do quizu obowiązkowy zapis emaila przed wynikiem, izolowany rejestr leadów VENTURE-03 oraz pomiar Meta od wejścia do zakupu.

**Architecture:** Statyczny quiz wywołuje istniejącą funkcję Vercel `/api/mapa-send` w trybie `venture03-lead`. Logika zapisu znajduje się w `server/venture03-lead.js` i używa osobnej kolekcji Firestore przez istniejące uwierzytelnienie serwerowe. Dzięki temu nie powstaje kolejna funkcja ponad limit Vercel Hobby. Wspólny skrypt przeglądarkowy zachowuje UTM i emituje standardowe zdarzenia Meta bez danych osobowych.

**Tech Stack:** HTML, CSS, JavaScript, Vercel Serverless Functions, Firestore REST, Meta Pixel, Node.js `node:test`.

---

### Task 1: Testy kontraktu leada i pomiaru

**Files:**
- Create: `tests/venture03-lead.test.js`
- Create: `tests/venture03-tracking.test.js`
- Create: `tests/mapa-wdrozenia-static.test.js`

- [ ] **Step 1: Write the failing endpoint tests**

Testy wymagają od `server/venture03-lead.js` normalizacji emaila, odrzucenia braku zgody, walidacji etapu 0 do 5 i dokumentu w kolekcji `venture_03_leads`.

- [ ] **Step 2: Run endpoint tests and verify RED**

Run: `node --test tests/venture03-lead.test.js`

Expected: FAIL, ponieważ endpoint nie istnieje.

- [ ] **Step 3: Write the failing tracking tests**

Testy wymagają od `assets/venture03-tracking.js` odczytu `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` i `utm_term`, bez emaila w parametrach zdarzeń.

- [ ] **Step 4: Run tracking and static tests and verify RED**

Run: `node --test tests/venture03-tracking.test.js tests/mapa-wdrozenia-static.test.js`

Expected: FAIL, ponieważ skrypt, formularz i znaczniki zdarzeń nie istnieją.

### Task 2: Izolowany zapis w istniejącej funkcji Mapy

**Files:**
- Create: `server/venture03-lead.js`
- Modify: `api/mapa-send.js`
- Test: `tests/venture03-lead.test.js`

- [ ] **Step 1: Implement validation helpers**

Moduł eksportuje do testów `normalizeLeadInput`, `buildLeadDocument` i `leadDocumentId`. Email jest normalizowany do małych liter, etap jest liczbą 0 do 5, a zgoda musi mieć wartość `true`.

- [ ] **Step 2: Implement the public handler**

Tryb `venture03-lead` w `/api/mapa-send` stosuje istniejący honeypot, kontrolę źródła i limit żądań. Moduł zapisu używa `getServerFirestoreToken()` oraz `setDoc('venture_03_leads/<hash>', ...)` z istniejącego `api/newsletter-send.js`.

- [ ] **Step 3: Run endpoint tests and verify GREEN**

Run: `node --test tests/venture03-lead.test.js`

Expected: PASS.

### Task 3: Wspólny pomiar Meta i atrybucja

**Files:**
- Create: `assets/venture03-tracking.js`
- Modify: `mapa-wdrozenia.html`
- Modify: `mapa-wdrozenia-diagnoza.html`
- Modify: `mapa-wdrozenia-dziekuje.html`
- Test: `tests/venture03-tracking.test.js`

- [ ] **Step 1: Implement UTM persistence and safe Meta events**

Skrypt zapisuje wyłącznie parametry kampanii w `sessionStorage`, udostępnia `getAttribution()` i `track(eventName, params)`, a dane osobowe są odrzucane z parametrów zdarzenia.

- [ ] **Step 2: Wire page events**

Landing i quiz wysyłają `ViewContent`; linki Stripe wysyłają `InitiateCheckout`; podziękowanie wysyła `Purchase` z `value: 147`, `currency: 'PLN'` i blokadą powtórzenia w `localStorage`.

- [ ] **Step 3: Run tracking tests and verify GREEN**

Run: `node --test tests/venture03-tracking.test.js`

Expected: PASS.

### Task 4: Email przed wynikiem

**Files:**
- Modify: `mapa-wdrozenia-diagnoza.html`
- Test: `tests/mapa-wdrozenia-static.test.js`

- [ ] **Step 1: Add the gate form**

Po ostatniej odpowiedzi quiz pokazuje formularz z emailem, honeypotem, zgodą na zapis wyniku i kontakt dotyczący Mapy oraz linkiem do `/privacy`.

- [ ] **Step 2: Submit lead before revealing the result**

Frontend wysyła etap i atrybucję do `/api/mapa-send` z trybem `venture03-lead`. Sukces uruchamia `Lead` i pokazuje obliczony wynik. Błąd pozostawia formularz z komunikatem i możliwością ponowienia.

- [ ] **Step 3: Run static tests and verify GREEN**

Run: `node --test tests/mapa-wdrozenia-static.test.js`

Expected: PASS.

### Task 5: Weryfikacja i wdrożenie

**Files:**
- Modify: `sitemap.xml` only if routes change; no route change is planned.

- [ ] **Step 1: Run the complete test suite**

Run: `node --test tests/venture03-lead.test.js tests/venture03-tracking.test.js tests/mapa-wdrozenia-static.test.js`

Expected: all tests PASS with 0 failures.

- [ ] **Step 2: Run local syntax and content checks**

Run: `node --check api/mapa-send.js && node --check server/venture03-lead.js && node --check assets/venture03-tracking.js`

Expected: exit code 0.

- [ ] **Step 3: Review diff and secrets**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors and no secret files.

- [ ] **Step 4: Commit and push**

Commit message: `feat(mapa-wdrozenia): zapis leada i pomiar Meta`

- [ ] **Step 5: Verify production**

Sprawdzić HTTP 200, obecność formularza, załadowanie skryptów oraz bezpieczny test endpointu bez zapisu. Pełny test zapisu wykonać na kontrolowanym adresie dopiero przy QA kampanii.
