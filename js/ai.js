// CPU: 거리 유지 + 공격(들어올리기 → 내려베기/옆베기/다리베기) + 막기
class AI {
  constructor(me, level) {
    this.me = me;
    this.cfg = [
      { react: 26, block: 0.15, pause: [120, 200], wind: 22, aimErr: 0.7, rate: 0.1 },   // 쉬움
      { react: 14, block: 0.55, pause: [70, 130], wind: 15, aimErr: 0.3, rate: 0.18 },   // 보통
      { react: 6, block: 0.9, pause: [40, 90], wind: 11, aimErr: 0.12, rate: 0.3 },      // 어려움
    ][level] || null;
    this.state = 'guard';
    this.t = 60;
    this.ang = null;
    this.target = null;
    this.blockT = 0;
    this.phase = Math.random() * Math.PI * 2;
  }

  // 조준 각도를 난이도별 속도로만 돌림 (쉬움일수록 느리고 막기 쉬운 베기)
  input(game) {
    const out = this.decide(game);
    if (!out.aiming) { this.aimA = null; return out; }
    const want = Math.atan2(out.ay, out.ax);
    if (this.aimA === null || this.aimA === undefined) this.aimA = want;
    this.aimA += U.clamp(U.angDiff(this.aimA, want), -this.cfg.rate, this.cfg.rate);
    out.ax = Math.cos(this.aimA); out.ay = Math.sin(this.aimA);
    return out;
  }

  decide(game) {
    const me = this.me, opp = game.opponentOf(me), c = this.cfg;
    const out = { mx: 0, my: 0, ax: 0, ay: 0, aiming: false };
    if (!c || me.dead || !opp) return out;
    const { PLAT } = CFG;
    const pel = me.pelvis, op = opp.pelvis;
    const dx = op.x - pel.x, dist = Math.abs(dx), f = dx >= 0 ? 1 : -1;
    const sh = { x: me.neckP.x, y: me.neckP.y + 12 };

    // 이동: 사거리(약 150) 유지, 가장자리 피하기
    const want = this.state === 'strike' || this.state === 'wind' ? 140 : 225;
    if (!opp.dead) {
      if (dist > want + 25) out.mx = f;
      else if (dist < want - 45) out.mx = -f * 0.8;
    }
    if ((pel.x < PLAT.left + 70 && out.mx < 0) || (pel.x > PLAT.right - 70 && out.mx > 0)) out.mx = 0;
    if (pel.x < PLAT.left + 50) out.mx = 0.8;
    if (pel.x > PLAT.right - 50) out.mx = -0.8;
    if (opp.dead) return out;

    const aimAt = (x, y, err = 0) => {
      const a = Math.atan2(y - sh.y, x - sh.x) + err;
      out.ax = Math.cos(a); out.ay = Math.sin(a); out.aiming = true;
    };

    // 막기: 상대 칼끝이 빠르게 다가오면 칼을 그 사이에 둔다
    const ob = opp.blade;
    if (this.blockT > 0) {
      this.blockT--;
      aimAt((ob.x1 + ob.x2) / 2, (ob.y1 + ob.y2) / 2 - 10);
      return out;
    }
    if (opp.bladeActive() && opp.tipSpeed() > 7 && Math.hypot(ob.x2 - sh.x, ob.y2 - sh.y) < 190 && this.state !== 'strike') {
      if (Math.random() < c.block * 0.25) { this.blockT = 10 + c.react; aimAt((ob.x1 + ob.x2) / 2, (ob.y1 + ob.y2) / 2); return out; }
    }

    this.t--;
    switch (this.state) {
      case 'guard':
        if (this.t <= 0 && dist < 270) {
          // 목표 부위 선택: 머리/목, 몸통, 다리, 팔
          const r = Math.random();
          const head = opp.headP, neck = opp.neckP;
          if (r < 0.35) this.target = { x: neck.x, y: neck.y - 6, kind: 'high' };
          else if (r < 0.6) this.target = { x: (neck.x + op.x) / 2, y: (neck.y + op.y) / 2, kind: 'mid' };
          else if (r < 0.85) this.target = { x: op.x + f * 6, y: op.y + 50, kind: 'low' };
          else this.target = { x: opp.p[Fighter.I.handF].x, y: opp.p[Fighter.I.handF].y, kind: 'arm' };
          void head;
          this.state = 'wind'; this.t = c.wind;
        } else if (this.t <= 0) this.t = 10;
        break;
      case 'wind': {
        // 반대쪽으로 크게 들어올리기
        const a = this.target.kind === 'low' ? -Math.PI / 2 - f * 0.9 : -Math.PI / 2 - f * 0.5;
        out.ax = Math.cos(a); out.ay = Math.sin(a); out.aiming = true;
        if (this.t <= 0) { this.state = 'strike'; this.t = 16; }
        return out;
      }
      case 'strike': {
        const tg = this.target;
        // 목표를 지나 끝까지 휘두르기
        const err = (Math.random() - 0.5) * c.aimErr;
        aimAt(tg.x + f * 40, tg.y + (tg.kind === 'low' ? 40 : 30), err);
        if (this.t <= 0) { this.state = 'guard'; this.t = U.rand(c.pause[0], c.pause[1]); }
        return out;
      }
    }
    // 대기 중: 칼을 세워 방어 자세 (가끔 칼끝으로 견제)
    if (Math.sin(me.time * 0.03 + this.phase) > 0.6) aimAt(opp.neckP.x, opp.neckP.y - 80);
    return out;
  }
}
window.AI = AI;
