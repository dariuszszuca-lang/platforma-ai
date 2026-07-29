# AI Radar Three Lead Campaigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Utrzymać kampanię AI Act i uruchomić dwie dodatkowe kampanie po 20 zł dziennie, które dostarczają pełne lead magnety w pierwszej wiadomości i zapisują odbiorców do AI Radar.

**Architecture:** Dwa samodzielne materiały HTML/PDF są budowane i akceptowane przed integracją. Każda kampania otrzymuje osobny formularz Meta Higher Intent i osobne oznaczenie źródła, ale wszystkie prowadzą do jednej bazy AI Radar oraz harmonogramu poniedziałek/czwartek 18:00. Grafiki mają beztekstową warstwę z `gpt-image-2` i lokalnie nakładaną typografię.

**Tech Stack:** statyczny HTML/CSS, Chrome/Puppeteer PDF, Python Pillow do składu reklam, Meta Marketing API, Firestore, Resend/SES zgodnie z istniejącym routingiem AI-Team.

---

### Task 1: Starter Wdrożeń AI dla Firmy

**Files:**
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.html`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.pdf`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/qa-pakiet-startowy.txt`

- [ ] **Step 1: Utwórz pełny dokument HTML**

Dokument ma zawierać diagnozę, mapę procesów, macierz priorytetów, przykłady zastosowań, gotowe prompty, bezpieczeństwo, plan 30 dni, mierniki i checklistę.

- [ ] **Step 2: Sprawdź brak sztucznego języka**

Run:

```bash
rg -n 'innowacyj|kompleksow|holistycz|leverage|synerg|W dzisiejszych czasach|Podsumowując|Warto zauważyć' \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.html
```

Expected: brak wyników.

- [ ] **Step 3: Wyeksportuj PDF bez technicznych nagłówków**

Run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.pdf" \
  "file://$PWD/MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.html"
```

Expected: PDF istnieje i ma co najmniej 10 stron.

- [ ] **Step 4: Sprawdź eksport**

Run:

```bash
pdftotext MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.pdf \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/qa-pakiet-startowy.txt
rg -n 'file:///|localhost|[0-9]{1,2}/[0-9]{1,2}/2026' \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/qa-pakiet-startowy.txt
```

Expected: brak technicznych ścieżek, daty druku i adresów lokalnych.

### Task 2: System AI tygodnia, wydanie 1

**Files:**
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.html`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.pdf`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/qa-system-ai-01.txt`

- [ ] **Step 1: Utwórz szczegółowy dokument systemowy**

Materiał opisuje architekturę procesu, źródła zapytań, statusy, role AI i człowieka, dane, reguły, mierniki, trzy poziomy wdrożenia i checklistę testów.

- [ ] **Step 2: Sprawdź zgodność języka i brak niepotwierdzonych wyników**

Run:

```bash
rg -n 'gwarant|zawsze|na pewno|zwiększysz sprzedaż|innowacyj|kompleksow|holistycz' \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.html
```

Expected: brak obietnic wyniku i słów z listy zakazanej.

- [ ] **Step 3: Wyeksportuj i zweryfikuj PDF**

Run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.pdf" \
  "file://$PWD/MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.html"
pdftotext MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.pdf \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/qa-system-ai-01.txt
```

Expected: PDF istnieje, tekst jest możliwy do zaznaczenia, brak nagłówków Chrome.

### Task 3: Cztery kreacje reklamowe

**Files:**
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/base-pakiet-a.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/base-pakiet-b.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/base-system-a.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/base-system-b.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/pakiet-a-final.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/pakiet-b-final.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/system-a-final.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/system-b-final.png`
- Create: `MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/compose_text.py`

- [ ] **Step 1: Wygeneruj cztery beztekstowe bazy w gpt-image-2**

Każdy prompt ma wymagać formatu reklamowego 1:1, stylu AI-Team, miejsca na późniejszy tekst oraz zakazu generowania liter, logo i znaków wodnych.

- [ ] **Step 2: Nałóż tekst lokalnie**

Skrypt `compose_text.py` używa Pillow, stałych marginesów, fontu bezszeryfowego i palety AI-Team. Nie modyfikuje baz.

- [ ] **Step 3: Sprawdź wymiary i czytelność**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
from PIL import Image
for path in Path("MATERIALY/output/ai-radar-lead-magnets-2026-07/ads").glob("*-final.png"):
    image = Image.open(path)
    assert image.size == (1080, 1080), (path, image.size)
    print(path.name, image.size)
PY
```

