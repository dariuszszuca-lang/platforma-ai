# Changelog

## [2026-08-28] commit 1bb468b, /systemy: gość zaznacza, co już u niego działa

- W karcie systemu (modal po kliknięciu kafla) ramka „To już działa u mnie w firmie" z checkboxem.
  Zaznaczenie w `localStorage` (`aiteam_systemy_mine`), kafel dostaje znaczek „✓ U CIEBIE"
  (mosiądz, osobno od zielonego „DZIAŁA" Darka), w karcie dopisek „✓ DZIAŁA U CIEBIE".
- Licznik pod mapą: „12 działa u mnie · 44 systemy · 3 etapy · X u Ciebie · wyczyść".
- Zdarzenie GA4 `system_mine_toggle` (system, on). Bez zmian w danych 44 systemów. Rollback: `83eb20f`.

## [2026-08-27] commit 2446044, /kontakt + naprawa formularza raportu

- Nowa strona `/kontakt` (telefon, darek@ai-team.pl, godziny, WhatsApp, formularz 4 pola)
  wysyłająca przez istniejące `/api/notify-zlecenie` z `source: kontakt`; API dostało
  etykietę „Wiadomość z /kontakt" i temat maila zależny od źródła. Test live 27.08: OK.
- `raport.html`: formularz wysyłał na `formspree.io/f/your-id` (placeholder, zapisy ginęły).
  Teraz zapis do Firestore `newsletter_subscribers` (`source: raport`, grupa
  `raport-15-sposobow`, ta sama zgoda co AI Radar) i przekierowanie na nową stronę
  `/raport-dziekuje` z bezpośrednim pobraniem `assets/raport-15-sposobow-ai-v2.pdf` (noindex).
- Link „Formularz kontaktowy" w stopce 9 stron, `/kontakt` w `sitemap.xml`,
  w `llms.txt` mail poprawiony z nieistniejącego kontakt@ na darek@ai-team.pl.
- Bez nowej funkcji Vercel (limit 12/12 na Hobby). Rollback: `79b75df`.
- Znalezione przez „test agenta" (@cmo, 27.08). Do zrobienia: mailto na stronie
  głównej i w sekcji systemu dalej wskazuje gmail; „Umów rozmowę" bez linku do /kontakt.

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

## 2026-07-22

- Wdrożono wyłącznie `firestore.rules` do produkcyjnego projektu Firebase `ai-team-zlecenia` w regionie `europe-west1`.
- Dodano dostęp do kolekcji `venture_03_leads` wyłącznie dla jednego konta technicznego Vercela wskazanego przez UID; inne konta i klient publiczny nie mają dostępu, a usuwanie pozostaje zablokowane.
- Dry-run i kompilacja reguł zakończone poprawnie. Produkcyjny test endpointu `/api/mapa-send` zwrócił HTTP 200, a rekord ze zgodą, etapem i UTM został potwierdzony w Firestore.
- Wdrożenie wykonano z niezatwierdzonej jeszcze zmiany `firestore.rules` na bazie commita `bb71c418d77d21f2ae1fa1ba775a64af5cf67556`. Poprzedni stan reguł można odtworzyć z tego commita i ponownie wdrożyć wyłącznie `firestore:rules`.
- Po bezpiecznej rotacji tokenu Meta kampania VENTURE-03, adset i reklamy A/B zostały aktywowane z budżetem 20 zł/dzień. Świeży odczyt Meta API o 21:37 CEST potwierdził `ACTIVE` na wszystkich poziomach.
- Landing kampanii zwraca HTTP 200. Test w prawdziwym Chrome potwierdził `PageView`, `ViewContent`, `Lead` i `InitiateCheckout`, zachowanie UTM oraz brak PII w zdarzeniach Meta; `Purchase` czeka na pierwszą prawdziwą płatność w Stripe.
