/* Blog: podświetlenie rozdziału w spisie treści i filtr kategorii na liście wpisów */
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('#spis a'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); }); var a = map[e.target.id]; if (a) a.classList.add('on'); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }
  var chips = document.querySelectorAll('.bl-chips .chip');
  if (chips.length) {
    var cards = document.querySelectorAll('.bl-grid .pc');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.dataset.f;
        var run = function () {
          cards.forEach(function (k) { k.hidden = !(f === 'Wszystkie' || (k.dataset.t || '').split('|').indexOf(f) > -1); });
          chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        };
        if (document.startViewTransition && !reduce) document.startViewTransition(run); else run();
      });
    });
  }
})();
