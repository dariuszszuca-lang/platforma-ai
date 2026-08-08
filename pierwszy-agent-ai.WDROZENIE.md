# Lead magnet „Twój Pierwszy Agent AI" — plan wdrożenia i domknięcie lejka

> Autor: @cmo (AI Marketing Lab) · 2026-07-28 · Status pliku: GOTOWE_DO_TESTU, NIEPUBLIKOWANY
> Zasada: sam konfigurator to góra lejka. Lead ma wartość dopiero, gdy dostaje obiecaną specyfikację i ma dokąd pójść dalej.

---

## STAN
- `pierwszy-agent-ai.html` gotowy, brand AI-Team, cała logika po stronie przeglądarki.
- Zapis leada działa w trybie demo (localStorage). Do żywego trzeba dwóch rzeczy: zapis na listę + mail ze specyfikacją.

---

## FAZA 1 — Podłączenie zapisu (robota @cto, wymaga zgody Darka na deploy)
Wzorzec 1:1 z `mapa-ai.html`. W `pierwszy-agent-ai.html`, sekcja `// === PODŁĄCZENIE ZAPISU ===`, odkomentować dwie linie i wkleić config:

1. **Firestore, lista AI Radar** — ten sam projekt i kolekcja co Mapa AI: `newsletter_subscribers`, grupa `ai-radar`, `newsletter:true`. Config Firebase skopiować z `mapa-ai.html` (jest publiczny w źródle tamtej strony, to nie sekret).
2. **Endpoint `POST /api/agent-send`** — bliźniak `/api/mapa-send` (Claude + SES, konto SES produkcyjne AI Radar). Payload: `{email, branza, bol, agent, godziny_tydzien, zrodlo, utm}`.

Guard: zgoda RODO jest w formularzu (checkbox), zapis best-effort, mail dopiero po zapisie. Zero sekretów w pliku HTML.

---

## FAZA 2 — Mail ze specyfikacją (serce lejka, robota @cmo/@ghost)
To decyduje, czy lead się ogrzeje czy wystygnie. Endpoint `/api/agent-send` generuje spersonalizowaną specyfikację (jak mapa-send generuje Mapę). Prompt do modelu:

> Napisz krótki mail w stylu Darka (prosto, jak do kolegi, zero AI-mowy, zero myślników, polskie znaki) do właściciela firmy z branży {branza}, który wybrał {agent} i traci {godziny_tydzien} godz./tydzień na {bol}. Struktura: (1) jedno zdanie, że dobrze trafił, (2) 4-5 zdań konkretnej specyfikacji tego agenta u niego: co robi, czym budujemy, ile trwa wdrożenie, od czego zaczynamy, (3) jeden CTA: 15 minut rozmowy albo bezpłatny Audyt Chaosu. Bez obietnic kwot zarobków. Podpis: Darek, AI-Team.

**Fallback (bez modelu), temat maila:** `Twój {agent} — jak go zbudować u Ciebie`
Treść: podziękowanie + 3 zadania agenta (z pliku) + „napisz kiedy chcesz o tym pogadać, 15 minut wystarczy" + link do `/wdrozenie-ai.html` i telefonu.

**Domknięcie na stronie:** po zapisie thank-you nie może być ślepy. Dodać pod komunikatem sukcesu drugi CTA: „Nie chcesz czekać na maila? Umów 15 minut" → link do kontaktu/kalendarza. (Drobna zmiana w `saveLead()`.)

---

## FAZA 3 — Skąd ruch (dystrybucja, inaczej plik jest martwy)
Kolejność od najtańszego:
1. **Wejście z reklam Meta.** Dziś wejściem jest „Audyt Chaosu". Ten konfigurator jest lżejszy (60 s, natychmiastowy wynik) — przetestować jako alternatywne wejście, jedna zmienna naraz (teren @ads, mały budżet, decyzja Darka).
2. **Post organiczny** (LinkedIn/FB, głos Darka): „Zbudowałem narzędzie, które w 60 sekund mówi, którego agenta AI opłaca Ci się zbudować pierwszego" + link. Kanał: Social media (05) przez Zernio.
3. **AI Radar** — wpiąć w jedno wydanie jako „narzędzie tygodnia".
4. **Link ze strony:** hero `index.html`, sekcja narzędzi, oraz `/wdrozenie-ai.html` (bo prowadzi wprost do usługi).

---

## CHECKLIST PRZED PIERWSZĄ ZŁOTÓWKĄ NA RUCH (nie odpalać reklamy wcześniej)
- [ ] Zapis leada faktycznie ląduje na liście AI Radar (test na własnym mailu, sprawdzić w Firestore).
- [ ] Mail ze specyfikacją realnie przychodzi (test end-to-end).
- [ ] Thank-you ma drugi krok (CTA do rozmowy), nie ślepy zaułek.
- [ ] `curl -I` strony = 200, poprawny Content-Type.
- [ ] Link i UTM działają (żeby wiedzieć, skąd przyszedł lead).
- [ ] Polityka prywatności podlinkowana (jest).

---

## MAPA NA POZIOM
Ten lead magnet to output systemu **Social media / konwersja**. Sam w sobie nie podnosi poziomu bohatera (to output, nie system). Wpięty w rytm (ruch → zapis → mail → rozmowa) z historią użycia z 2 dat = wzmacnia dowód działającego lejka. Do decyzji Darka, czy robimy z tego stałe wejście.
