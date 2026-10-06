// 戰鬥場景：拖曳換位 → 英雄依序行動 → 怪物行動 → 下一回合
(function (DH) {
  const C = DH.CONFIG, G = DH.Grid, PAL = DH.PALETTE, S = DH.shapes;
  DH.timeScale = 1;
  const sleep = ms => new Promise(r => setTimeout(r, ms * DH.timeScale));
  DH.sleep = sleep;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  class Battle {
    constructor(game, dungeon) {
      this.game = game; this.dungeon = dungeon; this.theme = DH.THEMES[dungeon.theme];
      this.time = 0; this.turn = 1; this.stageIdx = 0; this.state = 'idle'; this.dead = false;
      this.fx = new DH.FX(); this.log = []; this.info = null; this.banner = null;
      this.obstacles = new Set(dungeon.obstacles.map(p => G.key(p[0], p[1])));
      const n = dungeon.heroes.length, c0 = Math.floor((C.COLS - n) / 2);
      this.heroes = dungeon.heroes.map((id, i) => new DH.Hero(id, [c0 + i, C.HERO_ROW]));
      this.turnOrder = this.heroes.slice(); this.turnOrder.forEach((h, i) => h.order = i + 1);
      this.monsters = [];
      this.drag = null; this.stars = 0; this.buttons = [];
      this.spawnStage(0, true);
      this.addLog(`${dungeon.name}　第 1 波`);
    }

    // ── 查詢 ──────────────────────────────────────────
    allUnits() { return this.heroes.concat(this.monsters); }
    unitAt(c, r) { return this.allUnits().find(u => u.alive && u.col === c && u.row === r) || null; }
    isObstacle(c, r) { return this.obstacles.has(G.key(c, r)); }
    isFree(c, r) { return G.inBounds(c, r) && !this.isObstacle(c, r) && !this.unitAt(c, r); }
    aliveMonsters() { return this.monsters.filter(m => m.alive); }
    aliveHeroes() { return this.heroes.filter(h => h.alive); }
    addLog(s) { this.log.push(s); if (this.log.length > 3) this.log.shift(); }

    spawnStage(idx, first) {
      for (const sp of this.dungeon.stages[idx]) {
        let pos = sp.pos;
        if (!this.isFree(pos[0], pos[1])) {
          let found = null;
          for (let r = 0; r < C.ROWS && !found; r++) for (let dc = 0; dc < C.COLS && !found; dc++) {
            const c = (pos[0] + (dc % 2 ? -1 : 1) * Math.ceil(dc / 2) + C.COLS) % C.COLS;
            if (this.isFree(c, r)) found = [c, r];
          }
          pos = found || pos;
        }
        const m = new DH.Monster(sp.id, pos);
        m.dropY = first ? 0 : 260 + Math.random() * 120;
        this.monsters.push(m);
      }
    }

    // ── 輸入 ──────────────────────────────────────────
    pointerDown(x, y) {
      for (const b of this.buttons) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.onClick(); return; }
      if (this.state !== 'idle') return;
      if (y < 100 && x < 70) { this.game.showCampaign(); return; }
      const cell = G.pixelToCell(x, y);
      if (cell) {
        const u = this.unitAt(cell[0], cell[1]);
        if (u && u.side === 'hero') { this.startDrag(u, x, y); return; }
        this.info = u || null; return;
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
      this.drag = { hero, start: hero.pos, last: hero.pos, swaps: [], changed: false, px: x, py: y, timer: C.MOVE_TIME };
      this.state = 'drag'; this.info = null;
    }
    dragStep(x, y) {
      const d = this.drag, hero = d.hero;
      const cell = G.pixelToCell(Math.max(C.BOARD_X, Math.min(C.BOARD_X + C.COLS * C.CELL - 1, x)), Math.max(C.BOARD_Y, Math.min(C.BOARD_Y + C.ROWS * C.CELL - 1, y)));
      if (!cell) return;
      let guard = 0;
      while ((cell[0] !== d.last[0] || cell[1] !== d.last[1]) && guard++ < 16) {
        const step = [d.last[0] + Math.sign(cell[0] - d.last[0]), d.last[1] + Math.sign(cell[1] - d.last[1])];
        if (!this.tryStep(step)) break;
      }
    }
    tryStep(to) {
      const d = this.drag, hero = d.hero, from = d.last;
      if (!G.inBounds(to[0], to[1]) || this.isObstacle(to[0], to[1])) return false;
      const u = this.unitAt(to[0], to[1]);
      if (u && u !== hero) {
        if (u.side === 'hero') { u.setCell(from[0], from[1]); d.swaps.push(u); }
        else {
          if (u.has('big')) return false;
          if (hero.has('tumble')) { u.setCell(from[0], from[1]); this.fx.ring(u.x, u.y, PAL.highlight); }
          else if (hero.has('push')) {
            const dest = [to[0] + (to[0] - from[0]), to[1] + (to[1] - from[1])];
            if (!this.isFree(dest[0], dest[1])) return false;
            u.setCell(dest[0], dest[1]); this.fx.ring(u.x, u.y, PAL.preview);
          } else return false;
        }
        d.changed = true;
      }
      hero.setCell(to[0], to[1]); d.last = to;
      if (to[0] !== d.start[0] || to[1] !== d.start[1]) d.changed = true;
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
      this.turn++;
      this.state = 'idle';
    }

    async heroAct(h) {
      const res = DH.resolveTargets(h.pattern, h.pos,
        (c, r) => { const u = this.unitAt(c, r); return !!u && u.side === 'monster'; },
        (c, r) => { const u = this.unitAt(c, r); return !!u && u.side === 'hero' && u !== h; },
        (c, r) => this.isObstacle(c, r));
      const targets = res.targets.map(p => this.unitAt(p[0], p[1]));
      const heals = h.has('heal') ? res.allies.map(p => this.unitAt(p[0], p[1])).filter(a => a.hp < a.maxHp) : [];
      if (!targets.length && !heals.length) return;
      this.actor = h;
      const el = DH.ELEMENTS[h.element];
      if (h.pattern.kind === 'melee') {
        const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length, ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
        const dx = tx - h.x, dy = ty - h.y, len = Math.hypot(dx, dy) || 1;
        h.offX = dx / len * 18; h.offY = dy / len * 18;
        await sleep(120);
        for (const t of targets) this.fx.slash(t.x, t.y - 8, '#fff');
      } else if (h.pattern.kind === 'ranged') {
        for (const t of targets) this.fx.projectile({ x: h.x, y: h.y - 10 }, { x: t.x, y: t.y - 6 }, el.color, 0.22);
        await sleep(220);
      } else {
        for (const t of targets) this.fx.beam({ x: h.x, y: h.y - 10 }, { x: t.x, y: t.y - 6 }, el.color);
        for (const a of heals) this.fx.beam({ x: h.x, y: h.y - 10 }, { x: a.x, y: a.y - 6 }, PAL.heal);
        await sleep(260);
      }
      for (const t of targets) {
        const r = DH.calcDamage(h, t, { dirsHit: res.dirsHit });
        t.takeDamage(r.dmg);
        const col = r.cm > 1 ? PAL.gold : (r.cm < 1 ? '#b8b8c8' : '#fff');
        this.fx.text(t.x, t.y - 30, `-${r.dmg}`, col, { size: r.cm > 1 ? 24 : 20 });
        if (r.notes.length) this.fx.text(t.x, t.y - 52, r.notes.join('·'), PAL.gold, { size: 12, dur: 0.9 });
        this.fx.burst(t.x, t.y - 6, el.color, 8);
        if (h.has('burn') && t.alive) t.status.burn = { turns: 2, dmg: Math.round(h.atk * 0.15) };
        if (h.has('poison') && t.alive) t.status.poison = { turns: 3, dmg: Math.round(h.atk * 0.2) };
        if (!t.alive) this.fx.burst(t.x, t.y - 10, '#fff', 14);
      }
      for (const a of heals) { const n = a.heal(Math.round(h.atk * 1.5)); if (n > 0) this.fx.text(a.x, a.y - 30, `+${n}`, PAL.heal); }
      if (targets.length) this.addLog(`${h.name} 攻擊 ${targets.map(t => t.name).join('、')}`);
      else this.addLog(`${h.name} 治療隊友`);
      await sleep(140);
      h.offX = 0; h.offY = 0; this.actor = null;
      await sleep(260);
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

    async monsterPhase() {
      await this.tickStatus(this.monsters);
      this.monsters = this.monsters.filter(m => m.alive || m.alpha > 0);
      if (!this.aliveMonsters().length) return;
      const order = this.aliveMonsters().slice();
      shuffle(order); order.sort((a, b) => b.speed - a.speed);
      for (const m of order) {
        if (this.dead) return;
        if (!m.alive || !this.aliveHeroes().length) continue;
        this.actor = m;
        const plan = DH.planMonster(m, this);
        if (!plan) continue;
        for (const step of plan.path) { m.setCell(step[0], step[1]); await sleep(120); }
        if (plan.path.length) await sleep(100);
        const targets = plan.targets.filter(h => h.alive);
        if (targets.length) {
          const el = DH.ELEMENTS[m.element];
          if (m.pattern.kind === 'melee') {
            const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length, ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
            const dx = tx - m.x, dy = ty - m.y, len = Math.hypot(dx, dy) || 1;
            m.offX = dx / len * 16; m.offY = dy / len * 16; await sleep(120);
            for (const t of targets) this.fx.slash(t.x, t.y - 8, el.light);
          } else if (m.pattern.kind === 'ranged') {
            for (const t of targets) this.fx.projectile({ x: m.x, y: m.y - 10 }, { x: t.x, y: t.y - 6 }, el.color, 0.25);
            await sleep(250);
          } else {
            for (const t of targets) this.fx.beam({ x: m.x, y: m.y - 10 }, { x: t.x, y: t.y - 6 }, el.color);
            await sleep(280);
          }
          for (const t of targets) {
            const r = DH.calcDamage(m, t, { dirsHit: plan.dirsHit });
            t.takeDamage(r.dmg);
            this.fx.text(t.x, t.y - 30, `-${r.dmg}`, r.cm > 1 ? '#ff6a5a' : '#ffd0d0', { size: r.cm > 1 ? 24 : 20 });
            if (r.notes.length) this.fx.text(t.x, t.y - 52, r.notes.join('·'), '#ff9a8a', { size: 12, dur: 0.9 });
            if (m.has('venom') && t.alive) t.status.poison = { turns: 2, dmg: Math.round(m.atk * 0.2) };
            if (!t.alive) this.fx.burst(t.x, t.y - 10, '#fff', 14);
          }
          this.addLog(`${m.name} 攻擊 ${targets.map(t => t.name).join('、')}`);
          await sleep(140); m.offX = 0; m.offY = 0;
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
      this.game.saveStars(this.dungeon.id, this.stars);
      this.addLog('勝利！');
    }
    defeat() { this.state = 'lost'; this.addLog('全軍覆沒…'); }

    // ── 更新 ──────────────────────────────────────────
    update(dt) {
      this.time += dt;
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
      this.drawTopBar(ctx);
      this.drawBoard(ctx);
      this.drawUnits(ctx);
      this.fx.draw(ctx);
      this.drawBottom(ctx);
      if (this.drag) this.drawTimer(ctx);
      if (this.banner) this.drawBanner(ctx);
      this.buttons = [];
      if (this.state === 'won' || this.state === 'lost') this.drawEnd(ctx);
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
      ctx.fillText(this.state === 'idle' ? '拖曳一名英雄' : this.state === 'drag' ? '放開即行動' : this.state === 'busy' ? (this.actor && this.actor.side === 'monster' ? '怪物行動中' : '英雄行動中') : '', 516, 66);
      ctx.restore();
    }
    drawBoard(ctx) {
      const T = this.theme, bx = C.BOARD_X, by = C.BOARD_Y, bw = C.COLS * C.CELL, bh = C.ROWS * C.CELL;
      ctx.save();
      S.rr(ctx, bx - 10, by - 10, bw + 20, bh + 20, 14); ctx.fillStyle = PAL.frameDark; ctx.fill();
      S.rr(ctx, bx - 7, by - 7, bw + 14, bh + 14, 11); ctx.fillStyle = PAL.frame; ctx.fill();
      S.rr(ctx, bx - 4, by - 4, bw + 8, bh + 8, 8); ctx.fillStyle = T.edge; ctx.fill();
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
        const x = bx + c * C.CELL, y = by + r * C.CELL;
        const base = (c + r) % 2 ? T.a : T.b;
        S.rr(ctx, x + 1.5, y + 1.5, C.CELL - 3, C.CELL - 3, 7); ctx.fillStyle = base; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 7, y + 3.5); ctx.lineTo(x + C.CELL - 7, y + 3.5); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 7, y + C.CELL - 3.5); ctx.lineTo(x + C.CELL - 7, y + C.CELL - 3.5); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.stroke();
        const seed = (c * 7 + r * 13) % 5;
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; S.circ(ctx, x + 14 + seed * 8, y + 20 + seed * 6, 2 + seed % 2); ctx.fill();
        if (this.isObstacle(c, r)) this.drawObstacle(ctx, x, y);
      }
      // 拖曳高光與攻擊預覽
      if (this.drag) this.drawPreview(ctx);
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
      const d = this.drag, p = Math.max(0, d.timer / C.MOVE_TIME);
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
      const el = DH.ELEMENTS[u.element];
      ctx.font = `bold 15px ${DH.FONT}`; ctx.fillStyle = PAL.text;
      const title = u.side === 'hero' ? `${u.name}・${u.cls}` : u.name;
      ctx.fillText(title, x, y + 8);
      let tx = x + ctx.measureText(title).width + 10;
      const chips = [[el.name, el.color], [u.pattern.label, PAL[u.pattern.kind]]];
      if (u.side === 'monster') chips.push([`速度 ${u.speed}`, PAL.textDim], [`AI：${DH.AI_NAMES[u.ai]}`, PAL.textDim]);
      ctx.font = `bold 11px ${DH.FONT}`;
      for (const [t, c] of chips) { const tw = ctx.measureText(t).width + 12; S.rr(ctx, tx, y, tw, 17, 8); ctx.fillStyle = c; ctx.fill(); ctx.fillStyle = '#1a1420'; ctx.fillText(t, tx + 6, y + 8.5); tx += tw + 6; }
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
      ctx.fillText(`HP ${u.hp}/${u.maxHp}　攻擊 ${u.atk}　防禦層數 ${u.armor}　${u.pattern.kindLabel}：${u.pattern.kind === 'melee' ? '攻擊相鄰格的敵人' : u.pattern.kind === 'ranged' ? '攻擊每條線上第一個目標，友方會擋線' : '穿透整條線，打到所有敵人'}`, x, y + 30);
      const tl = u.talents.map(t => `【${DH.TALENTS[t].name}】${DH.TALENTS[t].desc}`);
      if (!tl.length) tl.push('沒有天賦');
      tl.slice(0, 2).forEach((s, i) => { ctx.fillStyle = PAL.text; ctx.fillText(s, x, y + 50 + i * 18); });
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
      S.rr(ctx, 60, 300, 420, 330, 22); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = won ? PAL.gold : '#7a3a3a'; ctx.stroke();
      ctx.font = `bold 36px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = won ? PAL.gold : '#ff6a5a';
      ctx.fillText(won ? '地牢攻略成功！' : '全軍覆沒', C.W / 2, 350);
      if (won) {
        for (let i = 0; i < 3; i++) {
          const x = C.W / 2 + (i - 1) * 70, y = 430, lit = i < this.stars;
          this.drawStar(ctx, x, y, lit ? 30 : 26, lit ? PAL.gold : '#3a3344', lit ? PAL.goldDark : '#2a2430');
        }
        ctx.font = `15px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(this.stars === 3 ? '全員生還' : `${this.heroes.filter(h => !h.alive).length} 名英雄陣亡`, C.W / 2, 486);
      } else {
        ctx.font = `15px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
        ctx.fillText('試著讓怪物同時被多名英雄攻擊，', C.W / 2, 420); ctx.fillText('並把牧師留到最後再碰，讓他先出手治療。', C.W / 2, 446);
      }
      const bx = 100, by = 540, bw = 160, bh = 54;
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
