// 特效：飄字、投射物、光束、斬擊、爆裂
(function (DH) {
  const PAL = DH.PALETTE;
  class FX {
    constructor() { this.items = []; }
    text(x, y, str, color, opts) {
      opts = opts || {};
      this.items.push({ kind: 'text', x, y, str, color, t: 0, dur: opts.dur || 1.0, size: opts.size || 20, vy: opts.vy || -46, stroke: opts.stroke !== false });
    }
    projectile(from, to, color, dur) { this.items.push({ kind: 'proj', from, to, color, t: 0, dur: dur || 0.22 }); }
    beam(from, to, color, dur) { this.items.push({ kind: 'beam', from, to, color, t: 0, dur: dur || 0.4 }); }
    slash(x, y, color) { this.items.push({ kind: 'slash', x, y, color, t: 0, dur: 0.28, rot: Math.random() * Math.PI }); }
    burst(x, y, color, n) {
      const parts = [];
      for (let i = 0; i < (n || 10); i++) { const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 90; parts.push({ a, s, r: 2 + Math.random() * 2.5 }); }
      this.items.push({ kind: 'burst', x, y, color, parts, t: 0, dur: 0.5 });
    }
    ring(x, y, color) { this.items.push({ kind: 'ring', x, y, color, t: 0, dur: 0.5 }); }
    lightning(from, to, color) { const pts = []; const n = 6; for (let i = 0; i <= n; i++) { const q = i / n; pts.push({ x: from.x + (to.x - from.x) * q + (i && i < n ? (Math.random() - 0.5) * 28 : 0), y: from.y + (to.y - from.y) * q + (i && i < n ? (Math.random() - 0.5) * 28 : 0) }); } this.items.push({ kind: 'lightning', pts, color, t: 0, dur: 0.35 }); }
    pillar(x, y, color, dur) { this.items.push({ kind: 'pillar', x, y, color, t: 0, dur: dur || 0.6 }); }
    shockwave(x, y, color, horizontal) { this.items.push({ kind: 'shock', x, y, color, horizontal, t: 0, dur: 0.5 }); }
    clones(x, y, color) { this.items.push({ kind: 'clones', x, y, color, t: 0, dur: 0.5 }); }
    vines(x, y, color) { this.items.push({ kind: 'vines', x, y, color, t: 0, dur: 0.7, seed: Math.random() * 10 }); }
    souls(from, to, color) { for (let i = 0; i < 5; i++) this.items.push({ kind: 'soul', from: { x: from.x + (Math.random() - 0.5) * 30, y: from.y + (Math.random() - 0.5) * 30 }, to, color, t: -i * 0.06, dur: 0.6 }); }
    storm(x, y, colors) { this.items.push({ kind: 'storm', x, y, colors, t: 0, dur: 0.7 }); }
    dome(x, y, color) { this.items.push({ kind: 'dome', x, y, color, t: 0, dur: 0.7 }); }
    shake(amount) { this.shakeAmt = Math.max(this.shakeAmt || 0, amount); }
    update(dt) { for (const it of this.items) it.t += dt; this.items = this.items.filter(it => it.t < it.dur); if (this.shakeAmt > 0) this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30); }
    get shakeOffset() { const a = this.shakeAmt || 0; return a > 0 ? [(Math.random() - 0.5) * a, (Math.random() - 0.5) * a] : [0, 0]; }
    draw(ctx) {
      for (const it of this.items) {
        if (it.t < 0) continue;
        const p = it.t / it.dur;
        ctx.save();
        switch (it.kind) {
          case 'text': {
            const ease = 1 - Math.pow(1 - p, 2);
            const y = it.y + it.vy * ease, sc = p < 0.15 ? 0.6 + (p / 0.15) * 0.5 : 1.1 - (p - 0.15) * 0.12;
            ctx.globalAlpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
            ctx.translate(it.x, y); ctx.scale(sc, sc);
            ctx.font = `bold ${it.size}px ${DH.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (it.stroke) { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,16,0.9)'; ctx.lineJoin = 'round'; ctx.strokeText(it.str, 0, 0); }
            ctx.fillStyle = it.color; ctx.fillText(it.str, 0, 0);
            break;
          }
          case 'proj': {
            const x = it.from.x + (it.to.x - it.from.x) * p, y = it.from.y + (it.to.y - it.from.y) * p;
            const ang = Math.atan2(it.to.y - it.from.y, it.to.x - it.from.x);
            ctx.translate(x, y); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.lineWidth = 3; ctx.strokeStyle = '#3a2a1a'; ctx.lineCap = 'round'; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(2, -3.5); ctx.lineTo(2, 3.5); ctx.closePath(); ctx.fillStyle = it.color; ctx.fill();
            ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-10, -3); ctx.lineTo(-7, 0); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fillStyle = '#eee'; ctx.fill();
            break;
          }
          case 'beam': {
            ctx.globalAlpha = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
            ctx.beginPath(); ctx.moveTo(it.from.x, it.from.y); ctx.lineTo(it.to.x, it.to.y);
            ctx.lineWidth = 10; ctx.strokeStyle = it.color; ctx.lineCap = 'round'; ctx.globalAlpha *= 0.45; ctx.stroke();
            ctx.globalAlpha /= 0.45; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
            for (let i = 0; i < 5; i++) { const q = (i + 1) / 6, sx = it.from.x + (it.to.x - it.from.x) * q, sy = it.from.y + (it.to.y - it.from.y) * q + Math.sin(i * 2.3 + it.t * 20) * 6; ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
            break;
          }
          case 'slash': {
            ctx.translate(it.x, it.y); ctx.rotate(it.rot); ctx.globalAlpha = 1 - p;
            ctx.beginPath(); ctx.arc(0, 0, 18 + p * 14, -0.9, 0.9); ctx.lineWidth = 6 * (1 - p) + 1; ctx.strokeStyle = it.color; ctx.lineCap = 'round'; ctx.stroke();
            ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            break;
          }
          case 'burst': {
            ctx.globalAlpha = 1 - p;
            for (const q of it.parts) { const d = q.s * p; ctx.beginPath(); ctx.arc(it.x + Math.cos(q.a) * d, it.y + Math.sin(q.a) * d, q.r * (1 - p * 0.6), 0, Math.PI * 2); ctx.fillStyle = it.color; ctx.fill(); }
            break;
          }
          case 'lightning': {
            ctx.globalAlpha = 1 - p; ctx.beginPath(); it.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
            ctx.lineWidth = 7; ctx.strokeStyle = it.color; ctx.globalAlpha = 0.4 * (1 - p); ctx.stroke(); ctx.globalAlpha = 1 - p; ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
            break;
          }
          case 'pillar': {
            const a = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8, w = 34 * (p < 0.2 ? p / 0.2 : 1);
            ctx.globalAlpha = a * 0.75; const g = ctx.createLinearGradient(it.x - w / 2, 0, it.x + w / 2, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, it.color); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.fillRect(it.x - w / 2, it.y - 260, w, 270);
            ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(it.x, it.y + 6, w * 0.9, 8, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
            break;
          }
          case 'shock': {
            ctx.globalAlpha = 1 - p; ctx.lineWidth = 4 * (1 - p) + 1; ctx.strokeStyle = it.color; ctx.beginPath();
            if (it.horizontal) { ctx.ellipse(it.x, it.y + 8, 40 + p * 260, 10 + p * 14, 0, 0, Math.PI * 2); } else { ctx.ellipse(it.x, it.y + 8, 30 + p * 90, 12 + p * 30, 0, 0, Math.PI * 2); }
            ctx.stroke();
            for (let i = 0; i < 6; i++) { const a2 = i * Math.PI / 3 + 0.3, len = 20 + p * 50; ctx.beginPath(); ctx.moveTo(it.x + Math.cos(a2) * 10, it.y + 8 + Math.sin(a2) * 4); ctx.lineTo(it.x + Math.cos(a2) * len, it.y + 8 + Math.sin(a2) * len * 0.35); ctx.lineWidth = 2; ctx.strokeStyle = '#2a2030'; ctx.stroke(); }
            break;
          }
          case 'clones': {
            ctx.globalAlpha = 0.6 * (1 - p);
            for (const s of [-1, 1]) { const dx = s * (26 + p * 30); ctx.beginPath(); ctx.ellipse(it.x + dx, it.y - 6, 14, 24, 0, 0, Math.PI * 2); ctx.fillStyle = it.color; ctx.fill(); ctx.beginPath(); ctx.moveTo(it.x + dx, it.y - 10); ctx.lineTo(it.x - s * 10, it.y - 2); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
            break;
          }
          case 'vines': {
            ctx.globalAlpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8; ctx.lineWidth = 3.5; ctx.strokeStyle = it.color; ctx.lineCap = 'round';
            for (let i = 0; i < 4; i++) { const a2 = it.seed + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(it.x + Math.cos(a2) * 30, it.y + 20); ctx.quadraticCurveTo(it.x + Math.cos(a2 + 1) * 24, it.y - 10 * Math.min(1, p * 3), it.x + Math.cos(a2 + 2) * 12, it.y - 24 * Math.min(1, p * 3)); ctx.stroke(); }
            break;
          }
          case 'soul': {
            const q = Math.min(1, Math.max(0, p)); const x = it.from.x + (it.to.x - it.from.x) * q + Math.sin(q * 9) * 8, y = it.from.y + (it.to.y - it.from.y) * q - Math.sin(q * Math.PI) * 30;
            ctx.globalAlpha = 0.9 * (1 - q * 0.5); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = it.color; ctx.fill(); ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
            break;
          }
          case 'storm': {
            ctx.globalAlpha = 1 - p; ctx.translate(it.x, it.y - 6);
            it.colors.forEach((c, i) => { ctx.rotate((i % 2 ? -1 : 1) * p * 6); ctx.beginPath(); ctx.arc(0, 0, 18 + i * 12 + p * 20, 0, Math.PI * 1.4); ctx.lineWidth = 5; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.stroke(); });
            break;
          }
          case 'dome': {
            ctx.globalAlpha = 0.7 * (p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7); ctx.beginPath(); ctx.arc(it.x, it.y + 8, 44, Math.PI, 0); ctx.lineTo(it.x + 44, it.y + 8); ctx.closePath();
            const g = ctx.createRadialGradient(it.x, it.y + 8, 10, it.x, it.y + 8, 44); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, it.color); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            break;
          }
          case 'ring': {
            ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.arc(it.x, it.y, 10 + p * 36, 0, Math.PI * 2); ctx.lineWidth = 4 * (1 - p) + 1; ctx.strokeStyle = it.color; ctx.stroke();
            break;
          }
        }
        ctx.restore();
      }
    }
  }
  DH.FX = FX;
})(window.DH);
