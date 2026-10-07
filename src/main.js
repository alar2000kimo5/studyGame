// 主程式：畫布縮放、輸入、場景切換、主迴圈、玩家資料
(function (DH) {
  const C = DH.CONFIG;
  DH.FONT = '"Noto Sans TC","Microsoft JhengHei","PingFang TC","Heiti TC","WenQuanYi Zen Hei",sans-serif';

  class Game {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.scale = 1; this.dpr = 1;
      this.meta = new DH.Meta();
      this.unlockAll = /unlock/.test(location.hash);
      this.scene = null;
      this.resize(); window.addEventListener('resize', () => this.resize());
      this.bindInput();
      this.showCampaign();
      this.last = performance.now();
      requestAnimationFrame(t => this.frame(t));
    }
    get progress() { return { stars: this.meta.d.stars }; }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vw = window.innerWidth, vh = window.innerHeight;
      this.scale = Math.min(vw / C.W, vh / C.H);
      const cw = Math.floor(C.W * this.scale), ch = Math.floor(C.H * this.scale);
      this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
      this.canvas.width = Math.floor(cw * dpr); this.canvas.height = Math.floor(ch * dpr);
      this.dpr = dpr;
    }
    toLogical(e) { const r = this.canvas.getBoundingClientRect(); return [(e.clientX - r.left) / this.scale, (e.clientY - r.top) / this.scale]; }
    bindInput() {
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = this.toLogical(e); this.scene.pointerDown(x, y); });
      cv.addEventListener('pointermove', e => { const [x, y] = this.toLogical(e); this.scene.pointerMove(x, y); });
      const up = e => { const [x, y] = this.toLogical(e); this.scene.pointerUp(x, y); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('contextmenu', e => e.preventDefault());
    }
    _switch(scene) { if (this.scene && this.scene.dead !== undefined) this.scene.dead = true; this.scene = scene; }
    show(key) { ({ campaign: () => this.showCampaign(), barracks: () => this.showBarracks(), summon: () => this.showSummon(), shop: () => this.showShop(), stories: () => this.showStories() })[key](); }
    showStories(heroId, outro) { this._switch(new DH.Stories(this, heroId, outro)); }
    showCampaign(opts) { this._switch(new DH.Campaign(this, opts)); }
    showBarracks() { this._switch(new DH.Barracks(this)); }
    showHeroCard(uid, back) { this._switch(new DH.HeroCard(this, uid, back || (() => this.showBarracks()))); }
    showTeam(dungeon) { this._switch(new DH.TeamSelect(this, dungeon)); }
    showSummon() { this._switch(new DH.Summon(this)); }
    showShop() { this._switch(new DH.Shop(this)); }
    startDungeon(d) {
      const defs = this.meta.teamHeroes().map(h => this.meta.buildBattleDef(h));
      this._switch(new DH.Battle(this, d, defs));
    }
    onVictory(dungeon, stars) {
      if (dungeon.story) {
        const story = DH.storyOf(dungeon.story.heroId), ch = story.chapters[dungeon.story.idx];
        const partnerPresent = !!story.partner && this.scene.heroes.some(h => h.id === story.partner);
        const r = this.meta.completeStoryChapter(story, dungeon.story.idx, partnerPresent);
        return Object.assign(r, { xp: {}, gear: r.sig, storyOutro: ch.outro, storyBonus: r.bonus });
      }
      const r = this.meta.rewardFor(dungeon, stars); this.meta.applyReward(dungeon, stars, r); return r;
    }
    startStoryBattle(story, idx) {
      const team = this.meta.storyTeam(story.heroId); if (!team) return false;
      const d = DH.genStoryLevel(story, idx);
      const defs = this.meta.withTeam(team, () => team.map(u => this.meta.hero(u)).filter(Boolean).map(h => this.meta.buildBattleDef(h)));
      this._switch(new DH.Battle(this, d, defs));
      return true;
    }
    nextDungeon(id) { return DH.DUNGEONS.find(d => d.id === id + 1) || null; }
    frame(t) {
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
      try {
        this.scene.update(dt);
        const ctx = this.ctx;
        ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, 0, 0);
        this.scene.draw(ctx);
      } catch (e) { console.error(e); }
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
