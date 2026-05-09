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
