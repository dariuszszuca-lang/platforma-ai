# Changelog

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
