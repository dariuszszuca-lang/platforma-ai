# AI Act: pomiar sprzedaży i bezpieczne skalowanie

Data: 2026-08-06
Status: zatwierdzone przez Darka poleceniem „Tak, wdrażaj zmiany, 1-5”.

## Cel

Usunąć nieaktualny przekaz po 2 sierpnia, przypisać zakup pakietu za 67 zł do lejka Meta, wysyłać prawdziwy zakup do Meta Conversions API i zablokować rekomendację skalowania do czasu uzyskania co najmniej trzech rentownych zakupów.

## Rozważone warianty

1. Rozbudować istniejący webhook Stripe. To wariant wybrany: zachowuje jedno miejsce realizacji zakupu, jedno źródło prawdy i najmniejszy zakres wdrożenia.
2. Dodać drugi webhook tylko dla CAPI. Odrzucone, bo dwa endpointy obsługujące ten sam zakup zwiększają ryzyko rozjazdu, podwójnych zdarzeń i trudniejszej diagnostyki.
3. Zastąpić Payment Link własnym Checkout Session. Odrzucone na tym etapie, bo dynamiczne metadane nie są warte przebudowy działającej płatności; Payment Link obsługuje UTM i `client_reference_id`.

## Architektura

Istniejący `api/ai-act-webhook.js` pozostaje jedynym odbiornikiem Stripe dla pakietu. Zakup jest uznawany wyłącznie wtedy, gdy sesja ma właściwy Payment Link, kwotę 6700 groszy i walutę PLN. Samo dopasowanie kwoty nie wystarcza.

Kod CAPI jest wydzielony do małego modułu z funkcjami czystymi. Moduł normalizuje i hashuje e-mail, buduje zdarzenie `Purchase`, nadaje deterministyczny `event_id` oparty na ID sesji Stripe i wysyła `value=67`, `currency=PLN` oraz identyfikator produktu. Sekret Meta pozostaje wyłącznie w zmiennych środowiskowych Vercela.

Mail z checklistą prowadzi na landing z UTM i nieodwracalnym identyfikatorem źródła. Landing przenosi do Payment Linka wyłącznie dozwolone parametry UTM oraz `client_reference_id`; nie przekazuje adresu e-mail ani telefonu. Eksporter leadów przekazuje do endpointu tylko identyfikatory kampanii, zestawu, reklamy i leada.

Landing ładuje istniejący Pixel i mierzy `InitiateCheckout`. Stripe pozostaje źródłem prawdy dla zakupu; CAPI jest warstwą atrybucji Meta.

## Copy po terminie

Landing i maile nie używają już presji „przed 2 sierpnia” ani nieaktualnej promocji. Przekaz brzmi: przepisy już obowiązują, a uporządkowanie tematu nadal ma sens. Cena audytu pozostaje 290 zł, ponieważ Darek nie zatwierdził zmiany ceny, tylko usunięcie wygasłej daty.

Nowe reklamy zachowują działający formularz Lead Ads i trzy istniejące obrazy. Powstają jako nowe obiekty PAUSED; aktywne reklamy nie są edytowane w miejscu. Ich uruchomienie i pauza starych reklam wymagają osobnego „OK aktywuj”. Budżet pozostaje 20 zł dziennie dla tej kampanii i 60 zł dziennie łącznie.

## Strażnik skalowania

Lokalny monitoring czyta wydatki kampanii z Meta i opłacone sesje konkretnego Payment Linka ze Stripe. Nie zmienia kampanii. Zwraca jeden z trzech statusów:

- `OBSERWUJ`: mniej niż 3 zakupy,
- `NIE_SKALUJ`: co najmniej 3 zakupy, ale CPA jest wyższe niż 16,75 zł lub ROAS niższy niż 4,
- `SKALUJ_CZEKA_NA_OK`: co najmniej 3 zakupy, CPA nie większe niż 16,75 zł i ROAS co najmniej 4.

Nawet ostatni status nie zmienia budżetu automatycznie.

## Błędy i ponowienia

Nieprawidłowy podpis Stripe zwraca 400. Inne zdarzenia i inne produkty są ignorowane z 200. Brak konfiguracji CAPI nie blokuje dostawy zakupionego pakietu, ale jest jawnie logowany. Błąd odpowiedzi Meta jest rejestrowany bez tokenu i danych osobowych. `event_id` pozostaje taki sam przy ponowieniu Stripe, więc Meta może zdeduplikować zdarzenie.

Webhook obsługuje `checkout.session.completed` oraz `checkout.session.async_payment_succeeded`, ale realizuje zakup tylko przy `payment_status=paid`.

## Testy i odbiór

Testy jednostkowe muszą potwierdzić odrzucenie produktu o tej samej kwocie z innego Payment Linka, poprawne hashowanie danych CAPI, brak PII w URL atrybucyjnym, propagację UTM do Stripe i wszystkie trzy stany strażnika skalowania. Test statyczny musi wykrywać stare sformułowania z datą 2 sierpnia.

Po pushu należy sprawdzić live landing, webhook bez podpisu, obecność nowych env Vercela, konfigurację zdarzeń webhooka Stripe oraz brak zmian budżetu w Meta. Pierwszy prawdziwy zakup może zostać dosłany do CAPI z oryginalnym czasem zdarzenia, bez tworzenia sztucznej sprzedaży.
