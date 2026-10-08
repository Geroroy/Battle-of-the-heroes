// 결투자: 원버튼 물리 (탭 = 상대를 향해 점프 + 회전 + 베기, 공중 1회 추가 점프)
(function () {
  const { PLAT, LAVA_Y, G } = CFG;

  const JUMP_VY = -12, JUMP_VX = 4.6, JUMP_AV = 0.17;
  const AIR_VY = -9.5, AIR_VX = 2.6, AIR_AV = 0.21;
  const SWING_FRAMES = 15;
  const BLADE_LEN = 66, HILT_HALF = 7;
  const FOOT_Y = 39;

  // 피격 판정 원 (로컬 좌표)
  const HIT_CIRCLES = [
    { part: 'head', x: 2, y: -43, r: 14 },
    { part: 'chest', x: 0, y: -17, r: 13 },
    { part: 'pelvis', x: 0, y: 5, r: 12 },
    { part: 'legs', x: 0, y: 26, r: 10 },
  ];
  // 바닥 접촉 원
  const GROUND_PTS = [
    { x: 2, y: -43, r: 14 },
    { x: 0, y: -17, r: 13 },
    { x: 0, y: 5, r: 12 },
    { x: -5, y: 34, r: 5 },
    { x: 7, y: 34, r: 5 },
  ];

  class Fighter {
    constructor(side, charId, skin) {
      this.side = side;
      this.char = charId;
      this.skin = skin;
      this.data = Skins.CHARACTERS[charId];
      this.reset(side === 0 ? 300 : 660, side === 0 ? 1 : -1);
    }

    reset(x, facing) {
      Object.assign(this, {
        x, y: PLAT.top - FOOT_Y, vx: 0, vy: 0, angle: 0, av: 0, facing,
        grounded: true, coyote: 0, airJumps: 1, swing: -1, saberRel: -1.05, tuck: 0,
        dead: false, burning: false, gone: false, bladeOn: false, bladeLen: 0,
        clashCd: 0, tapCd: 0, time: Math.random() * 100, trail: [], blade: null, prevBlade: null,
      });
      this.updateBlade();
      this.prevBlade = null;
    }

    l2w(lx, ly) {
      const px = lx * this.facing, c = Math.cos(this.angle), s = Math.sin(this.angle);
      return { x: this.x + px * c - ly * s, y: this.y + px * s + ly * c };
    }
    dirW(a) {
      const lx = Math.cos(a) * this.facing, ly = Math.sin(a);
      const c = Math.cos(this.angle), s = Math.sin(this.angle);
      return { x: lx * c - ly * s, y: lx * s + ly * c };
    }

    pose() {
      const t = this.tuck;
      return {
        tuck: t,
        hand: Skins.handPos(this.saberRel),
        backHand: { x: U.lerp(-11, -17, t), y: U.lerp(-6 + Math.sin(this.time * 0.08) * 1.5, -24, t) },
        blink: this.time % 200 < 6,
      };
    }

    tap(game) {
      if (this.dead || this.tapCd > 0) return false;
      this.tapCd = 7;
      const opp = game.opponentOf(this);
      if (this.grounded || this.coyote > 0) {
        this.angle = U.wrapAngle(this.angle);
        this.vy = JUMP_VY;
        this.vx = this.facing * JUMP_VX + this.vx * 0.2;
        this.av = this.facing * JUMP_AV;
        this.grounded = false; this.coyote = 0; this.y -= 2;
        game.effects.dust(this.x, PLAT.top, 6);
      } else if (this.airJumps > 0) {
        this.airJumps--;
        if (opp) {
          const f = opp.x >= this.x ? 1 : -1;
          if (f !== this.facing) { this.facing = f; this.angle = -this.angle; }
        }
        this.vy = AIR_VY;
        this.vx = U.clamp(this.vx + this.facing * AIR_VX, -7.5, 7.5);
        this.av = this.facing * AIR_AV;
        game.effects.spark(this.x, this.y + 30, 4, '#9fd0ff');
      }
      if (this.swing < 0 || this.swing > SWING_FRAMES * 0.6) {
        this.swing = 0;
        Sfx.swing();
      }
      return true;
    }

    update(game) {
      if (this.gone) return;
      this.time++;
      if (this.tapCd > 0) this.tapCd--;
      if (this.clashCd > 0) this.clashCd--;

      if (this.dead) {
        if (this.burning) {
          this.y += 0.7; this.angle += this.av * 0.2;
          if (this.time % 3 === 0) game.effects.ember(this.x, LAVA_Y, 2, 14);
          if (this.y > LAVA_Y + 90) this.gone = true;
        }
        return;
      }

      const wasG = this.grounded;
      this.vy = Math.min(this.vy + G, 16);
      this.x += this.vx; this.y += this.vy; this.angle += this.av;
      if (!wasG) { this.av *= 0.993; this.vx *= 0.997; }

      // 바닥 충돌
      let pen = 0, hit = false;
      if (this.vy >= -1) {
        for (const c of GROUND_PTS) {
          const w = this.l2w(c.x, c.y);
          if (w.x > PLAT.left - 4 && w.x < PLAT.right + 4 && w.y + c.r > PLAT.top && w.y - c.r < PLAT.top + 22) {
            pen = Math.max(pen, w.y + c.r - PLAT.top);
            hit = true;
          }
        }
      }
      if (hit) {
        this.y -= pen;
        if (!wasG && this.vy > 5) { game.effects.dust(this.x, PLAT.top, 8); Sfx.thud(); }
        this.vy = this.vy > 5 ? -this.vy * 0.2 : 0;
        this.grounded = true; this.coyote = 6; this.airJumps = 1;
        this.vx *= 0.8;
        const a = U.wrapAngle(this.angle);
        this.angle = a;
        this.av = this.av * 0.5 - a * 0.14;
        if (Math.abs(a) > 1.3 && this.vy === 0) this.vy = -2.5; // 넘어졌을 때 튕겨 일어나기
        const opp = game.opponentOf(this);
        if (opp && !opp.dead && Math.abs(a) < 0.5) {
          const d = opp.x - this.x;
          if (Math.abs(d) > 4) this.facing = d > 0 ? 1 : -1;
        }
      } else {
        this.grounded = false;
        if (this.coyote > 0) this.coyote--;
      }

      // 휘두르기 애니메이션
      const idle = this.grounded ? -1.05 + Math.sin(this.time * 0.05) * 0.06 : -1.35;
      if (this.swing >= 0) {
        const t = this.swing / SWING_FRAMES;
        this.saberRel = t < 0.2 ? U.lerp(idle, -2.5, t / 0.2) : U.lerp(-2.5, 0.9, U.easeOut((t - 0.2) / 0.8));
        if (++this.swing > SWING_FRAMES) this.swing = -1;
      } else {
        this.saberRel += (idle - this.saberRel) * 0.12;
      }
      this.tuck = this.grounded ? Math.max(0, this.tuck - 0.2) : Math.min(1, this.tuck + 0.15);
      this.bladeLen = this.bladeOn ? Math.min(BLADE_LEN, this.bladeLen + 7) : Math.max(0, this.bladeLen - 8);

      if (this.y - 20 > LAVA_Y) game.onLava(this);

      this.updateBlade();
    }

    updateBlade() {
      const h = Skins.handPos(this.saberRel);
      const hw = this.l2w(h.x, h.y);
      const d = this.dirW(this.saberRel);
      this.hilt = { x1: hw.x - d.x * HILT_HALF, y1: hw.y - d.y * HILT_HALF, x2: hw.x + d.x * HILT_HALF, y2: hw.y + d.y * HILT_HALF };
      this.prevBlade = this.blade;
      this.blade = { x1: this.hilt.x2, y1: this.hilt.y2, x2: this.hilt.x2 + d.x * this.bladeLen, y2: this.hilt.y2 + d.y * this.bladeLen };
      this.trail.push({ ...this.blade });
      if (this.trail.length > 6) this.trail.shift();
    }

    bladeSpeed() {
      if (!this.prevBlade) return 0;
      return Math.hypot(this.blade.x2 - this.prevBlade.x2, this.blade.y2 - this.prevBlade.y2);
    }

    // 휘두르는 중이거나 빠르게 회전 중인 검만 치명적
    lethal() {
      return this.swing >= 0 || this.bladeSpeed() > 5;
    }

    // 내 광선검이 target 에 닿았는지 (프레임 사이 터널링 방지용 보간 선분 포함)
    hits(target) {
      if (this.bladeLen < 20 || target.dead) return null;
      const b = this.blade, p = this.prevBlade;
      const segs = [b];
      if (p) {
        segs.push({ x1: p.x2, y1: p.y2, x2: b.x2, y2: b.y2 });
        segs.push({ x1: (p.x1 + p.x2) / 2, y1: (p.y1 + p.y2) / 2, x2: (b.x1 + b.x2) / 2, y2: (b.y1 + b.y2) / 2 });
      }
      for (const c of HIT_CIRCLES) {
        const w = target.l2w(c.x, c.y);
        for (const s of segs) {
          const r = U.pointSeg(w.x, w.y, s.x1, s.y1, s.x2, s.y2);
          if (r.d < c.r + 2) return { part: c.part, x: r.x, y: r.y };
        }
      }
      return null;
    }

    kill(part, game, attacker, hx, hy) {
      this.dead = true;
      this.bladeOn = false;
      const pose = this.pose();
      const push = attacker ? attacker.facing : -this.facing;
      const mk = (parts, px, py, r, cuts, dvx, dvy, dav) => {
        const w = this.l2w(px, py);
        game.pieces.push(new Piece({
          kind: 'body', char: this.char, skin: this.skin, pose, parts, px, py, r, cuts,
          x: w.x, y: w.y, angle: this.angle, facing: this.facing,
          vx: this.vx * 0.5 + dvx, vy: Math.min(this.vy, 0) + dvy, av: this.av * 0.5 + dav,
        }));
      };
      if (part === 'head') {
        mk({ head: true }, 2, -43, 12, [-31], push * U.rand(2, 4), U.rand(-9, -6), U.rand(-0.4, 0.4));
        mk({ legs: true, torso: true, frontArm: true }, 0, -5, 22, [-31], push * 1.5, -2, push * 0.05);
      } else {
        mk({ torso: true, head: true, frontArm: true }, 0, -22, 19, [8], push * U.rand(2.5, 4), U.rand(-7, -4), U.rand(-0.25, 0.25));
        mk({ legs: true }, 0, 22, 15, [8], push * 1, -2, push * 0.08);
      }
      // 떨어지는 광선검 손잡이
      const hc = { x: (this.hilt.x1 + this.hilt.x2) / 2, y: (this.hilt.y1 + this.hilt.y2) / 2 };
      game.pieces.push(new Piece({
        kind: 'hilt', hiltStyle: this.data.hilt, px: 0, py: 0, r: 4, cuts: [], facing: 1,
        x: hc.x, y: hc.y, angle: Math.atan2(this.hilt.y2 - this.hilt.y1, this.hilt.x2 - this.hilt.x1),
        vx: this.vx + U.rand(-3, 3), vy: U.rand(-9, -5), av: U.rand(-0.5, 0.5),
      }));
      game.effects.spark(hx, hy, 26, '#ffd27a');
      game.effects.ember(hx, hy, 14);
      game.effects.smoke(hx, hy, 6);
    }

    draw(ctx) {
      if (this.gone) return;
      const pose = this.pose();
      if (!this.dead || this.burning) {
        ctx.save();
        ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.scale(this.facing, 1);
        Skins.drawBody(ctx, this.char, this.skin, pose, { legs: true, torso: true, head: true });
        ctx.restore();
      }
      if (this.dead) return;
      const h = this.hilt;
      Skins.drawHilt(ctx, h.x1, h.y1, h.x2, h.y2, this.data.hilt);
      ctx.save();
      ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.scale(this.facing, 1);
      Skins.drawBody(ctx, this.char, this.skin, pose, { frontArm: true });
      ctx.restore();
      if (this.bladeLen > 0) {
        if (this.bladeSpeed() > 6) Skins.drawTrail(ctx, this.trail, this.data.blade);
        const b = this.blade;
        Skins.drawBlade(ctx, b.x1, b.y1, b.x2, b.y2, this.data.blade);
      }
    }
  }

  // 잘린 신체 / 떨어진 광선검 조각
  class Piece {
    constructor(o) { Object.assign(this, o); this.t = 0; this.gone = false; this.sinking = false; }

    update(game) {
      if (this.gone) return;
      this.t++;
      if (this.sinking) {
        this.y += 0.8; this.vx *= 0.9; this.x += this.vx;
        if (this.t % 4 === 0) game.effects.ember(this.x, LAVA_Y, 1, 8);
        if (this.y > LAVA_Y + 60) this.gone = true;
        return;
      }
      this.vy += G; this.x += this.vx; this.y += this.vy; this.angle += this.av;
      if (this.vy >= 0 && this.x > PLAT.left && this.x < PLAT.right && this.y + this.r > PLAT.top && this.y - this.r < PLAT.top + 20) {
        this.y = PLAT.top - this.r;
        if (this.vy > 3) game.effects.dust(this.x, PLAT.top, 3);
        this.vy = this.vy > 3 ? -this.vy * 0.3 : 0;
        this.vx *= 0.82; this.av *= 0.75;
      }
      if (this.y > LAVA_Y) {
        this.sinking = true;
        game.effects.splash(this.x, LAVA_Y);
        Sfx.lava();
      }
      // 절단면에서 연기
      if (this.kind === 'body' && this.t < 150 && this.t % 7 === 0) {
        const c = Math.cos(this.angle), s = Math.sin(this.angle);
        const ly = this.cuts[0] - this.py;
        game.effects.smoke(this.x - ly * s, this.y + ly * c, 1);
      }
    }

    draw(ctx) {
      if (this.gone) return;
      ctx.save();
      ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.scale(this.facing, 1);
      ctx.translate(-this.px, -this.py);
      if (this.kind === 'hilt') {
        Skins.drawHilt(ctx, -7, 0, 7, 0, this.hiltStyle);
      } else {
        Skins.drawBody(ctx, this.char, this.skin, this.pose, this.parts);
        // 광선검에 지져진 절단면
        const a = Math.max(0, 1 - this.t / 240);
        if (a > 0) {
          ctx.globalCompositeOperation = 'lighter';
          for (const cy of this.cuts) {
            ctx.globalAlpha = a;
            ctx.fillStyle = '#ff7a20';
            ctx.beginPath(); ctx.ellipse(1, cy, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffe2a0';
            ctx.beginPath(); ctx.ellipse(1, cy, 6, 1.4, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    }
  }

  window.Fighter = Fighter;
  window.Piece = Piece;
})();
