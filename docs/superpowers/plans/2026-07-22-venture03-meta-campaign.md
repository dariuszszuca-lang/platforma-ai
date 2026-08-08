# VENTURE-03 Meta Campaign Implementation Plan

> **For Codex:** wykonuj sekwencyjnie. Każdy zapis do Firebase lub Meta respektuje bramy zgód z `ADS_PROTOCOL.md` i `cloud_safety.md`.

**Goal:** Usunąć błąd zapisu leada, zweryfikować lejek Mapy i przygotować kampanię Meta 20 zł/dzień bez rozpoczęcia wydatku przed `OK aktywuj`.

**Architecture:** Statyczny quiz wywołuje istniejący endpoint `/api/mapa-send` w trybie `venture03-lead`. Uwierzytelniony backend zapisuje do izolowanej kolekcji Firestore. Meta optymalizuje pod przeglądarkowy `Lead`, ale Stripe pozostaje źródłem prawdy o sprzedaży. Kampania ma jeden szeroki adset i trzy reklamy różniące się wyłącznie kątem komunikacji.

**Tech Stack:** Vercel static/serverless, Firestore Rules, Node test runner, Playwright, Meta Marketing API v25, Stripe Payment Link.

---

### Task 1: Naprawić regułę zapisu VENTURE-03

**Files:**
- Modify: `firestore.rules`
- Test: `tests/firestore-rules.test.js`

1. Uruchom test reguły i potwierdź RED.
2. Dodaj tylko `match /venture_03_leads/{leadId}` z read/create/update dla `isSignedIn()` i zablokowanym delete.
3. Uruchom test reguły oraz wszystkie testy VENTURE-03.
4. Po `OK wdrażaj regułę` wykonaj `firebase deploy --only firestore:rules --project ai-team-zlecenia --dry-run`.
5. Jeśli dry-run jest czysty, wdroż dokładnie ten sam target: `firebase deploy --only firestore:rules --project ai-team-zlecenia`.
6. Nie wdrażaj hostingu, funkcji ani innych reguł.

### Task 2: Powtórzyć produkcyjny E2E

**Files:**
- Verify: `mapa-wdrozenia.html`
- Verify: `mapa-wdrozenia-diagnoza.html`
- Verify: `mapa-wdrozenia-dziekuje.html`
- Verify: `assets/venture03-tracking.js`

1. Otwórz landing z pełnym zestawem UTM.
2. Przejdź 12 pytań i zapisz syntetyczny email `.invalid`.
3. Oczekuj HTTP 200, widocznego wyniku i dokumentu w `venture_03_leads` z etapem, UTM i zgodą.
4. Przechwyć i zablokuj żądania Pixela przed wysłaniem; potwierdź Lead, InitiateCheckout i Purchase z value 147 PLN bez PII.
5. W Events Manager/Test Events potwierdź zdarzenia, jeśli dostępna jest zalogowana sesja. Nie deklaruj tego bez dowodu.

### Task 3: Przygotować finalne kreacje

**Files:**
- Create: `PROJEKTY/VENTURE-03/marketing/ads/` po zatwierdzeniu kierunków A/B/C.

1. Po akceptacji copy wygeneruj trzy grafiki 1080×1350 zgodne z brandingiem reklam.
2. Sprawdź czy tekst mieści się w safe zone, jest czytelny na mobile i ma maksymalnie jeden główny komunikat.
3. Pokaż pliki Darkowi i oznacz je jako ZATWIERDZONE dopiero po jawnej akceptacji.

### Task 4: Utworzyć obiekty Meta jako PAUSED

**Files:**
- Source of truth: `PROJEKTY/AUTOFIRMA/REKLAMY/campaigns/2026-07-22_mapa-wdrozenia-ai.md`

1. Pokaż aktualny dry-run i poczekaj na `OK utwórz PAUSED`.
2. Wgraj trzy zatwierdzone obrazy do `/{ad_account}/adimages`.
3. Utwórz kampanię `OUTCOME_LEADS` jako PAUSED.
4. Utwórz jeden adset 2000 groszy/dzień, OFFSITE_CONVERSIONS, Pixel+LEAD, FB/IG Feed, broad PL 25-60, jako PAUSED.
5. Utwórz trzy creatives z odrębnymi UTM i trzy ads jako PAUSED.
6. Odczytaj obiekty i sprawdź nazwy, budżet, target, URL, CTA, status oraz problemy review.

### Task 5: Aktywować i monitorować

1. Pokaż Darkowi podgląd obiektów PAUSED.
2. Aktywuj dopiero po dokładnym `OK aktywuj`.
3. Po pierwszych 5-10 zł sprawdź technikę, po 40 zł wydaj pierwszy werdykt.
4. Pauza przy 80 zł bez Lead/checkout albo 120 zł bez Purchase Stripe.
5. Każdy raport łączy świeży odczyt Meta, Firestore i Stripe.

