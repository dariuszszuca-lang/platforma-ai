/* AI-Team „mega": nawigacja na podstronach (skórka). */
(function () {
  var nav = document.getElementById('nav'), burger = document.getElementById('burger');
  function onScroll() { if (nav) nav.classList.toggle('solid', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (burger && nav) {
    burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    nav.querySelectorAll('.menu a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }
})();
