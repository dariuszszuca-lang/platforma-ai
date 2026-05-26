# Async Platform Design Spec

## Cel

Zbudować pierwszą działającą wersję platformy async dla AI-Team: klient wysyła temat bez umawiania calla, Darek widzi sprawę w panelu, dopisuje odpowiedź, a klient wraca pod prywatny link.

## Zakres MVP

- Publiczna strona `/async` z formularzem zgłoszenia.
- API `/api/async-submit`, które waliduje dane, zapisuje sprawę i wysyła powiadomienie Telegram, jeśli konfiguracja jest dostępna.
- Prywatny widok klienta `/async-sprawa?id=...&key=...`.
- Sekcja `Async desk` w `panel.html` z listą spraw, statystykami, statusem, briefem agenta, odpowiedzią i linkiem klienta.
- Dane zapisujemy w istniejącej kolekcji `zlecenia`, z polem `case_type: "async"`.

## Poza Zakresem MVP

- Konta klientów.
- Płatności.
- Upload plików binarnych.
- Automatyczna wysyłka odpowiedzi mailem.
- Pełny agent AI z API modelu.

## Architektura

Frontend jest statyczny i działa na Vercel. Formularz wysyła JSON do funkcji serverless. Funkcja zapisuje dokument do Firestore przez serwerowy token Firebase. Panel korzysta z istniejącego logowania Firebase i czyta `zlecenia`, filtrując sprawy async po `case_type` albo `source`.

## Model Danych

Dokument `zlecenia/{id}`:

- `id`
- `case_type: "async"`
- `source: "async-platform"`
- `status: "new" | "triage" | "waiting" | "answered" | "closed"`
- `priority: "high" | "medium" | "normal"`
- `name`, `email`, `phone`, `company`
- `category`, `urgency`, `title`, `goal`, `context`, `links`, `budget`
- `agent_brief`
- `public_key`, `public_url`
- `response_text`, `response_url`, `internal_notes`
- `created_at`, `updated_at`, `answered_at`

## Flow

1. Klient wypełnia `/async`.
2. API tworzy sprawę i prywatny link.
3. Darek dostaje powiadomienie i widzi sprawę w panelu.
4. Darek zapisuje status i odpowiedź.
5. Klient otwiera `/async-sprawa` i widzi aktualny status albo odpowiedź.

## Decyzje Techniczne

- W MVP używamy `zlecenia`, żeby nie blokować się na deployu nowych reguł Firestore.
- Brak uploadu plików. Klient podaje linki do materiałów.
- Brief agenta jest generowany deterministycznie po stronie API, bez kosztów modeli.
- Link klienta jest chroniony losowym `public_key`, nie logowaniem.

## Ryzyka

- Prywatny link działa jak sekret. Kto ma link, widzi odpowiedź.
- Jeśli w Vercel brakuje serwerowego tokenu Firebase, zapis zgłoszenia zwróci błąd konfiguracji.
- Panel czyta całą kolekcję `zlecenia` i filtruje po stronie klienta. Przy dużej liczbie zleceń trzeba dodać osobne API albo indeks.

## Weryfikacja

- `node --check` dla funkcji API.
- Sprawdzenie statycznych stron przez lokalny serwer.
- Po pushu: live check `/async`, `/async-sprawa` i `/panel`.
