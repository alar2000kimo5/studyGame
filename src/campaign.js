// 戰役地圖：蜿蜒路徑上的地牢節點
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes;
  const NODES = [[110, 590], [330, 520], [160, 430], [380, 350], [200, 265], [330, 170]];

  class Campaign {
    constructor(game) {
      this.game = game; this.time = 0; this.buttons = [];
      const prog = game.progress.stars;
      let firstOpen = DH.DUNGEONS.findIndex(d => !prog[d.id]);
      if (firstOpen < 0) firstOpen = DH.DUNGEONS.length - 1;
      this.selected = firstOpen;
      this.previewHeroes = {};
    }
    unlocked(i) { return i === 0 || !!this.game.progress.stars[DH.DUNGEONS[i - 1].id] || this.game.unlockAll; }
    pointerDown(x, y) {
      for (const b of this.buttons) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.onClick(); return; }
      NODES.forEach((n, i) => { if (Math.hypot(x - n[0], y - n[1]) < 34 && this.unlocked(i)) this.selected = i; });
    }
    pointerMove() {} pointerUp() {}
    update(dt) { this.time += dt; }
    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, '#1d2a1c'); g.addColorStop(0.6, '#13200f'); g.addColorStop(1, '#0a0f08');
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      // 遠山與樹影
      ctx.save();
      for (let i = 0; i < 9; i++) { const x = i * 68 - 20, h = 60 + ((i * 37) % 50); ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x + 50, 150 - h); ctx.lineTo(x + 100, 150); ctx.closePath(); ctx.fillStyle = `rgba(40,70,40,${0.25 + (i % 3) * 0.1})`; ctx.fill(); }
      for (let i = 0; i < 40; i++) { const x = (i * 131) % C.W, y = 140 + ((i * 97) % 520), r = 14 + (i % 4) * 5; S.circ(ctx, x, y, r); ctx.fillStyle = `rgba(30,60,30,${0.35 + (i % 3) * 0.1})`; ctx.fill(); }
      ctx.restore();
      // 標題
      S.rr(ctx, 12, 14, 516, 70, 16); ctx.fillStyle = 'rgba(16,12,24,0.78)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.frame; ctx.stroke();
      ctx.font = `bold 24px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; ctx.fillText(DH.CHAPTER.name, C.W / 2, 40);
      const total = Object.values(this.game.progress.stars).reduce((a, b) => a + b, 0);
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`★ ${total} / ${DH.DUNGEONS.length * 3}`, C.W / 2, 66);
      // 路徑
      ctx.save(); ctx.beginPath(); ctx.moveTo(...NODES[0]);
      for (let i = 1; i < NODES.length; i++) { const a = NODES[i - 1], b = NODES[i]; ctx.quadraticCurveTo(a[0], b[1], b[0], b[1]); }
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = 9; ctx.strokeStyle = '#7a6a4c'; ctx.stroke();
      ctx.lineWidth = 4; ctx.setLineDash([10, 12]); ctx.strokeStyle = '#d8c48a'; ctx.stroke(); ctx.restore();
      // 節點
      DH.DUNGEONS.forEach((d, i) => {
        const [x, y] = NODES[i], open = this.unlocked(i), stars = this.game.progress.stars[d.id] || 0, sel = i === this.selected;
        if (sel) { S.circ(ctx, x, y, 38 + Math.sin(this.time * 4) * 3); ctx.lineWidth = 3; ctx.strokeStyle = PAL.gold; ctx.stroke(); }
        S.circ(ctx, x, y + 4, 28); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
        S.circ(ctx, x, y, 28); S.fillStroke(ctx, open ? (stars ? '#4f8a3f' : '#b8893a') : '#3a3542', '#1a1420', 3);
        S.circ(ctx, x, y - 6, 18); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        ctx.font = `bold 22px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = open ? '#fff' : '#7a7488';
        if (open) ctx.fillText(String(d.id), x, y + 1);
        else { S.rr(ctx, x - 8, y - 3, 16, 13, 3); ctx.fillStyle = '#8a8498'; ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 5, 6, Math.PI, 0); ctx.lineWidth = 3; ctx.strokeStyle = '#8a8498'; ctx.stroke(); }
        for (let k = 0; k < 3; k++) this.star(ctx, x + (k - 1) * 16, y + 40, 7, k < stars ? PAL.gold : 'rgba(0,0,0,0.45)');
        ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(d.name, x, y - 42); ctx.fillText(d.name, x, y - 42);
      });
      // 資訊面板
      this.buttons = [];
      const d = DH.DUNGEONS[this.selected];
      S.rr(ctx, 12, 668, 516, 280, 18); ctx.fillStyle = 'rgba(16,12,24,0.86)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.frame; ctx.stroke();
      ctx.textAlign = 'left'; ctx.font = `bold 22px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`${d.id}. ${d.name}`, 32, 696);
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${d.stages.length} 波怪物`, 32, 720);
      ctx.fillStyle = PAL.text; this.wrap(ctx, d.desc, 32, 744, 476, 19);
      // 隊伍
      ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('出戰英雄', 32, 792);
      d.heroes.forEach((id, i) => {
        const h = this.previewHeroes[id] || (this.previewHeroes[id] = new DH.Hero(id, [0, 0]));
        const x = 60 + i * 60, y = 846;
        S.rr(ctx, x - 26, y - 38, 52, 76, 10); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = DH.ELEMENTS[h.element].dark; ctx.stroke();
        ctx.save(); ctx.translate(x, y - 2); ctx.scale(0.62, 0.62); DH.drawHero(ctx, h, 0, 0, this.time, { noShadow: true }); ctx.restore();
        ctx.font = `11px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.text; ctx.fillText(h.cls, x, y + 28);
      });
      // 怪物預覽
      ctx.textAlign = 'left'; ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('敵人', 372, 792);
      const names = [...new Set(d.stages.flat().map(m => DH.MONSTERS[m.id].name))];
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.text; this.wrap(ctx, names.join('、'), 372, 812, 140, 17);
      // 出發
      const bx = 372, by = 884, bw = 140, bh = 48;
      S.rr(ctx, bx, by, bw, bh, 14); ctx.fillStyle = PAL.gold; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
      S.rr(ctx, bx + 3, by + 3, bw - 6, bh / 2 - 3, 10); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
      ctx.font = `bold 20px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#2a2030'; ctx.fillText('出發 ▶', bx + bw / 2, by + bh / 2 + 1);
      this.buttons.push({ x: bx, y: by, w: bw, h: bh, onClick: () => this.game.startDungeon(d) });
    }
    star(ctx, x, y, r, fill) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    }
    wrap(ctx, text, x, y, w, lh) {
      let line = '', yy = y;
      for (const ch of text) { if (ctx.measureText(line + ch).width > w) { ctx.fillText(line, x, yy); line = ch; yy += lh; } else line += ch; }
      if (line) ctx.fillText(line, x, yy);
    }
  }
  DH.Campaign = Campaign;
})(window.DH);
