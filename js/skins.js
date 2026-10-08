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

  // ---------- 머리 (Bloody Bastards 식 큰 정면 얼굴, 30x32, 외곽선은 자동) ----------
  // 중심 (15, 17), 목 아래끝 = 31행. k = 얼굴 안쪽 진한 선(눈꺼풀·입)
  const HEADS = {
    anakin: [
      '..........hhhhhhhhh...........',
      '.......hhhhhiiihhhhhhh........',
      '.....hhhhhhiiiiihhhhhhhh......',
      '....hhhhhhhhiihhhhhhihhhh.....',
      '...hhhhhHhhhhhhhhhhhiihhhh....',
      '..hhhhhHhhhhhhHhhhhhhhhhhhh...',
      '..hhhhHhhhhhhHhhhhhhhhhhhhh...',
      '.hhhhHhhhhhhsshhhhhhhhshhhhh..',
      '.hhhHhhhhssssssshhhhhssshhhh..',
      '.hhhHhhssssssssssshhsssshhhh..',
      '.hhhHhsssssssssssssssssssHhh..',
      '.hhhHhssssssssssssssssssssHh..',
      '.hhhHhsxsssssssssssssssssssh..',
      '.hhhHssHHHHHsssssHHHHHHsssshh.',
      '.hhhHssskkkksssssskkkkkssssh..',
      '.hhhHsSswwesSsssssswweeSsssh..',
      '.hhhHsSsxsSssssSsssSSsssssSh..',
      '.hhhHsSsxssssssSsssssssssSSh..',
      '.hhHHsSssssssssSSsssssssssSh..',
      '.hhHHhSssssssSSSSSsssssssSSh..',
      '.hhHHhSssssssssssssssssssSh...',
      '.hhHHhSSsssssssssssssssSSSh...',
      '.hhHHhhSsssskkkkkkkssssSShh...',
      '.hhHhhhSSsssssSSSsssssSShhh...',
      '..hHhhhhSSssssssssssssSShhh...',
      '..hHhhhh.SSsssssssssSSS.hh....',
      '...hhhh...SSSssssssSSS........',
      '....hh......SSSSSSSS..........',
      '............SSSSSSS...........',
      '............SSSSSSS...........',
      '............SSSSSSS...........',
      '............SSSSSSS...........',
    ],
    obiwan: [
      '...........hhhhhhh............',
      '........hhhhiiiiihhhh.........',
      '......hhhhhhiiiiiihhhhh.......',
      '.....hhhhhhhhhiiihhhhhhh......',
      '....hhhhhhhhhhhhhhhhhhhhh.....',
      '....hhhHhhhhhhhhhhhhhhhhhh....',
      '...hhhHhhhhhhhhhhhhhhhhhhh....',
      '...hhHhhsssssssssssssshhhhh...',
      '...hhHhssssssssssssssssshhh...',
      '...hhHsssssssssssssssssssShh..',
      '...hHssssssssssssssssssssSh...',
      '..SShsssssssssssssssssssssS...',
      '..SSsssssssssssssssssssssSS...',
      '..SSssHHHHHHssssssHHHHHHHsSS..',
      '..SsssskkkkssssssskkkkkssssS..',
      '..SssSswwessSssssswweesSssS...',
      '..SSsSssSSssssSsssssSSssssS...',
      '...SssssssssssSssssssssssS....',
      '...ShssssssssSSSssssssssShh...',
      '...hHssssssSSSSSSsssssssHhh...',
      '...hHhsshhhhhhhhhhhhhssHhhh...',
      '...hHhhhhhhhkkkkkkhhhhhhhhh...',
      '...hHhhhhhhhhmmmmhhhhhhhhhh...',
      '....hHhhhhhhhhhhhhhhhhhhhh....',
      '....hHHhhhhhhhhhhhhhhhhhhh....',
      '.....hHHhhhhhhhhhhhhhhhhh.....',
      '......hHHhhhhhhhhhhhhhhh......',
      '........hHHhhhhhhhhhhh........',
      '...........hhhhhhhh...........',
      '............SSSSSSS...........',
      '............SSSSSSS...........',
      '............SSSSSSS...........',
    ],
  };

  // ---------- 그리기 도구 ----------
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function shadeHex(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function darkPal(pal, f) { const o = {}; for (const k in pal) o[k] = shadeHex(pal[k], f); return o; }

  // 불투명 영역 둘레에 외곽선
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

  // 키 격자: 영역마다 팔레트 글자로 칠한 뒤, 자동 음영(뒤쪽 2px 그림자·아래 그림자·앞쪽 밝은 선·질감 점) + 외곽선
  const DARK = { u: 'U', v: 'V', a: 'n', g: 'G', o: 'O', p: 'P', r: 'R', s: 'S', h: 'H', l: 'Z', A: 'a', y: 'v', q: 'u', b: 'o', f: 'g', L: 'L', j: 'j', n: 'n', U: 'U', V: 'V', P: 'P', R: 'R', O: 'O', G: 'G' };
  const LITE = { u: 'q', v: 'y', a: 'A', g: 'f', o: 'b', p: 'p', r: 'r', s: 's', h: 'i', l: 'l' };
  const TEXTURED = new Set(['u', 'v', 'p', 'r', 'o', 'g']);
  class KG {
    constructor(w, h) { this.w = w; this.h = h; this.k = new Array(w * h).fill(null); }
    get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.k[y * this.w + x]; }
    px(x, y, k) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.k[y * this.w + x] = k; }
    row(x1, x2, y, k) { for (let x = Math.round(x1); x <= Math.round(x2); x++) this.px(x, y, k); }
    rect(x, y, w, h, k) { for (let j = 0; j < h; j++) this.row(x, x + w - 1, y + j, k); }
    ell(cx, cy, rx, ry, k) {
      for (let y = -ry; y <= ry; y++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.3))));
        this.row(cx - w, cx + w, cy + y, k);
      }
    }
    // 위→아래로 굵기가 변하는 원통 (팔·다리)
    tube(cx, y1, y2, w1, w2, k) {
      for (let y = y1; y <= y2; y++) {
        const t = (y - y1) / Math.max(1, y2 - y1), hw = (w1 + (w2 - w1) * t) / 2;
        this.row(cx - hw, cx + hw - 1, y, k);
      }
    }
    render(pal, flat) {
      const c = canvas(this.w, this.h), g = c.getContext('2d');
      const col = (k) => pal[k] || (k === 'Z' ? shadeHex(pal.l, 0.65) : k[0] === '#' ? k : null);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const k = this.get(x, y);
        if (!k) continue;
        let kk = k;
        if (!flat && k.length === 1) {
          const back = this.get(x - 1, y) !== k || this.get(x - 2, y) !== k;
          const below = this.get(x, y + 1) === null;
          const front = this.get(x + 1, y) !== k, top = this.get(x, y - 1) !== k;
          if (back || below) kk = DARK[k] || k;
          else if (front || top) kk = LITE[k] || k;
          else if (TEXTURED.has(k) && ((x * 7 + y * 13 + x * y) % 17 === 0)) kk = DARK[k] || k;
        }
        const cc = col(kk) || col(k);
        if (cc) { g.fillStyle = cc; g.fillRect(x, y, 1, 1); }
      }
      return outline(c);
    }
  }

  function headCanvas(rows, pal, hood) {
    const h = rows.length, w = rows[0].length;
    const c = canvas(w, h), g = c.getContext('2d');
    const put = (x, y, ch) => {
      const cc = ch === 'k' ? OUT : pal[ch];
      if (cc) { g.fillStyle = cc; g.fillRect(x, y, 1, 1); }
    };
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') put(x, y, r[x]); });
    // 눈은 2픽셀 높이로 (흰자 + 진한 눈동자), 눈꺼풀 선은 눈썹 쪽으로
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'w' || r[x] === 'e') put(x, y + 1, r[x] === 'e' ? 'e' : 'w'); });
    if (hood) {
      // 후드: 얼굴 구멍(타원) 바깥을 로브 천으로 감싸고 어깨까지 늘어뜨림
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const fx = (x - 16) / 10, fy = (y - 18) / 12.5;
        const ox = (x - 15) / 15, oy = (y - 15) / 16;
        const inFace = fx * fx + fy * fy < 1;
        const inHood = ox * ox + oy * oy < 1 || (y > 20 && x > 3 && x < 27);
        if (inHood && !inFace) {
          const edge = fx * fx + fy * fy < 1.25;
          put(x, y, edge ? 'R' : (x < 7 || (x + y) % 9 === 0) ? 'R' : 'r');
        }
      }
    }
    return outline(c);
  }

  // ---------- 몸통 (40x78, 목 앵커 (20,3), 골반 = 45행, 타바드 자락은 아래로) ----------
  function ext(y) {
    if (y < 3) return null;
    if (y <= 7) return [10 - (y - 3) * 1.3, 30 + (y - 3) * 1.3];
    if (y <= 26) return [4, 36];
    if (y <= 40) return [6, 34];
    if (y <= 46) return [5, 35];
    const t = Math.floor((y - 46) / 4);
    return [Math.max(1, 5 - t), Math.min(39, 35 + t)];
  }
  function torso(style, pal) {
    const G = new KG(42, 78);
    const bottom = 72;
    for (let y = 3; y <= bottom; y++) {
      const [xl, xr] = ext(y).map(Math.round);
      for (let x = xl; x <= xr; x++) {
        const inL = x <= xl + 8, inR = x >= xr - 8;
        if (y > 47 && !inL && !inR && y > 66) continue; // 튜닉 자락은 타바드보다 짧음
        G.px(x, y, inL || inR ? 'v' : 'u');
      }
    }
    // V넥 깃
    for (let y = 3; y <= 13; y++) { G.px(15 + Math.floor((y - 3) / 2), y, 'U'); G.px(25 - Math.floor((y - 3) / 2), y, 'U'); }
    for (let y = 14; y <= 46; y++) G.px(20, y, 'U');
    if (style === 'cwA') { // 건메탈 흉갑 (요크) + 깃
      for (let y = 1; y <= 24; y++) {
        const e = ext(Math.max(3, y)).map(Math.round);
        for (let x = 4; x <= 36; x++) {
          const bot = 24 - Math.floor(Math.abs(x - 21) / 2.2);
          if (y > bot) continue;
          if (y < 3 && (x < 14 || x > 27)) continue;
          if (y >= 3 && (x < e[0] || x > e[1])) continue;
          G.px(x, y, (x === 20 || y === bot) && y > 4 ? 'n' : 'a');
        }
      }
      for (const [x, y] of [[9, 9], [30, 12], [14, 17], [26, 7]]) G.px(x, y, 'n'); // 긁힌 자국
    }
    if (style === 'cwO') { // 흰 클론 흉갑 + 복부판
      for (let y = 1; y <= 27; y++) {
        const e = ext(Math.max(3, y)).map(Math.round);
        for (let x = 4; x <= 36; x++) {
          const bot = 27 - Math.floor(Math.abs(x - 20) / 3);
          if (y > bot) continue;
          if (y < 3 && (x < 14 || x > 27)) continue;
          if (y >= 3 && (x < e[0] + 1 || x > e[1] - 1)) continue;
          G.px(x, y, (y === 14 || x === 20) && y > 4 ? 'n' : 'a');
        }
      }
      for (let y = 29; y <= 40; y++) for (let x = 13; x <= 27; x++) G.px(x, y, y === 33 || y === 37 || y === 40 ? 'n' : 'a');
    }
    // 벨트 + 버클 + 파우치
    for (let y = 41; y <= 45; y++) { const [xl, xr] = ext(y).map(Math.round); G.row(xl, xr, y, 'l'); }
    G.rect(23, 42, 4, 3, 'L'); G.rect(9, 42, 4, 6, 'Z'); G.rect(29, 42, 4, 6, 'Z');
    if (style === 'robe') {
      for (let y = 3; y <= 75; y++) {
        const [xl, xr] = ext(Math.min(y, bottom)).map(Math.round);
        const g2 = y > 46 ? 1 : 0;
        G.row(xl - 3 - g2, xl + 3, y, 'r'); G.row(xr - 3, xr + 3 + g2, y, 'r');
      }
    }
    return { c: G.render(pal), ax: 20, ay: 3 };
  }

  // ---------- 위팔 (20x28, 어깨 앵커 (10,3), 팔꿈치 = 23행) ----------
  function upperArm(style, pal, front) {
    const G = new KG(22, 28);
    const k = style === 'robe' ? 'r' : 'u';
    if (style === 'robe' || style === 'jedi') G.tube(11, 2, 24, 13, 14, k);
    else G.tube(11, 2, 24, 12, 11, k);
    G.ell(11, 4, 6, 3, k);
    if ((style === 'pauldron' || style === 'armorO') && front) { // 견갑 + 붉은 제다이 문장
      G.ell(11, 6, 9, 6, 'a');
      G.row(4, 18, 12, 'n');
      G.px(11, 4, 'j'); G.row(9, 13, 6, 'j'); G.row(10, 12, 5, 'j'); G.px(11, 7, 'j'); G.px(11, 8, 'j'); G.px(8, 7, 'j'); G.px(14, 7, 'j');
    }
    if (style === 'armorO') { for (let y = 14; y <= 22; y++) G.row(5, 16, y, y === 22 ? 'n' : 'a'); }
    return { c: G.render(pal), ax: 11, ay: 3 };
  }

  // ---------- 아래팔 + 주먹 (22x34, 팔꿈치 앵커 (11,3), 손목 = 23행) ----------
  function foreArm(style, pal, gloved) {
    const G = new KG(24, 34);
    if (style === 'gauntlet') { // 아나킨: 긴 갈색 가죽 건틀릿
      G.tube(12, 2, 9, 15, 12, 'g');
      G.tube(12, 9, 23, 12, 10, 'g');
      for (const y of [12, 17]) { G.row(7, 16, y, 'G'); G.px(15, y, 'L'); }
      G.row(5, 18, 9, 'G');
    } else if (style === 'armorO') { // 오비완: 검은 언더슈트 + 흰 팔뚝판
      G.tube(12, 2, 23, 11, 10, 'u');
      for (let y = 7; y <= 20; y++) G.row(6, 17, y, y === 7 || y === 20 ? 'n' : 'a');
    } else { // 제다이 종 모양 소매
      const k = style === 'robe' ? 'r' : 'u';
      G.tube(12, 2, 20, 12, 17, k);
      G.row(4, 20, 20, DARK[k]);
      G.tube(12, 20, 23, 8, 8, gloved ? 'g' : 's');
    }
    const hk = style === 'gauntlet' || style === 'armorO' || gloved ? 'g' : 's';
    G.ell(12, 27, 6, 5, hk);
    G.row(8, 15, 24, hk); G.px(17, 27, hk);
    return { c: G.render(pal), ax: 12, ay: 3 };
  }

  // ---------- 허벅지 (22x34, 엉덩이 앵커 (11,3), 무릎 = 29행) ----------
  function thigh(pal) {
    const G = new KG(22, 34);
    G.tube(11, 1, 31, 16, 13, 'p');
    return { c: G.render(pal), ax: 11, ay: 3 };
  }

  // ---------- 정강이 + 발 (30x40, 무릎 앵커 (11,3), 발목 = 30행) ----------
  function shin(style, pal) {
    const G = new KG(32, 40);
    if (style === 'greave') { // 오비완: 흰 무릎·정강이 장갑 + 회색 부츠
      G.tube(11, 2, 30, 13, 13, 'u');
      G.ell(11, 5, 7, 5, 'a');
      for (let y = 10; y <= 27; y++) G.row(5, 17, y, y === 27 ? 'n' : 'a');
      G.row(5, 17, 10, 'n');
    } else {
      G.tube(11, 2, 8, 16, 15, 'o'); // 부츠 윗단
      G.row(3, 19, 8, 'O');
      G.tube(11, 8, 31, 14, 13, 'o');
      if (style === 'strapBoot') for (const y of [13, 20, 26]) { G.row(4, 18, y, 'O'); G.px(16, y, 'L'); }
    }
    // 발
    G.row(5, 18, 30, 'o'); G.row(5, 20, 31, 'o'); G.row(4, 23, 32, 'o'); G.row(4, 25, 33, 'o'); G.row(4, 26, 34, 'o'); G.row(4, 26, 35, 'o');
    G.row(4, 26, 36, 'O');
    return { c: G.render(pal), ax: 11, ay: 3 };
  }

  // ---------- 캐릭터 정의 ----------
  const CHARACTERS = {
    anakin: {
      id: 'anakin', name: '아나킨 스카이워커', short: 'ANAKIN', blade: '#3b8cff', hilt: 'anakin',
      winQuote: '"이제는 내가 마스터다."',
      skins: [
        { name: '클론 전쟁', sub: '기본 · 건메탈 갑옷, 남색 타바드', pal: PAL.anakinCW, head: 'anakin', torso: 'cwA', uarm: 'pauldron', farm: 'gauntlet', shin: 'strapBoot' },
        { name: '제다이 복장', sub: '시스의 복수', pal: PAL.anakinROTS, head: 'anakin', torso: 'jedi', uarm: 'jedi', farm: 'jedi', glove: 'front', shin: 'boot' },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', pal: PAL.anakinROTS, head: 'anakin', hood: true, torso: 'robe', uarm: 'robe', farm: 'robe', glove: 'front', shin: 'boot' },
      ],
    },
    obiwan: {
      id: 'obiwan', name: '오비완 케노비', short: 'OBI-WAN', blade: '#3b8cff', hilt: 'obiwan',
      winQuote: '"끝났다, 아나킨. 내가 고지를 점했어!"',
      skins: [
        { name: '클론 전쟁', sub: '기본 · 흰 클론 아머, 크림 타바드', pal: PAL.obiwanCW, head: 'obiwan', torso: 'cwO', uarm: 'armorO', farm: 'armorO', shin: 'greave' },
        { name: '제다이 복장', sub: '시스의 복수', pal: PAL.obiwanROTS, head: 'obiwan', torso: 'jedi', uarm: 'jedi', farm: 'jedi', shin: 'boot' },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', pal: PAL.obiwanROTS, head: 'obiwan', hood: true, torso: 'robe', uarm: 'robe', farm: 'robe', shin: 'boot' },
      ],
    },
  };

  const cache = {};
  function parts(ch, si) {
    const key = ch + si;
    if (cache[key]) return cache[key];
    const s = CHARACTERS[ch].skins[si], pal = s.pal, dk = darkPal(pal, 0.7);
    const P = {
      head: { c: headCanvas(HEADS[s.head], pal, s.hood), ax: 15, ay: 17 },
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
