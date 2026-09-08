Cześć,
poniedziałek, 18:00. AI Radar wraca po dwóch tygodniach ciszy. Przepraszam. Sprzątałem firmę: folder z 28 tysięcy plików zszedł do 7 tysięcy, komputer przestał się wieszać, a kolejne numery układa już automat, ja tylko odpisuję „OK”. O tym na końcu.
W zeszłym tygodniu pięć osób zamówiło u mnie system przez formularz na stronie. Żadna nie istniała. Dziś o tym, jak je odsiałem w pół godziny, o trzech krokach, po których reklamy przestają przyprowadzać przypadkowych ludzi, i o wizytówce Google, która przez rok pokazywała firmę nie tym klientom.

01
Formularz, który odróżnia klienta od bota
Pięć zgłoszeń w dwa dni. Nazwiska jak z generatora, telefony z plusem jeden, opis zlecenia po angielsku i w każdym pytaniu z listy zaznaczona pierwsza odpowiedź. Jak uczeń, który nie czytał. Każde zgłoszenie to mail i powiadomienie na telefon, więc pięć razy zerwałem się do „klienta”.
Naprawa zajęła pół godziny i nie ma w niej captchy, bo captcha karze ludzi, nie boty. Trzy warstwy:
•Ukryte pole. Człowiek go nie widzi, bot wypełnia wszystko jak leci. Wypełnione znaczy do kosza.
•Zegar. Formularz dostaje znacznik czasu przy pierwszym dotknięciu. Wysłany szybciej niż w 4 sekundy? Ludzie tak nie piszą.
•Punkty. Telefon spoza Polski: 2 punkty. Opis bez jednego polskiego słowa: 2. Pięć cyfr na końcu maila: 1. Od trzech punktów zgłoszenie znika po cichu. Bot widzi „dziękujemy, odezwiemy się”, ja nie widzę nic. Dwa punkty: mail przychodzi z dopiskiem [?spam], decyduję sam.
Test przed wdrożeniem: pięć botów z tamtego tygodnia, pięć w koszu. Trzy prawdziwe zgłoszenia z Polski, trzy przeszły. Najlepsze: bot nie wie, że przegrał. Dalej myśli, że mamy spotkanie.
Dla małej firmy: zanim kupisz „ochronę antyspamową”, sprawdź, czy Twój formularz ma ukryte pole i zegar. Te dwie rzeczy załatwiły całą moją piątkę.

02
Gorące newsy tygodnia
1. OpenAI wypuściło GPT-6 Astra. Model, który jeszcze cztery tygodnie temu trzymali w laboratorium ze względu na to, co potrafi w cyberbezpieczeństwie. Teraz jest publicznie i domyślnie odmawia pracy nad exploitami. Dla Twojej firmy nic się nie zmienia od jutra. Liczy się, czy pomocnik ma dostęp do Twoich danych, nie który model pod spodem. Źródło: OpenAI.
2. Google pokazało Pics. Edytor obrazów w Workspace: podmienia jeden przedmiot na zdjęciu, tłumaczy napis na produkcie, oddaje kilka wersji naraz. Zdjęcia do sklepu i na wizytówkę Google bez grafika. Źródło: Google.
3. AI czyta EKG. Badanie na 67 tysiącach pacjentów: z samego zapisu EKG model wyłapał do 90 procent chorób serca, bez czekania miesiącami na USG. Wniosek dla firmy: zapis masz. Maile, rozmowy, statusy. Tylko nikt go nie czyta. Źródło: The Guardian.

