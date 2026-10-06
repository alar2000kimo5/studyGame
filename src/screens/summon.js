// 召喚門：寶石召喚與靈魂召喚
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const K = DH.META_CONST;
  class Summon extends UI.Screen {
    constructor(game) { super(game); this.result = null; this.revealT = 0; }
    update(dt) { super.update(dt); if (this.result) this.revealT += dt; }
    doSummon(soul) {
      const r = this.game.meta.summon(soul);
      if (!r) { this.msg = soul ? '靈魂印記不足' : '寶石不足'; this.msgT = 1.5; return; }
      this.result = r; this.revealT = 0;
    }
    draw(ctx) {
      this.buttons = [];
      this.background(ctx, '#1a1030', '#06040c');
      const m = this.game.meta, t = this.time;
      // 傳送門
      const cx = C.W / 2, cy = 330;
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (0.3 + i * 0.2) * (i % 2 ? -1 : 1)); ctx.beginPath(); ctx.arc(0, 0, 150 - i * 32, 0, Math.PI * 2); ctx.setLineDash([18, 12]); ctx.lineWidth = 6 - i; ctx.strokeStyle = ['#8c52c8', '#408cec', '#f6c64a'][i]; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.restore(); }
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120); g.addColorStop(0, 'rgba(200,160,255,0.9)'); g.addColorStop(0.6, 'rgba(120,80,220,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; S.circ(ctx, cx, cy, 120); ctx.fill();
      for (let i = 0; i < 20; i++) { const a = t * 0.8 + i * 0.314, r = 60 + 50 * Math.sin(t * 1.3 + i); S.circ(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 2 + (i % 3)); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); }
      ctx.font = `bold 30px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText('召喚之門', cx, 130); ctx.fillText('召喚之門', cx, 130);
      // 機率
      UI.panel(ctx, 40, 500, 460, 118, { radius: 14 });
      ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.gold; ctx.fillText('召喚機率', 58, 522);
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.text;
      ctx.fillText(Object.entries(K.SUMMON_RATES).map(([s, p]) => `${s}★ ${p}%`).join('　'), 58, 548);
      ctx.fillStyle = PAL.textDim; ctx.font = `12px ${DH.FONT}`;
      ctx.fillText('靈魂召喚保證 4★ 以上。重複的英雄可在兵營合併（+4% 屬性）或退役換取靈魂印記。', 58, 574);
      ctx.fillText(`英雄名冊共 ${Object.keys(DH.HEROES).length} 位，兵營目前 ${m.d.heroes.length} 位。`, 58, 596);
      UI.button(this, ctx, 60, 640, 200, 64, `召喚`, { fill: PAL.gold, textColor: '#2a2030', size: 22, sub: `${K.SUMMON_COST} 寶石（持有 ${m.d.gems}）`, disabled: m.d.gems < K.SUMMON_COST, onClick: () => this.doSummon(false) });
      UI.button(this, ctx, 280, 640, 200, 64, `靈魂召喚`, { fill: '#8c52c8', size: 22, sub: `${K.SOUL_SUMMON_COST} 靈魂印記（持有 ${m.d.soulSigils}）`, subColor: 'rgba(255,255,255,0.7)', disabled: m.d.soulSigils < K.SOUL_SUMMON_COST, onClick: () => this.doSummon(true) });
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('寶石來自地牢通關獎勵（首次通關加成）', C.W / 2, 730);
      if (this.msgT > 0) { this.msgT -= 0.016; ctx.font = `bold 16px ${DH.FONT}`; ctx.fillStyle = '#ff6a5a'; ctx.fillText(this.msg, C.W / 2, 760); }
      UI.header(this, ctx, '召喚');
      UI.nav(this, ctx, 'summon');
      if (this.result) this.drawResult(ctx);
    }
    drawResult(ctx) {
      this.buttons = [];
      const r = this.result, d = r.def, el = DH.ELEMENTS[d.element], p = Math.min(1, this.revealT / 0.8);
      ctx.fillStyle = `rgba(4,2,10,${0.85 * p})`; ctx.fillRect(0, 0, C.W, C.H);
      const cx = C.W / 2, cy = 400;
      ctx.save(); ctx.globalAlpha = p;
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 240); g.addColorStop(0, el.color + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      for (let i = 0; i < 12; i++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.time * 0.5 + i * Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, -20); ctx.lineTo(300, 20); ctx.closePath(); ctx.fillStyle = `rgba(255,255,255,${0.05 + 0.04 * (i % 2)})`; ctx.fill(); ctx.restore(); }
      const sc = 0.5 + 2.6 * (p < 0.6 ? p / 0.6 : 1) * (p >= 0.6 && p < 0.75 ? 1.08 : 1);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); DH.drawHero(ctx, { look: d.look, element: d.element, uid: 3, shieldHp: 0 }, 0, 0, this.time); ctx.restore();
      if (p >= 1) {
        const q = Math.min(1, (this.revealT - 0.8) / 0.5);
        ctx.globalAlpha = q;
        ctx.font = `bold 30px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(`${d.name}・${d.cls}`, cx, 530); ctx.fillText(`${d.name}・${d.cls}`, cx, 530);
        for (let i = 0; i < d.stars; i++) UI.star(ctx, cx + (i - (d.stars - 1) / 2) * 34, 575, 14 * Math.min(1, Math.max(0, (this.revealT - 1.0 - i * 0.12) / 0.2)), PAL.gold, PAL.goldDark);
        let x = cx - 90; x += UI.chip(ctx, x, 600, el.name + '色', el.color) + 6; x += UI.chip(ctx, x, 600, DH.SPECIES[d.species], PAL.panelLight, PAL.text) + 6; UI.chip(ctx, x, 600, DH.PATTERNS[d.pattern].label, PAL[DH.PATTERNS[d.pattern].kind]);
        ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = r.dup ? '#ff9a5a' : PAL.text; ctx.fillText(r.dup ? '重複的英雄：可到兵營合併或退役' : '新英雄加入兵營！', cx, 640);
        ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; UI.wrap(ctx, d.flavor, 70, 668, 400, 18, 2);
        UI.button(this, ctx, 60, 740, 130, 48, '關閉', { onClick: () => { this.result = null; } });
        UI.button(this, ctx, 205, 740, 130, 48, '查看', { onClick: () => this.game.showHeroCard(r.hero.uid, () => this.game.showSummon()) });
        UI.button(this, ctx, 350, 740, 130, 48, '再召喚', { fill: PAL.gold, textColor: '#2a2030', disabled: this.game.meta.d.gems < DH.META_CONST.SUMMON_COST, onClick: () => this.doSummon(false) });
      }
      ctx.restore();
    }
  }
  DH.Summon = Summon;
})(window.DH);
