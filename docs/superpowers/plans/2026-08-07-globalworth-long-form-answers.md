# Globalworth Long-Form Answers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jasno poinformować dział IT Globalworth, że odpowiedzi mogą być rozbudowane, napisane własnym językiem i pozbawione formalnego stylu.

**Architecture:** Zmiana dotyczy wyłącznie tekstów renderowanych przez istniejący komponent formularza w `globalworth/assets/it-questionnaire.js`. Kontrakt pytań, walidacja, limity backendu, struktura danych i endpoint zapisu pozostają bez zmian. Regresję chroni test statycznej treści formularza.

**Tech Stack:** statyczny HTML, JavaScript bez frameworka, Node.js `node:test`, Vercel CLI.

---

## Struktura plików

- `tests/globalworth-it-page.test.js`: testuje obecność komunikatu wprowadzającego i trzech podpowiedzi dla pól opisowych.
- `globalworth/assets/it-questionnaire.js`: renderuje ekran startowy i pola dla wariantów „Mamy odpowiedź”, „Do ustalenia” oraz „Nie dotyczy”.
- `CHANGELOG.md`: zapisuje wdrożoną zmianę treści formularza.
- `claude-shared/memory/project_ai_team_globalworth.md`: aktualizuje pamięć projektu po wdrożeniu.
- `_STAN.md`: aktualizuje bieżący snapshot po wdrożeniu.

### Task 1: Test komunikacji o swobodnych odpowiedziach

**Files:**
- Modify: `tests/globalworth-it-page.test.js`
- Test: `tests/globalworth-it-page.test.js`

- [ ] **Step 1: Dodać test, który opisuje zatwierdzoną treść**

Dodać po teście `formularz komunikuje trwały zapis i ograniczenia danych`:

```js
test('formularz pozwala na rozbudowane odpowiedzi własnym językiem', () => {
  const script = fs.readFileSync(scriptPath, 'utf8');

  assert.match(script, /Odpowiedzi mogą być rozbudowane i napisane własnym językiem/);
  assert.match(script, /Nie wymagamy formalnego stylu ani skrótowych odpowiedzi/);
  assert.match(script, /Możesz odpowiedzieć własnymi słowami/);
  assert.match(script, /Możesz podać pełny kontekst/);
  assert.match(script, /Możesz szerzej opisać stan organizacji, systemu lub procesu/);
});
```

- [ ] **Step 2: Uruchomić test i potwierdzić oczekiwany RED**

Run:

```bash
node --test tests/globalworth-it-page.test.js
```

Expected: FAIL w nowym teście, ponieważ zatwierdzone teksty nie występują jeszcze w komponencie formularza. Pozostałe testy w pliku przechodzą.

### Task 2: Dodać komunikat i podpowiedzi

**Files:**
- Modify: `globalworth/assets/it-questionnaire.js:543-557`
- Modify: `globalworth/assets/it-questionnaire.js:601-606`
- Test: `tests/globalworth-it-page.test.js`

- [ ] **Step 1: Dodać informację na ekranie rozpoczynającym**

W `renderIntro()` bezpośrednio po obecnym akapicie o zapisie szkicu dodać:

```js
'<p><strong>Odpowiedzi mogą być rozbudowane i napisane własnym językiem.</strong> Prosimy opisać stan faktyczny tak szczegółowo, jak wymaga tego dane zagadnienie. Nie wymagamy formalnego stylu ani skrótowych odpowiedzi.</p>' +
```

Nie dodawać nowego komponentu, stylu ani pola formularza.

- [ ] **Step 2: Zmienić podpowiedź dla „Mamy odpowiedź”**

Zastąpić pomoc pola `detail` tekstem:

```js
'Możesz odpowiedzieć własnymi słowami. Pole pozwala na dłuższy, szczegółowy opis wraz z warunkami, ograniczeniami i wyjątkami.'
```

- [ ] **Step 3: Zmienić podpowiedź dla „Do ustalenia”**

Zastąpić pomoc pola `missingInfo` tekstem:

```js
'Opisz własnymi słowami, czego jeszcze nie wiadomo i co trzeba ustalić. Możesz podać pełny kontekst.'
```

- [ ] **Step 4: Zmienić podpowiedź dla „Nie dotyczy”**

Zastąpić pomoc pola `notApplicableReason` tekstem:

```js
'Wyjaśnij własnymi słowami, dlaczego pytanie nie dotyczy. Możesz szerzej opisać stan organizacji, systemu lub procesu.'
```

