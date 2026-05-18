AI RADAR #002
Newsletter o AI dla Twojego biznesu | Wydanie #002 | Maj 2026

Cześć,

Ten numer jest o prostej zmianie: AI przestaje być tylko oknem do pisania promptów. Coraz częściej działa tam, gdzie faktycznie pracujemy.

Możesz odpalić zadanie w Codexie na komputerze, a potem sprawdzić je z telefonu. Możesz poprosić agenta o grafiki i wideo przez Higgsfield. Możesz zrobić audyt strony w Claude SEO i od razu dostać listę poprawek. A przy większym projekcie przydaje się Product Manager, który pilnuje priorytetów: co robić teraz, co odpuścić i czy to w ogóle pomaga firmie.

Dzisiaj mam sześć rzeczy.

---

GORĄCE NEWSY

1. Codex i Remote. Telefon jako pilot do pracy agenta
OpenAI pokazało 14 maja Codex w aplikacji mobilnej ChatGPT. W praktyce działa to tak: Codex nadal pracuje na Twoim Macu, laptopie, devboxie albo środowisku zdalnym, a telefon pozwala Ci zobaczyć sesje, odpisać agentowi, zaakceptować akcję, zmienić kierunek, przejrzeć diffy, terminal, screenshoty i wyniki testów. Ważne: pliki, klucze i lokalna konfiguracja zostają na maszynie, na której działa Codex. Telefon jest pilotem, nie nowym środowiskiem pracy.
→ https://openai.com/index/work-with-codex-from-anywhere/

2. Higgsfield MCP. Generowanie obrazów i wideo z poziomu agenta
Higgsfield odpalił MCP, czyli złącze, przez które agent może korzystać z narzędzi do obrazów i wideo. Według strony Higgsfield po podłączeniu agent może generować obrazy, tworzyć krótkie wideo, trenować postacie i przeglądać historię kreacji w jednej sesji. Dla małej firmy to nie jest zabawka. To może być sposób na szybkie warianty reklam, miniatur, rolek i moodboardów bez ręcznego skakania po pięciu narzędziach.
→ https://higgsfield.ai/mcp

3. Claude SEO. Skill, który warto sprawdzić
Rzadko polecam tu skille, ale ten jest dobry. Claude SEO ma zestaw komend do audytu strony, analizy pojedynczej podstrony, schema, SEO technicznego, contentu, lokalnego SEO i GEO, czyli optymalizacji pod odpowiedzi AI. Repo opisuje 25 sub-skilli i 18 subagentów. U mnie to pasuje do rytmu pracy: asystent robi audyt, wykrywa dziury, a potem wracamy z poprawkami i aktualizacją strony.
→ https://github.com/AgriciDaniel/claude-seo

---

NARZĘDZIE TYGODNIA

Codex Remote w aplikacji ChatGPT
Co to robi: Pozwala sterować aktywnymi sesjami Codexa z telefonu, kiedy agent dalej pracuje na Twojej maszynie albo środowisku zdalnym.
Dla kogo: Dla osób, które puszczają dłuższe zadania w Codexie i nie chcą siedzieć przy biurku tylko po to, żeby kliknąć approve albo wybrać wariant.

Jak to działa:
  1. Zaktualizuj aplikację ChatGPT na telefonie i aplikację Codex na macOS.
  2. Na Macu otwórz Codex App i rozpocznij konfigurację Remote Connection.
  3. Zeskanuj kod QR telefonem w aplikacji ChatGPT.
  4. Zostaw hosta online, wybudzonego i z uruchomionym Codexem.
  5. Z telefonu przeglądaj sesje, terminal, diffy, screenshoty i prośby o zgodę.
  6. Jeśli pracujesz na devboxie albo Mac mini, skonfiguruj Remote SSH w Codex App i dopiero wtedy spinaj to z mobile.

Cena: W ramach planów z dostępem do Codex; OpenAI podaje też preview na iOS i Androidzie w obsługiwanych regionach. | Ocena: 9/10 | Link: https://openai.com/index/work-with-codex-from-anywhere/

---

PROMPT TYGODNIA

Czy ten proces nadaje się dla agenta?
Skopiuj do ChatGPT, Claude albo Codexa i podstaw swój proces. Ten prompt ma wyłapać, czy automatyzacja ma sens, zanim zaczniesz ją budować.

---prompt start---
Działaj jako Product Manager i COO od automatyzacji.

Przeanalizuj proces:
[OPIS PROCESU]

Oceń go w 7 punktach:
1. Czy proces jest powtarzalny?
2. Jakie dane wejściowe są potrzebne?
3. Jaki jest poprawny wynik końcowy?
4. Gdzie potrzebna jest decyzja człowieka?
5. Co może pójść źle i jaki jest koszt błędu?
6. Czy lepsza będzie automatyzacja, checklistowy proces, czy człowiek z AI?
7. Jaki pierwszy test mogę zrobić w 60 minut?

Na końcu daj decyzję: automatyzować teraz / najpierw uporządkować / nie ruszać.
---prompt end---

Tip: Jeśli odpowiedź mówi „najpierw uporządkować”, to nie jest porażka. To znaczy, że problemem nie jest AI, tylko brak procesu.

