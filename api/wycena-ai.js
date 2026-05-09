// Vercel Serverless Function - AI Pricing Estimate
// Endpoint: POST /api/wycena-ai

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, category } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Brak opisu zadania' });
  }

  const validCategories = ['konsultacja', 'automatyzacja', 'narzedzie', 'wdrozenie', 'inne'];
  const selectedCategory = validCategories.includes(category) ? category : 'inne';
  const categoryLabels = {
    konsultacja: 'CRM + warsztat',
    automatyzacja: 'Warsztat AI - dzień 1 + dzień 2',
    narzedzie: 'Spersonalizowany CRM',
    wdrozenie: 'Warsztat AI - dzień 1',
    inne: 'Nie wiem / inne'
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'Błąd konfiguracji serwera' });
  }

  const systemPrompt = `Jesteś asystentem kwalifikującym zgłoszenia dla polskiego freelancera (Darek, AI-Team.pl, Gdańsk).

## ZASADY KRYTYCZNE — ZERO HALUCYNACJI
- Wyceniaj TYLKO na podstawie poniższej oferty. NIE wymyślaj cen.
- Jeśli zgłoszenie wykracza poza ofertę, zaproponuj rozmowę i nie twórz nowego produktu.
- NIE obiecuj funkcji, których nie ma w opisie.
- Bądź KONSERWATYWNY — lepiej zawęzić zakres niż rozczarować klienta.
- Cena ZAWSZE w PLN. To jest rynek polski, stawki polskie.

## AKTUALNA OFERTA (TWARDE DANE)

### Spersonalizowany CRM
- STAŁA CENA: 2500 PLN jednorazowo
- Płatność: 1000 PLN zaliczki + 1500 PLN po odbiorze
- Czas: 1-2 tygodnie
- Zakres: baza klientów, statusy, zadania, historia kontaktu, podstawowe widoki i pola dopasowane do procesu firmy
- Kod i dane po stronie klienta, brak miesięcznego abonamentu
- cena_min: 2500, cena_max: 2500, czas: "1-2 tygodnie"

### Warsztat AI - dzień 1
- STAŁA CENA: 600 PLN za osobę
- Miejsce: Sopot
- Zakres: profil firmy, oferta, persona klienta, instrukcje dla AI, asystent AI, pakiet promptów
- cena_min: 600, cena_max: 600, czas: "1 dzień, termin po zebraniu grupy"

### Warsztat AI - dzień 1 + dzień 2
- STAŁA CENA: 1200 PLN za osobę
- Dzień 2 jest opcjonalny
- Zakres dnia 2: automatyzacje, dokumenty, raporty, workflow i zasady bezpiecznej pracy z AI
- cena_min: 1200, cena_max: 1200, czas: "2 dni, termin po zebraniu grupy"

### CRM + warsztat
- Jeśli klient chce oba produkty, nie sumuj automatycznie bez liczby osób.
- Podaj CRM 2500 PLN plus warsztat 600 PLN/os. za dzień lub 1200 PLN/os. za 2 dni.
- Poproś o liczbę uczestników, jeśli jej nie ma.

### Poza ofertą
- Nie wyceniaj audytów, sprintów, konsultacji godzinowych, zewnętrznego działu AI, landing page'y ani mikrostron.
- Jeśli opis dotyczy czegoś spoza oferty, opisz że AI-Team aktualnie kwalifikuje zgłoszenie do CRM albo warsztatu AI.

## NARZĘDZIA KTÓRE DEVELOPER UŻYWA (podawaj TYLKO te)
Claude Code, Claude API, JavaScript/TypeScript, React, HTML/CSS/Tailwind, Firebase (Firestore, Auth, Hosting), Vercel, Node.js, Telegram Bot API, Google Sheets API, Make/Zapier

NIE podawaj narzędzi których developer nie używa (np. AWS Lambda, Docker, Kubernetes, ML models, TensorFlow).

## FORMAT ODPOWIEDZI
Zwróć WYŁĄCZNIE poprawny JSON (bez markdown, bez backticks):
{
  "czas": "realistyczny czas realizacji, np. '2-3 dni' lub '1-2 tygodnie'",
  "narzedzia": ["tylko", "narzędzia", "z listy powyżej", "max 5"],
  "zlozonosc": "Prosta" lub "Średnia" lub "Złożona",
  "cena_min": liczba_w_PLN_dolna_granica,
  "cena_max": liczba_w_PLN_gorna_granica,
  "opis": "Konkretny opis co wchodzi w zakres: jakie kroki, jaki efekt końcowy. 2-3 zdania po polsku. Nie obiecuj rzeczy których nie wiesz czy da się zrobić."
}`;

  const userPrompt = `Kategoria: ${categoryLabels[selectedCategory]}
Opis zadania: ${description}

Przeanalizuj i zwróć wycenę jako JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return res.status(500).json({ error: 'Błąd komunikacji z AI' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'Brak odpowiedzi od AI' });
    }

    // Parse the JSON response from Claude
    let estimate;
    try {
      estimate = JSON.parse(text.trim());
    } catch (parseError) {
      // Try to extract JSON from the response if wrapped in extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        estimate = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse AI response:', text);
        return res.status(500).json({ error: 'Błąd parsowania odpowiedzi AI' });
      }
    }

    // Validate required fields
    const requiredFields = ['czas', 'narzedzia', 'zlozonosc', 'cena_min', 'cena_max', 'opis'];
    for (const field of requiredFields) {
      if (estimate[field] === undefined) {
        return res.status(500).json({ error: `Niekompletna wycena AI — brak pola: ${field}` });
      }
    }

    return res.status(200).json(estimate);

  } catch (error) {
    console.error('Wycena AI error:', error);
    return res.status(500).json({ error: 'Błąd serwera podczas wyceny' });
  }
};
