// 兵營：所有英雄列表
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, UI = DH.UI;
  class Barracks extends UI.Screen {
    constructor(game) { super(game); }
    sorted() { const m = this.game.meta; return m.d.heroes.slice().sort((a, b) => b.stars - a.stars || m.power(b) - m.power(a)); }
    draw(ctx) {
      this.buttons = [];
      this.background(ctx);
      const list = this.sorted(), cols = 3, cw = 160, ch = 190, gap = 10, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2, y0 = 96;
      const rows = Math.ceil(list.length / cols);
      this.scrollMax = Math.max(0, y0 + rows * (ch + gap) - (C.H - 80));
      ctx.save(); ctx.beginPath(); ctx.rect(0, 86, C.W, C.H - 86 - 76); ctx.clip();
      list.forEach((h, i) => {
        const x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap) - this.scrollY;
        if (y > C.H || y + ch < 80) return;
        const inTeam = this.game.meta.d.team.indexOf(h.uid);
        UI.heroCard(this, ctx, h, x, y, cw, ch, { badge: inTeam >= 0 ? (inTeam === 0 ? '隊長' : '出戰') : null, onClick: () => this.game.showHeroCard(h.uid) });
      });
      ctx.restore();
      UI.header(this, ctx, `兵營（${list.length} 名英雄）`);
      UI.nav(this, ctx, 'barracks');
    }
  }
  DH.Barracks = Barracks;
})(window.DH);
