# AI RESET Delivery Implementation Plan

> **For Darek:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dostarczać AI RESET osobom zapisanym przez dedykowany formularz Meta, dopisywać je do AI Radar na podstawie właściwej zgody i wysyłać dwa krótkie maile wdrożeniowe w 2. oraz 5. dniu.

**Architecture:** Istniejący eksport leadów Meta pozostaje jedynym schedulerem i źródłem deduplikacji. AI RESET dostaje osobny identyfikator formularza, osobną treść zgody oraz klucze dostawy per materiał i etap, dzięki czemu wcześniejszy odbiorca checklisty AI Act nadal otrzyma AI RESET. Istniejący endpoint `/api/fragment` zyskuje odseparowany tryb `ai-reset`; maile 2 i 3 wymagają sekretu automatyzacji i nie będą dostępne jako publiczny open relay.

**Tech Stack:** Python 3 (`unittest`) dla automatu Meta, Vercel Node.js dla endpointu, Amazon SES przez istniejący helper, testy `node:test`.

**Granice:** Bez tworzenia formularza Meta, bez ustawiania sekretów, bez instalowania skryptu do LaunchAgenta, bez deployu, bez wysyłki testowej na prawdziwy adres i bez uruchamiania kampanii.

---

### Task 1: Zabezpieczyć rozdzielenie AI Act i AI RESET

**Files:**
- Modify: `tools/meta-ads/test_export_leads.py`
- Modify: `tools/meta-ads/export_leads.py`

**Step 1: Write the failing tests**

- Formularz AI RESET jest dołączany tylko wtedy, gdy istnieje `AI_RESET_META_FORM_ID`.
- Zapis do AI Radar używa treści zgody i źródła właściwych dla AI RESET.
- Deduplikacja używa klucza `formularz:etap:email`, a nie samego adresu.
- Odbiorca wcześniejszej checklisty AI Act nadal kwalifikuje się do AI RESET.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Expected: FAIL z powodu brakujących funkcji konfiguracji i kluczy dostawy.

**Step 3: Write minimal implementation**

- Dodać opcjonalną konfigurację formularza AI RESET.
- Uogólnić zapis do AI Radar na formularz i jego zgodę.
- Wprowadzić osobny plik stanu etapów AI RESET z bezpieczną migracją stanu AI Act.

**Step 4: Run test to verify it passes**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Expected: PASS.

### Task 2: Przygotować trzy maile AI RESET w istniejącym endpointcie

**Files:**
- Create: `STRONY/wlasne/ai-team/tests/ai-reset-delivery.test.js`
- Modify: `STRONY/wlasne/ai-team/api/fragment.js`

**Step 1: Write the failing tests**

- Tryb `ai-reset`, etap 1, wysyła mail z publicznym linkiem do AI RESET.
- Etapy 2 i 3 są odrzucane bez poprawnego `AI_RESET_AUTOMATION_TOKEN`.
- Każdy etap ma jeden główny cel i jeden link do właściwego modułu.
- Treść nie używa frazy „małe firmy” ani nie zawiera niepotwierdzonych wyników lub case studies.

**Step 2: Run test to verify it fails**

Run: `node --test tests/ai-reset-delivery.test.js`

Expected: FAIL, bo tryb AI RESET jeszcze nie istnieje.

**Step 3: Write minimal implementation**

- Etap 1: natychmiastowa dostawa i wskazanie pierwszej sesji.
- Etap 2: po 2 dniach wybór jednego asystenta i trzy użycia.
- Etap 3: po 5 dniach powtórzenie jednego workflow i prosty pomiar tarcia.
- Użyć istniejącego SES oraz istniejących zabezpieczeń CORS, honeypot i rate limit.

**Step 4: Run test to verify it passes**

Run: `node --test tests/ai-reset-delivery.test.js`

Expected: PASS.

### Task 3: Dodać scheduler etapów 1, 2 i 3

**Files:**
- Modify: `tools/meta-ads/test_export_leads.py`
- Modify: `tools/meta-ads/export_leads.py`

**Step 1: Write the failing tests**

- Etap 1 kwalifikuje się od razu.
- Etap 2 kwalifikuje się po 48 godzinach.
- Etap 3 kwalifikuje się po 120 godzinach.
- Udana dostawa nie jest powtarzana, nieudana jest ponawiana.
- Limit wysyłek na cykl nadal chroni system.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Expected: FAIL z powodu braku harmonogramu etapów.

**Step 3: Write minimal implementation**

- Parsować `created_time` z Meta.
- Wyznaczać należne etapy.
- Wywoływać `/api/fragment` z `type: "ai-reset"` i numerem etapu.
- Do etapów 2 i 3 przekazywać token wyłącznie z env.
- Zapisywać sukces per etap; błędy pozostawiać do ponowienia.

**Step 4: Run test to verify it passes**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Expected: PASS.

### Task 4: Pełna lokalna weryfikacja

**Files:**
- Test: `STRONY/wlasne/ai-team/tests/*.test.js`
- Test: `tools/meta-ads/test_export_leads.py`

**Step 1: Run Python tests**

Run: `python3 -m unittest tools/meta-ads/test_export_leads.py`

Expected: PASS, zero połączeń z Meta, Firestore, SES i Resend.

**Step 2: Run AI RESET Node tests**

Run: `node --test tests/ai-reset.test.js tests/ai-reset-delivery.test.js`

Expected: PASS, zero prawdziwych wysyłek.

**Step 3: Review diffs and secret hygiene**

Run: `git diff --check`

Run: `rg -n "AI_RESET_AUTOMATION_TOKEN\\s*=|sk_live_|AKIA|ghp_" . -g '!node_modules/**'`

Expected: brak wartości sekretów i brak błędów whitespace.

**Step 4: Stop before external activation**

Pokazać Darkowi gotowe treści, zakres zmian i listę brakujących czynności zewnętrznych: publikacja strony, utworzenie formularza Meta, ustawienie dwóch zmiennych środowiskowych, instalacja kopii automatu oraz smoke test na kontrolnym adresie.