- [ ] **Step 5: Uruchomić test skupiony i potwierdzić GREEN**

Run:

```bash
node --test tests/globalworth-it-page.test.js
```

Expected: wszystkie testy w pliku PASS, w tym nowy test treści.

- [ ] **Step 6: Uruchomić pełny zestaw testów**

Run:

```bash
node --test tests/*.test.js
```

Expected: 79 testów, 79 PASS, 0 FAIL.

- [ ] **Step 7: Sprawdzić diff i zapisać zmianę w repo**

Run:

```bash
git diff --check
git diff -- tests/globalworth-it-page.test.js globalworth/assets/it-questionnaire.js
git status --short
```

Expected: tylko dwa pliki funkcjonalne zmienione, bez błędów whitespace.

Commit:

```bash
git add tests/globalworth-it-page.test.js globalworth/assets/it-questionnaire.js
git commit -m "copy: dopuszcz dlugie odpowiedzi Globalworth"
```

### Task 3: Dokumentacja, build i publikacja

**Files:**
- Modify: `CHANGELOG.md`
- Modify outside repository: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/claude-shared/memory/project_ai_team_globalworth.md`
- Modify outside repository: `/Users/dariu/Library/Mobile Documents/com~apple~CloudDocs/AITeam/_STAN.md`

- [ ] **Step 1: Dodać wpis do changelogu**

Na górze `CHANGELOG.md` dodać wpis z datą 2026-08-07:

```markdown
## [2026-08-07] rozbudowane odpowiedzi Globalworth

- Formularz wyjaśnia, że odpowiedzi IT mogą być długie, napisane własnym językiem i bez formalnego stylu.
- Podpowiedzi dla „Mamy odpowiedź”, „Do ustalenia” i „Nie dotyczy” zachęcają do przekazania pełnego kontekstu.
- Pytania, walidacja, limity odpowiedzi i mechanizm zapisu pozostały bez zmian.
```

- [ ] **Step 2: Uruchomić produkcyjny build**

Run:

```bash
vercel build --prod
```

Expected: `status: ok` i `Build completed successfully.`

- [ ] **Step 3: Zrobić końcową weryfikację przed publikacją**

Run:

```bash
node --test tests/*.test.js
git diff --check
git status --short
```

Expected: 79 PASS, 0 FAIL; zmieniony tylko `CHANGELOG.md`.

- [ ] **Step 4: Zapisać changelog i wypchnąć zatwierdzone commity**

Commit i push:

```bash
git add CHANGELOG.md
git commit -m "docs: zapisz dlugie odpowiedzi Globalworth"
git push origin HEAD:main
```

Expected: push typu fast-forward do `origin/main`, bez force push.

- [ ] **Step 5: Zweryfikować wdrożenie live**

Pobrać stronę i asset formularza, a następnie sprawdzić statusy i zatwierdzone teksty:

```bash
curl -fsS https://ai-team.pl/globalworth/ -o /tmp/globalworth-long-form-page.html
curl -fsS https://ai-team.pl/globalworth/assets/it-questionnaire.js -o /tmp/globalworth-long-form-script.js
curl -sS -o /dev/null -w '%{http_code}\n' https://ai-team.pl/globalworth/
curl -sS -o /dev/null -w '%{http_code}\n' https://ai-team.pl/api/globalworth-it-submit
rg -n 'Odpowiedzi mogą być rozbudowane|Nie wymagamy formalnego stylu|Możesz odpowiedzieć własnymi słowami|Możesz podać pełny kontekst|Możesz szerzej opisać' /tmp/globalworth-long-form-script.js
```

Expected: strona i endpoint zwracają HTTP 200, a `rg` znajduje wszystkie pięć zatwierdzonych fragmentów.

- [ ] **Step 6: Zaktualizować pamięć projektu i snapshot**

W `claude-shared/memory/project_ai_team_globalworth.md` zapisać finalny commit, wynik 79/79 testów, poprawny build i obecność komunikatu live. W istniejącej sekcji Globalworth w `_STAN.md` podmienić commit i wynik testów oraz dopisać, że odpowiedzi mogą być rozbudowane i napisane własnym językiem. Nie tworzyć drugiej sekcji Globalworth.

- [ ] **Step 7: Sprawdzić czystość repo i zgodność z produkcją**

Run:

```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

Expected: czyste repo oraz identyczne wartości `HEAD` i `origin/main`.
