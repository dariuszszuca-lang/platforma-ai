# Zasady SEO dla ai-team.pl

## Meta Title (tytuł strony)

| Parametr | Wartość |
|----------|---------|
| Min. długość | 30 znaków |
| Max. długość | **60 znaków** |
| Format | `[Tytuł artykułu] \| AI-TEAM.PL` |

**Przykłady dobrych tytułów:**
- `AI dla małej firmy - od czego zacząć w 2025 | AI-TEAM.PL` (56 zn.)
- `ChatGPT dla początkujących - jak zacząć | AI-TEAM.PL` (52 zn.)
- `Narzędzia AI dla małych firm 2025 | AI-TEAM.PL` (46 zn.)

**Zasady:**
- Główne słowo kluczowe na początku
- Unikaj powtórzeń
- Jeśli za długi - usuń "praktyczny", "kompletny", skróć opis

---

## Meta Description (opis)

| Parametr | Wartość |
|----------|---------|
| Min. długość | **120 znaków** |
| Max. długość | **160 znaków** |
| Optymalna | 140-155 znaków |

**Przykłady dobrych opisów:**
- `Praktyczny przewodnik wdrożenia AI w małej firmie. Dowiedz się od czego zacząć, jakie narzędzia wybrać i jak zaoszczędzić 10+ godzin tygodniowo.` (144 zn.)
- `Jak wykorzystać AI w salonie kosmetycznym. Automatyzacja rezerwacji, marketing w social media, obsługa klienta - konkretne narzędzia i przykłady.` (145 zn.)

**Zasady:**
- Zawsze zawieraj główne słowo kluczowe
- Opisz korzyść dla czytelnika
- Użyj CTA lub zachęty (Dowiedz się, Sprawdź, Poznaj)
- Nie kończ w połowie zdania

---

## Struktura nagłówków

```
H1 - Jeden na stronę (tytuł artykułu)
  H2 - Główne sekcje (3-7 na artykuł)
    H3 - Podsekcje (opcjonalne)
```

**Zasady:**
- H1 zawiera główne słowo kluczowe
- H2 zawierają słowa kluczowe drugorzędne
- Nie pomijaj poziomów (nie skacz z H2 do H4)

---

## Słowa kluczowe

**Gdzie umieszczać:**
- Meta title (na początku)
- Meta description
- H1 (tytuł artykułu)
- Pierwsze 100 słów tekstu
- H2 (przynajmniej w niektórych)
- Alt tekst obrazków
- URL (nazwa pliku)

**Gęstość:** 1-2% tekstu (nie przesadzaj)

---

## URL / Nazwa pliku

| Parametr | Wartość |
|----------|---------|
| Format | `slowa-kluczowe.html` |
| Max. długość | ~60 znaków |
| Separator | myślnik `-` |

**Przykłady:**
- `ai-dla-malej-firmy.html` ✅
- `chatgpt-dla-poczatkujacych.html` ✅
- `narzedzia-ai-2025.html` ✅

**Unikaj:**
- Polskich znaków (ą, ę, ó, etc.)
- Podkreślników `_`
- Wielkich liter
- Zbyt długich nazw

---

## Obrazki

**Alt text:**
- Opisowy, zawiera słowo kluczowe
- Max 125 znaków
- Przykład: `alt="Schemat automatyzacji Make.com dla małej firmy"`

**Nazwa pliku:**
- `ai-narzedzia-porownanie.png` ✅
- `IMG_2847.png` ❌

**Format:**
- WebP (preferowany) lub PNG/JPG
- Kompresja (TinyPNG, Squoosh)

---

## Linkowanie wewnętrzne

**Zasady:**
- Każdy artykuł linkuje do 2-3 innych
- Anchor text = słowa kluczowe (nie "kliknij tutaj")
- Sekcja "Czytaj dalej" na końcu artykułu

**Przykład:**
```html
<a href="chatgpt-dla-poczatkujacych.html">ChatGPT dla początkujących</a>
```

---

## Sitemap i robots.txt

**sitemap.xml** - aktualizuj przy każdym nowym artykule:
```xml
<url>
    <loc>https://ai-team.pl/blog/nowy-artykul.html</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
</url>
```

**robots.txt** - już skonfigurowany, nie wymaga zmian.

---

## Checklist przed publikacją

- [ ] Title: 30-60 znaków, słowo kluczowe na początku
- [ ] Description: 120-160 znaków, zawiera słowo kluczowe
- [ ] URL: krótki, bez polskich znaków, z myślnikami
- [ ] H1: jeden, zawiera główne słowo kluczowe
- [ ] H2: 3-7 sekcji, niektóre ze słowami kluczowymi
- [ ] Linki wewnętrzne: 2-3 do innych artykułów
- [ ] Obrazki: alt text, skompresowane
- [ ] Sitemap: dodany nowy URL
- [ ] Search Console: poproś o indeksację

---

## Narzędzia pomocnicze

- **Sprawdzanie długości:** https://www.charactercountonline.com/
- **Kompresja obrazków:** https://tinypng.com/
- **Search Console:** https://search.google.com/search-console
- **Test mobile:** https://search.google.com/test/mobile-friendly

---

*Ostatnia aktualizacja: 2025-12-26*
