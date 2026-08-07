# Globalworth IT — trwały formularz produkcyjny

Data: 2026-08-07
Status: zatwierdzone przez Darka
Projekt: AI-Team / ai-team.pl

## Cel

Opublikować zaakceptowaną prezentację procesu dla Globalworth pod adresem
`https://ai-team.pl/globalworth/` i zmienić końcowy zapis formularza z lokalnego
prototypu w trwały zapis do istniejącego Firestore AI-Team. Darek ma widzieć
odpowiedzi po zalogowaniu do obecnego panelu `https://ai-team.pl/panel`.

## Decyzje zatwierdzone

- Magazyn danych: istniejący Firestore `ai-team-zlecenia`, region europejski.
- Hosting i API: obecny projekt Vercel `platforma-ai`.
- Widok odpowiedzi: nowa sekcja w chronionym logowaniem panelu AI-Team.
- Adres strony: `/globalworth/`, bez linku w głównym menu.
- Indeksowanie: `noindex, nofollow`, ponieważ jest to materiał dla konkretnego klienta.
- Projekt wizualny i treść: przeniesienie zatwierdzonego prototypu z
  `PROJEKTY/GLOBALWORTH/oferta/` bez zmiany kierunku oferty ani designu.

## Przepływ respondenta

1. Respondent podaje imię i nazwisko, służbowy e-mail i opcjonalną rolę.
2. Odpowiada na 16 pytań w pięciu etapach.
3. Każde pytanie ma jeden z trzech stanów:
   `answered`, `needs_clarification`, `not_applicable`.
4. Każdy stan wymaga właściwego szczegółowego pola. „Nie dotyczy” wymaga
   wyjaśnienia dlaczego, a „do ustalenia” brakującej informacji i właściciela.
5. Szkic jest zapisywany lokalnie podczas pracy. Nie trafia do bazy.
6. Przycisk końcowy wysyła kompletny zestaw do `/api/globalworth-it-submit`.
7. Sukces jest pokazany dopiero po odpowiedzi API i zawiera numer zapisu.
8. Błąd sieci nie usuwa szkicu i nie pokazuje fałszywego sukcesu.

## Kontrakt API

Endpoint przyjmuje wyłącznie `POST` z JSON. Serwer:

- ogranicza rozmiar danych,
- odrzuca obce źródła przeglądarkowe,
- obsługuje pole-pułapkę dla botów,
- normalizuje dane respondenta,
- przyjmuje dokładnie 16 znanych identyfikatorów pytań,
- ponownie sprawdza kompletność niezależnie od walidacji w przeglądarce,
- generuje dokument o stabilnym ID na podstawie `responseId`, więc ponowienie
  tego samego zapisu nie tworzy duplikatu,
- nie zapisuje adresu IP, haseł, kluczy ani danych urządzenia.

Kolekcja: `globalworth_it_responses`.

Dokument zawiera: wersję schematu, identyfikator projektu, status, respondenta,
16 odpowiedzi, podsumowanie, czas utworzenia szkicu, czas ostatniej edycji,
serwerowy czas finalizacji oraz potwierdzenie komunikatu o danych.

## Ochrona danych

- Strona wyraźnie zabrania wpisywania haseł, kluczy, danych najemców i innych
  informacji, których Globalworth nie może przekazać poza własne środowisko.
- API zapisuje przez istniejące poświadczenia serwerowe Vercela. Żaden sekret
  nie trafia do przeglądarki.
- Firestore nie pozwala na publiczny odczyt kolekcji.
- Odczyt jest możliwy tylko dla zalogowanego użytkownika obecnego panelu.
- Panel nie dostaje funkcji kasowania ani edycji odpowiedzi.
- Nie będzie publicznego endpointu do pobierania zapisanych odpowiedzi.

## Panel AI-Team

Nowa sekcja „Globalworth IT” w `panel.html` pokazuje listę zapisów, datę,
respondenta, liczbę odpowiedzi szczegółowych, otwarte ustalenia i odpowiedzi
„nie dotyczy”. Szczegóły rozwijają wszystkie pięć grup pytań. Dostępne są
eksport JSON i wydruk. Widok korzysta z istniejącego Firebase Auth.

## AI Radar — poprawka dołączona do zakresu

Commit dodający codzienną sekwencję powitalną zmienił dwa wywołania crona na
jedno codzienne o 16:00 UTC, ale nie zmienił testu. Samo dostosowanie testu
ukryłoby błąd zimowy: wydanie ustawione na 18:00 CET byłoby jeszcze niedostępne
o 16:00 UTC i zostałoby wysłane dopiero następnego dnia.

Rozwiązanie:

- dwa codzienne wywołania: 16:00 UTC i 17:00 UTC,
- oba spełniają limit Vercel Hobby „nie częściej niż raz dziennie” na wpis,
- regularne wydania nadal wysyła istniejący mechanizm `scheduled_at`,
- sekwencja powitalna uruchamia się tylko podczas wywołania przypadającego na
  godzinę 18:00 w strefie `Europe/Warsaw`, więc nie wysyła drugiego maila godzinę później.

## AI Act

Globalworth formularz: `NIE_DOTYCZY`. To deterministyczny formularz zbierający
odpowiedzi człowieka, bez modelu AI i bez generowania decyzji lub treści.

AI Radar harmonogram: `PASS`. Zmiana dotyczy wyłącznie czasu uruchomienia
istniejącej, zaakceptowanej sekwencji i newslettera. Zgoda, wypis, nadawca,
recenzja człowieka i zasady oznaczania treści pozostają bez zmian.

## Weryfikacja i publikacja

- testy jednostkowe kontraktu odpowiedzi i endpointu,
- test statyczny strony i panelu,
- test nieudanej oraz udanej finalizacji formularza,
- test idempotencji,
- test harmonogramu AI Radar dla czasu letniego i zimowego,
- pełny zestaw testów repo z osobnym odnotowaniem wcześniejszego błędu bazowego,
- lokalny smoke test strony oraz endpointu,
- przegląd reguł Firestore i brak sekretów w diffie,
- osobna, bezpośrednia zgoda Darka tuż przed push do `main`, ponieważ push
  uruchamia produkcyjny deploy Vercela,
- po deployu: HTTP 200 strony, poprawny `Content-Type`, walidacja błędnego POST,
  kontrolowany zapis testowy i potwierdzenie go w chronionym panelu.