Expected: cztery pliki 1080 × 1080.

### Task 4: Podgląd Darka

- [ ] **Step 1: Otwórz oba HTML, oba PDF i cztery grafiki**

Run:

```bash
open \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.html \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/starter-wdrozen-ai-dla-firmy.pdf \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.html \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/system-ai-tygodnia-01-follow-up.pdf \
  MATERIALY/output/ai-radar-lead-magnets-2026-07/ads/*-final.png
```

Expected: wszystkie materiały otwierają się lokalnie do oceny.

- [ ] **Step 2: Zapisz uwagi Darka przed integracją**

Nie tworzyć formularzy ani aktywnych reklam przed odbiorem materiałów i kreacji.

### Task 5: Pierwsze wiadomości i nurturing

**Files:**
- Create: `STRONY/wlasne/ai-team/newsletter/welcome-starter-wdrozen.md`
- Create: `STRONY/wlasne/ai-team/newsletter/welcome-system-ai-tygodnia.md`
- Create: `STRONY/wlasne/ai-team/newsletter/nurturing-starter-wdrozen.md`
- Create: `STRONY/wlasne/ai-team/newsletter/nurturing-system-ai-tygodnia.md`

- [ ] **Step 1: Napisz pierwsze wiadomości dostarczające cały materiał**

Każda wiadomość ma jeden cel: dostarczyć oba formaty lead magnetu i ustawić oczekiwanie, że AI Radar przychodzi w poniedziałki oraz czwartki o 18:00.

- [ ] **Step 2: Napisz wiadomości wdrożeniowe**

Kolejne wiadomości nie ukrywają części lead magnetu. Pomagają wykonać pierwszy krok, pokazują błąd do uniknięcia i zapraszają do odpowiedniego produktu tylko wtedy, gdy wynika to z tematu.

### Task 6: Routing leadów i zgód

**Files:**
- Modify: `tools/meta-ads/export_leads.py`
- Modify: `tools/meta-ads/test_export_leads.py`
- Modify: `tools/meta-ads/run_lead_export.sh`
- Modify: `/Users/dariu/.codex/memories/meta-lead-export/export_leads.py`

- [ ] **Step 1: Dodaj test atrybucji kampanii**

Test ma wymagać pól `campaign_id`, `ad_id`, `form_id`, `lead_magnet`, `consent_text_version`, `consent_timestamp` i `source`.

- [ ] **Step 2: Dodaj mapowanie dwóch nowych formularzy**

Źródła:

```text
meta_ai_act
meta_starter_wdrozen_ai
meta_system_ai_tygodnia
```

- [ ] **Step 3: Zabezpiecz lokalne pliki leadów**

Każdy nowy plik z danymi osobowymi ma tryb `0600`; logi nie zawierają adresu e-mail.

- [ ] **Step 4: Uruchom testy**

Run:

```bash
python3 -m unittest tools/meta-ads/test_export_leads.py -v
```

Expected: wszystkie testy PASS.

### Task 7: Formularze i kampanie Meta

**Files:**
- Modify: `tools/meta-ads/create_campaign_paused.py`
- Create: `PROJEKTY/AUTOFIRMA/REKLAMY/campaigns/2026-07-29_starter-wdrozen-ai.md`
- Create: `PROJEKTY/AUTOFIRMA/REKLAMY/campaigns/2026-07-29_system-ai-tygodnia.md`

- [ ] **Step 1: Utwórz dwa formularze Higher Intent w statusie roboczym**

Każdy formularz ma osobną nazwę, jasną zgodę newsletterową, politykę prywatności, ekran sprawdzenia odpowiedzi i poprawny materiał po zapisie.

- [ ] **Step 2: Utwórz dwie kampanie w statusie PAUSED**

Każda kampania: cel Leads, jeden zestaw, Facebook Feed, dwie reklamy, budżet 20 zł dziennie.

- [ ] **Step 3: Wykonaj test end-to-end**

Testowy lead Darka musi otrzymać pierwszą wiadomość z całym materiałem i zapisać się z poprawnym źródłem.

- [ ] **Step 4: Aktywuj nowe kampanie**

Aktywować dopiero po odbiorze grafik, lead magnetów i testu dostarczenia. Nie zmieniać kampanii AI Act.

- [ ] **Step 5: Kontrola po 60 zł i 200 zł**

Raport obejmuje koszt zapisu, dostarczalność, otwarcia pierwszej wiadomości, kliknięcia w materiał i źródło kampanii.
