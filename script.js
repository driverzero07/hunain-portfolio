(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Sticky nav background */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const burger = $('#burger');
  const links = $('#navLinks');
  burger.addEventListener('click', () => links.classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* Hero title — always fits the full width, never clipped */
  const heroTitle = $('.hero-title');
  const fitHeroTitle = () => {
    if (!heroTitle) return;
    const hero = heroTitle.closest('.hero');
    const cs = getComputedStyle(hero);
    const avail = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (avail <= 0) return;
    heroTitle.style.fontSize = '';                       // measure from the CSS baseline
    const base = parseFloat(getComputedStyle(heroTitle).fontSize);
    const range = document.createRange();
    range.selectNodeContents(heroTitle);
    const w = range.getBoundingClientRect().width;
    if (!w || !base) return;
    const ratio = w / base;                              // width of "CRAFTING DIGITAL" per 1px of font-size
    heroTitle.style.fontSize = Math.max(20, Math.min(avail * 0.98 / ratio, 190)) + 'px';
  };
  fitHeroTitle();
  window.addEventListener('load', fitHeroTitle);
  document.fonts && document.fonts.ready.then(fitHeroTitle);
  new ResizeObserver(fitHeroTitle).observe(heroTitle.parentElement);

  /* Reveal on scroll */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  const observeReveals = () => $$('.reveal:not(.in)').forEach(el => revealObs.observe(el));
  observeReveals();

  /* Count-up numbers */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      countObs.unobserve(el);
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const pad = parseInt(el.dataset.pad || '0', 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        let val = (target * eased).toFixed(decimals);
        if (pad) val = val.padStart(pad, '0');
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObs.observe(el));

  /* Load more projects */
  const loadMore = $('#loadMore');
  loadMore.addEventListener('click', () => {
    $$('.project.extra').forEach(card => { card.hidden = false; });
    observeReveals();
    loadMore.style.display = 'none';
  });

  /* CV button (placeholder) */
  $('#cvBtn').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Add your CV file link here (e.g. href="cv.pdf" download).');
  });

  /* Contact form validation + fake submit */
  const form = $('#contactForm');
  const msg = $('#formMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('input, textarea', form).forEach(f => {
      const valid = f.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim())
        : f.value.trim().length > 0;
      f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    msg.classList.toggle('error', !ok);
    if (!ok) {
      msg.textContent = 'Please fill in all fields with a valid email.';
      return;
    }
    msg.textContent = 'Thanks! Your message has been sent.';
    form.reset();
    setTimeout(() => (msg.textContent = ''), 4000);
  });
  $$('input, textarea', form).forEach(f =>
    f.addEventListener('input', () => f.classList.remove('invalid'))
  );

  /* Process line — flows from Define → Design → Build → Deliver */
  const proc = $('.process');
  const strSvg = proc ? $('.string', proc) : null;
  const strPath = strSvg ? $('path', strSvg) : null;

  const drawProcessLine = () => {
    if (!proc || !strPath || getComputedStyle(strSvg).display === 'none') return;
    const w = proc.clientWidth;
    const h = proc.clientHeight;

    /* Pin centres, ordered 01 (Define) → 04 (Deliver) */
    const pts = $$('.hang', proc)
      .map(el => ({ n: parseInt((el.className.match(/\bc(\d+)\b/) || [])[1] || 0, 10), el }))
      .sort((a, b) => a.n - b.n)
      .map(({ el }) => {
        const pin = $('.pin', el);
        return [
          el.offsetLeft + pin.offsetLeft + pin.offsetWidth / 2,
          el.offsetTop + pin.offsetTop + pin.offsetHeight / 2
        ];
      });
    if (pts.length < 2) return;

    const r = n => +n.toFixed(1);
    /* Catmull-Rom → cubic Bézier so the string sweeps smoothly through every card */
    let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${r(c1[0])} ${r(c1[1])}, ${r(c2[0])} ${r(c2[1])}, ${r(p2[0])} ${r(p2[1])}`;
    }

    strSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    strPath.setAttribute('d', d);
  };

  drawProcessLine();
  window.addEventListener('load', drawProcessLine);
  let lineRaf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(lineRaf);
    lineRaf = requestAnimationFrame(drawProcessLine);
  }).observe(proc);

  /* Copy email */
  const copyBtn = $('#copyMail');
  copyBtn.addEventListener('click', async () => {
    const email = 'ahmedhunain913@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
      const icon = $('span', copyBtn);
      icon.textContent = '✓';
      setTimeout(() => (icon.textContent = '⧉'), 1500);
    } catch {
      window.location.href = 'mailto:' + email;
    }
  });
})();
