# Changelog

## [2026-08-07] rozbudowane odpowiedzi Globalworth

- Formularz wyjaśnia, że odpowiedzi IT mogą być długie, napisane własnym
  językiem i bez formalnego stylu.
- Podpowiedzi dla „Mamy odpowiedź”, „Do ustalenia” i „Nie dotyczy” zachęcają do
  przekazania pełnego kontekstu.
- Pytania, walidacja, limity odpowiedzi i mechanizm zapisu pozostały bez zmian.

## [2026-08-07] commit 34cd8f8

- Zastąpiono język pilotażu określeniami „proces wdrożeniowy” i „pierwsze
  wdrożenie” na całej podstronie `/globalworth/`, pozostawiając bez zmian nazwę
  Microsoft 365 Copilot.
- Dodano końcową sekcję „Docelowy model operacyjny AI” ze wspólnym kontekstem
  operacyjnym, widokami dla pracownika, procesu, menedżera i dyrektora oraz
  czteroetapową ścieżką rozwoju.
- Dodano link „Model AI” w menu i zweryfikowano responsywność na 1440, 1024,
  768 i 375 px.
- Formularz i API pozostały bez zmian; 78/78 testów i build produkcyjny przeszły,
  a strona live odpowiada HTTP 200.

## [2026-08-07] commit 8f805e8

- Wyeksponowano logo AI-Team w nagłówku podstrony `/globalworth/`, pozostawiając
  obok nazwę marki.
- Linki menu zgrupowano w czytelnym panelu z poprawionymi stanami hover i focus,
  a układ nagłówka dostosowano do desktopu, tabletu i telefonu.

## [2026-08-07] commits 70f3eaf, b3ab737, bd20c72, 67b1860

- Dodano podstronę `/globalworth/` z pięcioetapowym formularzem 16 pytań IT,
  trwałym zapisem finalnych odpowiedzi w Firestore i lokalnym szkicem.
- Dodano chroniony, tylko do odczytu widok odpowiedzi Globalworth w panelu
  AI-Team wraz z eksportem JSON i wydrukiem.
- Poprawiono harmonogram AI Radar: dwa codzienne wywołania UTC obsługujące
  zmianę czasu, z pojedynczą wysyłką sekwencji powitalnej o 18:00 w Warszawie.
- Połączono publiczną konfigurację panelu z endpointem Globalworth, aby całe
  wdrożenie mieściło się w limicie 12 funkcji serwerowych planu Vercel Hobby.
- Usunięto zapasową konfigurację klucza Firebase z kodu; wartość jest pobierana
  wyłącznie z konfiguracji środowiska Vercel.
