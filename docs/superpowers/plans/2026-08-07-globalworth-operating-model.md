# Globalworth Operating Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rozszerzyć podstronę Globalworth o końcową sekcję „Docelowy model operacyjny AI”, dodać odnośnik „Model AI” w menu i zastąpić język pilotażu językiem procesu wdrożeniowego.

**Architecture:** Zmiana pozostaje w istniejącej statycznej stronie `globalworth/index.html`. Kontrakt treści zostanie zabezpieczony testami Node, a nowa sekcja użyje obecnych tokenów, typografii, klasy `reveal` i breakpointów. Formularz, API i panel odpowiedzi pozostają bez zmian.

**Tech Stack:** HTML5, CSS, Node.js `node:test`, statyczny deploy Vercel.

---

## File Map

- Modify: `tests/globalworth-it-page.test.js` — kontrakt terminologii, kolejności sekcji i odnośnika menu.
- Modify: `globalworth/index.html` — copy, menu, końcowa sekcja modelu operacyjnego i responsywne style.
- Modify: `CHANGELOG.md` — produkcyjny zapis zmiany i końcowy commit.
- Create outside repo: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/GLOBALWORTH/mail-do-agnieszki-DRAFT.md` — finalny draft maila do skopiowania.
- Modify outside repo: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/claude-shared/memory/project_ai_team_globalworth.md` — stan wdrożenia i produkcji.
- Modify outside repo: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/_STAN.md` — skrót istotnej zmiany publicznej podstrony.

### Task 1: Zabezpieczyć kontrakt treści testami

**Files:**
- Modify: `tests/globalworth-it-page.test.js`
- Test: `tests/globalworth-it-page.test.js`

- [ ] **Step 1: Write the failing tests**

Dodać na końcu pliku:

```js
test('materiał używa języka procesu wdrożeniowego zamiast pilotażu', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const withoutProductName = html.replace(/Microsoft 365 Copilot/gi, 'Microsoft 365');

  assert.doesNotMatch(withoutProductName, /\bpilot\w*|\bpilotaż\w*/i);
  assert.match(html, /pierwszy proces wdrożeniowy/i);
  assert.match(html, /kroków do wdrożenia/i);
});

test('docelowy model AI jest ostatnią sekcją merytoryczną i ma link w menu', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const resultsPosition = html.indexOf('id="rezultaty"');
  const modelPosition = html.indexOf('id="model-ai"');
  const ctaPosition = html.indexOf('<section class="cta"');

  assert.ok(resultsPosition > -1);
  assert.ok(modelPosition > resultsPosition);
  assert.ok(ctaPosition > modelPosition);
  assert.match(html, /<a href="#model-ai">Model AI<\/a>/);
  assert.match(html, /Docelowy model operacyjny AI/i);
});

