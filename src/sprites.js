// 程式繪製的卡通角色（Q 版英雄與怪物）
(function (DH) {
  const C = DH.CONFIG;
  const PAL = DH.PALETTE;
  const OUTLINE = '#2a2030';

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.closePath(); }
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
  function fillStroke(ctx, fill, stroke, lw) {
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function shade(hex, amt) { // amt -1..1
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function shadow(ctx, x, y, w) {
    ell(ctx, x, y, w / 2, w / 6); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  }
  function eyes(ctx, x, y, gap, r, color, pupil) {
    for (const s of [-1, 1]) {
      circ(ctx, x + s * gap, y, r); ctx.fillStyle = color || '#fff'; ctx.fill();
      circ(ctx, x + s * gap + s * 0.5, y + 0.5, r * 0.55); ctx.fillStyle = pupil || '#1d1824'; ctx.fill();
      circ(ctx, x + s * gap - r * 0.3, y - r * 0.35, r * 0.22); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }

  // ───────────────────────── 英雄 ─────────────────────────
  function drawWeapon(ctx, kind, x, y, el, t) {
    const gold = '#e6b84a', steel = '#cfd6e2', steelDark = '#8b95a6', wood = '#8a5a30';
    switch (kind) {
      case 'sword':
        ctx.save(); ctx.translate(x + 17, y + 2); ctx.rotate(-0.25);
        rr(ctx, -2.5, -26, 5, 26, 2); fillStroke(ctx, steel, OUTLINE, 1.5);
        rr(ctx, -6, -1, 12, 3, 1); fillStroke(ctx, gold, OUTLINE, 1.5);
        rr(ctx, -2, 2, 4, 8, 1.5); fillStroke(ctx, '#5a3a20', OUTLINE, 1.5);
        ctx.restore(); break;
      case 'axe':
        ctx.save(); ctx.translate(x + 18, y + 4); ctx.rotate(-0.2);
        rr(ctx, -2, -28, 4, 34, 2); fillStroke(ctx, wood, OUTLINE, 1.5);
        ctx.beginPath(); ctx.moveTo(0, -27); ctx.quadraticCurveTo(14, -30, 12, -14); ctx.quadraticCurveTo(6, -18, 0, -16); ctx.closePath();
        fillStroke(ctx, steel, OUTLINE, 1.5); ctx.restore(); break;
      case 'bow':
        ctx.save(); ctx.translate(x + 18, y - 2);
        ctx.beginPath(); ctx.arc(-6, 0, 20, -1.1, 1.1); ctx.lineWidth = 3.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = wood; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6 + 20 * Math.cos(-1.1), 20 * Math.sin(-1.1)); ctx.lineTo(-6 + 20 * Math.cos(1.1), 20 * Math.sin(1.1));
        ctx.lineWidth = 1; ctx.strokeStyle = '#eee'; ctx.stroke(); ctx.restore(); break;
      case 'staff': {
        ctx.save(); ctx.translate(x + 18, y + 4); ctx.rotate(0.1);
        rr(ctx, -2, -30, 4, 38, 2); fillStroke(ctx, wood, OUTLINE, 1.5);
        const glow = 0.6 + 0.4 * Math.sin(t * 4);
        circ(ctx, 0, -32, 7); ctx.fillStyle = el.light; ctx.fill();
        circ(ctx, 0, -32, 5); fillStroke(ctx, el.color, OUTLINE, 1.5);
        ctx.globalAlpha = glow * 0.5; circ(ctx, 0, -32, 10); ctx.fillStyle = el.light; ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore(); break;
      }
      case 'mace':
        ctx.save(); ctx.translate(x + 17, y + 3); ctx.rotate(-0.15);
        rr(ctx, -2, -22, 4, 28, 2); fillStroke(ctx, wood, OUTLINE, 1.5);
        circ(ctx, 0, -25, 7); fillStroke(ctx, gold, OUTLINE, 1.5);
        circ(ctx, 0, -25, 3); ctx.fillStyle = el.color; ctx.fill(); ctx.restore(); break;
      case 'dagger':
        for (const s of [-1, 1]) {
          ctx.save(); ctx.translate(x + s * 17, y + 6); ctx.rotate(s * 0.5);
          rr(ctx, -2, -16, 4, 16, 2); fillStroke(ctx, steel, OUTLINE, 1.5);
          rr(ctx, -4, -1, 8, 2.5, 1); fillStroke(ctx, '#444', OUTLINE, 1); ctx.restore();
        } break;
      case 'club':
        ctx.save(); ctx.translate(x + 18, y + 4); ctx.rotate(-0.3);
        ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-5, -22); ctx.quadraticCurveTo(0, -30, 6, -22); ctx.lineTo(3, 8); ctx.closePath();
        fillStroke(ctx, wood, OUTLINE, 1.5);
        for (const [sx, sy] of [[-2, -20], [3, -14], [-1, -8]]) { circ(ctx, sx, sy, 1.5); ctx.fillStyle = steelDark; ctx.fill(); }
        ctx.restore(); break;
    }
  }

  function drawHair(ctx, look, x, y, r) {
    const h = look.hair, hd = shade(h, -0.3);
    ctx.fillStyle = h; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    switch (look.hairStyle) {
      case 'spiky':
        ctx.beginPath(); ctx.moveTo(x - r, y - 2);
        for (let i = 0; i < 6; i++) { const a = -Math.PI + (i + 0.5) * Math.PI / 6; ctx.lineTo(x + Math.cos(a) * (r + 7), y - 2 + Math.sin(a) * (r + 7)); ctx.lineTo(x + Math.cos(a + Math.PI / 12) * r * 0.9, y - 2 + Math.sin(a + Math.PI / 12) * r * 0.9); }
        ctx.lineTo(x + r, y - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'mohawk':
        ctx.beginPath(); ctx.moveTo(x - 5, y - r + 4); ctx.lineTo(x - 3, y - r - 12); ctx.lineTo(x, y - r - 16); ctx.lineTo(x + 3, y - r - 12); ctx.lineTo(x + 5, y - r + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'ponytail':
        ctx.beginPath(); ctx.moveTo(x + r - 4, y - 4); ctx.quadraticCurveTo(x + r + 10, y + 4, x + r + 4, y + 18); ctx.quadraticCurveTo(x + r + 1, y + 8, x + r - 6, y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y - 1, r + 1, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'long':
        ctx.beginPath(); ctx.moveTo(x - r - 1, y - 2); ctx.lineTo(x - r - 2, y + 16); ctx.lineTo(x - r + 6, y + 14); ctx.lineTo(x - r + 5, y);
        ctx.arc(x, y - 1, r + 1, Math.PI, 0); ctx.lineTo(x + r - 5, y); ctx.lineTo(x + r - 6, y + 14); ctx.lineTo(x + r + 2, y + 16); ctx.lineTo(x + r + 1, y - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      default: // short
        ctx.beginPath(); ctx.arc(x, y - 1, r + 1, Math.PI, 0); ctx.quadraticCurveTo(x + r * 0.4, y + 2, x, y - 3); ctx.quadraticCurveTo(x - r * 0.4, y + 2, x - r - 1, y - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = hd;
  }

  DH.drawHero = function (ctx, hero, x, y, t, opts) {
    opts = opts || {};
    const look = hero.look, el = DH.ELEMENTS[hero.element];
    const bob = Math.sin(t * 2.2 + hero.uid) * 1.2;
    ctx.save();
    ctx.translate(x, y + 2);
    if (!opts.noShadow) shadow(ctx, 0, 22, 40 * (hero.lifted ? 1.3 : 1));
    if (hero.lifted) ctx.translate(0, -14);
    ctx.scale(hero.scale || 1, hero.scale || 1);
    ctx.translate(0, bob);
    const tunic = el.color, tunicD = el.dark;

    // 腿與靴
    for (const s of [-1, 1]) { rr(ctx, s * 7 - 5, 10, 10, 11, 3); fillStroke(ctx, '#3a2f3f', OUTLINE, 1.5); rr(ctx, s * 7 - 6, 17, 12, 7, 3); fillStroke(ctx, '#5a3a24', OUTLINE, 1.5); }
    // 身體
    rr(ctx, -15, -6, 30, 22, 8); fillStroke(ctx, tunic, OUTLINE, 2);
    rr(ctx, -15, 8, 30, 5, 2); ctx.fillStyle = tunicD; ctx.fill();
    circ(ctx, 0, 10.5, 2.5); ctx.fillStyle = '#e6b84a'; ctx.fill();
    if (look.helmet || hero.id === 'knight') { rr(ctx, -11, -4, 22, 12, 4); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill(); }
    if (look.warpaint) { rr(ctx, -15, -6, 30, 22, 8); ctx.fillStyle = look.skin; ctx.fill(); rr(ctx, -15, 4, 30, 10, 4); ctx.fillStyle = tunicD; ctx.fill(); }
    // 手臂
    for (const s of [-1, 1]) { circ(ctx, s * 16, 4, 5.5); fillStroke(ctx, look.skin, OUTLINE, 1.5); }
    // 盾
    if (look.shield) { ctx.save(); ctx.translate(-20, 4); circ(ctx, 0, 0, 10); fillStroke(ctx, '#a9b4c4', OUTLINE, 2); circ(ctx, 0, 0, 5.5); ctx.fillStyle = el.color; ctx.fill(); ctx.restore(); }
    // 武器
    drawWeapon(ctx, look.weapon, 0, 0, el, t);
    // 頭
    const hy = -17, hr = 15;
    circ(ctx, 0, hy, hr); fillStroke(ctx, look.skin, OUTLINE, 2);
    // 鬍子
    if (look.beard) { ctx.beginPath(); ctx.moveTo(-10, hy + 4); ctx.quadraticCurveTo(0, hy + 24, 10, hy + 4); ctx.quadraticCurveTo(0, hy + 10, -10, hy + 4); fillStroke(ctx, look.hair, OUTLINE, 1.5); }
    // 眼睛
    const eyeY = hy + 1;
    if (look.mask) { rr(ctx, -13, eyeY - 5, 26, 10, 3); ctx.fillStyle = '#2f2638'; ctx.fill(); eyes(ctx, 0, eyeY, 6, 3, '#fff', '#5a2a88'); }
    else eyes(ctx, 0, eyeY, 6, 3.2);
    if (look.warpaint) { ctx.fillStyle = '#d23a2a'; rr(ctx, -12, eyeY + 4, 7, 2.5, 1); ctx.fill(); rr(ctx, 5, eyeY + 4, 7, 2.5, 1); ctx.fill(); }
    // 嘴 & 臉紅
    ctx.beginPath(); ctx.arc(0, hy + 7, 3.5, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.strokeStyle = '#7a3a3a'; ctx.stroke();
    ctx.globalAlpha = 0.35; circ(ctx, -9, hy + 6, 3); ctx.fillStyle = '#ff7a7a'; ctx.fill(); circ(ctx, 9, hy + 6, 3); ctx.fill(); ctx.globalAlpha = 1;
    // 頭髮 / 頭飾
    if (look.helmet) {
      ctx.beginPath(); ctx.arc(0, hy - 1, hr + 2, Math.PI, 0); ctx.lineTo(hr + 2, hy + 3); ctx.lineTo(-hr - 2, hy + 3); ctx.closePath(); fillStroke(ctx, '#b9c3d3', OUTLINE, 2);
      rr(ctx, -3, hy - hr - 10, 6, 12, 3); fillStroke(ctx, el.color, OUTLINE, 1.5);
    } else if (look.hood) {
      ctx.beginPath(); ctx.arc(0, hy, hr + 3, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(hr + 3, hy + 10); ctx.lineTo(-hr - 3, hy + 10); ctx.closePath(); fillStroke(ctx, el.dark, OUTLINE, 2);
      ctx.beginPath(); ctx.arc(0, hy + 1, hr - 1, Math.PI * 1.08, Math.PI * 1.92); ctx.lineTo(hr - 1, hy + 10); ctx.lineTo(-hr + 1, hy + 10); ctx.closePath(); ctx.fillStyle = look.skin; ctx.fill();
      eyes(ctx, 0, eyeY, 6, 3.2);
    } else if (look.veil) {
      ctx.beginPath(); ctx.moveTo(-hr - 2, hy - 2); ctx.arc(0, hy - 1, hr + 2, Math.PI, 0); ctx.lineTo(hr + 3, hy + 16); ctx.lineTo(hr - 4, hy + 2); ctx.lineTo(-hr + 4, hy + 2); ctx.lineTo(-hr - 3, hy + 16); ctx.closePath(); fillStroke(ctx, '#f4f0ff', OUTLINE, 2);
      rr(ctx, -5, hy - hr - 1, 10, 4, 1); ctx.fillStyle = el.color; ctx.fill();
    } else {
      drawHair(ctx, look, 0, hy, hr);
      if (look.hat) {
        ctx.beginPath(); ctx.moveTo(-hr - 6, hy - 6); ctx.lineTo(hr + 6, hy - 6); ctx.lineTo(hr - 2, hy - 10); ctx.lineTo(3, hy - hr - 22); ctx.lineTo(-hr + 2, hy - 10); ctx.closePath(); fillStroke(ctx, el.dark, OUTLINE, 2);
        rr(ctx, -hr + 1, hy - 12, hr * 2 - 2, 4, 1); ctx.fillStyle = '#e6b84a'; ctx.fill();
        circ(ctx, 0, hy - 20, 2.5); ctx.fillStyle = '#fff3a0'; ctx.fill();
      }
    }
    ctx.restore();
  };

  // ───────────────────────── 怪物 ─────────────────────────
  function goblinBase(ctx, skin, t, uid, hood, el) {
    const skinD = shade(skin, -0.3);
    for (const s of [-1, 1]) { rr(ctx, s * 6 - 5, 10, 10, 12, 3); fillStroke(ctx, skinD, OUTLINE, 1.5); }
    rr(ctx, -13, -4, 26, 18, 7); fillStroke(ctx, skin, OUTLINE, 2);
    rr(ctx, -13, 6, 26, 8, 3); fillStroke(ctx, '#6a4a2a', OUTLINE, 1.5);
    for (const s of [-1, 1]) { circ(ctx, s * 15, 4, 5); fillStroke(ctx, skin, OUTLINE, 1.5); }
    const hy = -15;
    // 耳朵
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, hy - 2); ctx.lineTo(s * 24, hy - 10); ctx.lineTo(s * 12, hy + 6); ctx.closePath(); fillStroke(ctx, skin, OUTLINE, 2); }
    circ(ctx, 0, hy, 14); fillStroke(ctx, skin, OUTLINE, 2);
    eyes(ctx, 0, hy, 6, 3.5, '#ffe36a', '#1b1b1b');
    ctx.beginPath(); ctx.moveTo(-6, hy + 7); ctx.quadraticCurveTo(0, hy + 11, 6, hy + 7); ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 4, hy + 8); ctx.lineTo(s * 5, hy + 12); ctx.lineTo(s * 2, hy + 8.5); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
    circ(ctx, 0, hy + 3, 2); ctx.fillStyle = skinD; ctx.fill();
    if (hood) {
      ctx.beginPath(); ctx.arc(0, hy - 1, 17, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(17, hy + 6); ctx.lineTo(-17, hy + 6); ctx.closePath(); fillStroke(ctx, el.dark, OUTLINE, 2);
      ctx.beginPath(); ctx.arc(0, hy, 13, Math.PI * 1.1, Math.PI * 1.9); ctx.lineTo(13, hy + 6); ctx.lineTo(-13, hy + 6); ctx.closePath(); ctx.fillStyle = skin; ctx.fill();
      eyes(ctx, 0, hy, 6, 3.5, '#ffe36a', '#1b1b1b');
    }
  }

  const SHAPES = {
    goblin(ctx, m, t) {
      goblinBase(ctx, '#6fb24c', t, m.uid, false);
      ctx.save(); ctx.translate(18, 2); ctx.rotate(-0.4);
      ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-4, -16); ctx.quadraticCurveTo(0, -22, 4, -16); ctx.lineTo(2, 8); ctx.closePath(); fillStroke(ctx, '#8a5a30', OUTLINE, 1.5); ctx.restore();
    },
    goblin_archer(ctx, m, t) {
      goblinBase(ctx, '#7cbf57', t, m.uid, true, DH.ELEMENTS.green);
      ctx.save(); ctx.translate(-18, 0); ctx.beginPath(); ctx.arc(4, 0, 17, Math.PI - 1.1, Math.PI + 1.1); ctx.lineWidth = 3.5; ctx.strokeStyle = OUTLINE; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a5a30'; ctx.stroke(); ctx.restore();
    },
    shaman(ctx, m, t) {
      const el = DH.ELEMENTS.blue;
      rr(ctx, -15, -6, 30, 28, 8); fillStroke(ctx, el.dark, OUTLINE, 2);
      rr(ctx, -15, 12, 30, 10, 4); ctx.fillStyle = shade(el.dark, -0.3); ctx.fill();
      for (const s of [-1, 1]) { circ(ctx, s * 15, 4, 5); fillStroke(ctx, '#6fb24c', OUTLINE, 1.5); }
      const hy = -15;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, hy - 2); ctx.lineTo(s * 23, hy - 9); ctx.lineTo(s * 12, hy + 6); ctx.closePath(); fillStroke(ctx, '#6fb24c', OUTLINE, 2); }
      circ(ctx, 0, hy, 14); fillStroke(ctx, '#6fb24c', OUTLINE, 2);
      eyes(ctx, 0, hy, 6, 3.5, '#9fd8ff', '#1b1b1b');
      ctx.beginPath(); ctx.moveTo(-5, hy + 7); ctx.quadraticCurveTo(0, hy + 10, 5, hy + 7); ctx.lineWidth = 1.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
      // 羽毛頭飾
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5, hy - 10); ctx.lineTo(i * 6, hy - 26 - Math.abs(i) * -3); ctx.lineWidth = 4; ctx.strokeStyle = ['#e2483c', '#f6c64a', '#408cec', '#f6c64a', '#e2483c'][i + 2]; ctx.lineCap = 'round'; ctx.stroke(); }
      // 骷髅法杖
      ctx.save(); ctx.translate(19, 2); rr(ctx, -2, -26, 4, 36, 2); fillStroke(ctx, '#8a5a30', OUTLINE, 1.5);
      circ(ctx, 0, -29, 6); fillStroke(ctx, '#f2eee4', OUTLINE, 1.5); eyes(ctx, 0, -30, 2.5, 1.6, '#222', '#222');
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 5); circ(ctx, 0, -29, 10); ctx.fillStyle = el.light; ctx.fill(); ctx.restore();
    },
    skeleton(ctx, m, t) {
      const bone = '#eee9dc', boneD = '#b8b2a2';
      for (const s of [-1, 1]) { rr(ctx, s * 6 - 3, 8, 6, 14, 3); fillStroke(ctx, bone, OUTLINE, 1.5); }
      rr(ctx, -12, -6, 24, 18, 6); fillStroke(ctx, boneD, OUTLINE, 2);
      for (let i = 0; i < 3; i++) { rr(ctx, -10, -3 + i * 5, 20, 2.5, 1); ctx.fillStyle = bone; ctx.fill(); }
      for (const s of [-1, 1]) { rr(ctx, s * 15 - 3, -4, 6, 16, 3); fillStroke(ctx, bone, OUTLINE, 1.5); }
      const hy = -16;
      circ(ctx, 0, hy, 14); fillStroke(ctx, bone, OUTLINE, 2);
      rr(ctx, -9, hy + 6, 18, 8, 3); fillStroke(ctx, bone, OUTLINE, 1.5);
      for (const s of [-1, 1]) { circ(ctx, s * 6, hy - 1, 4.5); ctx.fillStyle = '#1a1420'; ctx.fill(); circ(ctx, s * 6, hy - 1, 1.8); ctx.fillStyle = '#c84cff'; ctx.fill(); }
      for (let i = -2; i <= 2; i++) { rr(ctx, i * 3.5 - 1, hy + 8, 2, 4, 0.5); ctx.fillStyle = OUTLINE; ctx.fill(); }
      ctx.save(); ctx.translate(20, 4); ctx.rotate(-0.3); rr(ctx, -2, -26, 4, 26, 2); fillStroke(ctx, '#b7bfcc', OUTLINE, 1.5); rr(ctx, -5, -1, 10, 3, 1); fillStroke(ctx, '#6a5a3a', OUTLINE, 1.5); ctx.restore();
    },
    bat(ctx, m, t) {
      const flap = Math.sin(t * 10 + m.uid) * 0.35;
      const body = '#6a3f9a', bodyD = '#452868';
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 8, -6); ctx.rotate(s * flap);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 30, -16); ctx.lineTo(s * 28, -4); ctx.lineTo(s * 22, -6); ctx.lineTo(s * 20, 6); ctx.lineTo(s * 12, 2); ctx.lineTo(s * 10, 12); ctx.closePath();
        fillStroke(ctx, bodyD, OUTLINE, 2); ctx.restore();
      }
      ell(ctx, 0, -2, 12, 14); fillStroke(ctx, body, OUTLINE, 2);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 4, -12); ctx.lineTo(s * 9, -24); ctx.lineTo(s * 11, -10); ctx.closePath(); fillStroke(ctx, body, OUTLINE, 2); }
      eyes(ctx, 0, -5, 5, 3, '#ff5a5a', '#2a0000');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 3, 3); ctx.lineTo(s * 4, 8); ctx.lineTo(s * 1, 3.5); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
    },
    hound(ctx, m, t) {
      const fur = '#8c4a30', furD = '#5e2f1c';
      for (const [lx, ly] of [[-14, 12], [-6, 14], [6, 14], [14, 12]]) { rr(ctx, lx - 3.5, ly - 4, 7, 12, 3); fillStroke(ctx, furD, OUTLINE, 1.5); }
      ctx.beginPath(); ctx.moveTo(14, 4); ctx.quadraticCurveTo(26, -8, 22, -16); ctx.lineWidth = 4; ctx.strokeStyle = OUTLINE; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = fur; ctx.stroke();
      ell(ctx, 0, 4, 20, 11); fillStroke(ctx, fur, OUTLINE, 2);
      // 頭（正面）
      const hy = -8;
      ell(ctx, -6, hy, 14, 12); fillStroke(ctx, fur, OUTLINE, 2);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-6 + s * 7, hy - 8); ctx.lineTo(-6 + s * 13, hy - 20); ctx.lineTo(-6 + s * 13, hy - 6); ctx.closePath(); fillStroke(ctx, fur, OUTLINE, 2); }
      ell(ctx, -6, hy + 6, 7, 5); fillStroke(ctx, '#c88a6a', OUTLINE, 1.5);
      circ(ctx, -6, hy + 4, 2.5); ctx.fillStyle = OUTLINE; ctx.fill();
      eyes(ctx, -6, hy - 2, 5.5, 2.8, '#ffd24a', '#1b1b1b');
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-6 + s * 4, hy + 9); ctx.lineTo(-6 + s * 5, hy + 13); ctx.lineTo(-6 + s * 2, hy + 9.5); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
    },
    spider(ctx, m, t) {
      const body = '#3a3a2c', bodyD = '#5d9a2a';
      const wig = Math.sin(t * 6 + m.uid) * 2;
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const a = -0.9 + i * 0.6, len = 22;
        ctx.beginPath(); ctx.moveTo(s * 8, 0); ctx.lineTo(s * (8 + Math.cos(a) * 14), -2 + Math.sin(a) * 10 + wig * (i % 2 ? 1 : -1)); ctx.lineTo(s * (8 + Math.cos(a) * len), 12 + Math.sin(a) * 6);
        ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 1.5; ctx.strokeStyle = body; ctx.stroke();
      }
      ell(ctx, 0, 4, 15, 12); fillStroke(ctx, body, OUTLINE, 2);
      ell(ctx, 0, 2, 8, 5); ctx.fillStyle = bodyD; ctx.fill();
      circ(ctx, 0, -9, 9); fillStroke(ctx, body, OUTLINE, 2);
      for (const [ex, ey, er] of [[-4, -11, 2.4], [4, -11, 2.4], [-7, -7, 1.6], [7, -7, 1.6], [-1.5, -14, 1.3], [1.5, -14, 1.3]]) { circ(ctx, ex, ey, er); ctx.fillStyle = '#ff5a3a'; ctx.fill(); }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 3, -3); ctx.lineTo(s * 5, 3); ctx.lineTo(s * 1, -2); ctx.closePath(); ctx.fillStyle = '#e8e8e8'; ctx.fill(); }
    },
    orc(ctx, m, t) {
      ctx.scale(1.15, 1.15);
      const skin = '#5f8f4a', skinD = '#3f6330';
      for (const s of [-1, 1]) { rr(ctx, s * 8 - 6, 8, 12, 13, 4); fillStroke(ctx, '#4a3a30', OUTLINE, 1.5); }
      rr(ctx, -18, -8, 36, 24, 9); fillStroke(ctx, skin, OUTLINE, 2);
      rr(ctx, -18, 0, 36, 10, 4); fillStroke(ctx, '#6d6a74', OUTLINE, 1.5);
      for (const s of [-1, 1]) { circ(ctx, s * 20, 2, 7); fillStroke(ctx, skin, OUTLINE, 1.5); rr(ctx, s * 20 - 8, -10, 16, 8, 3); fillStroke(ctx, '#8a8794', OUTLINE, 1.5); }
      const hy = -20;
      circ(ctx, 0, hy, 14); fillStroke(ctx, skin, OUTLINE, 2);
      rr(ctx, -9, hy + 5, 18, 8, 3); fillStroke(ctx, skinD, OUTLINE, 1.5);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, hy + 10); ctx.lineTo(s * 8, hy + 2); ctx.lineTo(s * 3, hy + 8); ctx.closePath(); fillStroke(ctx, '#f4f0e0', OUTLINE, 1); }
      eyes(ctx, 0, hy - 1, 6, 3, '#ffcf3a', '#1b1b1b');
      ctx.beginPath(); ctx.moveTo(-10, hy - 7); ctx.lineTo(-3, hy - 4); ctx.moveTo(10, hy - 7); ctx.lineTo(3, hy - 4); ctx.lineWidth = 2.5; ctx.strokeStyle = OUTLINE; ctx.stroke();
      ctx.save(); ctx.translate(24, 2); ctx.rotate(-0.2); rr(ctx, -2.5, -30, 5, 38, 2); fillStroke(ctx, '#6a4424', OUTLINE, 1.5);
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(18, -34, 16, -14); ctx.quadraticCurveTo(8, -18, 0, -16); ctx.closePath(); fillStroke(ctx, '#c7ced9', OUTLINE, 1.5); ctx.restore();
    },
    golem(ctx, m, t) {
      ctx.scale(1.2, 1.2);
      const rock = '#7d8290', rockD = '#555a66', glow = `rgba(246,214,110,${0.6 + 0.4 * Math.sin(t * 3)})`;
      for (const s of [-1, 1]) { rr(ctx, s * 9 - 7, 10, 14, 12, 3); fillStroke(ctx, rockD, OUTLINE, 2); }
      rr(ctx, -19, -12, 38, 26, 6); fillStroke(ctx, rock, OUTLINE, 2.5);
      for (const s of [-1, 1]) { rr(ctx, s * 24 - 7, -10, 14, 24, 5); fillStroke(ctx, rock, OUTLINE, 2); }
      rr(ctx, -11, -24, 22, 15, 4); fillStroke(ctx, rock, OUTLINE, 2.5);
      for (const s of [-1, 1]) { rr(ctx, s * 5 - 3.5, -19, 7, 4, 1); ctx.fillStyle = glow; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(0, 2); ctx.lineTo(-3, 8); ctx.moveTo(8, -8); ctx.lineTo(5, 0); ctx.lineWidth = 2; ctx.strokeStyle = glow; ctx.stroke();
      for (const [px, py] of [[-12, -6], [10, 6], [-6, 8]]) { circ(ctx, px, py, 2.5); ctx.fillStyle = rockD; ctx.fill(); }
    },
    whelp(ctx, m, t) {
      const body = '#d8463a', bodyD = '#8f2a22', belly = '#f3b36a';
      const flap = Math.sin(t * 5 + m.uid) * 0.25;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 8, -6); ctx.rotate(s * flap);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 26, -18); ctx.lineTo(s * 24, -2); ctx.lineTo(s * 14, 4); ctx.closePath(); fillStroke(ctx, bodyD, OUTLINE, 2); ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(10, 10); ctx.quadraticCurveTo(28, 14, 26, 0); ctx.lineWidth = 5; ctx.strokeStyle = OUTLINE; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = body; ctx.stroke();
      ell(ctx, 0, 4, 15, 13); fillStroke(ctx, body, OUTLINE, 2);
      ell(ctx, 0, 7, 8, 8); ctx.fillStyle = belly; ctx.fill();
      for (const s of [-1, 1]) { rr(ctx, s * 9 - 4, 12, 8, 9, 3); fillStroke(ctx, bodyD, OUTLINE, 1.5); }
      const hy = -12;
      ell(ctx, 0, hy, 13, 11); fillStroke(ctx, body, OUTLINE, 2);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, hy - 8); ctx.lineTo(s * 10, hy - 20); ctx.lineTo(s * 12, hy - 6); ctx.closePath(); fillStroke(ctx, '#f3d27a', OUTLINE, 1.5); }
      ell(ctx, 0, hy + 5, 7, 4.5); fillStroke(ctx, belly, OUTLINE, 1.5);
      circ(ctx, -2.5, hy + 4, 1.2); ctx.fillStyle = OUTLINE; ctx.fill(); circ(ctx, 2.5, hy + 4, 1.2); ctx.fill();
      eyes(ctx, 0, hy - 2, 5.5, 3, '#ffe36a', '#1b1b1b');
    },
    dragon(ctx, m, t) {
      ctx.scale(1.6, 1.6);
      const body = '#c93a2e', bodyD = '#7d1f18', belly = '#f0b060';
      const flap = Math.sin(t * 3 + m.uid) * 0.18;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 10, -8); ctx.rotate(s * flap);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 36, -24); ctx.lineTo(s * 34, -6); ctx.lineTo(s * 26, -8); ctx.lineTo(s * 22, 6); ctx.lineTo(s * 12, 4); ctx.closePath(); fillStroke(ctx, bodyD, OUTLINE, 1.6);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 36, -24); ctx.moveTo(0, 0); ctx.lineTo(s * 26, -8); ctx.lineWidth = 1.2; ctx.strokeStyle = OUTLINE; ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(12, 12); ctx.quadraticCurveTo(34, 18, 32, 2); ctx.lineWidth = 5; ctx.strokeStyle = OUTLINE; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 3.4; ctx.strokeStyle = body; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(36, -6); ctx.lineTo(34, 4); ctx.closePath(); fillStroke(ctx, '#f3d27a', OUTLINE, 1.2);
      ell(ctx, 0, 6, 18, 15); fillStroke(ctx, body, OUTLINE, 1.8);
      ell(ctx, 0, 9, 10, 10); ctx.fillStyle = belly; ctx.fill();
      for (let i = 0; i < 3; i++) { rr(ctx, -7, 2 + i * 5, 14, 2, 1); ctx.fillStyle = shade(belly, -0.15); ctx.fill(); }
      for (const s of [-1, 1]) { rr(ctx, s * 11 - 5, 14, 10, 10, 3); fillStroke(ctx, bodyD, OUTLINE, 1.4); }
      const hy = -14;
      ell(ctx, 0, hy, 14, 12); fillStroke(ctx, body, OUTLINE, 1.8);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 7, hy - 8); ctx.quadraticCurveTo(s * 16, hy - 20, s * 10, hy - 26); ctx.quadraticCurveTo(s * 14, hy - 14, s * 12, hy - 6); ctx.closePath(); fillStroke(ctx, '#f3d27a', OUTLINE, 1.4); }
      ell(ctx, 0, hy + 6, 8, 5); fillStroke(ctx, belly, OUTLINE, 1.3);
      for (const s of [-1, 1]) { circ(ctx, s * 3, hy + 5, 1.3); ctx.fillStyle = OUTLINE; ctx.fill(); }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, hy + 10); ctx.lineTo(s * 6, hy + 14); ctx.lineTo(s * 3, hy + 10.5); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); }
      eyes(ctx, 0, hy - 2, 6, 3.2, '#ffe36a', '#5a1000');
      // 火光
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6); circ(ctx, 0, hy + 6, 10); ctx.fillStyle = '#ff9a3a'; ctx.fill(); ctx.globalAlpha = 1;
    },
  };

  DH.drawMonster = function (ctx, m, x, y, t) {
    const bob = Math.sin(t * 2 + m.uid * 0.7) * 1.2;
    ctx.save();
    ctx.translate(x, y + 2 - (m.dropY || 0));
    shadow(ctx, 0, 22, m.boss ? 64 : 42);
    ctx.scale(m.scale || 1, m.scale || 1);
    ctx.translate(0, bob);
    (SHAPES[m.shape] || SHAPES.goblin)(ctx, m, t);
    ctx.restore();
  };

  // ───────────────────────── 單位附件 UI ─────────────────────────
  DH.drawPatternIcon = function (ctx, pattern, x, y, size) {
    const col = PAL[pattern.kind];
    rr(ctx, x, y, size, size, 4); ctx.fillStyle = 'rgba(20,16,28,0.85)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = col; ctx.stroke();
    const cell = size / 3, r = cell * 0.28;
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      const cx = x + size / 2 + dc * cell, cy = y + size / 2 + dr * cell;
      const on = pattern.dirs.some(d => d[0] === dc && d[1] === dr);
      if (dc === 0 && dr === 0) { circ(ctx, cx, cy, r); ctx.fillStyle = '#fff'; ctx.fill(); }
      else if (on) {
        if (pattern.kind === 'melee') { circ(ctx, cx, cy, r); ctx.fillStyle = col; ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(x + size / 2 + dc * cell * 0.45, y + size / 2 + dr * cell * 0.45); ctx.lineTo(cx + dc * cell * 0.35, cy + dr * cell * 0.35); ctx.lineWidth = pattern.kind === 'magic' ? 3 : 2; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
      } else { circ(ctx, cx, cy, r * 0.5); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill(); }
    }
  };

  DH.drawHpBar = function (ctx, x, y, w, ratio, color, text) {
    rr(ctx, x, y, w, 8, 4); ctx.fillStyle = PAL.hpBg; ctx.fill();
    if (ratio > 0) { rr(ctx, x + 1, y + 1, Math.max(3, (w - 2) * ratio), 6, 3); ctx.fillStyle = color; ctx.fill(); rr(ctx, x + 1, y + 1, Math.max(3, (w - 2) * ratio), 2.5, 1.5); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); }
    rr(ctx, x, y, w, 8, 4); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    if (text) { ctx.font = `bold 9px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(text, x + w / 2, y + 4.5); }
  };

  DH.drawBadge = function (ctx, x, y, r, text, fill, textColor, fontSize) {
    circ(ctx, x, y, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.stroke();
    ctx.font = `bold ${fontSize || 12}px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = textColor || '#2a2030'; ctx.fillText(text, x, y + 0.5);
  };

  DH.drawGem = function (ctx, x, y, r, element) {
    const el = DH.ELEMENTS[element];
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
    fillStroke(ctx, el.color, 'rgba(0,0,0,0.7)', 1.5);
    ctx.beginPath(); ctx.moveTo(x, y - r + 2); ctx.lineTo(x + r - 2, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
  };

  DH.shapes = { rr, ell, circ, fillStroke, shade };
})(window.DH);
