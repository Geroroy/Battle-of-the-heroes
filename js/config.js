// 전역 설정 & 수학 유틸
window.CFG = {
  W: 960,
  H: 540,
  PLAT: { left: 150, right: 810, top: 400, thick: 24 },
  LAVA_Y: 478,
  G: 0.55,
  WIN_SCORE: 5,
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
        return { d: 0, x: a.x1 + d1x * t, y: a.y1 + d1y * t };
      }
    }
    const c = [
      U.pointSeg(a.x1, a.y1, b.x1, b.y1, b.x2, b.y2),
      U.pointSeg(a.x2, a.y2, b.x1, b.y1, b.x2, b.y2),
      U.pointSeg(b.x1, b.y1, a.x1, a.y1, a.x2, a.y2),
      U.pointSeg(b.x2, b.y2, a.x1, a.y1, a.x2, a.y2),
    ];
    return c.reduce((m, r) => (r.d < m.d ? r : m));
  },
};
