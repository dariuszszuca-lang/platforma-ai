# AI RADAR #2

**Newsletter o AI dla Twojego biznesu | Styczeń 2026**

---

Cześć!

Nowy rok, nowe możliwości. W tym wydaniu: przełomowe zmiany u Anthropic, narzędzie które samo wykonuje zadania, i mój własny projekt SaaS - od pomysłu do działającej aplikacji.

**W tym wydaniu:**
- Anthropic Cowork - programowanie bez programowania
- Zapier Agents - automatyzacje które myślą
- Prompt do analizy konkurencji
- Case study: jak zbudowałem Subtracker w 2 tygodnie

Zaczynamy.

---

## GORĄCE NEWSY

**1. Anthropic uruchomił Cowork (12 stycznia)**

Rewolucja dla osób nietechnicznych. Cowork to Claude Code dla zwykłych użytkowników - AI który sam pisze kod, tworzy pliki, buduje aplikacje. Mówisz co chcesz, on wykonuje. Bez znajomości programowania możesz teraz tworzyć własne narzędzia.

Dostępne dla subskrybentów Claude Pro ($20/mies).

**2. Claude Opus 4.5 - nowy lider rankingów**

Najnowszy model Anthropic przeskoczył GPT-5.2 w większości benchmarków. Szczególnie silny w rozumowaniu, analizie dokumentów i pisaniu kodu. Jeśli jeszcze korzystasz tylko z ChatGPT - czas przetestować alternatywę.

**3. Gemini 3 z generatywnym UI**

Google pokazał coś nowego: AI który nie tylko odpowiada tekstem, ale generuje interaktywne interfejsy. Pytasz o wykres sprzedaży - dostajesz klikalne wizualizacje. Na razie w fazie testów, ale kierunek ciekawy.

---

## NARZĘDZIE TYGODNIA: Zapier Agents

**Co to robi:** Autonomiczne automatyzacje które same podejmują decyzje i wykonują wieloetapowe zadania.

**Dla kogo:** Właściciele małych firm którzy chcą zautomatyzować powtarzalne procesy bez zatrudniania asystenta.

**Jak to działa:**
1. Opisujesz zadanie słowami (np. "Gdy klient zamówi produkt, sprawdź stan magazynu, jeśli mało - zamów u dostawcy, powiadom mnie")
2. Agent sam łączy aplikacje i wykonuje kroki
3. Uczy się z Twoich poprawek

**Różnica vs zwykły Zapier:** Klasyczne automatyzacje działają na zasadzie "jeśli X to Y". Agents potrafią analizować kontekst i dostosowywać działania.

**Cena:** Od $69/mies w planie Team. Dużo, ale zastępuje kilka godzin ręcznej pracy tygodniowo.

**Moja ocena:** 7/10. Potencjał ogromny, ale wymaga czasu na naukę i konfigurację. Dla prostych automatyzacji - klasyczny Zapier nadal wystarczy.

**Link:** zapier.com/agents

---

## PROMPT DNIA: Analiza konkurencji

Skopiuj do ChatGPT lub Claude:

```
Jesteś analitykiem biznesowym specjalizującym się w analizie konkurencji.

Przeprowadź analizę konkurencji dla:
- Moja firma: [NAZWA I KRÓTKI OPIS]
- Branża: [TWOJA BRANŻA]
- Główni konkurenci: [WYMIEŃ 2-3 KONKURENTÓW]

Analiza powinna zawierać:

1. POZYCJONOWANIE
Jak każdy konkurent się pozycjonuje? Co obiecuje klientom?

2. MOCNE STRONY
Co robią dobrze? Czego mogę się od nich nauczyć?

3. SŁABE STRONY
Gdzie mają luki? Gdzie mogę być lepszy?

4. CENNIK
Jak się pozycjonują cenowo? Premium, budżetowy, środek?

5. KOMUNIKACJA
Jaki ton głosu? Gdzie są aktywni online?

6. REKOMENDACJE
3 konkretne działania które mogę wdrożyć aby się wyróżnić.

Bądź konkretny. Unikaj ogólników typu "lepszy marketing".
```

**Tip:** Przed użyciem przejrzyj strony konkurentów i wklej fragmenty ich ofert jako kontekst - analiza będzie dużo trafniejsza.

---

## 3 SZYBKIE TIPY

**1. Używaj Claude do długich dokumentów**

ChatGPT ma limit kontekstu ok. 128k tokenów, Claude - 200k. Jeśli analizujesz długie umowy, raporty, dokumentację - Claude lepiej zachowa spójność na przestrzeni całego tekstu.

**2. Eksportuj historię rozmów**

Zarówno ChatGPT jak i Claude pozwalają eksportować rozmowy. Rób to regularnie - masz backup cennych promptów i odpowiedzi. W ChatGPT: Ustawienia > Dane > Eksportuj dane.

