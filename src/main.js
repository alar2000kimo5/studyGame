// 主程式：畫布縮放、輸入、場景切換、主迴圈
(function (DH) {
  const C = DH.CONFIG;
  DH.FONT = '"Noto Sans TC","Microsoft JhengHei","PingFang TC","Heiti TC","WenQuanYi Zen Hei",sans-serif';

  class Game {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.scale = 1; this.offX = 0; this.offY = 0;
      this.progress = this.loadProgress();
      this.unlockAll = /unlock/.test(location.hash);
      this.scene = null;
      this.resize(); window.addEventListener('resize', () => this.resize());
      this.bindInput();
      this.showCampaign();
      this.last = performance.now();
      requestAnimationFrame(t => this.frame(t));
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vw = window.innerWidth, vh = window.innerHeight;
      this.scale = Math.min(vw / C.W, vh / C.H);
      const cw = Math.floor(C.W * this.scale), ch = Math.floor(C.H * this.scale);
      this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
      this.canvas.width = Math.floor(cw * dpr); this.canvas.height = Math.floor(ch * dpr);
      this.dpr = dpr;
    }
    toLogical(e) {
      const r = this.canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / this.scale, (e.clientY - r.top) / this.scale];
    }
    bindInput() {
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = this.toLogical(e); this.scene.pointerDown(x, y); });
      cv.addEventListener('pointermove', e => { const [x, y] = this.toLogical(e); this.scene.pointerMove(x, y); });
      const up = e => { const [x, y] = this.toLogical(e); this.scene.pointerUp(x, y); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('contextmenu', e => e.preventDefault());
    }
    showCampaign() { if (this.scene && this.scene.dead !== undefined) this.scene.dead = true; this.scene = new DH.Campaign(this); }
    startDungeon(d) { if (this.scene && this.scene.dead !== undefined) this.scene.dead = true; this.scene = new DH.Battle(this, d); }
    nextDungeon(id) { return DH.DUNGEONS.find(d => d.id === id + 1) || null; }
    loadProgress() { try { const p = JSON.parse(localStorage.getItem('dh_progress') || '{}'); return { stars: p.stars || {} }; } catch (e) { return { stars: {} }; } }
    saveStars(id, n) { this.progress.stars[id] = Math.max(this.progress.stars[id] || 0, n); try { localStorage.setItem('dh_progress', JSON.stringify(this.progress)); } catch (e) {} }
    frame(t) {
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
      this.scene.update(dt);
      const ctx = this.ctx;
      ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, 0, 0);
      this.scene.draw(ctx);
      requestAnimationFrame(tt => this.frame(tt));
    }
  }
  DH.Game = Game;

  function boot() {
    const canvas = document.getElementById('gameCanvas');
    const start = () => { if (!DH.game) { DH.game = new Game(canvas); window.game = DH.game; } };
    if (document.fonts && document.fonts.load) {
      Promise.race([document.fonts.load(`bold 16px ${DH.FONT}`), new Promise(r => setTimeout(r, 1200))]).then(start, start);
    } else start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.DH);
