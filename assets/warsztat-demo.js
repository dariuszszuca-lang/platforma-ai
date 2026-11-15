/* Pokaz „Warsztat na żywo” w hero: asystent porządkuje maile, Teamek komentuje, decyzja zostaje po stronie człowieka. */
(function () {
  'use strict';
  var root = document.getElementById('ws'); if (!root) return;
  var items = Array.prototype.slice.call(document.querySelectorAll('#ws-log li'));
  var bub = document.getElementById('ws-bub'), img = document.getElementById('ws-img');
  var ask = document.getElementById('ws-ask'), done = document.getElementById('ws-done'), drafts = document.getElementById('ws-drafts');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [];
  function vt(fn) { if (document.startViewTransition && !reduce) document.startViewTransition(fn); else fn(); }
  function say(t, pose) { vt(function () { bub.textContent = t; if (pose) img.src = '/assets/teamek/' + pose + '.webp'; }); }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    items.forEach(function (li) { li.classList.remove('on'); });
    ask.classList.remove('on'); done.hidden = true; drafts.hidden = true;
  }
  function play() {
    reset();
    if (reduce) { items.forEach(function (li) { li.classList.add('on'); }); ask.classList.add('on'); bub.textContent = 'Bez Ciebie nic nie wysyłam.'; return; }
    say('Poniedziałek, 8:00. Patrz.', 'pokazuje');
    items.forEach(function (li, i) {
      timers.push(setTimeout(function () { li.classList.add('on'); say(li.dataset.say, i === 1 ? 'laptop' : i === 3 ? 'lista' : 'pokazuje'); }, 900 + i * 1100));
    });
    timers.push(setTimeout(function () { ask.classList.add('on'); say('Teraz Ty decydujesz.', 'klucz'); }, 900 + items.length * 1100));
  }
  document.getElementById('ws-tak').addEventListener('click', function () {
    vt(function () { ask.classList.remove('on'); drafts.hidden = true; done.hidden = false; bub.textContent = 'Wysłane. Kawa?'; img.src = '/assets/teamek/brawo.webp'; });
  });
  document.getElementById('ws-pop').addEventListener('click', function () { drafts.hidden = !drafts.hidden; say(drafts.hidden ? 'Teraz Ty decydujesz.' : 'Każdy szkic możesz poprawić.', 'lupa'); });
  document.getElementById('ws-again').addEventListener('click', play);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(root);
  } else play();
})();
/* Filtr procesów w sekcji 10 systemów */
(function () {
  var row = document.getElementById('sy-row'); if (!row) return;
  var chips = document.querySelectorAll('#systemy-10 .chip');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function set(f) {
    var apply = function () {
      row.querySelectorAll('.sy').forEach(function (el) { el.hidden = !(f === 'Wszystkie' || el.dataset.p === f); });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.f === f)); });
    };
    if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { set(c.dataset.f); }); });
  set('Wszystkie');
})();
/* światło pod kursorem na kartach */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.tk-card, .sy, .of-card, .step');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
/* Skill /procesy: odtwarzacz rozmowy krok po kroku */
(function () {
  var chat = document.getElementById('sk-chat'); if (!chat) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bub = document.getElementById('sk-bub'), img = document.getElementById('sk-img'), bar = document.getElementById('sk-bar');
  var btns = document.querySelectorAll('#sk-steps button');
  var S = [
    { say: 'Najpierw poznaję Twoją firmę.', pose: 'lupa', l: [['a','Buduję system Skrzynka maili. Trzy pytania.'],['a','1. Jaką skrzynkę masz: Gmail czy inna?'],['u','Gmail, firmowy adres.'],['a','2. Jakie maile są dla Ciebie pilne?'],['u','Zapytania o termin i reklamacje.']] },
    { say: 'Teraz układam system u Ciebie.', pose: 'laptop', l: [['a','Tworzę plik zasad: co jest pilne, a co poczeka.'],['ok','✓ zasady_poczty.md'],['a','Łączę asystenta z Twoją skrzynką, tylko do odczytu.'],['ok','✓ połączenie działa, 23 maile widoczne'],['a','Uczę się Twojego stylu z 20 wysłanych maili.']] },
    { say: 'Bez Ciebie nic nie wychodzi.', pose: 'klucz', l: [['a','Mam 3 szkice odpowiedzi do pilnych maili.'],['a','Wysłać je klientom?'],['btn','Tak, wyślij · Pokaż szkice'],['u','Pokaż szkice.'],['a','Proszę. Każdy możesz poprawić przed wysłaniem.']] },
    { say: 'Sprawdzam na Twoich danych.', pose: 'lista', l: [['a','Test: wysyłam do siebie maila „Czy jest termin w czwartek?”.'],['ok','✓ rozpoznany jako pilny'],['ok','✓ szkic odpowiedzi z Twojego cennika'],['ok','✓ czeka na Twoje „tak”'],['a','System działa. Do zobaczenia w poniedziałek.']] },
    { say: 'Programy się zmieniają, ja nadążam.', pose: 'brawo', l: [['a','Jest nowa wersja skilla: 1.4.'],['a','Co nowego: lepsze szkice po angielsku.'],['u','Zainstaluj.'],['ok','✓ zaktualizowane, Twoje ustawienia zostały'],['a','Następna aktualizacja przyjdzie sama.']] }
  ];
  var t = [], cur = 0, auto = true, timer = null;
  function render(i) {
    cur = i; t.forEach(clearTimeout); t = [];
    btns.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
    bar.style.width = ((i + 1) / S.length * 100) + '%';
    var go = function () { bub.textContent = S[i].say; img.src = '/assets/teamek/' + S[i].pose + '.webp'; chat.innerHTML = ''; };
    if (document.startViewTransition && !reduce) document.startViewTransition(go); else go();
    S[i].l.forEach(function (ln, k) {
      var add = function () {
        var p = document.createElement('p'); p.className = 'sk-' + ln[0];
        if (ln[0] === 'btn') { ln[1].split(' · ').forEach(function (x) { var s = document.createElement('span'); s.textContent = x; p.appendChild(s); }); }
        else p.textContent = ln[1];
        chat.appendChild(p);
      };
      if (reduce) add(); else t.push(setTimeout(add, 250 + k * 650));
    });
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { auto = false; clearInterval(timer); render(+b.dataset.i); }); });
  render(0);
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting && auto && !timer) timer = setInterval(function () { if (auto) render((cur + 1) % S.length); }, 5200);
      if (!e[0].isIntersecting && timer) { clearInterval(timer); timer = null; }
    }, { threshold: 0.35 });
    io.observe(chat);
  }
})();
/* Suwak 20 tygodni */
(function () {
  var r = document.getElementById('tl-r'); if (!r) return;
  var N = [['Wiedza firmy','lupa'],['Twoja zgoda','klucz'],['Skrzynka maili','laptop'],['Baza klientów','paczka'],['Lista zadań','lista'],['Przypomnienia','zegar'],['Rozmowa do decyzji','telefon'],['Wycena','pomysl'],['Wpisy w sieci','megafon'],['Reklamy pod kontrolą','brawo']];
  var out = document.getElementById('tl-out'), n = document.getElementById('tl-n'), fg = document.getElementById('tl-fg'), now = document.getElementById('tl-now'), have = document.getElementById('tl-have'), img = document.getElementById('tl-img');
  function upd() {
    var w = +r.value, d = w / 2;
    out.textContent = w === 0 ? 'Start: Podstawy' : 'Tydzień ' + w;
    n.textContent = d + '/10';
    fg.style.strokeDasharray = d + ' 10';
    now.textContent = d === 0 ? 'Instalujemy asystenta. Jeszcze żaden system nie działa, ale asystent zna już Twoją firmę.' : d === 10 ? 'Wszystkie 10 systemów działa. Przed Tobą rok dostępu do materiałów i aktualizacji.' : 'Właśnie skończyłeś: ' + N[d - 1][0] + '. Następny: ' + N[d][0] + '.';
    have.innerHTML = '';
    N.forEach(function (x, i) { var li = document.createElement('li'); li.textContent = x[0]; if (i < d) li.className = 'on'; have.appendChild(li); });
    img.src = '/assets/teamek/' + (d === 0 ? 'laptop' : N[d - 1][1]) + '.webp';
    r.style.setProperty('--p', (w / 20 * 100) + '%');
  }
  r.addEventListener('input', upd); upd();
})();
