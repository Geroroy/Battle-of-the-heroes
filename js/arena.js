// 무스타파 결투장: 정적 배경(오프스크린 캔버스) + 움직이는 용암
window.Arena = (function () {
  const { W, H, PLAT, LAVA_Y } = CFG;
  let bg = null, bgScale = 0;

  function mountain(g, pts, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fill();
  }

  function build(scale) {
    const c = document.createElement('canvas');
    c.width = Math.round(W * scale); c.height = Math.round(H * scale);
    const g = c.getContext('2d');
    g.scale(scale, scale);

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

    bg = c; bgScale = scale;
  }

  function drawBack(ctx, scale) {
    if (!bg || Math.abs(bgScale - scale) > 0.01) build(scale);
    ctx.drawImage(bg, 0, 0, W, H);
  }

  // 화면 비율이 16:9가 아닐 때 남는 여백을 배경으로 채움
  function drawCover(ctx, cw, ch) {
    if (!bg) return;
    const k = Math.max(cw / bg.width, ch / bg.height);
    const w = bg.width * k, h = bg.height * k;
    ctx.drawImage(bg, (cw - w) / 2, ch - h, w, h);
    ctx.fillStyle = 'rgba(18,4,3,0.55)';
    ctx.fillRect(0, 0, cw, ch);
  }

  function drawLava(ctx, t) {
    // 용암 반사광
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createLinearGradient(0, LAVA_Y - 140, 0, LAVA_Y);
    glow.addColorStop(0, 'rgba(255,90,20,0)'); glow.addColorStop(1, 'rgba(255,90,20,0.18)');
    ctx.fillStyle = glow; ctx.fillRect(0, LAVA_Y - 140, W, 140);
    ctx.restore();

    const lg = ctx.createLinearGradient(0, LAVA_Y - 6, 0, H);
    lg.addColorStop(0, '#ffb238'); lg.addColorStop(0.15, '#ff6a14'); lg.addColorStop(0.6, '#b51d04'); lg.addColorStop(1, '#4d0a02');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) {
      ctx.lineTo(x, LAVA_Y + Math.sin(x * 0.03 + t * 0.04) * 3 + Math.sin(x * 0.011 - t * 0.025) * 3);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // 용암 표면 무늬
    ctx.strokeStyle = 'rgba(255,220,120,0.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const x = ((i * 113 + t * 0.6) % (W + 80)) - 40, y = LAVA_Y + 16 + (i % 3) * 14;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18, y - 4, x + 36, y); ctx.stroke();
    }
  }

  return { build, drawBack, drawCover, drawLava };
})();
