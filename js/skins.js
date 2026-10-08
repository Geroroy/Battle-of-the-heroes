// 캐릭터 & 스킨 + 부위별 픽셀 아트 스프라이트 (래그돌용)
// 스프라이트 1픽셀 = 논리좌표 2유닛 = 저해상도 버퍼 1픽셀. 모두 오른쪽을 바라보는 기준으로 그림.
// 각 부위는 관절(위쪽 앵커)에서 아래로 뻗도록 그리고, 그릴 때 뼈 방향으로 회전시킨다.
(function () {
  const OUT = '#140d0b';

  // ---------- 팔레트 ----------
  // s/S 피부, w/e 눈, m 입, x 흉터, h/H/i 머리(수염), u/U/q 튜닉·속옷, v/V/y 타바드, a/A/n 갑옷, j 제다이 문장,
  // l/L 벨트·금속, g/G/f 장갑, o/O/b 부츠, p/P 바지, r/R 로브
  const SKINC = { s: '#efc29e', S: '#c58b68', w: '#f6eee6', m: '#97563f', x: '#cf7f69' };
  const PAL = {
    anakinCW: { // 클론 전쟁 (아소카 실사판과 같은 차림)
      ...SKINC, e: '#2b4366',
      h: '#6b4628', H: '#452c17', i: '#93683d',
      u: '#7b1f28', U: '#52141b', q: '#a1323b',     // 버건디 튜닉 & 바지
      v: '#2c3c66', V: '#1b2545', y: '#45598f',     // 남색 타바드
      a: '#50575e', A: '#7f8891', n: '#2f3439', j: '#a8352e', // 건메탈 흉갑·견갑, 붉은 문장
      l: '#5a3a23', L: '#aeb3b9',                   // 갈색 벨트, 금속 버클
      g: '#4f3628', G: '#33221a', f: '#76553f',     // 긴 갈색 가죽 건틀릿
      o: '#4b2f1f', O: '#2d1c12', b: '#73503a',     // 스트랩 달린 갈색 부츠
      p: '#7b1f28', P: '#52141b',
    },
    obiwanCW: { // 클론 전쟁 클론 아머
      ...SKINC, e: '#3a5b70',
      h: '#a55f2a', H: '#723f1b', i: '#cc8a4c',
      u: '#25252b', U: '#141418', q: '#3c3c47',     // 검은 언더슈트
      v: '#e4d5aa', V: '#b9a676', y: '#f6ecca',     // 크림색 타바드
      a: '#e9eae6', A: '#ffffff', n: '#a2a8b0', j: '#a8352e', // 흰 클론 아머
      l: '#5c3822', L: '#aeb3b9',
      g: '#1f1f24', G: '#111114', f: '#3b3b45',     // 검은 장갑
      o: '#c3c7cd', O: '#878c95', b: '#eceee9',     // 흰/회색 부츠
      p: '#25252b', P: '#141418',
    },
    anakinROTS: { // 시스의 복수
      ...SKINC, e: '#2b4366',
      h: '#6b4628', H: '#452c17', i: '#93683d',
      u: '#2a1d16', U: '#18100c', q: '#3e2b20',
      v: '#3f2b1d', V: '#271a10', y: '#57402d',
      a: '#50575e', A: '#7f8891', n: '#2f3439', j: '#a8352e',
      l: '#141010', L: '#8f939b',
      g: '#19191c', G: '#0e0e10', f: '#34343a',
      o: '#151110', O: '#0a0808', b: '#2d2622',
      p: '#231812', P: '#140d09',
      r: '#3f2b1d', R: '#271a10',
    },
    obiwanROTS: {
      ...SKINC, e: '#3a5b70',
      h: '#a55f2a', H: '#723f1b', i: '#cc8a4c',
      u: '#e2d4b4', U: '#bfaa85', q: '#f3ead6',
      v: '#d0b98e', V: '#a8916a', y: '#e8d8b2',
      a: '#e9eae6', A: '#ffffff', n: '#a2a8b0', j: '#a8352e',
      l: '#6a4527', L: '#c2ab82',
      g: '#efc29e', G: '#c58b68', f: '#f6d6b8',
      o: '#4a3420', O: '#2d1f13', b: '#6c4d33',
      p: '#cfba95', P: '#a9946f',
      r: '#5c3f27', R: '#3e2a19',
    },
  };

  // ---------- 머리 (손으로 찍은 격자, 외곽선 포함) ----------
  // Bloody Bastards 처럼 정면에 가까운 3/4 얼굴 (두 눈·굵은 눈썹·정면 코·입). 바라보는 쪽(오른쪽)으로 살짝 돌림
  // 중심 (13, 16), 목 아래끝 = 29행
  const HEADS = {
    anakin: [ // 웨이브 진 중간 길이 갈색 머리 (가르마, 귀를 덮음) + 왼쪽 눈 위아래 흉터
      '.........kkkkkkkk.........',
      '......kkkhhhhhhhhkkk......',
      '.....khhhhiiihhhhhhhk.....',
      '....khhhhiiiiihhhhhhhk....',
      '...khhhhhhiihhhhhhihhhk...',
      '..khhhhhhhhhhHhhhhiihhhk..',
      '..khhHhhhhhhHhhhhhhhhhhk..',
      '.khhHhhhhhhsshhhhhhhhhhhk.',
      '.khHhhhhssssssshhhhhshhhk.',
      '.khHhhhsssssssssshhssshhk.',
      '.khHhhssssssssssssssssshk.',
      '.khHhhsxssssssssssssssshk.',
      '.khHhhsHHHHssssHHHHHsshhk.',
      '.khHhhskkkkssssskkkkssShk.',
      '.khHhhSwewSssssswweSssShk.',
      '.khHhhSsxSsssSssssSsssshk.',
      '.khHhhSsxsssSsssssssssShk.',
      '.kHHhhSssssSSsSsssssssShk.',
      '.kHHhhhSsssssSSsssssssShk.',
      '.kHHhhhSssssssssssssssShk.',
      '.kHHhhhhSssmmmmmmssssShhk.',
      '.kHhhhhhSsssSSSSsssssShhk.',
      '..kHhhhhkSsssssssssssShk..',
      '..kHhhhk.kSssssssssSSkk...',
      '...kHhk...kSSssssSSk......',
      '....kk.....kkSSSSkk.......',
      '...........kSSSSSk........',
      '...........kSSSSSk........',
      '...........kSSSSSk........',
      '...........kkkkkkk........',
    ],
    obiwan: [ // 뒤로 넘긴 생강색 머리 + 짧게 다듬은 턱수염과 콧수염
      '..........kkkkkk..........',
      '.......kkkhhhhhhkkk.......',
      '.....kkhhhiiiiihhhhkk.....',
      '....khhhhhhiiiiihhhhhk....',
      '...khhhhhhhhhhhhhhhhhhk...',
      '...khhHhhhhhhhhhhhhhhhk...',
      '..khhHhhhhhhhhhhhhhhhhhk..',
      '..khHhhsssssssssssshhhhk..',
      '..khHhssssssssssssssshhk..',
      '..khHssssssssssssssssshk..',
      '..kHhssssssssssssssssshk..',
      '.kSHhsHHHHssssssHHHHHsHk..',
      '.kSHssskkkkssssskkkkkssSk.',
      '.kSSsSwewSsssssSwweSsssSk.',
      '.kSSsssSSsssSsssSSsssssSk.',
      '..kSssssssssSsssssssssSk..',
      '..kSsssssssSSSssssssssSk..',
      '..kHssssssSSsSSssssssHHk..',
      '..kHhsssshhhhhhhhssshhhk..',
      '..kHhhhhhhhmmmmmhhhhhhhk..',
      '..kHhhhhhhhhhhhhhhhhhhhk..',
      '...kHhhhhhhhhhhhhhhhhhk...',
      '....kHhhhhhhhhhhhhhhhk....',
      '.....kkHhhhhhhhhhhhkk.....',
      '.......kkHhhhhhhhkk.......',
      '.........kkkkkkkkk........',
      '...........kSSSSSk........',
      '...........kSSSSSk........',
      '...........kSSSSSk........',
      '...........kkkkkkk........',
    ],
    hood: [ // 제다이 후드 (얼굴 둘레를 감싸고 앞머리가 살짝 보임)
      '........kkkkkkkkk.........',
      '......kkRRrrrrrRRkk.......',
      '.....kRrrrrrrrrrrrRk......',
      '....kRrrrrrrrrrrrrrRk.....',
      '...kRrrrrrrrrrrrrrrrRk....',
      '..kRrrrrrkkkkkkkkrrrrRk...',
      '..kRrrrkkhhhhhhhhkkrrrRk..',
      '.kRrrrkhhhhhhhhhhhhkrrRk..',
      '.kRrrrkhhsssssssshhhkrrRk.',
      '.kRrrkhssssssssssssskrrRk.',
      '.kRrrkssssssssssssssskrRk.',
      '.kRrrkssHHHHssssHHHHHkrRk.',
      '.kRrrksskkkkssssskkkkkrRk.',
      '.kRrrkSSwewSssssSwweSkrRk.',
      '.kRrrkSssSSsssSsssSSskrRk.',
      '.kRrrkSssssssSssssssskrRk.',
      '.kRrrkSsssssSSSsssssskrRk.',
      '.kRrrkSssssSSsSSssssskrRk.',
      '.kRrrrkSsssssssssssskrrRk.',
      '.kRrrrkSssmmmmmmsssskrrRk.',
      '.kRrrrrkSsssSSSSsssskrRk..',
      '..kRrrrrkSssssssssskrrRk..',
      '..kRRrrrrkkSSSSSSkkrrRRk..',
      '...kRRrrrrrkkkkkkrrrRRk...',
      '....kkRRRrrrrrrrrRRRkk....',
      '......kkkRRRRRRRRkkk......',
      '.........kkkkkkkkk........',
    ],
  };
  const HOOD_BEARD = [ // 후드 쓴 오비완의 수염 (덧그림)
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '.......HssssSSsSSssssH....',
    '.......HhssshhhhhhsshH....',
    '.......kHhhhmmmmmmhhHk....',
    '........kHhhhhhhhhhHk.....',
    '.........kHhhhhhhhHk......',
    '..........kkHhhhhkk.......',
  ];
  const SCAR = [];

  // ---------- 그리기 도구 ----------
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function shadeHex(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function darkPal(pal, f) { const o = {}; for (const k in pal) o[k] = shadeHex(pal[k], f); return o; }

  function gridCanvas(rows, pal) {
    const h = rows.length, w = Math.max(1, ...rows.map((r) => r.length));
    const c = canvas(w, h), g = c.getContext('2d');
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch === '.' || ch === ' ') continue;
        const col = ch === 'k' ? OUT : pal[ch];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  }

  // 불투명 영역 둘레에 1픽셀 외곽선 자동 추가
  function outline(c) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const img = g.getImageData(0, 0, w, h), a = img.data;
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0;
    const marks = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (op(x, y)) continue;
      if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) marks.push([x, y]);
    }
    g.fillStyle = OUT;
    for (const [x, y] of marks) g.fillRect(x, y, 1, 1);
    return c;
  }

  function painter(c, pal) {
    const g = c.getContext('2d');
    const col = (k) => (k in pal ? pal[k] : k);
    return {
      px(x, y, k) { g.fillStyle = col(k); g.fillRect(x, y, 1, 1); },
      rect(x, y, w, h, k) { g.fillStyle = col(k); g.fillRect(x, y, w, h); },
      row(x1, x2, y, k) { g.fillStyle = col(k); g.fillRect(x1, y, x2 - x1 + 1, 1); },
      ell(cx, cy, rx, ry, k) {
        g.fillStyle = col(k);
        for (let y = -ry; y <= ry; y++) {
          const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
          g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
        }
      },
    };
  }
  const DARK = { u: 'U', v: 'V', a: 'n', g: 'G', o: 'O', p: 'P', r: 'R', s: 'S', h: 'H', l: 'l' };
  const LITE = { u: 'q', v: 'y', a: 'A', g: 'f', o: 'b', p: 'p', r: 'r', s: 's', h: 'i', l: 'l' };

  // 원통형 부위(팔·다리) 공통: 왼쪽(등쪽) 어둡게, 오른쪽(앞쪽) 밝게
  function tube(P, y1, y2, xl1, xr1, xl2, xr2, k) {
    for (let y = y1; y <= y2; y++) {
      const t = (y - y1) / Math.max(1, y2 - y1);
      const xl = Math.round(xl1 + (xl2 - xl1) * t), xr = Math.round(xr1 + (xr2 - xr1) * t);
      P.row(xl, xr, y, k);
      P.px(xl, y, DARK[k] || k);
      if (xr - xl > 3) P.px(xr - 1, y, LITE[k] || k);
    }
  }

  // ---------- 몸통 (30x64, 목 앵커 (15,3), 골반 = 39행) ----------
  function ext(y) {
    if (y < 3) return null;
    if (y <= 5) return [8 - (y - 3), 21 + (y - 3)];
    if (y <= 24) return [6, 23];
    if (y <= 33) return [7, 22];
    if (y <= 40) return [6, 23];
    const t = Math.floor((y - 40) / 4);
    return [Math.max(2, 6 - t), Math.min(27, 23 + t)];
  }
  function torso(style, pal) {
    const c = canvas(30, 66), P = painter(c, pal);
    const robe = style === 'robe';
    for (let y = 3; y <= 60; y++) {
      const [xl, xr] = ext(y);
      for (let x = xl; x <= xr; x++) {
        const inL = x <= xl + 5, inR = x >= xr - 5;
        let k = inL || inR ? 'v' : 'u';
        if (y > 41 && !inL && !inR && y > 57) continue;
        if (x === xl || x === xl + 1) k = DARK[k];
        else if (x === xl + 5 || x === xr - 5) k = 'V';
        else if (x === xr - 1 && inR) k = 'y';
        else if (!inL && !inR && x === 15 && y > 9) k = 'U';
        else if (!inL && !inR && y < 9 && x >= 13 && x <= 17 && (x + y) % 5 === 0) k = 'q';
        P.px(x, y, k);
      }
    }
    // V넥: 겹쳐 입은 튜닉 깃
    for (let y = 3; y <= 9; y++) { P.px(12 + Math.floor((y - 3) / 2), y, 'U'); P.px(18 - Math.floor((y - 3) / 2), y, 'q'); }
    // 타바드 주름
    for (let y = 44; y <= 60; y += 5) { P.px(ext(y)[0] + 3, y, 'V'); P.px(ext(y)[1] - 3, y, 'V'); }

    if (style === 'cwA') { // 건메탈 흉갑 (요크 형태) + 높은 깃
      for (let y = 1; y <= 19; y++) for (let x = 5; x <= 24; x++) {
        const e = ext(Math.max(3, y));
        const bottom = 19 - Math.floor(Math.abs(x - 16) / 2.5);
        if (y < 3 && (x < 11 || x > 20)) continue;
        if (y >= 3 && (x < e[0] || x > e[1])) continue;
        if (y > bottom) continue;
        let k = 'a';
        if (y === bottom || x <= e[0] + 1 || y <= 1) k = 'n';
        else if ((y <= 6 && x >= 16 && x <= 22) || x === e[1] - 1) k = 'A';
        else if (x === 15 && y > 4) k = 'n';
        else if ((x * 7 + y * 13) % 17 === 0) k = 'n'; // 긁힌 자국
        P.px(x, y, k);
      }
    }
    if (style === 'cwO') { // 흰 클론 흉갑 + 복부 장갑
      for (let y = 1; y <= 21; y++) for (let x = 5; x <= 24; x++) {
        const e = ext(Math.max(3, y));
        if (y < 3 && (x < 11 || x > 20)) continue;
        if (y >= 3 && (x < e[0] + 1 || x > e[1] - 1)) continue;
        const bottom = 21 - Math.floor(Math.abs(x - 15) / 3);
        if (y > bottom) continue;
        let k = 'a';
        if (y === bottom || x === e[0] + 1 || y <= 1) k = 'n';
        else if (y === 11 || (x === 15 && y > 4)) k = 'n';
        else if (y <= 5 && x >= 16) k = 'A';
        P.px(x, y, k);
      }
      for (let y = 23; y <= 33; y++) for (let x = 10; x <= 20; x++) {
        let k = 'a';
        if (x === 10 || y === 33 || y === 27 || y === 30) k = 'n';
        else if (x === 19) k = 'A';
        P.px(x, y, k);
      }
    }
    // 벨트 + 버클 + 파우치
    for (let y = 35; y <= 38; y++) { const [xl, xr] = ext(y); P.row(xl, xr, y, y === 38 ? shadeHex(pal.l, 0.7) : 'l'); }
    P.rect(17, 35, 3, 3, 'L'); P.px(18, 36, 'l');
    P.rect(8, 35, 3, 5, shadeHex(pal.l, 0.8)); P.px(9, 36, 'L');
    P.rect(21, 35, 3, 5, shadeHex(pal.l, 0.8));
    if (robe) {
      for (let y = 3; y <= 62; y++) {
        const [xl0, xr0] = ext(Math.min(y, 60));
        const grow = y > 40 ? 1 : 0;
        P.row(xl0 - 2 - grow, xl0 + 2, y, 'r'); P.px(xl0 - 2 - grow, y, 'R'); P.px(xl0 + 2, y, 'R');
        P.row(xr0 - 2, xr0 + 2 + grow, y, 'r'); P.px(xr0 - 2, y, 'R');
      }
    }
    return { c: outline(c), ax: 15, ay: 3 };
  }

  // ---------- 위팔 (14x24, 어깨 앵커 (7,3), 팔꿈치 = 20행) ----------
  function upperArm(style, pal, front) {
    const c = canvas(16, 24), P = painter(c, pal);
    const k = style === 'robe' ? 'r' : 'u';
    if (style === 'robe' || style === 'jedi') tube(P, 2, 21, 3, 11, 4, 11, k);
    else tube(P, 2, 21, 4, 11, 5, 10, k);
    P.row(5, 9, 1, k);
    if (style === 'pauldron' && front || style === 'armorO') {
      if (front) { // 견갑 + 붉은 제다이 문장
        P.ell(8, 5, 6, 4, 'a');
        P.row(4, 12, 9, 'n'); P.row(6, 11, 2, 'A'); P.px(12, 4, 'A'); P.px(13, 5, 'A');
        P.px(8, 4, 'j'); P.row(7, 9, 5, 'j'); P.px(8, 6, 'j'); P.px(7, 3, 'j'); P.px(9, 3, 'j');
      }
      if (style === 'armorO') { // 위팔 장갑판
        for (let y = 11; y <= 18; y++) { P.row(4, 11, y, 'a'); P.px(4, y, 'n'); P.px(10, y, 'A'); }
        P.row(4, 11, 18, 'n');
      }
    }
    return { c: outline(c), ax: 8, ay: 3 };
  }

  // ---------- 아래팔 + 손 (18x30, 팔꿈치 앵커 (8,3), 손목 = 20행) ----------
  function foreArm(style, pal, gloved) {
    const c = canvas(18, 30), P = painter(c, pal);
    if (style === 'gauntlet') { // 아나킨: 팔꿈치까지 오는 갈색 가죽 건틀릿
      tube(P, 2, 8, 2, 13, 4, 12, 'g');
      P.row(3, 12, 2, 'f');
      tube(P, 8, 20, 4, 12, 5, 11, 'g');
      for (const y of [11, 15]) { P.row(5, 11, y, 'G'); P.row(5, 11, y - 1, 'f'); P.px(10, y, 'L'); }
      P.row(4, 12, 8, 'G');
    } else if (style === 'armorO') { // 오비완: 검은 언더슈트 + 흰 팔뚝 장갑
      tube(P, 2, 20, 5, 11, 5, 11, 'u');
      for (let y = 6; y <= 17; y++) { P.row(4, 12, y, 'a'); P.px(4, y, 'n'); P.px(11, y, 'A'); }
      P.row(4, 12, 17, 'n'); P.row(4, 12, 6, 'n');
    } else { // 제다이 종 모양 소매
      const k = style === 'robe' ? 'r' : 'u';
      tube(P, 2, 17, 5, 11, 2, 14, k);
      P.row(3, 13, 17, DARK[k]);
      tube(P, 17, 20, 6, 10, 6, 10, gloved ? 'g' : 's');
    }
    // 주먹 (광선검을 쥔 손)
    const hk = style === 'gauntlet' || style === 'armorO' || gloved ? 'g' : 's';
    P.ell(9, 23, 4, 3, hk);
    P.row(6, 12, 21, LITE[hk] || hk); P.px(13, 23, LITE[hk] || hk); P.px(5, 24, DARK[hk] || hk);
    return { c: outline(c), ax: 8, ay: 3 };
  }

  // ---------- 허벅지 (16x30, 엉덩이 앵커 (8,3), 무릎 = 25행) ----------
  function thigh(pal) {
    const c = canvas(16, 30), P = painter(c, pal);
    tube(P, 1, 27, 3, 12, 5, 11, 'p');
    return { c: outline(c), ax: 8, ay: 3 };
  }

  // ---------- 정강이 + 발 (24x36, 무릎 앵커 (8,3), 발목 = 26행) ----------
  function shin(style, pal) {
    const c = canvas(24, 36), P = painter(c, pal);
    if (style === 'greave') { // 오비완: 흰 무릎·정강이 장갑 + 회색 부츠
      tube(P, 2, 26, 4, 12, 5, 12, 'u');
      P.ell(8, 4, 5, 4, 'a'); P.row(5, 11, 1, 'A'); P.row(4, 12, 8, 'n');
      for (let y = 9; y <= 23; y++) { P.row(4, 12, y, 'a'); P.px(4, y, 'n'); P.px(11, y, 'A'); }
      P.row(4, 12, 23, 'n');
      foot(P, 'o');
    } else {
      tube(P, 2, 7, 3, 13, 4, 12, 'o'); // 부츠 윗단
      P.row(4, 12, 2, 'b'); P.row(3, 13, 7, 'O');
      tube(P, 7, 27, 4, 12, 5, 12, 'o');
      if (style === 'strapBoot') {
        for (const y of [11, 17, 22]) { P.row(4, 12, y, 'O'); P.row(4, 12, y + 1, 'b'); P.px(11, y, 'L'); }
      }
      foot(P, 'o');
    }
    return { c: outline(c), ax: 8, ay: 3 };
  }
  function foot(P, k) {
    P.row(4, 13, 26, k); P.row(4, 15, 27, k); P.row(3, 17, 28, k); P.row(3, 18, 29, k); P.row(3, 18, 30, k);
    P.row(3, 18, 31, 'O'); P.rect(3, 29, 4, 3, 'O'); P.row(12, 17, 28, LITE[k] || k);
  }

  // ---------- 캐릭터 정의 ----------
  const CHARACTERS = {
    anakin: {
      id: 'anakin', name: '아나킨 스카이워커', short: 'ANAKIN', blade: '#3b8cff', hilt: 'anakin',
      winQuote: '"이제는 내가 마스터다."',
      skins: [
        { name: '클론 전쟁', sub: '기본 · 건메탈 갑옷, 남색 타바드', pal: PAL.anakinCW, head: 'anakin', scar: true, torso: 'cwA', uarm: 'pauldron', farm: 'gauntlet', shin: 'strapBoot' },
        { name: '제다이 복장', sub: '시스의 복수', pal: PAL.anakinROTS, head: 'anakin', scar: true, torso: 'jedi', uarm: 'jedi', farm: 'jedi', glove: 'front', shin: 'boot' },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', pal: PAL.anakinROTS, head: 'hood', torso: 'robe', uarm: 'robe', farm: 'robe', glove: 'front', shin: 'boot' },
      ],
    },
    obiwan: {
      id: 'obiwan', name: '오비완 케노비', short: 'OBI-WAN', blade: '#3b8cff', hilt: 'obiwan',
      winQuote: '"끝났다, 아나킨. 내가 고지를 점했어!"',
      skins: [
        { name: '클론 전쟁', sub: '기본 · 흰 클론 아머, 크림 타바드', pal: PAL.obiwanCW, head: 'obiwan', torso: 'cwO', uarm: 'armorO', farm: 'armorO', shin: 'greave' },
        { name: '제다이 복장', sub: '시스의 복수', pal: PAL.obiwanROTS, head: 'obiwan', torso: 'jedi', uarm: 'jedi', farm: 'jedi', shin: 'boot' },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', pal: PAL.obiwanROTS, head: 'hood', beard: true, torso: 'robe', uarm: 'robe', farm: 'robe', shin: 'boot' },
      ],
    },
  };

  const cache = {};
  function parts(ch, si) {
    const key = ch + si;
    if (cache[key]) return cache[key];
    const s = CHARACTERS[ch].skins[si], pal = s.pal, dk = darkPal(pal, 0.68);
    const headC = gridCanvas(HEADS[s.head], pal);
    const hg = headC.getContext('2d');
    if (s.beard) hg.drawImage(gridCanvas(HOOD_BEARD, PAL.obiwanROTS), 0, 0);
    const P = {
      head: { c: headC, ax: 13, ay: 16 },
      torso: torso(s.torso, pal),
      uarmF: upperArm(s.uarm, pal, true), uarmB: upperArm(s.uarm, dk, false),
      farmF: foreArm(s.farm, pal, s.glove === 'front'), farmB: foreArm(s.farm, dk, false),
      thighF: thigh(pal), thighB: thigh(dk),
      shinF: shin(s.shin, pal), shinB: shin(s.shin, dk),
    };
    cache[key] = P;
    return P;
  }

  // 뼈(a→b) 방향으로 부위 스프라이트를 그림 (버퍼는 논리좌표 0.5배 변환 상태)
  function drawSeg(ctx, part, ax, ay, bx, by, facing) {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(Math.atan2(by - ay, bx - ax) - Math.PI / 2);
    ctx.scale(2 * facing, 2);
    ctx.drawImage(part.c, -part.ax, -part.ay);
    ctx.restore();
  }
  function drawHead(ctx, part, hx, hy, nx, ny, facing) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(Math.atan2(hy - ny, hx - nx) + Math.PI / 2);
    ctx.scale(2 * facing, 2);
    ctx.drawImage(part.c, -part.ax, -part.ay);
    ctx.restore();
  }

  // ---------- 월드 픽셀 (논리좌표, 2유닛 격자) ----------
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
        set.set(X * 8192 + Y, [X, Y]);
      }
    }
    return set.values();
  }

  function drawHilt(ctx, x1, y1, x2, y2, style) {
    const pts = linePix(x1, y1, x2, y2);
    ctx.fillStyle = OUT;
    for (const [x, y] of spread(pts, 1, 1)) ctx.fillRect(x, y, 2, 2);
    pts.forEach(([x, y], i) => {
      const t = i / Math.max(1, pts.length - 1);
      let col = '#c9cdd4';
      if (t < 0.1) col = '#7d828b';
      else if (t > 0.2 && t < 0.6) col = style === 'anakin' ? (i % 2 ? '#2d3035' : '#16171a') : (i % 3 === 0 ? '#9a8656' : '#1b1b1d');
      else if (t >= 0.82) col = '#8a8f98';
      ctx.fillStyle = col; ctx.fillRect(x, y, 2, 2);
    });
  }

  function drawBlade(ctx, x1, y1, x2, y2, col) {
    const pts = linePix(x1, y1, x2, y2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22; ctx.fillStyle = col;
    for (const [x, y] of spread(pts, 3, 4)) ctx.fillRect(x, y, 2, 2);
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
        for (const p of linePix(a.x1 + (b.x1 - a.x1) * t, a.y1 + (b.y1 - a.y1) * t, a.x2 + (b.x2 - a.x2) * t, a.y2 + (b.y2 - a.y2) * t)) set.set(p[0] * 8192 + p[1], p);
      }
      ctx.globalAlpha = ((i + 1) / trail.length) * 0.2;
      for (const [x, y] of set.values()) ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  window.Skins = { CHARACTERS, PAL, parts, drawSeg, drawHead, drawHilt, drawBlade, drawTrail, linePix, q, OUT, shadeHex };
})();
