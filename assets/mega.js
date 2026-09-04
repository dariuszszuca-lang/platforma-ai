/* AI-Team „mega": nawigacja, odsłanianie sekcji, plansza „Dzień z Twoim Działem AI" (scenariusze w JS, zero API). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nawigacja */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  function onScroll() { if (nav) nav.classList.toggle('solid', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* odsłanianie */
  var rv = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* plansza dnia */
  var log = document.getElementById('log');
  if (!log) return;
  var input = document.getElementById('firma');
  var tabs = document.getElementById('tabs');
  var sub = document.getElementById('log-sub');

  /* {f} = nazwa firmy. Role publiczne jak na ai-team.pl. Ostatni wpis czeka na decyzję człowieka. */
  var S = {
    salon: { name: 'Studio Ola', ev: [
      ['07:00', '@KLON', 'Skrzynka <b>{f}</b>: 11 maili posortowanych, 2 wymagają Twojej odpowiedzi. Szkice gotowe.'],
      ['08:15', 'REZERWACJE', '3 wizyty zapisane w nocy przez stronę. Przypomnienia na jutro zaplanowane.'],
      ['09:00', '@MARKETING', 'Post o nowym zabiegu w stylu <b>{f}</b> napisany. Grafika dołączona.'],
      ['11:30', 'CRM', 'Klientka po 3 miesiącach bez wizyty. Wiadomość z propozycją terminu przygotowana.'],
      ['14:00', '@OPERACYJNY', 'Grafik na jutro wysłany zespołowi. Luka o 13:00 zgłoszona do listy rezerwowej.'],
      ['16:00', '@STRATEGIA', 'Raport dnia na Telegram: 3 nowe wizyty, 2 pytania o cennik, 1 opinia do odpowiedzi.', 'wait']
    ] },
    nieruchomosci: { name: 'Biuro Nowak', ev: [
      ['07:00', '@KLON', 'Skrzynka <b>{f}</b>: 16 maili, 4 zapytania z portali. Odpowiedzi w Twoim stylu do akceptacji.'],
      ['08:30', 'STRONA', 'Nowa oferta z CRM trafiła na stronę <b>{f}</b> i do social media. Bez przepisywania.'],
      ['10:00', '@SPRZEDAŻ', 'Klient z wczoraj pytał o dwa terminy prezentacji. Propozycja wysłana, czekamy na wybór.'],
      ['12:00', '@MARKETING', 'Opis mieszkania z notatki głosowej gotowy. 3 wersje: portal, Facebook, ulotka.'],
      ['13:30', 'CRM', '2 klienci bez kontaktu od 14 dni. Przypomnienie z gotową wiadomością.'],
      ['16:00', '@STRATEGIA', 'Raport dnia na Telegram: 4 zapytania, 1 prezentacja umówiona, 1 oferta do publikacji.', 'wait']
    ] },
    sklep: { name: 'Sklep Lniane', ev: [
      ['07:00', '@KLON', 'Skrzynka <b>{f}</b>: 9 maili, 1 reklamacja. Odpowiedź przygotowana, czeka na Twoje OK.'],
      ['08:00', 'ZAMÓWIENIA', '6 zamówień z nocy. Etykiety wysyłek i potwierdzenia gotowe.'],
      ['09:30', '@MARKETING', 'Opis nowego produktu i post na Instagram dla <b>{f}</b>. Zdjęcia z Twojego folderu.'],
      ['11:00', 'CRM', 'Stały klient nie kupował od 2 miesięcy. Kod rabatowy z wiadomością przygotowany.'],
      ['13:00', '@OPERACYJNY', 'Kopia bazy i sprawdzenie SSL zrobione. Wszystko działa.'],
      ['16:00', '@STRATEGIA', 'Raport dnia na Telegram: 6 zamówień, 1 reklamacja, 2 pytania o dostawę.', 'wait']
    ] },
    b2b: { name: 'Pracownia Kos', ev: [
      ['07:00', '@KLON', 'Skrzynka <b>{f}</b>: 14 maili, 3 do odpowiedzi. Reszta posortowana i oznaczona.'],
      ['08:30', '@SPRZEDAŻ', 'Oferta dla nowego klienta z Twojej notatki głosowej. PDF gotowy do akceptacji.'],
      ['10:00', 'CRM', '2 firmy bez odpowiedzi od 14 dni. Wiadomości przypominające przygotowane.'],
      ['12:30', 'DOKUMENTY', 'Umowa PDF wygenerowana z danych z CRM. Do podpisu.'],
      ['15:00', '@MARKETING', 'Artykuł na blog <b>{f}</b> i post na LinkedIn. Do przeczytania przed publikacją.'],
      ['16:00', '@STRATEGIA', 'Raport dnia na Telegram: 1 oferta wysłana, 2 przypomnienia, 1 umowa do podpisu.', 'wait']
    ] },
    gabinet: { name: 'Gabinet Ruch', ev: [
      ['07:00', '@KLON', 'Skrzynka <b>{f}</b>: 8 maili, 2 pytania o terminy. Odpowiedzi gotowe.'],
      ['08:00', 'REJESTRACJA', '4 nowe zapisy, 1 wizyta odwołana. Luka o 13:00 zaproponowana pacjentowi z listy rezerwowej.'],
      ['10:00', 'DOKUMENTY', 'Karta pacjenta PDF przygotowana przed wizytą o 10:30.'],
      ['12:00', '@MARKETING', 'Odpowiedź na nową opinię Google w stylu <b>{f}</b>. Do akceptacji.'],
      ['14:30', 'CRM', 'Pacjent po zabiegu 4 tygodnie temu. Wiadomość z pytaniem o samopoczucie gotowa.'],
      ['16:00', '@STRATEGIA', 'Raport dnia na Telegram: 4 zapisy, 1 odwołanie, 1 opinia.', 'wait']
    ] },
    osrodek: { name: 'Ośrodek Brzeg', ev: [
      ['07:00', '@KLON', 'Skrzynka <b>{f}</b>: 12 maili, 2 od rodzin pacjentów. Odpowiedzi w Twoim tonie do akceptacji.'],
      ['08:30', 'CRM', '2 nowe zgłoszenia z formularza na stronie. Statusy ustawione, telefon do oddzwonienia.'],
      ['09:15', 'STRONA', 'Artykuł na blog <b>{f}</b> opublikowany zgodnie z planem. Post na poniedziałek gotowy.'],
      ['11:00', '@MARKETING', 'Newsletter na czwartek: 3 tematy, zdjęcia z Twojego folderu. Do przeczytania.'],
      ['14:00', '@OPERACYJNY', 'Kopia bazy pacjentów i sprawdzenie SSL zrobione.'],
      ['16:00', '@STRATEGIA', 'Raport dnia na Telegram: 2 zgłoszenia, 2 maile od rodzin, 1 artykuł.', 'wait']
    ] }
  };

  var state = { ind: 'salon', name: '' };
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function firma() { return (state.name || S[state.ind].name); }

  function render(animate) {
    clearTimers();
    var sc = S[state.ind];
    var f = esc(firma());
    log.innerHTML = '';
    sc.ev.forEach(function (e, i) {
      var li = document.createElement('li');
      li.className = 'ev' + (e[3] === 'wait' ? ' wait' : '');
      li.innerHTML = '<span class="t">' + e[0] + '</span><div><div class="who"><span class="role">' + esc(e[1]) + '</span>' +
        (e[3] === 'wait' ? '<span class="chip wait">czeka na Twoje OK</span>' : '<span class="chip ok">zrobione</span>') +
        '</div><div class="txt">' + e[2].replace(/\{f\}/g, f) + '</div></div>';
      log.appendChild(li);
      if (animate && !reduce) later(function () { li.classList.add('in'); if (e[3] === 'wait' && zap) zap(); }, 120 + i * 190);
      else li.classList.add('in');
    });
    if (sub) sub.textContent = 'Dzień demo firmy ' + firma() + '. Scenariusz dla branży.';
    if (tabs) tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.ind === state.ind ? 'true' : 'false'); });
  }
  function setName() {
    var f = esc(firma());
    log.querySelectorAll('.txt').forEach(function (el, i) { el.innerHTML = S[state.ind].ev[i][2].replace(/\{f\}/g, f); });
    if (sub) sub.textContent = 'Dzień demo firmy ' + firma() + '. Scenariusz dla branży.';
  }

  /* demo na start: plansza sama wpisuje nazwę i zmienia branżę, do pierwszego ruchu użytkownika */
  var demo = { on: !reduce, timers: [] };
  function dlater(fn, ms) { demo.timers.push(setTimeout(fn, ms)); }
  function stopDemo() { if (!demo.on) return; demo.on = false; demo.timers.forEach(clearTimeout); demo.timers = []; }
  function typeName(text, done) {
    var i = 0;
    input.value = '';
    (function step() {
      if (!demo.on) return;
      i += 1;
      input.value = text.slice(0, i);
      state.name = input.value;
      setName();
      if (i < text.length) dlater(step, 60 + Math.random() * 50);
      else if (done) dlater(done, 600);
    })();
  }
  var order = ['salon', 'nieruchomosci', 'sklep', 'b2b', 'gabinet', 'osrodek'];
  function cycle(k) {
    if (!demo.on) return;
    state.ind = order[k % order.length];
    state.name = S[state.ind].name.slice(0, 1);
    render(true);
    typeName(S[state.ind].name, function () { dlater(function () { cycle(k + 1); }, 3200); });
  }

  /* stała wysokość planszy: mierzy najwyższy scenariusz i blokuje na nim wysokość,
     żeby zmiana branży ani auto-demo nie ruszały całej strony (layout shift). Tylko desktop. */
  function evHtml(e, f) {
    return '<li class="ev in' + (e[3] === 'wait' ? ' wait' : '') + '"><span class="t">' + e[0] +
      '</span><div><div class="who"><span class="role">' + esc(e[1]) + '</span>' +
      (e[3] === 'wait' ? '<span class="chip wait">czeka na Twoje OK</span>' : '<span class="chip ok">zrobione</span>') +
      '</div><div class="txt">' + e[2].replace(/\{f\}/g, f) + '</div></div></li>';
  }
  function lockHeight() {
    if (!log) return;
    var keep = log.innerHTML;
    log.style.height = 'auto';
    var probe = 'Przedsiębiorstwo Przykładowe XY';
    var max = 0;
    order.forEach(function (ind) {
      log.innerHTML = S[ind].ev.map(function (e) { return evHtml(e, probe); }).join('');
      if (log.scrollHeight > max) max = log.scrollHeight;
    });
    log.innerHTML = keep;
    log.style.height = max + 'px';
  }
  var rzt;
  window.addEventListener('resize', function () { clearTimeout(rzt); rzt = setTimeout(lockHeight, 150); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lockHeight(); });

  if (input) {
    input.addEventListener('input', function () { stopDemo(); state.name = input.value.trim(); setName(); });
    input.addEventListener('focus', stopDemo);
  }
  if (tabs) {
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ind]');
      if (!b) return;
      stopDemo();
      state.ind = b.dataset.ind;
      render(true);
    });
  }

  /* błyskawice: wyładowania wokół planszy (canvas, tylko desktop, bez reduced-motion).
     Uderzenie przy wpisie „czeka na Twoje OK" plus losowe co kilka sekund. */
  var board = log.closest('.board');
  var zap = null;
  if (board && !reduce && window.innerWidth > 960 && window.matchMedia('(hover: hover)').matches) {
    var wrap = board.parentElement;
    var cv = document.createElement('canvas');
    cv.className = 'zap';
    cv.setAttribute('aria-hidden', 'true');
    wrap.insertBefore(cv, board);
    var ctx = cv.getContext('2d');
    var PADZ = 70, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bolts = [];
    function sizeZap() {
      var r = board.getBoundingClientRect();
      cv.style.width = (r.width + PADZ * 2) + 'px';
      cv.style.height = (r.height + PADZ * 2) + 'px';
      cv.width = Math.round((r.width + PADZ * 2) * dpr);
      cv.height = Math.round((r.height + PADZ * 2) * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function segs(x1, y1, x2, y2, jag) {
      var pts = [[x1, y1]], n = 9;
      for (var i = 1; i < n; i++) {
        var t = i / n;
        var nx = x1 + (x2 - x1) * t, ny = y1 + (y2 - y1) * t;
        var off = (Math.random() - 0.5) * jag * (1 - Math.abs(t - 0.5) * 0.6);
        pts.push([nx + off * ((y2 - y1) / (Math.abs(x2 - x1) + Math.abs(y2 - y1) || 1)), ny + off * ((x2 - x1) / (Math.abs(x2 - x1) + Math.abs(y2 - y1) || 1))]);
      }
      pts.push([x2, y2]);
      return pts;
    }
    function strike() {
      var w = cv.width / dpr, h = cv.height / dpr;
      var corner = Math.floor(Math.random() * 4);
      var tx = corner % 2 ? w - PADZ : PADZ;
      var ty = corner < 2 ? PADZ : h - PADZ;
      var sx = tx + (corner % 2 ? 1 : -1) * (35 + Math.random() * 30);
      var sy = ty + (corner < 2 ? -1 : 1) * (45 + Math.random() * 22);
      var main = segs(sx, sy, tx, ty, 34);
      var k = 2 + Math.floor(Math.random() * 3);
      var br = segs(main[k][0], main[k][1], main[k][0] + (Math.random() - 0.5) * 60, main[k][1] + (Math.random() - 0.5) * 60, 18);
      /* po trafieniu w róg prąd biegnie kawałek po krawędzi planszy */
      var along = Math.random() < 0.5;
      var ex = along ? tx + (corner % 2 ? -1 : 1) * (60 + Math.random() * 90) : tx;
      var ey = along ? ty : ty + (corner < 2 ? 1 : -1) * (50 + Math.random() * 70);
      var edge = segs(tx, ty, ex, ey, 6);
      bolts.push({ t: 0, paths: [main, br, edge] });
      if (!raf) raf = requestAnimationFrame(draw);
    }
    var raf = 0;
    function draw() {
      ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
      bolts = bolts.filter(function (b) { return b.t < 1; });
      bolts.forEach(function (b) {
        b.t += 0.045;
        var a = b.t < 0.2 ? 1 : 1 - (b.t - 0.2) / 0.8;
        var flick = 0.75 + Math.random() * 0.25;
        b.paths.forEach(function (pts, i) {
          ctx.beginPath();
          pts.forEach(function (p, j) { j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(30,138,90,' + (0.7 * a) + ')';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = 'rgba(30,138,90,' + (0.9 * a * flick) + ')';
          ctx.lineWidth = i === 1 ? 1.8 : 2.8;
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(11,74,46,' + (0.95 * a * flick) + ')';
          ctx.lineWidth = i === 1 ? 0.7 : 1.1;
          ctx.stroke();
        });
      });
      raf = bolts.length ? requestAnimationFrame(draw) : 0;
    }
    sizeZap();
    window.addEventListener('resize', function () { clearTimeout(rzt2); rzt2 = setTimeout(sizeZap, 150); }, { passive: true });
    var rzt2;
    (function loop() { setTimeout(function () { if (document.visibilityState === 'visible') strike(); loop(); }, 2600 + Math.random() * 3400); })();
    zap = strike;
    window.__zap = strike;
  }

  if (demo.on) state.name = S.salon.name.slice(0, 1);
  lockHeight();
  render(true);
  if (demo.on) dlater(function () { typeName(S.salon.name, function () { dlater(function () { cycle(1); }, 3200); }); }, 1400);
  else if (input) input.value = S.salon.name;
})();
