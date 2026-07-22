# VENTURE-03: zapis leada i pomiar kampanii

## Cel

Przygotować quiz Mapy Wdrożenia AI do płatnego ruchu Meta. Przed pokazaniem wyniku quiz zbiera email i osobną zgodę na kontakt dotyczący produktu. Dane nie trafiają do głównej listy AI Radar, tylko do izolowanej kolekcji `venture_03_leads`.

## Przepływ

1. Osoba przechodzi 12 pytań.
2. Quiz oblicza etap, ale jeszcze go nie pokazuje.
3. Formularz prosi o email i zgodę na zapis wyniku oraz kontakt dotyczący Mapy.
4. Frontend wysyła email, etap, źródło wejścia i UTM do istniejącej funkcji `/api/mapa-send` z trybem `venture03-lead`.
5. Funkcja waliduje dane, ogranicza nadużycia i zapisuje lead w osobnej kolekcji Firestore. Współdzielenie funkcji zapobiega przekroczeniu limitu funkcji Vercel Hobby.
6. Dopiero po poprawnym zapisie wynik pojawia się na stronie i uruchamia się zdarzenie Meta `Lead`.
7. Klik w link płatności uruchamia `InitiateCheckout`. Strona podziękowania uruchamia `Purchase` raz na przeglądarkę.

## Granice danych

- Email pozostaje wyłącznie w bazie AI-Team. Nie jest parametrem zdarzeń Meta.
- Zapis nie oznacza zapisu do AI Radar.
- Dokument leada ma identyfikator będący skrótem SHA-256 adresu email, a nie jawny email w ścieżce.
- Kolekcja venture jest oddzielona od `newsletter_subscribers`.
- Formularz zawiera link do polityki prywatności i treść zgody zapisaną razem z datą.

## Zdarzenia

| Zdarzenie | Wyzwalacz | Cel decyzji |
|---|---|---|
| `PageView` | wejście na landing, quiz lub podziękowanie | ruch |
| `ViewContent` | wejście na landing lub quiz | jakość wejść |
| `Lead` | skuteczny zapis emaila przed wynikiem | główna konwersja testu |
| `InitiateCheckout` | klik w Stripe | intencja zakupu |
| `Purchase` | strona podziękowania, raz na przeglądarkę | sprzedaż pomocniczo; prawdą finansową pozostaje Stripe |

## Obsługa błędów

- Niepoprawny email lub brak zgody nie wysyła danych i nie pokazuje wyniku.
- Błąd zapisu pokazuje komunikat i pozwala ponowić próbę bez ponownego przechodzenia quizu.
- Honeypot kończy żądanie bez zapisu.
- Publiczny endpoint przyjmuje żądania tylko z domeny AI-Team, podglądów Vercel i localhosta.
- Limit na adres IP ogranicza automatyczne zgłoszenia.

## Test kampanii

Budżet zatwierdzony przez Darka: 20 zł dziennie. `@venture` jest właścicielem produktu i kryteriów decyzji. `@ads` przygotowuje kampanię oraz zestaw reklam w statusie `PAUSED`. Realne wydawanie zaczyna się dopiero po teście zdarzeń i komendzie `OK aktywuj` zgodnie z drabiną zgód operatora reklam.
