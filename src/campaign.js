// 戰役：8 章 × 20 關，章節切換 + 關卡格子
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes, UI = DH.UI;
  const TERRAIN_COLORS = { '#': '#6a6472', 'R': '#8a7a66', 'I': '#bfe3f7', 'F': '#ff7a2a', 'M': '#7a5a38', 'W': '#2f6a98', 'B': '#9a6a3a', 'X': '#0a0810', 'S': '#c8ccd8', 'P': '#9a5ad0', 'E': '#ff4a3a', 'T': '#e8d8ff', 'Q': '#7ad8ff' };

  // 三層：章節總覽（首領簡介）→ 選關 → 關卡詳情（挑戰）
  class Campaign extends UI.Screen {
    constructor(game, opts) {
      super(game);
      opts = opts || {};
      const stars = game.meta.d.stars;
      let firstOpen = DH.DUNGEONS.findIndex(d => !stars[d.id]);
      if (firstOpen < 0) firstOpen = DH.DUNGEONS.length - 1;
      const d = DH.DUNGEONS[firstOpen];
      this.chapter = opts.chapter || d.chapter;
      this.mode = opts.mode || 'chapter';
      this.selectedId = opts.selectedId || null;
    }
    unlocked(d) { return d.id === 1 || !!this.game.meta.d.stars[d.id - 1] || this.game.unlockAll; }
    chapterUnlocked(chId) { return this.unlocked(DH.levelsOf(chId)[0]); }
    bossOf(ch) { return (ch.finalBoss || ch.boss); }
    themeBg(ctx, ch) {
      const T = DH.THEMES[ch.theme];
      const g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, T.bg1); g.addColorStop(1, T.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      ctx.save(); ctx.globalAlpha = 0.25;
      for (let i = 0; i < 30; i++) { const x = (i * 131) % C.W, y = 100 + ((i * 97) % 700), r = 10 + (i % 4) * 6; S.circ(ctx, x, y, r); ctx.fillStyle = T.deco; ctx.fill(); }
      ctx.restore();
    }
    draw(ctx) {
      this.buttons = [];
      const ch = DH.CHAPTERS[this.chapter - 1];
      this.themeBg(ctx, ch);
      if (this.mode === 'chapter') this.drawChapter(ctx, ch);
      else this.drawLevels(ctx, ch);
      if (this.mode === 'chapter') { UI.header(this, ctx, '戰役'); UI.nav(this, ctx, 'campaign'); }
      else UI.header(this, ctx, `第 ${ch.id} 章　${ch.name}`, () => { this.mode = 'chapter'; this.selectedId = null; });
      if (this.selectedId && this.mode === 'levels') this.drawDetail(ctx);
      if (this.help) this.drawHelp(ctx);
    }
    // ── 章節總覽：首領簡介 ──
    drawChapter(ctx, ch) {
      const stars = this.game.meta.d.stars, levels = DH.levelsOf(ch.id);
      const chStars = levels.reduce((a, d) => a + (stars[d.id] || 0), 0), cleared = levels.filter(d => stars[d.id]).length;
      const open = this.chapterUnlocked(ch.id);
      // 章節切換
      UI.panel(ctx, 12, 92, 516, 70, { radius: 16 });
      const prevOk = this.chapter > 1, nextOk = this.chapter < DH.CHAPTERS.length;
      UI.button(this, ctx, 22, 102, 50, 50, '◀', { size: 18, disabled: !prevOk, onClick: () => { this.chapter--; } });
      UI.button(this, ctx, 468, 102, 50, 50, '▶', { size: 18, disabled: !nextOk, onClick: () => { this.chapter++; } });
      ctx.font = `bold 22px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; ctx.fillText(`第 ${ch.id} 章　${ch.name}`, C.W / 2, 117);
      // 章節小圓點
      for (let i = 0; i < DH.CHAPTERS.length; i++) {
        const x = C.W / 2 + (i - 3.5) * 24, y = 144, on = i + 1 === this.chapter, ok = this.chapterUnlocked(i + 1);
        const done = DH.levelsOf(i + 1).every(d => stars[d.id]);
        S.circ(ctx, x, y, on ? 8 : 6); ctx.fillStyle = on ? PAL.gold : done ? '#6ab04c' : ok ? '#8a7a5a' : '#3a3444'; ctx.fill();
        this.buttons.push({ x: x - 11, y: y - 11, w: 22, h: 22, onClick: () => { this.chapter = i + 1; } });
      }
      // 首領舞台
      const bossId = this.bossOf(ch), bd = DH.MONSTERS[bossId], el = DH.ELEMENTS[bd.element];
      const sx = 12, sy = 172, sw = 516, sh = 300;
      ctx.save(); S.rr(ctx, sx, sy, sw, sh, 20); ctx.clip();
      const T = DH.THEMES[ch.theme];
      const g = ctx.createRadialGradient(C.W / 2, sy + 190, 20, C.W / 2, sy + 190, 280); g.addColorStop(0, el.color + '66'); g.addColorStop(0.5, T.bg1); g.addColorStop(1, '#05030a');
      ctx.fillStyle = g; ctx.fillRect(sx, sy, sw, sh);
      // 光柱與地面
      ctx.globalAlpha = 0.18 + 0.06 * Math.sin(this.time * 2); ctx.fillStyle = el.color;
      ctx.beginPath(); ctx.moveTo(C.W / 2 - 60, sy); ctx.lineTo(C.W / 2 + 60, sy); ctx.lineTo(C.W / 2 + 130, sy + sh); ctx.lineTo(C.W / 2 - 130, sy + sh); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.ellipse(C.W / 2, sy + 262, 150, 26, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      if (!this._boss || this._boss.id !== bossId) this._boss = new DH.Monster(bossId, [0, 0]);
      const k = 2.4 / (bd.size || 1);
      if (open) { ctx.save(); ctx.translate(C.W / 2, sy + 196); ctx.scale(k, k); DH.drawMonster(ctx, this._boss, 0, 0, this.time); ctx.restore(); }
      else { ctx.font = `bold 120px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText('？', C.W / 2, sy + 170); }
      ctx.restore();
      S.rr(ctx, sx, sy, sw, sh, 20); ctx.lineWidth = 3; ctx.strokeStyle = open ? el.color : '#3a3444'; ctx.stroke();
      ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.gold; ctx.fillText(ch.id === 8 ? '最終首領' : '章節首領', 30, sy + 22);
      ctx.font = `bold 30px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      const bname = open ? bd.name : '？？？'; ctx.strokeText(bname, C.W / 2, sy + 34); ctx.fillStyle = '#fff'; ctx.fillText(bname, C.W / 2, sy + 34);
      if (!open) { ctx.font = `bold 15px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`通關第 ${ch.id - 1} 章首領後解鎖`, C.W / 2, sy + 262); }
      // 首領資料
      const py = 482;
      UI.panel(ctx, 12, py, 516, 214, { radius: 16 });
      let x = 28;
      ctx.textBaseline = 'middle';
      x += UI.chip(ctx, x, py + 10, `${el.name}色`, el.color) + 6;
      x += UI.chip(ctx, x, py + 10, DH.RACE_NAMES[bd.race] || '怪物', '#c9b07a') + 6;
      x += UI.chip(ctx, x, py + 10, DH.PATTERNS[bd.pattern].label || bd.pattern, PAL[DH.PATTERNS[bd.pattern].kind]) + 6;
      x += UI.chip(ctx, x, py + 10, `AI ${DH.AI_NAMES[bd.ai]}`, '#8a8aa0') + 6;
      const last = levels[levels.length - 1], scl = last.scale;
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.textDim;
      ctx.fillText(`生命 ${Math.round(bd.hp * scl.hp * 1.25)}　攻擊 ${Math.round(bd.atk * scl.atk)}　速度 ${bd.speed}　護甲 ${bd.armor} 層`, 28, py + 44);
      const tal = (bd.talents || []).map(t => DH.TALENTS[t]).filter(Boolean);
      ctx.fillStyle = PAL.text; UI.wrap(ctx, '能力：' + (tal.length ? tal.map(t => `${t.name}（${t.desc}）`).join('；') : '無'), 28, py + 66, 484, 16, 2);
      ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = PAL.text; UI.wrap(ctx, ch.bossLore, 28, py + 110, 484, 18, 2);
      ctx.font = `bold 12px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText('攻略', 28, py + 152);
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = '#d8e8ff'; UI.wrap(ctx, ch.bossTip, 64, py + 152, 448, 17, 3);
      // 章節資訊與進入
      const cy = 704;
      UI.panel(ctx, 12, cy, 516, 176, { radius: 16 });
      ctx.font = `12px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.text; UI.wrap(ctx, ch.desc, 28, cy + 20, 484, 17, 2);
      ctx.fillStyle = PAL.textDim;
      ctx.fillText('地形：' + Object.keys(ch.features).map(f => DH.FEATURE_NAMES[f] || f).join('、'), 28, cy + 58);
      ctx.fillText('敵人：' + [...new Set(ch.pool.concat(ch.elite))].map(id => DH.MONSTERS[id].name).join('、'), 28, cy + 78);
      UI.bar(ctx, 28, cy + 100, 300, 14, cleared / levels.length, '#6ab04c', `已通關 ${cleared} / ${levels.length}`);
      ctx.font = `bold 13px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.textAlign = 'left'; UI.star(ctx, 36, cy + 134, 7, PAL.gold); ctx.fillText(`${chStars} / ${levels.length * 3}`, 50, cy + 134);
      UI.button(this, ctx, 120, cy + 120, 92, 30, '克制表', { size: 12, onClick: () => { this.help = true; } });
      UI.button(this, ctx, 344, cy + 96, 168, 62, open ? '進入章節 ▶' : '尚未解鎖', { fill: PAL.gold, textColor: '#2a2030', size: 19, disabled: !open, onClick: () => { this.mode = 'levels'; this.selectedId = null; this.scrollY = 0; } });
    }
    // ── 選關 ──
    drawLevels(ctx, ch) {
      const stars = this.game.meta.d.stars, levels = DH.levelsOf(ch.id);
      const chStars = levels.reduce((a, d) => a + (stars[d.id] || 0), 0);
      ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold;
      ctx.fillText(`★ ${chStars} / 60　　點選關卡查看詳情`, C.W / 2, 104);
      const cols = 4, bw = 112, bh = 138, gap = 12, x0 = (C.W - cols * bw - (cols - 1) * gap) / 2, y0 = 122;
      const next = levels.find(d => this.unlocked(d) && !stars[d.id]);
      levels.forEach((d, i) => {
        const x = x0 + (i % cols) * (bw + gap), y = y0 + Math.floor(i / cols) * (bh + gap);
        const open = this.unlocked(d), st = stars[d.id] || 0, isNext = next && next.id === d.id;
        S.rr(ctx, x, y + 3, bw, bh, 14); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
        S.rr(ctx, x, y, bw, bh, 14); S.fillStroke(ctx, !open ? '#2c2834' : d.boss ? '#6a2a2a' : st ? '#33502e' : '#6a5226', isNext ? PAL.gold : '#1a1420', isNext ? 3 : 2);
        // 地形縮圖
        const cs = 12, mx = x + (bw - C.COLS * cs) / 2, my = y + 30;
        if (open) {
          for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) { const t = d.terrain[r][c]; if (t === 'X') continue; ctx.fillStyle = t === '.' ? 'rgba(255,255,255,0.14)' : TERRAIN_COLORS[t]; ctx.fillRect(mx + c * cs, my + r * cs * 0.75, cs - 1, cs * 0.75 - 1); }
          for (const m of d.stages[0]) { ctx.fillStyle = '#ff5a4a'; ctx.fillRect(mx + m.pos[0] * cs + 2, my + m.pos[1] * cs * 0.75 + 1, cs - 5, cs * 0.75 - 3); }
        } else { S.rr(ctx, x + bw / 2 - 9, y + 58, 18, 15, 3); ctx.fillStyle = '#7a7488'; ctx.fill(); ctx.beginPath(); ctx.arc(x + bw / 2, y + 57, 7, Math.PI, 0); ctx.lineWidth = 3.5; ctx.strokeStyle = '#7a7488'; ctx.stroke(); }
        ctx.font = `bold ${d.boss ? 14 : 16}px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = open ? '#fff' : '#6a6478';
        ctx.fillText(d.boss ? 'BOSS' : `${ch.id}-${d.index}`, x + bw / 2, y + 16);
        for (let k = 0; k < 3; k++) UI.star(ctx, x + bw / 2 + (k - 1) * 18, y + bh - 16, 7, k < st ? PAL.gold : 'rgba(0,0,0,0.45)');
        if (isNext) { ctx.font = `bold 10px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText('NEXT', x + bw - 20, y + 16); }
        if (open) this.buttons.push({ x, y, w: bw, h: bh, onClick: () => { this.selectedId = d.id; } });
      });
      this.scrollMax = Math.max(0, y0 + Math.ceil(levels.length / cols) * (bh + gap) - C.H + 20);
    }
    // ── 關卡詳情：挑戰 ──
    drawDetail(ctx) {
      this.buttons = [];
      const d = DH.DUNGEONS.find(l => l.id === this.selectedId); if (!d) { this.selectedId = null; return; }
      const stars = this.game.meta.d.stars, m = this.game.meta;
      ctx.fillStyle = 'rgba(4,2,10,0.8)'; ctx.fillRect(0, 0, C.W, C.H);
      this.buttons.push({ x: 0, y: 0, w: C.W, h: C.H, onClick: () => { this.selectedId = null; } });
      const tt = DH.terrainTypes(d), nDesc = tt.filter(t => DH.TERRAIN_DESC[t]).slice(0, 4).length;
      const pw = 500, ph = 500 + nDesc * 32, px = 20, py = Math.round((C.H - ph) / 2);
      UI.panel(ctx, px, py, pw, ph, { radius: 20, stroke: d.boss ? '#ff6a5a' : PAL.gold });
      this.buttons.push({ x: px, y: py, w: pw, h: ph, onClick: () => {} });
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `bold 21px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText(`${d.id}. ${d.name}`, px + 18, py + 30);
      for (let k = 0; k < 3; k++) UI.star(ctx, px + pw - 70 + k * 20, py + 30, 8, k < (stars[d.id] || 0) ? PAL.gold : 'rgba(0,0,0,0.5)');
      ctx.font = `12px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`${d.stages.length} 波　怪物強度 ×${d.scale.hp.toFixed(2)}　推薦戰力 ${Math.round(700 * d.scale.hp)}`, px + 18, py + 58);
      ctx.fillStyle = PAL.text; UI.wrap(ctx, d.desc, px + 18, py + 82, pw - 36, 17, 2);
      // 大地形圖
      const cs = 30, mx = px + 18, my = py + 124;
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
        const t = d.terrain[r][c]; if (t === 'X') continue;
        S.rr(ctx, mx + c * cs, my + r * cs, cs - 2, cs - 2, 4); ctx.fillStyle = t === '.' ? 'rgba(255,255,255,0.12)' : TERRAIN_COLORS[t]; ctx.fill();
      }
      for (const mo of d.stages[0]) { const md = DH.MONSTERS[mo.id]; S.circ(ctx, mx + mo.pos[0] * cs + cs / 2 - 1, my + mo.pos[1] * cs + cs / 2 - 1, md.boss ? 11 : 8); ctx.fillStyle = DH.ELEMENTS[md.element].color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0a0a'; ctx.stroke(); }
      ctx.font = `10px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.textAlign = 'left'; ctx.fillText('圓點：第一波怪物（顏色為屬性）', mx, my + C.ROWS * cs + 10);
      // 右欄：地形圖例
      const rx = mx + C.COLS * cs + 16; let ry = my + 6;
      ctx.font = `bold 12px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText('地形', rx, ry); ry += 20;
      ctx.font = `11px ${DH.FONT}`;
      if (!tt.length) { ctx.fillStyle = PAL.text; ctx.fillText('平地', rx, ry); ry += 18; }
      for (const t of tt) { S.rr(ctx, rx, ry - 7, 14, 14, 3); ctx.fillStyle = TERRAIN_COLORS[t]; ctx.fill(); ctx.fillStyle = PAL.text; ctx.fillText(DH.TERRAIN_NAMES[t], rx + 20, ry); ry += 18; }
      ry += 8; ctx.font = `bold 12px ${DH.FONT}`; ctx.fillStyle = PAL.gold; ctx.fillText('敵人', rx, ry); ry += 18;
      ctx.font = `11px ${DH.FONT}`;
      const ids = [...new Set(d.stages.flat().map(x => x.id))];
      for (const id of ids) { if (ry > my + C.ROWS * cs) { ctx.fillStyle = PAL.textDim; ctx.fillText('…', rx + 16, ry - 6); break; } const md = DH.MONSTERS[id]; S.circ(ctx, rx + 6, ry, 5); ctx.fillStyle = DH.ELEMENTS[md.element].color; ctx.fill(); ctx.fillStyle = md.boss ? '#ff9a8a' : PAL.text; ctx.fillText(md.name, rx + 16, ry); ry += 17; }
      // 地形說明
      let ty = my + C.ROWS * cs + 30;
      ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim;
      for (const t of tt.filter(t => DH.TERRAIN_DESC[t]).slice(0, 4)) ty = UI.wrap(ctx, DH.TERRAIN_DESC[t], px + 18, ty, pw - 36, 15, 2) + 2;
      // 隊伍與按鈕
      const power = m.teamPower(m.d.team);
      ctx.font = `bold 12px ${DH.FONT}`; ctx.fillStyle = power >= Math.round(700 * d.scale.hp) ? '#8ae08a' : '#ff9a7a';
      ctx.fillText(`目前隊伍戰力 ${power}`, px + 18, py + ph - 88);
      UI.button(this, ctx, px + 18, py + ph - 70, 150, 52, '返回', { onClick: () => { this.selectedId = null; } });
      UI.button(this, ctx, px + pw - 248, py + ph - 70, 230, 52, '挑戰 ▶', { fill: PAL.gold, textColor: '#2a2030', size: 20, onClick: () => this.game.showTeam(d) });
    }
    drawHelp(ctx) {
      this.buttons = [];
      ctx.fillStyle = 'rgba(4,2,10,0.94)'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.font = `bold 24px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.gold; ctx.fillText('克制關係', C.W / 2, 50);
      let y = 96;
      const h2 = (t) => { ctx.font = `bold 15px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.gold; ctx.fillText(t, 28, y); y += 24; };
      const line = (t, c) => { ctx.font = `13px ${DH.FONT}`; ctx.fillStyle = c || PAL.text; y = UI.wrap(ctx, t, 28, y, 484, 19) + 2; };
      h2('顏色克制（×1.5 / 被克 ×0.75）');
      const E = DH.ELEMENTS; let x = 28;
      ['red', 'green', 'blue', 'red'].forEach((k, i) => { x += UI.chip(ctx, x, y - 9, E[k].name + '色', E[k].color) + 4; if (i < 3) { ctx.fillStyle = PAL.text; ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillText('›', x, y); x += 14; } });
      x += 10; x += UI.chip(ctx, x, y - 9, '光色', E.light.color) + 4; ctx.fillStyle = PAL.text; ctx.fillText('‹›', x, y); x += 18; UI.chip(ctx, x, y - 9, '暗色', E.dark.color);
      y += 24; line('紅克綠、綠克藍、藍克紅；光與暗互相克制（雙方都 +50%）。', PAL.textDim); y += 6;
      h2('職業克制（×1.2 / 被克 ×0.85，英雄與怪物都適用）');
      line('近戰 › 遠程 › 魔法 › 近戰。看單位的攻擊模式圖示：近戰（橘）、遠程（綠）、魔法（藍）。', PAL.textDim);
      line('職業專精：' + Object.entries(DH.CLASS_VS_RACE).map(([k, v]) => `${DH.CLASSES[k].cls}→${DH.RACE_NAMES[v[0]]}+${Math.round(v[1] * 100)}%`).join('　')); y += 6;
      h2('種族克制（×1.2 / 被克 ×0.85，雙向）');
      for (const [k, v] of Object.entries(DH.SPECIES_VS_RACE)) line(`${DH.SPECIES[k]}：克制 ${DH.RACE_NAMES[v.beats]}（打牠 +20%、被牠打 -15%）；被 ${DH.RACE_NAMES[v.weak]} 克制（打牠 -15%、被牠打 +20%）`);
      y += 4;
      h2('怪物種族');
      const groups = {};
      for (const m of Object.values(DH.MONSTERS)) (groups[m.race] = groups[m.race] || []).push(m.name);
      for (const [r, names] of Object.entries(groups)) line(`${DH.RACE_NAMES[r]}：${names.join('、')}`, PAL.textDim);
      UI.button(this, ctx, 190, C.H - 70, 160, 46, '關閉', { onClick: () => { this.help = false; } });
    }
  }
  DH.Campaign = Campaign;
})(window.DH);
