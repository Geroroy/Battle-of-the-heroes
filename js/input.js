// 입력: 화면 양쪽 가상 조이스틱 (멀티터치) + 키보드 + 마우스
// 1P: 왼쪽 스틱 = 이동/점프/웅크리기, 오른쪽 스틱 = 광선검 팔 조준
// 2P: 왼쪽 스틱 = P1 광선검, 오른쪽 스틱 = P2 광선검 (걷기는 자동으로 거리 유지)
window.Input = (function () {
  const sticks = [0, 1].map(() => ({ id: null, active: false, bx: 0, by: 0, x: 0, y: 0, hx: 0, hy: 0 }));
  const keys = new Set();
  let R = 60;
  let touchSeen = false;
  try { touchSeen = matchMedia('(pointer: coarse)').matches; } catch (e) { /* ignore */ }

  function layout() {
    const w = innerWidth, h = innerHeight;
    R = Math.max(42, Math.min(w, h) * 0.14);
    sticks[0].hx = Math.max(R * 1.4, w * 0.11); sticks[0].hy = h - R * 1.45;
    sticks[1].hx = w - Math.max(R * 1.4, w * 0.11); sticks[1].hy = h - R * 1.45;
    for (const s of sticks) if (!s.active) { s.bx = s.hx; s.by = s.hy; }
  }

  function move(s, cx, cy) {
    let dx = (cx - s.bx) / R, dy = (cy - s.by) / R;
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    s.x = dx; s.y = dy;
  }

  function attach(el, isRunning) {
    layout();
    addEventListener('resize', layout);
    el.addEventListener('pointerdown', (e) => {
      if (!isRunning()) return;
      e.preventDefault();
      if (e.pointerType === 'touch') touchSeen = true;
      const zone = e.clientX < innerWidth / 2 ? 0 : 1;
      const s = sticks[zone];
      if (s.id !== null) return;
      s.id = e.pointerId; s.active = true;
      // 떠 있는 스틱: 엄지를 댄 곳이 중심 (가장자리에서 너무 멀면 기본 위치 쪽으로)
      s.bx = e.clientX; s.by = e.clientY;
      s.x = 0; s.y = 0;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    const up = (e) => {
      for (const s of sticks) if (s.id === e.pointerId) { s.id = null; s.active = false; s.x = 0; s.y = 0; s.bx = s.hx; s.by = s.hy; }
    };
    el.addEventListener('pointermove', (e) => { for (const s of sticks) if (s.id === e.pointerId) move(s, e.clientX, e.clientY); });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    addEventListener('keydown', (e) => { keys.add(e.code); });
    addEventListener('keyup', (e) => { keys.delete(e.code); });
    addEventListener('blur', () => keys.clear());
  }

  const k = (c) => (keys.has(c) ? 1 : 0);
  function keyVec(up, left, down, right) { return { x: k(right) - k(left), y: k(down) - k(up) }; }

  // mode '1p' | '2p'
  function get(side, mode) {
    if (mode === '1p') {
      const kv = keyVec('KeyW', 'KeyA', 'KeyS', 'KeyD');
      const ka = keyVec('ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight');
      const ki = keyVec('KeyI', 'KeyJ', 'KeyK', 'KeyL');
      const s0 = sticks[0], s1 = sticks[1];
      let ax = s1.x + ka.x + ki.x, ay = s1.y + ka.y + ki.y;
      const kl = Math.hypot(ka.x + ki.x, ka.y + ki.y);
      if (kl > 1) { ax /= kl; ay /= kl; }
      return {
        mx: U.clamp(s0.x + kv.x, -1, 1), my: U.clamp(s0.y + kv.y, -1, 1),
        ax, ay, aiming: Math.hypot(ax, ay) > 0.25,
      };
    }
    const kv = side === 0 ? keyVec('KeyW', 'KeyA', 'KeyS', 'KeyD') : keyVec('ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight');
    const s = sticks[side];
    let ax = s.x + kv.x, ay = s.y + kv.y;
    const l = Math.hypot(ax, ay);
    if (l > 1) { ax /= l; ay /= l; }
    return { mx: 0, my: 0, ax, ay, aiming: l > 0.25, auto: true };
  }

  function reset() { for (const s of sticks) { s.id = null; s.active = false; s.x = 0; s.y = 0; s.bx = s.hx; s.by = s.hy; } }

  // 픽셀 스타일 조이스틱 (화면 좌표, dpr 배율 ctx)
  function draw(ctx, dpr, mode) {
    if (!touchSeen) return;
    const ps = Math.max(2, Math.round(R / 16)) * dpr;
    const snap = (v) => Math.round(v / ps) * ps;
    sticks.forEach((s, i) => {
      const cx = s.bx * dpr, cy = s.by * dpr, r = R * dpr;
      ctx.globalAlpha = s.active ? 0.85 : 0.45;
      // 링
      const n = Math.ceil((2 * Math.PI * r) / ps);
      ctx.fillStyle = '#140d0b';
      for (let a = 0; a < n; a++) {
        const t = (a / n) * Math.PI * 2;
        ctx.fillRect(snap(cx + Math.cos(t) * (r + ps)) - ps, snap(cy + Math.sin(t) * (r + ps)) - ps, ps * 2, ps * 2);
      }
      ctx.fillStyle = '#efe4cf';
      for (let a = 0; a < n; a++) {
        const t = (a / n) * Math.PI * 2;
        ctx.fillRect(snap(cx + Math.cos(t) * r) - ps / 2, snap(cy + Math.sin(t) * r) - ps / 2, ps, ps);
      }
      // 손잡이
      const kx = cx + s.x * r * 0.75, ky = cy + s.y * r * 0.75, kr = r * 0.38;
      for (let y = -kr; y <= kr; y += ps) {
        const w = Math.sqrt(Math.max(0, kr * kr - y * y));
        ctx.fillStyle = '#140d0b';
        ctx.fillRect(snap(kx - w) - ps, snap(ky + y), snap(w * 2) + ps * 2, ps);
      }
      for (let y = -kr + ps; y <= kr - ps; y += ps) {
        const w = Math.sqrt(Math.max(0, (kr - ps) * (kr - ps) - y * y));
        ctx.fillStyle = y < -kr * 0.3 ? '#ffffff' : '#e3d6bd';
        ctx.fillRect(snap(kx - w), snap(ky + y), snap(w * 2), ps);
      }
      // 라벨
      ctx.globalAlpha = s.active ? 0.9 : 0.6;
      ctx.font = `${Math.round(R * 0.26) * dpr}px 'Galmuri11', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#efe4cf';
      const label = mode === '1p' ? (i === 0 ? '이동' : '광선검') : `P${i + 1} 광선검`;
      ctx.fillText(label, s.hx * dpr, (s.hy - R - 10) * dpr);
      ctx.globalAlpha = 1;
    });
  }

  return { attach, get, draw, reset, layout, keys, sticks, get touchSeen() { return touchSeen; } };
})();
