# Meta Lead Panel Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Każdy lead z formularza Meta ma wysłać powiadomienie do Darka, trafić do Firestore z pełną atrybucją, dostać obiecany materiał, a panel ma pokazać rzeczywisty status tych operacji.

**Architecture:** Lokalny poller Meta pozostaje operatorem pobierania leadów i wywołuje istniejący endpoint dostawy materiału. Atrybucja oraz statusy operacyjne trafiają do istniejącej mapy `utm` w `newsletter_subscribers`, która jest już dozwolona przez reguły produkcyjne. Panel czyta te statusy zamiast wnioskować o wysyłce z samego typu formularza. Nie wdrażamy reguł Firestore kontem z rolą Owner.

**Tech Stack:** Python 3, Meta Graph API, Firestore REST i Security Rules, Vercel, statyczny JavaScript, Node.js test runner.

---

### Task 1: Test kontraktu danych i panelu

**Files:**
- Create: `tests/meta-lead-panel-status.test.js`
- Create: `/Users/dariu/.codex/memories/meta-lead-export/test_export_leads.py`

- [x] Dodać test zachowania istniejącego kontraktu Firestore z mapą `utm`.
- [x] Dodać test panelu wymagający renderowania nazwy formularza, kampanii, zestawu i reklamy oraz statusów `pending`, `sent`, `failed`.
- [x] Dodać test pollera wymagający inicjalnego statusu dostawy i funkcji aktualizacji statusu w Firestore.
- [x] Uruchomić `node --test tests/meta-lead-panel-status.test.js` oraz `python3 -m unittest test_export_leads.py -v` i potwierdzić oczekiwane błędy przed implementacją.

### Task 2: Zachowanie bezpiecznego kontraktu Firestore

**Files:**
- Modify: `firestore.rules`

- [x] Użyć istniejącej dozwolonej mapy `utm` bez rozszerzania publicznego kontraktu.
- [x] Zachować istniejącą regułę VENTURE-03 i wszystkie ograniczenia wypisu.
- [x] Uruchomić testy reguł.

### Task 3: Rzeczywiste statusy w automacie Meta

**Files:**
- Modify: `/Users/dariu/.codex/memories/meta-lead-export/export_leads.py`

- [x] Zapisać atrybucję formularza, kampanii, zestawu i reklamy.
- [x] Zapisać `utm.owner_notification.status` na podstawie zaakceptowania wiadomości przez Resend.
- [x] Utworzyć `utm.delivery.status=pending` przed próbą dostawy.
- [x] Po odpowiedzi endpointu dostawy zaktualizować dokument na `sent` albo `failed`, bez zapisywania PII w logach.
- [x] Dla lokalnie potwierdzonych historycznych dostaw zsynchronizować status do Firestore bez ponownej wysyłki.
- [ ] Uruchomić poller na danych produkcyjnych i potwierdzić wynik zagregowany.

### Task 4: Panel z rzeczywistą atrybucją

**Files:**
- Modify: `panel.html`

- [x] Zastąpić domniemany zielony znacznik komponentem opartym na `utm.delivery.status`.
- [x] Pokazać status powiadomienia do Darka.
- [x] Pokazać formularz, kampanię, zestaw reklam i reklamę, gdy pola istnieją.
- [x] Zachować czytelny tryb zgodności dla historycznych rekordów bez nowych pól.
- [x] Uruchomić test panelu.

### Task 5: Wdrożenie i weryfikacja produkcyjna

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/_STAN.md`

- [x] Sprawdzić projekt Firebase `ai-team-zlecenia`, aktywne konto i diff reguł.
- [x] Odstąpić od wdrożenia reguł, ponieważ aktywne konto ma rolę Owner, a produkcyjny kontrakt `utm` już wystarcza.
- [ ] Uruchomić poller ręcznie, aby ponowił nieudany zapis i dostawę obecnego leada.
- [ ] Sprawdzić stan: brak błędów subskrypcji, dostawa `sent`, powiadomienie właściciela bez duplikatu.
- [ ] Zacommitować wyłącznie pliki tej naprawy i wypchnąć `main` do repo `platforma-ai`.
- [ ] Po automatycznym wdrożeniu Vercel sprawdzić `https://ai-team.pl/panel`: HTTP 200, oczekiwane elementy panelu i brak regresji testów.
- [ ] Zapisać commit, wynik i ograniczenia w changelogu oraz `_STAN.md`.
