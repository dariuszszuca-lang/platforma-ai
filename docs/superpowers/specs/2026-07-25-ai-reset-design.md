# AI RESET — projekt materiału

**Data:** 2026-07-25  
**Status:** zatwierdzony kierunek, wersja robocza do pokazania Darkowi  
**Właściciel produktu:** VENTURE

## Cel

Zbudować wartościowy lead magnet dla osób, które używają AI chaotycznie: testują wiele narzędzi, gubią prompty, zaczynają każdą rozmowę od zera i nie mają powtarzalnego sposobu pracy.

Materiał ma dać efekt jeszcze podczas pierwszej sesji. Nie jest raportem o trendach ani kolejną diagnozą. To interaktywny workbook, który pomaga ograniczyć liczbę narzędzi, zbudować stały kontekst i uruchomić pierwszy powtarzalny workflow.

## Obietnica

**Uporządkuj narzędzia, prompty i zadania. Plan do przejścia w 45 minut.**

Obietnica opisuje czas przejścia materiału, nie gwarantuje wyniku biznesowego.

## Zakres materiału

1. **Reset chaosu** — szybki audyt objawów i zasada „najpierw usuń”.
2. **Rdzeń 1+1+1** — jedno narzędzie do myślenia, jedno do sprawdzania i jedno miejsce wykonania.
3. **Karta kontekstu** — informacje, które użytkownik zapisuje raz i przekazuje AI przy kolejnych zadaniach.
4. **Pięciu asystentów** — pełne instrukcje do skopiowania:
   - Szef Sztabu,
   - Researcher,
   - Architekt Procesu,
   - Redaktor,
   - Kontroler Jakości.
5. **Prompt, który da się powtarzać** — sześcioczęściowy wzór zadania.
6. **Pierwszy workflow** — trigger, wejście, praca AI, kontrola człowieka i miejsce docelowe.
7. **Plan siedmiu dni** — stabilizacja systemu bez dokładania kolejnych aplikacji.
8. **Zasady bezpieczeństwa** — dane wrażliwe, weryfikacja źródeł i obowiązkowa kontrola przed publikacją lub wysyłką.

## Interakcje

- checklisty zapisują stan lokalnie w przeglądarce,
- pasek postępu pokazuje procent ukończenia,
- każdą instrukcję asystenta można skopiować jednym przyciskiem,
- kartę kontekstu można uzupełnić i zachować lokalnie,
- użytkownik może wyczyścić swój zapisany postęp,
- widok ma osobny styl do druku i zapisu jako PDF.

Żadne dane wpisane w workbook nie opuszczają urządzenia.

## Kierunek wizualny

Istniejący język AI-Team: Fraunces, Inter i JetBrains Mono, ciepła czerń, krem oraz miedziano-pomarańczowy akcent. Forma przypomina techniczny field manual i redakcyjny workbook, a nie dashboard SaaS.

Najważniejsze zasady:

- treść jest ważniejsza od dekoracji,
- jedna czytelna oś przechodzenia przez materiał,
- pełna obsługa klawiatury i widoczne focus states,
- minimum 44 px dla elementów dotykowych,
- mobile od 375 px bez poziomego przewijania,
- respektowanie `prefers-reduced-motion`,
- bez emoji jako ikon strukturalnych,
- bez określenia „małe firmy”.

## Architektura

- `ai-reset.html` — semantyczna treść i struktura materiału,
- `assets/ai-reset.css` — osobny design, responsywność i druk,
- `assets/ai-reset.js` — czyste funkcje oraz obsługa interakcji,
- `tests/ai-reset.test.js` — testy funkcji i kontraktu statycznego.

Strona ma `noindex, nofollow` i nie zostaje dodana do nawigacji ani sitemap przed akceptacją Darka.

## Kryteria akceptacji wersji roboczej

- materiał zawiera wszystkie osiem modułów,
- pięć instrukcji asystentów jest pełnych i możliwych do skopiowania,
- stan checklist oraz pól tekstowych wraca po odświeżeniu,
- postęp nie przekracza 100% i działa dla pustej listy,
- wydruk ukrywa interfejs pomocniczy,
- testy Node przechodzą,
- strona działa w szerokości 375 px i desktop,
- w treści nie ma określenia „małe firmy”,
- wersja robocza nie jest publikowana.

