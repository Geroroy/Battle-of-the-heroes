// 무스타파 결투장: 정적 배경(오프스크린 캔버스) + 움직이는 용암
window.Arena = (function () {
  const { W, H, PLAT, LAVA_Y } = CFG;
  let bg = null;

  function mountain(g, pts, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fill();
  }

  // 무스타파 팔레트 (배경을 이 색들로 디더링해 픽셀 아트처럼 만듦)
  const PALETTE = [
    '#070102', '#120304', '#1d0605', '#2a0a07', '#3b0e08', '#53150a', '#6e1e0b', '#8c2b0d', '#a8380f',
    '#c64a12', '#e0621a', '#f5832a', '#ffa83f', '#ffd27a', '#fff0c0',
    '#0b0b0e', '#141418', '#1e1f24', '#2a2b31', '#383a42', '#4c4e58', '#686b76', '#8d909b',
  ].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function quantize(g, w, h) {
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, t = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 22;
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

  function build() {
    const c = document.createElement('canvas');
    c.width = W / 2; c.height = H / 2;
    const g = c.getContext('2d');
    g.scale(0.5, 0.5);

    // 하늘
    const sky = g.createLinearGradient(0, 0, 0, LAVA_Y);
    sky.addColorStop(0, '#0a0203'); sky.addColorStop(0.45, '#33090a'); sky.addColorStop(0.85, '#8f2a0c'); sky.addColorStop(1, '#d0520f');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);

    // 화산재 구름
    for (let i = 0; i < 26; i++) {
      const x = (i * 137) % W, y = 30 + ((i * 53) % 160);
      g.fillStyle = `rgba(10,4,4,${0.12 + (i % 3) * 0.06})`;
      g.beginPath(); g.ellipse(x, y, 90 + (i % 4) * 30, 18 + (i % 3) * 8, 0, 0, Math.PI * 2); g.fill();
    }

    // 먼 화산
    mountain(g, [0, 380, 90, 250, 140, 230, 180, 260, 300, 380], '#2a0c08');
    mountain(g, [560, 380, 700, 210, 740, 200, 790, 230, 960, 380], '#2a0c08');
    mountain(g, [250, 380, 420, 280, 470, 275, 600, 380], '#1f0906');
    // 용암 줄기
    g.strokeStyle = '#ff6a1a'; g.lineWidth = 3; g.globalAlpha = 0.85;
    for (const [x1, y1, x2, y2] of [[140, 232, 120, 380], [740, 202, 770, 380], [745, 205, 700, 380], [460, 278, 470, 380]]) {
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2 + 12, (y1 + y2) / 2, x2, y2); g.stroke();
    }
    g.globalAlpha = 1;
    // 화산 꼭대기 빛
    for (const [x, y] of [[140, 232], [740, 202]]) {
      const r = g.createRadialGradient(x, y, 0, x, y, 60);
      r.addColorStop(0, 'rgba(255,140,40,0.6)'); r.addColorStop(1, 'rgba(255,80,20,0)');
      g.fillStyle = r; g.fillRect(x - 60, y - 60, 120, 120);
    }

    // 무스타파 채굴 시설 실루엣
    g.fillStyle = '#120505';
    g.fillRect(30, 300, 60, 90); g.fillRect(45, 260, 14, 40); g.fillRect(70, 280, 10, 30);
    g.fillRect(860, 290, 80, 100); g.fillRect(880, 240, 16, 50); g.fillRect(912, 265, 10, 30);
    g.fillStyle = '#ff9c3a';
    for (let i = 0; i < 6; i++) { g.fillRect(36 + i * 8, 320, 3, 3); g.fillRect(868 + i * 11, 312, 3, 3); }

    // 플랫폼 지지대
    for (const x of [230, 480, 730]) {
      g.fillStyle = '#17181c';
      g.beginPath();
      g.moveTo(x - 22, PLAT.top + PLAT.thick); g.lineTo(x + 22, PLAT.top + PLAT.thick);
      g.lineTo(x + 12, H); g.lineTo(x - 12, H); g.closePath(); g.fill();
      g.strokeStyle = '#2b2c33'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - 6, PLAT.top + PLAT.thick); g.lineTo(x - 4, H); g.stroke();
    }
    // 플랫폼 본체
    const pg = g.createLinearGradient(0, PLAT.top, 0, PLAT.top + PLAT.thick);
    pg.addColorStop(0, '#4b4c55'); pg.addColorStop(0.2, '#2c2d34'); pg.addColorStop(1, '#141418');
    g.fillStyle = pg;
    g.beginPath();
    g.moveTo(PLAT.left - 6, PLAT.top); g.lineTo(PLAT.right + 6, PLAT.top);
    g.lineTo(PLAT.right - 10, PLAT.top + PLAT.thick); g.lineTo(PLAT.left + 10, PLAT.top + PLAT.thick);
    g.closePath(); g.fill();
    g.fillStyle = '#777a86'; g.fillRect(PLAT.left - 6, PLAT.top, PLAT.right - PLAT.left + 12, 2);
    // 패널 이음새 & 경고등
    g.strokeStyle = '#1b1c21'; g.lineWidth = 1;
    for (let x = PLAT.left + 40; x < PLAT.right; x += 60) {
      g.beginPath(); g.moveTo(x, PLAT.top + 3); g.lineTo(x, PLAT.top + PLAT.thick - 2); g.stroke();
    }
    g.fillStyle = '#ff8a2a';
    for (let x = PLAT.left + 20; x < PLAT.right; x += 60) g.fillRect(x, PLAT.top + 12, 5, 3);

    g.setTransform(1, 0, 0, 1, 0, 0);
    quantize(g, c.width, c.height);
    // 플랫폼 윗면 하이라이트 & 경고등은 디더링 후 선명하게
    g.fillStyle = '#8d909b'; g.fillRect((PLAT.left - 6) / 2, PLAT.top / 2, (PLAT.right - PLAT.left + 12) / 2, 1);
    g.fillStyle = '#ffa83f';
    for (let x = PLAT.left + 20; x < PLAT.right; x += 60) g.fillRect(Math.round(x / 2), PLAT.top / 2 + 6, 2, 1);
    bg = c;
  }

  function drawBack(ctx) {
    if (!bg) build();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0, W, H);
  }

  // 화면 비율이 16:9가 아닐 때 남는 여백을 배경으로 채움
  function drawCover(ctx, cw, ch) {
    if (!bg) return;
    ctx.imageSmoothingEnabled = false;
    const k = Math.max(cw / bg.width, ch / bg.height);
    const w = bg.width * k, h = bg.height * k;
    ctx.drawImage(bg, (cw - w) / 2, ch - h, w, h);
    ctx.fillStyle = 'rgba(18,4,3,0.55)';
    ctx.fillRect(0, 0, cw, ch);
  }

  // 용암: 2유닛(1픽셀) 열 단위로 물결 표면 + 색 띠
  const LAVA_BANDS = [[0, '#fff0c0'], [2, '#ffd27a'], [4, '#ffa83f'], [8, '#f5832a'], [14, '#e0621a'], [22, '#c64a12'], [34, '#a8380f'], [48, '#8c2b0d']];
  function drawLava(ctx, t) {
    const surf = (x) => Math.floor((LAVA_Y + Math.sin(x * 0.03 + t * 0.04) * 3 + Math.sin(x * 0.011 - t * 0.025) * 3) / 2) * 2;
    // 아래쪽 넓은 띠
    ctx.fillStyle = LAVA_BANDS[6][1]; ctx.fillRect(0, LAVA_Y + 26, W, H);
    ctx.fillStyle = LAVA_BANDS[7][1]; ctx.fillRect(0, LAVA_Y + 48, W, H);
    // 표면 (열마다 물결 높이에 맞춰 색 띠)
    for (let x = 0; x < W; x += 2) {
      const y = surf(x);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = LAVA_BANDS[i][1];
        ctx.fillRect(x, y + LAVA_BANDS[i][0], 2, LAVA_BANDS[i + 1][0] - LAVA_BANDS[i][0]);
      }
    }
    // 흐르는 무늬
    ctx.fillStyle = '#ffd27a';
    for (let i = 0; i < 12; i++) {
      const x = Math.floor((((i * 113 + t * 0.6) % (W + 80)) - 40) / 2) * 2, y = LAVA_Y + 18 + (i % 3) * 14;
      ctx.fillRect(x, y, 10, 2); ctx.fillRect(x + 10, y - 2, 8, 2); ctx.fillRect(x + 18, y, 8, 2);
    }
  }

  return { build, drawBack, drawCover, drawLava };
})();
