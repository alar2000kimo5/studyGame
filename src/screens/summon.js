// 召喚門：寶石召喚與靈魂召喚
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const K = DH.META_CONST;
  class Summon extends UI.Screen {
    constructor(game) { super(game); this.result = null; this.revealT = 0; this.codex = false; this.codexSel = null; this.filter = { element: null, species: null, cls: null }; }
    openCodex() { this.codex = true; this.scrollY = 0; this.codexSel = null; }
    closeCodex() { this.codex = false; this.scrollY = 0; this.scrollMax = 0; }
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
      UI.button(this, ctx, 150, 722, 240, 44, '可召喚的英雄圖鑑', { size: 15, onClick: () => this.openCodex() });
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('寶石來自地牢通關獎勵（首次通關加成）', C.W / 2, 785);
      if (this.msgT > 0) { this.msgT -= 0.016; ctx.font = `bold 16px ${DH.FONT}`; ctx.fillStyle = '#ff6a5a'; ctx.fillText(this.msg, C.W / 2, 808); }
      UI.header(this, ctx, '召喚');
      UI.nav(this, ctx, 'summon');
      if (this.codex) this.drawCodex(ctx);
      if (this.result) this.drawResult(ctx);
    }
    // 圖鑑：所有可召喚的英雄，依星數分組
    drawCodex(ctx) {
      this.buttons = [];
      const m = this.game.meta, owned = new Set(m.d.heroes.map(h => h.id));
      ctx.fillStyle = 'rgba(6,4,12,0.96)'; ctx.fillRect(0, 0, C.W, C.H);
      const detailH = this.codexSel ? 190 : 0, top = 182, bottom = C.H - 70 - detailH;
      const F = this.filter, match = d => (!F.element || d.element === F.element) && (!F.species || d.species === F.species) && (!F.cls || d.classKey === F.cls);
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, C.W, bottom - top); ctx.clip();
      let y = top + 10 - this.scrollY;
      const cols = 4, cw = 118, ch = 150, gap = 8, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2;
      for (let stars = 5; stars >= 1; stars--) {
        const list = Object.values(DH.HEROES).filter(d => d.stars === stars && match(d));
        if (!list.length) continue;
        ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold;
        ctx.fillText(`${stars}★　機率 ${K.SUMMON_RATES[stars]}%　${list.length} 位`, x0, y + 10);
        UI.stars(ctx, x0 + 170, y + 10, stars, 6, 5);
        y += 28;
        list.forEach((d, i) => {
          const x = x0 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap), el = DH.ELEMENTS[d.element], sel = this.codexSel === d.id;
          S.rr(ctx, x, yy, cw, ch, 12); ctx.fillStyle = sel ? '#3a2f55' : PAL.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = sel ? PAL.gold : el.dark; ctx.stroke();
          S.rr(ctx, x, yy, cw, 5, 2); ctx.fillStyle = el.color; ctx.fill();
          ctx.save(); ctx.beginPath(); S.rr(ctx, x + 1, yy + 1, cw - 2, ch - 2, 11); ctx.clip();
          ctx.translate(x + cw / 2, yy + 62); ctx.scale(0.8, 0.8); DH.drawHero(ctx, { look: d.look, element: d.element, uid: i + stars * 7, shieldHp: 0 }, 0, 0, this.time, { noShadow: true }); ctx.restore();
          ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.text; ctx.fillText(`${d.name}·${d.cls}`, x + cw / 2, yy + 112);
          ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${el.name}色・${DH.PATTERNS[d.pattern].label}`, x + cw / 2, yy + 132);
          if (owned.has(d.id)) DH.drawBadge(ctx, x + 16, yy + 18, 10, '有', PAL.gold, '#2a2030', 10);
          if (d.support) DH.drawBadge(ctx, x + cw - 16, yy + 18, 10, '輔', PAL.heal, '#1a1420', 10);
          if (yy + ch > top && yy < bottom) this.buttons.push({ x, y: Math.max(yy, top), w: cw, h: Math.min(yy + ch, bottom) - Math.max(yy, top), onClick: () => { this.codexSel = d.id; } });
        });
        y += Math.ceil(list.length / cols) * (ch + gap) + 12;
      }
      ctx.restore();
      this.scrollMax = Math.max(0, y + this.scrollY - bottom + 10);
      // 詳細資料
      if (this.codexSel) {
        const d = DH.HEROES[this.codexSel], el = DH.ELEMENTS[d.element], dy = bottom;
        UI.panel(ctx, 12, dy, 516, detailH - 8, { radius: 16, fill: 'rgba(22,16,34,0.98)', stroke: el.color });
        ctx.font = `bold 18px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; ctx.fillText(`${d.name}・${d.cls}`, 28, dy + 24);
        let cx2 = 28 + ctx.measureText(`${d.name}・${d.cls}`).width + 10;
        cx2 += UI.chip(ctx, cx2, dy + 15, el.name + '色', el.color) + 6; cx2 += UI.chip(ctx, cx2, dy + 15, DH.SPECIES[d.species], PAL.panelLight, PAL.text) + 6; cx2 += UI.chip(ctx, cx2, dy + 15, DH.PATTERNS[d.pattern].label, PAL[DH.PATTERNS[d.pattern].kind]) + 6;
        if (d.support) UI.chip(ctx, cx2, dy + 15, '輔助·' + DH.PATTERNS[d.support].label.split('·')[1], PAL.heal);
        DH.drawPatternIcon(ctx, DH.PATTERNS[d.pattern], 470, dy + 44, 40);
        ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
        ctx.fillText(`基礎：攻擊 ${d.atk}　防禦 ${d.def}　生命 ${d.hp}　隊長加成：同色隊友攻擊 +${Math.round(d.leader.atk * 100)}%、防禦 +${Math.round(d.leader.def * 100)}`, 28, dy + 48);
        ctx.fillStyle = PAL.text;
        const tl = d.talents.slice(0, 1 + d.stars).map((t, i) => `${i === 0 ? '職業' : ''}【${DH.TALENTS[t].name}】${DH.TALENTS[t].desc}`);
        tl.forEach((s2, i) => { if (i < 4) ctx.fillText(s2, 28, dy + 70 + i * 18); });
        if (tl.length > 4) { ctx.fillStyle = PAL.textDim; ctx.fillText(`…還有 ${tl.length - 4} 個天賦（${d.talents.slice(5, 1 + d.stars).map(t => DH.TALENTS[t].name).join('、')}）`, 28, dy + 142); }
        ctx.fillStyle = PAL.textDim; UI.wrap(ctx, d.flavor, 28, dy + 162, 440, 16, 1);
      }
      ctx.fillStyle = 'rgba(6,4,12,1)'; ctx.fillRect(0, 0, C.W, top);
      ctx.font = `bold 22px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText('可召喚的英雄', 28, 40);
      const shown = Object.values(DH.HEROES).filter(match).length;
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`共 ${Object.keys(DH.HEROES).length} 位，已擁有 ${owned.size} 種，顯示 ${shown} 位。點擊英雄查看天賦。`, 28, 64);
      // 篩選列：顏色、種族、職業
      const chipRow = (y0, items, key) => {
        let x = 16;
        for (const [val, label, color] of items) {
          ctx.font = `bold 11px ${DH.FONT}`; const w = ctx.measureText(label).width + 12;
          if (x + w > C.W - 16) { x = 16; y0 += 24; }
          const on = F[key] === val || (val === null && !F[key]);
          S.rr(ctx, x, y0, w, 20, 10); ctx.fillStyle = on ? (color || PAL.gold) : 'rgba(255,255,255,0.08)'; ctx.fill();
          if (on) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = on ? '#1a1420' : PAL.text; ctx.fillText(label, x + 6, y0 + 10.5);
          this.buttons.push({ x, y: y0, w, h: 20, onClick: () => { F[key] = val; this.scrollY = 0; this.codexSel = null; } });
          x += w + 5;
        }
        return y0 + 24;
      };
      let fy = 82;
      fy = chipRow(fy, [[null, '全部'], ...Object.entries(DH.ELEMENTS).map(([k, e]) => [k, e.name + '色', e.color])], 'element');
      fy = chipRow(fy, [[null, '全部'], ...Object.entries(DH.SPECIES).map(([k, n]) => [k, n, '#b9a9d9'])], 'species');
      fy = chipRow(fy, [[null, '全部'], ...Object.entries(DH.CLASSES).map(([k, c]) => [k, c.cls, '#9ad8c8'])], 'cls');
      UI.button(this, ctx, 400, 26, 112, 40, '關閉', { size: 14, onClick: () => this.closeCodex() });
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
