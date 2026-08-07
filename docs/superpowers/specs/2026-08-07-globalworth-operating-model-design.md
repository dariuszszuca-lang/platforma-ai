# Globalworth: docelowy model operacyjny AI

## Cel

Rozwinąć podstronę Globalworth tak, aby pokazywała nie tylko szkolenie, lecz pełną drogę od diagnozy do pierwszego procesu wdrożeniowego i dalszego skalowania. Materiał ma budować wiarygodność AI-Team jako partnera wdrożeniowego, ale nie może sprzedawać na tym etapie abonamentu ani usługi pod nazwą „Zewnętrzny Dział AI”.

## Zatwierdzony kierunek

- Nazwa widoczna na stronie: **Docelowy model operacyjny AI**.
- Nazwa „Zewnętrzny Dział AI” pozostaje poza materiałem dla Globalworth i może pojawić się dopiero w późniejszej ofercie.
- W całej komunikacji używamy określeń **proces wdrożeniowy**, **pierwsze wdrożenie** i **dalsze wdrażanie**.
- Usuwamy określenia „pilot”, „pilotaż”, „proces pilotażowy” i „przepływ pilotażowy”.
- Nie pokazujemy cen ani wariantów abonamentowych. Finalna oferta powstanie po odpowiedziach IT.

## Zmiany w istniejącej narracji

Dotychczasowy ciąg „diagnoza → szkolenie → pilot” zmieniamy na:

1. Diagnoza procesów i odpowiedzi IT.
2. Dedykowany program szkoleniowy.
3. Pierwszy proces wdrożeniowy na uzgodnionych danych.
4. Pomiar wyniku i decyzja o dalszym wdrażaniu.
5. Docelowa wspólna warstwa kontekstu, automatyzacji i raportowania.

Zmiana obejmuje meta description, hero, schemat drogi, dowody zakresu, sekcję odpowiedzi dla HR, sześć kroków, bramę IT, rezultaty i końcowe wezwanie do działania.

## Nowa sekcja strony

Sekcja pojawi się po „Rezultatach”, bezpośrednio przed końcowym wezwaniem do działania.

### Nagłówek

**Docelowo nie chodzi o kolejne pojedyncze narzędzia. Chodzi o jeden wspólny sposób pracy.**

Lead wyjaśni, że po pierwszym procesie wdrożeniowym można stopniowo zbudować warstwę operacyjną, która łączy procesy, automatyzacje, decyzje i raportowanie. Nie obiecujemy gotowego produktu ani wdrożenia bez wcześniejszego poznania środowiska Globalworth.

### Model informacji

Centralnym elementem wizualnym będzie karta **Wspólny kontekst operacyjny**. Wokół niej pokażemy cztery perspektywy:

- **Pracownik:** aktualny stan sprawy, potrzebne informacje i jasne przekazanie do kolejnej osoby.
- **Proces:** automatyzacje, wyjątki, terminy, decyzje człowieka i ślad działań.
- **Manager:** status pracy, ryzyka, zaległości i miejsca wymagające reakcji.
- **Dyrektor:** przekrojowy raport, wąskie gardła i priorytety rozwoju.

Język ma opisywać widoczność procesu i przekazań między rolami. Nie używamy sformułowań sugerujących obserwowanie lub rozliczanie pojedynczych pracowników.

### Ścieżka rozwoju

Na dole sekcji pokażemy cztery etapy:

1. Program szkoleniowy.
2. Pierwszy proces wdrożeniowy.
3. Wspólna warstwa informacji i automatyzacji.
4. Skalowanie na kolejne procesy i role.

Każdy etap ma być przedstawiony jako osobny krok, a nie jako obietnica wykonania całego programu w jednym zakresie.

## Styl wizualny

- Zachowujemy istniejącą paletę: granat, zieleń, krem i papier.
- Zachowujemy Fraunces, IBM Plex Sans i IBM Plex Mono.
- Sekcja otrzyma jasne tło oraz jedną dominującą granatową kartę modelu, aby nie zlewała się z granatowym CTA.
- Układ ma być czytelny bez animacji i skalować się do jednej kolumny na telefonie.
- Efekty wejścia korzystają wyłącznie z istniejącej klasy `reveal` i respektują `prefers-reduced-motion`.
- Nie dokładamy nowej pozycji do menu, aby nie przeciążyć nawigacji. Sekcja jest naturalnym rozwinięciem „Rezultatów”.

## Aktualizacja maila do Agnieszki

Mail pozostaje krótki. Po informacji o formularzu i przygotowaniu oferty dodajemy jeden akapit:

> W materiale pokazuję również możliwy dalszy kierunek rozwoju. Po pierwszym procesie wdrożeniowym można stopniowo zbudować jedno środowisko, w którym procesy, automatyzacje, decyzje i raportowanie korzystają ze wspólnego kontekstu. Pracownicy widzą aktualny stan spraw i przekazania między rolami, a managerowie i dyrektorzy otrzymują czytelny obraz przepływu informacji. To kierunek na przyszłość, którego zakres będzie można ocenić po odpowiedziach IT i pierwszym wdrożeniu.

Zakończenie maila jasno mówi, że finalny program i oferta obejmująca zakres, harmonogram oraz wycenę powstaną po zapisaniu odpowiedzi przez IT.

## Testy akceptacyjne

1. W `globalworth/index.html` nie występują słowa „pilot”, „pilotaż” ani ich odmiany.
2. Strona zawiera nagłówek „Docelowy model operacyjny AI” i cztery perspektywy odbiorców.
3. Strona zawiera cztery kolejne etapy rozwoju, w tym „Pierwszy proces wdrożeniowy”.
4. Sekcja nie zawiera nazwy „Zewnętrzny Dział AI”, cen ani abonamentu.
5. Istniejące testy formularza i trwałego zapisu nadal przechodzą.
6. Widok desktopowy i mobilny nie ma poziomego przewijania, a treść pozostaje czytelna przy wyłączonych animacjach.
7. Po wdrożeniu `/globalworth/` zwraca HTTP 200, a publiczna strona zawiera nowe copy.

## Granice zakresu

- Nie zmieniamy działania formularza, API, Firestore ani panelu odpowiedzi.
- Nie projektujemy teraz architektury systemu dla Globalworth.
- Nie obiecujemy integracji przed odpowiedziami IT.
- Nie publikujemy oferty cenowej.
- Nie wysyłamy maila. Powstaje wyłącznie wersja robocza do skopiowania przez Darka.

## AI Act

```text
AI_ACT_CHECK: NIE_DOTYCZY
SYSTEM_I_WLASCICIEL: Podstrona Globalworth / AI-Team
ROLA: wykonawca techniczny i właściciel treści
KATEGORIA: inna
OZNACZENIE_WIDOCZNE: NIE_DOTYCZY
OZNACZENIE_TECHNICZNE: NIE_DOTYCZY
RECENZENT_CZLOWIEK: Darek, zatwierdzenie kierunku komunikacji 07.08.2026
FLAGA_PLATFORMY: NIE_DOTYCZY
REJESTR: NIE_DOTYCZY
UZASADNIENIE: Zmiana dotyczy zwykłej treści marketingowej i deterministycznego formularza, bez interakcji z AI, deepfake'u ani tekstu o sprawach interesu publicznego.
```
