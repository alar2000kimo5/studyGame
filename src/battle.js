// 戰鬥場景：拖曳換位 → 英雄依序行動 → 怪物行動 → 下一回合
(function (DH) {
  const C = DH.CONFIG, G = DH.Grid, PAL = DH.PALETTE, S = DH.shapes;
  const UI_wrap = (ctx, text, x, y, w, lh) => DH.UI.wrap(ctx, text, x, y, w, lh);
  DH.timeScale = 1;
  const sleep = ms => new Promise(r => setTimeout(r, ms * DH.timeScale));
  DH.sleep = sleep;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  class Battle {
    constructor(game, dungeon, heroDefs) {
      this.game = game; this.dungeon = dungeon; this.theme = DH.THEMES[dungeon.theme];
      this.time = 0; this.turn = 1; this.stageIdx = 0; this.state = 'idle'; this.dead = false;
      this.fx = new DH.FX(); this.log = []; this.info = null; this.banner = null;
      this.terrain = (dungeon.terrain || Array.from({ length: C.ROWS }, () => '.'.repeat(C.COLS))).map(row => row.split(''));
      this.obstacles = new Set();
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) if ('#R'.includes(this.terrain[r][c])) this.obstacles.add(G.key(c, r));
      this.scaleM = dungeon.scale || null;
      const defs = (heroDefs && heroDefs.length) ? heroDefs : dungeon.heroes;
      const n = defs.length, c0 = Math.floor((C.COLS - n) / 2);
      // 起始格：優先最底列靠中間的非虛空格，不夠再往上一列
      const startCells = [];
      for (const r of [C.HERO_ROW, C.HERO_ROW - 1, C.HERO_ROW - 2]) for (const c of [3, 2, 4, 1, 5, 0, 6]) if (startCells.length < n && !'X#RW'.includes(this.terrain[r][c]) && !startCells.some(p => p[0] === c && p[1] === r)) startCells.push([c, r]);
      startCells.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
      this.heroes = defs.map((d, i) => new DH.Hero(d, startCells[i] || [c0 + i, C.HERO_ROW]));
      this.moveTime = C.MOVE_TIME + (this.heroes.some(h => h.has('swift')) ? 1 : 0) + Math.max(0, ...this.heroes.map(h => h.hasSig('drag_time') ? h.sigParam(0) * h.sig.scale : 0));
      this.movedSet = new Set(); this.reward = null;
      this.turnOrder = this.heroes.slice(); this.turnOrder.forEach((h, i) => h.order = i + 1);
      this.monsters = [];
      this.drag = null; this.stars = 0; this.buttons = [];
      this.auto = false; this.autoWait = 0;
      this.spawnStage(0, true);
      this.waveStart();
      this.addLog(`${dungeon.name}　第 1 波`);
    }

    // ── 查詢 ──────────────────────────────────────────
    allUnits() { return this.heroes.concat(this.monsters); }
    unitAt(c, r) { return this.allUnits().find(u => u.alive && u.col === c && u.row === r) || null; }
    isObstacle(c, r) { return this.obstacles.has(G.key(c, r)); }
    tAt(c, r) { return G.inBounds(c, r) ? this.terrain[r][c] : '#'; }
    ignoresTerrain(u) { return u.flying || u.hasSig('terrain_immune'); }
    canEnter(u, c, r) { if (!G.inBounds(c, r)) return false; const t = this.tAt(c, r); if (t === '#' || t === 'R' || t === 'X') return false; if (t === 'W' && !u.flying) return false; return true; }
    isTrap(c, r) { return DH.TRAPS.includes(this.tAt(c, r)); }
    // 炸彈：踩到就爆，波及周圍八格，之後消失
    triggerBomb(u, c, r) {
      if (this.tAt(c, r) !== 'E' || this.ignoresTerrain(u)) return;
      this.terrain[r][c] = '.';
      const center = G.cellCenter(c, r);
      this.fx.burst(center.x, center.y, '#ff7a3a', 18); this.fx.ring(center.x, center.y, '#ffb03a');
      const victims = [u].concat(G.neighbors8([c, r]).map(p => this.unitAt(p[0], p[1])).filter(v => v && v !== u));
      for (const v of victims) { const dmg = Math.max(1, Math.round(v.maxHp * 0.20)); v.takeDamage(dmg); this.fx.text(v.x, v.y - 30, `-${dmg}`, '#ff9a3a', { size: 18 }); }
      this.addLog(`${u.name} 踩到炸彈！`);
    }
    // 停在格子上的陷阱：尖刺、傳送門
    landTrap(u) {
      if (!u.alive || this.ignoresTerrain(u)) return;
      const t = this.tAt(u.col, u.row);
      if (t === 'S') { const dmg = Math.max(1, Math.round(u.maxHp * 0.15)); u.takeDamage(dmg); this.fx.text(u.x, u.y - 30, `-${dmg}`, '#d8d8e8', { size: 18 }); this.fx.text(u.x, u.y - 50, '尖刺', '#d8d8e8', { size: 12, dur: 0.9 }); }
      else if (t === 'T') {
        let other = null;
        for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) if (this.terrain[r][c] === 'T' && (c !== u.col || r !== u.row)) other = [c, r];
        if (other && !this.unitAt(other[0], other[1])) { this.fx.ring(u.x, u.y, '#c79af0'); u.setCell(other[0], other[1]); u.snap(); this.fx.ring(u.x, u.y, '#c79af0'); this.fx.text(u.x, u.y - 50, '傳送', '#c79af0', { size: 12, dur: 0.9 }); }
      }
    }
    moveCost(u, c, r) { return this.tAt(c, r) === 'M' && !this.ignoresTerrain(u) ? 2 : 1; }
    isFree(c, r, u) { return G.inBounds(c, r) && (u ? this.canEnter(u, c, r) : !'#RWX'.includes(this.tAt(c, r))) && !this.unitAt(c, r); }
    // 冰：從 from 往 dir 方向進入 cell 後持續滑行，回傳停下的格子
    slideOnIce(u, cell, dir) {
      if (this.ignoresTerrain(u)) return cell;
      let cur = cell, n = 0;
      while (this.tAt(cur[0], cur[1]) === 'I' && n++ < 12) {
        const next = [cur[0] + dir[0], cur[1] + dir[1]];
        if (!this.canEnter(u, next[0], next[1]) || this.unitAt(next[0], next[1])) break;
        cur = next;
      }
      return cur;
    }
    aliveMonsters() { return this.monsters.filter(m => m.alive); }
    aliveHeroes() { return this.heroes.filter(h => h.alive); }
    addLog(s) { this.log.push(s); if (this.log.length > 3) this.log.shift(); }

    // 每波開始：專武的開場護盾／全隊回復
    waveStart() {
      for (const h of this.aliveHeroes()) {
        if (h.hasSig('shield_start')) h.shieldHp = Math.max(h.shieldHp, Math.round(h.maxHp * h.sigPct(0)));
        if (h.hasSig('wave_heal')) for (const a of this.aliveHeroes()) a.heal(Math.round(a.maxHp * h.sigPct(0)));
      }
    }
    spawnStage(idx, first) {
      for (const sp of this.dungeon.stages[idx]) {
        let pos = sp.pos;
        const probe = new DH.Monster(sp.id, pos, this.scaleM);
        if (!this.isFree(pos[0], pos[1], probe) || (!probe.flying && 'FISPET'.includes(this.tAt(pos[0], pos[1])))) {
          let found = null;
          for (let r = 0; r < C.ROWS && !found; r++) for (let dc = 0; dc < C.COLS && !found; dc++) {
            const c = (pos[0] + (dc % 2 ? -1 : 1) * Math.ceil(dc / 2) + C.COLS) % C.COLS;
            if (this.isFree(c, r, probe) && (probe.flying || !'FISPET'.includes(this.tAt(c, r)))) found = [c, r];
          }
          pos = found || pos;
        }
        const m = new DH.Monster(sp.id, pos, this.scaleM);
        m.dropY = first ? 0 : 260 + Math.random() * 120;
        this.monsters.push(m);
      }
    }

    // ── 輸入 ──────────────────────────────────────────
    pointerDown(x, y) {
      for (const b of this.buttons) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.onClick(); return; }
      if (this.state !== 'idle') return;
      if (y < 100 && x < 70) { this.game.showCampaign(); return; }
      if (this.auto && G.pixelToCell(x, y)) { const cu = this.unitAt(...G.pixelToCell(x, y)); if (cu && cu.side === 'hero') this.auto = false; }
      const cell = G.pixelToCell(x, y);
      if (cell) {
        const u = this.unitAt(cell[0], cell[1]);
        if (u && u.side === 'hero') { this.startDrag(u, x, y); return; }
        const t = this.tAt(cell[0], cell[1]);
        this.info = u || (t !== '.' ? { terrain: t } : null); return;
      }
      // 底部英雄卡
      const card = this.heroCardAt(x, y);
      if (card) { this.info = card; return; }
      this.info = null;
    }
    pointerMove(x, y) { if (this.drag) { this.drag.px = x; this.drag.py = y; this.dragStep(x, y); } }
    pointerUp() { if (this.drag) this.endDrag(); }

    startDrag(hero, x, y) {
      hero.lifted = true;
      this.drag = { hero, start: hero.pos, last: hero.pos, swaps: [], changed: false, px: x, py: y, timer: this.moveTime };
      this.state = 'drag'; this.info = null;
    }
    dragStep(x, y) {
      const d = this.drag, hero = d.hero;
      const cell = G.pixelToCell(Math.max(C.BOARD_X, Math.min(C.BOARD_X + C.COLS * C.CELL - 1, x)), Math.max(C.BOARD_Y, Math.min(C.BOARD_Y + C.ROWS * C.CELL - 1, y)));
      if (!cell) return;
      // 滑過冰面後，指標還停在那片冰上時不再反覆進入
      if (d.lock && d.lock[0] === cell[0] && d.lock[1] === cell[1]) return;
      d.lock = null;
      let guard = 0;
      while ((cell[0] !== d.last[0] || cell[1] !== d.last[1]) && guard++ < 16) {
        const step = [d.last[0] + Math.sign(cell[0] - d.last[0]), d.last[1] + Math.sign(cell[1] - d.last[1])];
        const res = this.tryStep(step);
        if (!res) break;
        if (res === 'slid') { d.lock = cell; break; }
      }
    }
    tryStep(to) {
      const d = this.drag, hero = d.hero, from = d.last;
      if (!this.canEnter(hero, to[0], to[1])) return false;
      const u = this.unitAt(to[0], to[1]);
      if (u && u !== hero) {
        if (u.side === 'hero') {
          u.setCell(from[0], from[1]); d.swaps.push(u);
          if (u.hasSig('swap_heal')) { const n = u.heal(Math.round(u.maxHp * u.sigPct(0))); if (n > 0) this.fx.text(u.x, u.y - 30, `+${n}`, PAL.heal); }
          if (u.hasSig('swap_buff')) u.swapBuff = u.sigPct(0);
        }
        else {
          if (u.has('big')) return false;
          if (hero.has('tumble')) { u.setCell(from[0], from[1]); this.fx.ring(u.x, u.y, PAL.highlight); }
          else if (hero.has('push')) {
            const dx = to[0] - from[0], dy = to[1] - from[1];
            const dest = [to[0] + dx, to[1] + dy];
            if (!this.isFree(dest[0], dest[1], u)) return false;
            if (hero.hasSig('push_far')) {
              const dest2 = [dest[0] + dx, dest[1] + dy];
              if (this.isFree(dest2[0], dest2[1], u)) u.setCell(dest2[0], dest2[1]);
              else { u.setCell(dest[0], dest[1]); const dmg = Math.max(1, Math.round(hero.atk * hero.sigPct(0))); u.takeDamage(dmg); this.fx.text(u.x, u.y - 30, `-${dmg}`, '#fff'); }
            } else u.setCell(dest[0], dest[1]);
            this.fx.ring(u.x, u.y, PAL.preview);
          } else return false;
        }
        d.changed = true;
      }
      hero.setCell(to[0], to[1]); d.last = to;
      this.triggerBomb(hero, to[0], to[1]);
      const t = this.tAt(to[0], to[1]);
      if (t === 'M' && !this.ignoresTerrain(hero)) { d.timer -= 0.5; this.fx.text(hero.x, hero.y - 40, '-0.5s', '#c8a070', { size: 12, dur: 0.7 }); }
      if (t === 'I' && !this.ignoresTerrain(hero)) {
        const end = this.slideOnIce(hero, to, [to[0] - from[0], to[1] - from[1]]);
        if (end !== to) { hero.setCell(end[0], end[1]); d.last = end; this.fx.text(hero.x, hero.y - 40, '滑行', '#bfe8ff', { size: 12, dur: 0.7 }); if (hero.hasSig('ice_skater')) hero.iceBuff = hero.sigPct(0); d.changed = true; this.refreshOrderPreview(); return 'slid'; }
      }
      if (d.last[0] !== d.start[0] || d.last[1] !== d.start[1]) d.changed = true;
      this.refreshOrderPreview();
      return true;
    }
    refreshOrderPreview() {
      const d = this.drag; if (!d) return;
      const order = [d.hero];
      for (let i = d.swaps.length - 1; i >= 0; i--) if (!order.includes(d.swaps[i])) order.push(d.swaps[i]);
      for (const h of this.turnOrder) if (!order.includes(h)) order.push(h);
      order.forEach((h, i) => h.order = i + 1);
      this.pendingOrder = order;
    }
    endDrag() {
      const d = this.drag; this.drag = null; d.hero.lifted = false;
      if (!d.changed) { this.state = 'idle'; this.heroes.forEach(h => h.order = this.turnOrder.indexOf(h) + 1); return; }
      this.turnOrder = this.pendingOrder || this.turnOrder;
      this.turnOrder.forEach((h, i) => h.order = i + 1);
      this.movedSet = new Set([d.hero, ...d.swaps]);
      for (const h of this.movedSet) this.landTrap(h);
      this.resolveTurn();
    }

    // ── 回合流程 ──────────────────────────────────────
    async resolveTurn() {
      this.state = 'busy';
      await sleep(220);
      for (const h of this.turnOrder) {
        if (this.dead) return;
        if (!h.alive) continue;
        await this.heroAct(h);
        if (!this.aliveMonsters().length) break;
      }
      this.monsters = this.monsters.filter(m => m.alive || m.alpha > 0);
      if (!this.aliveMonsters().length) {
        if (this.stageIdx + 1 < this.dungeon.stages.length) {
          this.stageIdx++;
          await this.showBanner(`第 ${this.stageIdx + 1} 波來襲！`);
          this.spawnStage(this.stageIdx, false);
          this.waveStart();
          this.addLog(`第 ${this.stageIdx + 1} 波`);
          await sleep(600);
          this.turn++; this.state = 'idle';
          return;
        }
        return this.victory();
      }
      await this.monsterPhase();
      if (this.dead) return;
      if (!this.aliveHeroes().length) return this.defeat();
      await this.startPlayerTurn();
      this.turn++;
      this.state = 'idle';
    }

    // 回合開始：延遲治癒、再生
    async startPlayerTurn() {
      let any = false;
      for (const h of this.aliveHeroes()) {
        let amt = 0;
        if (h.delayedHeal > 0) { amt += h.delayedHeal; h.delayedHeal = 0; }
        if (h.has('regen')) amt += Math.round(h.maxHp * 0.05);
        if (h.hasSig('regen_turn')) amt += Math.round(h.maxHp * h.sigPct(0));
        h.elfReady = !!(h.sig && h.sigSpecies === 'elf' && !h.wasHit); h.wasHit = false;
        h.onFire = this.tAt(h.col, h.row) === 'F';
        if (amt > 0) { const n = h.heal(amt); if (n > 0) { this.fx.text(h.x, h.y - 30, `+${n}`, PAL.heal); any = true; } }
      }
      this.movedSet = new Set();
      if (any) await sleep(450);
    }

    // 輔助模式：治癒／延遲治癒／鼓舞／結界 施加在模式內的友方（含自己）
    applySupport(h) {
      if (!h.support) return [];
      const res = DH.resolveTargets(h.support, h.pos,
        (c, r) => { const u = this.unitAt(c, r); return !!u && u.side === 'hero' && u !== h; },
        () => false, (c, r) => this.isObstacle(c, r));
      const allies = res.targets.map(p => this.unitAt(p[0], p[1])).concat([h]);
      const done = [];
      const healMul = 1 + (h.hasSig('heal_boost') ? h.sigPct(0) : 0);
      for (const a of allies) {
        if (h.has('heal')) { const n = a.heal(Math.round(a.maxHp * 0.10 * healMul)); if (n > 0) { this.fx.text(a.x, a.y - 30, `+${n}`, PAL.heal); done.push(a); } }
        if (h.hasSig('support_atk')) { a.buffAtk = 1; a.supportAtk = h.sigPct(0); done.push(a); }
        if (h.hasSig('support_def')) { a.shieldHp = Math.max(a.shieldHp, Math.round(a.maxHp * h.sigPct(0))); this.fx.text(a.x, a.y - 60, '護盾', '#8fd8ff', { size: 12, dur: 0.9 }); done.push(a); }
        if (h.has('delayed_heal')) { a.delayedHeal += Math.round(a.maxHp * 0.15 * healMul); this.fx.text(a.x, a.y - 46, '延遲治癒', PAL.heal, { size: 12, dur: 0.9 }); done.push(a); }
        if (h.has('inspire')) { a.buffAtk = 1; this.fx.text(a.x, a.y - 46, '鼓舞', PAL.gold, { size: 12, dur: 0.9 }); done.push(a); }
        if (h.has('barrier')) { a.shieldHp = Math.max(a.shieldHp, Math.round(a.maxHp * 0.15)); this.fx.text(a.x, a.y - 46, '結界', '#8fd8ff', { size: 12, dur: 0.9 }); done.push(a); }
        if (a !== h) this.fx.beam({ x: h.x, y: h.y - 10 }, { x: a.x, y: a.y - 6 }, PAL.heal, 0.35);
      }
      return done;
    }

    async heroAct(h) {
      const elfSig = h.sig && h.sigSpecies === 'elf';
      const res = DH.resolveTargets(h.pattern, h.pos,
        (c, r) => { const u = this.unitAt(c, r); return !!u && u.side === 'monster'; },
        (c, r) => { if (elfSig) return false; const u = this.unitAt(c, r); return !!u && u.side === 'hero' && u !== h; },
        (c, r) => this.isObstacle(c, r));
      const targets = res.targets.map(p => this.unitAt(p[0], p[1]));
      const hasSupport = !!h.support && (['heal', 'delayed_heal', 'inspire', 'barrier'].some(t => h.has(t)) || h.hasSig('support_atk') || h.hasSig('support_def') || h.hasSig('heal_boost'));
      const angelSig = h.sig && h.sigSpecies === 'angel';
      if (!targets.length && !hasSupport && !angelSig) return;
      this.actor = h;
      const el = DH.ELEMENTS[h.element];
      if (targets.length) {
        const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length, ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
        const dx = tx - h.x, dy = ty - h.y, len = Math.hypot(dx, dy) || 1;
        const ak = DH.weaponAnim(h.look.weapon);
        if (h.pattern.kind === 'melee') {
          h.playAnim(ak, 0.55, dx);
          h.offX = dx / len * 14; h.offY = dy / len * 14;
          await sleep(ak === 'stab' ? 150 : 260);
          for (const t of targets) this.fx.slash(t.x, t.y - 8, '#fff');
          await sleep(60);
        } else if (h.pattern.kind === 'ranged') {
          h.playAnim(ak === 'strum' ? 'strum' : 'shoot', 0.6, dx);
          await sleep(ak === 'strum' ? 150 : 280);
          if (ak === 'strum') for (let i = 0; i < 3; i++) this.fx.text(h.x + (i - 1) * 14, h.y - 30 - i * 6, '♪', el.light, { size: 16, dur: 0.8, vy: -50 });
          for (const t of targets) this.fx.projectile({ x: h.x, y: h.y - 10 }, { x: t.x, y: t.y - 6 }, el.color, 0.22);
          await sleep(220);
        } else {
          h.playAnim(ak === 'cast' ? 'cast' : ak, 0.7, dx);
          await sleep(300);
          for (const t of targets) this.fx.beam({ x: h.x, y: h.y - 10 }, { x: t.x, y: t.y - 6 }, el.color);
          await sleep(220);
        }
        let dealtTotal = 0, kills = 0;
        const orderIndex = this.turnOrder.indexOf(h), orderLast = this.turnOrder.filter(x => x.alive).slice(-1)[0] === h;
        for (const t of targets) {
          const r = DH.calcDamage(h, t, { dirsHit: res.dirsHit, moved: this.movedSet.has(h), targets: targets.length, orderIndex, orderLast, turn: this.turn, elfReady: h.elfReady });
          const hit = t.takeDamage(r.dmg); dealtTotal += hit.dealt;
          if (h.sig) this.applyHitSig(h, t, r.dmg);
          if (!t.alive) kills++;
          const col = r.crit ? '#ffb24a' : r.cm > 1 ? PAL.gold : (r.cm < 1 ? '#b8b8c8' : '#fff');
          this.fx.text(t.x, t.y - 30, `-${r.dmg}`, col, { size: r.cm > 1 || r.crit ? 24 : 20 });
          if (r.notes.length) this.fx.text(t.x, t.y - 52, r.notes.join('·'), PAL.gold, { size: 12, dur: 0.9 });
          this.fx.burst(t.x, t.y - 6, el.color, 8);
          if (h.has('burn') && t.alive) t.status.burn = { turns: 2, dmg: Math.round(h.atk * 0.15) };
          if (h.has('poison') && t.alive) t.status.poison = { turns: 3, dmg: Math.round(h.atk * 0.2) };
          if (!t.alive) this.fx.burst(t.x, t.y - 10, '#fff', 14);
        }
        if (h.has('lifedrain') && dealtTotal > 0) { const n = h.heal(Math.round(dealtTotal * 0.3)); if (n > 0) this.fx.text(h.x, h.y - 30, `+${n}`, PAL.heal); }
        if (h.hasSig('lifesteal') && dealtTotal > 0) { const n = h.heal(Math.round(dealtTotal * h.sigPct(0))); if (n > 0) this.fx.text(h.x, h.y - 30, `+${n}`, PAL.heal); }
        if (h.hasSig('chain')) {
          const others = this.aliveMonsters().filter(m => !targets.includes(m));
          if (others.length) { const near = others.sort((a, b) => G.chebyshev(a.pos, h.pos) - G.chebyshev(b.pos, h.pos))[0]; const dmg = Math.max(1, Math.round(h.atk * h.sigPct(0))); near.takeDamage(dmg); this.fx.beam({ x: targets[0].x, y: targets[0].y - 6 }, { x: near.x, y: near.y - 6 }, el.light, 0.3); this.fx.text(near.x, near.y - 30, `-${dmg}`, el.light, { size: 16 }); if (!near.alive) kills++; }
        }
        if (kills > 0) {
          if (h.sig && h.sigSpecies === 'orc') { h.rage = Math.min(5, h.rage + kills); this.fx.text(h.x, h.y - 46, `血怒 ${Math.min(h.rage * 8, 40)}%`, '#ff6a5a', { size: 12, dur: 0.9 }); }
          if (h.hasSig('kill_heal')) { const n = h.heal(Math.round(h.maxHp * h.sigPct(0) * kills)); if (n > 0) this.fx.text(h.x, h.y - 30, `+${n}`, PAL.heal); }
          if (h.hasSig('kill_shield')) h.shieldHp = Math.max(h.shieldHp, Math.round(h.maxHp * h.sigPct(0)));
        }
        this.addLog(`${h.name} 攻擊 ${targets.map(t => t.name).join('、')}`);
      }
      if (angelSig) {
        const pat = h.support || DH.PATTERNS.melee_all;
        const res2 = DH.resolveTargets(pat, h.pos, (c, r) => { const u = this.unitAt(c, r); return !!u && u.side === 'hero' && u !== h; }, () => false, (c, r) => this.isObstacle(c, r));
        for (const p of res2.targets.map(q => this.unitAt(q[0], q[1])).concat([h])) { const n = p.heal(Math.round(p.maxHp * 0.08 * h.sig.scale)); if (n > 0) this.fx.text(p.x, p.y - 30, `+${n}`, PAL.heal); }
      }
      h.swapBuff = 0; h.iceBuff = 0;
      if (hasSupport) { if (!targets.length) { h.playAnim('cast', 0.6, 0); await sleep(250); } const done = this.applySupport(h); if (!targets.length && done.length) this.addLog(`${h.name} 支援隊友`); }
      if (h.buffAtk > 0) h.buffAtk--;
      await sleep(140);
      h.offX = 0; h.offY = 0; this.actor = null; h.face = 1;
      await sleep(220);
    }

    // 專武：命中後效果（狀態、處決、龍息濺射）
    applyHitSig(h, t, dmg) {
      const sc = h.sig.scale;
      if (h.hasSig('hit_poison') && t.alive) t.status.poison = { turns: h.sigParam(0), dmg: Math.round(h.atk * h.sigPct(1)) };
      if (h.hasSig('hit_burn') && t.alive) t.status.burn = { turns: h.sigParam(0), dmg: Math.round(h.atk * h.sigPct(1)) };
      if (h.hasSig('hit_slow') && t.alive) { t.status.slow = { turns: 1, amt: h.sigParam(0) }; this.fx.text(t.x, t.y - 46, '減速', '#8fd8ff', { size: 12, dur: 0.9 }); }
      if (h.hasSig('hit_stun') && t.alive && !t.has('big') && Math.random() < h.sigPct(0)) { t.status.stun = { turns: 1 }; this.fx.text(t.x, t.y - 46, '暈眩', PAL.gold, { size: 12, dur: 0.9 }); }
      if (h.hasSig('execute') && t.alive && !t.has('big') && t.hpRatio < h.sigPct(0)) { t.takeDamage(t.hp); this.fx.text(t.x, t.y - 46, '處決', '#ff4a4a', { size: 14, dur: 0.9 }); }
      if (h.sigSpecies === 'dragonkin') {
        for (const n of G.neighbors8(t.pos)) {
          const m = this.unitAt(n[0], n[1]);
          if (m && m.side === 'monster' && m !== t) { const d2 = Math.max(1, Math.round(h.atk * 0.4 * sc)); m.takeDamage(d2); m.status.burn = { turns: 2, dmg: Math.round(h.atk * 0.15) }; this.fx.text(m.x, m.y - 30, `-${d2}`, '#ff9a3a', { size: 15 }); this.fx.burst(m.x, m.y - 6, '#ff7a3a', 6); }
        }
      }
    }

    async tickStatus(units) {
      let any = false;
      for (const u of units) {
        if (!u.alive) continue;
        for (const key of ['poison', 'burn']) {
          const st = u.status[key]; if (!st) continue;
          u.takeDamage(st.dmg); any = true;
          this.fx.text(u.x, u.y - 30, `-${st.dmg}`, key === 'poison' ? '#b96cff' : '#ff9a3a', { size: 18 });
          st.turns--; if (st.turns <= 0) delete u.status[key];
        }
      }
      if (any) await sleep(500);
    }

    async fireTick(units) {
      let any = false;
      for (const u of units) {
        if (!u.alive || this.ignoresTerrain(u)) continue;
        const t = this.tAt(u.col, u.row);
        if (t === 'F' && !u.hasSig('fire_walker')) {
          const dmg = Math.max(1, Math.round(u.maxHp * 0.10)); u.takeDamage(dmg); u.status.burn = { turns: 1, dmg: Math.round(u.maxHp * 0.05) };
          this.fx.text(u.x, u.y - 30, `-${dmg}`, '#ff9a3a', { size: 18 }); this.fx.burst(u.x, u.y - 6, '#ff7a3a', 8); any = true;
        } else if (t === 'P') {
          u.status.poison = { turns: 3, dmg: Math.max(1, Math.round(u.maxHp * 0.05)) };
          this.fx.text(u.x, u.y - 30, '中毒', '#b96cff', { size: 14 }); any = true;
        }
      }
      if (any) await sleep(450);
    }
    async monsterPhase() {
      await this.fireTick(this.heroes);
      if (!this.aliveHeroes().length) return;
      await this.tickStatus(this.monsters);
      await this.fireTick(this.monsters);
      this.monsters = this.monsters.filter(m => m.alive || m.alpha > 0);
      if (!this.aliveMonsters().length) return;
      const order = this.aliveMonsters().slice();
      shuffle(order); order.sort((a, b) => b.speed - a.speed);
      for (const m of order) {
        if (this.dead) return;
        if (!m.alive || !this.aliveHeroes().length) continue;
        this.actor = m;
        if (m.status.stun) { delete m.status.stun; this.fx.text(m.x, m.y - 30, '暈眩中', PAL.gold, { size: 14 }); await sleep(300); this.actor = null; continue; }
        const baseSpeed = m.speed;
        if (m.status.slow) { m.speed = Math.max(0, m.speed - m.status.slow.amt); delete m.status.slow; }
        const plan = DH.planMonster(m, this);
        m.speed = baseSpeed;
        if (!plan) continue;
        for (const step of plan.path) { m.setCell(step[0], step[1]); this.triggerBomb(m, step[0], step[1]); await sleep(120); if (!m.alive) break; }
        if (!m.alive) { this.actor = null; continue; }
        if (plan.path.length) { this.landTrap(m); if (!m.alive) { this.actor = null; continue; } }
        if (plan.path.length) {
          const last = plan.path[plan.path.length - 1], prev = plan.path.length > 1 ? plan.path[plan.path.length - 2] : null;
          if (prev && this.tAt(last[0], last[1]) === 'I') { const end = this.slideOnIce(m, last, [last[0] - prev[0], last[1] - prev[1]]); if (end !== last) { m.setCell(end[0], end[1]); this.fx.text(m.x, m.y - 40, '滑行', '#bfe8ff', { size: 12, dur: 0.7 }); plan.targets.length = 0; } }
          await sleep(100);
        }
        const targets = plan.targets.filter(h => h.alive);
        m.idleTurns = targets.length ? 0 : (m.idleTurns || 0) + 1;
        if (targets.length) {
          const el = DH.ELEMENTS[m.element];
          if (m.pattern.kind === 'melee') {
            const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length, ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
            const dx = tx - m.x, dy = ty - m.y, len = Math.hypot(dx, dy) || 1;
            m.playAnim('lunge', 0.45, dx);
            m.offX = dx / len * 16; m.offY = dy / len * 16; await sleep(160);
            for (const t of targets) this.fx.slash(t.x, t.y - 8, el.light);
          } else if (m.pattern.kind === 'ranged') {
            m.playAnim('lunge', 0.4, targets[0].x - m.x);
            await sleep(120);
            for (const t of targets) this.fx.projectile({ x: m.x, y: m.y - 10 }, { x: t.x, y: t.y - 6 }, el.color, 0.25);
            await sleep(250);
          } else {
            m.playAnim('lunge', 0.5, targets[0].x - m.x);
            await sleep(140);
            for (const t of targets) this.fx.beam({ x: m.x, y: m.y - 10 }, { x: t.x, y: t.y - 6 }, el.color);
            await sleep(280);
          }
          for (const t of targets) {
            let dodge = 0;
            if (t.sig && t.sigSpecies === 'halfling') dodge += 0.20 * t.sig.scale;
            if (t.sig && t.sigSpecies === 'angel') dodge += 0.30 * t.sig.scale;
            if (t.hasSig('dodge')) dodge += t.sigPct(0);
            if (dodge > 0 && Math.random() < dodge) { this.fx.text(t.x, t.y - 30, '落空', '#8fd8ff', { size: 16 }); continue; }
            const r = DH.calcDamage(m, t, { dirsHit: plan.dirsHit });
            if (t.sig && t.sigSpecies === 'dwarf' && !t.lifeSaved && r.dmg >= t.hp + t.shieldHp) { r.dmg = t.hp + t.shieldHp - 1; t.lifeSaved = true; this.fx.text(t.x, t.y - 46, '礦心', PAL.gold, { size: 14, dur: 1 }); }
            const hit = t.takeDamage(r.dmg);
            t.wasHit = true;
            if (t.alive && t.hasSig('counter') && m.pattern.kind === 'melee' && m.alive) { const back = Math.max(1, Math.round(t.atk * t.sigPct(0))); m.takeDamage(back); this.fx.slash(m.x, m.y - 8, '#fff'); this.fx.text(m.x, m.y - 30, `-${back}`, '#fff', { size: 16 }); }
            if (t.alive && t.hasSig('reflect') && m.alive) { const back = Math.max(1, Math.round(r.dmg * t.sigPct(0))); m.takeDamage(back); this.fx.text(m.x, m.y - 30, `-${back}`, '#ff9a5a', { size: 16 }); }
            this.fx.text(t.x, t.y - 30, `-${r.dmg}`, r.cm > 1 ? '#ff6a5a' : '#ffd0d0', { size: r.cm > 1 ? 24 : 20 });
            if (hit.absorbed > 0) this.fx.text(t.x, t.y - 66, `護盾 -${hit.absorbed}`, '#8fd8ff', { size: 12, dur: 0.9 });
            if (t.has('thorns') && m.pattern.kind === 'melee' && m.alive) { const back = Math.max(1, Math.round(r.dmg * 0.25)); m.takeDamage(back); this.fx.text(m.x, m.y - 30, `-${back}`, '#ff9a5a', { size: 16 }); }
            if (r.notes.length) this.fx.text(t.x, t.y - 52, r.notes.join('·'), '#ff9a8a', { size: 12, dur: 0.9 });
            if (m.has('venom') && t.alive) t.status.poison = { turns: 2, dmg: Math.round(m.atk * 0.2) };
            if (!t.alive) this.fx.burst(t.x, t.y - 10, '#fff', 14);
          }
          this.addLog(`${m.name} 攻擊 ${targets.map(t => t.name).join('、')}`);
          await sleep(140); m.offX = 0; m.offY = 0; m.face = 1;
          await sleep(220);
        }
        this.actor = null;
      }
      await this.tickStatus(this.heroes);
    }

    async showBanner(text) { this.banner = { text, t: 0, dur: 1.4 }; await sleep(1400); this.banner = null; }

    victory() {
      this.state = 'won';
      const dead = this.heroes.filter(h => !h.alive).length;
      this.stars = dead === 0 ? 3 : dead === 1 ? 2 : 1;
      this.reward = this.game.onVictory(this.dungeon, this.stars);
      this.addLog('勝利！');
    }
    defeat() { this.state = 'lost'; this.addLog('全軍覆沒…'); }

    // ── 更新 ──────────────────────────────────────────
    async runAuto() {
      if (this.state !== 'idle' || this.drag) return;
      const plan = DH.planAutoTurn(this);
      if (!plan || !plan.path.length) { this.auto = false; this.addLog('自動：找不到可行的移動'); return; }
      const h = plan.hero, c0 = G.cellCenter(h.col, h.row);
      this.startDrag(h, c0.x, c0.y);
      this.state = 'drag';
      for (const step of plan.path) {
        if (this.dead || !this.drag) return;
        const r = this.tryStep(step);
        const c = G.cellCenter(h.col, h.row); this.drag.px = c.x; this.drag.py = c.y;
        if (!r) break;
        await sleep(160);
      }
      if (this.drag) this.endDrag();
    }
    update(dt) {
      this.time += dt;
      if (this.auto && this.state === 'idle' && !this.drag && !this.info) { this.autoWait += dt; if (this.autoWait > 0.5) { this.autoWait = 0; this.runAuto(); } } else this.autoWait = 0;
      for (const u of this.allUnits()) u.update(dt);
      this.fx.update(dt);
      if (this.banner) this.banner.t += dt;
      if (this.drag) {
        const d = this.drag;
        d.timer -= dt;
        d.hero.x += (Math.max(C.BOARD_X, Math.min(C.BOARD_X + C.COLS * C.CELL, d.px)) - d.hero.x) * Math.min(1, dt * 30);
        d.hero.y += (Math.max(C.BOARD_Y, Math.min(C.BOARD_Y + C.ROWS * C.CELL, d.py)) - d.hero.y) * Math.min(1, dt * 30);
        if (d.timer <= 0) this.endDrag();
      }
    }

    // ── 繪製 ──────────────────────────────────────────
    draw(ctx) {
      const T = this.theme;
      const g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, T.bg1); g.addColorStop(1, T.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      this.drawDecor(ctx);
      this.buttons = [];
      this.drawTopBar(ctx);
      this.drawBoard(ctx);
      this.drawUnits(ctx);
      this.fx.draw(ctx);
      this.drawBottom(ctx);
      if (this.drag) this.drawTimer(ctx);
      if (this.banner) this.drawBanner(ctx);
      if (this.state === 'won' || this.state === 'lost') { this.buttons = []; this.drawEnd(ctx); }
    }
    drawDecor(ctx) {
      ctx.save(); ctx.globalAlpha = 0.18;
      for (let i = 0; i < 24; i++) {
        const x = (i * 97.3) % C.W, y = (i * 61.7 + this.time * 6 * ((i % 3) + 1)) % C.H;
        S.circ(ctx, x, y, 1.5 + (i % 3)); ctx.fillStyle = this.theme.deco; ctx.fill();
      }
      ctx.restore();
    }
    drawTopBar(ctx) {
      ctx.save();
      S.rr(ctx, 12, 14, 516, 76, 16); ctx.fillStyle = 'rgba(16,12,24,0.78)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.frame; ctx.stroke();
      // 返回
      S.rr(ctx, 22, 28, 44, 48, 12); ctx.fillStyle = PAL.panelLight; ctx.fill(); ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(50, 40); ctx.lineTo(38, 52); ctx.lineTo(50, 64); ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.text; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.font = `bold 22px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text;
      ctx.fillText(this.dungeon.name, C.W / 2, 40);
      // 波次圓點
      const n = this.dungeon.stages.length, sx = C.W / 2 - (n - 1) * 14;
      for (let i = 0; i < n; i++) { S.circ(ctx, sx + i * 28, 68, 6); ctx.fillStyle = i < this.stageIdx ? PAL.gold : i === this.stageIdx ? PAL.text : 'rgba(255,255,255,0.18)'; ctx.fill(); if (i === this.stageIdx) { S.circ(ctx, sx + i * 28, 68, 9); ctx.lineWidth = 2; ctx.strokeStyle = PAL.gold; ctx.stroke(); } }
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.textAlign = 'left'; ctx.fillText(`第 ${this.stageIdx + 1} / ${n} 波`, sx + n * 28 + 2, 68);
      // 回合
      ctx.textAlign = 'right'; ctx.font = `bold 15px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`回合 ${this.turn}`, 516, 40);
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
      ctx.fillText(this.auto ? '自動戰鬥中' : this.state === 'idle' ? '拖曳一名英雄' : this.state === 'drag' ? '放開即行動' : this.state === 'busy' ? (this.actor && this.actor.side === 'monster' ? '怪物行動中' : '英雄行動中') : '', 440, 66);
      ctx.restore();
      if (this.state !== 'won' && this.state !== 'lost') DH.UI.button(this, ctx, 448, 54, 68, 28, this.auto ? '自動 ON' : '自動', { size: 12, fill: this.auto ? PAL.gold : PAL.panelLight, textColor: this.auto ? '#2a2030' : PAL.text, radius: 9, onClick: () => { this.auto = !this.auto; this.info = null; } });
    }
    drawBoard(ctx) {
      const T = this.theme, bx = C.BOARD_X, by = C.BOARD_Y, bw = C.COLS * C.CELL, bh = C.ROWS * C.CELL;
      ctx.save();
      S.rr(ctx, bx - 10, by - 10, bw + 20, bh + 20, 14); ctx.fillStyle = PAL.frameDark; ctx.fill();
      S.rr(ctx, bx - 7, by - 7, bw + 14, bh + 14, 11); ctx.fillStyle = PAL.frame; ctx.fill();
      S.rr(ctx, bx - 4, by - 4, bw + 8, bh + 8, 8); ctx.fillStyle = T.edge; ctx.fill();
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
        const x = bx + c * C.CELL, y = by + r * C.CELL;
        if (this.terrain[r][c] === 'X') {
          S.rr(ctx, x + 1.5, y + 1.5, C.CELL - 3, C.CELL - 3, 7); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.stroke();
          continue;
        }
        const base = (c + r) % 2 ? T.a : T.b;
        S.rr(ctx, x + 1.5, y + 1.5, C.CELL - 3, C.CELL - 3, 7); ctx.fillStyle = base; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 7, y + 3.5); ctx.lineTo(x + C.CELL - 7, y + 3.5); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 7, y + C.CELL - 3.5); ctx.lineTo(x + C.CELL - 7, y + C.CELL - 3.5); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.stroke();
        const seed = (c * 7 + r * 13) % 5;
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; S.circ(ctx, x + 14 + seed * 8, y + 20 + seed * 6, 2 + seed % 2); ctx.fill();
        const t = this.terrain[r][c];
        if (t === 'R') this.drawObstacle(ctx, x, y);
        else if (t !== '.') this.drawTerrain(ctx, t, x, y, c, r);
      }
      // 拖曳高光與攻擊預覽
      if (this.drag) this.drawPreview(ctx);
      ctx.restore();
    }
    drawTerrain(ctx, t, x, y, c, r) {
      const cs = C.CELL, tm = this.time, seed = (c * 31 + r * 17) % 7;
      ctx.save();
      if (t === '#') {
        S.rr(ctx, x + 2, y + 2, cs - 4, cs - 4, 5); ctx.fillStyle = '#4e4a56'; ctx.fill();
        for (let i = 0; i < 4; i++) { const yy = y + 5 + i * 15, off = i % 2 ? 16 : 0; for (let k = -1; k < 3; k++) { const xx = x + 4 + off + k * 32; S.rr(ctx, Math.max(x + 3, xx), yy, Math.min(29, x + cs - 3 - Math.max(x + 3, xx)), 12, 2); ctx.fillStyle = (i + k) % 2 ? '#6a6472' : '#5c5866'; ctx.fill(); } }
        S.rr(ctx, x + 2, y + 2, cs - 4, cs - 4, 5); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a2630'; ctx.stroke();
        S.rr(ctx, x + 4, y + 4, cs - 8, 6, 2); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
      } else if (t === 'I') {
        S.rr(ctx, x + 1.5, y + 1.5, cs - 3, cs - 3, 7); ctx.fillStyle = '#bfe3f7'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 10 + seed * 3, y + 12); ctx.lineTo(x + 30 + seed * 2, y + 30); ctx.lineTo(x + 24, y + 52); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 40, y + 10); ctx.lineTo(x + 52 - seed, y + 36); ctx.strokeStyle = 'rgba(120,170,210,0.7)'; ctx.stroke();
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(tm * 2 + seed); S.rr(ctx, x + 6, y + 6, 22, 10, 5); ctx.fillStyle = '#fff'; ctx.fill();
      } else if (t === 'F') {
        S.rr(ctx, x + 1.5, y + 1.5, cs - 3, cs - 3, 7); ctx.fillStyle = '#4a1a10'; ctx.fill();
        for (let i = 0; i < 4; i++) {
          const fx = x + 12 + i * 15 + Math.sin(tm * 6 + i + seed) * 3, fh = 22 + Math.sin(tm * 9 + i * 1.7 + seed) * 8;
          ctx.beginPath(); ctx.moveTo(fx - 8, y + cs - 8); ctx.quadraticCurveTo(fx - 9, y + cs - 8 - fh * 0.6, fx, y + cs - 8 - fh); ctx.quadraticCurveTo(fx + 9, y + cs - 8 - fh * 0.6, fx + 8, y + cs - 8); ctx.closePath();
          ctx.fillStyle = i % 2 ? '#ff7a2a' : '#ffb03a'; ctx.globalAlpha = 0.85; ctx.fill();
          ctx.beginPath(); ctx.moveTo(fx - 4, y + cs - 8); ctx.quadraticCurveTo(fx - 4, y + cs - 8 - fh * 0.4, fx, y + cs - 8 - fh * 0.55); ctx.quadraticCurveTo(fx + 4, y + cs - 8 - fh * 0.4, fx + 4, y + cs - 8); ctx.closePath(); ctx.fillStyle = '#fff0a0'; ctx.fill();
        }
        ctx.globalAlpha = 0.25 + 0.1 * Math.sin(tm * 5); S.rr(ctx, x - 4, y - 4, cs + 8, cs + 8, 10); ctx.fillStyle = '#ff6a2a'; ctx.fill();
      } else if (t === 'M') {
        S.rr(ctx, x + 1.5, y + 1.5, cs - 3, cs - 3, 7); ctx.fillStyle = '#5a4630'; ctx.fill();
        for (let i = 0; i < 3; i++) { S.ell(ctx, x + 16 + i * 18 + (seed % 3) * 2, y + 20 + ((i + seed) % 3) * 14, 9, 5); ctx.fillStyle = '#4a3824'; ctx.fill(); }
        S.ell(ctx, x + 30, y + 40, 12, 4); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
      } else if (t === 'S') {
        for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { const sx = x + 14 + i * 21, sy = y + 16 + k * 20; ctx.beginPath(); ctx.moveTo(sx - 6, sy + 6); ctx.lineTo(sx, sy - 8); ctx.lineTo(sx + 6, sy + 6); ctx.closePath(); S.fillStroke(ctx, '#c8ccd8', '#2a2630', 1.5); }
      } else if (t === 'P') {
        S.rr(ctx, x + 1.5, y + 1.5, cs - 3, cs - 3, 7); ctx.fillStyle = 'rgba(120,60,160,0.55)'; ctx.fill();
        for (let i = 0; i < 4; i++) { const by = y + cs - 12 - ((tm * 18 + i * 17 + seed * 5) % 50), bx = x + 12 + i * 14 + Math.sin(tm * 3 + i) * 4; ctx.globalAlpha = 0.5; S.circ(ctx, bx, by, 5 + (i % 2) * 2); ctx.fillStyle = '#c79af0'; ctx.fill(); }
      } else if (t === 'E') {
        S.circ(ctx, x + cs / 2, y + cs / 2, 20); ctx.fillStyle = 'rgba(120,20,20,0.5)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ff5a3a'; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        S.circ(ctx, x + cs / 2, y + cs / 2 + 2, 10); S.fillStroke(ctx, '#2a2430', '#111', 2);
        ctx.beginPath(); ctx.moveTo(x + cs / 2 + 4, y + cs / 2 - 6); ctx.quadraticCurveTo(x + cs / 2 + 12, y + cs / 2 - 12, x + cs / 2 + 10, y + cs / 2 - 18); ctx.lineWidth = 2; ctx.strokeStyle = '#a07040'; ctx.stroke();
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tm * 10); S.circ(ctx, x + cs / 2 + 10, y + cs / 2 - 18, 3); ctx.fillStyle = '#ffd24a'; ctx.fill();
      } else if (t === 'T') {
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(x + cs / 2, y + cs / 2); ctx.rotate(tm * (1.2 + i * 0.6) * (i % 2 ? -1 : 1)); ctx.beginPath(); ctx.arc(0, 0, 22 - i * 6, 0, Math.PI * 1.5); ctx.lineWidth = 3; ctx.strokeStyle = ['#c79af0', '#8c52c8', '#e8d8ff'][i]; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(tm * 4); S.circ(ctx, x + cs / 2, y + cs / 2, 8); ctx.fillStyle = '#e8d8ff'; ctx.fill();
      } else if (t === 'W' || t === 'B') {
        S.rr(ctx, x + 1.5, y + 1.5, cs - 3, cs - 3, 7); ctx.fillStyle = '#2f6a98'; ctx.fill();
        for (let i = 0; i < 3; i++) { const wy = y + 14 + i * 18 + Math.sin(tm * 2 + i + c) * 2; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const wx = x + 6 + k * 9.5; const yy = wy + Math.sin(tm * 3 + k * 0.9 + i + r) * 2.5; if (k === 0) ctx.moveTo(wx, yy); else ctx.lineTo(wx, yy); } ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(180,225,255,0.55)'; ctx.stroke(); }
        if (t === 'B') {
          for (let i = 0; i < 5; i++) { S.rr(ctx, x + 4, y + 5 + i * 12.5, cs - 8, 10, 2); ctx.fillStyle = i % 2 ? '#9a6a3a' : '#8a5e32'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#4a2e14'; ctx.stroke(); }
          S.rr(ctx, x + 2, y + 3, 5, cs - 6, 2); ctx.fillStyle = '#6a4424'; ctx.fill(); S.rr(ctx, x + cs - 7, y + 3, 5, cs - 6, 2); ctx.fill();
        }
      }
      ctx.restore();
    }
    drawObstacle(ctx, x, y) {
      const T = this.theme, cx = x + C.CELL / 2, cy = y + C.CELL / 2;
      ctx.save();
      S.ell(ctx, cx, cy + 22, 24, 7); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      if (this.dungeon.theme === 'grave') {
        S.rr(ctx, cx - 16, cy - 22, 32, 44, 12); S.fillStroke(ctx, '#8d93a6', '#2a2030', 2);
        S.rr(ctx, cx - 20, cy + 14, 40, 10, 3); S.fillStroke(ctx, '#6a7084', '#2a2030', 2);
        ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 8); ctx.moveTo(cx - 7, cy - 5); ctx.lineTo(cx + 7, cy - 5); ctx.lineWidth = 3; ctx.strokeStyle = '#4a5064'; ctx.stroke();
      } else if (this.dungeon.theme === 'forest' || this.dungeon.theme === 'camp' || this.dungeon.theme === 'den') {
        ctx.beginPath(); ctx.moveTo(cx - 24, cy + 20); ctx.lineTo(cx - 20, cy - 8); ctx.lineTo(cx - 6, cy - 24); ctx.lineTo(cx + 12, cy - 18); ctx.lineTo(cx + 24, cy + 4); ctx.lineTo(cx + 20, cy + 20); ctx.closePath();
        S.fillStroke(ctx, '#7d7466', '#2a2030', 2);
        ctx.beginPath(); ctx.moveTo(cx - 6, cy - 24); ctx.lineTo(cx - 2, cy - 4); ctx.lineTo(cx + 12, cy - 18); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - 20, cy + 6); ctx.quadraticCurveTo(cx - 4, cy + 2, cx + 6, cy + 12); ctx.lineWidth = 3; ctx.strokeStyle = T.deco; ctx.stroke();
      } else {
        S.rr(ctx, cx - 14, cy - 26, 28, 50, 5); S.fillStroke(ctx, '#78808f', '#2a2030', 2);
        S.rr(ctx, cx - 18, cy - 30, 36, 8, 3); S.fillStroke(ctx, '#8d95a4', '#2a2030', 2);
        S.rr(ctx, cx - 18, cy + 18, 36, 8, 3); S.fillStroke(ctx, '#616977', '#2a2030', 2);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; S.rr(ctx, cx - 10, cy - 22, 6, 40, 3); ctx.fill();
      }
      ctx.restore();
    }
    drawPreview(ctx) {
      const d = this.drag, h = d.hero;
      const sr = G.cellRect(d.start[0], d.start[1]);
      S.rr(ctx, sr.x + 3, sr.y + 3, sr.w - 6, sr.h - 6, 7); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke(); ctx.setLineDash([]);
      const cells = DH.patternCells(h.pattern, d.last, (c, r) => this.isObstacle(c, r), (c, r) => !!this.unitAt(c, r) && this.unitAt(c, r) !== h);
      const col = PAL[h.pattern.kind];
      for (const [c, r] of cells) {
        const rc = G.cellRect(c, r);
        const u = this.unitAt(c, r);
        ctx.globalAlpha = 0.28; S.rr(ctx, rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4, 7); ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
        if (u && u.side === 'monster') {
          S.rr(ctx, rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4, 7); ctx.lineWidth = 3; ctx.strokeStyle = PAL.preview; ctx.stroke();
          const r = DH.calcDamage(h, u, { noRoll: true });
          ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(`-${r.expected}`, rc.x + rc.w / 2, rc.y + 12); ctx.fillStyle = r.cm > 1 ? PAL.gold : '#fff'; ctx.fillText(`-${r.expected}`, rc.x + rc.w / 2, rc.y + 12);
        }
        if (u && u.side === 'hero' && h.has('heal') && h.pattern.kind === 'magic') { S.rr(ctx, rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4, 7); ctx.lineWidth = 3; ctx.strokeStyle = PAL.heal; ctx.stroke(); }
      }
      const lr = G.cellRect(d.last[0], d.last[1]);
      S.rr(ctx, lr.x + 2, lr.y + 2, lr.w - 4, lr.h - 4, 7); ctx.lineWidth = 3; ctx.strokeStyle = PAL.highlight; ctx.stroke();
    }
    drawUnits(ctx) {
      const units = this.allUnits().filter(u => u.alive || u.alpha > 0);
      units.sort((a, b) => (a.lifted ? 1 : 0) - (b.lifted ? 1 : 0) || a.y - b.y);
      for (const u of units) {
        ctx.save();
        ctx.globalAlpha = u.alpha;
        const x = u.x + u.offX, y = u.y + u.offY;
        if (this.actor === u) { S.ell(ctx, x, y + 24, 30, 9); ctx.fillStyle = 'rgba(255,230,120,0.45)'; ctx.fill(); }
        if (u.side === 'hero') DH.drawHero(ctx, u, x, y, this.time); else DH.drawMonster(ctx, u, x, y - (u.boss ? 4 : 0), this.time);
        if (u.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = u.flash * 2.5; S.ell(ctx, x, y - 4, 24, 28); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = u.alpha; }
        if (u.alive) this.drawUnitUI(ctx, u, x, y);
        ctx.restore();
      }
    }
    drawUnitUI(ctx, u, x, y) {
      const lift = u.lifted ? -14 : 0;
      const bw = 52, bx = x - bw / 2, by = y + 24 + lift;
      DH.drawHpBar(ctx, bx, by, bw, u.hpRatio, u.side === 'hero' ? PAL.hpHero : PAL.hpMonster, `${u.hp}`);
      DH.drawGem(ctx, x - 27, y - 26 + lift, 6, u.element);
      DH.drawPatternIcon(ctx, u.pattern, x + 13, y - 34 + lift, 20);
      if (u.side === 'hero') DH.drawBadge(ctx, x - 24, y + 16 + lift, 9, String(u.order), PAL.gold, '#2a2030', 11);
      else {
        S.rr(ctx, x - 32, y + 9 + lift, 26, 14, 7); ctx.fillStyle = 'rgba(20,16,28,0.85)'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = PAL.textDim; ctx.stroke();
        ctx.font = `bold 10px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(`速${u.speed}`, x - 19, y + 16 + lift);
      }
      let sx = x - 26;
      for (const key of ['poison', 'burn']) if (u.status[key]) { DH.drawBadge(ctx, sx, by + 14, 6, key === 'poison' ? '毒' : '焰', key === 'poison' ? '#9a4cff' : '#ff8a2a', '#fff', 8); sx += 14; }
    }
    drawTimer(ctx) {
      const d = this.drag, p = Math.max(0, d.timer / this.moveTime);
      const col = p > 0.4 ? PAL.gold : '#ff5a4a';
      ctx.save();
      S.rr(ctx, C.BOARD_X, C.BOARD_Y - 15, C.COLS * C.CELL, 7, 3.5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      if (p > 0) { S.rr(ctx, C.BOARD_X, C.BOARD_Y - 15, C.COLS * C.CELL * p, 7, 3.5); ctx.fillStyle = col; ctx.fill(); }
      const h = d.hero;
      ctx.beginPath(); ctx.arc(h.x, h.y - 14, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
      ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(d.timer.toFixed(1), h.x, h.y - 62); ctx.fillText(d.timer.toFixed(1), h.x, h.y - 62);
      ctx.restore();
    }
    heroCardRect(i) { const n = this.heroes.length, w = 94, gap = 8, total = n * w + (n - 1) * gap; return { x: (C.W - total) / 2 + i * (w + gap), y: 702, w, h: 124 }; }
    heroCardAt(x, y) { for (let i = 0; i < this.heroes.length; i++) { const r = this.heroCardRect(i); if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return this.heroes[i]; } return null; }
    drawBottom(ctx) {
      ctx.save();
      S.rr(ctx, 12, 690, 516, 258, 18); ctx.fillStyle = 'rgba(16,12,24,0.82)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.frame; ctx.stroke();
      this.heroes.forEach((h, i) => {
        const r = this.heroCardRect(i), el = DH.ELEMENTS[h.element];
        S.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fillStyle = h.alive ? PAL.panel : '#17131f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = this.info === h ? PAL.gold : (h.alive ? el.dark : '#2a2430'); ctx.stroke();
        S.rr(ctx, r.x, r.y, r.w, 5, 2); ctx.fillStyle = h.alive ? el.color : '#3a3442'; ctx.fill();
        ctx.save(); ctx.beginPath(); S.rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 11); ctx.clip();
        ctx.globalAlpha = h.alive ? 1 : 0.35; ctx.translate(r.x + r.w / 2, r.y + 54); ctx.scale(0.72, 0.72); DH.drawHero(ctx, { ...h, lifted: false, scale: 1, uid: h.uid }, 0, 0, this.time, { noShadow: true }); ctx.restore();
        ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = h.alive ? PAL.text : PAL.textDim;
        ctx.fillText(`${h.name}·${h.cls}`, r.x + r.w / 2, r.y + 86);
        ctx.font = `10px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`Lv.${h.level}  ${'★'.repeat(h.stars)}`, r.x + r.w / 2, r.y + 36);
        DH.drawHpBar(ctx, r.x + 8, r.y + 96, r.w - 16, h.hpRatio, h.alive ? PAL.hpHero : '#444', `${h.hp}/${h.maxHp}`);
        DH.drawBadge(ctx, r.x + 13, r.y + 17, 9, String(h.order), PAL.gold, '#2a2030', 11);
        h.talents.forEach((t, k) => DH.drawBadge(ctx, r.x + r.w - 13 - k * 18, r.y + 17, 8, DH.TALENTS[t].icon, el.dark, '#fff', 9));
        if (!h.alive) { ctx.font = `bold 16px ${DH.FONT}`; ctx.fillStyle = '#ff6a5a'; ctx.fillText('陣亡', r.x + r.w / 2, r.y + 50); }
      });
      // 資訊／日誌區
      const ly = 838;
      S.rr(ctx, 24, ly, 492, 100, 10); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (this.info) this.drawInfo(ctx, this.info, 34, ly + 8, 472);
      else {
        ctx.font = `13px ${DH.FONT}`;
        this.log.forEach((s, i) => { ctx.fillStyle = i === this.log.length - 1 ? PAL.text : PAL.textDim; ctx.fillText(s, 36, ly + 18 + i * 20); });
        ctx.fillStyle = PAL.textDim; ctx.font = `11px ${DH.FONT}`;
        ctx.fillText('拖曳英雄移動，經過友方即交換位置；5 秒內放開。被拖的英雄先出手，其餘依最後交換順序。', 36, ly + 86);
      }
      ctx.restore();
    }
    drawInfo(ctx, u, x, y, w) {
      if (u.terrain) {
        ctx.font = `bold 15px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.fillText(`地形：${DH.TERRAIN_NAMES[u.terrain]}`, x, y + 8);
        ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; UI_wrap(ctx, DH.TERRAIN_DESC[u.terrain] || '', x, y + 32, w, 17);
        ctx.fillStyle = PAL.text; ctx.fillText('飛行單位無視冰、火、泥、河與所有陷阱，但不能穿牆，也不能進入虛空。', x, y + 66);
        ctx.fillStyle = PAL.textDim; ctx.font = `11px ${DH.FONT}`; ctx.textAlign = 'right'; ctx.fillText('點擊空白處關閉', x + w, y + 84); ctx.textAlign = 'left';
        return;
      }
      const el = DH.ELEMENTS[u.element];
      ctx.font = `bold 15px ${DH.FONT}`; ctx.fillStyle = PAL.text;
      const title = u.side === 'hero' ? `${u.name}・${u.cls}` : u.name;
      ctx.fillText(title, x, y + 8);
      let tx = x + ctx.measureText(title).width + 10;
      const chips = [[el.name, el.color], [u.pattern.label, PAL[u.pattern.kind]]];
      if (u.side === 'monster') chips.push([DH.RACE_NAMES[u.def.race] || '怪物', '#c9b07a'], [`速度 ${u.speed}`, PAL.textDim], [`AI：${DH.AI_NAMES[u.ai]}`, PAL.textDim]);
      else chips.push([DH.SPECIES[u.def.species], '#b9a9d9']);
      ctx.font = `bold 11px ${DH.FONT}`;
      for (const [t, c] of chips) { const tw = ctx.measureText(t).width + 12; S.rr(ctx, tx, y, tw, 17, 8); ctx.fillStyle = c; ctx.fill(); ctx.fillStyle = '#1a1420'; ctx.fillText(t, tx + 6, y + 8.5); tx += tw + 6; }
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
      ctx.fillText(`HP ${u.hp}/${u.maxHp}　攻擊 ${u.atk}　防禦 ${u.defense}${u.armor ? '　重甲 ' + u.armor + ' 層' : ''}　${u.pattern.kindLabel}：${u.pattern.kind === 'melee' ? '攻擊相鄰格的敵人' : u.pattern.kind === 'ranged' ? '攻擊每條線上第一個目標，友方會擋線' : '穿透整條線，打到所有敵人'}`, x, y + 30);
      const tl = u.talents.map(t => `【${DH.TALENTS[t].name}】${DH.TALENTS[t].desc}`);
      if (u.side === 'monster' && u.def.race) {
        const race = u.def.race;
        const cls = Object.entries(DH.CLASS_VS_RACE).filter(([k, v]) => v[0] === race).map(([k]) => DH.CLASSES[k].cls);
        const sp = Object.entries(DH.SPECIES_VS_RACE).filter(([k, v]) => v.beats === race).map(([k]) => DH.SPECIES[k]);
        const wk = Object.entries(DH.SPECIES_VS_RACE).filter(([k, v]) => v.weak === race).map(([k]) => DH.SPECIES[k]);
        tl.unshift(`【克制】職業專精：${cls.join('、') || '無'}；種族克制：${sp.join('、') || '無'}；被牠克制：${wk.join('、') || '無'}`);
      } else if (u.side === 'hero') {
        const cv = DH.CLASS_VS_RACE[u.def.classKey], sp = DH.SPECIES_VS_RACE[u.def.species];
        tl.unshift(`【克制】專精：對${DH.RACE_NAMES[cv[0]]} +${Math.round(cv[1] * 100)}%；種族：克制${DH.RACE_NAMES[sp.beats]}、被${DH.RACE_NAMES[sp.weak]}克制`);
      }
      if (u.sig) tl.unshift(`【專武 ${u.sig.name} Lv.${u.sig.level}】${DH.SIG_SPECIES[u.sig.species].name}：${DH.sigSpeciesDesc(u.sig.species, u.sig.level)}`, `【${u.sig.trait.name}】${DH.sigTraitDesc(u.id, u.sig.level, u.sig.variant)}`);
      if (!tl.length) tl.push('沒有天賦');
      ctx.font = `11px ${DH.FONT}`;
      tl.slice(0, 3).forEach((s, i) => { ctx.fillStyle = PAL.text; ctx.fillText(s.length > 44 ? s.slice(0, 43) + '…' : s, x, y + 48 + i * 15); });
      ctx.fillStyle = PAL.textDim; ctx.font = `11px ${DH.FONT}`; ctx.textAlign = 'right'; ctx.fillText('點擊空白處關閉', x + w, y + 84); ctx.textAlign = 'left';
    }
    drawBanner(ctx) {
      const b = this.banner, p = b.t / b.dur;
      const a = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 360, C.W, 96);
      ctx.fillStyle = PAL.gold; ctx.fillRect(0, 360, C.W, 3); ctx.fillRect(0, 453, C.W, 3);
      ctx.font = `bold 34px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold;
      ctx.translate(C.W / 2 + (p < 0.15 ? (1 - p / 0.15) * 80 : 0), 408); ctx.fillText(b.text, 0, 0);
      ctx.restore();
    }
    drawEnd(ctx) {
      const won = this.state === 'won';
      ctx.save();
      ctx.fillStyle = 'rgba(6,4,12,0.72)'; ctx.fillRect(0, 0, C.W, C.H);
      const top = won ? 230 : 300, ph = won ? 440 : 330;
      S.rr(ctx, 60, top, 420, ph, 22); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = won ? PAL.gold : '#7a3a3a'; ctx.stroke();
      ctx.font = `bold 36px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = won ? PAL.gold : '#ff6a5a';
      ctx.fillText(won ? '地牢攻略成功！' : '全軍覆沒', C.W / 2, top + 50);
      if (won) {
        for (let i = 0; i < 3; i++) {
          const x = C.W / 2 + (i - 1) * 70, y = top + 120, lit = i < this.stars;
          this.drawStar(ctx, x, y, lit ? 30 : 26, lit ? PAL.gold : '#3a3344', lit ? PAL.goldDark : '#2a2430');
        }
        ctx.font = `14px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(this.stars === 3 ? '全員生還' : `${this.heroes.filter(h => !h.alive).length} 名英雄陣亡`, C.W / 2, top + 168);
        const r = this.reward;
        if (r) {
          S.rr(ctx, 84, top + 190, 372, 118, 12); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
          ctx.textAlign = 'left'; ctx.font = `bold 14px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(r.first ? '戰利品（首次通關加成）' : '戰利品', 100, top + 208);
          ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.text;
          const xpStr = Object.entries(r.xp).map(([k, v]) => `${k === 'rainbow' ? '彩虹' : DH.ELEMENTS[k].name}經驗 ${v}`).join('　');
          ctx.fillText(`金幣 +${r.gold}　寶石 +${r.gems}${r.tokens ? '　天賦代幣 +' + r.tokens : ''}`, 100, top + 232);
          ctx.fillText(xpStr, 100, top + 254);
          if (r.gear) { ctx.fillStyle = DH.RARITIES[r.gear.rarity].color; ctx.fillText(`裝備：${DH.gearLabel(r.gear)}（${DH.GEAR_SLOTS.find(sl => sl.key === r.gear.slot).name}，${DH.gearStatLabel(r.gear)}）`, 100, top + 276); }
          else { ctx.fillStyle = PAL.textDim; ctx.fillText('這次沒有掉落裝備', 100, top + 276); }
          ctx.textAlign = 'center';
        }
      } else {
        ctx.font = `15px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
        ctx.fillText('試著讓怪物同時被多名英雄攻擊，', C.W / 2, 420); ctx.fillText('並把牧師留到最後再碰，讓他先出手治療。', C.W / 2, 446);
      }
      const bx = 100, by = top + ph - 90, bw = 160, bh = 54;
      this.button(ctx, bx, by, bw, bh, '返回地圖', PAL.panelLight, () => this.game.showCampaign());
      if (won && this.game.nextDungeon(this.dungeon.id)) this.button(ctx, bx + 180, by, bw, bh, '下一關 ▶', PAL.gold, () => this.game.startDungeon(this.game.nextDungeon(this.dungeon.id)), '#2a2030');
      else this.button(ctx, bx + 180, by, bw, bh, '再挑戰一次', PAL.gold, () => this.game.startDungeon(this.dungeon), '#2a2030');
      ctx.restore();
    }
    drawStar(ctx, x, y, r, fill, stroke) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.closePath(); S.fillStroke(ctx, fill, stroke, 3);
    }
    button(ctx, x, y, w, h, label, fill, onClick, textColor) {
      S.rr(ctx, x, y, w, h, 14); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
      S.rr(ctx, x + 3, y + 3, w - 6, h / 2 - 3, 10); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
      ctx.font = `bold 18px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = textColor || PAL.text; ctx.fillText(label, x + w / 2, y + h / 2 + 1);
      this.buttons.push({ x, y, w, h, onClick });
    }
  }
  DH.Battle = Battle;
})(window.DH);
