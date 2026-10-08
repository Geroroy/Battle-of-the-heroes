// 메뉴, 캐릭터/스킨 선택, 입력 처리
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const CHAR_IDS = Object.keys(Skins.CHARACTERS);

  const game = new Game($('#game'));
  let mode = '1p';
  let sel = { p: [{ char: 'anakin', skin: 0 }, { char: 'obiwan', skin: 0 }], level: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem('saberduel.sel'));
    if (saved && saved.p && saved.p.length === 2 && saved.p.every((p) => Skins.CHARACTERS[p.char] && p.skin >= 0 && p.skin < 3)) sel = saved;
  } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem('saberduel.sel', JSON.stringify(sel)); } catch (e) { /* ignore */ } };

  const screens = ['#screen-title', '#screen-select', '#screen-pause', '#screen-result'];
  function show(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    $('#hud').classList.toggle('hidden', !game.running || id === '#screen-result');
  }

  // ----- 타이틀 -----
  $$('#screen-title [data-mode]').forEach((b) => b.addEventListener('click', () => {
    Sfx.init();
    mode = b.dataset.mode;
    openSelect();
  }));
  const muteBtn = $('#btn-mute');
  const syncMute = () => { muteBtn.textContent = Sfx.muted ? '🔇' : '🔊'; };
  syncMute();
  muteBtn.addEventListener('click', () => { Sfx.init(); Sfx.toggleMute(); syncMute(); });

  // ----- 선택 화면 -----
  const picks = $$('.pick');
  function renderPick(side) {
    const el = picks[side], p = sel.p[side], data = Skins.CHARACTERS[p.char];
    $('.pick-head', el).textContent = side === 1 && mode === '1p' ? 'CPU' : `PLAYER ${side + 1}`;
    $('.char-name', el).textContent = data.name;
    const box = $('.skins', el);
    box.innerHTML = '';
    data.skins.forEach((s, i) => {
      const b = document.createElement('button');
      b.textContent = s.name;
      b.className = i === p.skin ? 'on' : '';
      b.addEventListener('click', () => { p.skin = i; save(); renderPick(side); });
      box.appendChild(b);
    });
    $('.skin-sub', el).textContent = data.skins[p.skin].sub;
  }
  picks.forEach((el, side) => {
    const cycle = (d) => {
      const p = sel.p[side];
      p.char = CHAR_IDS[(CHAR_IDS.indexOf(p.char) + d + CHAR_IDS.length) % CHAR_IDS.length];
      save(); renderPick(side);
    };
    $('.prev', el).addEventListener('click', () => cycle(-1));
    $('.next', el).addEventListener('click', () => cycle(1));
  });
  function renderDiff() {
    $$('.diff-btns button').forEach((b) => b.classList.toggle('on', +b.dataset.level === sel.level));
  }
  $$('.diff-btns button').forEach((b) => b.addEventListener('click', () => { sel.level = +b.dataset.level; save(); renderDiff(); }));

  function openSelect() {
    game.stop();
    $('.diff').classList.toggle('hidden', mode !== '1p');
    renderPick(0); renderPick(1); renderDiff();
    show('#screen-select');
  }

  function startMatch() {
    Sfx.init();
    game.start({ mode, p1: { ...sel.p[0] }, p2: { ...sel.p[1] }, level: sel.level });
    show(null);
  }
  $('#btn-fight').addEventListener('click', startMatch);
  $('#btn-back').addEventListener('click', () => show('#screen-title'));

  // ----- 일시정지 / 결과 -----
  $('#btn-pause').addEventListener('click', (e) => {
    e.stopPropagation();
    game.paused = true; Sfx.stopHum();
    show('#screen-pause');
  });
  $('#btn-resume').addEventListener('click', () => {
    game.paused = false;
    if (game.state === 'fight' || game.state === 'countdown') Sfx.startHum();
    show(null);
  });
  const toMenu = () => { game.stop(); show('#screen-title'); };
  $('#btn-quit').addEventListener('click', toMenu);
  $('#btn-menu').addEventListener('click', toMenu);
  $('#btn-rematch').addEventListener('click', startMatch);
  $('#btn-reselect').addEventListener('click', openSelect);

  game.onMatchEnd = (w) => {
    const f = game.f[w];
    const who = mode === '1p' ? (w === 0 ? '승리!' : '패배...') : `PLAYER ${w + 1} 승리!`;
    $('#result-title').textContent = who;
    const n2 = mode === '1p' ? 'CPU' : 'P2';
    $('#result-score').textContent = `P1 ${game.f[0].data.short}  ${game.score[0]} : ${game.score[1]}  ${game.f[1].data.short} ${n2}`;
    $('#result-quote').textContent = f.data.winQuote;
    show('#screen-result');
  };

  // ----- 입력 -----
  game.canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    Sfx.init();
    if (!game.running) return;
    const side = mode === '1p' ? 0 : e.clientX < window.innerWidth / 2 ? 0 : 1;
    game.input(side);
  });
  window.addEventListener('keydown', (e) => {
    if (e.repeat || !game.running) return;
    if (e.code === 'Escape') { if (!game.paused) $('#btn-pause').click(); return; }
    const p1 = ['KeyA', 'KeyF', 'Space'], p2 = ['KeyL', 'KeyJ', 'Enter'];
    if (mode === '1p') { if (p1.includes(e.code) || p2.includes(e.code)) { e.preventDefault(); game.input(0); } }
    else if (p1.includes(e.code)) { e.preventDefault(); game.input(0); }
    else if (p2.includes(e.code)) { e.preventDefault(); game.input(1); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.running && !game.paused && game.state !== 'matchEnd') $('#btn-pause').click();
  });

  // ----- 메인 루프 -----
  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    game.tick(dt);
    if (!$('#screen-select').classList.contains('hidden')) {
      picks.forEach((el, side) => {
        const c = $('.preview', el), ctx = c.getContext('2d');
        const p = sel.p[side];
        ctx.save();
        if (side === 1) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
        Skins.drawPreview(ctx, p.char, p.skin, now / 1000 + side, c.width, c.height);
        ctx.restore();
      });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
