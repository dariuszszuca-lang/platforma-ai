// AI-Team — global UI scripts
(function () {
  'use strict';

  // Hamburger menu toggle (mobile)
  function initHamburger() {
    var btn = document.querySelector('.hamburger');
    var menu = document.querySelector('.menu');
    var nav = document.querySelector('nav.top-nav');
    if (!btn || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-locked');
    }
    function open() {
      menu.classList.add('is-open');
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-locked');
    }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      menu.classList.contains('is-open') ? close() : open();
    });
    // Close on link tap
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    // Close on Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
    });
    // Close on resize > tablet
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && menu.classList.contains('is-open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburger);
  } else {
    initHamburger();
  }
})();

/* === QUIZ DIAGNOZA AI === */
(function () {
  const card = document.getElementById('quizCard');
  if (!card) return;

  const TOTAL_STEPS = 5;
  const RESULT_STEP = 6;
  let currentStep = 1;

  const state = {
    team: null,       // 1, 3, 10, 20
    hours: 10,        // 0-40
    bottleneck: null, // emails, clients, docs, reports, content, planning
    tools: null,      // excel, paper, saas, custom
    rate: 200,        // 50-1000
  };

  // Recommendations matrix — based on bottleneck + tools
  const RECOMMENDATIONS = {
    'excel-clients': { title: 'Spersonalizowany CRM', desc: 'Dedykowany system dopasowany do Twoich procesów. Dane w jednym miejscu, bez Excela, automatyzacje powiadomień. Kod na Twoim GitHubie, płacisz raz.', price: '2 500 zł', roi: 'Zwrot inwestycji w 1-2 miesiące', cta: '/zlecenie.html' },
    'paper-clients': { title: 'Spersonalizowany CRM', desc: 'Koniec karteczek i głowy. Dedykowany CRM, baza klientów, historia kontaktów, przypomnienia. Wszystko w jednym miejscu.', price: '2 500 zł', roi: 'Zwrot w 1-2 miesiące', cta: '/zlecenie.html' },
    'emails': { title: 'Sprint Automatyzacji AI', desc: 'Wybieramy maile które się powtarzają, w 2 tygodnie wdrażam asystenta który odpisuje za Ciebie. Stripe + Make + GPT.', price: 'Wycena indywidualna', roi: 'Odzyskasz 8-15h tygodniowo', cta: '/wdrozenie-ai.html' },
    'docs': { title: 'Sprint Automatyzacji AI', desc: 'Generowanie dokumentów, umów, ofert na podstawie szablonu. Wypełniasz formularz, dostajesz gotowy PDF. Koniec ręcznego przerabiania.', price: 'Wycena indywidualna', roi: 'Skróci pracę nad dokumentami o 70%', cta: '/wdrozenie-ai.html' },
    'reports': { title: 'Audyt AI firmy', desc: 'Diagnoza procesów raportowania, mapa automatyzacji, ROI każdej zmiany. Wychodzisz z konkretnym planem na 5-7 wdrożeń.', price: 'Wycena indywidualna', roi: '2-5 dni roboczych', cta: '/wdrozenie-ai.html' },
    'content': { title: 'Zewnętrzny Dział AI (retainer)', desc: 'Pełnoetatowe wsparcie produkcji contentu. Stała opieka, posty, artykuły, newsletter. Tak działa MyWay od 2 lat.', price: 'Wycena indywidualna', roi: 'Stała współpraca', cta: '/wdrozenie-ai.html' },
    'planning': { title: 'Tracker Czasu Freelancera', desc: '7-dniowy audyt na czym tracisz czas. Notion template + PDF + raport AI. Wiesz dokładnie co automatyzować w pierwszej kolejności.', price: '47 zł', roi: 'Lifetime, płatność raz', cta: '/produkt1-tracker.html' },
    'default': { title: 'Mapa AI · konsultacja 0 zł', desc: '30-minutowa rozmowa diagnostyczna. Wychodzisz z konkretną listą 5-7 priorytetów dla swojej firmy. Bez zobowiązań.', price: '0 zł', roi: 'Bez zobowiązań', cta: '#cta' },
  };

  function pickRecommendation() {
    const key1 = state.tools + '-' + state.bottleneck;
    if (RECOMMENDATIONS[key1]) return RECOMMENDATIONS[key1];
    if (RECOMMENDATIONS[state.bottleneck]) return RECOMMENDATIONS[state.bottleneck];
    return RECOMMENDATIONS.default;
  }

  function fmt(n) {
    return n.toLocaleString('pl-PL').replace(/,/g, ' ');
  }

  function showStep(n) {
    card.querySelectorAll('.quiz-step').forEach(el => {
      el.classList.toggle('is-active', parseInt(el.dataset.step) === n);
    });
    const pct = n === RESULT_STEP ? 100 : (n / TOTAL_STEPS) * 100;
    document.getElementById('quizProgressBar').style.width = pct + '%';
    document.getElementById('quizStepLabel').textContent =
      n === RESULT_STEP ? 'Diagnoza · Twój wynik' : 'Pytanie ' + n + ' z ' + TOTAL_STEPS;

    document.getElementById('quizBack').disabled = (n === 1 || n === RESULT_STEP);
    const next = document.getElementById('quizNext');
    if (n === RESULT_STEP) {
      next.style.display = 'none';
    } else {
      next.style.display = '';
      next.textContent = (n === TOTAL_STEPS) ? 'Pokaż wynik →' : 'Dalej →';
      next.disabled = !isStepValid(n);
    }

    // scroll quiz card into view (smooth)
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function isStepValid(n) {
    if (n === 1) return state.team !== null;
    if (n === 2) return true; // slider always has value
    if (n === 3) return state.bottleneck !== null;
    if (n === 4) return state.tools !== null;
    if (n === 5) return true;
    return false;
  }

  function calculate() {
    const weekly = state.hours * state.rate;
    const yearly = weekly * 50; // 50 working weeks
    const recoverableHours = state.hours;
    const recoverableDays = Math.round((recoverableHours * 50) / 8);
    const rec = pickRecommendation();

    document.getElementById('resultWeekly').textContent = fmt(weekly) + ' zł';
    document.getElementById('resultYearly').textContent = fmt(yearly) + ' zł';
    document.getElementById('resultHours').textContent = recoverableHours;
    document.getElementById('resultDays').textContent = recoverableDays;
    document.getElementById('recommendTitle').textContent = rec.title;
    document.getElementById('recommendDesc').textContent = rec.desc;
    document.getElementById('recommendPrice').textContent = rec.price;
    document.getElementById('recommendRoi').textContent = rec.roi;
    document.getElementById('recommendCta').setAttribute('href', rec.cta);
  }

  // Option click handlers
  card.querySelectorAll('.quiz-options').forEach(group => {
    const name = group.dataset.name;
    group.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        const val = btn.dataset.value;
        state[name] = isNaN(val) ? val : parseInt(val);
        document.getElementById('quizNext').disabled = false;
      });
    });
  });

  // Sliders
  const hoursSlider = document.getElementById('hoursSlider');
  const hoursValue = document.getElementById('hoursValue');
  if (hoursSlider) {
    hoursSlider.addEventListener('input', () => {
      state.hours = parseInt(hoursSlider.value);
      hoursValue.textContent = state.hours;
    });
  }

  const rateSlider = document.getElementById('rateSlider');
  const rateValue = document.getElementById('rateValue');
  if (rateSlider) {
    rateSlider.addEventListener('input', () => {
      state.rate = parseInt(rateSlider.value);
      rateValue.textContent = state.rate;
    });
  }

  // Navigation
  document.getElementById('quizNext').addEventListener('click', () => {
    if (!isStepValid(currentStep)) return;
    if (currentStep === TOTAL_STEPS) {
      calculate();
      currentStep = RESULT_STEP;
      showStep(RESULT_STEP);
    } else {
      currentStep++;
      showStep(currentStep);
    }
  });

  document.getElementById('quizBack').addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  });

  document.getElementById('quizRestart').addEventListener('click', () => {
    state.team = null; state.bottleneck = null; state.tools = null;
    state.hours = 10; state.rate = 200;
    if (hoursSlider) { hoursSlider.value = 10; hoursValue.textContent = 10; }
    if (rateSlider) { rateSlider.value = 200; rateValue.textContent = 200; }
    card.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('is-selected'));
    currentStep = 1;
    showStep(1);
  });

  // Make "Rozpocznij quiz" CTAs scroll into view (fallback) — but quiz is already inline
  document.querySelectorAll('a[href="#cta"]').forEach(link => {
    if (link.textContent.toLowerCase().includes('quiz')) {
      link.setAttribute('href', '#quizCard');
    }
  });

  // Init
  showStep(1);
})();
