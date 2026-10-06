// 隊伍編成：出戰前選 5 名英雄，最左邊為隊長
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  class TeamSelect extends UI.Screen {
    constructor(game, dungeon) { super(game); this.dungeon = dungeon; this.team = game.meta.d.team.slice(); }
    draw(ctx) {
      this.buttons = [];
      const m = this.game.meta;
      this.background(ctx);
      // 出戰槽
      UI.panel(ctx, 12, 88, 516, 196, { radius: 16 });
      ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText('出戰隊伍（最左邊是隊長，隊長加成給同色隊友）', 28, 108);
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 98, y = 124, uid = this.team[i], h = uid ? m.hero(uid) : null;
        if (h) UI.heroCard(this, ctx, h, x, y, 90, 120, { scale: 0.7, badge: i === 0 ? '隊長' : null, onClick: () => { this.team.splice(i, 1); } });
        else { S.rr(ctx, x, y, 90, 120, 12); ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = '#4a4458'; ctx.stroke(); ctx.setLineDash([]); ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('空位', x + 45, y + 60); }
      }
      const leader = this.team[0] ? m.hero(this.team[0]) : null;
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.textDim;
      if (leader) { const ld = m.def(leader); ctx.fillText(`隊長 ${ld.name}：${DH.ELEMENTS[ld.element].name}色隊友 攻擊 +${Math.round(ld.leader.atk * 100)}%、防禦 +${Math.round(ld.leader.def * 100)}`, 28, 262); }
      const power = this.team.map(u => m.hero(u)).filter(Boolean).reduce((a, h) => a + m.power(h), 0);
      ctx.textAlign = 'right'; ctx.fillStyle = PAL.gold; ctx.fillText(`隊伍戰力 ${power}`, 512, 262);
      // 名冊
      const list = m.d.heroes.slice().sort((a, b) => b.stars - a.stars || m.power(b) - m.power(a));
      const cols = 4, cw = 120, ch = 150, gap = 8, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2, y0 = 300;
      this.scrollMax = Math.max(0, y0 + Math.ceil(list.length / cols) * (ch + gap) - (C.H - 90));
      ctx.save(); ctx.beginPath(); ctx.rect(0, 292, C.W, C.H - 292 - 84); ctx.clip();
      list.forEach((h, i) => {
        const x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap) - this.scrollY;
        if (y > C.H || y + ch < 280) return;
        const idx = this.team.indexOf(h.uid);
        UI.heroCard(this, ctx, h, x, y, cw, ch, { scale: 0.78, selected: idx >= 0, badge: idx >= 0 ? String(idx + 1) : null, onClick: () => { if (idx >= 0) this.team.splice(idx, 1); else if (this.team.length < 5) this.team.push(h.uid); } });
      });
      ctx.restore();
      UI.panel(ctx, 12, C.H - 76, 516, 64, { radius: 16, fill: 'rgba(16,12,24,0.92)' });
      UI.button(this, ctx, 28, C.H - 66, 150, 44, '返回地圖', { onClick: () => this.game.showCampaign() });
      UI.button(this, ctx, 196, C.H - 66, 150, 44, '查看英雄', { disabled: !this.team.length, onClick: () => { m.setTeam(this.team); this.game.showHeroCard(this.team[this.team.length - 1], () => this.game.showTeam(this.dungeon)); } });
      UI.button(this, ctx, 362, C.H - 66, 150, 44, '出發 ▶', { fill: PAL.gold, textColor: '#2a2030', size: 18, disabled: !this.team.length, onClick: () => { m.setTeam(this.team); this.game.startDungeon(this.dungeon); } });
      UI.header(this, ctx, `${this.dungeon.name}・編成`, () => this.game.showCampaign());
    }
  }
  DH.TeamSelect = TeamSelect;
})(window.DH);
