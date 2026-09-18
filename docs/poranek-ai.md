# Poranki z AI — wdrożenie 18.09.2026

- Publiczny adres: https://ai-team.pl/poranki-ai (Vercel cleanUrls).
- Mandat Darka: „Zrób już na stronie po /poranek-ai”, następnie test zapisu.
- Animowane logo: identyczny znak SVG i pierścień z index.html / mega-fx.css. Paleta i skala nagłówków po akceptowanych iteracjach makiety; mobile od 320 px.
- Formularz: POST /api/async-submit z form_type=poranek-ai; wydzielony helper _poranek-signup.js. Bez kolejnej funkcji Vercel, nowych sekretów lub zmian reguł bazy.
- Dane: istniejące Firestore ai-team-zlecenia, zlecenia/poranek_<sha256 email>. Panel /panel → Leady → Poranki z AI. Oddzielone od newsletter_subscribers; brak wysyłki i zgody newsletterowej.
- Zapis wymaga poprawnego e-maila oraz jawnej zgody dotyczącej informacji o pierwszym spotkaniu. Serwer zapisuje treść i datę zgody. Powtórka nie tworzy kolejnego rekordu. Brak nowych cookies/analityki.
- Rollback: cofnięcie commita dodającego stronę i integrację. Poprzedni main ef4d607; danych zgłoszeń nie usuwać.

## Materiały i przejrzystość

AI_ACT_CHECK: PASS
SYSTEM_I_WLASCICIEL: Poranki z AI / AI-Team, Darek
ROLA: podmiot stosujący, wykonawca techniczny
KATEGORIA: realistyczne media syntetyczne w treści marketingowej
OZNACZENIE_WIDOCZNE: „Poranny klimat · wizualizacja AI” na filmie; informacja o treści w stopce
OZNACZENIE_TECHNICZNE: zachowano oryginały dostawców i prompty w roboczym archiwum AITeam/Temp/poranki-z-ai/makieta/assets; kopie internetowe skompresowano ze względu na transfer
RECENZENT_CZLOWIEK: Darek — korekty układu, typografii i mobilności; akceptacja publikacji
FLAGA_PLATFORMY: NIE_DOTYCZY — własna strona
REJESTR: NIE_DOTYCZY — statyczny materiał, nie wdrożenie systemu generatywnego
UZASADNIENIE: Scena kawiarni jest widocznie oznaczona jako wizualizacja; nie przedstawia ustalonego lokalu lub rzeczywistego spotkania.

Obraz: gpt-image-2.5-flare, high, 1536×1024, 18.09.2026. Wideo: Higgsfield DoP Standard, request 4cc2342b-2604-4950-a00a-ef6a2b240e46. Film internetowy H.264, 1080 px, 4,57 s, bez audio; przejście pętli 0,8 s. Poster WebP. prefers-reduced-motion wyłącza autoplay i obrót logo.

## Korekty po pierwszej publikacji

- Docelowy adres na polecenie Darka: `/poranki-ai`; `/poranek-ai` przekierowuje na niego.
- Usunięty ozdobny krąg, nagłówek „Porozmawiajmy przy kawie”.
- Animacje wejścia sekcji, podkreślenia pytań i reakcje przycisków. Kontrolka zatrzymuje film, logo i ujawnianie sekcji; reduced-motion zachowany.
- Box AI-Team rozwija prawdziwy zrzut strony głównej (18.09.2026) po najechaniu lub dotknięciu. Link otwiera stronę w nowej karcie. Escape i kliknięcie poza zamykają podgląd.
- Test live formularza: HTTP 200, rekord odczytany z Firestore, zgodna zgoda event_notification=true i newsletter=false, powtórka bez duplikatu i zmiany created_at. Syntetyczny wpis poranek-ai-smoke-20260918@example.com oznaczony status=test / is_test=true. Zero wysłanych wiadomości.

## Iteracja: para odsłania stronę

