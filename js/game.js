// 게임 루프, 라운드 진행, 전투 판정, 렌더링
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.effects = new Effects();
    this.pieces = [];
    this.f = [];
    this.running = false;
    this.paused = false;
    this.frame = 0;
    this.acc = 0;
    this.slow = 0;
    this.shake = 0;
    this.flash = 0;
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
    this.ai = cfg.mode === '1p' ? new AI(this.f[1], cfg.level) : null;
    this.score = [0, 0];
    this.round = 0;
    this.running = true;
    this.paused = false;
    this.startRound();
  }

  stop() {
    this.running = false;
    this.f = [];
    this.pieces = [];
    Sfx.stopHum();
  }

  startRound() {
    this.round++;
    this.f[0].reset(300, 1);
    this.f[1].reset(660, -1);
    this.pieces = [];
    this.state = 'countdown';
    this.timer = 0;
    this.slow = 0;
    this.banner = { text: `ROUND ${this.round}`, sub: '', t: 0 };
  }

  opponentOf(f) { return this.f[0] === f ? this.f[1] : this.f[0]; }

  input(side) {
    if (!this.running || this.paused || this.state !== 'fight') return;
    const f = this.f[side];
    if (f) f.tap(this);
  }

  onLava(f) {
    if (f.dead) return;
    f.dead = true; f.burning = true; f.bladeOn = false; f.bladeLen = 0;
    this.effects.splash(f.x, CFG.LAVA_Y);
    Sfx.lava();
    this.shake = Math.max(this.shake, 8);
  }

  combat(a, b) {
    if (a.dead || b.dead) return;
    if (a.bladeLen > 20 && b.bladeLen > 20 && a.clashCd <= 0 && b.clashCd <= 0) {
      const r = U.segSeg(a.blade, b.blade);
      if (r.d < 7) { this.clash(a, b, r); return; }
    }
    let ha = a.hits(b), hb = b.hits(a);
    // 가만히 들고 있는 검은 치명타가 아니라 밀쳐내기만 함 (버티기만 하는 플레이 방지)
    if (ha && !a.lethal()) { this.repel(b, a, ha); ha = null; }
    if (hb && !b.lethal()) { this.repel(a, b, hb); hb = null; }
    if (ha) b.kill(ha.part, this, a, ha.x, ha.y);
    if (hb) a.kill(hb.part, this, b, hb.x, hb.y);
    if (ha || hb) {
      Sfx.cut();
      this.slow = 45; this.shake = 14; this.flash = 6;
      try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) { /* ignore */ }
    }
  }

  clash(a, b, r) {
    for (const f of [a, b]) {
      const o = this.opponentOf(f);
      const away = f.x < o.x ? -1 : 1;
      f.vx = away * 4.5;
      f.vy = Math.min(f.vy, -3.5);
      f.av = -f.av * 0.4 + away * 0.05;
      f.swing = -1;
      f.clashCd = 14;
      f.grounded = false;
    }
    this.effects.spark(r.x, r.y, 28);
    Sfx.clash();
    this.shake = Math.max(this.shake, 6);
    this.flash = 3;
  }

  repel(target, by, hit) {
    if (target.clashCd > 0) return;
    const away = target.x < by.x ? -1 : 1;
    target.vx = away * 5;
    target.vy = Math.min(target.vy, -4);
    target.av += away * 0.08;
    target.swing = -1;
    target.clashCd = 12;
    target.grounded = false;
    this.effects.spark(hit.x, hit.y, 10, '#ffb070');
    Sfx.clash();
  }

  bodyPush(a, b) {
    if (a.dead || b.dead) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dx) < 26 && Math.abs(dy) < 70) {
      const push = (26 - Math.abs(dx)) / 2, s = dx >= 0 ? 1 : -1;
      a.x -= push * s; b.x += push * s;
      a.vx -= s * 0.4; b.vx += s * 0.4;
    }
  }

  step() {
    this.frame++;
    const [a, b] = this.f;
    if (this.state === 'countdown') {
      this.timer++;
      if (this.timer === 20) { a.bladeOn = b.bladeOn = true; Sfx.ignite(); Sfx.startHum(); }
      if (this.timer === 70) { this.state = 'fight'; this.banner = { text: 'FIGHT!', sub: '', t: 0 }; Sfx.beep(true); }
    }
    if (this.state === 'fight' && this.ai) this.ai.update(this);

    a.update(this); b.update(this);
    this.bodyPush(a, b);
    if (this.state === 'fight') this.combat(a, b);

    for (const p of this.pieces) p.update(this);
    this.pieces = this.pieces.filter((p) => !p.gone);
    this.effects.update();
    if (this.frame % 9 === 0) this.effects.ember(U.rand(0, CFG.W), CFG.LAVA_Y, 1, 2);

    Sfx.humIntensity(Math.min(1, Math.max(a.bladeSpeed(), b.bladeSpeed()) / 25));

    if (this.state === 'fight' && (a.dead || b.dead)) {
      let msg, winner = null;
      if (a.dead && b.dead) msg = '무승부';
      else {
        winner = a.dead ? 1 : 0;
        this.score[winner]++;
        msg = `${this.f[winner].data.short} 득점!`;
      }
      const loser = winner === null ? null : this.f[1 - winner];
      this.banner = { text: msg, sub: loser && loser.burning ? '용암에 빠졌다!' : '', t: 0 };
      this.state = 'roundEnd';
      this.timer = 0;
      this.lastWinner = winner;
    } else if (this.state === 'roundEnd') {
      this.timer++;
      if (this.timer === 40) Sfx.stopHum();
      if (this.timer >= 150) {
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
      if (this.frame % 9 === 0) this.effects.ember(U.rand(0, CFG.W), CFG.LAVA_Y, 1, 2);
    }
    this.render();
  }

  render() {
    const ctx = this.ctx, d = this.dpr, s = this.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#120403';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    Arena.drawCover(ctx, this.canvas.width, this.canvas.height);

    let sx = 0, sy = 0;
    if (this.shake > 0 && !this.paused) {
      sx = U.rand(-1, 1) * this.shake; sy = U.rand(-1, 1) * this.shake;
      this.shake *= 0.85; if (this.shake < 0.5) this.shake = 0;
    }
    ctx.setTransform(s * d, 0, 0, s * d, (this.offX + sx * s) * d, (this.offY + sy * s) * d);
    Arena.drawBack(ctx, s * d);

    for (const p of this.pieces) p.draw(ctx);
    for (const f of this.f) f.draw(ctx);
    this.effects.draw(ctx);
    Arena.drawLava(ctx, this.frame);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.05})`;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
      if (!this.paused) this.flash--;
    }
    if (this.running) this.drawHUD(ctx);
  }

  drawHUD(ctx) {
    const W = CFG.W;
    ctx.save();
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    for (let i = 0; i < 2; i++) {
      const f = this.f[i];
      const left = i === 0;
      const x = left ? 24 : W - 24;
      ctx.textAlign = left ? 'left' : 'right';
      ctx.fillStyle = '#ffe9a8';
      const label = this.cfg.mode === '1p' && i === 1 ? `CPU · ${f.data.short}` : `P${i + 1} · ${f.data.short}`;
      ctx.fillText(label, x, 18);
      for (let k = 0; k < CFG.WIN_SCORE; k++) {
        const px = left ? x + 8 + k * 22 : x - 8 - k * 22;
        ctx.beginPath(); ctx.arc(px, 50, 7, 0, Math.PI * 2);
        ctx.fillStyle = k < this.score[i] ? f.data.blade : 'rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,233,168,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // 2P 조작 안내 (첫 라운드 카운트다운)
    if (this.state === 'countdown' && this.round === 1) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      if (this.cfg.mode === '2p') {
        ctx.fillText('P1: 화면 왼쪽 탭 / A키', W * 0.25, 120);
        ctx.fillText('P2: 화면 오른쪽 탭 / L키', W * 0.75, 120);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.setLineDash([6, 8]);
        ctx.beginPath(); ctx.moveTo(W / 2, 90); ctx.lineTo(W / 2, 380); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillText('화면 아무 곳이나 탭 / 스페이스 — 점프 + 베기 (공중에서 한 번 더!)', W / 2, 120);
      }
    }

    // 배너
    const b = this.banner;
    if (b && b.t < 90) {
      const pop = Math.min(1, b.t / 8);
      const alpha = b.t > 70 ? (90 - b.t) / 20 : 1;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(56 * (0.6 + pop * 0.4))}px system-ui, sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(b.text, W / 2, 200);
      ctx.fillStyle = '#ffe14d';
      ctx.shadowColor = '#ff9a2a'; ctx.shadowBlur = 18;
      ctx.fillText(b.text, W / 2, 200);
      ctx.shadowBlur = 0;
      if (b.sub) {
        ctx.font = '700 22px system-ui, sans-serif';
        ctx.fillStyle = '#ffd0a0';
        ctx.fillText(b.sub, W / 2, 248);
      }
    }
    ctx.restore();
  }
}
window.Game = Game;
