// 파티클: 불꽃(스파크), 용암 불씨, 연기, 먼지
class Effects {
  constructor() { this.p = []; }

  add(o) { if (this.p.length < 600) this.p.push(o); }

  spark(x, y, n = 18, col = '#fff2b0') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = U.rand(2, 9);
      this.add({ t: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: U.rand(14, 30), max: 30, col, g: 0.25 });
    }
  }
  ember(x, y, n = 10, spread = 6) {
    for (let i = 0; i < n; i++) {
      this.add({ t: 'ember', x: x + U.rand(-spread, spread), y: y + U.rand(-spread, spread), vx: U.rand(-1.5, 1.5), vy: U.rand(-3, -0.5), life: U.rand(30, 70), max: 70, size: U.rand(1.2, 3), g: -0.01 });
    }
  }
  smoke(x, y, n = 3) {
    for (let i = 0; i < n; i++) {
      this.add({ t: 'smoke', x: x + U.rand(-3, 3), y, vx: U.rand(-0.4, 0.4), vy: U.rand(-1.2, -0.4), life: U.rand(40, 70), max: 70, size: U.rand(3, 6), g: -0.005 });
    }
  }
  dust(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      this.add({ t: 'dust', x: x + U.rand(-10, 10), y, vx: U.rand(-2, 2), vy: U.rand(-1.5, -0.2), life: U.rand(18, 32), max: 32, size: U.rand(2, 5), g: 0.03 });
    }
  }
  splash(x, y) {
    for (let i = 0; i < 26; i++) {
      this.add({ t: 'ember', x: x + U.rand(-14, 14), y, vx: U.rand(-3, 3), vy: U.rand(-8, -2), life: U.rand(30, 60), max: 60, size: U.rand(2, 4.5), g: 0.25 });
    }
    this.smoke(x, y - 4, 6);
  }

  update() {
    const p = this.p;
    for (let i = p.length - 1; i >= 0; i--) {
      const o = p[i];
      o.vy += o.g; o.x += o.vx; o.y += o.vy;
      if (o.t === 'smoke') o.size += 0.25;
      if (--o.life <= 0) p.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const o of this.p) {
      const a = Math.max(0, o.life / o.max);
      if (o.t === 'smoke') {
        ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#3a3330';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2); ctx.fill();
      } else if (o.t === 'dust') {
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#5d4a40';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const o of this.p) {
      const a = Math.max(0, o.life / o.max);
      if (o.t === 'spark') {
        ctx.globalAlpha = a; ctx.strokeStyle = o.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - o.vx * 1.8, o.y - o.vy * 1.8); ctx.stroke();
      } else if (o.t === 'ember') {
        ctx.globalAlpha = a; ctx.fillStyle = a > 0.5 ? '#ffb347' : '#ff5a1f';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
window.Effects = Effects;
