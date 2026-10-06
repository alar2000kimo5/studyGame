// 商店：用寶石換天賦代幣、彩色經驗、裝備箱
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  class Shop extends UI.Screen {
    constructor(game) { super(game); this.msg = null; this.confirmReset = false; }
    flash(t, c) { this.msg = { t, c: c || PAL.gold, life: 1.6 }; }
    update(dt) { super.update(dt); if (this.msg) { this.msg.life -= dt; if (this.msg.life <= 0) this.msg = null; } }
    row(ctx, y, title, desc, price, color, onClick, disabled) {
      UI.panel(ctx, 20, y, 500, 64, { radius: 12, fill: 'rgba(16,12,24,0.75)' });
      ctx.font = `bold 15px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color || PAL.text; ctx.fillText(title, 36, y + 22);
      ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(desc, 36, y + 44);
      UI.button(this, ctx, 400, y + 13, 104, 38, `${price} 寶石`, { size: 13, fill: PAL.gold, textColor: '#2a2030', disabled, onClick });
    }
    draw(ctx) {
      this.buttons = [];
      this.background(ctx, '#2a2016', '#0b0912');
      const m = this.game.meta, d = m.d, sy = -this.scrollY;
      let y = 96 + sy;
      ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText('資源', 24, y); y += 16;
      this.row(ctx, y, '天賦代幣 ×1', `持有 ${d.tokens}。解鎖天賦時依英雄星數消耗代幣。`, 250, '#c79af0', () => { if (m.buyTokens()) this.flash('購買了天賦代幣'); }, d.gems < 250); y += 72;
      for (const col of DH.META_CONST.COLORS) {
        const el = DH.ELEMENTS[col];
        this.row(ctx, y, `${el.name}色經驗 +500`, `持有 ${d.xp[col]}。用來升級${el.name}色英雄。`, 100, el.color, () => { if (m.buyXp(col)) this.flash(`獲得 ${el.name}色經驗 500`); }, d.gems < 100); y += 72;
      }
      this.row(ctx, y, '彩虹經驗 +500', `持有 ${d.xp.rainbow}。任何顏色的英雄都能用。`, 150, '#fff', () => { if (d.gems >= 150) { d.gems -= 150; d.xp.rainbow += 500; m.save(); this.flash('獲得彩虹經驗 500'); } }, d.gems < 150); y += 84;
      ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.gold; ctx.fillText('裝備箱（隨機部位）', 24, y); y += 16;
      for (const rk of DH.RARITY_ORDER) {
        const r = DH.RARITIES[rk];
        this.row(ctx, y, `${r.name}裝備箱`, `隨機一件${r.name}裝備，屬性 +${Math.round(r.pct * 100)}%。背包 ${d.gear.length} 件。`, r.price, r.color, () => { const g = m.buyGear(rk); if (g) this.flash(`獲得 ${DH.gearLabel(g)}（${DH.GEAR_SLOTS.find(s => s.key === g.slot).name}）`, r.color); }, d.gems < r.price); y += 72;
      }
      y += 12;
      ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.gold; ctx.fillText('存檔', 24, y); y += 16;
      UI.panel(ctx, 20, y, 500, 64, { radius: 12, fill: 'rgba(16,12,24,0.75)' });
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.textDim; ctx.fillText(this.confirmReset ? '確定要清除所有進度？再按一次確認。' : '進度儲存在這個瀏覽器中。', 36, y + 32);
      UI.button(this, ctx, 400, y + 13, 104, 38, this.confirmReset ? '確定重置' : '重置進度', { size: 13, fill: '#5a2a2a', onClick: () => { if (this.confirmReset) { m.reset(); this.confirmReset = false; this.flash('已重置', '#ff6a5a'); } else this.confirmReset = true; } });
      y += 80;
      this.scrollMax = Math.max(0, y - sy - C.H + 90);
      UI.header(this, ctx, '商店');
      if (this.msg) { ctx.globalAlpha = Math.min(1, this.msg.life); UI.panel(ctx, 90, 84, 360, 40, { radius: 12, fill: 'rgba(0,0,0,0.85)', stroke: this.msg.c }); ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = this.msg.c; ctx.fillText(this.msg.t, C.W / 2, 104); ctx.globalAlpha = 1; }
      UI.nav(this, ctx, 'shop');
    }
  }
  DH.Shop = Shop;
})(window.DH);
