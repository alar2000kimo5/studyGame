// 故事畫面：5★ 英雄的故事線列表、章節與劇情對話
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  class Stories extends UI.Screen {
    constructor(game, heroId, outroIdx) {
      super(game);
      this.sel = heroId || null;
      this.dialog = null;
      if (heroId && outroIdx !== null && outroIdx !== undefined) {
        const st = DH.storyOf(heroId); if (st) this.dialog = { story: st, idx: outroIdx, text: st.chapters[outroIdx].outro, kind: 'outro' };
      }
    }
    draw(ctx) {
      this.buttons = [];
      this.background(ctx, '#1a1626', '#08060e');
      const m = this.game.meta;
      if (!this.sel) this.drawList(ctx, m); else this.drawDetail(ctx, m);
      UI.header(this, ctx, this.sel ? `${DH.HEROES[this.sel].name}的故事` : '英雄故事', this.sel ? () => { this.sel = null; this.scrollY = 0; } : null);
      if (!this.sel) UI.nav(this, ctx, 'stories');
      if (this.dialog) this.drawDialog(ctx, m);
    }
    drawList(ctx, m) {
      const owned = new Set(m.d.heroes.map(h => h.id));
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.textDim;
      ctx.fillText('每位 5★ 英雄有五章故事，每章一場劇情戰鬥（主角必須上場）。全部完成送該英雄的專武。', 24, 100 - this.scrollY);
      const rowH = 86, secH = 30, y0 = 118;
      // 排序：已擁有且未完成（進行中優先）→ 已擁有且完成 → 尚未擁有
      const rank = st => { const own = owned.has(st.heroId), p = m.storyProgress(st.heroId); return own ? (p >= 5 ? 2 : p > 0 ? 0 : 1) : 3; };
      const list = DH.STORIES.map((st, i) => ({ st, i, r: rank(st) })).sort((a, b) => a.r - b.r || a.i - b.i);
      const nOwn = list.filter(o => o.r < 3).length;
      const sections = [{ at: 0, title: `可以遊玩（${nOwn}）`, show: nOwn > 0 }, { at: nOwn, title: `尚未擁有英雄（${list.length - nOwn}）・可先閱讀，召喚到英雄後才能戰鬥`, show: nOwn < list.length }];
      const rowY = k => y0 + k * rowH + sections.filter(sc => sc.show && sc.at <= k).length * secH;
      this.scrollMax = Math.max(0, rowY(list.length) - (C.H - 80));
      ctx.save(); ctx.beginPath(); ctx.rect(0, 86, C.W, C.H - 86 - 76); ctx.clip();
      for (const sc of sections) {
        if (!sc.show) continue;
        const y = rowY(sc.at) - secH - this.scrollY;
        ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = sc.at === 0 ? PAL.gold : PAL.textDim; ctx.fillText(sc.title, 20, y + 15);
        ctx.fillStyle = sc.at === 0 ? PAL.gold : '#4a4458'; ctx.fillRect(20, y + 26, 500, 1.5);
      }
      list.forEach(({ st, i }, k) => {
        const y = rowY(k) - this.scrollY; if (y > C.H || y + rowH < 80) return;
        const d = DH.HEROES[st.heroId], el = DH.ELEMENTS[d.element], prog = m.storyProgress(st.heroId), own = owned.has(st.heroId), done = prog >= 5;
        ctx.save(); if (!own) ctx.globalAlpha = 0.55;
        S.rr(ctx, 16, y, 508, rowH - 8, 12); ctx.fillStyle = done ? '#2a2a18' : PAL.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = done ? PAL.gold : el.dark; ctx.stroke();
        ctx.save(); ctx.beginPath(); S.rr(ctx, 17, y + 1, 70, rowH - 10, 11); ctx.clip(); ctx.translate(52, y + 44); ctx.scale(0.75, 0.75); DH.drawHero(ctx, { look: d.look, element: d.element, uid: i, shieldHp: 0 }, 0, 0, this.time, { noShadow: true }); ctx.restore();
        ctx.font = `bold 15px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.text; ctx.fillText(`${d.name}・${d.cls}　《${st.title}》`, 96, y + 20);
        ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${DH.ELEMENTS[d.element].name}色・${DH.SPECIES[d.species]}　緣份夥伴：${st.partner ? DH.HEROES[st.partner].name : '無'}`, 96, y + 40);
        UI.bar(ctx, 96, y + 56, 300, 10, prog / 5, done ? PAL.gold : el.color, `${prog} / 5 章`);
        ctx.textAlign = 'right'; ctx.font = `bold 12px ${DH.FONT}`; ctx.fillStyle = !own ? '#ff8a7a' : done ? PAL.gold : prog ? '#7ad8ff' : PAL.textDim; ctx.fillText(!own ? '未擁有' : done ? '已完成' : prog ? '進行中' : '可開始', 508, y + 20);
        ctx.restore();
        this.buttons.push({ x: 16, y, w: 508, h: rowH - 8, onClick: () => { this.sel = st.heroId; this.scrollY = 0; } });
      });
      ctx.restore();
    }
    drawDetail(ctx, m) {
      const st = DH.storyOf(this.sel), d = DH.HEROES[st.heroId], el = DH.ELEMENTS[d.element], prog = m.storyProgress(st.heroId), own = m.d.heroes.some(h => h.id === st.heroId);
      const sy = -this.scrollY;
      const g = ctx.createRadialGradient(C.W / 2, 200 + sy, 10, C.W / 2, 200 + sy, 220); g.addColorStop(0, el.color + '55'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 60 + sy, C.W, 300);
      ctx.save(); ctx.translate(C.W / 2, 190 + sy); ctx.scale(2, 2); DH.drawHero(ctx, { look: d.look, element: d.element, uid: 9, shieldHp: 0 }, 0, 0, this.time); ctx.restore();
      ctx.font = `bold 24px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(`《${st.title}》`, C.W / 2, 282 + sy); ctx.fillText(`《${st.title}》`, C.W / 2, 282 + sy);
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${d.flavor}`, C.W / 2, 306 + sy);
      ctx.fillText(`緣份夥伴：${st.partner ? DH.HEROES[st.partner].name + '（第 4 章帶他上場有額外寶石）' : '無'}　完成獎勵：專武「${DH.signatureName(st.heroId, 0)}」Lv.2`, C.W / 2, 326 + sy);
      let y = 350 + sy;
      st.chapters.forEach((ch, i) => {
        const state = i < prog ? 'done' : i === prog ? 'next' : 'locked';
        const h = 96;
        UI.panel(ctx, 16, y, 508, h, { radius: 14, fill: state === 'done' ? 'rgba(40,40,24,0.8)' : state === 'next' ? 'rgba(40,30,16,0.9)' : 'rgba(16,12,24,0.7)', stroke: state === 'next' ? PAL.gold : state === 'done' ? '#8a7a3a' : PAL.frame });
        ctx.textAlign = 'left'; ctx.font = `bold 14px ${DH.FONT}`; ctx.fillStyle = state === 'locked' ? PAL.textDim : PAL.gold; ctx.fillText(`第 ${i + 1} 章　${ch.title}${ch.boss ? '（首領）' : ''}${ch.bonus ? '（緣份章）' : ''}`, 30, y + 18);
        ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = state === 'locked' ? PAL.textDim : PAL.text;
        UI.wrap(ctx, state === 'locked' ? '完成前一章後解鎖。' : ch.intro, 30, y + 40, 360, 15, 3);
        ctx.fillStyle = PAL.textDim; ctx.font = `10px ${DH.FONT}`; ctx.fillText(`敵人：${[...new Set(ch.monsters.map(id => DH.MONSTERS[id].name))].join('、')}`, 30, y + 86);
        if (state === 'done') { UI.button(this, ctx, 404, y + 12, 104, 30, '重溫', { size: 12, onClick: () => { this.dialog = { story: st, idx: i, text: ch.intro, kind: 'replay' }; } }); UI.button(this, ctx, 404, y + 50, 104, 30, '再戰', { size: 12, disabled: !own, onClick: () => this.game.startStoryBattle(st, i) }); }
        else if (state === 'next') UI.button(this, ctx, 404, y + 28, 104, 40, own ? '開始' : '需擁有英雄', { size: own ? 15 : 11, fill: PAL.gold, textColor: '#2a2030', disabled: !own, onClick: () => { this.dialog = { story: st, idx: i, text: ch.intro, kind: 'intro' }; } });
        y += h + 10;
      });
      this.scrollMax = Math.max(0, y - sy - C.H + 20);
    }
    drawDialog(ctx, m) {
      this.buttons = [];
      const dl = this.dialog, st = dl.story, d = DH.HEROES[st.heroId], ch = st.chapters[dl.idx];
      ctx.fillStyle = 'rgba(4,2,10,0.9)'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.save(); ctx.translate(130, 420); ctx.scale(2.4, 2.4); DH.drawHero(ctx, { look: d.look, element: d.element, uid: 5, shieldHp: 0 }, 0, 0, this.time); ctx.restore();
      UI.panel(ctx, 20, 520, 500, 250, { radius: 16, fill: 'rgba(22,16,34,0.96)', stroke: PAL.gold });
      ctx.font = `bold 16px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText(`第 ${dl.idx + 1} 章　${ch.title}${dl.kind === 'outro' ? '　— 戰後' : ''}`, 40, 546);
      ctx.font = `14px ${DH.FONT}`; ctx.fillStyle = PAL.text; UI.wrap(ctx, dl.text, 40, 580, 460, 24, 6);
      if (dl.kind === 'intro' || dl.kind === 'replay') {
        if (ch.bonus && st.partner) { ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`緣份章：帶 ${DH.HEROES[st.partner].name} 一起上場可額外獲得 300 寶石`, 40, 730); }
        UI.button(this, ctx, 60, 790, 170, 48, '關閉', { onClick: () => { this.dialog = null; } });
        UI.button(this, ctx, 310, 790, 170, 48, '出發 ▶', { fill: PAL.gold, textColor: '#2a2030', size: 18, onClick: () => { if (!this.game.startStoryBattle(st, dl.idx)) this.dialog = null; } });
      } else {
        const done = m.storyProgress(st.heroId) >= 5 && dl.idx === 4;
        if (done) { ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = '#ff9ae0'; ctx.fillText(`故事完成！已獲得專武「${DH.signatureName(st.heroId, 0)}」Lv.2`, 40, 740); }
        UI.button(this, ctx, 185, 790, 170, 48, '繼續', { fill: PAL.gold, textColor: '#2a2030', onClick: () => { this.dialog = null; } });
      }
    }
  }
  DH.Stories = Stories;
})(window.DH);
