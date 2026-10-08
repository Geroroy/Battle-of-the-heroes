// 전역 설정 & 수학 유틸
window.CFG = {
  W: 960,
  H: 540,
  PLAT: { left: 130, right: 830, top: 446, thick: 24 },
  LAVA_Y: 496,
  G: 0.5,
  WIN_SCORE: 3,
  // 래그돌 뼈 길이 (논리 좌표, 스프라이트 1픽셀 = 2유닛)
  BONE: { neck: 30, torso: 84, uarm: 40, farm: 40, thigh: 52, shin: 54, hilt: 24, blade: 124 },
};

window.U = {
  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  rand: (a, b) => a + Math.random() * (b - a),
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  },
  // 점과 선분 사이 최단 거리 (+ 가장 가까운 점)
  angDiff(a, b) { return U.wrapAngle(b - a); },
  pointSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const x = x1 + dx * t, y = y1 + dy * t;
    return { d: Math.hypot(px - x, py - y), x, y };
  },
  // 두 선분 사이 최단 거리 (교차하면 0)
  segSeg(a, b) {
    const d1x = a.x2 - a.x1, d1y = a.y2 - a.y1;
    const d2x = b.x2 - b.x1, d2y = b.y2 - b.y1;
    const den = d1x * d2y - d1y * d2x;
    if (Math.abs(den) > 1e-6) {
      const t = ((b.x1 - a.x1) * d2y - (b.y1 - a.y1) * d2x) / den;
      const u = ((b.x1 - a.x1) * d1y - (b.y1 - a.y1) * d1x) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const x = a.x1 + d1x * t, y = a.y1 + d1y * t;
        return { d: 0, x, y, ta: t, tb: u, ax: x, ay: y, bx: x, by: y };
      }
    }
    // 끝점-선분 4가지 중 최단 (ta/tb = 각 선분 위 매개변수, ax/ay·bx/by = 각 선분 위 최근접점)
    const proj = (px, py, x1, y1, dx, dy) => {
      const l2 = dx * dx + dy * dy;
      let t = l2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
      return t < 0 ? 0 : t > 1 ? 1 : t;
    };
    const cand = [];
    let t = proj(a.x1, a.y1, b.x1, b.y1, d2x, d2y); cand.push([0, t]);
    t = proj(a.x2, a.y2, b.x1, b.y1, d2x, d2y); cand.push([1, t]);
    t = proj(b.x1, b.y1, a.x1, a.y1, d1x, d1y); cand.push([t, 0]);
    t = proj(b.x2, b.y2, a.x1, a.y1, d1x, d1y); cand.push([t, 1]);
    let best = null;
    for (const [ta, tb] of cand) {
      const ax = a.x1 + d1x * ta, ay = a.y1 + d1y * ta, bx = b.x1 + d2x * tb, by = b.y1 + d2y * tb;
      const d = Math.hypot(ax - bx, ay - by);
      if (!best || d < best.d) best = { d, x: (ax + bx) / 2, y: (ay + by) / 2, ta, tb, ax, ay, bx, by };
    }
    return best;
  },
};
