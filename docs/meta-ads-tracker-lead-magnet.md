# Meta Ads: Tracker Czasu jako lead magnet AI Radar

Status: Pixel włączony na stronie, kampania przygotowana, bez publikacji reklam i bez budżetu.
Data: 2026-05-19

## Cel kampanii

Zbudować listę AI Radar przez darmowy Tracker Czasu.

Główna konwersja: zapis i utworzenie konta w `/app`.

Technicznie aplikacja zapisuje źródło zapisu w Firestore (`newsletter_subscribers.utm` i `tracker_users.marketing.attribution`) oraz wysyła standardowe eventy Meta Pixel: `Lead` i `CompleteRegistration`.

## Warunek przed startem

Nie uruchamiać kampanii, dopóki nie ma:

1. Test w Events Manager: `PageView`, `ViewContent`, `Lead`, `CompleteRegistration`.
2. 2-3 proste kreacje graficzne z ekranem Trackera.
3. Zgoda Darka na datę startu i uruchomienie kampanii.

AI-Team nie ma jeszcze skonfigurowanych danych Meta Ads API w lokalnych plikach, więc nie używać żadnych tokenów MyWay.

Pixel AI-Team utworzony i podpięty 19 maja 2026. Budżet zaakceptowany przez Darka: 20 PLN dziennie.

## Struktura kampanii

Nazwa kampanii:

`AIT_Tracker_AI-Radar_LeadMagnet_2026-05`

Cel:

`Leads` albo najbliższy cel pod konwersję na stronie, jeśli w panelu Meta dostępny jest event `Lead`.

Zestawy reklam:

1. `PL_Broad_25-55_AI_freelance_smallbiz`
   - Polska
   - 25-55
   - szeroko, bez ciasnego interest stackingu
   - Advantage+ placements

2. `Trojmiasto_25-55_warsztaty_upsell`
   - Gdańsk, Gdynia, Sopot + okolice
   - 25-55
   - cel: leady pod AI Radar i późniejsze warsztaty stacjonarne

3. `Retargeting_site_30d`
   - odwiedzający `ai-team.pl` z ostatnich 30 dni
   - tylko gdy Pixel ma już wystarczającą pulę

## URL z UTM

Landing:

`https://ai-team.pl/produkt1-tracker?utm_source=meta&utm_medium=paid_social&utm_campaign=tracker_ai_radar_leadmagnet_2026_05&utm_content={{ad.name}}`

Parametry są przenoszone z landing page’a do `/app`, więc zapis powinien trafiać do Firestore z kampanią.

## Kreacje

Formaty:

1. Statyczna 1:1
   - screenshot panelu Trackera
   - nagłówek: `Najpierw zmierz tydzień. Potem automatyzuj.`
   - dopisek: `Darmowy Tracker Czasu + AI Radar`

2. Story/Reels 9:16 bez mówienia do kamery
   - 3 plansze: `wpisz zadanie`, `zobacz koszt`, `wybierz proces do automatyzacji`
   - CTA: `Uruchom tracker`

3. Karuzela
   - karta 1: `Gdzie naprawdę znika tydzień?`
   - karta 2: `Maile, statusy, spotkania, poprawki`
   - karta 3: `Tracker pokaże, co automatyzować pierwsze`
   - karta 4: `0 zł + zapis do AI Radar`

## Copy reklam

Wariant 1:

W małej firmie łatwo zgubić tydzień między mailami, spotkaniami i poprawkami.

Dlatego zrobiłem darmowy Tracker Czasu.

Przez 7 dni wpisujesz krótkie zadania. Panel liczy koszt czasu i pokazuje, od czego zacząć automatyzację.

0 zł. Dostęp po zapisie do AI Radar.

Nagłówek: `Darmowy Tracker Czasu`
Opis: `Zobacz, co automatyzować pierwsze.`

Wariant 2:

Nie zaczynaj od kolejnego narzędzia AI.

Najpierw sprawdź, gdzie w tygodniu jest najwięcej ręcznej pracy.

Tracker Czasu zbiera proste wpisy, liczy koszt i pokazuje kategorię z największym potencjałem do odzyskania.

Nagłówek: `Najpierw pomiar, potem AI`
Opis: `Darmowy panel + AI Radar.`

Wariant 3:

5 krótkich wpisów dziennie wystarczy, żeby po tygodniu zobaczyć wzór.

Maile. Statusy. Spotkania. Poprawki. Rozproszenia.

Tracker Czasu pokazuje, gdzie naprawdę warto wdrożyć automatyzację.

Nagłówek: `7-dniowy audyt czasu`
Opis: `Dla freelancerów i małych firm.`

Wariant 4:

AI nie powinno zaczynać się od listy modnych narzędzi.

Powinno zaczynać się od pytania: który proces zabiera najwięcej czasu?

Tracker Czasu pomaga to policzyć i zapisać się do AI Radar.

Nagłówek: `Co automatyzować pierwsze?`
Opis: `Zacznij od darmowego Trackera.`

## Compliance

Unikać tekstów typu:

- `Tracisz czas`
- `Masz chaos w firmie`
- `Nie ogarniasz pracy`
- `Odzyskasz X godzin gwarantowane`

Bezpieczniejsze:

- `W małej firmie czas często znika między...`
- `Tracker pokazuje, gdzie jest najwięcej ręcznej pracy`
- `Po tygodniu widać pierwsze wzory`

## KPI testu

Test zaakceptowany budżetowo:

- 20 PLN dziennie przez 5-7 dni
- CTR link: minimum 1%
- CPC: obserwacyjnie, bez sztywnego progu na starcie
- landing -> konto: 10-25%
- CPL: cel roboczy 8-25 PLN

Reguły decyzji:

- po 2 dniach bez leadów: sprawdzić Pixel, formularz, mobile i zgodę newsletterową
- CTR poniżej 0,6% po 1000 wyświetleń: zmienić kreację/copy
- dużo klików i brak kont: skrócić landing albo prowadzić bezpośrednio do `/app`

## Źródła Meta

- Meta: cele kampanii i aukcja reklam: https://www.facebook.com/business/ads/ad-objectives
- Meta: targetowanie i szerokie grupy: https://www.facebook.com/business/ads/ad-targeting
- Meta: prostsza struktura zestawów reklam: https://www.facebook.com/business/ads/ad-set-structure
- Meta: Conversions API: https://www.facebook.com/business/help/AboutConversionsAPI
- Meta Developers: Meta Pixel reference: https://developers.facebook.com/docs/meta-pixel/reference/#standard-events
