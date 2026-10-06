// 戰役：8 章 × 20 關，章節切換 + 關卡格子
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const TERRAIN_COLORS = { '#': '#6a6472', 'R': '#8a7a66', 'I': '#bfe3f7', 'F': '#ff7a2a', 'M': '#7a5a38', 'W': '#2f6a98', 'B': '#9a6a3a' };

  class Campaign extends UI.Screen {
    constructor(game) {
      super(game);
      const stars = game.meta.d.stars;
      let firstOpen = DH.DUNGEONS.findIndex(d => !stars[d.id]);
      if (firstOpen < 0) firstOpen = DH.DUNGEONS.length - 1;
      const d = DH.DUNGEONS[firstOpen];
      this.chapter = d.chapter; this.selectedId = d.id;
    }
    unlocked(d) { return d.id === 1 || !!this.game.meta.d.stars[d.id - 1] || this.game.unlockAll; }
    chapterUnlocked(chId) { return this.unlocked(DH.levelsOf(chId)[0]); }
    draw(ctx) {
      this.buttons = [];
      const ch = DH.CHAPTERS[this.chapter - 1], T = DH.THEMES[ch.theme], stars = this.game.meta.d.stars;
      const g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, T.bg1); g.addColorStop(1, T.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      ctx.save(); ctx.globalAlpha = 0.25;
      for (let i = 0; i < 30; i++) { const x = (i * 131) % C.W, y = 100 + ((i * 97) % 500), r = 10 + (i % 4) * 6; S.circ(ctx, x, y, r); ctx.fillStyle = T.deco; ctx.fill(); }
      ctx.restore();
      UI.header(this, ctx, '戰役');
      // 章節列
      const levels = DH.levelsOf(ch.id), chStars = levels.reduce((a, d) => a + (stars[d.id] || 0), 0);
      UI.panel(ctx, 12, 90, 516, 74, { radius: 16 });
      const prevOk = this.chapter > 1, nextOk = this.chapter < DH.CHAPTERS.length && this.chapterUnlocked(this.chapter + 1);
      UI.button(this, ctx, 22, 102, 50, 50, '◀', { size: 18, disabled: !prevOk, onClick: () => { this.chapter--; this.selectedId = DH.levelsOf(this.chapter)[0].id; } });
      UI.button(this, ctx, 468, 102, 50, 50, '▶', { size: 18, disabled: !nextOk, onClick: () => { this.chapter++; this.selectedId = DH.levelsOf(this.chapter)[0].id; } });
      ctx.font = `bold 22px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; ctx.fillText(`第 ${ch.id} 章　${ch.name}`, C.W / 2, 116);
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`★ ${chStars} / 60　　總計 ★ ${Object.values(stars).reduce((a, b) => a + b, 0)} / ${DH.DUNGEONS.length * 3}`, C.W / 2, 144);
      // 關卡格 4×5
      const cols = 5, bw = 88, bh = 74, gap = 10, x0 = (C.W - cols * bw - (cols - 1) * gap) / 2, y0 = 178;
      levels.forEach((d, i) => {
        const x = x0 + (i % cols) * (bw + gap), y = y0 + Math.floor(i / cols) * (bh + gap);
        const open = this.unlocked(d), st = stars[d.id] || 0, sel = d.id === this.selectedId;
        S.rr(ctx, x, y + 3, bw, bh, 12); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
        S.rr(ctx, x, y, bw, bh, 12); S.fillStroke(ctx, !open ? '#2c2834' : d.boss ? '#6a2a2a' : st ? '#3f6e36' : '#8a6a2c', sel ? PAL.gold : '#1a1420', sel ? 3 : 2);
        S.rr(ctx, x + 3, y + 3, bw - 6, bh / 2 - 3, 9); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill();
        ctx.font = `bold ${d.boss ? 13 : 20}px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = open ? '#fff' : '#6a6478';
        if (!open) { S.rr(ctx, x + bw / 2 - 7, y + 24, 14, 12, 3); ctx.fillStyle = '#7a7488'; ctx.fill(); ctx.beginPath(); ctx.arc(x + bw / 2, y + 23, 5.5, Math.PI, 0); ctx.lineWidth = 3; ctx.strokeStyle = '#7a7488'; ctx.stroke(); }
        else ctx.fillText(d.boss ? 'BOSS' : String(d.index), x + bw / 2, y + 28);
        for (let k = 0; k < 3; k++) UI.star(ctx, x + bw / 2 + (k - 1) * 14, y + 54, 6, k < st ? PAL.gold : 'rgba(0,0,0,0.45)');
        if (open) this.buttons.push({ x, y, w: bw, h: bh, onClick: () => { this.selectedId = d.id; } });
      });
      // 資訊面板
      const d = DH.DUNGEONS.find(l => l.id === this.selectedId) || levels[0];
      UI.panel(ctx, 12, 608, 516, 274, { radius: 18 });
      ctx.textAlign = 'left'; ctx.font = `bold 20px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`${d.id}. ${d.name}`, 28, 634);
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${d.stages.length} 波　怪物強度 ×${d.scale.hp.toFixed(1)}　推薦戰力 ${Math.round(700 * d.scale.hp)}`, 28, 656);
      ctx.fillStyle = PAL.text; UI.wrap(ctx, d.desc, 28, 676, 484, 17, 2);
      // 地形圖例
      const tt = DH.terrainTypes(d);
      let tx = 28; ctx.font = `bold 11px ${DH.FONT}`;
      ctx.fillStyle = PAL.textDim; ctx.fillText('地形：', tx, 718); tx += 36;
      if (!tt.length) { ctx.fillStyle = PAL.text; ctx.fillText('平地', tx, 718); }
      for (const t of tt) { S.rr(ctx, tx, 710, 14, 14, 3); ctx.fillStyle = TERRAIN_COLORS[t]; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#1a1420'; ctx.stroke(); ctx.fillStyle = PAL.text; ctx.fillText(DH.TERRAIN_NAMES[t], tx + 18, 718); tx += 18 + ctx.measureText(DH.TERRAIN_NAMES[t]).width + 10; }
      // 地形縮圖
      const mx = 420, my = 630, cs = 12;
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) { const t = d.terrain[r][c]; ctx.fillStyle = t === '.' ? 'rgba(255,255,255,0.12)' : TERRAIN_COLORS[t]; ctx.fillRect(mx + c * cs, my + r * cs, cs - 1, cs - 1); }
      for (const m of d.stages[0]) { ctx.fillStyle = '#ff5a4a'; ctx.fillRect(mx + m.pos[0] * cs + 2, my + m.pos[1] * cs + 2, cs - 5, cs - 5); }
      // 隊伍
      ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('目前隊伍', 28, 748);
      const team = this.game.meta.teamHeroes();
      team.forEach((h, i) => {
        const hd = this.game.meta.def(h), x = 56 + i * 60, y = 796;
        S.rr(ctx, x - 26, y - 34, 52, 68, 10); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = DH.ELEMENTS[hd.element].dark; ctx.stroke();
        ctx.save(); ctx.translate(x, y - 2); ctx.scale(0.6, 0.6); DH.drawHero(ctx, { look: hd.look, element: hd.element, uid: i, weaponRarity: h.gear.weapon ? h.gear.weapon.rarity : null, shieldHp: 0 }, 0, 0, this.time, { noShadow: true }); ctx.restore();
        ctx.font = `10px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.text; ctx.fillText(`Lv.${h.level}`, x, y + 25);
        if (i === 0) DH.drawBadge(ctx, x - 18, y - 26, 8, '隊', PAL.gold, '#2a2030', 9);
      });
      const power = team.reduce((a, h) => a + this.game.meta.power(h), 0);
      ctx.textAlign = 'left'; ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`隊伍戰力 ${power}`, 372, 748);
      const names = [...new Set(d.stages.flat().map(m => DH.MONSTERS[m.id].name))];
      ctx.fillStyle = PAL.text; UI.wrap(ctx, '敵人：' + names.join('、'), 372, 768, 140, 15, 3);
      UI.button(this, ctx, 372, 828, 140, 44, '出發 ▶', { fill: PAL.gold, textColor: '#2a2030', size: 19, onClick: () => this.game.showTeam(d) });
      UI.nav(this, ctx, 'campaign');
    }
  }
  DH.Campaign = Campaign;
})(window.DH);
