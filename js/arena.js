// 무스타파 결투장: Bloody Bastards 식 층층 배경 + 스타워즈 무스타파
// 정적 배경은 480x270 버퍼 해상도로 그린 뒤 제한 팔레트로 디더링해 픽셀 아트로 만든다
window.Arena = (function () {
  const { W, H, PLAT, LAVA_Y } = CFG;
  let bg = null;

  const PALETTE = [
    '#070203', '#100506', '#190807', '#230b09', '#2f0f0b', '#3d140c', '#4f1a0e', '#64210f', '#7c2a10',
    '#963612', '#b14314', '#cc5418', '#e46a1e', '#f5872a', '#ffa83f', '#ffcb6b', '#ffe9a8',
    '#0d0b0d', '#161317', '#201c21', '#2b262b', '#383238', '#474049', '#5a535b', '#736c73', '#8f8890', '#aaa4ab',
    '#3a2a22', '#4f3a2e', '#6b5242',
  ].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function quantize(g, w, h) {
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, t = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 20;
      const r = d[i] + t, gg = d[i + 1] + t, b = d[i + 2] + t;
      let best = 0, bd = Infinity;
      for (let k = 0; k < PALETTE.length; k++) {
        const p = PALETTE[k], dd = (p[0] - r) ** 2 * 0.3 + (p[1] - gg) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11;
        if (dd < bd) { bd = dd; best = k; }
      }
      d[i] = PALETTE[best][0]; d[i + 1] = PALETTE[best][1]; d[i + 2] = PALETTE[best][2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  function poly(g, pts, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fill();
  }
  function glow(g, x, y, r, col, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function build() {
    const c = document.createElement('canvas');
    c.width = W / 2; c.height = H / 2;
    const g = c.getContext('2d');
    g.scale(0.5, 0.5);

    // 하늘 (연기 낀 붉은 하늘)
    const sky = g.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#120506'); sky.addColorStop(0.45, '#33110c'); sky.addColorStop(0.8, '#7a2c12'); sky.addColorStop(1, '#b84a18');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // 화산재 구름 띠
    for (let i = 0; i < 34; i++) {
      const x = (i * 157) % (W + 200) - 100, y = 20 + ((i * 61) % 200);
      g.fillStyle = `rgba(14,5,5,${0.18 + (i % 4) * 0.06})`;
      g.beginPath(); g.ellipse(x, y, 110 + (i % 5) * 26, 16 + (i % 3) * 8, 0, 0, Math.PI * 2); g.fill();
    }
    // 먼 화산 + 분화구 빛
    poly(g, [430, 400, 610, 190, 640, 176, 676, 182, 700, 196, 900, 400], '#2a0f0b');
    glow(g, 655, 180, 90, 'rgba(255,130,40,A)', 0.55);
    poly(g, [-40, 400, 90, 268, 130, 258, 170, 276, 330, 400], '#230c09');
    glow(g, 128, 262, 60, 'rgba(255,110,30,A)', 0.35);
    // 용암 줄기
    g.lineWidth = 4; g.strokeStyle = '#ff7a22';
    for (const [x1, y1, x2, y2, bend] of [[640, 182, 600, 400, -30], [672, 186, 720, 400, 24], [656, 184, 660, 400, 8], [128, 262, 100, 400, -14]]) {
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2 + bend, (y1 + y2) / 2, x2, y2); g.stroke();
    }
    // 용암 폭포 (오른쪽 절벽)
    poly(g, [880, 150, 960, 120, 960, 420, 860, 420], '#1b0a08');
    const fall = g.createLinearGradient(0, 160, 0, 420);
    fall.addColorStop(0, '#ffcb6b'); fall.addColorStop(1, '#e05a18');
    g.fillStyle = fall; g.fillRect(900, 160, 16, 260); g.fillRect(926, 150, 8, 270);
    glow(g, 912, 300, 80, 'rgba(255,120,30,A)', 0.35);

    // 무스타파 채굴 시설 (중경)
    const SIL = '#170a09', RIM = '#5a2414';
    poly(g, [170, 400, 170, 300, 210, 270, 380, 270, 420, 300, 420, 400], SIL);       // 본관
    poly(g, [250, 270, 270, 230, 330, 230, 350, 270], SIL);                           // 지붕 구조물
    g.fillStyle = SIL; g.fillRect(292, 150, 10, 82); g.fillRect(286, 140, 22, 12);    // 첨탑
    poly(g, [440, 400, 440, 330, 470, 316, 560, 316, 560, 400], SIL);                 // 별관
    g.fillRect(500, 200, 8, 118); g.fillRect(494, 190, 20, 12);
    g.fillRect(40, 300, 70, 100); g.fillRect(64, 250, 12, 52);                         // 왼쪽 탑
    // 테두리 빛 (아래 용암에 비친 윗선)
    g.fillStyle = RIM;
    g.fillRect(210, 270, 170, 3); g.fillRect(470, 316, 90, 3); g.fillRect(40, 300, 70, 3);
    // 창문 (주황 불빛)
    g.fillStyle = '#ffb35a';
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) if ((k + r) % 4 !== 0) g.fillRect(190 + k * 24, 296 + r * 24, 10, 8);
    for (let k = 0; k < 4; k++) g.fillRect(456 + k * 24, 336, 10, 8);
    for (let r = 0; r < 3; r++) g.fillRect(56, 316 + r * 22, 10, 8);
    // 파이프
    g.strokeStyle = '#241210'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(420, 350); g.lineTo(440, 350); g.moveTo(110, 360); g.lineTo(170, 360); g.stroke();

    // 뒤쪽 통로 + 관전하는 배틀 드로이드 실루엣
    g.fillStyle = '#120807'; g.fillRect(0, 400, W, 14);
    g.fillStyle = '#3a1a12'; g.fillRect(0, 400, W, 2);
    for (let x = 10; x < W; x += 46) { g.fillStyle = '#120807'; g.fillRect(x, 384, 4, 18); }
    g.fillStyle = '#120807'; g.fillRect(0, 384, W, 3);
    for (const x of [96, 128, 212, 600, 646, 700, 820]) droid(g, x, 400);

    // 플랫폼 지지대
    for (const x of [220, 480, 740]) {
      poly(g, [x - 26, PLAT.top + PLAT.thick, x + 26, PLAT.top + PLAT.thick, x + 14, H, x - 14, H], '#141217');
      g.fillStyle = '#2b262b'; g.fillRect(x - 8, PLAT.top + PLAT.thick, 4, H);
      g.fillStyle = '#5a2414'; g.fillRect(x + 8, PLAT.top + PLAT.thick + 20, 4, H);
    }
    // 플랫폼 본체 (수집 팔 끝 금속 바닥)
    const pg = g.createLinearGradient(0, PLAT.top, 0, PLAT.top + PLAT.thick);
    pg.addColorStop(0, '#5a535b'); pg.addColorStop(0.25, '#383238'); pg.addColorStop(1, '#161317');
    g.fillStyle = pg;
    poly(g, [PLAT.left - 8, PLAT.top, PLAT.right + 8, PLAT.top, PLAT.right - 6, PLAT.top + PLAT.thick, PLAT.left + 6, PLAT.top + PLAT.thick], pg);

    g.setTransform(1, 0, 0, 1, 0, 0);
    quantize(g, c.width, c.height);

    // 디더링 뒤에 선명하게 찍는 디테일 (버퍼 픽셀 단위)
    const L = PLAT.left / 2, R = PLAT.right / 2, T = PLAT.top / 2;
    g.fillStyle = '#aaa4ab'; g.fillRect(L - 4, T, R - L + 8, 1);
    g.fillStyle = '#736c73'; g.fillRect(L - 4, T + 1, R - L + 8, 1);
    for (let x = L + 6; x < R - 4; x += 16) { g.fillStyle = '#201c21'; g.fillRect(x, T + 3, 1, 8); g.fillStyle = '#8f8890'; g.fillRect(x + 3, T + 5, 1, 1); g.fillRect(x + 3, T + 9, 1, 1); }
    // 위험 표시 줄무늬 (양 끝)
    for (const sx of [L - 3, R - 13]) for (let i = 0; i < 16; i++) { g.fillStyle = (Math.floor(i / 2) % 2) ? '#ffcb6b' : '#100506'; g.fillRect(sx + i, T + 2, 1, 2); }
    g.fillStyle = '#ffa83f';
    for (let x = L + 14; x < R; x += 32) g.fillRect(x, T + 7, 2, 1);
    bg = c;
  }

  // 배틀 드로이드(B1) 실루엣
  function droid(g, x, y) {
    g.fillStyle = '#0d0607';
    g.fillRect(x - 3, y - 40, 6, 14);      // 몸통
    g.fillRect(x - 2, y - 26, 2, 26); g.fillRect(x + 1, y - 26, 2, 26); // 다리
    g.fillRect(x - 1, y - 50, 2, 10);      // 목
    g.fillRect(x - 1, y - 54, 11, 4);      // 길쭉한 머리
    g.fillRect(x - 6, y - 38, 2, 16); g.fillRect(x + 4, y - 38, 2, 16); // 팔
  }

  function drawBack(ctx) {
    if (!bg) build();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0, W, H);
  }

  function drawCover(ctx, cw, ch) {
    if (!bg) return;
    ctx.imageSmoothingEnabled = false;
    const k = Math.max(cw / bg.width, ch / bg.height);
    const w = bg.width * k, h = bg.height * k;
    ctx.drawImage(bg, (cw - w) / 2, ch - h, w, h);
    ctx.fillStyle = 'rgba(16,6,4,0.6)';
    ctx.fillRect(0, 0, cw, ch);
  }

  // 앞쪽 용암 (2유닛 = 1픽셀 열 단위 물결)
  const BANDS = [[0, '#ffe9a8'], [2, '#ffcb6b'], [4, '#ffa83f'], [8, '#f5872a'], [14, '#e46a1e'], [22, '#cc5418'], [32, '#b14314'], [44, '#963612']];
  function drawFront(ctx, t) {
    const surf = (x) => Math.floor((LAVA_Y + Math.sin(x * 0.03 + t * 0.04) * 3 + Math.sin(x * 0.011 - t * 0.025) * 3) / 2) * 2;
    ctx.fillStyle = BANDS[6][1]; ctx.fillRect(0, LAVA_Y + 24, W, H);
    ctx.fillStyle = BANDS[7][1]; ctx.fillRect(0, LAVA_Y + 40, W, H);
    for (let x = 0; x < W; x += 2) {
      const y = surf(x);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = BANDS[i][1];
        ctx.fillRect(x, y + BANDS[i][0], 2, BANDS[i + 1][0] - BANDS[i][0]);
      }
    }
    ctx.fillStyle = '#ffcb6b';
    for (let i = 0; i < 12; i++) {
      const x = Math.floor((((i * 113 + t * 0.6) % (W + 80)) - 40) / 2) * 2, y = LAVA_Y + 16 + (i % 3) * 8;
      ctx.fillRect(x, y, 10, 2); ctx.fillRect(x + 10, y - 2, 8, 2); ctx.fillRect(x + 18, y, 8, 2);
    }
  }

  return { build, drawBack, drawCover, drawFront };
})();
