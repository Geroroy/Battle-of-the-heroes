// 캐릭터 & 스킨 정의 + 픽셀 아트 스프라이트
// 스프라이트 1픽셀 = 게임 논리좌표 2유닛 = 저해상도 버퍼 1픽셀
// 로컬 픽셀 좌표: 원점 = 골반, 오른쪽을 바라봄, 발바닥 y≈19, 머리 중심 y≈-21
(function () {
  const K = '#120a08';

  // ---------- 팔레트 ----------
  const FACE = { s: '#f0c09a', S: '#c98e6a', e: '#0d0806', m: '#8a3f33', x: '#c4705a', w: '#f6e8dc' };

  const PAL_A = { // 아나킨 (시스의 복수)
    ...FACE,
    h: '#5e3d22', H: '#3b2413', i: '#86603c',
    u: '#140e0b', t: '#2d2018', T: '#1c140f', b: '#45301f', B: '#2f2014',
    l: '#0f0b09', L: '#8a8d95', p: '#241a13', P: '#16100b', o: '#110d0b', Q: '#080605', O: '#2c2621',
    g: '#18181b', G: '#34343a', r: '#3f2b1d', R: '#291b11',
  };
  const PAL_A_ARMOR = { // 아나킨 (클론 전쟁 마이크로시리즈 갑옷)
    ...FACE,
    h: '#7a5530', H: '#523519', i: '#a07848',
    a: '#4f5258', A: '#787c84', n: '#303236', // 짙은 회색 흉갑 & 어깨 보호대
    v: '#3c281a', V: '#2a1b11',               // 짙은 갈색 V컷 조끼 & 망토
    u: '#5a3d2a', t: '#73503a', T: '#56392a', // 모카 브라운 튜닉
    l: '#4f5258', L: '#7a7e86',               // 짙은 회색 클론 벨트
    p: '#3a2617', P: '#281a0f', o: '#3a2617', Q: '#271910', O: '#56392a',
    g: '#2a1b11', G: '#3c281a', r: '#3c281a', R: '#2a1b11',
  };
  const PAL_O = { // 오비완 (시스의 복수)
    ...FACE,
    h: '#b0702f', H: '#7e4c1f', i: '#d29150',
    u: '#f1e6cf', t: '#dcc8a0', T: '#b9a07a', b: '#c3a77b', B: '#9f855c',
    l: '#6a4527', L: '#c2ab82', p: '#cdb791', P: '#a9946f', o: '#3b2a1b', Q: '#271b11', O: '#5a422c',
    g: '#f0c09a', G: '#c98e6a', r: '#5c3f27', R: '#3f2a19',
  };
  const PAL_O_ARMOR = { // 오비완 (클론 전쟁 클론 아머)
    ...PAL_O,
    a: '#ececE6', A: '#ffffff', n: '#9ba1a9',
  };

  // ---------- 스프라이트 격자 ----------
  // k 외곽선, s/S 피부, e 눈, m 입, x 흉터, h/H/i 머리카락, u 속튜닉, t/T 튜닉, b/B 타바드,
  // l/L 벨트, p/P 바지, o/Q/O 부츠, a/A/n 갑옷, v/V 조끼, r/R 로브

  const HEADS = {
    long: [ // 아나킨 시스의 복수: 귀를 덮는 어깨 길이 웨이브 머리
      '......kkkkkk......',
      '....kkhhhhhhkk....',
      '...khhiihhhhhhk...',
      '..khhiihhhhhhhhk..',
      '.khhhhhhhhhhhhhhk.',
      '.khhhhhhhhhhhhhhhk',
      'khhHhhhhhhhhhhhhhk',
      'khHHhhhhhhhhhsshk.',
      'khHHhhhhSsssHHssk.',
      'khHHhhhhSssswesk..',
      'khHHhhhhSssswessk.',
      'khHHhhhkSsssssssk.',
      'kHHHhhk.kSsssmsk..',
      'kHHHhhk..kSsssk...',
      '.kHHhk...kkSSkk...',
      '..kHk....kSSSk....',
      '...k.....kSSSk....',
    ],
    short: [ // 아나킨 클론 전쟁: 짧은 머리
      '..................',
      '......kkkkkk......',
      '....kkhhhhhhkk....',
      '...khhiihhhhhhk...',
      '..khhiihhhhhhhhk..',
      '..khhhhhhhhhhhhhk.',
      '.khhhhhhhhhhhhhhk.',
      '.khhHhhhhhhhhhssk.',
      '.khHHhhSsssssHHsk.',
      '.khHSShSssssswesk.',
      '.kHHSShSssssswessk',
      '..kHkSSsssssssssk.',
      '...kSssssssssmmsk.',
      '....kSSssssssssk..',
      '.....kkSSSSSSkk...',
      '.......kSSSSk.....',
      '.......kSSSSk.....',
    ],
    obi: [ // 오비완 시스의 복수: 뒤로 넘긴 머리
      '..................',
      '.....kkkkkkk......',
      '...kkhhhhhhhkk....',
      '..khhiiiihhhhhk...',
      '.khhhhhiihhhhhhk..',
      '.khhhhhhhhhhhhhhk.',
      'khhhhhhhhhhhhhhhk.',
      'khhHhhhhhhhhhhssk.',
      'khHHhhhSsssssHHsk.',
      'khHHSShSssssswesk.',
      'kHHHSShSssssswessk',
      '.kHHkSSsssssssssk.',
      '..kkkSssssssssmsk.',
      '....kSSssssssssk..',
      '.....kkSSSSSSkk...',
      '.......kSSSSk.....',
      '.......kSSSSk.....',
    ],
    obiShort: [ // 오비완 클론 전쟁: 짧게 정돈한 머리
      '..................',
      '......kkkkkk......',
      '....kkhhhhhhkk....',
      '...khhhiiihhhhk...',
      '..khhhhhhiihhhhk..',
      '..khhhhhhhhhhhhhk.',
      '.khhhhhhhhhhhhhhk.',
      '.khhHhhhhhhhhhssk.',
      '.khHHhhSsssssHHsk.',
      '.khHSShSssssswesk.',
      '.kHHSShSssssswessk',
      '..kHkSSsssssssssk.',
      '...kSssssssssmmsk.',
      '....kSSssssssssk..',
      '.....kkSSSSSSkk...',
      '.......kSSSSk.....',
      '.......kSSSSk.....',
    ],
    hood: [ // 제다이 후드
      '.....kkkkkkkk.....',
      '...kkRRrrrrrRkk...',
      '..kRrrrrrrrrrrRk..',
      '.kRrrrrrrrrrrrrRk.',
      '.kRrrrrrrrrrrrrrRk',
      'kRrrrrrrRRRRRRRrRk',
      'kRrrrrrRkhhhhhhkRk',
      'kRrrrrrRhhsssshhkk',
      'kRrrrrrRSsssHHssk.',
      'kRrrrrrRSssswesk..',
      'kRrrrrrRSssswessk.',
      'kRrrrrrRSsssssssk.',
      'kRrrrrrRkSsssmsk..',
      '.kRrrrrrRkSssssk..',
      '.kRRrrrrrRkkkkk...',
      '..kRRrrrrrRk......',
      '...kkRRRRRk.......',
    ],
  };
  // 오비완 수염 (머리 위에 덧그림)
  const BEARD = [
    '', '', '', '', '', '', '', '', '',
    '........H.........',
    '........Hh........',
    '........Hhh.Hhhhk.',
    '........HhhhhmHhk.',
    '.........kHhhhhhk.',
    '..........kkkkkk..',
  ];
  const BEARD_HOOD = BEARD;
  const SCAR = ['', '', '', '', '', '', '', '', '..............x...', '', '', '..............x...'];

  const T_JEDI = [
    '...kkkkkkkkkk...',
    '..kTTbbuubbttk..',
    '.kTTtbbuubbtttk.',
    '.kTTtbbuubbtttk.',
    '.kTTtbbtubbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbBtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtTtk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbBtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kllllllllllllk.',
    '.klLlllLLlllLlk.',
    '.kllllllllllllk.',
    '.kTTtbbtTbbtttk.',
    'kTTttbbtTbbttttk',
    'kTTttbbtTbbttttk',
    'kTTttbBtTbbtTttk',
    'kTTttbbtTbbttttk',
    'kTTttbbtTbbttttk',
    'kkkkkkkkkkkkkkkk',
  ];

  const T_ARMOR_A = [ // 아나킨: 짙은 회색 흉갑 + 짙은 갈색 V컷 조끼(무릎길이) + 모카 튜닉 + 회색 클론 벨트
    '..kkkkkkkkkkkk..',
    '.knaaaAAAaaaak..',
    '.knaAAaaaaaaank.',
    '.knaaaaaanaaank.',
    '.knaaaaaanaaank.',
    '.knaaaaaanaaank.',
    '.knnaaaaanaaank.',
    '.kvnnnnnnnnnnvk.',
    '.kvVnaaanaaanvk.',
    '.kvVnnnnnnnnnvk.',
    '.kvVvtttTtttvvk.',
    '.kvVvvttTttvvvk.',
    '.kvVvvttTttvvvk.',
    '.kvVvvvtTtvvvvk.',
    '.kvVvvvtTtvvvvk.',
    '.kvVvvvtTtvvvvk.',
    '.kvVvvvtTtvvvvk.',
    '.kllllllllllllk.',
    '.klLLlLLlLLlLlk.',
    '.kllllllllllllk.',
    '.kvVvvvtTtvvvvk.',
    'kvVvvvvtTtvvvvvk',
    'kvVvvvvtTtvvvvvk',
    'kvVvvvvtTtvvvvvk',
    'kvVvvvvttttvvvvk',
    'kvVvvvvttttvvvvk',
    'kvVvvvkkkkkkvvvk',
    'kvVvvk......kvvk',
    'kvVvk.......kvvk',
    'kVvk.........kvk',
    'kkk..........kk.',
  ];

  const T_ARMOR_O = [ // 오비완: 흰색 클론 흉갑 + 베이지 튜닉
    '..kkkkkkkkkkkk..',
    '.kaaaAAAaaaank..',
    '.kaAAaaaaaaaank.',
    '.kaaaaaaanaaank.',
    '.kaaaaaaanaaank.',
    '.kaaaaaaanaaank.',
    '.knaaaaaanaaank.',
    '.knnnnnnnnnnnnk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbBtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kTTtbbtTbbtttk.',
    '.kllllllllllllk.',
    '.klLlllLLlllLlk.',
    '.kllllllllllllk.',
    '.kTTtbbtTbbtttk.',
    'kTTttbbtTbbttttk',
    'kTTttbbtTbbttttk',
    'kTTttbBtTbbtTttk',
    'kTTttbbtTbbttttk',
    'kTTttbbtTbbttttk',
    'kkkkkkkkkkkkkkkk',
  ];

  // 로브 앞자락 (후드 스킨) — 튜닉 위 양쪽 가장자리
  const ROBE_FRONT = [
    '.kkk.......kkk..',
    'kRrk.......krrk.',
  ];
  for (let i = 0; i < 28; i++) ROBE_FRONT.push(i < 27 ? 'kRrrk.....krrrk.' : 'kkkkk.....kkkkk.');

  const LEGS = [
    '..kkkkkkkkkk....',
    '..kPPPkkpppk....',
    '..kPPPkkpppk....',
    '..kPPPkkpppk....',
    '..kPPPkkpppk....',
    '..kPPPkkpppk....',
    '..kPPPkkpppk....',
    '..kPPPkkpppk....',
    '..kQQQkkoook....',
    '..kQQQkkoOok....',
    '..kQQQkkoOok....',
    '..kQQQkkoook....',
    '..kQQQkkoook....',
    '..kQQQkkoook....',
    '..kQQQQkooook...',
    '..kQQQQkoooookk.',
    '..kQQQQQkooooook',
    '..kkkkkkkkkkkkkk',
  ];
  const LEGS_TUCK = [
    '..kkkkkkkkkk....',
    '..kPPPPkppppk...',
    '...kPPPPkppppk..',
    '....kPPPPkppppk.',
    '.....kPPPkkpppk.',
    '....kQQQk.kook..',
    '...kQQQk..kook..',
    '..kQQQk..kooook.',
    '..kQQQQk.koooook',
    '..kkkkkk.kkkkkkk',
  ];
  const SHIN = [ // 오비완 클론 아머 정강이 보호대
    '', '', '', '', '', '', '',
    '..kkkkkkkkkk....',
    '..knnnkkaAak....',
    '..knnnkkaAak....',
    '..knnnkkaaak....',
    '..knnnkkaaak....',
    '..kkkkkkkkkk....',
  ];
  const PAULDRON = [
    '.kkkkk.',
    'kaAAAak',
    'kaaaaak',
    'knnnnnk',
    '.kkkkk.',
  ];

  function cloakRows(len) { // 망토/로브 뒷자락 (몸 뒤)
    const rows = [];
    for (let y = 0; y < len; y++) {
      const spread = Math.floor(y / 6);
      const w = 15 + spread * 2;
      const left = 3 - spread;
      let r = ' '.repeat(Math.max(0, left));
      if (y === len - 1) r += 'k'.repeat(w);
      else r += 'k' + 'R'.repeat(Math.floor((w - 2) / 2)) + 'r'.repeat(Math.ceil((w - 2) / 2)) + 'k';
      rows.push(r);
    }
    return rows;
  }

  // ---------- 캐릭터 정의 ----------
  const CHARACTERS = {
    anakin: {
      id: 'anakin',
      name: '아나킨 스카이워커',
      short: 'ANAKIN',
      blade: '#3b8cff',
      hilt: 'anakin',
      winQuote: '"이제는 내가 마스터다."',
      skins: [
        { name: '제다이 복장', sub: '시스의 복수 · 기본', head: 'long', torso: T_JEDI, pal: PAL_A, scar: true, frontHand: 'g' },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', head: 'hood', torso: T_JEDI, pal: PAL_A, robe: true, frontHand: 'g', sleeve: 'r' },
        {
          name: '클론 전쟁 갑옷', sub: '클론 전쟁 · 짧은 머리', head: 'short', torso: T_ARMOR_A, pal: PAL_A_ARMOR,
          cape: true, pauldron: true, frontHand: 'g', backHand: 'g', gauntlet: ['V', 'v'], slim: true,
        },
      ],
    },
    obiwan: {
      id: 'obiwan',
      name: '오비완 케노비',
      short: 'OBI-WAN',
      blade: '#3b8cff',
      hilt: 'obiwan',
      winQuote: '"끝났다, 아나킨. 내가 고지를 점했어!"',
      skins: [
        { name: '제다이 복장', sub: '시스의 복수 · 기본', head: 'obi', torso: T_JEDI, pal: PAL_O, beard: true },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', head: 'hood', torso: T_JEDI, pal: PAL_O, robe: true, beard: true, sleeve: 'r' },
        {
          name: '클론 전쟁 갑옷', sub: '클론 전쟁 · 클론 아머', head: 'obiShort', torso: T_ARMOR_O, pal: PAL_O_ARMOR,
          beard: true, pauldron: true, shin: true, gauntlet: ['n', 'a'],
        },
      ],
    },
  };

  // ---------- 격자 → 캔버스 ----------
  function gridCanvas(rows, pal) {
    const h = rows.length, w = Math.max(1, ...rows.map((r) => r.length));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch === '.' || ch === ' ') continue;
        const col = ch === 'k' ? K : pal[ch];
        if (!col) continue;
        g.fillStyle = col; g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // 스프라이트 캔버스: 48x76, 로컬 원점 (24, 44)
  const SW = 48, SH = 76, OX = 24, OY = 44;
  const partCache = {};

  function parts(ch, si) {
    const key = ch + si;
    if (partCache[key]) return partCache[key];
    const s = CHARACTERS[ch].skins[si], pal = s.pal;
    const headRows = HEADS[s.head].slice();
    const p = {
      head: gridCanvas(headRows, pal),
      beard: s.beard ? gridCanvas(BEARD_HOOD, pal) : null,
      scar: s.scar ? gridCanvas(SCAR, pal) : null,
      torso: gridCanvas(s.torso, pal),
      robe: s.robe ? gridCanvas(ROBE_FRONT, pal) : null,
      cloak: s.robe || s.cape ? gridCanvas(cloakRows(s.cape ? 30 : 32), s.cape ? { ...pal, R: pal.V, r: pal.v } : pal) : null,
      legs: gridCanvas(LEGS, pal),
      tuck: gridCanvas(LEGS_TUCK, pal),
      shin: s.shin ? gridCanvas(SHIN, pal) : null,
      pauldF: s.pauldron ? gridCanvas(PAULDRON, pal) : null,
      pauldB: s.pauldron ? gridCanvas(PAULDRON, { ...pal, a: pal.n, A: pal.a }) : null,
    };
    partCache[key] = p;
    return p;
  }

  // 두꺼운 픽셀 선 (팔) — 외곽선 먼저, 색 나중
  function limb(g, pts, col, w) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2));
      for (let k = 0; k <= n; k++) out.push([Math.round(x1 + (x2 - x1) * k / n), Math.round(y1 + (y2 - y1) * k / n)]);
    }
    const r = Math.floor(w / 2);
    g.fillStyle = col;
    for (const [x, y] of out) g.fillRect(x - r, y - r, w, w);
    return out;
  }

  function drawArm(g, s, pal, sh, hand, front) {
    const el = [(sh[0] + hand[0]) / 2 + (front ? 0.5 : -1), (sh[1] + hand[1]) / 2 + 1.5];
    const sleeve = pal[(front ? s.sleeve : s.sleeve && s.sleeve.toUpperCase()) || (front ? 't' : 'T')];
    const pts = [sh, el, hand];
    limb(g, pts, K, 5);
    limb(g, pts, sleeve, 3);
    const fa = [[el[0] + (hand[0] - el[0]) * 0.2, el[1] + (hand[1] - el[1]) * 0.2], [el[0] + (hand[0] - el[0]) * 0.85, el[1] + (hand[1] - el[1]) * 0.85]];
    if (s.gauntlet) {
      const [rib, base] = s.gauntlet;
      const ps = limb(g, fa, pal[base], 3);
      g.fillStyle = pal[rib];
      ps.forEach(([x, y], i) => { if (i % 3 === 0) g.fillRect(x - 1, y, 3, 1); });
    } else if (!s.slim) {
      // 넓은 제다이 소매 끝
      const cx = Math.round(el[0] + (hand[0] - el[0]) * 0.65), cy = Math.round(el[1] + (hand[1] - el[1]) * 0.65);
      g.fillStyle = K; g.fillRect(cx - 3, cy - 3, 6, 6);
      g.fillStyle = sleeve; g.fillRect(cx - 2, cy - 2, 4, 4);
    }
    const hx = Math.round(hand[0]), hy = Math.round(hand[1]);
    const hk = front ? s.frontHand : s.backHand;
    g.fillStyle = K; g.fillRect(hx - 2, hy - 2, 4, 4);
    g.fillStyle = hk ? pal[hk] : front ? pal.s : pal.S;
    g.fillRect(hx - 1, hy - 1, 2, 2);
  }

  function handPos(rel) { // 논리 좌표
    const ha = rel * 0.5 + 0.75;
    return { x: 6 + Math.cos(ha) * 15, y: -23 + Math.sin(ha) * 15 };
  }

  function newSprite() {
    const mk = () => { const c = document.createElement('canvas'); c.width = SW; c.height = SH; return c; };
    return { body: mk(), arm: mk() };
  }

  const ALL = { legs: true, torso: true, head: true, frontArm: true };

  // pose: { tuck, hand{x,y}(논리), backHand{x,y}(논리), blink }
  function compose(spr, ch, si, pose, which) {
    const s = CHARACTERS[ch].skins[si], pal = s.pal, P = parts(ch, si), w = which || ALL;
    const b = spr.body.getContext('2d'), a = spr.arm.getContext('2d');
    b.clearRect(0, 0, SW, SH); a.clearRect(0, 0, SW, SH);
    const at = (g, c, x, y) => c && g.drawImage(c, OX + x, OY + y);
    if (w.torso) {
      at(b, P.cloak, -11, -16);
      if (P.pauldB) at(b, P.pauldB, -8, -17);
      drawArm(b, s, pal, [OX - 3, OY - 12], [OX + pose.backHand.x / 2, OY + pose.backHand.y / 2], false);
    }
    if (w.legs) {
      const tuck = pose.tuck > 0.5;
      at(b, tuck ? P.tuck : P.legs, -6, 2);
      if (!tuck) at(b, P.shin, -6, 2);
    }
    if (w.torso) {
      at(b, P.torso, -8, -16);
      at(b, P.robe, -9, -16);
    }
    if (w.head) {
      at(b, P.head, -8, -31);
      at(b, P.beard, -8, -31);
      at(b, P.scar, -8, -31);
      if (pose.blink) {
        b.fillStyle = pal.S;
        b.fillRect(OX + 5, OY - 22, 2, 2);
      }
    }
    if (w.frontArm) {
      drawArm(a, s, pal, [OX + 3, OY - 12], [OX + pose.hand.x / 2, OY + pose.hand.y / 2], true);
      at(a, P.pauldF, 0, -17);
    }
    return spr;
  }

  // 버퍼(논리좌표 변환 상태)에 스프라이트 그리기
  function blit(ctx, canvas, x, y, angle, facing, pivotX = 0, pivotY = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(facing * 2, 2);
    ctx.drawImage(canvas, -OX - pivotX / 2, -OY - pivotY / 2);
    ctx.restore();
  }

  // ---------- 월드 픽셀 그리기 (논리좌표, 2유닛 격자) ----------
  const q = (v) => Math.floor(v / 2) * 2;
  function linePix(x1, y1, x2, y2) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2));
    const out = [];
    let lx = null, ly = null;
    for (let i = 0; i <= n; i++) {
      const X = q(x1 + (x2 - x1) * i / n), Y = q(y1 + (y2 - y1) * i / n);
      if (X !== lx || Y !== ly) { out.push([X, Y]); lx = X; ly = Y; }
    }
    return out;
  }
  function spread(pts, r, diamond) {
    const set = new Map();
    for (const [x, y] of pts) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > diamond) continue;
        const X = x + dx * 2, Y = y + dy * 2;
        set.set(X * 4096 + Y, [X, Y]);
      }
    }
    return set.values();
  }

  function drawHilt(ctx, x1, y1, x2, y2, style) {
    const pts = linePix(x1, y1, x2, y2);
    ctx.fillStyle = K;
    for (const [x, y] of spread(pts, 1, 1)) ctx.fillRect(x, y, 2, 2);
    pts.forEach(([x, y], i) => {
      const t = i / Math.max(1, pts.length - 1);
      let col = '#c3c7cf';
      if (t > 0.22 && t < 0.62) col = style === 'anakin' && i % 2 ? '#3c3f45' : '#1b1b1d';
      else if (t >= 0.62 && t < 0.75 && style === 'obiwan') col = '#9a8656';
      else if (t >= 0.85) col = '#8a8f98';
      ctx.fillStyle = col; ctx.fillRect(x, y, 2, 2);
    });
  }

  function drawBlade(ctx, x1, y1, x2, y2, col) {
    const pts = linePix(x1, y1, x2, y2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28; ctx.fillStyle = col;
    for (const [x, y] of spread(pts, 2, 3)) ctx.fillRect(x, y, 2, 2);
    ctx.restore();
    ctx.fillStyle = col;
    for (const [x, y] of spread(pts, 1, 1)) ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = '#f2f8ff';
    for (const [x, y] of pts) ctx.fillRect(x, y, 2, 2);
  }

  function drawTrail(ctx, trail, col) {
    if (trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col;
    for (let i = 0; i < trail.length - 1; i++) {
      const a = trail[i], b = trail[i + 1];
      const set = new Map();
      const steps = Math.max(2, Math.ceil(Math.hypot(b.x2 - a.x2, b.y2 - a.y2) / 1.5));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        for (const p of linePix(a.x1 + (b.x1 - a.x1) * t, a.y1 + (b.y1 - a.y1) * t, a.x2 + (b.x2 - a.x2) * t, a.y2 + (b.y2 - a.y2) * t)) set.set(p[0] * 4096 + p[1], p);
      }
      ctx.globalAlpha = ((i + 1) / trail.length) * 0.22;
      for (const [x, y] of set.values()) ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  // ---------- 선택 화면 미리보기 (80x88 픽셀 → 확대) ----------
  let pv = null;
  function drawPreview(ctx, ch, si, t, w, h) {
    if (!pv) {
      const c = document.createElement('canvas'); c.width = 80; c.height = 88;
      pv = { c, g: c.getContext('2d'), spr: newSprite() };
    }
    const g = pv.g, data = CHARACTERS[ch];
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, 80, 88);
    g.imageSmoothingEnabled = false;
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    const X = 62, Y = 112;
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.fillRect(X - 24, Y + 38, 50, 4); g.fillRect(X - 18, Y + 42, 38, 2);
    const rel = -1.05 + Math.sin(t * 2) * 0.08;
    const hand = handPos(rel);
    const pose = { tuck: 0, hand, backHand: { x: -11, y: -6 + Math.round(Math.sin(t * 2.2)) }, blink: t % 3.2 < 0.12 };
    compose(pv.spr, ch, si, pose);
    blit(g, pv.spr.body, X, Y, 0, 1);
    const d = { x: Math.cos(rel), y: Math.sin(rel) };
    const hx = X + hand.x, hy = Y + hand.y;
    drawHilt(g, hx - d.x * 7, hy - d.y * 7, hx + d.x * 7, hy + d.y * 7, data.hilt);
    blit(g, pv.spr.arm, X, Y, 0, 1);
    drawBlade(g, hx + d.x * 7, hy + d.y * 7, hx + d.x * 72, hy + d.y * 72, data.blade);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pv.c, 0, 0, w, h);
  }

  window.Skins = {
    CHARACTERS, handPos, newSprite, compose, blit, gridCanvas,
    drawHilt, drawBlade, drawTrail, drawPreview, linePix, q, OX, OY, K,
  };
})();
