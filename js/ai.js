// CPU 상대: 시뮬레이션으로 튜닝한 탭 타이밍 규칙
// - 상대가 공중에서 가까이 오면 맞받아 점프 (카운터)
// - 적당한 거리(140~220)에서 선제 점프, 멀면 다가가기
// - 낙하 중 가까우면 공중 점프로 베기, 플랫폼 밖으로 떨어지면 공중 점프로 복귀
class AI {
  constructor(me, level) {
    this.me = me;
    // react: 판단 지연(프레임), skill: 규칙대로 행동할 확률, save: 낙사 회피 확률
    this.cfg = [
      { react: 22, skill: 0.35, save: 0.35 }, // 쉬움
      { react: 7, skill: 0.75, save: 0.8 },  // 보통
      { react: 2, skill: 1.0, save: 1.0 },   // 어려움
    ][level] || null;
    this.cd = 30;
    this.pending = 0;
  }

  decide(me, opp) {
    const { PLAT } = CFG;
    const d = Math.abs(opp.x - me.x);
    const c = this.cfg;
    if (me.grounded) {
      if (Math.abs(U.wrapAngle(me.angle)) > 1.2) return Math.random() < 0.1;
      const landX = me.x + me.facing * 200;
      const safe = landX > PLAT.left + 30 && landX < PLAT.right - 30;
      if (!opp.grounded && d < 90) return Math.random() < 0.45 * c.skill;
      if (opp.grounded && d > 140 && d < 220) return Math.random() < 0.03 * c.skill;
      if (opp.grounded && d >= 220) return Math.random() < (safe ? 0.012 : 0.003);
      if (opp.grounded && d <= 140) return Math.random() < 0.008;
      // 실력이 낮을수록 엉뚱한 타이밍에 탭
      return Math.random() < 0.006 * (1 - c.skill);
    }
    if (me.airJumps <= 0) return false;
    if ((me.x < PLAT.left + 10 || me.x > PLAT.right - 10) && me.vy > 0) return Math.random() < c.save;
    if (d < 65 && me.vy > 0) return Math.random() < 0.21 * c.skill;
    return false;
  }

  update(game) {
    const me = this.me, opp = game.opponentOf(me);
    if (!this.cfg || me.dead || !opp || opp.dead) return;
    // 판단 후 반응 지연을 두고 실행
    if (this.pending > 0) {
      if (--this.pending === 0) game.input(me.side);
      return;
    }
    if (this.cd > 0) { this.cd--; return; }
    if (this.decide(me, opp)) {
      this.pending = Math.max(1, Math.round(this.cfg.react * (0.5 + Math.random())));
      this.cd = 8;
    }
  }
}
window.AI = AI;
