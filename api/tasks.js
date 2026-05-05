// GET (list)/POST (create)/DELETE /api/tasks
const { kv } = require('@vercel/kv');
const { requireUser } = require('./_lib/auth');

const KATEGORIE = {
  S1: 'Pierwszy kontakt z leadem', S2: 'Briefing klienta', S3: 'Wycena i oferta',
  S4: 'Negocjacje i zamknięcie', S5: 'Reaktywacja klientów',
  P1: 'Praca skupiona', P2: 'Onboarding klienta', P3: 'Spotkania z klientami', P4: 'Reklamacje i poprawki',
  A1: 'Mejling przychodzący', A2: 'Mejling wychodzący', A3: 'Fakturowanie', A4: 'Księgowość', A5: 'CRM i porządek',
  M1: 'Tworzenie content', M2: 'Interakcje content', M3: 'Newsletter', M4: 'Reklama płatna', M5: 'Networking',
  R1: 'Nauka i kursy', R2: 'Zarządzanie narzędziami', R3: 'Strategia firmy',
  Z1: 'Spotkania bez agendy', Z2: 'Rozpraszacze i scroll', Z3: 'Praca po godzinach',
};

const grupaZKodu = (kod) => ({S:'Sprzedaż',P:'Produkcja',A:'Admin',M:'Marketing',R:'Rozwój',Z:'Strata'})[kod[0]] || '?';

module.exports = async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const tasksKey = `tasks:${user.id}`;

  if (req.method === 'GET') {
    const tasks = (await kv.get(tasksKey)) || [];
    return res.status(200).json({ tasks, kategorie: KATEGORIE });
  }

  if (req.method === 'POST') {
    const { name, kategoria, minutes, date, note } = req.body || {};
    if (!name || !kategoria || !minutes) {
      return res.status(400).json({ error: 'Pola: name, kategoria, minutes wymagane' });
    }
    if (!KATEGORIE[kategoria]) {
      return res.status(400).json({ error: 'Nieznana kategoria' });
    }
    const tasks = (await kv.get(tasksKey)) || [];
    const stawka = user.profile?.hourlyRate || 200;
    const task = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(name).slice(0, 200),
      kategoria,
      grupa: grupaZKodu(kategoria),
      minutes: Math.max(1, Math.min(720, Number(minutes))),
      date: date || new Date().toISOString().slice(0, 10),
      note: note ? String(note).slice(0, 500) : '',
      cost: Math.round((Number(minutes) / 60) * stawka),
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    // Trzymaj max 500 ostatnich
    if (tasks.length > 500) tasks.length = 500;
    await kv.set(tasksKey, tasks);
    return res.status(200).json({ ok: true, task });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Brak id zadania' });
    const tasks = (await kv.get(tasksKey)) || [];
    const filtered = tasks.filter(t => t.id !== id);
    await kv.set(tasksKey, filtered);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
