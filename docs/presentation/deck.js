(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#stage');
  const slides = $$('.slide');
  const MAIN = slides.filter(s => !s.classList.contains('backup')).length;
  const TOTAL = 12 * 60;
  let idx = 0, step = 0, t0 = null, tick = null;

  const maxStep = s => parseInt(s.dataset.steps || '0', 10);

  /* ---------- scale 1920x1080 stage ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------- steps ---------- */
  function applySteps(s, n) {
    for (let k = 1; k <= 8; k++) s.classList.toggle('s' + k, n >= k);
    $$('.st', s).forEach(el => el.classList.toggle('on', parseInt(el.dataset.s || '0', 10) <= n));
    if (hooks[s.id]?.step) hooks[s.id].step(n);
  }

  /* ---------- navigation ---------- */
  const hooks = {};
  function go(i, fullSteps) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const prev = slides[idx];
    if (hooks[prev.id]?.leave) hooks[prev.id].leave();
    idx = i; step = fullSteps ? maxStep(slides[i]) : 0;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    applySteps(slides[i], step);
    history.replaceState(null, '', '#' + String(i + 1).padStart(2, '0'));
    document.body.dataset.scrim = slides[i].dataset.scrim || '0';
    const label = slides[i].classList.contains('backup') ? 'Backup' : String(i + 1).padStart(2, '0') + ' / ' + MAIN;
    $('#count').textContent = label;
    $('#progress i').style.width = (Math.min(i + 1, MAIN) / MAIN * 100) + '%';
    $('#notesText').textContent = $('.notes', slides[i])?.textContent || '';
    const t = slides[i].dataset.t;
    $('#slideT').textContent = t && t !== '0' ? 'about ' + t + ' s' : '';
    if (window.muser3d) window.muser3d.setSlide(i, slides[i].dataset.pose || 'cloud');
    if (slides[i].querySelector('.count')) countUp(slides[i]);
    if (hooks[slides[i].id]?.enter) hooks[slides[i].id].enter();
    if (i > 0 && t0 === null) startTimer();
  }
  function next() { const s = slides[idx]; if (step < maxStep(s)) { step++; applySteps(s, step); } else go(idx + 1); }
  function prev() { const s = slides[idx]; if (step > 0) { step--; applySteps(s, step); } else go(idx - 1, true); }

  /* ---------- overview (browse all slides) ---------- */
  const ov = $('#overview'), ovg = $('#ovg');
  slides.forEach((s, i) => {
    const t = ($('h2', s) || $('.logo', s) || {}).textContent || 'Slide ' + (i + 1);
    const c = document.createElement('button'); c.className = 'ovc' + (s.classList.contains('backup') ? ' bk' : '');
    c.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i><b>${t.replace(/\s+/g, ' ').trim()}</b>${s.classList.contains('backup') ? '<em>backup</em>' : ''}`;
    c.onclick = () => { toggleOverview(false); go(i); };
    ovg.appendChild(c);
  });
  function toggleOverview(force) {
    const open = force === undefined ? !ov.classList.contains('show') : force;
    ov.classList.toggle('show', open); $('#btnGrid').classList.toggle('on', open);
    if (open) $$('.ovc', ovg).forEach((c, k) => c.classList.toggle('cur', k === idx));
  }
  $('#btnGrid').onclick = () => toggleOverview();

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'g' || e.key === 'G') { toggleOverview(); return; }
    if (ov.classList.contains('show')) { if (e.key === 'Escape') toggleOverview(false); return; }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': go(0); break;
      case 'End': go(MAIN - 1); break;
      case 'n': case 'N': toggleNotes(); break;
      case 'm': case 'M': toggleMusic(); break;
      case 'f': case 'F': toggleFs(); break;
      case 'r': case 'R': resetTimer(); break;
    }
  });
  $('#zr').onclick = next; $('#zl').onclick = prev;
  let sx = null;
  addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) (dx < 0 ? next : prev)(); sx = null; });

  /* ---------- HUD ---------- */
  function toggleNotes() { $('#notesPanel').classList.toggle('show'); $('#btnNotes').classList.toggle('on'); }
  function toggleFs() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
  function toggleMusic() {
    if (!window.muser3d) return;
    const on = window.muser3d.toggleAudio();
    $('#btnMusic').classList.toggle('on', on);
  }
  $('#btnNotes').onclick = toggleNotes; $('#btnFs').onclick = toggleFs; $('#btnMusic').onclick = toggleMusic;

  function fmt(s) { return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
  function startTimer() { t0 = Date.now(); tick = setInterval(upd, 500); upd(); }
  function upd() { const s = (Date.now() - t0) / 1000; const el = $('#timer'); el.textContent = fmt(s); el.classList.toggle('over', s > TOTAL); }
  function resetTimer() { t0 = null; clearInterval(tick); $('#timer').textContent = '0:00'; $('#timer').classList.remove('over'); }

  /* ---------- count up ---------- */
  function countUp(s) {
    $$('.count', s).forEach(el => {
      const to = +el.dataset.to; const t = performance.now();
      const f = n => { const p = Math.min(1, (n - t) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
      el.textContent = 0; setTimeout(() => requestAnimationFrame(f), 500);
    });
  }

  /* ---------- 10: swipe demo ---------- */
  const songs = [
    ['The Less I Know the Better', 'Tame Impala', 'Psychedelic pop', '01'],
    ['bad guy', 'Billie Eilish', 'Pop', '02'],
    ['Blinding Lights', 'The Weeknd', 'Synth-pop', '03'],
    ['Levitating', 'Dua Lipa', 'Disco pop', '04'],
    ['Get Lucky', 'Daft Punk', 'Electronic', '05'],
    ['Do I Wanna Know?', 'Arctic Monkeys', 'Indie rock', '06'],
    ['HUMBLE.', 'Kendrick Lamar', 'Hip-hop', '07'],
    ['Pink + White', 'Frank Ocean', 'R&B', '08'],
    ['Weird Fishes', 'Radiohead', 'Art rock', '09'],
    ['Dreams', 'Fleetwood Mac', 'Soft rock', '10'],
    ['So What', 'Miles Davis', 'Jazz', '11'],
    ['Houdini', 'Dua Lipa', 'Pop', '12'],
  ];
  let si = 0, likedN = 0;
  function mkCard(k) {
    const [t, a, g, f] = songs[k % songs.length];
    const d = document.createElement('div'); d.className = 'sc';
    d.innerHTML = `<div class="cover" style="background:url(img/covers/${f}.jpg) center/cover #1b1b23"></div>
      <span class="gt">${g}</span><span class="ov l">LIKE</span><span class="ov s">SKIP</span>
      <div class="meta"><b>${t}</b><span>${a}</span></div>`;
    d.dataset.k = k; return d;
  }
  function renderDeck() {
    const deck = $('#deck'); deck.innerHTML = '';
    for (let j = 2; j >= 0; j--) {
      const c = mkCard(si + j); c.style.transform = `translateY(${j * 18}px) scale(${1 - j * .05})`;
      if (j) { c.style.opacity = 1 - j * .25; c.style.pointerEvents = 'none'; }
      deck.appendChild(c);
    }
    bindDrag(deck.lastElementChild);
  }
  function decide(card, dir) {
    if (!card || card.dataset.done) return;
    card.dataset.done = '1';
    card.classList.remove('drag');
    card.style.transform = `translate(${dir * 900}px,${-60}px) rotate(${dir * 28}deg)`; card.style.opacity = 0;
    if (dir > 0) {
      likedN++; $('#likeCount').textContent = likedN;
      const li = document.createElement('li'); const t = songs[+card.dataset.k % songs.length][0];
      li.innerHTML = `${t}<small>↗ shared</small>`; const ul = $('#likedList'); ul.prepend(li); while (ul.children.length > 3) ul.lastChild.remove();
    }
    si++; setTimeout(renderDeck, 330);
  }
  function bindDrag(card) {
    let x0 = 0, y0 = 0, down = false;
    card.addEventListener('pointerdown', e => { down = true; x0 = e.clientX; y0 = e.clientY; card.classList.add('drag'); card.setPointerCapture(e.pointerId); });
    card.addEventListener('pointermove', e => {
      if (!down) return; const sc = Math.min(innerWidth / 1920, innerHeight / 1080);
      const dx = (e.clientX - x0) / sc, dy = (e.clientY - y0) / sc;
      card.style.transform = `translate(${dx}px,${dy * .4}px) rotate(${dx / 18}deg)`;
      $('.ov.l', card).style.opacity = Math.max(0, Math.min(1, dx / 140));
      $('.ov.s', card).style.opacity = Math.max(0, Math.min(1, -dx / 140));
      card._dx = dx;
    });
    const end = () => {
      if (!down) return; down = false; const dx = card._dx || 0;
      if (dx > 130) decide(card, 1); else if (dx < -130) decide(card, -1);
      else { card.classList.remove('drag'); card.style.transform = ''; $$('.ov', card).forEach(o => o.style.opacity = 0); }
      card._dx = 0;
    };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }
  $('#bLike').onclick = () => decide($('#deck').lastElementChild, 1);
  $('#bSkip').onclick = () => decide($('#deck').lastElementChild, -1);
  renderDeck();

  /* ---------- 11: familiar bar ---------- */
  const modeDesc = { familiar: 'Close to your taste.', explore: 'Something new, still your vibe.', surprise: 'Step outside your usual.' };
  const R = { familiar: [95, 150, 205], explore: [190, 260, 150], surprise: [300, 250, 320] };
  function setMode(m) {
    $$('#seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
    $('#mdesc').textContent = modeDesc[m];
    const orb = $('#orbit'); orb.className = 'orbit m-' + m;
    const rad = R[m], ang = [-30, 100, 215];
    $$('.o', orb).forEach((o, k) => {
      const a = (ang[k] + (m === 'surprise' ? 40 : 0)) * Math.PI / 180;
      o.style.transform = `translate(${Math.cos(a) * rad[k]}px,${Math.sin(a) * rad[k]}px)`;
      o.style.background = m === 'explore' ? 'linear-gradient(135deg,#79dfc3,#b9a3ff)' : m === 'surprise' ? 'linear-gradient(135deg,#f2a7d5,#ff8a94)' : 'linear-gradient(135deg,#b9a3ff,#8fb8ff)';
    });
    if (window.muser3d) window.muser3d.setMode(m);
  }
  $$('#seg button').forEach(b => b.onclick = () => setMode(b.dataset.m));
  hooks.slFamiliar = { enter() { setMode('familiar'); }, leave() { if (window.muser3d) window.muser3d.setMode(null); } };

  /* ---------- 18: privacy epoch ---------- */
  let epoch = 1, on = true, dotsData = [];
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];
  function drawEpoch() {
    const box = $('#dots'); box.innerHTML = '';
    dotsData.forEach(d => { const e = document.createElement('div'); const old = d.ep !== epoch || !on; e.className = 'dt' + (old ? ' old' : '') + (!old && d.ep > 1 ? ' e2c' : ''); e.textContent = d.n; box.appendChild(e); });
    const vis = dotsData.filter(d => on && d.ep === epoch).length;
    $('#epCount').textContent = vis; $('#epCount').classList.toggle('zero', vis === 0);
    $('#epTag').textContent = 'epoch ' + epoch; $('#epLabel').textContent = on ? 'Sharing ON' : 'Sharing OFF';
    $('#epSw').classList.toggle('on', on);
  }
  function resetEpoch() { epoch = 1; on = true; dotsData = names.map(n => ({ n, ep: 1 })); drawEpoch(); }
  $('#epSw').onclick = () => {
    if (on) { on = false; epoch++; }
    else { on = true; dotsData.push({ n: 'G', ep: epoch }, { n: 'H', ep: epoch }); }
    drawEpoch();
  };
  hooks.slEpoch = { enter: resetEpoch };
  resetEpoch();

  /* ---------- 12: friends share, heart burst ---------- */
  function heartBurst(host) {
    for (let i = 0; i < 18; i++) {
      const h = document.createElement('span'); h.className = 'hrt'; h.textContent = i % 3 ? '♥' : '♪';
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
      h.style.setProperty('--dx', Math.cos(a) * d + 'px'); h.style.setProperty('--dy', (Math.sin(a) * d - 80) + 'px');
      h.style.fontSize = 30 + Math.random() * 40 + 'px'; h.style.animationDelay = Math.random() * 0.15 + 's';
      host.appendChild(h); setTimeout(() => h.remove(), 1500);
    }
  }
  function sendHeart() { heartBurst($('#slFriends .mine')); $('#sent').classList.add('show'); }
  $('#fHeart').onclick = sendHeart;
  $('#fSave').onclick = () => { const b = $('#fSave'); b.textContent = 'Saved ✓'; setTimeout(() => b.textContent = 'Save', 1600); };
  hooks.slFriends = {
    enter() { $('#sent').classList.remove('show'); },
    step(n) { if (n >= 3) setTimeout(sendHeart, 600); else $('#sent').classList.remove('show'); },
  };

  /* ---------- 13: privacy switch effects ---------- */
  (() => {
    const slide = $('#slPrivacy'), sw = $('#pvSw'), fx = $('#fx'), ctx = fx.getContext('2d');
    const lock = $('#lock'), lw = $('#lockwrap'), vault = $('#vault'), pstate = $('#pstate'), pcap = $('#pcap');
    const frds = $$('#friends .frd');
    let on = false, parts = [], raf = 0, last = 0;
    const pos = el => {
      const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = s.width / 1920;
      return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
    };
    const COLS = ['#B9A3FF', '#79DFC3', '#F2A7D5', '#FFD38A', '#8FB8FF'], GL = ['♪', '♫', '♥', '★'];
    function flow(from, to, n, dissolve) {
      for (let i = 0; i < n; i++) {
        parts.push({
          kind: 'flow', x0: from.x, y0: from.y, x1: to.x, y1: to.y,
          cx: (from.x + to.x) / 2 + (Math.random() - .5) * 260, cy: (from.y + to.y) / 2 - 120 - Math.random() * 160,
          t: -Math.random() * .7, life: 1.1 + Math.random() * .5, g: GL[i % 4], c: dissolve ? '#8a8699' : COLS[i % 5], s: 30 + Math.random() * 28, dissolve
        });
      }
      kick();
    }
    function confetti(o, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 300 + Math.random() * 700;
        parts.push({ kind: 'conf', x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, t: 0, life: 1.3 + Math.random() * .6, g: GL[i % 4], c: COLS[i % 5], s: 24 + Math.random() * 30 });
      }
      kick();
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function tick(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, 1920, 1080); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      parts = parts.filter(p => {
        p.t += dt / p.life; if (p.t >= 1) return false; if (p.t < 0) return true;
        let x, y, al;
        if (p.kind === 'flow') {
          const t = p.t, u = 1 - t;
          x = u * u * p.x0 + 2 * u * t * p.cx + t * t * p.x1; y = u * u * p.y0 + 2 * u * t * p.cy + t * t * p.y1;
          al = p.dissolve ? 1 - t : Math.min(1, t * 6) * (t > .85 ? (1 - t) / .15 : 1);
        } else { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; x = p.x; y = p.y; al = 1 - p.t; }
        ctx.globalAlpha = Math.max(0, al); ctx.fillStyle = p.c; ctx.font = `${p.s}px sans-serif`; ctx.fillText(p.g, x, y);
        return true;
      });
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, 1920, 1080); }
    }
    function shatter() {
      for (let i = 0; i < 16; i++) {
        const s = document.createElement('i'); s.className = 'shard'; const a = Math.random() * 6.28, d = 140 + Math.random() * 260;
        s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); s.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
        s.style.background = COLS[i % 5]; lw.appendChild(s); setTimeout(() => s.remove(), 1000);
      }
      for (let i = 0; i < 3; i++) setTimeout(() => { const r = document.createElement('i'); r.className = 'ring'; lw.appendChild(r); setTimeout(() => r.remove(), 1500); }, i * 260);
    }
    function setText(p, c) { pstate.textContent = p; pstate.classList.toggle('warn', c); }
    function reset() {
      on = false; sw.classList.remove('on'); lw.classList.remove('broken', 'slam'); vault.classList.remove('leak');
      frds.forEach(f => f.classList.remove('seen')); setText('Private', false); pcap.textContent = 'Off by default. Nobody sees your likes.';
      parts = []; ctx.clearRect(0, 0, 1920, 1080);
    }
    sw.onclick = () => {
      on = !on; sw.classList.toggle('on', on);
      if (on) {
        lock.classList.add('crack');
        setTimeout(() => {
          lock.classList.remove('crack'); lw.classList.add('broken'); lw.classList.remove('slam'); shatter();
          const c = pos(lw); confetti(c, 70); vault.classList.add('leak');
          slide.classList.remove('flash'); void slide.offsetWidth; slide.classList.add('flash');
          const v = pos(vault); frds.forEach((f, i) => { const t = pos($('.av', f)); flow(v, t, 16, false); setTimeout(() => f.classList.add('seen'), 700 + i * 260); });
          setText('Not private anymore', true); pcap.textContent = 'Friends can now see every new like.';
          if (window.muser3d) { window.muser3d.setMode('surprise'); setTimeout(() => window.muser3d.setMode(null), 2600); }
        }, 320);
      } else {
        lw.classList.remove('broken'); lw.classList.remove('slam'); void lw.offsetWidth; lw.classList.add('slam'); vault.classList.remove('leak');
        const v = pos(vault); frds.forEach(f => { const t = pos($('.av', f)); flow(t, v, 10, true); f.classList.remove('seen'); });
        setText('Private', false); pcap.textContent = 'Switched off. Every past share vanished at once.';
        if (window.muser3d) { window.muser3d.setMode('familiar'); setTimeout(() => window.muser3d.setMode(null), 1600); }
      }
    };
    hooks.slPrivacy = { enter: reset, leave: reset };
  })();

  /* ---------- hook slide: waveform ---------- */
  (() => {
    const w = $('#wave'); if (!w) return;
    for (let i = 0; i < 90; i++) {
      const hook = i >= 55 && i < 78, h = hook ? 55 + Math.abs(Math.sin(i * 1.7)) * 45 : 12 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.3)) * 38;
      const b = document.createElement('s'); b.style.height = h + '%'; if (hook) b.className = 'hot'; w.insertBefore(b, $('.zone', w));
    }
  })();

  /* ---------- go ---------- */
  window.deck = { go, next, prev };
  const h = parseInt(location.hash.replace('#', ''), 10);
  go(Number.isFinite(h) && h >= 1 ? h - 1 : 0);
})();
