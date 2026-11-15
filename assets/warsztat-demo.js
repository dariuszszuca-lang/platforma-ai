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
