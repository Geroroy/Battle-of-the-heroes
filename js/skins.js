// 캐릭터 & 스킨 정의 + 절차적 렌더링
// 모든 그리기는 "로컬 좌표"(오른쪽을 바라봄, 원점 = 골반 부근, 발바닥 y≈39, 머리 중심 y≈-43)
(function () {
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? (v) => Math.round(v * (1 + amt)) : (v) => Math.round(v + (255 - v) * amt);
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  const SKIN = '#f2c8a2';
  const SKIN_SH = '#d9a17a';

  // 아나킨 (시스의 복수): 검은/짙은 갈색 제다이 튜닉, 검은 장갑(기계 팔)
  const BASE_A = {
    under: '#1a120d', tunic: '#2c1e15', tabard: '#3d2b1e', belt: '#0e0b09', buckle: '#8d8f96',
    pants: '#22170f', boots: '#0d0a08', hair: '#6b4526', glove: '#151515',
  };
  // 오비완 (시스의 복수): 밝은 베이지 튜닉, 갈색 벨트
  const BASE_O = {
    under: '#efe4cc', tunic: '#ddc9a3', tabard: '#c9b085', belt: '#6a4527', buckle: '#b9a27a',
    pants: '#d4bf98', boots: '#3b2a1b', hair: '#a8692f', glove: null,
  };

  const CHARACTERS = {
    anakin: {
      id: 'anakin',
      name: '아나킨 스카이워커',
      short: 'ANAKIN',
      blade: '#3b8cff',
      hilt: 'anakin',
      scar: true,
      winQuote: '"이제는 내가 마스터다."',
      skins: [
        { name: '제다이 복장', sub: '시스의 복수 · 기본', hair: 'long', c: { ...BASE_A } },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', hair: 'long', hood: true, c: { ...BASE_A, robe: '#3a281b' } },
        {
          name: '클론 전쟁 갑옷', sub: '클론 전쟁 · 짧은 머리', hair: 'short', armor: true,
          c: { ...BASE_A, tunic: '#2a211c', tabard: '#352820', armor: '#3c3f46', armorHi: '#666b75', armorLine: '#1e2025' },
        },
      ],
    },
    obiwan: {
      id: 'obiwan',
      name: '오비완 케노비',
      short: 'OBI-WAN',
      blade: '#3b8cff',
      hilt: 'obiwan',
      beard: true,
      winQuote: '"끝났다, 아나킨. 내가 고지를 점했어!"',
      skins: [
        { name: '제다이 복장', sub: '시스의 복수 · 기본', hair: 'obi', c: { ...BASE_O } },
        { name: '제다이 후드', sub: '시스의 복수 · 로브와 후드', hair: 'obi', hood: true, c: { ...BASE_O, robe: '#5a3d26' } },
        {
          name: '클론 전쟁 갑옷', sub: '클론 전쟁 · 클론 아머', hair: 'obiShort', armor: true,
          c: { ...BASE_O, armor: '#eeeeea', armorHi: '#ffffff', armorLine: '#9fa4ab' },
        },
      ],
    },
  };

  // ---------- 기본 도형 ----------
  function seg(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function circ(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function poly(ctx, pts, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fill();
  }
  function rrPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function rrect(ctx, x, y, w, h, r, col, stroke) {
    rrPath(ctx, x, y, w, h, r); ctx.fillStyle = col; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, col, stroke) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  // 광선검 각도(로컬)에 따른 손 위치
  function handPos(rel) {
    const ha = rel * 0.5 + 0.75;
    return { x: 6 + Math.cos(ha) * 15, y: -23 + Math.sin(ha) * 15 };
  }

  // ---------- 신체 부위 ----------
  function drawCloak(ctx, s) {
    poly(ctx, [-11, -31, 12, -31, 17, 2, 19, 30, 4, 35, -12, 34, -21, 28, -17, 0], shade(s.c.robe, -0.2));
  }

  function drawBackArm(ctx, s, pose) {
    const c = s.c;
    const sh = { x: -6, y: -24 }, h = pose.backHand;
    const el = { x: (sh.x + h.x) / 2 - 2, y: (sh.y + h.y) / 2 + 2 };
    const sc = s.hood ? shade(c.robe, -0.3) : shade(c.tunic, -0.3);
    seg(ctx, sh.x, sh.y, el.x, el.y, 8, sc);
    seg(ctx, el.x, el.y, h.x, h.y, 7, sc);
    if (s.armor) {
      seg(ctx, el.x + (h.x - el.x) * 0.15, el.y + (h.y - el.y) * 0.15, el.x + (h.x - el.x) * 0.8, el.y + (h.y - el.y) * 0.8, 7, shade(c.armor, -0.3));
      ellipse(ctx, -6, -25, 7, 5, shade(c.armor, -0.3));
    }
    circ(ctx, h.x, h.y, 3.6, SKIN_SH);
  }

  function drawLegs(ctx, s, pose) {
    const c = s.c, t = pose.tuck;
    const legs = [
      [-4, shade(c.pants, -0.3), shade(c.boots, -0.25), -0.3],
      [5, c.pants, c.boots, 0],
    ];
    for (const [hx, pc, bc, sd] of legs) {
      const kx = hx + 3 + t * 10, ky = 21 - t * 7;
      const fx = hx + t * 3, fy = 36 - t * 12;
      seg(ctx, hx, 6, kx, ky, 10, pc);
      seg(ctx, kx, ky, fx, fy, 9, bc);
      if (s.armor) {
        seg(ctx, kx + (fx - kx) * 0.2, ky + (fy - ky) * 0.2, kx + (fx - kx) * 0.75, ky + (fy - ky) * 0.75, 7, shade(c.armor, sd));
        circ(ctx, kx, ky, 4, shade(c.armor, sd - 0.1));
      }
      rrect(ctx, fx - 3, fy - 2, 12, 6, 3, bc);
    }
  }

  function drawTorso(ctx, s) {
    const c = s.c;
    rrect(ctx, -11, -31, 23, 41, 8, c.under);
    // 겉 튜닉 (V넥)
    poly(ctx, [-11, -28, -6, -31, 0, -14, 0, 9, -11, 9], c.tunic);
    poly(ctx, [12, -28, 7, -31, 1, -14, 1, 9, 12, 9], c.tunic);
    // 타바드
    poly(ctx, [-9, -29, -4, -30, -3, 9, -8, 9], c.tabard);
    poly(ctx, [10, -29, 5, -30, 4, 9, 9, 9], c.tabard);
    // 아래 자락
    poly(ctx, [-12, 8, 13, 8, 15, 21, -14, 21], c.tunic);
    poly(ctx, [-9, 8, -4, 8, -4, 21, -9, 21], c.tabard);
    poly(ctx, [5, 8, 10, 8, 11, 21, 5, 21], c.tabard);

    if (s.armor) {
      rrect(ctx, -10, -28, 21, 17, 5, c.armor, c.armorLine);
      rrect(ctx, -8, -27, 8, 5, 2, c.armorHi);
      seg(ctx, 0.5, -26, 0.5, -13, 1, c.armorLine);
      rrect(ctx, -8, -10, 17, 6, 2, c.armor, c.armorLine);
      seg(ctx, -6, -7, 7, -7, 1, c.armorLine);
    }
    // 벨트
    rrect(ctx, -12, 1, 25, 7, 2, c.belt);
    rrect(ctx, -9, 2, 4, 5, 1, shade(c.belt, 0.15));
    rrect(ctx, 7, 2, 4, 5, 1, shade(c.belt, 0.15));
    rrect(ctx, -2, 2, 5, 5, 1, c.buckle);

    if (s.hood) {
      // 로브 앞자락
      poly(ctx, [-13, -29, -8, -31, -9, 25, -16, 23], c.robe);
      poly(ctx, [14, -29, 9, -31, 10, 25, 17, 23], shade(c.robe, -0.08));
    }
  }

  function drawHair(ctx, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    switch (s.hair) {
      case 'short': // 아나킨 클론 전쟁 시절 짧은 머리
        ctx.arc(2, -43, 15.3, Math.PI * 0.93, Math.PI * 1.97);
        ctx.lineTo(15, -48); ctx.lineTo(11, -50); ctx.lineTo(7, -48); ctx.lineTo(3, -49);
        ctx.lineTo(-3, -45); ctx.lineTo(-8, -44); ctx.lineTo(-11, -38);
        break;
      case 'long': // 아나킨 시스의 복수 긴 머리 (귀를 덮음)
        ctx.arc(2, -43, 16, Math.PI * 0.82, Math.PI * 1.92);
        ctx.lineTo(16.5, -45);
        ctx.quadraticCurveTo(10, -54, 4, -47);
        ctx.lineTo(1, -44); ctx.lineTo(0, -35); ctx.lineTo(-4, -30); ctx.lineTo(-10, -31);
        break;
      case 'obi': // 오비완 넘긴 머리
        ctx.arc(2, -43, 15.5, Math.PI * 0.88, Math.PI * 1.93);
        ctx.lineTo(15, -50);
        ctx.quadraticCurveTo(7, -53, 2, -50);
        ctx.lineTo(-4, -46); ctx.lineTo(-7, -38); ctx.lineTo(-12, -33);
        break;
      case 'obiShort': // 클론 전쟁 오비완 (짧게 정돈)
        ctx.arc(2, -43, 15.2, Math.PI * 0.9, Math.PI * 1.95);
        ctx.lineTo(15, -50);
        ctx.quadraticCurveTo(8, -52, 3, -49);
        ctx.lineTo(-4, -46); ctx.lineTo(-7, -40); ctx.lineTo(-11, -37);
        break;
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawFace(ctx, ch, s, pose) {
    const c = s.c;
    const data = CHARACTERS[ch];
    // 코
    poly(ctx, [15, -46, 18.5, -40, 15, -39], SKIN_SH);
    // 눈 & 눈썹
    if (pose.blink) seg(ctx, 8.5, -45, 12, -45, 1.4, '#1b1410');
    else circ(ctx, 10.5, -45, 1.9, '#1b1410');
    seg(ctx, 7.5, -49.5, 13, -49, 2, shade(c.hair, -0.35));
    // 입
    seg(ctx, 12, -35.5, 15, -36, 1.4, '#8a4a3a');
    if (data.beard) {
      const bc = shade(c.hair, -0.08);
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.moveTo(-1, -41);
      ctx.quadraticCurveTo(0, -30, 9, -28.5);
      ctx.quadraticCurveTo(15.5, -28.5, 16.5, -34);
      ctx.lineTo(15.5, -36.5);
      ctx.quadraticCurveTo(11, -34.5, 8, -36.5);
      ctx.lineTo(4, -39);
      ctx.closePath();
      ctx.fill();
      seg(ctx, 10, -38, 15.5, -38, 2.6, bc);
      seg(ctx, 12, -35, 14.5, -35.2, 1.2, '#8a4a3a');
    }
    if (data.scar) seg(ctx, 11.5, -51, 12.4, -41.5, 1, '#c27f6c');
  }

  function drawHead(ctx, ch, s, pose) {
    const c = s.c;
    seg(ctx, 1, -30, 2, -35, 8, SKIN_SH); // 목
    if (s.hood) {
      const hc = s.c.robe;
      ellipse(ctx, 0, -44, 19, 20, shade(hc, -0.12));
      ellipse(ctx, 6, -42, 11, 13, SKIN);
      // 얼굴 위 그림자
      ctx.save();
      ctx.beginPath(); ctx.ellipse(6, -42, 11, 13, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(40,20,10,0.35)';
      ctx.fillRect(-6, -56, 24, 8);
      if (s.hair === 'long') poly(ctx, [-2, -56, 16, -56, 10, -49, 4, -51, 0, -47], c.hair);
      else poly(ctx, [-2, -56, 16, -56, 12, -51, 5, -52, 0, -49], c.hair);
      ctx.restore();
      ctx.strokeStyle = shade(hc, 0.1); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(6, -42, 12.5, 14.5, 0, Math.PI * 0.4, Math.PI * 1.8); ctx.stroke();
      drawFace(ctx, ch, s, pose);
      return;
    }
    if (s.hair === 'long') {
      // 어깨까지 오는 뒷머리
      ctx.fillStyle = shade(c.hair, -0.15);
      ctx.beginPath();
      ctx.moveTo(-6, -57);
      ctx.quadraticCurveTo(-20, -50, -16, -35);
      ctx.quadraticCurveTo(-15, -26, -5, -27);
      ctx.lineTo(-2, -32); ctx.lineTo(-1, -52);
      ctx.closePath(); ctx.fill();
    }
    circ(ctx, 2, -43, 14, SKIN);
    if (s.hair !== 'long') circ(ctx, -1.5, -41, 3, SKIN_SH); // 귀
    drawHair(ctx, s, c.hair);
    drawFace(ctx, ch, s, pose);
  }

  function drawFrontArm(ctx, ch, s, pose) {
    const c = s.c;
    const sh = { x: 6, y: -23 }, h = pose.hand;
    const el = { x: (sh.x + h.x) / 2 + 1, y: (sh.y + h.y) / 2 + 3 };
    const sleeve = s.hood ? c.robe : c.tunic;
    seg(ctx, sh.x, sh.y, el.x, el.y, 8, sleeve);
    seg(ctx, el.x, el.y, h.x, h.y, 7, sleeve);
    if (s.armor) {
      seg(ctx, el.x + (h.x - el.x) * 0.15, el.y + (h.y - el.y) * 0.15, el.x + (h.x - el.x) * 0.78, el.y + (h.y - el.y) * 0.78, 7, c.armor);
      ellipse(ctx, 6, -25, 7.5, 5.5, c.armor, c.armorLine);
    } else {
      // 제다이 소매 끝 (넓은 소매)
      circ(ctx, el.x + (h.x - el.x) * 0.7, el.y + (h.y - el.y) * 0.7, 5, sleeve);
    }
    circ(ctx, h.x, h.y, 4, c.glove || SKIN);
  }

  const ALL = { legs: true, torso: true, head: true, frontArm: true };

  function drawBody(ctx, ch, skinIdx, pose, parts) {
    const s = CHARACTERS[ch].skins[skinIdx];
    const p = parts || ALL;
    if (p.torso && s.hood) drawCloak(ctx, s);
    if (p.torso) drawBackArm(ctx, s, pose);
    if (p.legs) drawLegs(ctx, s, pose);
    if (p.torso) drawTorso(ctx, s);
    if (p.head) drawHead(ctx, ch, s, pose);
    if (p.frontArm) drawFrontArm(ctx, ch, s, pose);
  }

  // ---------- 광선검 ----------
  function drawHilt(ctx, x1, y1, x2, y2, style) {
    const dx = x2 - x1, dy = y2 - y1;
    seg(ctx, x1, y1, x2, y2, 5, '#c9ccd2');
    seg(ctx, x1 + dx * 0.25, y1 + dy * 0.25, x1 + dx * 0.62, y1 + dy * 0.62, 5.6, '#1b1b1d');
    if (style === 'anakin') {
      for (let i = 0; i < 3; i++) {
        const t = 0.32 + i * 0.1;
        circ(ctx, x1 + dx * t, y1 + dy * t, 1.3, '#555a61');
      }
    } else {
      seg(ctx, x1 + dx * 0.66, y1 + dy * 0.66, x1 + dx * 0.74, y1 + dy * 0.74, 6.2, '#8a7a55');
    }
    seg(ctx, x1 + dx * 0.85, y1 + dy * 0.85, x2, y2, 6.4, '#9da2aa');
    circ(ctx, x1, y1, 2.8, '#8f949c');
  }

  function drawBlade(ctx, x1, y1, x2, y2, col) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.16; ctx.lineWidth = 17;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.globalAlpha = 0.4; ctx.lineWidth = 9;
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 4;
    ctx.strokeStyle = '#eef6ff';
    ctx.stroke();
    ctx.restore();
  }

  function drawTrail(ctx, trail, col) {
    if (trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col;
    for (let i = 0; i < trail.length - 1; i++) {
      const a = trail[i], b = trail[i + 1];
      ctx.globalAlpha = ((i + 1) / trail.length) * 0.22;
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.lineTo(b.x2, b.y2); ctx.lineTo(b.x1, b.y1);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // 캐릭터 선택 화면 미리보기
  function drawPreview(ctx, ch, skinIdx, t, w, h) {
    ctx.clearRect(0, 0, w, h);
    const data = CHARACTERS[ch];
    ctx.save();
    const sc = h / 150;
    ctx.translate(w / 2 - 12 * sc, h * 0.66);
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(2, 40, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
    const rel = -1.05 + Math.sin(t * 2) * 0.08;
    const hand = handPos(rel);
    const pose = { tuck: 0, hand, backHand: { x: -11, y: -6 + Math.sin(t * 2.2) * 1.2 }, blink: t % 3.2 < 0.12 };
    drawBody(ctx, ch, skinIdx, pose, { legs: true, torso: true, head: true });
    const d = { x: Math.cos(rel), y: Math.sin(rel) };
    drawHilt(ctx, hand.x - d.x * 7, hand.y - d.y * 7, hand.x + d.x * 7, hand.y + d.y * 7, data.hilt);
    drawBody(ctx, ch, skinIdx, pose, { frontArm: true });
    drawBlade(ctx, hand.x + d.x * 7, hand.y + d.y * 7, hand.x + d.x * 73, hand.y + d.y * 73, data.blade);
    ctx.restore();
  }

  window.Skins = { CHARACTERS, drawBody, drawHilt, drawBlade, drawTrail, drawPreview, handPos, shade };
})();
