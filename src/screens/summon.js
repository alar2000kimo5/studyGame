// 召喚之門：英雄召喚（寶石）、靈魂召喚（靈魂印記，保底 4★）、武器召喚（寶石，可抽專屬武器）；皆可單抽或十連
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const K = DH.META_CONST;
  class Summon extends UI.Screen {
    constructor(game) { super(game); this.result = null; this.multi = null; this.weapons = null; this.revealT = 0; this.codex = false; this.codexSel = null; this.filter = { element: null, species: null, cls: null }; this.msgT = 0; }
    openCodex() { this.codex = true; this.scrollY = 0; this.codexSel = null; }
    closeCodex() { this.codex = false; this.scrollY = 0; this.scrollMax = 0; }
    update(dt) { super.update(dt); if (this.result || this.multi || this.weapons) this.revealT += dt; if (this.msgT > 0) this.msgT -= dt; }
    fail(text) { this.msg = text; this.msgT = 1.5; }
    doSummon(soul, n) {
      const m = this.game.meta;
      if (n === 1) { const r = m.summon(soul); if (!r) return this.fail(soul ? '靈魂印記不足' : '寶石不足'); this.result = r; this.revealT = 0; return; }
      const rs = m.summonMany(soul, n); if (!rs) return this.fail(soul ? '靈魂印記不足' : '寶石不足');
      this.multi = { items: rs, soul }; this.revealT = 0;
    }
    doWeapon(n) {
      const ws = this.game.meta.weaponSummon(n); if (!ws) return this.fail('寶石不足');
      this.weapons = ws; this.revealT = 0;
    }
    draw(ctx) {
      this.buttons = [];
      this.background(ctx, '#1a1030', '#06040c');
      const m = this.game.meta, t = this.time;
      const cx = C.W / 2, cy = 250;
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (0.3 + i * 0.2) * (i % 2 ? -1 : 1)); ctx.beginPath(); ctx.arc(0, 0, 118 - i * 26, 0, Math.PI * 2); ctx.setLineDash([18, 12]); ctx.lineWidth = 6 - i; ctx.strokeStyle = ['#8c52c8', '#408cec', '#f6c64a'][i]; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.restore(); }
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100); g.addColorStop(0, 'rgba(200,160,255,0.9)'); g.addColorStop(0.6, 'rgba(120,80,220,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; S.circ(ctx, cx, cy, 100); ctx.fill();
      for (let i = 0; i < 20; i++) { const a = t * 0.8 + i * 0.314, r = 50 + 40 * Math.sin(t * 1.3 + i); S.circ(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 2 + (i % 3)); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); }
      ctx.font = `bold 28px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText('召喚之門', cx, 112); ctx.fillText('召喚之門', cx, 112);
      // 機率
      UI.panel(ctx, 24, 386, 492, 72, { radius: 14 });
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.text;
      ctx.fillText('英雄：' + Object.entries(K.SUMMON_RATES).map(([s, p]) => `${s}★ ${p}%`).join('　') + '　靈魂：' + Object.entries(K.SOUL_RATES).map(([s, p]) => `${s}★ ${p}%`).join(' '), 40, 406);
      ctx.fillStyle = PAL.textDim;
      ctx.fillText(`武器：專屬武器 ${Math.round(K.SIGNATURE_RATE * 100)}%（十連保底一把），其餘為魔法～傳說武器。重複英雄可合併或退役。`, 40, 428);
      ctx.fillText(`名冊 ${Object.keys(DH.HEROES).length} 位，兵營 ${m.d.heroes.length} 位，背包裝備 ${m.d.gear.length} 件。`, 40, 448);
      // 六個按鈕
      const rows = [
        { label: '英雄召喚', fill: PAL.gold, tc: '#2a2030', unit: '寶石', have: m.d.gems, c1: m.summonCostFor(false, 1), c10: m.summonCostFor(false, 10), go: n => this.doSummon(false, n) },
        { label: '靈魂召喚', fill: '#8c52c8', tc: '#fff', unit: '靈魂印記', have: m.d.soulSigils, c1: m.summonCostFor(true, 1), c10: m.summonCostFor(true, 10), go: n => this.doSummon(true, n) },
        { label: '武器召喚', fill: '#ff6ad5', tc: '#2a2030', unit: '寶石', have: m.d.gems, c1: m.weaponSummonCost(1), c10: m.weaponSummonCost(10), go: n => this.doWeapon(n) },
      ];
      rows.forEach((r, i) => {
        const y = 474 + i * 76;
        ctx.font = `bold 15px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = r.fill; ctx.fillText(r.label, 28, y + 18);
        ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`持有 ${r.unit} ${r.have}`, 28, y + 40);
        UI.button(this, ctx, 196, y, 150, 56, '×1', { fill: r.fill, textColor: r.tc, size: 18, sub: `${r.c1} ${r.unit}`, subColor: r.tc === '#fff' ? 'rgba(255,255,255,0.7)' : undefined, disabled: r.have < r.c1, onClick: () => r.go(1) });
        UI.button(this, ctx, 362, y, 150, 56, '×10', { fill: r.fill, textColor: r.tc, size: 18, sub: `${r.c10} ${r.unit}`, subColor: r.tc === '#fff' ? 'rgba(255,255,255,0.7)' : undefined, disabled: r.have < r.c10, onClick: () => r.go(10) });
      });
      UI.button(this, ctx, 150, 712, 240, 44, '可召喚的英雄圖鑑', { size: 15, onClick: () => this.openCodex() });
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('寶石來自地牢通關獎勵（首次通關加成）；靈魂印記來自退役英雄', C.W / 2, 776);
      if (this.msgT > 0) { ctx.font = `bold 16px ${DH.FONT}`; ctx.fillStyle = '#ff6a5a'; ctx.fillText(this.msg, C.W / 2, 806); }
      UI.header(this, ctx, '召喚');
      UI.nav(this, ctx, 'summon');
      if (this.codex) this.drawCodex(ctx);
      if (this.result) this.drawResult(ctx);
      if (this.multi) this.drawMulti(ctx);
      if (this.weapons) this.drawWeapons(ctx);
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
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); DH.drawHero(ctx, { look: d.look, element: d.element, uid: 3, shieldHp: 0, legendary: d.legendary }, 0, 0, this.time); ctx.restore();
      if (p >= 1) {
        const q = Math.min(1, (this.revealT - 0.8) / 0.5);
        ctx.globalAlpha = q;
        ctx.font = `bold 30px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(`${d.name}・${d.cls}`, cx, 530); ctx.fillText(`${d.name}・${d.cls}`, cx, 530);
        if (d.legendary) { ctx.font = `bold 18px ${DH.FONT}`; ctx.fillStyle = '#ff9ae0'; ctx.strokeText(`傳說英雄「${d.title}」`, cx, 700); ctx.fillText(`傳說英雄「${d.title}」`, cx, 700); }
        for (let i = 0; i < d.stars; i++) UI.star(ctx, cx + (i - (d.stars - 1) / 2) * 34, 575, 14 * Math.min(1, Math.max(0, (this.revealT - 1.0 - i * 0.12) / 0.2)), PAL.gold, PAL.goldDark);
        let x = cx - 110; x += UI.chip(ctx, x, 600, el.name + '色', el.color) + 6; x += UI.chip(ctx, x, 600, DH.SPECIES[d.species], PAL.panelLight, PAL.text) + 6; UI.chip(ctx, x, 600, DH.PATTERNS[d.pattern].label, PAL[DH.PATTERNS[d.pattern].kind]);
        ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = r.dup ? '#ff9a5a' : PAL.text; ctx.fillText(r.dup ? '重複的英雄：可到兵營合併或退役' : '新英雄加入兵營！', cx, 640);
        ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.textAlign = 'left'; UI.wrap(ctx, d.flavor, 70, 668, 400, 18, 2);
        UI.button(this, ctx, 60, 740, 130, 48, '關閉', { onClick: () => { this.result = null; } });
        UI.button(this, ctx, 205, 740, 130, 48, '查看', { onClick: () => this.game.showHeroCard(r.hero.uid, () => this.game.showSummon()) });
        UI.button(this, ctx, 350, 740, 130, 48, '再召喚', { fill: PAL.gold, textColor: '#2a2030', disabled: this.game.meta.d.gems < K.SUMMON_COST, onClick: () => this.doSummon(false, 1) });
      }
      ctx.restore();
    }
    // 十連結果：5×2 卡片依序翻開
    drawMulti(ctx) {
      this.buttons = [];
      const items = this.multi.items, soul = this.multi.soul;
      ctx.fillStyle = 'rgba(4,2,10,0.94)'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.font = `bold 24px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText(soul ? '靈魂召喚 ×10' : '英雄召喚 ×10', C.W / 2, 60);
      const best = Math.max(...items.map(r => r.def.stars)), news = items.filter(r => !r.dup).length;
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`最高 ${best}★　新英雄 ${news} 位　重複 ${items.length - news} 位`, C.W / 2, 90);
      const cw = 96, ch = 150, gap = 8, cols = 5, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2, y0 = 120;
      items.forEach((r, i) => {
        const d = r.def, el = DH.ELEMENTS[d.element], x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap);
        const p = Math.min(1, Math.max(0, (this.revealT - i * 0.12) / 0.3));
        if (p <= 0) { S.rr(ctx, x, y, cw, ch, 10); ctx.fillStyle = '#2a2340'; ctx.fill(); ctx.strokeStyle = '#4a4468'; ctx.lineWidth = 2; ctx.stroke(); return; }
        ctx.save(); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(Math.abs(Math.cos((1 - p) * Math.PI / 2)) || 0.01, 1); ctx.translate(-(x + cw / 2), -(y + ch / 2));
        S.rr(ctx, x, y, cw, ch, 10); ctx.fillStyle = d.stars >= 5 ? '#4a3a1a' : d.stars >= 4 ? '#3a2a4a' : PAL.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = d.stars >= 5 ? PAL.gold : d.stars >= 4 ? '#b464ff' : el.dark; ctx.stroke();
        S.rr(ctx, x, y, cw, 5, 2); ctx.fillStyle = el.color; ctx.fill();
        ctx.save(); ctx.beginPath(); S.rr(ctx, x + 1, y + 1, cw - 2, ch - 2, 9); ctx.clip(); ctx.translate(x + cw / 2, y + 62); ctx.scale(0.68, 0.68); DH.drawHero(ctx, { look: d.look, element: d.element, uid: i, shieldHp: 0 }, 0, 0, this.time, { noShadow: true }); ctx.restore();
        UI.stars(ctx, x + cw / 2 - (d.stars - 1) * 5.75, y + 14, d.stars, 4.5);
        ctx.font = `bold 11px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; ctx.fillText(d.name, x + cw / 2, y + 108);
        ctx.font = `10px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(d.cls, x + cw / 2, y + 124);
        if (d.legendary) { ctx.font = `bold 9px ${DH.FONT}`; ctx.fillStyle = '#ff9ae0'; ctx.fillText('傳說', x + cw / 2, y + 30); }
        if (r.dup) { ctx.font = `bold 9px ${DH.FONT}`; ctx.fillStyle = '#ff9a5a'; ctx.fillText('重複', x + cw / 2, y + 140); } else { ctx.font = `bold 9px ${DH.FONT}`; ctx.fillStyle = PAL.heal; ctx.fillText('新！', x + cw / 2, y + 140); }
        ctx.restore();
        if (p >= 1) this.buttons.push({ x, y, w: cw, h: ch, onClick: () => { this.multi = null; this.result = r; this.revealT = 2; } });
      });
      if (this.revealT > items.length * 0.12 + 0.3) {
        ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('點擊卡片可查看該英雄', C.W / 2, 450);
        UI.button(this, ctx, 90, 490, 170, 50, '關閉', { onClick: () => { this.multi = null; } });
        const cost = this.game.meta.summonCostFor(soul, 10), have = soul ? this.game.meta.d.soulSigils : this.game.meta.d.gems;
        UI.button(this, ctx, 280, 490, 170, 50, '再抽十次', { fill: soul ? '#8c52c8' : PAL.gold, textColor: soul ? '#fff' : '#2a2030', sub: `${cost} ${soul ? '靈魂印記' : '寶石'}`, subColor: soul ? 'rgba(255,255,255,0.7)' : undefined, disabled: have < cost, onClick: () => this.doSummon(soul, 10) });
      }
    }
    // 武器召喚結果
    drawWeapons(ctx) {
      this.buttons = [];
      const items = this.weapons, n = items.length;
      ctx.fillStyle = 'rgba(4,2,10,0.94)'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.font = `bold 24px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff6ad5'; ctx.fillText(`武器召喚 ×${n}`, C.W / 2, 60);
      const sig = items.filter(g => g.rarity === 'signature').length;
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(sig ? `獲得 ${sig} 把專屬武器！` : '這次沒有專屬武器', C.W / 2, 90);
      const cols = n === 1 ? 1 : 2, cw = n === 1 ? 300 : 236, ch = 118, gap = 10, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2, y0 = n === 1 ? 300 : 112;
      items.forEach((g, i) => {
        const x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), R = DH.RARITIES[g.rarity];
        const p = Math.min(1, Math.max(0, (this.revealT - i * 0.1) / 0.3));
        if (p <= 0) { S.rr(ctx, x, y, cw, ch, 10); ctx.fillStyle = '#2a2340'; ctx.fill(); return; }
        ctx.save(); ctx.globalAlpha = p;
        S.rr(ctx, x, y, cw, ch, 10); ctx.fillStyle = g.rarity === 'signature' ? '#3a1a34' : '#241e36'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = R.color; ctx.stroke();
        const hero = g.heroId ? DH.HEROES[g.heroId] : null;
        const el = hero ? DH.ELEMENTS[hero.element] : DH.ELEMENTS.light;
        const kind = hero ? hero.look.weapon : ['sword', 'axe', 'bow', 'staff', 'mace', 'dagger', 'club', 'hammer'][i % 8];
        DH.drawWeaponIcon(ctx, kind, x + 34, y + ch / 2, el, this.time, g.rarity);
        ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = R.color; ctx.fillText(DH.gearLabel(g), x + 70, y + 24);
        ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.text; UI.wrap(ctx, DH.gearStatLabel(g), x + 70, y + 46, cw - 80, 15, 2);
        if (hero) {
          ctx.fillStyle = '#ff9ae0'; ctx.fillText(`專屬：${hero.name}・${hero.cls}`, x + 70, y + 84);
          const owned = this.game.meta.d.heroes.some(h => h.id === hero.id);
          ctx.fillStyle = owned ? PAL.heal : PAL.textDim; ctx.fillText(owned ? '（已擁有此英雄）' : '（尚未擁有此英雄）', x + 70, y + 102);
        } else { ctx.fillStyle = PAL.textDim; ctx.fillText('任何英雄都能裝備', x + 70, y + 84); }
        ctx.restore();
      });
      if (this.revealT > n * 0.1 + 0.3) {
        const by = n === 1 ? 480 : 770;
        ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.textDim; ctx.fillText('武器已放入背包，到英雄卡的裝備欄裝備', C.W / 2, by - 24);
        UI.button(this, ctx, 90, by, 170, 50, '關閉', { onClick: () => { this.weapons = null; } });
        const cost = this.game.meta.weaponSummonCost(n);
        UI.button(this, ctx, 280, by, 170, 50, n === 1 ? '再抽一次' : '再抽十次', { fill: '#ff6ad5', textColor: '#2a2030', sub: `${cost} 寶石`, disabled: this.game.meta.d.gems < cost, onClick: () => this.doWeapon(n) });
      }
    }
    // 圖鑑：所有可召喚的英雄，依星數分組
    drawCodex(ctx) {
      this.buttons = [];
      const m = this.game.meta, owned = new Set(m.d.heroes.map(h => h.id));
      ctx.fillStyle = 'rgba(6,4,12,0.96)'; ctx.fillRect(0, 0, C.W, C.H);
      const detailH = this.codexSel ? 196 : 0, top = 182, bottom = C.H - 70 - detailH;
      const F = this.filter, match = d => (!F.element || d.element === F.element) && (!F.species || d.species === F.species) && (!F.cls || d.classKey === F.cls);
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, C.W, bottom - top); ctx.clip();
      let y = top + 10 - this.scrollY;
      const cols = 4, cw = 118, ch = 150, gap = 8, x0 = (C.W - cols * cw - (cols - 1) * gap) / 2;
      for (let stars = 6; stars >= 1; stars--) {
        const legendGroup = stars === 6;
        const list = Object.values(DH.HEROES).filter(d => (legendGroup ? d.legendary : (d.stars === stars && !d.legendary)) && match(d));
        if (!list.length) continue;
        ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = legendGroup ? '#ff9ae0' : PAL.gold;
        ctx.fillText(legendGroup ? `傳說英雄　機率 ${DH.LEGEND_RATE * 100}%　${list.length} 位（每職業一位，獨特攻擊方式）` : `${stars}★　機率 ${K.SUMMON_RATES[stars]}%　${list.length} 位`, x0, y + 10);
        if (!legendGroup) UI.stars(ctx, x0 + 170, y + 10, stars, 6, 5);
        y += 28;
        list.forEach((d, i) => {
          const x = x0 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap), el = DH.ELEMENTS[d.element], sel = this.codexSel === d.id;
          S.rr(ctx, x, yy, cw, ch, 12); ctx.fillStyle = sel ? '#3a2f55' : (d.legendary ? '#3a1a34' : PAL.panel); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = sel ? PAL.gold : (d.legendary ? '#ff6ad5' : el.dark); ctx.stroke();
          S.rr(ctx, x, yy, cw, 5, 2); ctx.fillStyle = el.color; ctx.fill();
          ctx.save(); ctx.beginPath(); S.rr(ctx, x + 1, yy + 1, cw - 2, ch - 2, 11); ctx.clip();
          ctx.translate(x + cw / 2, yy + 62); ctx.scale(0.8, 0.8); DH.drawHero(ctx, { look: d.look, element: d.element, uid: i + stars * 7, shieldHp: 0 }, 0, 0, this.time, { noShadow: true }); ctx.restore();
          ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = PAL.text; ctx.fillText(`${d.name}·${d.cls}`, x + cw / 2, yy + 112);
          ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${el.name}色・${DH.PATTERNS[d.pattern].label}`, x + cw / 2, yy + 132);
          if (owned.has(d.id)) DH.drawBadge(ctx, x + 16, yy + 18, 10, '有', PAL.gold, '#2a2030', 10);
          if (d.support) DH.drawBadge(ctx, x + cw - 16, yy + 18, 10, '輔', PAL.heal, '#1a1420', 10);
          if (d.legendary) { ctx.font = `bold 10px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ff9ae0'; ctx.fillText(`「${d.title}」`, x + cw / 2, yy + 100); }
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
        if (d.special) tl.unshift(`傳說【${DH.SPECIALS[d.special].name}】${DH.SPECIALS[d.special].desc}`);
        tl.forEach((s2, i) => { if (i < 4) ctx.fillText(s2, 28, dy + 70 + i * 18); });
        if (tl.length > 4) { ctx.fillStyle = PAL.textDim; ctx.fillText(`…還有 ${tl.length - 4} 個天賦（${d.talents.slice(5, 1 + d.stars).map(t => DH.TALENTS[t].name).join('、')}）`, 28, dy + 142); }
        ctx.fillStyle = '#ff9ae0'; ctx.fillText(`專武：${DH.sigVariants(d.id).map(v => `${v[0]}（${v[1]}）`).join('、')}　種族效果：${DH.SIG_SPECIES[d.species].name}`.slice(0, 60), 28, dy + 162);
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