Po korekcie Darka usunięto popup. Podgląd jest stale pod organiczną warstwą pary (CSS + filtr SVG); hover lub dotknięcie rozsuwa warstwy i odsłania zrzut strony. Kontrolka pozwala ponownie zasłonić podgląd, a osobny przycisk otwiera AI-Team. Reduced-motion i zatrzymanie animacji pomijają przejścia. Sekcja o spotkaniu ma trzy dostępne klawiaturą zakładki; pomarańczowa sekcja — interaktywne pytania z krótkim kontekstem. Bez zmian w zapisie, danych, cenach czy wysyłce. Sprawdzone 320/375/390/430/768/1440 px, hover, dotyk, przełączanie zakładek i tematów; bez overflow i błędów JS.

## 2026-09-18 — zaproszenie w kopercie

Zatwierdzony przez Darka kierunek: kremowa karta wysuwa się z pomarańczowej koperty; formularz pozostaje w istniejącej sekcji. Pozostałe sekcje bez zmian. Stempel „Do zobaczenia!” wyświetla się dopiero po odpowiedzi API z ok=true; znika przy kolejnej próbie. Bez zmian API, zgód, bazy i wysyłek.

Weryfikacja lokalna Chrome/Playwright: szerokości 320/390/768/1440, brak overflow i błędów JS. Symulowane odpowiedzi 503 i 200 potwierdzają brak stempla po błędzie oraz stempel po sukcesie. Testy nie wysyłały zgłoszeń do produkcji. Sprawdzone wizualnie desktop i mobile. Animacje respektują prefers-reduced-motion oraz przycisk zatrzymania ruchu.

AI_ACT_CHECK: NIE_DOTYCZY
SYSTEM_I_WLASCICIEL: Poranki z AI / AI-Team
ROLA: wykonawca techniczny
KATEGORIA: inna — standardowa edycja interfejsu
OZNACZENIE_WIDOCZNE: NIE_DOTYCZY; istniejące oznaczenia mediów pozostają
OZNACZENIE_TECHNICZNE: NIE_DOTYCZY
RECENZENT_CZLOWIEK: Darek — akceptacja kierunku koperty
FLAGA_PLATFORMY: NIE_DOTYCZY
REJESTR: NIE_DOTYCZY
UZASADNIENIE: Zmiana deterministycznego formularza i dekoracji CSS, bez nowej funkcji AI lub realistycznych mediów syntetycznych.

## 2026-09-18 — grafika prowadzącego dostarczona przez Darka

Podmieniono wyłącznie ilustrację w sekcji host na `assets/poranek-ai/darek-poranki-ai.webp`. Źródło: przekazany przez Darka plik `~/Downloads/ChatGPT Image 18 wrz 2026 o 23_05_16.png`, oryginał pozostaje bez zmian. Konwersja WebP q88 z `-metadata all`, pełny kwadrat bez kadrowania. Dokładny model i wersja nie zostały podane; nazwa pliku wskazuje eksport ChatGPT. Data otrzymania 18.09.2026.

AI_ACT_CHECK: PASS
SYSTEM_I_WLASCICIEL: Poranki z AI / AI-Team
ROLA: podmiot stosujący / wykonawca techniczny
KATEGORIA: realistyczna treść generatywna
OZNACZENIE_WIDOCZNE: „wizualizacja AI” w podpisie bezpośrednio pod grafiką oraz w alt
OZNACZENIE_TECHNICZNE: zachowanie dostępnych metadanych przez cwebp -metadata all; oryginał zachowany
RECENZENT_CZLOWIEK: Darek — dostarczenie i wskazanie grafiki do publikacji
FLAGA_PLATFORMY: NIE_DOTYCZY — własna strona
REJESTR: NIE_DOTYCZY — wymiana materiału, bez nowego systemu AI
UZASADNIENIE: Dostarczona syntetyczna grafika osoby i miejsca otrzymała widoczne oznaczenie przy pierwszym kontakcie.