---

3 SZYBKIE TIPY

1. Nie dawaj agentowi całego biznesu naraz
   Daj mu jeden proces, jeden cel i jeden miernik. Przykład: „zmniejsz czas przygotowania newslettera z 3 godzin do 45 minut”.

2. MCP traktuj jak dostęp do narzędzia, nie jak magię
   Jeśli agent ma robić wideo przez Higgsfield, najpierw ustal styl, format, ograniczenia i gdzie trafiają pliki.

3. SEO audyt bez wdrożenia nic nie zmienia
   Claude SEO może znaleźć problemy, ale wynik pojawia się dopiero wtedy, gdy ktoś poprawi schema, nagłówki, linkowanie i treść.

---

AUTOMATYZACJA TYGODNIA

Product Manager to must
Problem: W większych projektach łatwo wpaść w tryb „dorzućmy więcej ficzerów”. A czasami problemem nie jest produkt, tylko brak ruchu, słaby onboarding albo źle ustawiona oferta.

Rozwiązanie:
  1. Daj PM-owi dostęp do roadmapy, backlogu, changelogu, zgłoszeń klientów i danych z analityki.
  2. Raz w tygodniu każ mu odpowiedzieć: co budować, co zatrzymać, co uprościć, co promować.
  3. Niech porównuje ficzery z celem biznesowym: więcej leadów, większa aktywacja, mniej ręcznej obsługi, większa sprzedaż.
  4. Jeśli widzi, że problemem jest ruch, ma zaproponować taktyki growth hackingu, content, SEO, partnerstwa albo dystrybucję, a nie kolejną funkcję.
  5. Po każdej decyzji zapisuj: hipoteza, akcja, metryka, termin sprawdzenia.

Efekt: Mniej losowego budowania, więcej decyzji opartych o cel i liczby. | Koszt: 0 zł, jeśli używasz własnego asystenta PM; koszt to dyscyplina w danych. | Setup: 30-60 minut na pierwszy przegląd projektu.

---

Z WARSZTATU DARKA

Jak wdrożyłbym to u siebie w małej firmie
Nie zaczynałbym od wielkiego systemu. Zrobiłbym trzy małe wdrożenia.

Pierwsze: Codex Remote do pilnowania długich zadań. Agent robi audyt, poprawkę albo analizę, a ja z telefonu tylko podejmuję decyzje, gdy staje w miejscu.

Drugie: Higgsfield MCP do szybkich wariantów wizualnych. Nie do finalnej kreacji bez kontroli, tylko do pierwszych 5-10 kierunków: reklama, miniatura, rolka, grafika do posta.

Trzecie: Claude SEO jako cykliczny audyt. Raz w tygodniu jedna strona, jeden raport, jedna lista poprawek. Bez wielkiego „projektu SEO”. Po prostu rytm: audyt, poprawka, publikacja, sprawdzenie.

I do tego PM, który patrzy na całość. Bo agent wykonawczy zrobi zadanie. PM ma pilnować, czy to zadanie w ogóle warto robić.

---

WARTO PRZECZYTAĆ

• Codex w telefonie od OpenAI
  Oficjalny opis działania Remote: mobile widzi live state, a środowisko zostaje na hoście.
  → https://openai.com/index/work-with-codex-from-anywhere/

• Higgsfield MCP
  MCP do obrazów i wideo z poziomu agenta.
  → https://higgsfield.ai/mcp

• Claude SEO
  Skill do audytów SEO, schema, GEO/AEO i planów poprawek.
  → https://github.com/AgriciDaniel/claude-seo

• Claude FM - For Developers
  Link do posłuchania podczas pracy z agentami. Traktuję jako inspirację, nie dokumentację techniczną.
  → https://www.youtube.com/live/YmQ7jRgf4f0

---

Q&A

"Czy agent może sam prowadzić projekt?"

Może dużo zrobić, ale nie powinien udawać właściciela decyzji. Najlepszy układ to: człowiek ustala cel i granice, Product Manager analizuje roadmapę i liczby, a agenci wykonawczy robią konkretne zadania.

Jeśli pozwolisz agentowi tylko dopisywać ficzery, szybko dostaniesz większy chaos. Jeśli każesz mu patrzeć na metryki, blokery i wzrost, zaczyna być naprawdę użyteczny.

---

CO U NAS

• Konsultacje AI i automatyzacji
  Pomagam poukładać AI w firmie: procesy, automatyzacje, asystenci, CRM, newsletter, proste systemy operacyjne. Mogę dojechać do klienta albo spotkać się w Gdańsku. Wyślij zapytanie na dariusz.szuca@gmail.com i napisz w 2 zdaniach, co chcesz usprawnić.
  → mailto:dariusz.szuca@gmail.com

• Zajawka: META ADS AI
  Odpalamy META ADS AI. Reklamy robią się same: brief, warianty copy, kreacje, testy i raport. Więcej info w kolejnym wydaniu.
  → https://ai-team.pl

---

Darek
AI-Team.pl

Jeśli ten newsletter był przydatny - prześlij go komuś kto też szuka praktycznej wiedzy o AI.

Wypis: [link wypisu SES]
