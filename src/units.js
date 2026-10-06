// 單位：英雄與怪物
(function (DH) {
  const G = DH.Grid;
  let nextUid = 1;

  class Unit {
    constructor(def, pos, side) {
      this.uid = nextUid++;
      this.def = def; this.id = def.id; this.name = def.name;
      this.side = side;                     // 'hero' | 'monster'
      this.element = def.element;
      this.pattern = DH.PATTERNS[def.pattern];
      this.maxHp = def.hp; this.hp = def.hp;
      this.atk = def.atk; this.armor = def.armor || 0; this.defense = def.def || 0;
      this.talents = (def.talents || []).slice();
      this.col = pos[0]; this.row = pos[1];
      this.alive = true;
      this.status = {};                     // poison:{turns,dmg}, burn:{turns,dmg}
      this.shieldHp = 0; this.buffAtk = 0; this.delayedHeal = 0;
      // 畫面
      const c = G.cellCenter(this.col, this.row);
      this.x = c.x; this.y = c.y;
      this.offX = 0; this.offY = 0;
      this.scale = 1; this.alpha = 1;
      this.flash = 0; this.dropY = 0;
      this.lifted = false;
      this.anim = null; this.face = 1;           // 攻擊動作與面向
    }
    playAnim(kind, dur, dx) { this.anim = { kind, t: 0, dur: dur || 0.5 }; if (dx) this.face = dx < 0 ? -1 : 1; }
    get pos() { return [this.col, this.row]; }
    has(t) { return this.talents.includes(t); }
    hasSig() { return false; }
    sigParam() { return 0; }
    sigPct() { return 0; }
    get flying() { return this.has('flying'); }
    setCell(c, r) { this.col = c; this.row = r; }
    snap() { const c = G.cellCenter(this.col, this.row); this.x = c.x; this.y = c.y; }
    takeDamage(n) {
      let absorbed = 0;
      if (this.shieldHp > 0) { absorbed = Math.min(this.shieldHp, n); this.shieldHp -= absorbed; n -= absorbed; }
      this.hp = Math.max(0, this.hp - n);
      this.flash = 0.25;
      if (this.hp === 0) this.alive = false;
      return { dealt: n, absorbed };
    }
    heal(n) { const before = this.hp; this.hp = Math.min(this.maxHp, this.hp + n); return this.hp - before; }
    get hpRatio() { return this.hp / this.maxHp; }
    update(dt) {
      if (!this.lifted) {
        const c = G.cellCenter(this.col, this.row);
        const k = Math.min(1, dt * 14);
        this.x += (c.x - this.x) * k; this.y += (c.y - this.y) * k;
        if (Math.abs(c.x - this.x) < 0.5) this.x = c.x;
        if (Math.abs(c.y - this.y) < 0.5) this.y = c.y;
      }
      this.flash = Math.max(0, this.flash - dt);
      if (this.anim) { this.anim.t += dt; if (this.anim.t >= this.anim.dur) this.anim = null; }
      if (this.dropY > 0) this.dropY = Math.max(0, this.dropY - dt * 900);
      if (!this.alive && this.alpha > 0) this.alpha = Math.max(0, this.alpha - dt * 2.5);
    }
  }

  class Hero extends Unit {
    // defOrId：名冊 id（預覽用，取基礎值）或由 Meta.buildBattleDef 產生的戰鬥定義
    constructor(defOrId, pos) {
      const def = typeof defOrId === 'string' ? DH.HEROES[defOrId] : defOrId;
      super(def, pos, 'hero');
      this.cls = def.cls; this.look = def.look; this.order = 0;
      this.support = def.support ? DH.PATTERNS[def.support] : null;
      this.level = def.level || 1; this.stars = def.stars; this.weaponRarity = def.weaponRarity || null;
      this.instance = def.instance || null;
      this.sig = def.sig || null;
      this.rage = 0; this.wasHit = false; this.lifeSaved = false; this.swapBuff = 0; this.iceBuff = 0; this.onFire = false;
    }
    hasSig(key) { return !!(this.sig && this.sig.trait && this.sig.trait.key === key); }
    sigParam(i) { return this.sig && this.sig.trait ? this.sig.trait.params[i] : 0; }
    sigPct(i) { return this.sig ? this.sigParam(i) * this.sig.scale / 100 : 0; }
    get sigSpecies() { return this.sig ? this.sig.species : null; }
  }
  class Monster extends Unit {
    constructor(id, pos, scale) {
      super(DH.MONSTERS[id], pos, 'monster');
      this.speed = this.def.speed; this.ai = this.def.ai; this.shape = this.def.shape; this.boss = !!this.def.boss;
      if (scale) { this.maxHp = Math.round(this.maxHp * scale.hp * (this.boss ? 1.25 : 1)); this.hp = this.maxHp; this.atk = Math.round(this.atk * scale.atk); this.defense = Math.round((scale.hp - 1) * 4); }
    }
  }
  DH.Unit = Unit; DH.Hero = Hero; DH.Monster = Monster;
})(window.DH);
