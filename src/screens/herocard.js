// 英雄卡：顏色／種族／隊長加成、攻擊與輔助模式、天賦、等級、屬性、裝備、昇華、合併、退役
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  class HeroCard extends UI.Screen {
    constructor(game, uid, back) {
      super(game); this.uid = uid; this.back = back; this.selTalent = 0; this.picker = null; this.confirm = null; this.msg = null;
    }
    get h() { return this.game.meta.hero(this.uid); }
    pointerDown(x, y) { if (this.picker || this.confirm) { this._press = { x, y, sy: this.pickerScroll || 0, moved: false, overlay: true }; return; } super.pointerDown(x, y); }
    pointerMove(x, y) {
      const p = this._press;
      if (p && p.overlay) { if (Math.abs(y - p.y) > 8) p.moved = true; if (p.moved && this.picker) this.pickerScroll = Math.max(0, Math.min(this.pickerMax || 0, p.sy - (y - p.y))); return; }
      super.pointerMove(x, y);
    }
    flash(text, color) { this.msg = { text, color: color || PAL.gold, t: 1.6 }; }
    update(dt) { super.update(dt); if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; } }
    draw(ctx) {
      this.buttons = [];
      const m = this.game.meta, h = this.h;
      if (!h) { this.back(); return; }
      const d = m.def(h), el = DH.ELEMENTS[d.element], lb = m.leaderBonusFor(h), st = m.stats(h, lb), base = m.stats(h, null);
      this.background(ctx, el.dark, PAL.bgBottom);
      const sy = -this.scrollY;
      // ── 立繪區 ──
      const g = ctx.createRadialGradient(C.W / 2, 250 + sy, 20, C.W / 2, 250 + sy, 260); g.addColorStop(0, el.color + '66'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 60 + sy, C.W, 400);
      ctx.save(); ctx.translate(C.W / 2, 290 + sy); ctx.scale(2.6, 2.6);
      DH.drawHero(ctx, { look: d.look, element: d.element, uid: 7, weaponRarity: h.gear.weapon ? h.gear.weapon.rarity : null, shieldHp: 0 }, 0, 0, this.time);
      ctx.restore();
      // 左上：顏色／種族／隊長加成
      let y = 96 + sy;
      let x = 20; x += UI.chip(ctx, x, y, el.name + '色', el.color) + 6; UI.chip(ctx, x, y, DH.SPECIES[d.species], PAL.panelLight, PAL.text);
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.textDim;
      ctx.fillText('隊長加成（同色隊友）', 20, y + 34); ctx.fillStyle = PAL.text;
      ctx.fillText(`攻擊 +${Math.round(d.leader.atk * 100)}%　防禦 +${Math.round(d.leader.def * 100)}`, 20, y + 52);
      if (lb) { ctx.fillStyle = PAL.gold; ctx.fillText('✓ 目前受隊長加成', 20, y + 70); }
      const cv = DH.CLASS_VS_RACE[d.classKey], spv = DH.SPECIES_VS_RACE[d.species];
      ctx.fillStyle = PAL.textDim; ctx.fillText('克制', 20, y + 94);
      ctx.fillStyle = PAL.text; ctx.fillText(`專精 ${DH.RACE_NAMES[cv[0]]} +${Math.round(cv[1] * 100)}%`, 20, y + 112);
      ctx.fillText(`克 ${DH.RACE_NAMES[spv.beats]}・被 ${DH.RACE_NAMES[spv.weak]} 克`, 20, y + 130);
      // 右上：攻擊模式／輔助模式
      DH.drawPatternIcon(ctx, DH.PATTERNS[d.pattern], C.W - 60, y - 4, 40);
      ctx.textAlign = 'right'; ctx.fillStyle = PAL.text; ctx.font = `bold 12px ${DH.FONT}`; ctx.fillText(DH.PATTERNS[d.pattern].label, C.W - 66, y + 16);
      if (d.support) { DH.drawPatternIcon(ctx, DH.PATTERNS[d.support], C.W - 60, y + 52, 40); ctx.fillStyle = PAL.heal; ctx.fillText('輔助·' + DH.PATTERNS[d.support].label.split('·')[1], C.W - 66, y + 72); }
      // 名稱與星數
      ctx.textAlign = 'center'; ctx.font = `bold 26px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(`${d.name}・${d.cls}`, C.W / 2, 400 + sy); ctx.fillText(`${d.name}・${d.cls}`, C.W / 2, 400 + sy);
      UI.stars(ctx, C.W / 2 - (h.stars - 1) * 13.8, 430 + sy, h.stars, 11);
      if (h.ascended) UI.chip(ctx, C.W / 2 + h.stars * 14 + 6, 421 + sy, '昇華', '#ff9a3a');
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.textDim; UI.wrap(ctx, d.flavor, 40, 456 + sy, 460, 16, 2);
      // ── 天賦列 ──
      let py = 492 + sy;
      UI.panel(ctx, 16, py, 508, 112, { radius: 14, fill: 'rgba(16,12,24,0.75)' });
      ctx.textAlign = 'left'; ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText('天賦', 30, py + 18);
      const list = m.talentList(h), unlocked = m.unlockedTalents(h);
      list.forEach((t, i) => {
        const tx = 30 + i * 46, ty = py + 48, on = unlocked.includes(t), sel = this.selTalent === i;
        S.circ(ctx, tx + 16, ty, 17); ctx.fillStyle = on ? el.dark : '#2a2430'; ctx.fill(); ctx.lineWidth = sel ? 3 : 1.5; ctx.strokeStyle = sel ? PAL.gold : (on ? el.color : '#4a4458'); ctx.stroke();
        ctx.font = `bold 14px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = on ? '#fff' : '#6a6478'; ctx.fillText(DH.TALENTS[t].icon, tx + 16, ty + 1);
        if (!on) { S.rr(ctx, tx + 22, ty + 6, 12, 10, 2); ctx.fillStyle = '#8a8498'; ctx.fill(); }
        if (i === 0) { ctx.font = `9px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('職業', tx + 16, ty + 26); }
        if (i === list.length - 1 && h.ascended) { ctx.font = `9px ${DH.FONT}`; ctx.fillStyle = '#ff9a3a'; ctx.fillText('昇華', tx + 16, ty + 26); }
        this.buttons.push({ x: tx, y: ty - 17, w: 34, h: 34, onClick: () => { this.selTalent = i; } });
      });
      const t = list[Math.min(this.selTalent, list.length - 1)];
      ctx.textAlign = 'left'; ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.text;
      ctx.fillText(`【${DH.TALENTS[t].name}】${DH.TALENTS[t].desc}${unlocked.includes(t) ? '' : '（未解鎖）'}`, 30, py + 92);
      const nt = m.nextTalent(h);
      UI.button(this, ctx, 380, py + 10, 130, 34, nt ? `解鎖天賦 ${m.talentCost(h)} 代幣` : '天賦已全開', { size: 12, fill: nt ? PAL.panelLight : '#3a3442', disabled: !nt || m.d.tokens < m.talentCost(h), onClick: () => { if (m.unlockTalent(h)) this.flash('解鎖了新天賦！'); } });
      // ── 等級 ──
      py += 122;
      UI.panel(ctx, 16, py, 508, 92, { radius: 14, fill: 'rgba(16,12,24,0.75)' });
      ctx.textAlign = 'left'; ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`等級 ${h.level} / ${m.maxLevel(h)}`, 30, py + 18);
      const need = m.xpToNext(h), have = m.xpAvailable(h), maxed = h.level >= m.maxLevel(h);
      UI.bar(ctx, 30, py + 34, 330, 14, maxed ? 1 : Math.min(1, have / need), el.color, maxed ? '已達上限' : `${el.name}色＋彩虹經驗 ${have} / ${need}`);
      ctx.font = `11px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.textDim; ctx.fillText(`升級消耗 ${el.name}色經驗（不足時用彩虹經驗補）。經驗從地牢戰利品與商店取得。`, 30, py + 66);
      UI.button(this, ctx, 380, py + 10, 62, 34, '升級', { size: 13, disabled: !m.canLevel(h), onClick: () => { if (m.levelUp(h)) this.flash(`升到 Lv.${h.level}！`); } });
      UI.button(this, ctx, 448, py + 10, 62, 34, '+5 級', { size: 13, disabled: !m.canLevel(h), onClick: () => { let n = 0; while (n < 5 && m.levelUp(h)) n++; this.flash(`升了 ${n} 級，Lv.${h.level}`); } });
      // ── 屬性 ──
      py += 102;
      UI.panel(ctx, 16, py, 508, 64, { radius: 14, fill: 'rgba(16,12,24,0.75)' });
      [['攻擊', st.atk, base.atk], ['防禦', st.def, base.def], ['生命', st.hp, base.hp]].forEach(([k, v, b], i) => {
        const cx = 100 + i * 170;
        ctx.textAlign = 'center'; ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(k, cx, py + 18);
        ctx.font = `bold 22px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.fillText(String(v), cx, py + 42);
        if (v !== b) { ctx.font = `10px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`(隊長 +${v - b})`, cx + 44, py + 44); }
      });
      // ── 裝備 ──
      py += 74;
      UI.panel(ctx, 16, py, 508, 150, { radius: 14, fill: 'rgba(16,12,24,0.75)' });
      ctx.textAlign = 'left'; ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`裝備 ${m.gearCount(h)} / 6`, 30, py + 18);
      ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('每件加成一項屬性；集滿並達到等級後可昇華', 120, py + 18);
      UI.button(this, ctx, 410, py + 6, 100, 26, '一鍵裝備', { size: 12, fill: PAL.gold, textColor: '#2a2030', onClick: () => { const n = m.autoEquip(h); this.flash(n ? `裝上了 ${n} 件裝備` : '沒有更好的裝備可換', n ? PAL.gold : '#ff9a5a'); } });
      DH.GEAR_SLOTS.forEach((sl, i) => {
        const gx = 30 + (i % 3) * 164, gy = py + 32 + Math.floor(i / 3) * 56, gear = h.gear[sl.key];
        S.rr(ctx, gx, gy, 154, 48, 10); ctx.fillStyle = gear ? '#2a2340' : 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = gear ? DH.RARITIES[gear.rarity].color : '#3a3448'; ctx.stroke();
        ctx.textAlign = 'left'; ctx.font = `bold 12px ${DH.FONT}`; ctx.fillStyle = gear ? DH.RARITIES[gear.rarity].color : PAL.textDim;
        ctx.fillText(gear ? DH.gearLabel(gear) : `${sl.name}（空）`, gx + 10, gy + 16);
        ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.fillText(gear ? DH.gearStatLabel(gear) : '點擊裝備', gx + 10, gy + 34);
        this.buttons.push({ x: gx, y: gy, w: 154, h: 48, onClick: () => { this.picker = sl.key; this.pickerScroll = 0; } });
      });
      // ── 專武 ──
      py += 160;
      const sigGear = m.sigOf(h), sigName = DH.signatureName(h.id), trait = DH.sigTraitFor(h.id), sp = DH.SIG_SPECIES[d.species];
      UI.panel(ctx, 16, py, 508, 118, { radius: 14, fill: sigGear ? 'rgba(58,26,52,0.85)' : 'rgba(16,12,24,0.75)', stroke: sigGear ? '#ff6ad5' : PAL.frame });
      ctx.textAlign = 'left'; ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = '#ff9ae0'; ctx.fillText(`專屬武器：${sigName}${sigGear ? `　Lv.${sigGear.level || 1} / ${DH.SIG_LEVEL_MAX}` : '　（未裝備，從武器召喚取得）'}`, 30, py + 18);
      ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = sigGear ? PAL.text : PAL.textDim;
      const lv = sigGear ? sigGear.level || 1 : 1;
      UI.wrap(ctx, `【${DH.SPECIES[d.species]}・${sp.name}】${DH.sigSpeciesDesc(d.species, lv)}`, 30, py + 40, 480, 15, 2);
      UI.wrap(ctx, `【${trait.name}】${DH.sigTraitDesc(h.id, lv)}`, 30, py + 72, 480, 15, 2);
      ctx.fillStyle = PAL.textDim; ctx.fillText(`基礎：攻擊 +${Math.round(DH.sigBasePct(lv) * 100)}%、生命 +${Math.round(DH.sigHpPct(lv) * 100)}%。用同名專武可強化（每級效果 +15%）。`, 30, py + 104);
      // ── 操作 ──
      py += 128;
      const req = m.ascendReq(h), inTeam = m.d.team.includes(h.uid), dups = m.duplicates(h);
      UI.panel(ctx, 16, py, 508, 150, { radius: 14, fill: 'rgba(16,12,24,0.75)' });
      ctx.textAlign = 'left'; ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText('昇華', 30, py + 18);
      ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
      ctx.fillText(h.ascended ? '已昇華：等級上限 85、基礎屬性 +20%、昇華天賦已開啟' : `需要：Lv.${req.level}（目前 ${h.level}）、${req.gear} 件裝備（目前 ${m.gearCount(h)}）、${req.gold} 金幣。昇華會消耗所有裝備並使等級減半。`, 30, py + 38);
      UI.button(this, ctx, 30, py + 54, 110, 36, '昇華', { size: 14, fill: '#ff9a3a', textColor: '#2a2030', disabled: !m.canAscend(h), onClick: () => { this.confirm = { text: `昇華 ${d.name}？裝備會全部消耗，等級變成 ${Math.ceil(h.level / 2)}。`, ok: () => { if (m.ascend(h)) this.flash('昇華成功！', '#ff9a3a'); } }; } });
      UI.button(this, ctx, 150, py + 54, 110, 36, inTeam ? '移出隊伍' : '加入隊伍', { size: 14, fill: inTeam ? PAL.panelLight : PAL.gold, textColor: inTeam ? PAL.text : '#2a2030', disabled: !inTeam && m.d.team.length >= 5, onClick: () => {
        const team = m.d.team.slice(); if (inTeam) { if (team.length <= 1) { this.flash('隊伍至少要有一人', '#ff6a5a'); return; } team.splice(team.indexOf(h.uid), 1); } else team.push(h.uid); m.setTeam(team); this.flash(inTeam ? '已移出隊伍' : '已加入隊伍'); } });
      UI.button(this, ctx, 270, py + 54, 110, 36, dups.length ? `合併（${dups.length}）` : '合併', { size: 14, disabled: !dups.length || h.merges >= 5, onClick: () => { if (m.merge(h, dups[0])) this.flash(`合併成功，屬性 +4%（${h.merges}/5）`); } });
      UI.button(this, ctx, 390, py + 54, 110, 36, '退役', { size: 14, fill: '#5a2a2a', disabled: inTeam || m.d.heroes.length <= 1, onClick: () => { this.confirm = { text: `讓 ${d.name} 退役？會獲得 ${35 * h.stars} 靈魂印記與 ${60 * h.stars} 彩虹經驗。`, ok: () => { if (m.retire(h)) { this.back(); } } }; } });
      ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.textAlign = 'left';
      ctx.fillText(`合併次數 ${h.merges}/5（每次 +4% 屬性，需要未出戰的同名英雄）　靈魂印記 ${m.d.soulSigils}`, 30, py + 110);
      ctx.fillText(`戰力 ${m.power(h)}`, 30, py + 130);
      this.scrollMax = Math.max(0, py + 160 + this.scrollY - C.H + 20);
      // 頂部
      UI.header(this, ctx, `${d.name}・${d.cls}`, this.back);
      if (this.msg) { ctx.globalAlpha = Math.min(1, this.msg.t); UI.panel(ctx, 120, 90, 300, 40, { radius: 12, fill: 'rgba(0,0,0,0.8)', stroke: this.msg.color }); ctx.font = `bold 15px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = this.msg.color; ctx.fillText(this.msg.text, C.W / 2, 110); ctx.globalAlpha = 1; }
      if (this.picker) this.drawPicker(ctx);
      if (this.confirm) this.drawConfirm(ctx);
    }
    drawPicker(ctx) {
      const m = this.game.meta, h = this.h, slot = DH.GEAR_SLOTS.find(s => s.key === this.picker);
      const items = m.d.gear.filter(g => g.slot === slot.key).sort((a, b) => (DH.rarityRank(b.rarity) - DH.rarityRank(a.rarity)) || ((m.canEquip(h, b) ? 1 : 0) - (m.canEquip(h, a) ? 1 : 0)));
      this.buttons = [];
      ctx.fillStyle = 'rgba(4,2,10,0.75)'; ctx.fillRect(0, 0, C.W, C.H);
      UI.panel(ctx, 30, 140, 480, 680, { radius: 18, fill: PAL.panel });
      ctx.font = `bold 20px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText(`選擇${slot.name}`, 50, 170);
      const cur = h.gear[slot.key];
      if (cur) {
        ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = DH.RARITIES[cur.rarity].color; ctx.fillText(`目前：${DH.gearLabel(cur)}　${DH.gearStatLabel(cur)}`, 50, 196);
        if (cur.rarity === 'signature') { const mats = m.sigMaterials(h, cur).length, maxed = (cur.level || 1) >= DH.SIG_LEVEL_MAX; UI.button(this, ctx, 50, 212, 150, 30, maxed ? '已滿級' : `強化（材料 ${mats}）`, { size: 12, fill: '#ff6ad5', textColor: '#2a2030', disabled: maxed || !mats, onClick: () => { if (m.upgradeSignature(h, cur)) this.flash(`專武升到 Lv.${cur.level}！`, '#ff9ae0'); } }); }
        UI.button(this, ctx, 370, 212, 120, 30, '卸下', { size: 12, onClick: () => { m.unequip(h, slot.key); } });
      }
      else { ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText('目前沒有裝備', 50, 196); }
      ctx.save(); ctx.beginPath(); ctx.rect(30, 248, 480, 506); ctx.clip();
      this.pickerMax = Math.max(0, items.length * 62 - 506);
      if (!items.length) { ctx.font = `14px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.textAlign = 'center'; ctx.fillText('背包裡沒有這個部位的裝備。打地牢或到商店取得。', C.W / 2, 300); }
      items.forEach((g, i) => {
        const y = 254 + i * 62 - (this.pickerScroll || 0);
        S.rr(ctx, 46, y, 448, 54, 10); ctx.fillStyle = '#2a2340'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = DH.RARITIES[g.rarity].color; ctx.stroke();
        ctx.textAlign = 'left'; ctx.font = `bold 14px ${DH.FONT}`; ctx.fillStyle = DH.RARITIES[g.rarity].color; ctx.fillText(DH.gearLabel(g), 60, y + 18);
        ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.text; ctx.fillText(DH.gearStatLabel(g) + (g.heroId ? `　專屬：${DH.HEROES[g.heroId].name}·${DH.HEROES[g.heroId].cls}` : ''), 60, y + 38);
        if (y > 150 && y < 760) {
          UI.button(this, ctx, 330, y + 10, 70, 34, '裝備', { size: 13, fill: PAL.gold, textColor: '#2a2030', disabled: !m.canEquip(h, g), onClick: () => { m.equip(h, g); this.picker = null; this.flash('裝備完成'); } });
          UI.button(this, ctx, 408, y + 10, 76, 34, `賣 ${Math.round(DH.RARITIES[g.rarity].price * 0.4)}金`, { size: 11, fill: '#4a3a2a', onClick: () => { m.sellGear(g); } });
        }
      });
      ctx.restore();
      UI.button(this, ctx, 190, 766, 160, 42, '關閉', { onClick: () => { this.picker = null; } });
    }
    drawConfirm(ctx) {
      this.buttons = [];
      ctx.fillStyle = 'rgba(4,2,10,0.75)'; ctx.fillRect(0, 0, C.W, C.H);
      UI.panel(ctx, 50, 360, 440, 200, { radius: 18, fill: PAL.panel, stroke: PAL.gold });
      ctx.font = `15px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; UI.wrap(ctx, this.confirm.text, 74, 400, 392, 22, 3);
      UI.button(this, ctx, 80, 490, 170, 46, '取消', { onClick: () => { this.confirm = null; } });
      UI.button(this, ctx, 290, 490, 170, 46, '確定', { fill: PAL.gold, textColor: '#2a2030', onClick: () => { const c = this.confirm; this.confirm = null; c.ok(); } });
    }
  }
  DH.HeroCard = HeroCard;
})(window.DH);
