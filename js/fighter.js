// 액티브 래그돌 결투자 (Bloody Bastards 방식)
// - 몸은 Verlet 입자 + 거리 제약(뼈)으로 이루어지고, "근육"이 목표 자세 쪽으로 당겨 서 있게 한다
// - 왼쪽 스틱: 이동(좌우) / 점프(위) / 웅크리기(아래), 오른쪽 스틱: 광선검을 든 팔 조준
// - 광선검이 충분히 빠르게 뼈를 가로지르면 그 뼈가 잘린다 (팔·다리·목·몸통)
(function () {
  const { PLAT, LAVA_Y, G, BONE: L } = CFG;
  const SABER_L = L.hilt + L.blade;
  const STAND_H = (L.thigh + L.shin) * 0.96;
  const CUT_V = 7.5;            // 이 속도(유닛/프레임) 이상으로 휘두른 검만 절단
  const AIM_RATE = 0.3;         // 조준 각도 최대 회전 속도 (rad/프레임)
  const N = ['head', 'neck', 'pelvis', 'elbowB', 'handB', 'elbowF', 'handF', 'kneeB', 'footB', 'kneeF', 'footF', 'hilt', 'tip'];
  const I = Object.fromEntries(N.map((n, i) => [n, i]));
  // 뼈: i = 부모(몸 쪽) 관절, j = 자식. 잘리면 i 를 복제해 자식 쪽을 떼어낸다
  const BONES = [
    { name: 'neck', i: 'neck', j: 'head', len: L.neck, th: 9 },
    { name: 'torso', i: 'pelvis', j: 'neck', len: L.torso, th: 14 },
    { name: 'uarmB', i: 'neck', j: 'elbowB', len: L.uarm, th: 8 },
    { name: 'farmB', i: 'elbowB', j: 'handB', len: L.farm, th: 8 },
    { name: 'uarmF', i: 'neck', j: 'elbowF', len: L.uarm, th: 8 },
    { name: 'farmF', i: 'elbowF', j: 'handF', len: L.farm, th: 8 },
    { name: 'thighB', i: 'pelvis', j: 'kneeB', len: L.thigh, th: 10 },
    { name: 'shinB', i: 'kneeB', j: 'footB', len: L.shin, th: 9 },
    { name: 'thighF', i: 'pelvis', j: 'kneeF', len: L.thigh, th: 10 },
    { name: 'shinF', i: 'kneeF', j: 'footF', len: L.shin, th: 9 },
  ];
  const PART_NAME = {
    neck: '목', torso: '몸통', uarmB: '왼팔', farmB: '왼손', uarmF: '오른팔', farmF: '오른손',
    thighB: '왼다리', shinB: '왼발', thighF: '오른다리', shinF: '오른발',
  };

  class Fighter {
    constructor(side, charId, skin) {
      this.side = side;
      this.char = charId;
      this.skin = skin;
      this.data = Skins.CHARACTERS[charId];
      this.sprites = Skins.parts(charId, skin);
      this.reset(side === 0 ? 330 : 630, side === 0 ? 1 : -1);
    }

    reset(x, facing) {
      const f = facing, gy = PLAT.top, py = gy - STAND_H;
      const ny = py - L.torso;
      const S = { x, y: ny + 10 };
      const ang = this.guardAngle(f);
      const d = { x: Math.cos(ang), y: Math.sin(ang) };
      const hilt = { x: S.x + d.x * 26, y: S.y + d.y * 26 + 10 };
      const pos = {
        head: [x + f * 3, ny - L.neck], neck: [x, ny], pelvis: [x, py],
        elbowB: [x - f * 2, ny + 26], handB: [hilt.x, hilt.y],
        elbowF: [x + f * 8, ny + 28], handF: [hilt.x + d.x * 10, hilt.y + d.y * 10],
        kneeB: [x - f * 4, py + L.thigh * 0.95], footB: [x - f * 14, gy],
        kneeF: [x + f * 14, py + L.thigh * 0.9], footF: [x + f * 18, gy],
        hilt: [hilt.x, hilt.y], tip: [hilt.x + d.x * SABER_L, hilt.y + d.y * SABER_L],
      };
      this.p = N.map((n) => ({ x: pos[n][0], y: pos[n][1], px: pos[n][0], py: pos[n][1] }));
      this.bones = {};
      this.cons = [];
      for (const b of BONES) {
        const c = { i: I[b.i], j: I[b.j], len: b.len, name: b.name, th: b.th, cut: false };
        this.bones[b.name] = c;
        this.cons.push(c);
      }
      this.cons.push({ i: I.hilt, j: I.tip, len: SABER_L });
      this.pins = {
        B: [{ i: I.handB, j: I.hilt, len: 0 }],
        F: [{ i: I.handF, j: I.hilt, len: 10 }, { i: I.handF, j: I.tip, len: SABER_L - 10 }],
      };
      this.cons.push(...this.pins.B, ...this.pins.F);
      Object.assign(this, {
        facing, bodyX: x, aim: ang, jumpCd: 0, step: [null, null], plant: [pos.footB[0], pos.footF[0]],
        armLost: { B: false, F: false }, legLost: { B: false, F: false },
        dead: false, burning: false, deathCause: null, deathT: 0, disarmT: 0,
        bladeOn: false, bladeLen: 0, stumps: [], trail: [], blade: null, prevBlade: null,
        grounded: true, time: 0, lostParts: [], wounds: 0, woundCd: 0, woundMarks: [], cutCd: 0,
      });
      this.updateBlade();
      this.prevBlade = this.blade;
    }

    guardAngle(f) { return f > 0 ? -1.05 : Math.PI + 1.05; }
    get pelvis() { return this.p[I.pelvis]; }
    get neckP() { return this.p[I.neck]; }
    get headP() { return this.p[this.bones.neck.j]; }
    get legs() { return (this.legLost.B ? 0 : 1) + (this.legLost.F ? 0 : 1); }
    get holding() { return !this.armLost.B || !this.armLost.F; }

    // 외부 지지(바닥)로 당기기: 운동량을 만들어도 되는 경우
    pull(p, tx, ty, k, c) {
      const vx = p.x - p.px, vy = p.y - p.py;
      p.x += (tx - p.x) * k - vx * c;
      p.y += (ty - p.y) * k - vy * c;
    }
    // 몸 안의 근육: p 를 당긴 만큼 anchors 를 반대로 밀어 총 운동량 보존 (공중에서 스스로 날아가지 않게)
    pullRel(p, tx, ty, k, c, anchors) {
      let bx = 0, by = 0;
      for (const a of anchors) { bx += a.x - a.px; by += a.y - a.py; }
      bx /= anchors.length; by /= anchors.length;
      const vx = p.x - p.px - bx, vy = p.y - p.py - by;
      const dx = (tx - p.x) * k - vx * c, dy = (ty - p.y) * k - vy * c;
      p.x += dx; p.y += dy;
      const r = 1 / anchors.length;
      for (const a of anchors) { a.x -= dx * r; a.y -= dy * r; }
    }

    // inp: { mx, my, ax, ay, aiming }
    update(game, inp) {
      this.time++;
      if (this.jumpCd > 0) this.jumpCd--;
      if (this.woundCd > 0) this.woundCd--;
      if (this.cutCd > 0) this.cutCd--;
      const gy = PLAT.top;

      // 1) 적분
      for (const p of this.p) {
        const vx = (p.x - p.px) * 0.99, vy = (p.y - p.py) * 0.99;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + G;
      }

      // 2) 근육
      if (!this.dead) this.muscles(game, inp, gy);
      else this.deathT++;
      if (!this.dead && this.armLost.B && this.armLost.F && ++this.disarmT === 1) this.bladeOn = false;

      // 3) 제약 반복 + 바닥
      for (let it = 0; it < 10; it++) {
        for (const c of this.cons) {
          if (c.off) continue;
          const a = this.p[c.i], b = this.p[c.j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          const diff = (d - c.len) / d * 0.5;
          a.x += dx * diff; a.y += dy * diff;
          b.x -= dx * diff; b.y -= dy * diff;
        }
        for (const p of this.p) this.ground(p, gy);
      }

      // 4) 용암
      for (const p of this.p) {
        if (p.y > LAVA_Y + 4) {
          p.px = p.x - (p.x - p.px) * 0.3;
          p.py = p.y - 0.6;
          if (this.time % 9 === 0 && p.y < LAVA_Y + 30) game.effects.ember(p.x, LAVA_Y, 1, 6);
        }
      }
      if (!this.dead && this.pelvis.y > LAVA_Y - 10 && this.p[this.bones.torso.j].y > LAVA_Y - 60) game.onLava(this);

      this.bladeLen = this.bladeOn ? Math.min(L.blade, this.bladeLen + 10) : Math.max(0, this.bladeLen - 9);
      for (const s of this.stumps) {
        s.t++;
        if (s.t < 160 && s.t % 8 === 0) { const p = this.p[s.i]; game.effects.smoke(p.x, p.y, 1); }
      }
      this.updateBlade();
    }

    ground(p, gy) {
      if (p.x > PLAT.left && p.x < PLAT.right && p.y > gy && p.py <= gy + 16) {
        p.y = gy;
        p.px = p.x - (p.x - p.px) * 0.55;
      }
    }

    muscles(game, inp, gy) {
      const P = this.p, pel = P[I.pelvis], neck = P[I.neck];
      const torsoOK = !this.bones.torso.cut, neckOK = !this.bones.neck.cut;
      const legs = this.legs;
      const footOn = (k) => {
        const f = P[I['foot' + k]];
        return !this.legLost[k] && f.y >= gy - 3 && f.x > PLAT.left && f.x < PLAT.right;
      };
      const onGround = footOn('B') || footOn('F') || (legs === 0 && pel.y >= gy - 22 && pel.x > PLAT.left && pel.x < PLAT.right);
      this.grounded = onGround;
      const opp = game.opponentOf(this);
      const f = this.facing;
      const mx = U.clamp(inp.mx || 0, -1, 1), my = U.clamp(inp.my || 0, -1, 1);

      // 상대 쪽 바라보기
      if (opp && onGround) {
        const d = opp.pelvis.x - pel.x;
        if (d * f < -16) { this.facing = -f; this.aim = Math.PI - this.aim; }
      }
      // 걷기
      if (onGround) {
        const sp = legs === 2 ? 2.3 : legs === 1 ? 1.1 : 0.6;
        this.bodyX = U.clamp(this.bodyX + mx * sp, pel.x - 24, pel.x + 24);
      } else {
        this.bodyX = pel.x;
      }
      // 골반 높이
      const crouch = my > 0.35 ? (my - 0.35) * 40 : 0;
      if (onGround) {
        const h = legs === 2 ? STAND_H : legs === 1 ? STAND_H * 0.82 : 20;
        // 발 사이 중심 위로 균형 잡기
        let fx = this.bodyX;
        if (legs === 2) fx = U.lerp(this.bodyX, (P[I.footB].x + P[I.footF].x) / 2, 0.35);
        this.pull(pel, fx, gy - h + crouch, legs ? 0.3 : 0.1, 0.2);
      }
      // 상체 세우기
      if (torsoOK) {
        const k = onGround ? 0.38 : 0.2;
        this.pullRel(neck, pel.x + mx * 6 + f * 2, pel.y - L.torso, k, 0.15, [pel]);
      }
      if (neckOK) this.pullRel(P[I.head], neck.x + f * 3, neck.y - L.neck, 0.35, 0.2, [neck]);
      // 점프
      if (onGround && legs > 0 && my < -0.6 && this.jumpCd <= 0) {
        const pow = legs === 2 ? 11 : 7;
        for (const p of P) { p.py += pow; p.px -= mx * 3; }
        this.jumpCd = 45;
        game.effects.dust(pel.x, gy, 8);
      }
      // 다리
      const vel = pel.x - pel.px;
      ['B', 'F'].forEach((k, li) => {
        if (this.legLost[k]) return;
        const knee = P[I['knee' + k]], foot = P[I['foot' + k]];
        if (onGround && torsoOK) {
          const home = this.bodyX + f * (k === 'F' ? 14 : -12) + vel * 7;
          const other = this.step[1 - li];
          let st = this.step[li];
          if (!st && Math.abs(this.plant[li] - home) > 16 && !other) {
            st = this.step[li] = { t: 0, from: this.plant[li], to: home + Math.sign(home - this.plant[li]) * 6 };
          }
          if (st) {
            st.t += 1 / 8;
            const t = Math.min(1, st.t);
            this.pull(foot, U.lerp(st.from, st.to, t), gy - Math.sin(t * Math.PI) * 14, 0.6, 0.2);
            if (st.t >= 1) { this.plant[li] = st.to; this.step[li] = null; }
          } else if (foot.y >= gy - 2) {
            foot.x += (this.plant[li] - foot.x) * 0.5; foot.px = foot.x;
          } else {
            this.pull(foot, this.plant[li], gy, 0.3, 0.2);
          }
          this.pullRel(knee, (pel.x + foot.x) / 2 + f * 5, (pel.y + foot.y) / 2, 0.3, 0.15, [pel]);
        } else {
          this.step[li] = null;
          this.plant[li] = foot.x;
          if (torsoOK) {
            this.pullRel(foot, pel.x + f * (k === 'F' ? 10 : -6), pel.y + L.thigh + L.shin - 34, 0.1, 0.05, [pel]);
            this.pullRel(knee, pel.x + f * 18, pel.y + L.thigh * 0.7, 0.12, 0.05, [pel]);
          }
        }
      });
      // 팔 & 광선검
      if (this.holding && torsoOK) {
        const target = inp.aiming ? Math.atan2(inp.ay, inp.ax) : this.guardAngle(this.facing);
        const diff = U.angDiff(this.aim, target);
        this.aim += U.clamp(diff, -AIM_RATE, AIM_RATE);
        const d = { x: Math.cos(this.aim), y: Math.sin(this.aim) };
        const tdx = pel.x - neck.x, tdy = pel.y - neck.y, tl = Math.hypot(tdx, tdy) || 1;
        const S = { x: neck.x + tdx / tl * 12, y: neck.y + tdy / tl * 12 };
        // 손은 가슴 앞에서 스틱 방향으로 뻗고, 칼날은 조준 방향을 향함
        const mag = inp.aiming ? Math.min(1, Math.hypot(inp.ax, inp.ay)) : 0.4;
        const reach = 14 + mag * 22;
        const hx = S.x + this.facing * 14 + d.x * reach, hy = S.y + 16 + d.y * reach * 0.8;
        this.pullRel(P[I.hilt], hx, hy, 0.35, 0.22, [neck, pel]);
        this.pullRel(P[I.tip], hx + d.x * SABER_L, hy + d.y * SABER_L, 0.35, 0.22, [neck, pel]);
        for (const k of ['B', 'F']) {
          if (this.armLost[k] || this.bones['uarm' + k].cut) continue;
          const e = P[I['elbow' + k]], h = P[I['hand' + k]];
          this.pullRel(e, (S.x + h.x) / 2 - f * 2, (S.y + h.y) / 2 + 9, 0.1, 0.08, [neck]);
        }
      }
    }

    updateBlade() {
      const h = this.p[I.hilt], t = this.p[I.tip];
      const dx = t.x - h.x, dy = t.y - h.y, l = Math.hypot(dx, dy) || 1;
      const ux = dx / l, uy = dy / l;
      this.prevBlade = this.blade;
      const bx = h.x + ux * L.hilt, by = h.y + uy * L.hilt;
      this.hiltSeg = { x1: h.x, y1: h.y, x2: bx, y2: by };
      this.blade = { x1: bx, y1: by, x2: bx + ux * this.bladeLen, y2: by + uy * this.bladeLen };
      this.trail.push({ ...this.blade });
      if (this.trail.length > 6) this.trail.shift();
    }

    // 충돌 처리로 입자를 옮긴 뒤 칼날 위치만 다시 계산 (이전 프레임 값은 유지)
    recalcBlade() {
      const prev = this.prevBlade, trail = this.trail.slice(0, -1);
      this.updateBlade();
      this.prevBlade = prev;
      this.trail = [...trail, { ...this.blade }];
    }

    bladeActive() { return this.bladeLen > 30; }
    tipSpeed() {
      if (!this.prevBlade) return 0;
      return Math.hypot(this.blade.x2 - this.prevBlade.x2, this.blade.y2 - this.prevBlade.y2);
    }
    // 칼날 위 매개변수 t(0=손잡이 끝,1=칼끝) 지점의 속도
    bladeVel(t) {
      const b = this.blade, p = this.prevBlade || b;
      const vx = U.lerp(b.x1 - p.x1, b.x2 - p.x2, t), vy = U.lerp(b.y1 - p.y1, b.y2 - p.y2, t);
      return { x: vx, y: vy };
    }

    sever(name, game, x, y, kick) {
      const c = this.bones[name];
      if (!c || c.cut) return false;
      c.cut = true;
      const a = this.p[c.i];
      const ni = this.p.length;
      this.p.push({ x: a.x, y: a.y, px: a.px, py: a.py });
      this.stumps.push({ i: c.i, t: 0, bone: name, side: 'body' }, { i: ni, t: 0, bone: name, side: 'part' });
      c.i = ni;
      // 잘린 쪽에 칼의 운동량 일부 전달
      const kids = this.subtree(c.j);
      for (const k of kids) { const p = this.p[k]; p.px -= kick.x * 0.35; p.py -= kick.y * 0.35 + 1.5; }
      this.lostParts.push(PART_NAME[name]);
      if (name === 'neck' || name === 'torso') this.kill(game, 'cut');
      if (name === 'uarmB' || name === 'farmB') this.loseArm('B');
      if (name === 'uarmF' || name === 'farmF') this.loseArm('F');
      if (name === 'thighB' || name === 'shinB') this.legLost.B = true;
      if (name === 'thighF' || name === 'shinF') this.legLost.F = true;
      game.effects.spark(x, y, 22, '#ffd27a');
      game.effects.ember(x, y, 12);
      game.effects.smoke(x, y, 5);
      return true;
    }
    // 몸통 상처: 목→골반 뼈 위의 상대 위치(t)와 좌우 오프셋으로 저장해 몸과 함께 움직이게
    addWound(x, y) {
      const n = this.p[I.neck], c = this.bones.torso, pe = this.p[c.i];
      const dx = pe.x - n.x, dy = pe.y - n.y, l2 = dx * dx + dy * dy || 1;
      const t = U.clamp(((x - n.x) * dx + (y - n.y) * dy) / l2, 0.1, 0.9);
      this.woundMarks.push({ t, age: 0 });
    }
    loseArm(k) {
      if (this.armLost[k]) return;
      this.armLost[k] = true;
      for (const c of this.pins[k]) c.off = true;
    }
    subtree(j) { // 뼈 그래프에서 j 아래 입자들
      const out = new Set([j]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of this.cons) {
          if (!c.name) continue;
          if (out.has(c.i) && !out.has(c.j)) { out.add(c.j); grew = true; }
        }
      }
      return out;
    }

    kill(game, cause) {
      if (this.dead) return;
      this.dead = true;
      this.bladeOn = false; // 손에서 놓친 광선검은 꺼진다
      this.deathCause = cause;
      this.deathT = 0;
    }

    // ---------- 그리기 ----------
    draw(ctx) {
      const P = this.p, S = this.sprites, f = this.facing, B = this.bones;
      const hide = (p) => p.y > LAVA_Y + 50;
      const seg = (name, part, from) => {
        const c = B[name], a = from || P[c.i], b = P[c.j];
        if (hide(a) && hide(b)) return;
        Skins.drawSeg(ctx, part, a.x, a.y, b.x, b.y, f);
      };
      // 어깨 위치: 몸통 방향으로 목에서 조금 아래
      const neck = P[I.neck], tor = B.torso, pe = P[tor.i];
      const tl = Math.hypot(pe.x - neck.x, pe.y - neck.y) || 1;
      const sh = { x: neck.x + (pe.x - neck.x) / tl * 10, y: neck.y + (pe.y - neck.y) / tl * 10 };
      const shB = { x: sh.x - f * 4, y: sh.y }, shF = { x: sh.x + f * 3, y: sh.y + 1 };

      seg('uarmB', S.uarmB, B.uarmB.cut ? null : shB);
      seg('farmB', S.farmB);
      seg('thighB', S.thighB);
      seg('shinB', S.shinB);
      seg('thighF', S.thighF);
      seg('shinF', S.shinF);
      if (!(hide(P[tor.i]) && hide(P[tor.j]))) Skins.drawSeg(ctx, S.torso, P[tor.j].x, P[tor.j].y, P[tor.i].x, P[tor.i].y, f);
      const nb = B.neck;
      if (!hide(P[nb.j])) Skins.drawHead(ctx, S.head, P[nb.j].x, P[nb.j].y, P[nb.i].x, P[nb.i].y, f);
      // 광선검
      const hs = this.hiltSeg;
      if (!hide(P[I.hilt])) Skins.drawHilt(ctx, hs.x1, hs.y1, hs.x2, hs.y2, this.data.hilt);
      seg('uarmF', S.uarmF, B.uarmF.cut ? null : shF);
      seg('farmF', S.farmF);
      if (this.bladeLen > 0 && !hide(P[I.hilt])) {
        if (this.tipSpeed() > 7) Skins.drawTrail(ctx, this.trail, this.data.blade);
        const b = this.blade;
        Skins.drawBlade(ctx, b.x1, b.y1, b.x2, b.y2, this.data.blade);
      }
      // 몸통 상처 (빗금 모양으로 지져진 자국)
      for (const w of this.woundMarks) {
        w.age++;
        const n = P[I.neck], pe2 = P[B.torso.i];
        const x = Skins.q(U.lerp(n.x, pe2.x, w.t)), y = Skins.q(U.lerp(n.y, pe2.y, w.t));
        ctx.fillStyle = Skins.OUT; ctx.fillRect(x - 10, y - 4, 20, 8);
        ctx.fillStyle = w.age < 200 ? '#ff7a20' : '#5a1e10';
        for (let k = -4; k <= 4; k++) ctx.fillRect(x + k * 2, y + Math.round(k * 0.6) - 1, 2, 2);
        if (w.age < 120) { ctx.fillStyle = '#ffe2a0'; ctx.fillRect(x - 2, y - 2, 4, 2); }
      }
      // 지져진 절단면
      for (const s of this.stumps) {
        if (s.t > 240) continue;
        const p = P[s.i];
        if (hide(p)) continue;
        const a = 1 - s.t / 240;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ff7a20'; ctx.fillRect(Skins.q(p.x) - 4, Skins.q(p.y) - 2, 8, 4);
        ctx.fillStyle = '#ffe2a0'; ctx.fillRect(Skins.q(p.x) - 2, Skins.q(p.y) - 2, 4, 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  Fighter.I = I;
  Fighter.SABER_L = SABER_L;
  Fighter.CUT_V = CUT_V;
  Fighter.PART_NAME = PART_NAME;
  window.Fighter = Fighter;
})();
