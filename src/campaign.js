// 戰役地圖：蜿蜒路徑上的地牢節點
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const NODES = [[110, 560], [330, 495], [160, 415], [380, 340], [200, 262], [330, 178]];

  class Campaign extends UI.Screen {
    constructor(game) {
      super(game);
      const prog = game.meta.d.stars;
      let firstOpen = DH.DUNGEONS.findIndex(d => !prog[d.id]);
      if (firstOpen < 0) firstOpen = DH.DUNGEONS.length - 1;
      this.selected = firstOpen;
    }
    unlocked(i) { return i === 0 || !!this.game.meta.d.stars[DH.DUNGEONS[i - 1].id] || this.game.unlockAll; }
    draw(ctx) {
      this.buttons = [];
      const g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, '#1d2a1c'); g.addColorStop(0.6, '#13200f'); g.addColorStop(1, '#0a0f08');
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      ctx.save();
      for (let i = 0; i < 9; i++) { const x = i * 68 - 20, h = 60 + ((i * 37) % 50); ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x + 50, 150 - h); ctx.lineTo(x + 100, 150); ctx.closePath(); ctx.fillStyle = `rgba(40,70,40,${0.25 + (i % 3) * 0.1})`; ctx.fill(); }
      for (let i = 0; i < 40; i++) { const x = (i * 131) % C.W, y = 130 + ((i * 97) % 480), r = 14 + (i % 4) * 5; S.circ(ctx, x, y, r); ctx.fillStyle = `rgba(30,60,30,${0.35 + (i % 3) * 0.1})`; ctx.fill(); }
      ctx.restore();
      UI.header(this, ctx, DH.CHAPTER.name);
      const total = Object.values(this.game.meta.d.stars).reduce((a, b) => a + b, 0);
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText(`★ ${total} / ${DH.DUNGEONS.length * 3}`, 28, 66);
      // 路徑
      ctx.save(); ctx.beginPath(); ctx.moveTo(...NODES[0]);
      for (let i = 1; i < NODES.length; i++) { const a = NODES[i - 1], b = NODES[i]; ctx.quadraticCurveTo(a[0], b[1], b[0], b[1]); }
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = 9; ctx.strokeStyle = '#7a6a4c'; ctx.stroke();
      ctx.lineWidth = 4; ctx.setLineDash([10, 12]); ctx.strokeStyle = '#d8c48a'; ctx.stroke(); ctx.restore();
      DH.DUNGEONS.forEach((d, i) => {
        const [x, y] = NODES[i], open = this.unlocked(i), stars = this.game.meta.d.stars[d.id] || 0, sel = i === this.selected;
        if (sel) { S.circ(ctx, x, y, 38 + Math.sin(this.time * 4) * 3); ctx.lineWidth = 3; ctx.strokeStyle = PAL.gold; ctx.stroke(); }
        S.circ(ctx, x, y + 4, 28); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
        S.circ(ctx, x, y, 28); S.fillStroke(ctx, open ? (stars ? '#4f8a3f' : '#b8893a') : '#3a3542', '#1a1420', 3);
        S.circ(ctx, x, y - 6, 18); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        ctx.font = `bold 22px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
        if (open) ctx.fillText(String(d.id), x, y + 1);
        else { S.rr(ctx, x - 8, y - 3, 16, 13, 3); ctx.fillStyle = '#8a8498'; ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 5, 6, Math.PI, 0); ctx.lineWidth = 3; ctx.strokeStyle = '#8a8498'; ctx.stroke(); }
        for (let k = 0; k < 3; k++) UI.star(ctx, x + (k - 1) * 16, y + 40, 7, k < stars ? PAL.gold : 'rgba(0,0,0,0.45)');
        ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(d.name, x, y - 42); ctx.fillText(d.name, x, y - 42);
        if (open) this.buttons.push({ x: x - 34, y: y - 34, w: 68, h: 68, onClick: () => { this.selected = i; } });
      });
      // 資訊面板
      const d = DH.DUNGEONS[this.selected];
      UI.panel(ctx, 12, 632, 516, 250, { radius: 18 });
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `bold 22px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`${d.id}. ${d.name}`, 32, 660);
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${d.stages.length} 波怪物　推薦戰力 ${d.id * 450 + 300}`, 32, 684);
      ctx.fillStyle = PAL.text; UI.wrap(ctx, d.desc, 32, 708, 476, 19, 2);
      ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('目前隊伍', 32, 752);
      const team = this.game.meta.teamHeroes();
      team.forEach((h, i) => {
        const hd = this.game.meta.def(h), x = 60 + i * 60, y = 800;
        S.rr(ctx, x - 26, y - 34, 52, 68, 10); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = DH.ELEMENTS[hd.element].dark; ctx.stroke();
        ctx.save(); ctx.translate(x, y - 2); ctx.scale(0.6, 0.6); DH.drawHero(ctx, { look: hd.look, element: hd.element, uid: i, weaponRarity: h.gear.weapon ? h.gear.weapon.rarity : null, shieldHp: 0 }, 0, 0, this.time, { noShadow: true }); ctx.restore();
        ctx.font = `10px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.text; ctx.fillText(`Lv.${h.level}`, x, y + 25);
        if (i === 0) DH.drawBadge(ctx, x - 18, y - 26, 8, '隊', PAL.gold, '#2a2030', 9);
      });
      const power = team.reduce((a, h) => a + this.game.meta.power(h), 0);
      ctx.textAlign = 'left'; ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`隊伍戰力 ${power}`, 372, 752);
      const names = [...new Set(d.stages.flat().map(m => DH.MONSTERS[m.id].name))];
      ctx.fillStyle = PAL.text; UI.wrap(ctx, '敵人：' + names.join('、'), 372, 772, 140, 16, 3);
      UI.button(this, ctx, 372, 826, 140, 46, '出發 ▶', { fill: PAL.gold, textColor: '#2a2030', size: 19, onClick: () => this.game.showTeam(d) });
      UI.nav(this, ctx, 'campaign');
    }
  }
  DH.Campaign = Campaign;
})(window.DH);
