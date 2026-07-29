# AI Radar: trzy kampanie budujące bazę

Data decyzji: 29 lipca 2026  
Marka: AI-Team / Darek Szuca

## Cel

Zbudować trzy równoległe, stałe źródła zapisów do newslettera AI Radar:

1. AI Act: istniejąca checklista i działająca kampania.
2. Starter Wdrożeń AI dla Firmy: szeroki lead magnet dla osób, które chcą zacząć korzystać z AI praktycznie.
3. System AI tygodnia: seria dla właścicieli firm zainteresowanych realnymi wdrożeniami, automatyzacjami i systemami.

Każda kampania ma budżet 20 zł dziennie. Łączny planowany wydatek to 60 zł dziennie i 1800 zł przy 30 dniach ciągłej emisji.

## Wspólna architektura

Każda kampania korzysta z osobnego formularza Meta typu Higher Intent. Formularz zawiera jasną zgodę na AI Radar, link do polityki prywatności oraz informację o możliwości wycofania zgody.

Po zapisie:

1. Lead otrzymuje natychmiast pierwszą wiadomość z całym obiecanym materiałem.
2. W bazie zapisuje się źródło kampanii, reklama, formularz, data i wersja zgody.
3. Kolejne wiadomości pomagają wykorzystać materiał i budują relację.
4. Odbiorca przechodzi do regularnego AI Radar.

AI Radar wychodzi dwa razy w tygodniu:

- poniedziałek, 18:00: praktyczne zastosowanie, narzędzie, prompt lub instrukcja;
- czwartek, 18:00: stała sekcja „System AI tygodnia”, rozbiór wdrożenia i naturalne zaproszenie do odpowiedniego produktu lub rozmowy.

## Lead magnet 1: Starter Wdrożeń AI dla Firmy

Format: szczegółowy przewodnik HTML i PDF.

Materiał ma być samodzielny i wartościowy bez zakupu. Zawiera:

- prostą diagnozę dojrzałości AI;
- mapę procesów firmy;
- metodę wyboru pierwszego wdrożenia;
- macierz wartość, trudność, ryzyko;
- gotowe zastosowania dla sprzedaży, obsługi klienta, administracji, marketingu i zarządzania;
- prompty z instrukcją uzupełniania;
- zasady bezpieczeństwa i kontroli człowieka;
- plan wdrożenia na 30 dni;
- checklistę końcową i mierniki wyniku.

Pierwsza wiadomość dostarcza cały PDF oraz link do wersji HTML. Następne wiadomości nie dzielą materiału na części. Pokazują, jak wybrać pierwszy proces, jak uniknąć typowych błędów oraz jak przejść od promptu do działającego systemu.

## Lead magnet 2: System AI tygodnia, wydanie 1

Temat pierwszego wydania: system obsługi zapytań i follow-upu.

Format: szczegółowy przewodnik HTML i PDF, który pokazuje:

- gdzie gubią się zapytania;
- jakie źródła danych trzeba połączyć;
- jak wygląda droga zapytania od wpływu do kolejnego kontaktu;
- które działania może przygotować AI;
- które działania zatwierdza człowiek;
- jakie statusy i reguły są potrzebne;
- jak mierzyć szybkość odpowiedzi i skuteczność follow-upu;
- jak wdrożyć wersję prostą, średnią i rozbudowaną;
- jakich danych nie wolno automatycznie wysyłać do modeli AI;
- checklistę uruchomienia i testów.

Pierwsza wiadomość dostarcza cały materiał. Kolejne wydania „System AI tygodnia” stają się stałą częścią czwartkowego AI Radar.

## Kreacje reklamowe

Grafiki powstają w dwóch warstwach:

1. Beztekstowa baza generowana w `gpt-image-2`.
2. Tekst, logo i elementy marki nakładane lokalnie.

Zapobiega to literówkom i zapewnia ostre napisy.

Kampania Starter Wdrożeń:

- wariant A: „STARTER WDROŻEŃ AI DLA FIRMY” / „Mapa procesów. Prompty. Plan na 30 dni.”
- wariant B: „NIE ZACZYNAJ OD NARZĘDZIA” / „Najpierw sprawdź, gdzie AI ma sens.”

Kampania System AI tygodnia:

- wariant A: „SYSTEM AI TYGODNIA” / „Prawdziwe wdrożenia. Bez teorii.”
- wariant B: „JAK AI PRACUJE W FIRMIE?” / „Co tydzień jeden system od środka.”

Styl: ciemny granat, czerń, biel i pomarańczowy akcent AI-Team. Bez zdjęć stockowych, robotów humanoidalnych, neonowych mózgów i generycznych symboli AI.

## Kontrola jakości i uruchomienie

Przed aktywacją:

- Darek ogląda oba lead magnety i wszystkie cztery grafiki;
- PDF-y przechodzą kontrolę tekstu i eksportu;
- formularze przechodzą test zgody i dostarczenia pierwszej wiadomości;
- lead trafia do bazy z poprawnym źródłem i atrybucją;
- istniejąca kampania AI Act nie jest zmieniana;
- nowe kampanie dostają po 20 zł dziennie.

Pierwsza kontrola każdej nowej kampanii następuje po wydaniu 60 zł. Po wydaniu 200 zł oceniamy nie tylko koszt zapisu, ale również dostarczalność, otwarcia pierwszej wiadomości, kliknięcia w materiał i jakość adresów.
