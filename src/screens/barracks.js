// 兵營：所有英雄列表，可依顏色、種族、職業、星級篩選（只列出已擁有的選項）
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const SORTS = [['stars', '星級'], ['power', '戰力'], ['level', '等級']];
  class Barracks extends UI.Screen {
    constructor(game) {
      super(game);
      // 篩選狀態存在 game 上，從英雄卡返回時保留
      this.st = game.barracksState || (game.barracksState = { element: null, species: null, cls: null, stars: null, sort: 'stars', scrollY: 0 });
      this.scrollY = this.st.scrollY || 0;
    }
    match(h) {
      const d = this.game.meta.def(h), F = this.st;
      return (!F.element || d.element === F.element) && (!F.species || d.species === F.species) && (!F.cls || d.classKey === F.cls) &&
        (!F.stars || (F.stars === 'L' ? d.legendary : h.stars === F.stars && !d.legendary));
    }
    sorted() {
      const m = this.game.meta, k = this.st.sort;
      const cmp = { stars: (a, b) => b.stars - a.stars || m.power(b) - m.power(a), power: (a, b) => m.power(b) - m.power(a), level: (a, b) => b.level - a.level || b.stars - a.stars || m.power(b) - m.power(a) }[k];
      return m.d.heroes.filter(h => this.match(h)).sort(cmp);
    }
    // 一列篩選籤：[值, 文字, 顏色]；超出寬度自動換行
    chipRow(ctx, y0, items, key) {
      let x = 16;
      for (const [val, label, color] of items) {
        ctx.font = `bold 11px ${DH.FONT}`; const w = ctx.measureText(label).width + 12;
        if (x + w > C.W - 16) { x = 16; y0 += 24; }
        const on = this.st[key] === val;
        S.rr(ctx, x, y0, w, 20, 10); ctx.fillStyle = on ? (color || PAL.gold) : 'rgba(255,255,255,0.08)'; ctx.fill();
        if (on) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = on ? '#1a1420' : PAL.text; ctx.fillText(label, x + 6, y0 + 10.5);
        this.buttons.push({ x, y: y0, w, h: 20, onClick: () => { this.st[key] = val; this.scrollY = 0; } });
        x += w + 5;
      }
      return y0 + 24;
    }
    draw(ctx) {
      this.buttons = [];
      this.background(ctx);
      const m = this.game.meta, all = m.d.heroes, defs = all.map(h => [h, m.def(h)]);
      const count = (fn) => defs.filter(([h, d]) => fn(h, d)).length;
      // 篩選列（只顯示擁有的選項，附數量）
      let fy = 94;
      const filterTop = fy;
      const elItems = Object.entries(DH.ELEMENTS).map(([k, e]) => [k, `${e.name}色 ${count((h, d) => d.element === k)}`, e.color]).filter(it => count((h, d) => d.element === it[0]));
      const spItems = Object.entries(DH.SPECIES).map(([k, n]) => [k, `${n} ${count((h, d) => d.species === k)}`, '#b9a9d9']).filter(it => count((h, d) => d.species === it[0]));
      const clItems = Object.entries(DH.CLASSES).map(([k, c]) => [k, `${c.cls} ${count((h, d) => d.classKey === k)}`, '#9ad8c8']).filter(it => count((h, d) => d.classKey === it[0]));
      const stItems = [1, 2, 3, 4, 5].map(s => [s, `${s}★ ${count((h, d) => h.stars === s && !d.legendary)}`, PAL.gold]).filter(it => count((h, d) => h.stars === it[0] && !d.legendary));
      const nL = count((h, d) => d.legendary); if (nL) stItems.push(['L', `傳說 ${nL}`, '#ff6ad5']);
      // 篩選面板背景先畫（高度之後才知道，先估算再覆蓋）
      const rowsH = this._filterH || 150;
      UI.panel(ctx, 8, filterTop - 6, C.W - 16, rowsH + 10, { radius: 14, fill: 'rgba(16,12,24,0.9)' });
      fy = this.chipRow(ctx, fy, [[null, '全部顏色'], ...elItems], 'element');
      fy = this.chipRow(ctx, fy, [[null, '全部種族'], ...spItems], 'species');
      fy = this.chipRow(ctx, fy, [[null, '全部職業'], ...clItems], 'cls');
      fy = this.chipRow(ctx, fy, [[null, '全部星級'], ...stItems], 'stars');
      // 排序與清除
      const list = this.sorted();
      ctx.font = `bold 12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.textDim; ctx.fillText('排序', 20, fy + 10);
      let sx = 54;
      for (const [k, label] of SORTS) {
        const on = this.st.sort === k, w = 46;
        S.rr(ctx, sx, fy, w, 20, 10); ctx.fillStyle = on ? PAL.gold : 'rgba(255,255,255,0.08)'; ctx.fill();
        ctx.font = `bold 11px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = on ? '#1a1420' : PAL.text; ctx.fillText(label, sx + w / 2, fy + 10.5);
        this.buttons.push({ x: sx, y: fy, w, h: 20, onClick: () => { this.st.sort = k; this.scrollY = 0; } });
        sx += w + 5;
      }
      const F = this.st, active = F.element || F.species || F.cls || F.stars;
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'right'; ctx.fillStyle = PAL.textDim; ctx.fillText(`顯示 ${list.length} / ${all.length}`, active ? 430 : 520, fy + 10);
      if (active) {
        S.rr(ctx, 440, fy, 80, 20, 10); ctx.fillStyle = '#5a3a4a'; ctx.fill();
        ctx.font = `bold 11px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.text; ctx.fillText('清除篩選', 480, fy + 10.5);
        this.buttons.push({ x: 440, y: fy, w: 80, h: 20, onClick: () => { Object.assign(this.st, { element: null, species: null, cls: null, stars: null }); this.scrollY = 0; } });
      }
      fy += 24;
      this._filterH = fy - filterTop;
      // 英雄卡
      const top = fy + 8, cols = 3, cw = 160, ch = 190, gap = 10, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2;
      const bottom = C.H - 76;
      const rows = Math.ceil(list.length / cols);
      this.scrollMax = Math.max(0, rows * (ch + gap) - (bottom - top));
      this.scrollY = Math.min(this.scrollY, this.scrollMax); this.st.scrollY = this.scrollY;
      const cardBtns = [];
      ctx.save(); ctx.beginPath(); ctx.rect(0, top - 4, C.W, bottom - top + 4); ctx.clip();
      if (!list.length) { ctx.font = `14px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('沒有符合條件的英雄', C.W / 2, top + 60); }
      const saved = this.buttons; this.buttons = cardBtns;
      list.forEach((h, i) => {
        const x = x0 + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + gap) - this.scrollY;
        if (y > bottom || y + ch < top) return;
        const inTeam = m.d.team.indexOf(h.uid);
        UI.heroCard(this, ctx, h, x, y, cw, ch, { badge: inTeam >= 0 ? (inTeam === 0 ? '隊長' : '出戰') : null, onClick: () => this.game.showHeroCard(h.uid) });
      });
      ctx.restore();
      // 卡片按鈕只保留可見範圍，避免點到被篩選列或導覽列蓋住的卡片
      this.buttons = cardBtns.map(b => { const y1 = Math.max(b.y, top), y2 = Math.min(b.y + b.h, bottom); return y2 > y1 ? Object.assign({}, b, { y: y1, h: y2 - y1 }) : null; }).filter(Boolean).concat(saved);
      UI.header(this, ctx, `兵營（${all.length} 名英雄）`);
      UI.nav(this, ctx, 'barracks');
    }
  }
  DH.Barracks = Barracks;
})(window.DH);