03 · Z NASZEJ MASZYNOWNI
Wizytówka Google, która pokazywała firmę nie tym ludziom
Dwa biura nieruchomości, to samo Trójmiasto. Pierwsze przez 90 dni: 3 739 wyświetleń wizytówki i 10 telefonów. Drugie: 293 wyświetlenia i 2 telefony. Drugie biuro miało kategorię główną „wynajem”, a sprzedaje domy. Do tego zero usług, cztery opinie bez odpowiedzi i ostatni wpis z listopada.
Jak to naprawiliśmy w jeden dzień:
•Audyt przez API: pełna kopia stanu wizytówki do pliku, żeby dało się cofnąć.
•Kategoria główna: agencja sprzedażowa zamiast wynajmu, dwie kategorie dodatkowe.
•16 usług z opisami do 300 znaków. Pułapka: Google sprawdza usługi względem kategorii już zapisanych, więc najpierw kategoria, potem usługi.
•Nowy opis firmy bez słowa „wynajem”. Wszystko najpierw w trybie podglądu, potem zapis.
Wynik: zmiany na żywo tego samego dnia. Efekt w telefonach zmierzę po 90 dniach, nie obiecuję liczb, których nie mam. Najciekawsze: w panelu Google obie kategorie nazywają się tak samo, „Agencja nieruchomości”. Różni je identyfikator, którego w panelu nie widać.

04 · PROMPT TYGODNIA
Kwalifikator zgłoszenia
Alex Hormozi napisał w swoim newsletterze o trzech krokach do lepszych klientów: wskaż, kogo naprawdę chcesz, dodaj krok kwalifikacyjny (budżet, decyzyjność, potrzeba, czas) i podłącz piksel reklamowy tylko na stronie z podziękowaniem, na którą trafiają dobre leady. Krok drugi możesz mieć dziś. Wklej to polecenie do swojego pomocnika razem z treścią zgłoszenia:
Działaj jako asystent sprzedaży w małej firmie usługowej. Dostajesz treść zgłoszenia z formularza (poniżej). Oceń je w czterech punktach:
1. BUDŻET: czy padła kwota albo sygnał, że są pieniądze?
2. DECYZJA: czy pisze osoba, która decyduje?
3. POTRZEBA: czy opisany problem pasuje do tego, co robimy: [wpisz, co robisz]?
4. CZAS: kiedy chcą zacząć?
Każdy punkt oceń: TAK / NIE / NIE WIEM, jedno zdanie uzasadnienia z cytatem słów klienta.
Na końcu: WERDYKT: ROZMOWA / DOPYTAĆ / PODZIĘKOWAĆ oraz projekt odpowiedzi (maks. 4 zdania, po polsku, bez żargonu). W wersji DOPYTAĆ zadaj jedno pytanie o brakujący punkt.
Jeśli zgłoszenie wygląda na bota (dane z generatora, tekst w obcym języku, pierwsza opcja w każdym polu), napisz tylko: BOT.
Zgłoszenie: [wklej]

05
Trzy szybkie tipy
•Dwie strony z podziękowaniem. Kwalifikowani trafiają na stronę z pikselem, reszta na zwykłą. Platforma reklamowa uczy się wtedy na dobrych ludziach, nie na wszystkich.
•Ukryte pole i cztery sekundy. Dwadzieścia minut pracy programisty albo jedno polecenie dla pomocnika. Zero captchy.
•Kategoria główna wizytówki. Sprawdź raz w roku. Jeśli dwie kategorie nazywają się tak samo, poproś kogoś, kto zajrzy przez API.

Na koniec
Od tego tygodnia posty, rolki i ten newsletter układa mój automat, a ja w niedzielę odpisuję na jeden mail: OK. Jeśli w którymś numerze wyczujesz, że pisał robot, a nie ja, odpisz mi. Poprawiam.
Jeśli Twój formularz zbiera boty, a wizytówka pokazuje firmę nie tym ludziom, odpisz na tego maila albo zacznij od bezpłatnego audytu chaosu w firmie.
Darek
Bezpłatny audyt chaosu na AI-Team.pl

Darek Szuca
AI-Team.pl
Tekst przygotowany z pomocą AI, przeczytany i zatwierdzony przez Darka. Grafika: AI.
Otrzymujesz ten newsletter, bo zapisałeś się na treści AI-Team. Wypis: kliknij tutaj.