test('model AI pokazuje wspólny kontekst i cztery poziomy widoczności', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(html, /Wspólny kontekst operacyjny/i);
  assert.match(html, />Pracownik</);
  assert.match(html, />Proces</);
  assert.match(html, />Manager</);
  assert.match(html, />Dyrektor</);
  assert.match(html, /Wspólna warstwa informacji i automatyzacji/i);
  assert.doesNotMatch(html, /Zewnętrzny Dział AI/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/globalworth-it-page.test.js
```

Expected: three new tests fail because the page still contains pilot terminology and does not contain `#model-ai` or the new section.

- [ ] **Step 3: Commit the red tests**

```bash
git add tests/globalworth-it-page.test.js
git commit -m "test: opisz docelowy model AI Globalworth"
```

### Task 2: Zmienić narrację z pilotażu na wdrożenie

**Files:**
- Modify: `globalworth/index.html`
- Test: `tests/globalworth-it-page.test.js`

- [ ] **Step 1: Replace the visible copy**

W `globalworth/index.html` wprowadzić dokładnie następujące zamiany:

```text
od diagnozy do pilota → od diagnozy do pierwszego wdrożenia
Droga od zgłoszonych potrzeb do pilota → Droga od zgłoszonych potrzeb do pierwszego wdrożenia
jeden proces pilotażowy → pierwszy proces wdrożeniowy
6 kroków do pilota → 6 kroków do wdrożenia
sprawdzić w pilocie → rozpocząć jako pierwszy proces wdrożeniowy
Ćwiczenia, materiały i pilot → Ćwiczenia, materiały i pierwsze wdrożenie
dla programu i pilota → dla programu i pierwszego wdrożenia
Warsztat i pilot → Warsztat i pierwszy proces wdrożeniowy
uruchamia jeden proces pilotażowy → uruchamia pierwszy proces wdrożeniowy
pilot sprawdzony na realnym procesie → rozwiązanie sprawdzone na realnym procesie
gdzie może działać przyszły pilot → gdzie może działać pierwszy proces wdrożeniowy
zakres bezpiecznego pilota → zakres bezpiecznego procesu wdrożeniowego
Jeden przepływ pilotażowy → Pierwszy przepływ wdrożeniowy
rekomendacją procesu pilotażowego → rekomendacją pierwszego procesu wdrożeniowego
```

Nie zmieniać nazwy produktu `Microsoft 365 Copilot`.

- [ ] **Step 2: Run the terminology test**

```bash
node --test tests/globalworth-it-page.test.js
```

Expected: test terminologii przechodzi; dwa testy nowej sekcji nadal nie przechodzą.

- [ ] **Step 3: Commit the terminology update**

```bash
git add globalworth/index.html
git commit -m "copy: zmien pilotaz na proces wdrozeniowy"
```

### Task 3: Dodać końcową sekcję modelu AI i odnośnik w menu

**Files:**
- Modify: `globalworth/index.html`
- Test: `tests/globalworth-it-page.test.js`

- [ ] **Step 1: Add the menu link**

Po odnośniku `Rezultaty` dodać:

```html
<a href="#model-ai">Model AI</a>
```

- [ ] **Step 2: Add the operating-model styles before the CTA styles**

```css
/* Operating model */
.operating-model{background:var(--cream)}
.operating-shell{display:grid;grid-template-columns:.88fr 1.12fr;gap:18px;align-items:stretch;margin-top:52px}
.operating-core{position:relative;overflow:hidden;background:var(--navy);color:#fff;border-radius:18px;padding:36px;box-shadow:var(--shadow-strong)}
.operating-core::after{content:"";position:absolute;width:280px;height:280px;right:-150px;bottom:-170px;border:1px solid rgba(67,170,115,.3);border-radius:50%;box-shadow:0 0 0 52px rgba(67,170,115,.035),0 0 0 104px rgba(67,170,115,.02)}
.operating-core .core-label{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--green-bright)}
.operating-core h3{font-size:clamp(29px,3.4vw,40px);max-width:12ch;margin-top:18px}
.operating-core>p{position:relative;z-index:1;color:rgba(255,255,255,.74);font-size:15px;max-width:45ch;margin-top:18px}
.core-stream{position:relative;z-index:1;display:grid;gap:9px;margin-top:28px}
.core-stream span{display:flex;align-items:center;gap:10px;border-top:1px solid rgba(255,255,255,.15);padding-top:11px;font-family:var(--mono);font-size:11px;line-height:1.45;color:rgba(255,255,255,.84)}
.core-stream span::before{content:"";width:7px;height:7px;flex:none;border-radius:50%;background:var(--green-bright);box-shadow:0 0 0 4px rgba(67,170,115,.12)}
.operating-perspectives{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.perspective{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:25px;min-height:196px;box-shadow:var(--shadow)}
.perspective .p-index{display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--green)}
.perspective .p-index::after{content:"";width:28px;height:1px;background:var(--line)}
.perspective h3{font-family:var(--sans);font-size:20px;font-weight:600;margin-top:25px}
.perspective p{font-size:14.5px;color:var(--muted);margin-top:10px}
.development-path{display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--paper);box-shadow:var(--shadow)}
.development-step{position:relative;min-height:174px;padding:25px 23px;border-right:1px solid var(--line)}
.development-step:last-child{border-right:0}
.development-step:not(:last-child)::after{content:"→";position:absolute;z-index:2;right:-12px;top:26px;width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--line);border-radius:50%;background:var(--paper);color:var(--green);font-family:var(--mono);font-size:12px}
.development-step .step-n{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--green)}
.development-step h3{font-family:var(--sans);font-size:17px;font-weight:600;line-height:1.35;margin-top:16px}
.development-step p{font-size:13.5px;color:var(--muted);margin-top:9px}
.model-note{margin-top:24px;padding-left:18px;border-left:2px solid var(--green);font-size:14px;color:var(--muted);max-width:82ch}
```

Do `@media(max-width:980px)` dodać:

```css
.operating-shell{grid-template-columns:1fr}
.development-path{grid-template-columns:repeat(2,1fr)}
.development-step:nth-child(2){border-right:0}
.development-step:nth-child(-n+2){border-bottom:1px solid var(--line)}
.development-step:nth-child(2)::after{display:none}
```

Do `@media(max-width:720px)` dodać:

```css
.operating-perspectives,.development-path{grid-template-columns:1fr}
.perspective{min-height:auto}
.development-step{min-height:auto;border-right:0;border-bottom:1px solid var(--line)}
.development-step:nth-child(2){border-bottom:1px solid var(--line)}
.development-step:last-child{border-bottom:0}
.development-step:not(:last-child)::after{content:"↓";right:24px;top:auto;bottom:-12px}
.development-step:nth-child(2)::after{display:grid}
```

- [ ] **Step 3: Add the last content section before `</main>`**

```html
<section class="section operating-model" id="model-ai" aria-labelledby="model-ai-title">
  <div class="wrap">
    <div class="sec-head wide reveal">
      <span class="index">07 / Kierunek rozwoju</span>
      <h2 id="model-ai-title">Docelowy model operacyjny AI</h2>
      <p class="lead">Docelowo nie chodzi o kolejne pojedyncze narzędzia. Chodzi o jeden wspólny sposób pracy, w którym procesy, automatyzacje, decyzje i raportowanie korzystają z tego samego kontekstu.</p>
    </div>

    <div class="operating-shell">
      <article class="operating-core reveal">
        <span class="core-label">Wspólna warstwa operacyjna</span>
        <h3>Wspólny kontekst operacyjny</h3>
        <p>Jedno uporządkowane źródło informacji o stanie spraw, decyzjach, przekazaniach i kolejnych działaniach. Z dostępem dopasowanym do roli i zasad Globalworth.</p>
        <div class="core-stream" aria-label="Elementy wspólnego kontekstu">
          <span>Aktualny stan spraw i odpowiedzialności</span>
          <span>Decyzje, wyjątki i akceptacje człowieka</span>
          <span>Historia przekazań między rolami</span>
          <span>Dane do raportowania i dalszej automatyzacji</span>
        </div>
      </article>

      <div class="operating-perspectives">
        <article class="perspective reveal"><span class="p-index">01 / Widok</span><h3>Pracownik</h3><p>Widzi aktualny stan sprawy, potrzebne informacje i następny krok bez szukania kontekstu w wielu mailach.</p></article>
        <article class="perspective reveal"><span class="p-index">02 / Widok</span><h3>Proces</h3><p>Łączy terminy, automatyzacje, wyjątki i momenty, w których decyzję musi zatwierdzić człowiek.</p></article>
        <article class="perspective reveal"><span class="p-index">03 / Widok</span><h3>Manager</h3><p>Widzi status pracy, zaległości, ryzyka i miejsca wymagające reakcji zespołu lub decyzji.</p></article>
        <article class="perspective reveal"><span class="p-index">04 / Widok</span><h3>Dyrektor</h3><p>Otrzymuje przekrojowy raport o przepływie informacji, wąskich gardłach i priorytetach dalszego rozwoju.</p></article>
      </div>
    </div>

    <div class="development-path reveal" aria-label="Etapy rozwoju modelu operacyjnego AI">
      <article class="development-step"><span class="step-n">ETAP 01</span><h3>Program szkoleniowy</h3><p>Wspólny standard pracy i bezpieczne przypadki użycia.</p></article>
      <article class="development-step"><span class="step-n">ETAP 02</span><h3>Pierwszy proces wdrożeniowy</h3><p>Jedno rozwiązanie uruchomione na uzgodnionym procesie i danych.</p></article>
      <article class="development-step"><span class="step-n">ETAP 03</span><h3>Wspólna warstwa informacji i automatyzacji</h3><p>Połączenie kontekstu, decyzji, przekazań i raportowania.</p></article>
      <article class="development-step"><span class="step-n">ETAP 04</span><h3>Skalowanie na kolejne procesy</h3><p>Rozwój dopiero tam, gdzie wynik i warunki IT uzasadniają następny krok.</p></article>
    </div>

    <p class="model-note reveal">To kierunek na przyszłość, nie gotowa deklaracja zakresu. Jego architekturę, bezpieczeństwo i kolejność działań można określić dopiero po odpowiedziach IT oraz pierwszym procesie wdrożeniowym.</p>
  </div>
</section>
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

```bash
node --test tests/globalworth-it-page.test.js
```

Expected: all tests in the file pass with zero failures.

- [ ] **Step 5: Commit the section**

```bash
git add globalworth/index.html
git commit -m "feat: dodaj model operacyjny AI Globalworth"
```

### Task 4: Przygotować finalny draft maila

**Files:**
- Create: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/GLOBALWORTH/mail-do-agnieszki-DRAFT.md`

- [ ] **Step 1: Create the draft with approved terminology**

```markdown
# DRAFT — mail do Agnieszki Gugały-Tywonek

**Temat:** Program szkolenia AI dla zespołu Property Management — pytania do IT

Pani Agnieszko,

dziękuję za przesłane informacje. Siedem wskazanych obszarów wystarcza, żeby przygotować wstępny program szkolenia oparty na realnej pracy zespołu Property Management.

Przygotowałem materiał, który porządkuje zgłoszone procesy, pokazuje proponowaną drogę wdrożenia i zawiera formularz pytań do działu IT:

https://ai-team.pl/globalworth/

Proszę o możliwie szczegółowe odpowiedzi. Jeśli któreś pytanie nie dotyczy środowiska Globalworth, proszę wskazać dlaczego. Jeżeli odpowiedź wymaga jeszcze ustalenia, formularz pozwala opisać, czego brakuje i kto może to potwierdzić. Po zakończeniu formularza odpowiedzi zostaną zapisane i będą widoczne po naszej stronie.

Na podstawie odpowiedzi IT przygotuję finalny program szkolenia, rekomendację pierwszego procesu wdrożeniowego oraz ofertę obejmującą zakres, harmonogram i wycenę.

W materiale pokazuję również możliwy dalszy kierunek rozwoju. Po pierwszym procesie wdrożeniowym można stopniowo zbudować jedno środowisko, w którym procesy, automatyzacje, decyzje i raportowanie korzystają ze wspólnego kontekstu. Pracownicy widzą aktualny stan spraw i przekazania między rolami, a managerowie i dyrektorzy otrzymują czytelny obraz przepływu informacji. To kierunek na przyszłość, którego zakres będzie można ocenić po odpowiedziach IT i pierwszym wdrożeniu.

Pozdrawiam
Dariusz Szuca
AI-Team
```

- [ ] **Step 2: Check the draft terminology**

Run:

```bash
rg -n -i "pilot|pilotaż|zewnętrzny dział AI" "/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/PROJEKTY/GLOBALWORTH/mail-do-agnieszki-DRAFT.md"
```

Expected: no matches.

### Task 5: Zweryfikować UI, testy i build

**Files:**
- Verify: `globalworth/index.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Run all Node tests**

```bash
node --test tests/*.test.js
```

Expected: zero failed tests.

- [ ] **Step 2: Run syntax and content checks**

```bash
git diff --check
rg -n -i "\bpilot\w*|\bpilotaż\w*" globalworth/index.html
```

Expected: `git diff --check` exits 0. The only permitted `pilot` substring is the proper product name `Microsoft 365 Copilot`.

- [ ] **Step 3: Run the production build**

```bash
vercel build --prod
```

Expected: build exits 0.

- [ ] **Step 4: Run responsive visual QA**

Serve the worktree locally and inspect at widths 1440, 1024, 768 and 375 px. Verify:

```text
- menu link Model AI scrolls to the last content section
- no horizontal scrollbar
- four perspective cards become one column on mobile
- four development steps become one column with downward connectors
- text remains readable with prefers-reduced-motion enabled
- existing IT form still renders below the IT heading
```

- [ ] **Step 5: Commit any QA-only correction**

```bash
git add globalworth/index.html tests/globalworth-it-page.test.js
git commit -m "fix: dopracuj responsywny model AI Globalworth"
```

Skip the commit only if visual QA required no correction.

### Task 6: Opublikować i zamknąć dokumentację

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/claude-shared/memory/project_ai_team_globalworth.md`
- Modify: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/_STAN.md`

- [ ] **Step 1: Push the verified feature branch to production main**

```bash
git push origin HEAD:main
```

Expected: push succeeds and Vercel starts the automatic production deployment.

- [ ] **Step 2: Verify the live page**

```bash
curl -fsS https://ai-team.pl/globalworth/ | rg -n "Docelowy model operacyjny AI|href=\"#model-ai\"|Pierwszy proces wdrożeniowy"
curl -I https://ai-team.pl/globalworth/
```

Expected: live HTML contains all three markers and HTTP response is 200.

- [ ] **Step 3: Update changelog, project memory and status**

Dopisać do `CHANGELOG.md` zmianę terminologii, sekcję `#model-ai`, odnośnik menu i commit produkcyjny. W pamięci projektu oraz `_STAN.md` zapisać datę, commit produkcyjny, wynik testów/builda, wynik live smoke testu i ścieżkę draftu maila. Nie wpisywać wartości sekretów ani danych formularza.

- [ ] **Step 4: Commit operational documentation**

```bash
git add CHANGELOG.md
git commit -m "docs: zapisz wdrozenie modelu AI Globalworth"
git push origin HEAD:main
```

Expected: final documentation commit reaches `main` and the live page remains HTTP 200.

## Final Verification Checklist

- [ ] Focused tests were observed failing before implementation.
- [ ] Focused tests pass after implementation.
- [ ] Full Node suite has zero failures.
- [ ] Production build exits 0.
- [ ] Responsive QA passes at 1440, 1024, 768 and 375 px.
- [ ] Live page returns HTTP 200 and contains the new section and menu link.
- [ ] No visible pilot terminology remains except the proper product name Microsoft 365 Copilot.
- [ ] Mail draft is ready but has not been sent.