**3. Testuj te same prompty w różnych modelach**

Jeden model może źle zrozumieć Twoje polecenie, inny zrozumie idealnie. Zamiast godzinę poprawiać prompt - spróbuj w konkurencyjnym narzędziu. Często to szybsze.

---

## AUTOMATYZACJA TYGODNIA: Inteligentna segregacja maili

**Problem:** Skrzynka pęka w szwach. Ważne maile toną między newsletterami i powiadomieniami. Tracisz czas na sortowanie.

**Rozwiązanie (Make.com + AI):**

1. **Trigger:** Nowy mail w Gmail
2. **Action 1:** Wyślij treść do Claude API z promptem: "Sklasyfikuj tego maila: PILNE / KLIENT / NEWSLETTER / SPAM"
3. **Action 2:** Automatycznie przenieś do odpowiedniego folderu
4. **Action 3:** Jeśli PILNE - wyślij powiadomienie na telefon

**Efekt:** Otwierasz skrzynkę i widzisz od razu co wymaga uwagi. Zero rozpraszaczy.

**Koszt:** Make.com darmowy do 1000 operacji + Claude API ok. $2-5/mies przy normalnym użyciu.

**Czas setup:** 30 minut.

---

## Z WARSZTATU DARKA: Case Study Subtracker

Przez ostatnie 2 tygodnie zbudowałem własną aplikację SaaS - Subtracker.

**Co to jest:**
Aplikacja do śledzenia subskrypcji. Wpisujesz Netflix, Spotify, ChatGPT Plus - widzisz ile wydajesz miesięcznie, dostajesz powiadomienia przed odnowieniem.

**Jak powstała:**
Całość zbudowana z pomocą AI. Claude Code pisał kod, ja nadzorowałem i testowałem. React + Firebase, deployment na Vercel.

**Liczby:**
- Czas: ~40 godzin przez 2 tygodnie
- Koszt: $20 (Claude Pro) + $0 (darmowe plany Firebase i Vercel)
- Linie kodu: ~3000 (napisane przez AI)
- Moja znajomość programowania: podstawowa

**Co się nauczyłem:**
- AI radzi sobie z 80% kodu, ale ostatnie 20% wymaga ludzkiego debugowania
- Dokumentacja to podstawa - AI nie zgadnie czego chcesz
- MVP > perfekcja - lepiej wypuścić coś działającego niż polerować w nieskończoność

**Efekt:** Działająca aplikacja, darmowa dla użytkowników, plany premium w przygotowaniu.

Sprawdź: **subtracker.app**

---

## WARTO PRZECZYTAĆ

**1. "State of AI 2026" - raport**
Coroczne podsumowanie branży AI. Trendy, liczby, prognozy. Obowiązkowa lektura dla każdego kto chce rozumieć kierunek rozwoju.

**2. Dokumentacja Claude - prompting guide**
Oficjalny poradnik Anthropic jak pisać skuteczne prompty. Konkretne przykłady i techniki prosto od twórców.
→ docs.anthropic.com/claude/docs/prompt-engineering

**3. "Building AI Products" - newsletter Lennyego**
Praktyczne porady jak budować produkty z AI. Po angielsku, ale wartościowy dla przedsiębiorców.

---

## Q&A

**"Czy warto płacić $20/mies za Claude Pro skoro jest darmowy ChatGPT?"**

Zależy od zastosowania.

Darmowy ChatGPT wystarczy do:
- Prostych pytań i odpowiedzi
- Krótkich tekstów
- Okazjonalnego użycia

Claude Pro (lub ChatGPT Plus) warto gdy:
- Pracujesz z długimi dokumentami
- Potrzebujesz konsystentnej jakości (darmowe modele mają wahania)
- Używasz AI codziennie do pracy
- Chcesz dostęp do najnowszych funkcji (Cowork, Projects)

Moja zasada: jeśli AI oszczędza Ci więcej niż 2h miesięcznie - subskrypcja się zwraca.

**Masz pytanie?** Odpisz na tego maila.

---

## CO U NAS

**Poranek z AI - darmowe spotkanie**
90 minut praktycznej wiedzy o AI. Sopot, mała grupa.
→ ai-team.pl/poranek-z-ai.html

**Warsztaty AI dla firm**
Stacjonarnie w Sopocie lub online. Wdrażamy narzędzia na Twoim biznesie.
→ ai-team.pl/warsztaty

**Blog - nowe artykuły**
Praktyczne poradniki bez technicznego żargonu.
→ ai-team.pl/blog

---

Do zobaczenia za tydzień.

Darek
AI-Team.pl

---

*Jeśli ten newsletter był przydatny - prześlij go komuś kto też szuka praktycznej wiedzy o AI.*
