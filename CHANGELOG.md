# Changelog

## [2026-08-07] commits 70f3eaf, b3ab737

- Dodano podstronę `/globalworth/` z pięcioetapowym formularzem 16 pytań IT,
  trwałym zapisem finalnych odpowiedzi w Firestore i lokalnym szkicem.
- Dodano chroniony, tylko do odczytu widok odpowiedzi Globalworth w panelu
  AI-Team wraz z eksportem JSON i wydrukiem.
- Poprawiono harmonogram AI Radar: dwa codzienne wywołania UTC obsługujące
  zmianę czasu, z pojedynczą wysyłką sekwencji powitalnej o 18:00 w Warszawie.
- Usunięto zapasową konfigurację klucza Firebase z kodu; wartość jest pobierana
  wyłącznie z konfiguracji środowiska Vercel.
