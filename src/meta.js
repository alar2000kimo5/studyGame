// 玩家資料與養成系統：金幣、寶石、彩色經驗、天賦代幣、英雄實例、裝備、隊伍、召喚、昇華、戰利品
(function (DH) {
  const SAVE_KEY = 'dh_save_v2';
  const COLORS = ['red', 'green', 'blue', 'light', 'dark'];
  const MAX_LEVEL = 75, MAX_LEVEL_ASC = 85;
  const ASCEND_GOLD = { 1: 1000, 2: 2500, 3: 5000, 4: 20000, 5: 50000 };
  const ASCEND_LEVEL = { 1: 30, 2: 40, 3: 50, 4: 60, 5: 70 };
  const SUMMON_COST = 300, SOUL_SUMMON_COST = 350;
  const SUMMON_RATES = { 1: 40, 2: 30, 3: 19, 4: 8, 5: 3 };
  let heroUid = 1;

  class Meta {
    constructor() { this.load(); }
    defaults() {
      return {
        gold: 500, gems: 1500, tokens: 3, soulSigils: 0,
        xp: { red: 200, green: 200, blue: 200, light: 200, dark: 200, rainbow: 300 },
        heroes: [], gear: [], team: [], stars: {}, firstClear: {},
      };
    }
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { d = null; }
      this.d = Object.assign(this.defaults(), d || {});
      if (!this.d.heroes.length) {
        for (const id of DH.STARTER_HEROES) this.addHero(id, true);
        this.d.team = this.d.heroes.map(h => h.uid);
      }
      // 測試用：一次性補 100 萬靈魂印記（要拿掉時刪除這兩行即可）
      if (!this.d.testGrant) { this.d.soulSigils += 1000000; this.d.testGrant = true; }
      heroUid = Math.max(heroUid, ...this.d.heroes.map(h => parseInt(String(h.uid).replace(/\D/g, ''), 10) + 1 || 1));
      this.save();
    }
    save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) {} }
    reset() { this.d = this.defaults(); for (const id of DH.STARTER_HEROES) this.addHero(id, true); this.d.team = this.d.heroes.map(h => h.uid); this.save(); }

    // ── 英雄實例 ─────────────────────────────────────
    addHero(id, silent) {
      const def = DH.HEROES[id];
      const h = { uid: 'h' + (heroUid++), id, level: 1, xp: 0, stars: def.stars, unlocked: 1, ascended: false, merges: 0, gear: {} };
      this.d.heroes.push(h);
      if (!silent) this.save();
      return h;
    }
    hero(uid) { return this.d.heroes.find(h => h.uid === uid) || null; }
    def(h) { return DH.HEROES[h.id]; }
    maxLevel(h) { return h.ascended ? MAX_LEVEL_ASC : MAX_LEVEL; }
    xpToNext(h) { return Math.round(12 * Math.pow(h.level, 1.25) * (1 + 0.25 * h.stars)); }
    talentList(h) { const d = this.def(h); const list = d.talents.slice(0, 1 + h.stars); if (h.ascended) list.push(d.ascendedTalent); return list; }
    unlockedTalents(h) { const list = this.talentList(h); const n = Math.min(h.unlocked, list.length) + (h.ascended ? 1 : 0); return list.slice(0, Math.min(n, list.length)); }
    nextTalent(h) { const list = this.def(h).talents.slice(0, 1 + h.stars); return h.unlocked < list.length ? list[h.unlocked] : null; }
    talentCost(h) { return h.stars; }
    gearCount(h) { return Object.keys(h.gear).length; }
    requiredGear(h) { return h.stars === 1 ? 3 : 6; }

    // 屬性：基礎 × 等級成長 × 合併 × 昇華 × 天賦 × 裝備
    stats(h, leaderBonus) {
      const d = this.def(h);
      const grow = 1 + 0.03 * (h.level - 1);
      const merge = 1 + 0.04 * h.merges;
      const asc = h.ascended ? 1.2 : 1;
      let hp = d.hp * grow * merge * asc, atk = d.atk * grow * merge * asc, def = d.def + (h.ascended ? 10 : 0) + h.level * 0.2;
      const tal = this.unlockedTalents(h);
      if (tal.includes('might')) atk *= 1.1;
      if (tal.includes('vigor')) hp *= 1.1;
      if (tal.includes('iron_skin')) def += 15;
      if (tal.includes('ascended_power')) { atk *= 1.15; hp *= 1.15; }
      for (const g of Object.values(h.gear)) {
        if (g.stat === 'atk') atk *= 1 + g.pct; else if (g.stat === 'hp') hp *= 1 + g.pct; else def += Math.round(g.pct * 100);
      }
      if (leaderBonus) { atk *= 1 + (leaderBonus.atk || 0); def += Math.round((leaderBonus.def || 0) * 100); }
      return { hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
    }
    power(h) { const s = this.stats(h); return Math.round(s.atk * 3 + s.hp / 2 + s.def * 2); }

    // ── 升級（彩色經驗 / 彩虹經驗）───────────────────
    canLevel(h) { return h.level < this.maxLevel(h) && this.xpAvailable(h) >= this.xpToNext(h); }
    xpAvailable(h) { return this.d.xp[this.def(h).element] + this.d.xp.rainbow; }
    levelUp(h) {
      if (!this.canLevel(h)) return false;
      let need = this.xpToNext(h); const col = this.def(h).element;
      const useCol = Math.min(need, this.d.xp[col]); this.d.xp[col] -= useCol; need -= useCol;
      this.d.xp.rainbow -= need; h.level++; this.save(); return true;
    }
    unlockTalent(h) {
      if (!this.nextTalent(h) || this.d.tokens < this.talentCost(h)) return false;
      this.d.tokens -= this.talentCost(h); h.unlocked++; this.save(); return true;
    }
    // ── 裝備 ─────────────────────────────────────────
    equip(h, gear) {
      const prev = h.gear[gear.slot];
      if (prev) this.d.gear.push(prev);
      this.d.gear = this.d.gear.filter(g => g.uid !== gear.uid);
      h.gear[gear.slot] = gear; this.save();
    }
    unequip(h, slot) { const g = h.gear[slot]; if (!g) return; delete h.gear[slot]; this.d.gear.push(g); this.save(); }
    sellGear(gear) { this.d.gear = this.d.gear.filter(g => g.uid !== gear.uid); this.d.gold += Math.round(DH.RARITIES[gear.rarity].price * 0.4); this.save(); }
    // ── 昇華 ─────────────────────────────────────────
    ascendReq(h) { return { level: ASCEND_LEVEL[h.stars], gold: ASCEND_GOLD[h.stars], gear: this.requiredGear(h) }; }
    canAscend(h) { const r = this.ascendReq(h); return !h.ascended && h.level >= r.level && this.d.gold >= r.gold && this.gearCount(h) >= r.gear; }
    ascend(h) {
      if (!this.canAscend(h)) return false;
      this.d.gold -= this.ascendReq(h).gold; h.gear = {}; h.level = Math.ceil(h.level / 2); h.ascended = true; this.save(); return true;
    }
    // ── 合併／退役 ───────────────────────────────────
    duplicates(h) { return this.d.heroes.filter(o => o.id === h.id && o.uid !== h.uid && !this.d.team.includes(o.uid)); }
    merge(h, other) {
      if (h.merges >= 5 || other.id !== h.id) return false;
      this.d.heroes = this.d.heroes.filter(o => o.uid !== other.uid);
      for (const g of Object.values(other.gear)) this.d.gear.push(g);
      h.merges++; this.save(); return true;
    }
    retire(h) {
      if (this.d.team.includes(h.uid) || this.d.heroes.length <= 1) return false;
      this.d.heroes = this.d.heroes.filter(o => o.uid !== h.uid);
      for (const g of Object.values(h.gear)) this.d.gear.push(g);
      this.d.soulSigils += 35 * h.stars; this.d.xp.rainbow += 60 * h.stars; this.save(); return true;
    }
    // ── 隊伍 ─────────────────────────────────────────
    setTeam(uids) { this.d.team = uids.slice(0, 5).filter(u => this.hero(u)); this.save(); }
    teamHeroes() { return this.d.team.map(u => this.hero(u)).filter(Boolean); }
    leaderBonusFor(h) {
      const leader = this.teamHeroes()[0]; if (!leader) return null;
      const ld = this.def(leader); if (ld.element !== this.def(h).element) return null;
      return ld.leader;
    }
    // 建立戰鬥用英雄定義
    buildBattleDef(h) {
      const d = this.def(h), s = this.stats(h, this.leaderBonusFor(h));
      return Object.assign({}, d, { hp: s.hp, atk: s.atk, def: s.def, armor: 0, talents: this.unlockedTalents(h), level: h.level, stars: h.stars, instance: h, weaponRarity: h.gear.weapon ? h.gear.weapon.rarity : null });
    }
    // ── 召喚 ─────────────────────────────────────────
    summonCost() { return SUMMON_COST; }
    soulSummonCost() { return SOUL_SUMMON_COST; }
    rollStars(minStars) {
      const entries = Object.entries(SUMMON_RATES).filter(([s]) => +s >= (minStars || 1));
      let r = Math.random() * entries.reduce((a, [, w]) => a + w, 0);
      for (const [s, w] of entries) { r -= w; if (r <= 0) return +s; }
      return +entries[entries.length - 1][0];
    }
    summon(soul) {
      if (soul) { if (this.d.soulSigils < SOUL_SUMMON_COST) return null; this.d.soulSigils -= SOUL_SUMMON_COST; }
      else { if (this.d.gems < SUMMON_COST) return null; this.d.gems -= SUMMON_COST; }
      const stars = this.rollStars(soul ? 4 : 1);
      const pool = Object.values(DH.HEROES).filter(d => d.stars === stars);
      const def = pool[Math.floor(Math.random() * pool.length)];
      const h = this.addHero(def.id, true);
      const dup = this.d.heroes.some(o => o.id === def.id && o.uid !== h.uid);
      this.save();
      return { hero: h, def, dup };
    }
    // ── 戰利品 ───────────────────────────────────────
    rewardFor(dungeon, stars) {
      const id = dungeon.id, first = !this.d.firstClear[id];
      const r = { gold: 120 * id + 80, gems: 15 * id + (first ? 120 : 0), xp: {}, gear: null, tokens: 0, first };
      const cols = COLORS.slice(); const c1 = cols[Math.floor(Math.random() * 5)], c2 = cols[Math.floor(Math.random() * 5)];
      r.xp[c1] = (r.xp[c1] || 0) + 60 * id; r.xp[c2] = (r.xp[c2] || 0) + 40 * id; r.xp.rainbow = 25 * id;
      if (Math.random() < 0.6 + 0.1 * stars || first) r.gear = DH.makeGear(null, DH.rollRarity(id));
      if (Math.random() < 0.3 + 0.1 * stars || first) r.tokens = 1;
      return r;
    }
    applyReward(dungeon, stars, r) {
      this.d.gold += r.gold; this.d.gems += r.gems; this.d.tokens += r.tokens;
      for (const [k, v] of Object.entries(r.xp)) this.d.xp[k] += v;
      if (r.gear) this.d.gear.push(r.gear);
      this.d.firstClear[dungeon.id] = true;
      this.d.stars[dungeon.id] = Math.max(this.d.stars[dungeon.id] || 0, stars);
      this.save();
    }
    buyGear(rarity) {
      const price = DH.RARITIES[rarity].price; if (this.d.gems < price) return null;
      this.d.gems -= price; const g = DH.makeGear(null, rarity); this.d.gear.push(g); this.save(); return g;
    }
    buyTokens() { if (this.d.gems < 250) return false; this.d.gems -= 250; this.d.tokens += 1; this.save(); return true; }
    buyXp(color) { if (this.d.gems < 100) return false; this.d.gems -= 100; this.d.xp[color] += 500; this.save(); return true; }
  }
  DH.Meta = Meta;
  DH.META_CONST = { MAX_LEVEL, MAX_LEVEL_ASC, SUMMON_RATES, SUMMON_COST, SOUL_SUMMON_COST, COLORS };
})(window.DH);
