// 玩家資料與養成系統：金幣、寶石、彩色經驗、天賦代幣、英雄實例、裝備、隊伍、召喚、昇華、戰利品
(function (DH) {
  const SAVE_KEY = 'dh_save_v2';
  const COLORS = ['red', 'green', 'blue', 'light', 'dark'];
  const MAX_LEVEL = 75, MAX_LEVEL_ASC = 85;
  const ASCEND_GOLD = { 1: 1000, 2: 2500, 3: 5000, 4: 20000, 5: 50000 };
  const ASCEND_LEVEL = { 1: 30, 2: 40, 3: 50, 4: 60, 5: 70 };
  const SUMMON_COST = 300, SOUL_SUMMON_COST = 350, WEAPON_SUMMON_COST = 150;
  const SIGNATURE_RATE = 0.05;
  const EXCLUSIVE_RATE = 0.10;
  const SUMMON_RATES = { 1: 40, 2: 30, 3: 19, 4: 8, 5: 3 };
  const SOUL_RATES = { 1: 25, 2: 28, 3: 25, 4: 15, 5: 7 };
  let heroUid = 1;

  class Meta {
    constructor() { this.load(); }
    defaults() {
      return {
        gold: 500, gems: 1500, tokens: 3, soulSigils: 0,
        xp: { red: 200, green: 200, blue: 200, light: 200, dark: 200, rainbow: 300 },
        heroes: [], gear: [], team: [], stars: {}, firstClear: {}, story: {},
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
      if (!this.d.testGrant2) { this.d.gems += 100000; this.d.testGrant2 = true; }
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
    sigOf(h) { const g = h.gear.weapon; return g && g.rarity === 'signature' && g.heroId === h.id ? g : null; }
    unlockedTalents(h) {
      const list = this.talentList(h), d = this.def(h);
      let n = Math.min(h.unlocked, list.length) + (h.ascended ? 1 : 0);
      const sig = this.sigOf(h);
      if (sig && d.species === 'human') n += 1;   // 多才：額外天賦槽
      let out = list.slice(0, Math.min(n, list.length)).concat(d.innate || []);
      if (sig) { const t = DH.sigTraitFor(h.id, sig.variant); if (t && t.key === 'grant' && !out.includes(t.params[0])) out.push(t.params[0]); }
      return out;
    }
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
        const e = DH.gearEffective(g);
        if (g.stat === 'atk') atk *= 1 + e.pct; else if (g.stat === 'hp') hp *= 1 + e.pct; else def += Math.round(e.pct * 100);
        if (e.bonus) { if (e.bonus.atk) atk *= 1 + e.bonus.atk; if (e.bonus.hp) hp *= 1 + e.bonus.hp; if (e.bonus.def) def += Math.round(e.bonus.def * 100); }
      }
      // 詞條與套裝的屬性加成
      const gfx = this.gearFx(h).fx;
      if (gfx.atk) atk *= 1 + gfx.atk / 100; if (gfx.hp) hp *= 1 + gfx.hp / 100; if (gfx.def) def += Math.round(gfx.def);
      const sig = this.sigOf(h);
      if (sig) {
        const sc = DH.sigScale(sig.level);
        if (d.species === 'dwarf') def += Math.round(20 * sc);
        const t = DH.sigTraitFor(h.id, sig.variant);
        if (t && t.key === 'def_to_atk') atk *= 1 + (def / 10) * (t.params[0] * sc) / 100;
      }
      if (leaderBonus) { atk *= 1 + (leaderBonus.atk || 0); def += Math.round((leaderBonus.def || 0) * 100); }
      const bs = this.bondStats(h, this._teamOverride);
      atk *= 1 + bs.atk / 100; hp *= 1 + bs.hp / 100; def += bs.def;
      // 隊友專武的全隊加成
      if (this.d.team.includes(h.uid)) for (const o of this.teamHeroes()) {
        const og = this.sigOf(o); if (!og) continue; const ot = DH.sigTraitFor(o.id, og.variant); if (!ot) continue;
        const osc = DH.sigScale(og.level);
        if (ot.key === 'team_atk') atk *= 1 + ot.params[0] * osc / 100;
        if (ot.key === 'team_def') def += Math.round(ot.params[0] * osc);
      }
      return { hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
    }
    power(h, withLeader) { const s = this.stats(h, withLeader ? this.leaderBonusFor(h) : null); return Math.round(s.atk * 3 + s.hp / 2 + s.def * 2); }

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
    canEquip(h, gear) { return (!gear.heroId || gear.heroId === h.id) && (!gear.classKey || gear.classKey === this.def(h).classKey); }
    gearFx(h) { return DH.gearFxOf(Object.values(h.gear)); }
    equip(h, gear) {
      if (!this.canEquip(h, gear)) return false;
      const prev = h.gear[gear.slot];
      if (prev) this.d.gear.push(prev);
      this.d.gear = this.d.gear.filter(g => g.uid !== gear.uid);
      h.gear[gear.slot] = gear; this.save(); return true;
    }
    unequip(h, slot) { const g = h.gear[slot]; if (!g) return; delete h.gear[slot]; this.d.gear.push(g); this.save(); }
    // 一鍵裝備：每個部位挑背包裡最好的（專武優先、稀有度高者優先），只在比目前更好時更換
    autoEquip(h) {
      let n = 0;
      for (const sl of DH.GEAR_SLOTS) {
        const cands = this.d.gear.filter(g => g.slot === sl.key && this.canEquip(h, g));
        if (!cands.length) continue;
        const score = g => DH.rarityRank(g.rarity) * 10 + (g.rarity === 'signature' ? 5 : 0) + (g.level || 1) + (g.affixes ? g.affixes.length : 0) + (g.set ? 1 : 0);
        cands.sort((a, b) => score(b) - score(a));
        const best = cands[0], cur = h.gear[sl.key];
        if (!cur || score(best) > score(cur)) { this.equip(h, best); n++; }
      }
      return n;
    }
    sigMaterials(h, gear) { return this.d.gear.filter(g => g.rarity === 'signature' && g.heroId === gear.heroId && (g.variant || 0) === (gear.variant || 0) && g.uid !== gear.uid); }
    upgradeSignature(h, gear) {
      if (gear.rarity !== 'signature' || (gear.level || 1) >= DH.SIG_LEVEL_MAX) return false;
      const mat = this.sigMaterials(h, gear)[0]; if (!mat) return false;
      this.d.gear = this.d.gear.filter(g => g.uid !== mat.uid);
      gear.level = (gear.level || 1) + 1; this.save(); return true;
    }
    exclMaterials(gear) { return this.d.gear.filter(g => g.rarity === 'exclusive' && g.classKey === gear.classKey && g.slot === gear.slot && g.uid !== gear.uid); }
    upgradeExclusive(gear) {
      if (gear.rarity !== 'exclusive' || (gear.level || 1) >= DH.EXCL_LEVEL_MAX) return false;
      const mat = this.exclMaterials(gear)[0]; if (!mat) return false;
      this.d.gear = this.d.gear.filter(g => g.uid !== mat.uid);
      gear.level = (gear.level || 1) + 1; gear.pct = DH.exclPct(gear.level); this.save(); return true;
    }
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
    withTeam(uids, fn) { this._teamOverride = uids; try { return fn(); } finally { this._teamOverride = null; } }
    teamHeroes() { return this.d.team.map(u => this.hero(u)).filter(Boolean); }
    // 隊伍戰力：以 uids 為隊伍（第一位是隊長）計算每人含隊長加成、緣份、隊友專武的戰力合計
    teamPower(uids) {
      const old = this.d.team; this.d.team = uids;
      try { return this.teamHeroes().reduce((a, h) => a + this.power(h, true), 0); } finally { this.d.team = old; }
    }
    // 自動組隊的評分：戰力 + 非數值緣份（能量、會心、治療、閃避、合體技、遺志）的估值；有禁忌緣份則不可行
    teamScore(uids) {
      const bonds = this.activeBonds(uids);
      if (bonds.some(b => b.type === 'forbid')) return -Infinity;
      let s = this.teamPower(uids), extra = 0;
      for (const b of bonds) {
        if (b.type === 'combo') extra += 0.06;
        else if (b.type === 'death') extra += 0.02;
        else if (b.stats) for (const st of Object.values(b.stats)) extra += ((st.energy || 0) + (st.crit || 0) + (st.dodge || 0) + (st.heal || 0) / 2 + (st.supportAtk || 0)) / 1000;
      }
      return s * (1 + extra);
    }
    // 一鍵組隊：固定隊長（沒有隊長就從戰力前幾名中挑最好的），依緣份與戰力找出分數最高的五人
    autoTeam(leaderUid) {
      const best = {};
      for (const h of this.d.heroes) { const p = this.power(h); if (!best[h.id] || p > best[h.id].p) best[h.id] = { h, p }; }
      const pool = Object.values(best).sort((a, b) => b.p - a.p).map(o => o.h);
      if (!pool.length) return [];
      const top = pool.slice(0, 24);
      const fill = (team) => {
        team = team.slice();
        while (team.length < Math.min(5, pool.length)) {
          let bs = -Infinity, bu = null;
          const ids = new Set(team.map(u => this.hero(u).id));
          const cand = top.concat(pool.filter(h => DH.BONDS.some(b => b.heroes.includes(h.id) && b.heroes.some(id => ids.has(id)))));
          for (const h of cand) { if (team.includes(h.uid) || ids.has(h.id)) continue; const sc = this.teamScore(team.concat(h.uid)); if (sc > bs) { bs = sc; bu = h.uid; } }
          if (!bu) break; team.push(bu);
        }
        return team;
      };
      const improve = (team) => {
        let cur = this.teamScore(team);
        for (let pass = 0; pass < 3; pass++) {
          let changed = false;
          for (let i = 1; i < team.length; i++) for (const h of pool) {
            if (team.includes(h.uid) || team.some((u, k) => k !== i && this.hero(u).id === h.id)) continue;
            const t = team.slice(); t[i] = h.uid; const sc = this.teamScore(t);
            if (sc > cur + 1e-6) { team = t; cur = sc; changed = true; }
          }
          if (!changed) break;
        }
        return { team, score: cur };
      };
      const leaders = leaderUid && this.hero(leaderUid) ? [this.hero(leaderUid)] : pool.slice(0, 6);
      let result = null;
      for (const L of leaders) {
        const starts = [[L.uid]];
        // 以隊長相關的緣份為起點：把緣份成員一起放進隊伍再補滿
        for (const b of DH.BONDS) {
          if (b.negative || b.type === 'forbid' || b.type === 'death' || !b.heroes.includes(L.id)) continue;
          const mem = b.heroes.filter(id => id !== '*' && id !== L.id).map(id => best[id] && best[id].h).filter(Boolean);
          if (!mem.length) continue;
          starts.push([L.uid].concat(mem.slice(0, 4).map(h => h.uid)));
        }
        for (const s of starts) { const r = improve(fill(s)); if (!result || r.score > result.score) result = r; }
      }
      return result ? result.team : [];
    }
    // ── 緣份 ──
    // 回傳目前隊伍（或指定 uid 列表）觸發的緣份：team / sig 立即生效，death / combo 為待觸發
    activeBonds(uids) {
      const team = (uids || this.d.team).map(u => this.hero(u)).filter(Boolean);
      const ids = team.map(h => h.id), out = [];
      for (const b of DH.BONDS) {
        const present = b.heroes.filter(id => id === '*' || ids.includes(id));
        if (b.type === 'team') { if (present.length >= (b.need || b.heroes.length)) out.push(b); }
        else if (b.type === 'sig') { const partner = team.find(h => h.id === b.partner); if (partner && this.sigOf(partner) && b.heroes.every(id => ids.includes(id))) out.push(b); }
        else if (b.type === 'death') { const to = team.find(h => h.id === b.to); if (to && (b.on === '*' || ids.includes(b.on))) out.push(b); }
        else if (b.type === 'combo') { if (present.length >= (b.need || b.heroes.length)) out.push(b); }
        else if (b.type === 'forbid') { if (b.heroes.every(id => ids.includes(id))) out.push(b); }
      }
      return out;
    }
    forbiddenWith(uids, heroId) { const ids = uids.map(u => this.hero(u)).filter(Boolean).map(h => h.id); return DH.BONDS.find(b => b.type === 'forbid' && b.heroes.includes(heroId) && b.heroes.some(id => id !== heroId && ids.includes(id))) || null; }
    // 某英雄從緣份獲得的加成合計
    bondStats(h, uids) {
      const acc = { atk: 0, hp: 0, def: 0, energy: 0, crit: 0, heal: 0, dodge: 0, vsBeast: 0, poisonAmp: 0, supportAtk: 0, iceImmune: false };
      const team = (uids || this.d.team); if (!team.includes(h.uid)) return acc;
      for (const b of this.activeBonds(team)) {
        if (!b.stats) continue;
        const inBond = b.heroes.includes(h.id);
        for (const [who, st] of Object.entries(b.stats)) {
          if (who === 'team' || (who === 'all' && inBond) || who === h.id) for (const [k, v] of Object.entries(st)) { if (k === 'iceImmune') acc.iceImmune = acc.iceImmune || v; else acc[k] += v; }
        }
      }
      return acc;
    }
    leaderBonusFor(h) {
      const leader = this.teamHeroes()[0]; if (!leader) return null;
      const ld = this.def(leader);
      if (ld.element !== this.def(h).element && !(ld.species === 'human' && this.sigOf(leader))) return null;
      return ld.leader;
    }
    // 建立戰鬥用英雄定義
    buildBattleDef(h) {
      const d = this.def(h), s = this.stats(h, this.leaderBonusFor(h));
      const sigGear = this.sigOf(h);
      let pattern = d.pattern, sig = null;
      if (sigGear) {
        const t = DH.sigTraitFor(h.id, sigGear.variant);
        sig = { species: d.species, level: sigGear.level || 1, scale: DH.sigScale(sigGear.level), trait: t, name: sigGear.name, variant: sigGear.variant || 0 };
        if (t && t.key === 'pattern_all') pattern = DH.PATTERNS[d.pattern].kind + '_all';
        if (t && t.key === 'range_pierce' && DH.PATTERNS[d.pattern].kind === 'ranged') pattern = d.pattern.replace('ranged', 'magic');
      }
      const bond = this.bondStats(h), bonds = this.activeBonds();
      return Object.assign({}, d, { pattern, hp: s.hp, atk: s.atk, def: s.def, armor: 0, talents: this.unlockedTalents(h), level: h.level, stars: h.stars, instance: h, weaponRarity: h.gear.weapon ? h.gear.weapon.rarity : null, sig, bond, deathBonds: bonds.filter(b => b.type === 'death' && b.to === h.id), combos: bonds.filter(b => b.type === 'combo' && b.heroes.includes(h.id)), gx: Object.assign({}, this.gearFx(h).fx) });
    }
    // ── 召喚 ─────────────────────────────────────────
    summonCost() { return SUMMON_COST; }
    soulSummonCost() { return SOUL_SUMMON_COST; }
    rollHero(soul) {
      if (Math.random() < DH.LEGEND_RATE) { const pool = Object.values(DH.HEROES).filter(d => d.legendary); return pool[Math.floor(Math.random() * pool.length)]; }
      const stars = this.rollStars(soul);
      const pool = Object.values(DH.HEROES).filter(d => d.stars === stars && !d.legendary);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    rollStars(soul) {
      const entries = Object.entries(soul ? SOUL_RATES : SUMMON_RATES);
      let r = Math.random() * entries.reduce((a, [, w]) => a + w, 0);
      for (const [s, w] of entries) { r -= w; if (r <= 0) return +s; }
      return +entries[entries.length - 1][0];
    }
    summon(soul) {
      if (soul) { if (this.d.soulSigils < SOUL_SUMMON_COST) return null; this.d.soulSigils -= SOUL_SUMMON_COST; }
      else { if (this.d.gems < SUMMON_COST) return null; this.d.gems -= SUMMON_COST; }
      const def = this.rollHero(soul);
      const h = this.addHero(def.id, true);
      const dup = this.d.heroes.some(o => o.id === def.id && o.uid !== h.uid);
      this.save();
      return { hero: h, def, dup };
    }
    summonMany(soul, n) {
      const unit = soul ? SOUL_SUMMON_COST : SUMMON_COST, cost = n >= 10 ? Math.round(unit * n * (soul ? 1 : 0.9)) : unit * n;
      if (soul ? this.d.soulSigils < cost : this.d.gems < cost) return null;
      if (soul) this.d.soulSigils -= cost; else this.d.gems -= cost;
      const out = [];
      for (let i = 0; i < n; i++) {
        const def = this.rollHero(soul);
        const dup = this.d.heroes.some(o => o.id === def.id);
        const h = this.addHero(def.id, true);
        out.push({ hero: h, def, dup });
      }
      this.save(); return out;
    }
    summonCostFor(soul, n) { const unit = soul ? SOUL_SUMMON_COST : SUMMON_COST; return n >= 10 ? Math.round(unit * n * (soul ? 1 : 0.9)) : unit * n; }
    // ── 武器召喚：一般武器（稀有度偏高）或專屬武器（5%，十連保底一把）──
    weaponSummonCost(n) { return n >= 10 ? WEAPON_SUMMON_COST * 9 : WEAPON_SUMMON_COST * n; }
    weaponSummon(n) {
      const cost = this.weaponSummonCost(n);
      if (this.d.gems < cost) return null;
      this.d.gems -= cost;
      const ids = Object.keys(DH.HEROES), out = [];
      for (let i = 0; i < n; i++) {
        if (Math.random() < SIGNATURE_RATE) out.push(DH.makeSignature(ids[Math.floor(Math.random() * ids.length)]));
        else out.push(DH.makeGear('weapon', DH.rollRarity(3)));
      }
      if (n >= 10 && !out.some(g => g.rarity === 'signature')) out[n - 1] = DH.makeSignature(ids[Math.floor(Math.random() * ids.length)]);
      for (const g of out) this.d.gear.push(g);
      this.save(); return out;
    }
    // 防具召喚：一般防具（帶詞條與套裝）或職業專屬套裝的一件；十連保底一件職業專屬
    armorSummon(n) {
      const cost = this.weaponSummonCost(n);
      if (this.d.gems < cost) return null;
      this.d.gems -= cost;
      const cls = Object.keys(DH.CLASS_SETS), slots = DH.CLASS_SET_SLOTS, out = [];
      const excl = () => DH.makeClassPiece(cls[Math.floor(Math.random() * cls.length)]);
      for (let i = 0; i < n; i++) out.push(Math.random() < EXCLUSIVE_RATE ? excl() : DH.makeGear(slots[Math.floor(Math.random() * slots.length)], DH.rollRarity(3)));
      if (n >= 10 && !out.some(g => g.rarity === 'exclusive')) out[n - 1] = excl();
      for (const g of out) this.d.gear.push(g);
      this.save(); return out;
    }
    // ── 故事 ─────────────────────────────────────────
    storyProgress(heroId) { return (this.d.story && this.d.story[heroId]) || 0; }
    storyTeam(heroId) {
      // 故事戰鬥：故事主角必須上場；沒在隊伍裡就暫時放到隊長位
      const own = this.d.heroes.find(h => h.id === heroId); if (!own) return null;
      let team = this.d.team.slice();
      if (!team.includes(own.uid)) { team = [own.uid].concat(team).slice(0, 5); }
      return team;
    }
    completeStoryChapter(story, idx, partnerPresent) {
      if (!this.d.story) this.d.story = {};
      const cur = this.storyProgress(story.heroId);
      const r = { gold: 300 + 200 * idx, gems: 60 + 30 * idx, tokens: idx === 4 ? 2 : 0, sig: null, bonus: 0, first: cur <= idx };
      if (cur <= idx) {
        this.d.story[story.heroId] = idx + 1;
        if (story.chapters[idx].bonus && partnerPresent) r.bonus = 300;
        if (idx === 4) { const g = DH.makeSignature(story.heroId, 0); g.level = 2; this.d.gear.push(g); r.sig = g; }
      } else { r.gold = Math.round(r.gold / 3); r.gems = Math.round(r.gems / 3); r.tokens = 0; }
      this.d.gold += r.gold; this.d.gems += r.gems + r.bonus; this.d.tokens += r.tokens;
      this.save(); return r;
    }
    // ── 戰利品 ───────────────────────────────────────
    rewardFor(dungeon, stars) {
      const id = dungeon.id, first = !this.d.firstClear[id], ch = dungeon.chapter || 1;
      const r = { gold: 100 + 40 * id + (dungeon.boss ? 500 : 0), gems: 12 + 3 * id + (first ? 150 : 0) + (dungeon.boss ? 100 : 0), xp: {}, gear: null, tokens: 0, first };
      const cols = COLORS.slice(); const c1 = cols[Math.floor(Math.random() * 5)], c2 = cols[Math.floor(Math.random() * 5)];
      r.xp[c1] = (r.xp[c1] || 0) + 40 + 14 * id; r.xp[c2] = (r.xp[c2] || 0) + 20 + 10 * id; r.xp.rainbow = 15 + 5 * id;
      if (Math.random() < 0.5 + 0.1 * stars || first || dungeon.boss) r.gear = DH.makeGear(null, DH.rollRarity(ch));
      if (Math.random() < 0.25 + 0.1 * stars || first || dungeon.boss) r.tokens = dungeon.boss ? 2 : 1;
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
  DH.META_CONST = { MAX_LEVEL, MAX_LEVEL_ASC, SUMMON_RATES, SOUL_RATES, SUMMON_COST, SOUL_SUMMON_COST, WEAPON_SUMMON_COST, SIGNATURE_RATE, EXCLUSIVE_RATE, COLORS };
})(window.DH);
