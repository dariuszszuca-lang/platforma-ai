(function () {
  const BACKUP_KEY = 'aiTeamTrackerP1.backup';
  const ATTRIBUTION_KEY = 'aiTeamTrackerP1.attribution';
  const NEWSLETTER_CONSENT_TEXT = 'Zgoda na otrzymywanie newslettera AI Radar od Dariusza Szucy / AI-Team drogą elektroniczną.';
  const ATTRIBUTION_PARAMS = ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];

  const firebaseConfig = {
    apiKey: ['AIzaSyDKmfXRkX', 'BhYa6yk9idY4QFZdRRhU5eV9I'].join(''),
    authDomain: 'ai-team-zlecenia.firebaseapp.com',
    projectId: 'ai-team-zlecenia',
    storageBucket: 'ai-team-zlecenia.firebasestorage.app',
    messagingSenderId: '715537035293',
    appId: '1:715537035293:web:fe2978df1e20bfc3e0d6f4',
    measurementId: 'G-N62YHVDCKC'
  };

  const CATEGORIES = [
    { id: 'S1', name: 'Rozmowy sprzedażowe', group: 'Sprzedaż', recover: 0.10, color: '#2563eb' },
    { id: 'S2', name: 'Follow-up i CRM', group: 'Sprzedaż', recover: 0.50, color: '#2563eb' },
    { id: 'S3', name: 'Research leadów', group: 'Sprzedaż', recover: 0.45, color: '#2563eb' },
    { id: 'S4', name: 'Ofertowanie', group: 'Sprzedaż', recover: 0.40, color: '#2563eb' },
    { id: 'P1', name: 'Praca skupiona dla klienta', group: 'Praca', recover: 0.00, color: '#0f766e' },
    { id: 'P2', name: 'Realizacja projektu', group: 'Praca', recover: 0.10, color: '#0f766e' },
    { id: 'P3', name: 'Spotkania z klientem', group: 'Praca', recover: 0.25, color: '#0f766e' },
    { id: 'P4', name: 'Planowanie pracy', group: 'Praca', recover: 0.20, color: '#0f766e' },
    { id: 'A1', name: 'Maile i skrzynka', group: 'Admin', recover: 0.65, color: '#d97706' },
    { id: 'A2', name: 'Faktury i księgowość', group: 'Admin', recover: 0.55, color: '#d97706' },
    { id: 'A3', name: 'Pliki i porządkowanie', group: 'Admin', recover: 0.60, color: '#d97706' },
    { id: 'A4', name: 'Raporty i statusy', group: 'Admin', recover: 0.65, color: '#d97706' },
    { id: 'M1', name: 'Tworzenie contentu', group: 'Marketing', recover: 0.25, color: '#6d28d9' },
    { id: 'M2', name: 'Publikacja w socialach', group: 'Marketing', recover: 0.45, color: '#6d28d9' },
    { id: 'M3', name: 'Analiza wyników', group: 'Marketing', recover: 0.35, color: '#6d28d9' },
    { id: 'M4', name: 'Research i inspiracje', group: 'Marketing', recover: 0.30, color: '#6d28d9' },
    { id: 'K1', name: 'Ustalenia wewnętrzne', group: 'Komunikacja', recover: 0.45, color: '#0891b2' },
    { id: 'K2', name: 'Briefy i poprawki', group: 'Komunikacja', recover: 0.30, color: '#0891b2' },
    { id: 'K3', name: 'Wiadomości ad hoc', group: 'Komunikacja', recover: 0.70, color: '#0891b2' },
    { id: 'Z1', name: 'Przełączanie kontekstu', group: 'Straty', recover: 0.85, color: '#dc2626' },
    { id: 'Z2', name: 'Rozpraszacze', group: 'Straty', recover: 1.00, color: '#dc2626' },
    { id: 'Z3', name: 'Czekanie i blokery', group: 'Straty', recover: 0.75, color: '#dc2626' },
    { id: 'Z4', name: 'Poprawianie po sobie', group: 'Straty', recover: 0.50, color: '#dc2626' },
    { id: 'R1', name: 'Nauka i testy narzędzi', group: 'Rozwój', recover: 0.10, color: '#4f46e5' },
    { id: 'R2', name: 'Strategia i decyzje', group: 'Rozwój', recover: 0.05, color: '#4f46e5' }
  ];

  const QUICK_TASKS = [
    ['Odpowiedzi na maile', 'A1', 30],
    ['Status dla klienta', 'A4', 25],
    ['Spotkanie z klientem', 'P3', 45],
    ['Praca głęboka nad projektem', 'P1', 90],
    ['Scroll / rozproszenie', 'Z2', 20]
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let db;
  let auth;
  let currentUser = null;
  let userRef = null;
  let taskRef = null;
  let appInitialized = false;
  let state = loadBackup() || defaultState();

  document.addEventListener('DOMContentLoaded', () => {
    captureAttribution();
    initFirebase();
    bindAuth();

    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      if (!user) {
        showGate();
        return;
      }
      try {
        await loadAccount(user);
        showApp();
        initAppOnce();
        renderAll();
        showToast('Dane zsynchronizowane z kontem.');
      } catch (error) {
        showGate();
        showToast('Nie udało się wczytać konta. Spróbuj zalogować się ponownie.');
      }
    });
  });

  function initFirebase() {
    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    db = window.firebase.firestore();
    auth = window.firebase.auth();
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateIso, amount) {
    const date = new Date(`${dateIso}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  function formatDate(dateIso) {
    return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(`${dateIso}T12:00:00`));
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Math.round(value)) + ' zł';
  }

  function formatHours(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m}m`;
    if (!m) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultState() {
    return {
      profile: {
        hourlyRate: 200,
        industry: 'Marketing / SEO / Ads',
        teamSize: 'solo',
        startDate: todayISO()
      },
      tasks: []
    };
  }

  function loadBackup() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveBackup() {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(state));
  }

  function showGate() {
    $('#accessGate').hidden = false;
    $('#appShell').hidden = true;
    refreshIcons();
  }

  function showApp() {
    $('#accessGate').hidden = true;
    $('#appShell').hidden = false;
    refreshIcons();
  }

  function bindAuth() {
    $('#authForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fields = getAuthFields();
      if (!fields.consent) {
        showToast('Zaznacz zgodę na AI Radar. Tracker jest darmowy, ale działa jako zapis do newslettera.');
        return;
      }
      if (fields.company) return;
      await withAuthLoading($('#signupBtn'), async () => {
        await createFreeAccount(fields);
      });
    });

    $('#loginBtn')?.addEventListener('click', async () => {
      const { email, password } = getAuthFields();
      await withAuthLoading($('#loginBtn'), async () => {
        await auth.signInWithEmailAndPassword(email, password);
      });
    });
  }

  function getAuthFields() {
    return {
      name: $('#authName').value.trim(),
      email: $('#authEmail').value.trim().toLowerCase(),
      password: $('#authPassword').value,
      consent: $('#newsletterConsent').checked,
      company: $('#companyField').value.trim()
    };
  }

  async function withAuthLoading(button, action) {
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'Pracuję...';
    try {
      await action();
    } catch (error) {
      showToast(authMessage(error));
    } finally {
      button.disabled = false;
      button.innerHTML = original;
      refreshIcons();
    }
  }

  function authMessage(error) {
    const code = error && error.code;
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Nieprawidłowy email albo hasło.';
    if (code === 'auth/email-already-in-use') return 'Konto z tym emailem już istnieje. Zaloguj się.';
    if (code === 'auth/weak-password') return 'Hasło musi mieć minimum 6 znaków.';
    if (code === 'auth/invalid-email') return 'Podaj poprawny email.';
    return 'Nie udało się zalogować. Spróbuj ponownie.';
  }

  async function createFreeAccount(fields) {
    try {
      const credential = await auth.createUserWithEmailAndPassword(fields.email, fields.password);
      await upsertNewsletter(fields);
      await createOrUpdateTrackerUser(credential.user, fields, true);
      trackSignupConversion(fields);
    } catch (error) {
      if (error && error.code === 'auth/email-already-in-use') {
        showToast('Ten email już ma konto. Kliknij „Mam konto” i zaloguj się.');
        return;
      }
      throw error;
    }
  }

  async function upsertNewsletter(fields) {
    const now = new Date().toISOString();
    const id = newsletterSubscriberId(fields.email);
    const attribution = getAttribution();
    await db.collection('newsletter_subscribers').doc(id).set({
      id,
      email: fields.email,
      name: fields.name,
      group: 'ai-radar',
      groups: ['ai-radar', 'tracker', 'narzedzia'],
      status: 'active',
      source: 'tracker',
      page_url: window.location.href,
      referrer: attribution.referrer || document.referrer || '',
      utm: attribution,
      consent: {
        newsletter: true,
        text: NEWSLETTER_CONSENT_TEXT,
        accepted_at: now,
        privacy_url: 'https://ai-team.pl/privacy',
        privacy_version: '2026-05-11'
      },
      created_at: now,
      updated_at: now,
      last_signup_at: now
    }, { merge: true });
  }

  function newsletterSubscriberId(email) {
    return btoa(email.toLowerCase()).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function captureAttribution() {
    const incoming = readAttributionFromUrl();
    if (!hasAttribution(incoming)) return;
    const stored = readStoredAttribution();
    writeAttribution({
      ...stored,
      ...incoming,
      first_page_url: stored.first_page_url || window.location.href,
      last_page_url: window.location.href,
      captured_at: new Date().toISOString()
    });
  }

  function getAttribution() {
    const stored = readStoredAttribution();
    const incoming = readAttributionFromUrl();
    const merged = {
      ...stored,
      ...incoming,
      page_url: window.location.href,
      referrer: document.referrer || stored.referrer || ''
    };
    return Object.fromEntries(
      Object.entries(merged).filter(([, value]) => typeof value === 'string' && value.trim())
    );
  }

  function readAttributionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return ATTRIBUTION_PARAMS.reduce((result, key) => {
      const value = params.get(key);
      if (value) result[key] = value.slice(0, 250);
      return result;
    }, {});
  }

  function readStoredAttribution() {
    try {
      const raw = localStorage.getItem(ATTRIBUTION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeAttribution(attribution) {
    try {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    } catch {
      // Atrybucja jest pomocnicza. Brak localStorage nie blokuje dostępu do aplikacji.
    }
  }

  function hasAttribution(attribution) {
    return Object.values(attribution).some((value) => typeof value === 'string' && value.trim());
  }

  function trackSignupConversion(fields) {
    const attribution = getAttribution();
    const params = {
      content_name: 'Tracker Czasu',
      content_category: 'AI Radar lead magnet',
      status: 'free_tracker_signup',
      value: 0,
      currency: 'PLN'
    };
    trackMetaEvent('Lead', params);
    trackMetaEvent('CompleteRegistration', params);
    trackAnalyticsEvent('sign_up', {
      method: 'email',
      source: attribution.utm_source || attribution.source || 'tracker',
      campaign: attribution.utm_campaign || ''
    });
  }

  function trackMetaEvent(eventName, params) {
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, params);
    }
  }

  function trackAnalyticsEvent(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  async function loadAccount(user) {
    userRef = db.collection('tracker_users').doc(user.uid);
    taskRef = userRef.collection('tasks');

    const doc = await userRef.get();
    if (!doc.exists) {
      await createOrUpdateTrackerUser(user, { email: user.email, name: '' }, false);
    } else {
      const data = doc.data() || {};
      state.profile = { ...defaultState().profile, ...(data.profile || {}) };
    }

    const snapshot = await taskRef.orderBy('createdAt', 'desc').get();
    state.tasks = snapshot.docs.map((taskDoc) => normalizeTask(taskDoc.id, taskDoc.data()));
    saveBackup();
    syncForms();
  }

  async function createOrUpdateTrackerUser(user, fields, isFreshSignup) {
    userRef = db.collection('tracker_users').doc(user.uid);
    taskRef = userRef.collection('tasks');
    const attribution = getAttribution();
    const payload = {
      email: fields.email || user.email,
      name: fields.name || '',
      profile: state.profile,
      access: {
        trackerP1: true,
        source: 'free-tracker',
        price: 0,
        newsletterGroup: 'ai-radar'
      },
      marketing: {
        source: 'tracker',
        groups: ['ai-radar', 'tracker', 'narzedzia'],
        consentAt: isFreshSignup ? new Date().toISOString() : null,
        attribution
      },
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };
    if (isFreshSignup) payload.createdAt = window.firebase.firestore.FieldValue.serverTimestamp();
    await userRef.set(payload, { merge: true });
  }

  function normalizeTask(id, data) {
    return {
      id,
      title: data.title || '',
      categoryId: data.categoryId || 'A1',
      minutes: Number(data.minutes) || 0,
      date: data.date || todayISO(),
      createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
    };
  }

  function initAppOnce() {
    if (appInitialized) return;
    appInitialized = true;
    bindNavigation();
    bindForms();
    bindActions();
    populateCategories();
    populateQuickChips();
    syncForms();
    refreshIcons();
  }

  function bindNavigation() {
    $$('[data-view]').forEach((button) => {
      button.addEventListener('click', () => switchView(button.dataset.view));
    });
    $$('[data-view-jump]').forEach((button) => {
      button.addEventListener('click', () => switchView(button.dataset.viewJump));
    });
    $$('[data-focus-task]').forEach((button) => {
      button.addEventListener('click', () => {
        switchView('dashboard');
        setTimeout(() => $('#taskTitle')?.focus(), 180);
      });
    });
  }

  function switchView(view) {
    $$('.view').forEach((section) => section.classList.remove('is-active'));
    $(`#view-${view}`)?.classList.add('is-active');
    $$('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
    const title = $(`#view-${view}`)?.dataset.title || 'Tracker';
    $('#viewTitle').textContent = title;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshIcons();
  }

  function bindForms() {
    $('#taskForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await addTask({
        title: form.get('title').toString().trim(),
        categoryId: form.get('category').toString(),
        minutes: Number(form.get('minutes')),
        date: form.get('date').toString()
      });
      event.currentTarget.reset();
      $('#taskDate').value = todayISO();
      $('#taskMinutes').value = 30;
    });

    $('#profileForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.profile = {
        hourlyRate: Number(form.get('hourlyRate')),
        industry: form.get('industry').toString(),
        teamSize: form.get('teamSize').toString(),
        startDate: form.get('startDate').toString()
      };
      await saveProfile();
      renderAll();
      showToast('Ustawienia zapisane.');
    });
  }

  function bindActions() {
    $('#exportCsvBtn').addEventListener('click', exportCsv);
    $('#exportJsonBtn').addEventListener('click', exportJson);
    $('#printReportBtn').addEventListener('click', () => {
      switchView('report');
      setTimeout(() => window.print(), 200);
    });
    $('#copyPromptBtn').addEventListener('click', copyPrompt);
    $('#seedExampleBtn').addEventListener('click', () => seedExampleData(true));
    $('#resetDataBtn').addEventListener('click', resetData);
    $('#lockAppBtn').addEventListener('click', () => auth.signOut());
  }

  function populateCategories() {
    const select = $('#taskCategory');
    select.innerHTML = CATEGORIES.map((category) => (
      `<option value="${category.id}">${category.id} · ${category.name}</option>`
    )).join('');
  }

  function populateQuickChips() {
    $('#quickChips').innerHTML = QUICK_TASKS.map(([title, categoryId, minutes]) => (
      `<button type="button" class="chip" data-title="${escapeAttr(title)}" data-category="${categoryId}" data-minutes="${minutes}">${title}</button>`
    )).join('');

    $$('.chip', $('#quickChips')).forEach((chip) => {
      chip.addEventListener('click', () => {
        $('#taskTitle').value = chip.dataset.title;
        $('#taskCategory').value = chip.dataset.category;
        $('#taskMinutes').value = chip.dataset.minutes;
        $('#taskTitle').focus();
      });
    });
  }

  function syncForms() {
    $('#taskDate').value = todayISO();
    $('#hourlyRate').value = state.profile.hourlyRate;
    $('#industry').value = state.profile.industry;
    $('#teamSize').value = state.profile.teamSize;
    $('#startDate').value = state.profile.startDate;
  }

  async function saveProfile() {
    saveBackup();
    await userRef.set({
      email: currentUser.email,
      profile: state.profile,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function addTask(task) {
    if (!task.title || !task.categoryId || !task.date || !Number.isFinite(task.minutes) || task.minutes < 5) {
      showToast('Uzupełnij nazwę, kategorię i czas.');
      return;
    }

    const id = uid();
    const payload = {
      id,
      title: task.title,
      categoryId: task.categoryId,
      minutes: Math.round(task.minutes),
      date: task.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.tasks.unshift(payload);
    saveBackup();
    renderAll();

    try {
      await taskRef.doc(id).set({
        ...payload,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('Zadanie zapisane na koncie.');
    } catch {
      showToast('Zapis lokalny działa, ale synchronizacja nie przeszła. Sprawdź połączenie.');
    }
  }

  async function deleteTask(id) {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    saveBackup();
    renderAll();
    try {
      await taskRef.doc(id).delete();
      showToast('Wpis usunięty.');
    } catch {
      showToast('Wpis zniknął lokalnie, ale usuń go ponownie po synchronizacji.');
    }
  }

  function getCategory(id) {
    return CATEGORIES.find((category) => category.id === id) || CATEGORIES[0];
  }

  function getSummary() {
    const rate = Number(state.profile.hourlyRate) || 0;
    const byCategory = new Map();
    const byDay = new Map();
    let totalMinutes = 0;
    let recoverMinutes = 0;

    for (const task of state.tasks) {
      const category = getCategory(task.categoryId);
      const minutes = Number(task.minutes) || 0;
      totalMinutes += minutes;
      recoverMinutes += minutes * category.recover;

      const currentCategory = byCategory.get(category.id) || { category, minutes: 0, recoverMinutes: 0, tasks: 0 };
      currentCategory.minutes += minutes;
      currentCategory.recoverMinutes += minutes * category.recover;
      currentCategory.tasks += 1;
      byCategory.set(category.id, currentCategory);

      const currentDay = byDay.get(task.date) || { minutes: 0, tasks: 0 };
      currentDay.minutes += minutes;
      currentDay.tasks += 1;
      byDay.set(task.date, currentDay);
    }

    const categories = Array.from(byCategory.values()).sort((a, b) => b.minutes - a.minutes);
    const recovery = Array.from(byCategory.values()).sort((a, b) => b.recoverMinutes - a.recoverMinutes);
    const trackedDays = Array.from(byDay.values()).filter((day) => day.tasks > 0).length;
    const completeDays = Array.from(byDay.values()).filter((day) => day.tasks >= 5).length;

    return {
      rate,
      totalMinutes,
      recoverMinutes,
      recoverValue: recoverMinutes / 60 * rate,
      totalValue: totalMinutes / 60 * rate,
      taskCount: state.tasks.length,
      trackedDays,
      completeDays,
      byDay,
      categories,
      recovery,
      topCategory: categories[0],
      topRecovery: recovery[0]
    };
  }

  function renderAll() {
    const summary = getSummary();
    renderHeadline(summary);
    renderGuide(summary);
    renderStats(summary);
    renderWeek(summary);
    renderTasks('#recentTasks', state.tasks.slice(0, 6));
    renderTasks('#allTasks', state.tasks);
    renderReport(summary);
    renderDecision(summary);
    refreshIcons();
  }

  function renderHeadline(summary) {
    $('#progressScore').textContent = `${Math.min(summary.trackedDays, 7)}/7`;
    if (!summary.taskCount) {
      $('#headlineMetric').textContent = 'Zacznij od pierwszego wpisu.';
      $('#headlineText').textContent = 'Dodawaj minimum 5 zadań dziennie. Po tygodniu zobaczysz, gdzie realnie ucieka czas i pieniądze.';
      return;
    }
    $('#headlineMetric').textContent = `Masz ${formatHours(summary.totalMinutes)} zmierzonego czasu.`;
    $('#headlineText').textContent = `Do odzyskania wygląda dziś około ${formatMoney(summary.recoverValue)} tygodniowo. Najmocniejszy trop: ${summary.topRecovery.category.name}.`;
  }

  function renderStats(summary) {
    const cards = [
      ['Łączny czas', formatHours(summary.totalMinutes), `${summary.taskCount} wpisów`],
      ['Koszt czasu', formatMoney(summary.totalValue), `stawka ${formatMoney(summary.rate)}/h`],
      ['Do odzyskania', formatMoney(summary.recoverValue), `${formatHours(Math.round(summary.recoverMinutes))} tygodniowo`],
      ['Pełne dni', `${summary.completeDays}/7`, 'pełny dzień = min. 5 wpisów']
    ];

    $('#statsGrid').innerHTML = cards.map(([label, value, note]) => (
      `<article class="stat-card"><p class="eyebrow">${label}</p><strong>${value}</strong><span>${note}</span></article>`
    )).join('');
  }

  function renderGuide(summary) {
    const steps = [
      ['settings', summary.taskCount > 0],
      ['first-task', summary.taskCount > 0],
      ['habit', summary.completeDays > 0],
      ['report', summary.trackedDays >= 3],
      ['decision', summary.trackedDays >= 7]
    ];
    const current = steps.find(([, done]) => !done)?.[0];

    steps.forEach(([id, done]) => {
      const item = $(`[data-guide-step="${id}"]`);
      if (!item) return;
      item.classList.toggle('is-done', done);
      item.classList.toggle('is-current', !done && id === current);
    });
  }

  function renderWeek(summary) {
    const start = state.profile.startDate || todayISO();
    const end = addDays(start, 6);
    $('#weekRange').textContent = `${formatDate(start)} - ${formatDate(end)}`;

    const names = ['Dzień 1', 'Dzień 2', 'Dzień 3', 'Dzień 4', 'Dzień 5', 'Dzień 6', 'Dzień 7'];
    $('#weekTimeline').innerHTML = names.map((name, index) => {
      const date = addDays(start, index);
      const day = summary.byDay.get(date) || { minutes: 0, tasks: 0 };
      const classes = ['day-card'];
      if (date === todayISO()) classes.push('is-today');
      if (day.tasks >= 5) classes.push('is-complete');
      return `
        <article class="${classes.join(' ')}">
          <div>
            <div class="day-label">${name} · ${formatDate(date)}</div>
            <div class="day-hours">${day.minutes ? formatHours(day.minutes) : '-'}</div>
          </div>
          <div class="day-meta">${day.tasks} wpisów</div>
        </article>
      `;
    }).join('');
  }

  function renderTasks(selector, tasks) {
    const container = $(selector);
    if (!tasks.length) {
      container.innerHTML = '<div class="empty-state">Brak wpisów. Dodaj pierwsze zadanie w szybkim formularzu.</div>';
      return;
    }

    container.innerHTML = tasks.map((task) => {
      const category = getCategory(task.categoryId);
      const value = task.minutes / 60 * Number(state.profile.hourlyRate || 0);
      return `
        <article class="task-row">
          <span class="category-dot" style="background:${category.color}"></span>
          <div class="task-row-title">
            <strong>${escapeHtml(task.title)}</strong>
            <span>${task.date} · ${category.id} ${category.name}</span>
          </div>
          <span class="task-time">${formatHours(task.minutes)}</span>
          <span class="task-cost">${formatMoney(value)}</span>
          <button type="button" class="icon-button" aria-label="Usuń wpis" data-delete-task="${task.id}">
            <i data-lucide="x"></i>
          </button>
        </article>
      `;
    }).join('');

    $$('[data-delete-task]', container).forEach((button) => {
      button.addEventListener('click', () => deleteTask(button.dataset.deleteTask));
    });
  }

  function renderReport(summary) {
    if (!summary.taskCount) {
      $('#reportTitle').textContent = 'Za mało danych na mocny raport.';
      $('#reportIntro').textContent = 'Dodaj kilka zadań. Raport policzy czas, koszt, kwotę do odzyskania i priorytet automatyzacji.';
    } else {
      $('#reportTitle').textContent = `${formatMoney(summary.recoverValue)} tygodniowo do odzyskania.`;
      $('#reportIntro').textContent = `Największa dźwignia to ${summary.topRecovery.category.name}. Nie poprawiaj wszystkiego naraz. Zacznij od jednej kategorii.`;
    }

    $('#reportNumbers').innerHTML = [
      ['Zmierzone', formatHours(summary.totalMinutes)],
      ['Do odzyskania', formatHours(Math.round(summary.recoverMinutes))],
      ['Rocznie', formatMoney(summary.recoverValue * 50)]
    ].map(([label, value]) => `<div class="report-number"><span>${label}</span><strong>${value}</strong></div>`).join('');

    renderCategoryBars(summary);
    renderInsights(summary);
  }

  function renderCategoryBars(summary) {
    if (!summary.categories.length) {
      $('#categoryBars').innerHTML = '<div class="empty-state">Kategorie pojawią się po dodaniu zadań.</div>';
      return;
    }
    const max = Math.max(...summary.categories.map((item) => item.minutes), 1);
    $('#categoryBars').innerHTML = summary.categories.slice(0, 8).map((item) => {
      const width = Math.max(6, item.minutes / max * 100);
      return `
        <div class="bar-row">
          <div class="bar-row-head">
            <span>${item.category.id} · ${item.category.name}</span>
            <span>${formatHours(item.minutes)}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%;background:${item.category.color}"></div></div>
        </div>
      `;
    }).join('');
  }

  function renderInsights(summary) {
    const insights = buildInsights(summary);
    $('#insightsList').innerHTML = insights.map((item) => `
      <article class="insight">
        <span class="insight-icon"><i data-lucide="${item.icon}"></i></span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.text}</p>
        </div>
      </article>
    `).join('');
  }

  function buildInsights(summary) {
    if (!summary.taskCount) {
      return [
        { icon: 'list-plus', title: 'Najpierw dane', text: 'Nie oceniaj tygodnia z pamięci. Wpisz zadania z dzisiaj i wczoraj, nawet niedokładnie.' },
        { icon: 'target', title: 'Minimum', text: 'Cel na każdy dzień to 5 wpisów. Tyle wystarczy, żeby złapać wzór.' }
      ];
    }

    const top = summary.topRecovery.category;
    const yearly = formatMoney(summary.recoverValue * 50);
    const base = [
      {
        icon: 'target',
        title: `Pierwszy priorytet: ${top.name}`,
        text: `Ta kategoria ma największą kwotę do odzyskania. Roczny potencjał z obecnych danych to około ${yearly}.`
      },
      {
        icon: 'scissors',
        title: 'Nie tnij pracy głównej',
        text: 'Odzyskuj admin, rozproszenia i powtarzalną komunikację. Czas zarobkowy ma dostać więcej miejsca, nie mniej.'
      }
    ];

    if (summary.completeDays < 3) {
      base.push({ icon: 'calendar-check', title: 'Dokończ pomiar', text: 'Masz mniej niż 3 pełne dni. Raport już coś mówi, ale decyzję zakupową lub automatyzację podejmij po pełnym tygodniu.' });
    } else {
      base.push({ icon: 'check-circle-2', title: 'Masz wystarczający sygnał', text: 'Wybierz jedną zmianę na najbliższe 7 dni. Jedna naprawiona kategoria jest lepsza niż dziesięć pomysłów w notatniku.' });
    }
    return base;
  }

  function renderDecision(summary) {
    if (!summary.taskCount) {
      $('#decisionTitle').textContent = 'Najpierw zbierz dane.';
      $('#decisionText').textContent = 'Dodaj pierwsze wpisy, a Tracker wskaże kategorię z największym potencjałem odzyskania czasu.';
      $('#decisionChecklist').innerHTML = checklist(['Dodaj 5 wpisów z dzisiaj', 'Ustaw realną stawkę godzinową', 'Wróć do raportu po 3 dniach']);
      return;
    }

    const top = summary.topRecovery.category;
    $('#decisionTitle').textContent = `Automatyzuj: ${top.name}.`;
    $('#decisionText').textContent = 'To nie jest największy hałas, tylko najlepsza dźwignia według Twoich danych. Zacznij od prostego procesu, nie od przebudowy całej firmy.';
    $('#decisionChecklist').innerHTML = checklist(buildChecklist(top));
    $('#nextOfferTitle').textContent = top.group === 'Admin' || top.group === 'Komunikacja' ? 'Decoder Stack AI' : 'Warsztat / sprint AI';
    $('#nextOfferText').textContent = top.group === 'Straty'
      ? 'Jeśli głównym problemem są rozproszenia i kontekst, zacznij od zasad pracy i prostych automatyzacji powiadomień.'
      : 'Po Trackerze wiadomo, gdzie boli. Następny krok to dobranie narzędzi i gotowych wzorców AI pod tę kategorię.';
  }

  function buildChecklist(category) {
    if (category.group === 'Admin') {
      return ['Spisz 10 ostatnich powtarzalnych zadań z tej kategorii', 'Zrób 3 szablony odpowiedzi lub checklisty', 'Jedną rzecz przenieś do automatyzacji w Make, Gmailu albo CRM'];
    }
    if (category.group === 'Komunikacja') {
      return ['Ustal jedno okno na wiadomości ad hoc', 'Zrób szablon briefu lub statusu', 'Dodaj regułę: co idzie mailem, co na spotkanie'];
    }
    if (category.group === 'Straty') {
      return ['Wyłącz źródło największego rozproszenia na 2 godziny dziennie', 'Zablokuj jeden focus block w kalendarzu', 'Po 7 dniach porównaj odzyskany czas'];
    }
    return ['Wybierz jeden proces do poprawy', 'Ustal prosty miernik: minuty albo liczba powtórzeń', 'Przetestuj zmianę przez tydzień'];
  }

  function checklist(items) {
    return items.map((text) => `
      <div class="check-item">
        <span class="check-icon"><i data-lucide="check"></i></span>
        <p>${text}</p>
      </div>
    `).join('');
  }

  function exportCsv() {
    if (!state.tasks.length) {
      showToast('Brak danych do eksportu.');
      return;
    }
    const header = ['date', 'title', 'category_id', 'category', 'minutes', 'value_pln', 'recoverable_pln'];
    const rows = state.tasks.map((task) => {
      const category = getCategory(task.categoryId);
      const value = task.minutes / 60 * state.profile.hourlyRate;
      const recoverable = value * category.recover;
      return [task.date, task.title, category.id, category.name, task.minutes, Math.round(value), Math.round(recoverable)];
    });
    downloadFile('tracker-czasu.csv', [header, ...rows].map(csvRow).join('\n'), 'text/csv;charset=utf-8');
  }

  function exportJson() {
    downloadFile('tracker-czasu-backup.json', JSON.stringify(state, null, 2), 'application/json');
  }

  async function copyPrompt() {
    const summary = getSummary();
    const prompt = [
      'Przeanalizuj mój 7-dniowy tracker czasu i wskaż 3 konkretne zmiany.',
      `Stawka: ${state.profile.hourlyRate} zł/h`,
      `Łączny czas: ${formatHours(summary.totalMinutes)}`,
      `Kwota do odzyskania tygodniowo: ${formatMoney(summary.recoverValue)}`,
      '',
      'Kategorie:',
      ...summary.categories.map((item) => `- ${item.category.id} ${item.category.name}: ${formatHours(item.minutes)}, potencjał odzyskania ${formatHours(Math.round(item.recoverMinutes))}`),
      '',
      'Zadania:',
      ...state.tasks.map((task) => `- ${task.date}, ${task.title}, ${task.categoryId}, ${task.minutes} min`)
    ].join('\n');

    try {
      await navigator.clipboard.writeText(prompt);
      showToast('Prompt skopiowany.');
    } catch {
      showToast('Nie udało się skopiować. Użyj eksportu CSV.');
    }
  }

  async function seedExampleData(showMessage) {
    if (state.tasks.length && !window.confirm('Dodać przykładowe wpisy do obecnego konta?')) return;
    const start = todayISO();
    const examples = [
      ['Odpowiedzi na maile po weekendzie', 'A1', 45, 0],
      ['Praca nad landingiem klienta', 'P1', 110, 0],
      ['Status projektu i raport', 'A4', 35, 0],
      ['Scroll sociali między zadaniami', 'Z2', 25, 0],
      ['Follow-up do leada', 'S2', 20, 0],
      ['Spotkanie z klientem', 'P3', 55, 1],
      ['Porządkowanie plików', 'A3', 40, 1],
      ['Research narzędzi AI', 'R1', 50, 1],
      ['Wiadomości ad hoc', 'K3', 35, 1],
      ['Praca skupiona nad ofertą', 'P1', 95, 1],
      ['Faktury i księgowość', 'A2', 35, 2],
      ['Brief poprawkowy', 'K2', 45, 2],
      ['Tworzenie contentu', 'M1', 75, 2],
      ['Przełączanie między projektami', 'Z1', 30, 2],
      ['Planowanie tygodnia', 'P4', 25, 2]
    ];

    state.profile.startDate = start;
    await saveProfile();
    for (const [title, categoryId, minutes, day] of examples) {
      await addTask({ title, categoryId, minutes, date: addDays(start, day) });
    }
    if (showMessage) showToast('Przykładowy tydzień dodany do konta.');
  }

  async function resetData() {
    const confirmed = window.confirm('Wyczyścić wszystkie wpisy Trackera na tym koncie?');
    if (!confirmed) return;
    const batch = db.batch();
    const snapshot = await taskRef.get();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    state = { ...state, tasks: [] };
    saveBackup();
    renderAll();
    showToast('Dane wyczyszczone.');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function csvRow(values) {
    return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
})();
