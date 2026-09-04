/* AI-Team „mega": efekty strony głównej. Pole sygnałów w hero (canvas), przechył planszy,
   słowa na scrollu, liczniki, światło pod kursorem na cennik, rysowana linia procesu, nagłówki słowo po słowie. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobile = window.innerWidth <= 960;

  /* nagłówki: słowo po słowie */
  document.querySelectorAll('h2').forEach(function (h) {
    if (h.querySelector('*')) return;
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function (w, i) { return '<span class="hw" style="transition-delay:' + (i * 55) + 'ms">' + w + '</span>'; }).join(' ');
  });

  /* hero: pole sygnałów */
  var hero = document.querySelector('.hero');
  if (hero && !reduce && !mobile) {
    var cv = document.createElement('canvas');
    cv.className = 'field';
    cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, GAP = 26, cols = 0, rows = 0;
    var mouse = { x: -9999, y: -9999 };
    var pulses = [];
    var running = false, raf = 0, last = 0;
    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / GAP) + 1; rows = Math.ceil(H / GAP) + 1;
    }
    function spawn() {
      /* impuls biegnie po linii siatki od strony planszy (prawa połowa) w lewo albo pionowo */
      var vertical = Math.random() < 0.3;
      var p = { v: vertical, t: 0, len: 90 + Math.random() * 120, speed: 2.4 + Math.random() * 2.2 };
      if (vertical) { p.x = Math.round((Math.random() * cols)) * GAP; p.y = H + 20; p.dir = -1; }
      else { p.y = Math.round((Math.random() * rows)) * GAP; p.x = W * (0.55 + Math.random() * 0.45); p.dir = -1; }
      pulses.push(p);
    }
    function draw(ts) {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (ts - last < 33) return;
      last = ts;
      ctx.clearRect(0, 0, W, H);
      /* kropki siatki, jaśnieją przy kursorze */
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var x = i * GAP, y = j * GAP;
          var dx = x - mouse.x, dy = y - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var a = 0.16;
          var rr = 1;
          if (d < 160) { var k = 1 - d / 160; a = 0.16 + k * 0.7; rr = 1 + k * 1.6; }
          ctx.fillStyle = d < 160 ? 'rgba(30,138,90,' + a + ')' : 'rgba(27,27,27,' + a + ')';
          ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
        }
      }
      /* impulsy */
      if (pulses.length < 9 && Math.random() < 0.08) spawn();
      pulses = pulses.filter(function (p) { return p.v ? p.y > -p.len - 20 : p.x > -p.len - 20; });
      pulses.forEach(function (p) {
        if (p.v) p.y += p.dir * p.speed; else p.x += p.dir * p.speed;
        var g;
        if (p.v) g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.len);
        else g = ctx.createLinearGradient(p.x, p.y, p.x + p.len, p.y);
        g.addColorStop(0, 'rgba(30,138,90,0.95)');
        g.addColorStop(1, 'rgba(30,138,90,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        if (p.v) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.len); }
        else { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len, p.y); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(30,138,90,1)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.283); ctx.fill();
      });
    }
    function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(draw); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    for (var s = 0; s < 5; s++) spawn();
    hero.addEventListener('mousemove', function (e) { var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(size, 150); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.02 }).observe(hero);
    } else start();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    /* przechył planszy za kursorem */
    var board = hero.querySelector('.board');
    if (board && fine) {
      hero.addEventListener('mousemove', function (e) {
        var r = board.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        if (px < -0.9 || px > 0.9 || py < -0.9 || py > 0.9) { board.style.transform = ''; return; }
        board.style.transform = 'perspective(1200px) rotateY(' + (px * 5).toFixed(2) + 'deg) rotateX(' + (-py * 4).toFixed(2) + 'deg)';
      });
      hero.addEventListener('mouseleave', function () { board.style.transform = ''; });
    }
  }

  /* słowa na scrollu */
  var moc = document.querySelector('.moc');
  if (moc) {
    var big = moc.querySelector('p.big');
    var words = big.textContent.trim().split(/\s+/);
    big.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var ws = Array.prototype.slice.call(big.querySelectorAll('.w'));
    var bar = moc.querySelector('.bar i');
    function onScrollMoc() {
      var r = moc.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * ws.length);
      ws.forEach(function (w, i) { w.classList.toggle('on', i < n); w.classList.toggle('now', i === n - 1 && n < ws.length); });
      if (bar) bar.style.width = (p * 100) + '%';
    }
    if (reduce) ws.forEach(function (w) { w.classList.add('on'); });
    else { window.addEventListener('scroll', onScrollMoc, { passive: true }); onScrollMoc(); }
  }

  /* liczniki w maszynowni */
  var stats = document.querySelectorAll('.stats .n');
  function countUp(el) {
    var raw = el.getAttribute('data-n');
    var num = parseFloat(raw), suf = el.getAttribute('data-suf') || '';
    if (isNaN(num) || reduce) { el.innerHTML = '<b>' + raw + '</b>' + suf; return; }
    var t0 = null, dur = 1400;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.innerHTML = '<b>' + Math.round(num * e) + '</b>' + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (stats.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); sio.unobserve(e.target); } }); }, { threshold: 0.5 });
    stats.forEach(function (el) { sio.observe(el); });
  } else stats.forEach(countUp);

  /* cennik: światło pod kursorem */
  if (fine) {
    document.querySelectorAll('.price-grid .card, .price-wide').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* proces: rysowana linia */
  var steps = document.querySelector('.steps');
  if (steps && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { steps.classList.add('draw'); } }); }, { threshold: 0.4 }).observe(steps);
  } else if (steps) steps.classList.add('draw');

  /* kontakt: zegar Gdańsk i dostępność (dni robocze 9 do 17 wg oferty) */
  var clock = document.getElementById('clock'), avail = document.getElementById('avail');
  if (clock) {
    function tick() {
      var now = new Date();
      var f = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
      var parts = {}; f.formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
      clock.textContent = parts.hour + ':' + parts.minute;
      var wd = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' })).getDay();
      var hr = parseInt(parts.hour, 10);
      var open = wd >= 1 && wd <= 5 && hr >= 9 && hr < 17;
      if (avail) { avail.textContent = open ? 'odbieram' : 'poza godzinami, odpiszę'; avail.className = 'chip ' + (open ? 'ok' : ''); }
    }
    tick(); setInterval(tick, 30000);
  }
})();