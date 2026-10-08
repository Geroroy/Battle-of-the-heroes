// 게임 루프, 라운드, 광선검 충돌·절단 판정, 렌더링
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // 저해상도 픽셀 버퍼 (논리 960x540 → 480x270)
    this.buf = document.createElement('canvas');
    this.buf.width = CFG.W / 2; this.buf.height = CFG.H / 2;
    this.bctx = this.buf.getContext('2d');
    this.effects = new Effects();
    this.f = [];
    this.popups = [];
    this.running = false;
    this.paused = false;
    this.frame = 0;
    this.acc = 0;
    this.slow = 0;
    this.shake = 0;
    this.flash = 0;
    this.clashCd = 0;
    this.banner = null;
    this.onMatchEnd = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.dpr = dpr;
    this.scale = Math.min(w / CFG.W, h / CFG.H);
    this.offX = (w - CFG.W * this.scale) / 2;
    this.offY = (h - CFG.H * this.scale) / 2;
  }

  start(cfg) {
    this.cfg = cfg;
    this.f = [new Fighter(0, cfg.p1.char, cfg.p1.skin), new Fighter(1, cfg.p2.char, cfg.p2.skin)];
    this.score = [0, 0];
    this.round = 0;
    this.running = true;
    this.paused = false;
    Input.reset();
    this.startRound();
  }

  stop() {
    this.running = false;
    this.f = [];
    Sfx.stopHum();
  }

  startRound() {
    this.round++;
    this.f[0].reset(260, 1);
    this.f[1].reset(700, -1);
    this.ai = this.cfg.mode === '1p' ? new AI(this.f[1], this.cfg.level) : null;
    this.state = 'countdown';
    this.timer = 0;
    this.slow = 0;
    this.popups = [];
    this.banner = { text: `ROUND ${this.round}`, sub: '', t: 0 };
  }

  opponentOf(f) { return this.f[0] === f ? this.f[1] : this.f[0]; }

  inputFor(side) {
    const idle = { mx: 0, my: 0, ax: 0, ay: 0, aiming: false };
    if (this.state !== 'fight' && this.state !== 'roundEnd') return idle;
    if (this.state === 'roundEnd' && this.f[side].dead) return idle;
    if (this.ai && side === 1) return this.ai.input(this);
    const inp = Input.get(side, this.cfg.mode);
    if (inp.auto) {
      // 2P: 몸은 자동으로 상대와 적당한 거리를 유지
      const me = this.f[side], op = this.opponentOf(me);
      const d = op.pelvis.x - me.pelvis.x, ad = Math.abs(d), s = Math.sign(d) || 1;
      inp.mx = ad > 200 ? s : ad < 125 ? -s * 0.7 : 0;
      const { PLAT } = CFG;
      if ((me.pelvis.x < PLAT.left + 60 && inp.mx < 0) || (me.pelvis.x > PLAT.right - 60 && inp.mx > 0)) inp.mx = 0;
    }
    return inp;
  }

  onLava(f) {
    if (f.dead) return;
    f.kill(this, 'lava');
    f.burning = true;
    f.bladeOn = false;
    this.effects.splash(f.pelvis.x, CFG.LAVA_Y);
    Sfx.lava();
    this.shake = Math.max(this.shake, 8);
  }

  // 광선검의 t 지점(칼날 기준)을 옮기면 손잡이·칼끝 입자로 나눠 전달
  // keepVel=true: 위치만 바로잡고 속도는 그대로 (겹침 해소용)
  pushSaber(f, t, dx, dy, keepVel) {
    const I = Fighter.I, s = U.clamp((CFG.BONE.hilt + t * f.bladeLen) / Fighter.SABER_L, 0, 1);
    for (const [p, w] of [[f.p[I.hilt], 1 - s], [f.p[I.tip], s]]) {
      p.x += dx * w; p.y += dy * w;
      if (keepVel) { p.px += dx * w; p.py += dy * w; }
    }
  }

  clash(a, b) {
    if (!a.bladeActive() || !b.bladeActive()) return false;
    const r = U.segSeg(a.blade, b.blade);
    if (r.d > 8) return false;
    let nx = r.ax - r.bx, ny = r.ay - r.by, l = Math.hypot(nx, ny);
    if (l < 0.01) {
      nx = -(b.blade.y2 - b.blade.y1); ny = b.blade.x2 - b.blade.x1; l = Math.hypot(nx, ny) || 1;
      if ((a.blade.x1 - r.x) * nx + (a.blade.y1 - r.y) * ny < 0) { nx = -nx; ny = -ny; }
    }
    nx /= l; ny /= l;
    const va = a.bladeVel(r.ta), vb = b.bladeVel(r.tb);
    const rel = Math.hypot(va.x - vb.x, va.y - vb.y);
    // 겹침 해소 (속도 변화 없음)
    const sep = (8 - r.d) * 0.5;
    this.pushSaber(a, r.ta, nx * sep, ny * sep, true);
    this.pushSaber(b, r.tb, -nx * sep, -ny * sep, true);
    // 새로 부딪힌 순간에만 한 번 튕겨냄 (속도 충격, 상한 있음)
    if (rel > 4 && this.clashCd <= 0) {
      const k = Math.min(5, rel * 0.25);
      this.pushSaber(a, r.ta, nx * k, ny * k, false);
      this.pushSaber(b, r.tb, -nx * k, -ny * k, false);
      this.effects.spark(r.x, r.y, Math.min(40, 10 + rel * 1.5));
      Sfx.clash();
      this.shake = Math.max(this.shake, Math.min(8, rel * 0.4));
      this.flash = 2;
      this.clashCd = 8;
    } else if (this.frame % 4 === 0) {
      this.effects.spark(r.x, r.y, 2, '#cfe6ff');
    }
    a.recalcBlade(); b.recalcBlade();
    return true;
  }

  cuts(att, tgt) {
    if (!att.bladeActive()) return [];
    const B = att.blade, PB = att.prevBlade || B;
    const paths = [
      { s: B, t: null },
      { s: { x1: PB.x2, y1: PB.y2, x2: B.x2, y2: B.y2 }, t: 1 },
      { s: { x1: (PB.x1 + PB.x2) / 2, y1: (PB.y1 + PB.y2) / 2, x2: (B.x1 + B.x2) / 2, y2: (B.y1 + B.y2) / 2 }, t: 0.5 },
    ];
    const hits = [];
    for (const c of Object.values(tgt.bones)) {
      if (c.cut) continue;
      const a = tgt.p[c.i], b = tgt.p[c.j];
      const bs = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
      let hit = null, ta = 0;
      for (const p of paths) {
        const r = U.segSeg(p.s, bs);
        if (r.d < c.th) { hit = r; ta = p.t === null ? r.ta : p.t; break; }
      }
      if (!hit) continue;
      const v = att.bladeVel(ta);
      const vb = { x: ((a.x - a.px) + (b.x - b.px)) / 2, y: ((a.y - a.py) + (b.y - b.py)) / 2 };
      const rel = Math.hypot(v.x - vb.x, v.y - vb.y);
      const need = Fighter.CUT_V * (c.name === 'torso' ? 1.9 : c.name === 'neck' ? 1.35 : 1);
      if (rel > need) {
        const relv = rel;
        // 몸통: 첫 타격은 지져진 상처만, 두 번째(또는 아주 빠른 일격)에 두 동강
        if (c.name === 'torso' && tgt.wounds < 1 && rel < need * 1.6) {
          if (tgt.woundCd <= 0) {
            tgt.wounds++; tgt.woundCd = 20;
            tgt.addWound(hit.x, hit.y);
            this.effects.spark(hit.x, hit.y, 14, '#ffd27a'); this.effects.smoke(hit.x, hit.y, 4);
            Sfx.cut(); this.shake = Math.max(this.shake, 6);
            this.popups.push({ text: '몸통 부상!', x: hit.x, y: hit.y - 20, t: 0 });
          }
          continue;
        }
        hits.push({ name: c.name, x: hit.x, y: hit.y, v, rel: relv });
      }
      else {
        // 느린 접촉: 지지며 밀어냄
        let nx = (a.x + b.x) / 2 - hit.x, ny = (a.y + b.y) / 2 - hit.y;
        const l = Math.hypot(nx, ny) || 1;
        nx /= l; ny /= l;
        for (const q of [a, b]) { q.x += nx * 1.2; q.y += ny * 1.2; q.px += nx * 0.9; q.py += ny * 0.9; }
        if (this.frame % 5 === 0) { this.effects.spark(hit.x, hit.y, 2, '#ffb070'); this.effects.smoke(hit.x, hit.y, 1); }
      }
    }
    return hits;
  }

  applyCuts(att, tgt, hits) {
    // 한 번 휘두를 때 한 부위씩만 (같은 대상은 10프레임 간격)
    if (tgt.cutCd > 0 || !hits.length) return;
    tgt.cutCd = 10;
    for (const h of hits.slice(0, 1)) {
      if (!tgt.sever(h.name, this, h.x, h.y, h.v)) continue;
      Sfx.cut();
      this.shake = Math.max(this.shake, 10);
      this.flash = 4;
      this.popups = this.popups.filter((p) => p.t < 40);
      this.popups.push({ text: `${Fighter.PART_NAME[h.name]} 절단!`, x: U.clamp(h.x, 80, CFG.W - 80), y: Math.min(h.y - 20, 380), t: 0 });
      try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* ignore */ }
      if (tgt.dead) this.slow = 50;
    }
  }

  bodyPush(a, b) {
    if (a.dead || b.dead) return;
    const I = Fighter.I;
    for (const ia of [I.pelvis, I.neck]) for (const ib of [I.pelvis, I.neck]) {
      const p = a.p[ia], q = b.p[ib];
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), min = 46;
      if (d < min && d > 0.01) {
        const push = (min - d) / 2 / d;
        p.x -= dx * push; q.x += dx * push;
      }
    }
  }

  step() {
    this.frame++;
    if (this.clashCd > 0) this.clashCd--;
    const [a, b] = this.f;
    if (this.state === 'countdown') {
      this.timer++;
      if (this.timer === 20) { a.bladeOn = b.bladeOn = true; Sfx.ignite(); Sfx.startHum(); }
      if (this.timer === 75) { this.state = 'fight'; this.banner = { text: 'FIGHT!', sub: '', t: 0 }; Sfx.beep(true); }
    }
    const ia = this.inputFor(0), ib = this.inputFor(1);
    a.update(this, ia); b.update(this, ib);
    this.bodyPush(a, b);
    if (this.state === 'fight' || this.state === 'roundEnd') {
      // 칼끼리 막혔으면 이번 프레임은 베기 없음 (막기가 의미 있도록)
      if (!this.clash(a, b)) {
        // 같은 프레임에 둘 다 닿으면 더 빠른 칼이 먼저. 그 일격에 죽은 쪽은 반격하지 못한다
        const ha = this.cuts(a, b), hb = this.cuts(b, a);
        const top = (h) => h.reduce((m, x) => Math.max(m, x.rel), 0);
        const order = top(ha) >= top(hb) ? [[a, b, ha], [b, a, hb]] : [[b, a, hb], [a, b, ha]];
        for (const [att, tgt, hits] of order) if (!att.dead) this.applyCuts(att, tgt, hits);
      }
    }
    for (const f of this.f) if (!f.dead && f.disarmT > 75) f.kill(this, 'disarm');

    this.effects.update();
    if (this.frame % 7 === 0) this.effects.ember(U.rand(0, CFG.W), CFG.LAVA_Y, 1, 2);
    if (this.frame % 2 === 0) this.effects.ash(U.rand(-40, CFG.W), -4);
    for (const p of this.popups) p.t++;
    this.popups = this.popups.filter((p) => p.t < 70);
    Sfx.humIntensity(Math.min(1, Math.max(a.tipSpeed(), b.tipSpeed()) / 25));

    if (this.state === 'fight' && (a.dead || b.dead)) {
      let msg, winner = null;
      if (a.dead && b.dead) msg = '무승부';
      else {
        winner = a.dead ? 1 : 0;
        this.score[winner]++;
        msg = `${this.f[winner].data.short} 승리!`;
      }
      const loser = winner === null ? null : this.f[1 - winner];
      const why = !loser ? '' : loser.deathCause === 'lava' ? '용암에 빠졌다!' : loser.deathCause === 'disarm' ? '양팔을 잃었다!' : '';
      this.banner = { text: msg, sub: why, t: 0 };
      this.state = 'roundEnd';
      this.timer = 0;
    } else if (this.state === 'roundEnd') {
      this.timer++;
      if (this.timer === 60) Sfx.stopHum();
      if (this.timer >= 180) {
        const w = this.score.findIndex((s) => s >= CFG.WIN_SCORE);
        if (w >= 0) {
          this.state = 'matchEnd';
          if (this.onMatchEnd) this.onMatchEnd(w);
        } else {
          this.startRound();
        }
      }
    }
    if (this.banner) this.banner.t++;
  }

  tick(dtMs) {
    if (this.running && !this.paused) {
      const scale = this.slow > 0 ? 0.3 : 1;
      if (this.slow > 0) this.slow--;
      this.acc += Math.min(dtMs, 50) / (1000 / 60) * scale;
      while (this.acc >= 1) { this.acc -= 1; this.step(); }
    } else if (!this.running) {
      this.frame++;
      this.effects.update();
      if (this.frame % 7 === 0) this.effects.ember(U.rand(0, CFG.W), CFG.LAVA_Y, 1, 2);
      if (this.frame % 2 === 0) this.effects.ash(U.rand(-40, CFG.W), -4);
    }
    this.render();
  }

  render() {
    const ctx = this.ctx, d = this.dpr, s = this.scale, b = this.bctx;
    let sx = 0, sy = 0;
    if (this.shake > 0 && !this.paused) {
      sx = Math.round(U.rand(-1, 1) * this.shake / 2); sy = Math.round(U.rand(-1, 1) * this.shake / 2);
      this.shake *= 0.85; if (this.shake < 0.5) this.shake = 0;
    }
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.imageSmoothingEnabled = false;
    b.setTransform(0.5, 0, 0, 0.5, sx, sy);
    Arena.drawBack(b, this.frame);
    // 죽은 쪽을 먼저 (산 쪽이 위에)
    const order = [...this.f].sort((p, q) => (q.dead ? 1 : 0) - (p.dead ? 1 : 0));
    for (const f of order) f.draw(b);
    this.effects.draw(b);
    Arena.drawFront(b, this.frame);
    if (this.flash > 0) {
      b.fillStyle = `rgba(255,255,255,${this.flash * 0.05})`;
      b.fillRect(0, 0, CFG.W, CFG.H);
      if (!this.paused) this.flash--;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#100604';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    Arena.drawCover(ctx, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buf, Math.round(this.offX * d), Math.round(this.offY * d), Math.round(CFG.W * s * d), Math.round(CFG.H * s * d));
    if (this.running) {
      ctx.setTransform(s * d, 0, 0, s * d, this.offX * d, this.offY * d);
      this.drawHUD(ctx);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!this.paused && this.state !== 'matchEnd') Input.draw(ctx, d, this.cfg.mode);
    }
  }

  // 픽셀 테두리 상자 (Bloody Bastards 배너 느낌)
  box(ctx, x, y, w, h) {
    ctx.fillStyle = '#140d0b'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#231814'; ctx.fillRect(x, y, w, h);
  }

  drawHUD(ctx) {
    const W = CFG.W, F = "'Galmuri11', monospace";
    ctx.save();
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 2; i++) {
      const f = this.f[i], left = i === 0;
      const label = this.cfg.mode === '1p' && i === 1 ? `CPU · ${f.data.short}` : `P${i + 1} · ${f.data.short}`;
      ctx.font = `bold 18px ${F}`;
      const tw = Math.ceil(ctx.measureText(label).width) + 24;
      const bw = Math.max(tw, 24 + CFG.WIN_SCORE * 24);
      const x = left ? 18 : W - 18 - bw;
      this.box(ctx, x, 14, bw, 52);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#efe4cf';
      ctx.fillText(label, x + 12, 28);
      for (let k = 0; k < CFG.WIN_SCORE; k++) {
        const px = x + 12 + k * 24;
        ctx.fillStyle = '#140d0b'; ctx.fillRect(px, 42, 18, 18);
        ctx.fillStyle = k < this.score[i] ? f.data.blade : '#3a2a22'; ctx.fillRect(px + 2, 44, 14, 14);
        if (k < this.score[i]) { ctx.fillStyle = '#e8f3ff'; ctx.fillRect(px + 4, 46, 4, 4); }
      }
      if (f.lostParts.length && !f.dead) {
        ctx.font = `14px ${F}`;
        ctx.fillStyle = '#ff9a5a';
        ctx.textAlign = left ? 'left' : 'right';
        ctx.fillText(`잃은 부위: ${f.lostParts.join(', ')}`, left ? x : x + bw, 82);
      }
    }

    // 조작 안내 (첫 라운드)
    if (this.state === 'countdown' && this.round === 1) {
      ctx.textAlign = 'center';
      ctx.font = `bold 16px ${F}`;
      const lines = this.cfg.mode === '1p'
        ? ['왼쪽 스틱(WASD): 이동 · 위로 점프 · 아래로 웅크리기', '오른쪽 스틱(방향키/마우스 드래그): 광선검 휘두르기 — 빠르게 휘둘러야 벤다']
        : ['P1: 왼쪽 스틱(WASD) · P2: 오른쪽 스틱(방향키)', '스틱으로 광선검을 휘두르세요 — 빠르게 휘둘러야 벤다'];
      lines.forEach((t, k) => {
        const w = ctx.measureText(t).width + 24;
        this.box(ctx, W / 2 - w / 2, 300 + k * 36, w, 26);
        ctx.fillStyle = '#efe4cf';
        ctx.fillText(t, W / 2, 314 + k * 36);
      });
    }

    // 절단 팝업
    ctx.textAlign = 'center';
    ctx.font = `bold 18px ${F}`;
    for (const p of this.popups) {
      const a = p.t < 50 ? 1 : (70 - p.t) / 20;
      ctx.globalAlpha = a;
      const y = p.y - p.t * 0.6;
      ctx.fillStyle = '#140d0b'; ctx.fillText(p.text, p.x + 2, y + 2);
      ctx.fillStyle = '#ffb347'; ctx.fillText(p.text, p.x, y);
    }
    ctx.globalAlpha = 1;

    // 배너
    const b = this.banner;
    if (b && b.t < 100) {
      const pop = Math.min(1, b.t / 6);
      const alpha = b.t > 80 ? (100 - b.t) / 20 : 1;
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.round(44 * (0.7 + pop * 0.3))}px ${F}`;
      const w = ctx.measureText(b.text).width + 48;
      this.box(ctx, W / 2 - w / 2, 150, w, 64);
      ctx.fillStyle = '#7a2a00'; ctx.fillText(b.text, W / 2 + 3, 185);
      ctx.fillStyle = '#ffe14d'; ctx.fillText(b.text, W / 2, 182);
      if (b.sub) {
        ctx.font = `bold 20px ${F}`;
        ctx.fillStyle = '#ffd0a0';
        ctx.fillText(b.sub, W / 2, 238);
      }
    }
    ctx.restore();
  }
}
window.Game = Game;
