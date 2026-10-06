// 共用介面元件與可捲動畫面基底
(function (DH) {
  const C = DH.CONFIG, PAL = DH.PALETTE, S = DH.shapes;
  const UI = {};

  UI.button = function (scene, ctx, x, y, w, h, label, opts) {
    opts = opts || {};
    const fill = opts.disabled ? '#3a3442' : (opts.fill || PAL.panelLight);
    S.rr(ctx, x, y, w, h, opts.radius || 12); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = opts.disabled ? '#2a2430' : (opts.stroke || 'rgba(0,0,0,0.5)'); ctx.stroke();
    if (!opts.disabled) { S.rr(ctx, x + 3, y + 3, w - 6, h / 2 - 3, (opts.radius || 12) - 3); ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill(); }
    ctx.font = `bold ${opts.size || 16}px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.disabled ? '#7a7488' : (opts.textColor || PAL.text); ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    if (opts.sub) { ctx.font = `10px ${DH.FONT}`; ctx.fillStyle = opts.disabled ? '#6a6478' : (opts.subColor || 'rgba(0,0,0,0.6)'); ctx.fillText(opts.sub, x + w / 2, y + h - 10); }
    if (!opts.disabled && opts.onClick) scene.buttons.push({ x, y, w, h, onClick: opts.onClick });
  };
  UI.panel = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    S.rr(ctx, x, y, w, h, opts.radius || 16); ctx.fillStyle = opts.fill || 'rgba(16,12,24,0.82)'; ctx.fill();
    ctx.lineWidth = opts.lw || 2; ctx.strokeStyle = opts.stroke || PAL.frame; ctx.stroke();
  };
  UI.star = function (ctx, x, y, r, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  UI.stars = function (ctx, x, y, n, r, max) {
    max = max || n;
    for (let i = 0; i < max; i++) UI.star(ctx, x + i * (r * 2.3), y, r, i < n ? PAL.gold : 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)');
  };
  UI.chip = function (ctx, x, y, text, color, textColor) {
    ctx.font = `bold 11px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 12;
    S.rr(ctx, x, y, w, 18, 9); ctx.fillStyle = color; ctx.fill(); ctx.fillStyle = textColor || '#1a1420'; ctx.fillText(text, x + 6, y + 9.5);
    return w;
  };
  UI.wrap = function (ctx, text, x, y, w, lh, maxLines) {
    let line = '', yy = y, lines = 0;
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > w) { ctx.fillText(line, x, yy); line = ch; yy += lh; lines++; if (maxLines && lines >= maxLines) return yy; }
      else line += ch;
    }
    if (line) { ctx.fillText(line, x, yy); yy += lh; }
    return yy;
  };
  UI.bar = function (ctx, x, y, w, h, ratio, color, text) {
    S.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = PAL.hpBg; ctx.fill();
    if (ratio > 0) { S.rr(ctx, x + 1, y + 1, Math.max(h - 2, (w - 2) * Math.min(1, ratio)), h - 2, (h - 2) / 2); ctx.fillStyle = color; ctx.fill(); }
    S.rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    if (text) { ctx.font = `bold ${Math.max(9, h - 4)}px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(text, x + w / 2, y + h / 2 + 0.5); }
  };
  // 頂部資源列（金幣／寶石／代幣）
  UI.resources = function (ctx, game, y) {
    const d = game.meta.d;
    const items = [['金', d.gold, PAL.gold], ['鑽', d.gems, '#7ad8ff'], ['賦', d.tokens, '#c79af0']];
    let x = C.W - 16;
    ctx.font = `bold 13px ${DH.FONT}`; ctx.textBaseline = 'middle';
    for (let i = items.length - 1; i >= 0; i--) {
      const [ic, v, col] = items[i]; const txt = String(v); const w = ctx.measureText(txt).width + 34;
      x -= w; S.rr(ctx, x, y, w, 24, 12); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      DH.drawBadge(ctx, x + 12, y + 12, 9, ic, col, '#1a1420', 10);
      ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = PAL.text; ctx.fillText(txt, x + 26, y + 12.5);
      x -= 6;
    }
  };
  UI.header = function (scene, ctx, title, backFn) {
    ctx.fillStyle = 'rgba(12,9,20,0.96)'; ctx.fillRect(0, 0, C.W, 86);
    UI.panel(ctx, 12, 14, 516, 64, { radius: 16 });
    if (backFn) {
      S.rr(ctx, 22, 24, 44, 44, 12); ctx.fillStyle = PAL.panelLight; ctx.fill(); ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(50, 36); ctx.lineTo(38, 46); ctx.lineTo(50, 56); ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.text; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      scene.buttons.push({ x: 22, y: 24, w: 44, h: 44, onClick: backFn });
    }
    ctx.font = `bold ${backFn ? 22 : 20}px ${DH.FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text;
    ctx.fillText(title, backFn ? 78 : 28, 46);
    UI.resources(ctx, scene.game, 34);
  };
  // 底部導覽列
  UI.nav = function (scene, ctx, active) {
    const tabs = [['campaign', '戰役'], ['barracks', '兵營'], ['summon', '召喚'], ['shop', '商店']];
    const y = C.H - 70;
    UI.panel(ctx, 12, y, 516, 58, { radius: 16, fill: 'rgba(16,12,24,0.92)' });
    const w = 516 / 4;
    tabs.forEach(([key, label], i) => {
      const x = 12 + i * w, on = key === active;
      if (on) { S.rr(ctx, x + 8, y + 6, w - 16, 46, 12); ctx.fillStyle = PAL.panelLight; ctx.fill(); }
      ctx.font = `bold 16px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = on ? PAL.gold : PAL.textDim;
      ctx.fillText(label, x + w / 2, y + 29);
      if (!on) scene.buttons.push({ x, y, w, h: 58, onClick: () => scene.game.show(key) });
    });
  };

  // 可捲動畫面基底：按鈕在放開時觸發，拖曳超過門檻視為捲動
  class Screen {
    constructor(game) { this.game = game; this.time = 0; this.buttons = []; this.scrollY = 0; this.scrollMax = 0; this._press = null; this.overlay = null; }
    update(dt) { this.time += dt; }
    pointerDown(x, y) { this._press = { x, y, sy: this.scrollY, moved: false }; }
    pointerMove(x, y) {
      const p = this._press; if (!p || !this.scrollMax) return;
      if (Math.abs(y - p.y) > 8) p.moved = true;
      if (p.moved) this.scrollY = Math.max(0, Math.min(this.scrollMax, p.sy - (y - p.y)));
    }
    pointerUp(x, y) {
      const p = this._press; this._press = null; if (!p || p.moved) return;
      for (let i = this.buttons.length - 1; i >= 0; i--) { const b = this.buttons[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.onClick(); return; } }
    }
    background(ctx, c1, c2) {
      const g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, c1 || PAL.bgTop); g.addColorStop(1, c2 || PAL.bgBottom);
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
    }
  }
  UI.Screen = Screen;

  // 英雄小卡（兵營／隊伍共用）
  UI.heroCard = function (scene, ctx, h, x, y, w, hh, opts) {
    opts = opts || {};
    const meta = scene.game.meta, d = meta.def(h), el = DH.ELEMENTS[d.element];
    S.rr(ctx, x, y, w, hh, 12); ctx.fillStyle = opts.selected ? '#3a2f55' : (d.legendary ? '#3a1a34' : PAL.panel); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = opts.selected ? PAL.gold : (d.legendary ? '#ff6ad5' : el.dark); ctx.stroke();
    S.rr(ctx, x, y, w, 5, 2); ctx.fillStyle = el.color; ctx.fill();
    const scale = opts.scale || 0.9;
    ctx.save(); ctx.beginPath(); S.rr(ctx, x + 1, y + 1, w - 2, hh - 2, 11); ctx.clip();
    ctx.translate(x + w / 2, y + hh * 0.42); ctx.scale(scale, scale);
    DH.drawHero(ctx, { look: d.look, element: d.element, uid: h.uid.length, id: d.id, weaponRarity: h.gear.weapon ? h.gear.weapon.rarity : null, shieldHp: 0, legendary: d.legendary }, 0, 0, scene.time, { noShadow: true });
    ctx.restore();
    UI.stars(ctx, x + w / 2 - (h.stars - 1) * 6.9, y + 14, h.stars, 5);
    ctx.font = `bold 13px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.text; ctx.fillText(`${d.name}·${d.cls}`, x + w / 2, y + hh - 34);
    ctx.font = `11px ${DH.FONT}`; ctx.fillStyle = PAL.textDim; ctx.fillText(`Lv.${h.level}${h.ascended ? ' 昇' : ''}　戰力 ${meta.power(h)}`, x + w / 2, y + hh - 16);
    if (opts.badge) DH.drawBadge(ctx, x + 14, y + 16, 10, opts.badge, PAL.gold, '#2a2030', 10);
    if (opts.onClick) scene.buttons.push({ x, y, w, h: hh, onClick: opts.onClick });
  };
  DH.UI = UI;
})(window.DH);
