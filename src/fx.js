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
    update(dt) { for (const it of this.items) it.t += dt; this.items = this.items.filter(it => it.t < it.dur); }
    draw(ctx) {
      for (const it of this.items) {
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
