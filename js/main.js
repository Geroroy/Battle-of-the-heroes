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

  // ----- 배경음악 -----
  const syncBgm = () => {
    $('#bgm-source').textContent = Bgm.source;
    $('#bgm-clear').hidden = !Bgm.hasFile;
  };
  Bgm.init(syncBgm);
  $('#bgm-file').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) { Sfx.init(); Bgm.setFile(f); }
    e.target.value = '';
  });
  $('#bgm-clear').addEventListener('click', () => Bgm.clearFile());

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
    Bgm.stop();
    $('.diff').classList.toggle('hidden', mode !== '1p');
    renderPick(0); renderPick(1); renderDiff();
    show('#screen-select');
  }

  function startMatch() {
    Sfx.init();
    game.start({ mode, p1: { ...sel.p[0] }, p2: { ...sel.p[1] }, level: sel.level });
    Bgm.start(); // 스테이지 시작 시 BGM
    show(null);
  }
  $('#btn-fight').addEventListener('click', startMatch);
  $('#btn-back').addEventListener('click', () => show('#screen-title'));

  // ----- 일시정지 / 결과 -----
  $('#btn-pause').addEventListener('click', (e) => {
    e.stopPropagation();
    game.paused = true; Sfx.stopHum(); Bgm.pause();
    show('#screen-pause');
  });
  $('#btn-resume').addEventListener('click', () => {
    game.paused = false;
    Bgm.resume();
    if (game.state === 'fight' || game.state === 'countdown') Sfx.startHum();
    show(null);
  });
  const toMenu = () => { game.stop(); Bgm.stop(); show('#screen-title'); };
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

  // ----- 입력 (가상 조이스틱 / 키보드 / 마우스) -----
  Input.attach(game.canvas, () => game.running && !game.paused && game.state !== 'matchEnd');
  game.canvas.addEventListener('pointerdown', () => Sfx.init());
  window.addEventListener('keydown', (e) => {
    if (!game.running) return;
    if (e.code === 'Escape' && !e.repeat) { if (!game.paused) $('#btn-pause').click(); return; }
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    Sfx.init();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.running && !game.paused && game.state !== 'matchEnd') $('#btn-pause').click();
  });

  // ----- 선택 화면 미리보기: 실제 래그돌을 제자리에서 움직여 보여줌 -----
  const stubGame = {
    opponentOf: () => null, onLava() {},
    effects: { dust() {}, ember() {}, smoke() {}, spark() {} },
  };
  const pv = [0, 1].map(() => {
    const c = document.createElement('canvas');
    c.width = 130; c.height = 170;
    return { c, g: c.getContext('2d'), f: null, key: '' };
  });
  function drawPreview(side, el) {
    const v = pv[side], p = sel.p[side], key = p.char + p.skin;
    if (v.key !== key) {
      v.key = key;
      v.f = new Fighter(side, p.char, p.skin);
      v.f.bladeOn = true;
      v.t = 0;
    }
    const f = v.f;
    v.t++;
    // 가끔 시범 베기
    const ph = (v.t + side * 90) % 200;
    const swing = ph > 150 && ph < 175;
    const a = ph <= 160 ? -Math.PI / 2 - f.facing * 0.8 : f.facing > 0 ? 0.7 : Math.PI - 0.7;
    f.update(stubGame, { mx: 0, my: 0, ax: Math.cos(a), ay: Math.sin(a), aiming: ph > 140 && ph < 180 || swing });
    const g = v.g, x0 = f.bodyX;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, 130, 170);
    g.imageSmoothingEnabled = false;
    g.setTransform(0.5, 0, 0, 0.5, Math.round((130 - x0) / 2), Math.round((330 - CFG.PLAT.top) / 2));
    g.fillStyle = '#140d0b'; g.fillRect(x0 - 70, CFG.PLAT.top, 140, 8);
    g.fillStyle = '#5a535b'; g.fillRect(x0 - 70, CFG.PLAT.top, 140, 2);
    f.draw(g);
    const c = $('.preview', el), ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(v.c, 0, 0, c.width, c.height);
  }

  // ----- 메인 루프 -----
  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    game.tick(dt);
    if (!$('#screen-select').classList.contains('hidden')) picks.forEach((el, side) => drawPreview(side, el));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
