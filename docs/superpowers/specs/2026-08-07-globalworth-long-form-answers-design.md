# Globalworth: swobodne, rozbudowane odpowiedzi IT

Data: 2026-08-07
Status: zaakceptowany kierunek, do przeglądu przed implementacją

## Cel

Formularz ma jasno informować dział IT Globalworth, że odpowiedzi mogą być
rozbudowane, napisane własnym językiem i tak szczegółowe, jak wymaga dane
zagadnienie. Użytkownik nie powinien odczuwać, że formularz wymaga krótkich,
formalnych albo hasłowych odpowiedzi.

## Zakres treści

Na ekranie rozpoczynającym formularz, przed danymi respondenta, pojawi się
informacja:

> Odpowiedzi mogą być rozbudowane i napisane własnym językiem. Prosimy opisać
> stan faktyczny tak szczegółowo, jak wymaga tego dane zagadnienie. Nie wymagamy
> formalnego stylu ani skrótowych odpowiedzi.

Przy polach opisowych pojawią się krótkie podpowiedzi dopasowane do wariantu
odpowiedzi:

- „Mamy odpowiedź”: „Możesz odpowiedzieć własnymi słowami. Pole pozwala na
  dłuższy, szczegółowy opis wraz z warunkami, ograniczeniami i wyjątkami.”
- „Do ustalenia”: „Opisz własnymi słowami, czego jeszcze nie wiadomo i co trzeba
  ustalić. Możesz podać pełny kontekst.”
- „Nie dotyczy”: „Wyjaśnij własnymi słowami, dlaczego pytanie nie dotyczy.
  Możesz szerzej opisać stan organizacji, systemu lub procesu.”

## Zachowanie formularza

- Mechanizm zapisu lokalnego i finalnego nie zmienia się.
- Walidacja minimalnej szczegółowości nie zmienia się.
- Istniejące limity backendu pozostają bez zmian: 8000 znaków dla szczegółowej
  odpowiedzi oraz 4000 znaków dla opisu „Do ustalenia” i „Nie dotyczy”.
- Nie dodajemy licznika znaków ani nowych pól.
- Nie zmieniamy pytań, typów odpowiedzi ani danych zapisywanych w bazie.

## Testy akceptacyjne

1. Ekran rozpoczynający zawiera informację o długich odpowiedziach, własnym
   języku i braku wymogu formalnego stylu.
2. Każdy z trzech wariantów odpowiedzi ma podpowiedź dopuszczającą szerszy opis
   własnymi słowami.
3. Wszystkie dotychczasowe testy walidacji i zapisu nadal przechodzą.
4. Build produkcyjny kończy się powodzeniem.
5. Po wdrożeniu tekst jest widoczny na `https://ai-team.pl/globalworth/`, a
   endpoint formularza nadal odpowiada poprawnie.

## Poza zakresem

- Zmiana pytań IT.
- Zmiana limitów długości odpowiedzi.
- Zmiana sposobu przechowywania odpowiedzi.
- Przebudowa wyglądu formularza.
