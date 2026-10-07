// 防具與詞條：
//   一般裝備：依部位有自己的特殊詞條池（稀有度越高詞條越多），史詩以上會帶一種通用套裝
//   職業專屬：15 個職業各一套 5 件（護甲／頭盔／靴子／戒指／護符），只有該職業能穿，
//             每件效果不同，同套穿 3 件、5 件有套裝效果；可用同一件的重複品強化到 Lv.5
(function (DH) {
  // 效果原語：名稱與顯示格式（v 為數值）
  const FX = {
    atk: ['攻擊', v => `+${v}%`], hp: ['生命', v => `+${v}%`], def: ['防禦', v => `+${v}`],
    dr: ['受到傷害', v => `-${v}%`], thorns: ['反彈受到傷害', v => `${v}%`], counter: ['近戰反擊', v => `${v}% 攻擊力`],
    hitEnergy: ['受擊能量', v => `+${v}`], resist: ['抵抗中毒灼燒緩速', v => `${v}%`], healRecv: ['受到治療', v => `+${v}%`],
    startShield: ['每波開始護盾', v => `${v}% 生命`], dodge: ['閃避', v => `+${v}%`], dragTime: ['拖曳時間', v => `+${v} 秒`],
    mudWalk: ['泥地不減時間', () => ''], iceWalk: ['冰上不滑行', () => ''], fireWalk: ['火焰不灼傷', () => ''],
    crit: ['會心率', v => `+${v}%`], critDmg: ['會心傷害', v => `+${v}%`], bossDmg: ['對首領傷害', v => `+${v}%`],
    energy: ['能量獲得', v => `+${v}%`], startEnergy: ['開場能量', v => `+${v}`], regen: ['每回合回復', v => `${v}% 生命`],
    lifesteal: ['吸血', v => `${v}%`], multiDmg: ['同時打 2 隻以上傷害', v => `+${v}%`], singleDmg: ['只打 1 隻時傷害', v => `+${v}%`],
    firstStrike: ['第一個行動時傷害', v => `+${v}%`], movedDmg: ['有移動時傷害', v => `+${v}%`], unmovedDmg: ['沒移動時傷害', v => `+${v}%`],
    lowHpDmg: ['生命低於一半時傷害', v => `+${v}%`], execute: ['對生命低於一半的敵人', v => `+${v}%`], vsStatus: ['對中毒或灼燒的敵人', v => `+${v}%`],
    statusDur: ['施加的中毒灼燒回合', v => `+${v}`], healPower: ['治療與延遲治癒量', v => `+${v}%`], shieldPower: ['給予的護盾與結界', v => `+${v}%`],
    supportAtk: ['鼓舞額外攻擊', v => `+${v}%`], killEnergy: ['擊殺時能量', v => `+${v}`], killHeal: ['擊殺時回復', v => `${v}% 生命`],
    guardAlly: ['相鄰隊友受到傷害', v => `-${v}%`], pushDmg: ['推擠造成', v => `${v}% 攻擊力傷害`], waveHeal: ['每波開始全隊回復', v => `${v}%`],
    ultDmg: ['大絕招傷害', v => `+${v}%`], beastDmg: ['對野獸傷害', v => `+${v}%`], holyDmg: ['對亡靈與惡魔傷害', v => `+${v}%`],
    colorAdv: ['顏色克制時傷害', v => `+${v}%`], poisonOnHit: ['命中使敵人中毒', () => ''], burnOnHit: ['命中使敵人灼燒', () => ''],
    slowOnHit: ['命中使敵人緩速', () => ''], stunChance: ['命中暈眩機率', v => `${v}%`], curseChance: ['命中詛咒機率', v => `${v}%`],
    markChance: ['命中標記機率', v => `${v}%`], aoeSplash: ['濺射周圍敵人', v => `${v}% 攻擊力`], extraHit: ['追擊另一隻敵人', v => `${v}% 攻擊力`],
    reviveOnce: ['致命傷害時保留 1 HP（每場一次）', () => ''], reviveAlly: ['隊友倒下時以 30% 生命復活他（每場一次）', () => ''],
    teamAtk: ['全隊攻擊', v => `+${v}%`], teamDr: ['全隊受到傷害', v => `-${v}%`], teamEnergy: ['全隊能量獲得', v => `+${v}%`],
    teamRegen: ['全隊每回合回復', v => `${v}% 生命`], teamStartShield: ['每波開始全隊護盾', v => `${v}% 生命`],
  };
  DH.GFX = FX;
  const BOOL = new Set(['mudWalk', 'iceWalk', 'fireWalk', 'poisonOnHit', 'burnOnHit', 'slowOnHit', 'reviveOnce', 'reviveAlly']);
  DH.fxText = (k, v) => { const f = FX[k]; if (!f) return k; const s = f[1](Math.round(v * 10) / 10); return s ? `${f[0]} ${s}` : f[0]; };
  DH.fxListText = fx => Object.entries(fx).filter(([k, v]) => v).map(([k, v]) => DH.fxText(k, v));

  // ── 一般裝備的詞條池（數值為神話等級的基準）──
  const AFFIX_POOL = {
    weapon: [['crit', 8], ['critDmg', 25], ['bossDmg', 15], ['lifesteal', 6], ['multiDmg', 12], ['singleDmg', 15], ['execute', 15]],
    armor:  [['dr', 8], ['thorns', 15], ['hitEnergy', 5], ['hp', 6], ['counter', 25], ['guardAlly', 8]],
    helmet: [['resist', 35], ['healRecv', 15], ['startShield', 10], ['def', 8], ['hitEnergy', 4]],
    boots:  [['dodge', 6], ['dragTime', 0.3], ['mudWalk', 1], ['iceWalk', 1], ['fireWalk', 1], ['movedDmg', 12]],
    ring:   [['crit', 8], ['critDmg', 25], ['killEnergy', 12], ['execute', 15], ['atk', 5], ['vsStatus', 15]],
    amulet: [['energy', 12], ['startEnergy', 15], ['regen', 3], ['waveHeal', 5], ['healPower', 15], ['ultDmg', 12]],
  };
  const AFFIX_COUNT = { magic: 1, epic: 1, mythic: 2, legendary: 3 };
  const AFFIX_MULT = { magic: 0.5, epic: 0.75, mythic: 1, legendary: 1.3 };
  DH.rollAffixes = function (slot, rarity) {
    const pool = (AFFIX_POOL[slot] || []).slice(), out = [], n = AFFIX_COUNT[rarity] || 0;
    for (let i = 0; i < n && pool.length; i++) {
      const [k, base] = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const v = BOOL.has(k) ? 1 : Math.round(base * AFFIX_MULT[rarity] * (0.85 + Math.random() * 0.3) * 10) / 10;
      out.push([k, v]);
    }
    return out;
  };

  // ── 通用套裝（一般裝備史詩以上隨機帶一種；6 個部位都算）──
  DH.GEAR_SETS = {
    berserk: { name: '狂戰', color: '#ff6a4a', 2: { atk: 8 }, 4: { lowHpDmg: 30, lifesteal: 5 } },
    bulwark: { name: '鐵壁', color: '#9ab0c8', 2: { def: 10 }, 4: { startShield: 20, dr: 6 } },
    gale:    { name: '疾風', color: '#7ae0a0', 2: { dodge: 6 }, 4: { dragTime: 1, movedDmg: 15 } },
    arcane:  { name: '秘法', color: '#7ab0ff', 2: { energy: 15 }, 4: { startEnergy: 30, ultDmg: 15 } },
    vampire: { name: '血契', color: '#c8326a', 2: { lifesteal: 5 }, 4: { lifesteal: 10, killHeal: 10 } },
    hunter:  { name: '獵手', color: '#f6c64a', 2: { crit: 8 }, 4: { critDmg: 40, execute: 15 } },
  };
  const SET_KEYS = Object.keys(DH.GEAR_SETS);
  DH.rollSet = rarity => (rarity === 'magic' ? null : SET_KEYS[Math.floor(Math.random() * SET_KEYS.length)]);

  // ── 職業專屬套裝：[部位, 名字, 效果]，套裝 3 件 / 5 件 ──
  const P = (slot, name, fx) => ({ slot, name, fx });
  DH.CLASS_SETS = {
    knight: { name: '誓約', flavor: '守住身後的人，是騎士唯一的誓言。', pieces: [
      P('armor', '誓約胸甲', { dr: 10, guardAlly: 10 }), P('helmet', '誓約頭盔', { resist: 50, startShield: 10 }),
      P('boots', '誓約戰靴', { counter: 30, dragTime: 0.3 }), P('ring', '誓約指環', { firstStrike: 20 }),
      P('amulet', '誓約徽章', { hitEnergy: 6, energy: 10 })],
      3: { def: 15, guardAlly: 10 }, 5: { teamDr: 10, reviveOnce: 1 } },
    warrior: { name: '戰狂', flavor: '斧頭越重，越接近勝利。', pieces: [
      P('armor', '戰狂鎧', { lowHpDmg: 20, dr: 6 }), P('helmet', '戰狂角盔', { killEnergy: 15 }),
      P('boots', '踏陣靴', { movedDmg: 15 }), P('ring', '斷骨戒', { multiDmg: 15 }),
      P('amulet', '血誓符', { lifesteal: 8 })],
      3: { atk: 10, multiDmg: 15 }, 5: { aoeSplash: 30, killHeal: 8 } },
    archer: { name: '鷹眼', flavor: '看得見的，就射得到。', pieces: [
      P('armor', '遊俠皮甲', { dodge: 8 }), P('helmet', '鷹羽帽', { crit: 10 }),
      P('boots', '輕步靴', { dragTime: 0.4, unmovedDmg: 10 }), P('ring', '準星戒', { critDmg: 30 }),
      P('amulet', '風語符', { singleDmg: 15 })],
      3: { crit: 10, singleDmg: 15 }, 5: { extraHit: 50, critDmg: 30 } },
    mage: { name: '星辰', flavor: '把整片星空縫進法袍裡。', pieces: [
      P('armor', '星紋法袍', { energy: 15 }), P('helmet', '星冠', { startEnergy: 20 }),
      P('boots', '漂浮鞋', { mudWalk: 1, iceWalk: 1 }), P('ring', '秘銀戒', { statusDur: 1, vsStatus: 10 }),
      P('amulet', '星核', { ultDmg: 20 })],
      3: { ultDmg: 20, energy: 15 }, 5: { startEnergy: 50, burnOnHit: 1 } },
    cleric: { name: '慈光', flavor: '只要還有人站著，祈禱就不會停。', pieces: [
      P('armor', '慈光白袍', { healRecv: 20 }), P('helmet', '慈光頭紗', { healPower: 20 }),
      P('boots', '朝聖鞋', { regen: 4 }), P('ring', '祈禱戒', { resist: 50 }),
      P('amulet', '慈光聖印', { waveHeal: 8 })],
      3: { healPower: 25, teamRegen: 3 }, 5: { reviveAlly: 1, waveHeal: 8 } },
    rogue: { name: '夜影', flavor: '影子裡沒有規則。', pieces: [
      P('armor', '夜行衣', { dodge: 10 }), P('helmet', '夜影面罩', { firstStrike: 20 }),
      P('boots', '無聲靴', { dragTime: 0.4, mudWalk: 1 }), P('ring', '毒牙戒', { poisonOnHit: 1, vsStatus: 15 }),
      P('amulet', '黑貓符', { crit: 10 })],
      3: { crit: 10, execute: 20 }, 5: { critDmg: 50, dodge: 10, killEnergy: 15 } },
    barbarian: { name: '雷霆部族', flavor: '部族的鼓聲就是雷聲。', pieces: [
      P('armor', '獸皮戰甲', { thorns: 15, hp: 6 }), P('helmet', '獸顱盔', { hitEnergy: 8 }),
      P('boots', '碎地靴', { pushDmg: 40 }), P('ring', '怒焰戒', { lowHpDmg: 25 }),
      P('amulet', '雷牙', { stunChance: 10 })],
      3: { atk: 12, pushDmg: 40 }, 5: { stunChance: 20, lowHpDmg: 30 } },
    paladin: { name: '聖盾', flavor: '盾牌舉起之處，就是聖域。', pieces: [
      P('armor', '聖輝鎧', { dr: 10 }), P('helmet', '聖盔', { shieldPower: 30 }),
      P('boots', '聖行靴', { fireWalk: 1, resist: 30 }), P('ring', '審判戒', { holyDmg: 25 }),
      P('amulet', '聖徽', { healPower: 15 })],
      3: { teamStartShield: 10 }, 5: { teamDr: 8, holyDmg: 30 } },
    druid: { name: '森林之心', flavor: '樹根記得每一個走過的人。', pieces: [
      P('armor', '樹皮甲', { regen: 5 }), P('helmet', '鹿角冠', { healPower: 15 }),
      P('boots', '根鬚靴', { mudWalk: 1, slowOnHit: 1 }), P('ring', '藤蔓戒', { poisonOnHit: 1 }),
      P('amulet', '古樹種子', { teamRegen: 2 })],
      3: { teamRegen: 3, beastDmg: 20 }, 5: { stunChance: 15, healPower: 25 } },
    witch: { name: '月蝕', flavor: '月亮被吃掉的那一夜，詛咒最靈。', pieces: [
      P('armor', '黑紗袍', { lifesteal: 10 }), P('helmet', '月蝕尖帽', { statusDur: 1 }),
      P('boots', '夜飛鞋', { fireWalk: 1, iceWalk: 1 }), P('ring', '詛咒戒', { vsStatus: 20 }),
      P('amulet', '月石', { energy: 15 })],
      3: { poisonOnHit: 1, vsStatus: 20 }, 5: { curseChance: 25, lifesteal: 10 } },
    hunter: { name: '荒野', flavor: '獵物還沒察覺，陷阱已經合上。', pieces: [
      P('armor', '獸皮衣', { dodge: 6 }), P('helmet', '狼首帽', { beastDmg: 30 }),
      P('boots', '追蹤靴', { dragTime: 0.4 }), P('ring', '陷阱戒', { slowOnHit: 1 }),
      P('amulet', '獵王牙', { execute: 20 })],
      3: { beastDmg: 30, crit: 8 }, 5: { markChance: 25, execute: 20 } },
    bard: { name: '華彩', flavor: '最好的戰歌，是讓所有人一起唱。', pieces: [
      P('armor', '舞台服', { dodge: 6 }), P('helmet', '羽飾帽', { supportAtk: 15 }),
      P('boots', '舞鞋', { dragTime: 0.5 }), P('ring', '共鳴戒', { teamEnergy: 10 }),
      P('amulet', '金曲符', { startEnergy: 20 })],
      3: { teamAtk: 6 }, 5: { teamEnergy: 20, teamAtk: 6 } },
    princess: { name: '王權', flavor: '王冠的重量，由整個王國分擔。', pieces: [
      P('armor', '王室禮服', { healRecv: 15, dr: 6 }), P('helmet', '王冠', { teamAtk: 5 }),
      P('boots', '水晶鞋', { resist: 50 }), P('ring', '王印', { shieldPower: 25 }),
      P('amulet', '王國紋章', { teamEnergy: 10 })],
      3: { teamStartShield: 12 }, 5: { teamAtk: 8, teamDr: 6 } },
    elementalist: { name: '元素核心', flavor: '火、冰、雷，在掌心轉成一顆稜鏡。', pieces: [
      P('armor', '元素法衣', { fireWalk: 1, iceWalk: 1, mudWalk: 1 }), P('helmet', '三相冠', { multiDmg: 15 }),
      P('boots', '浮空靴', { dragTime: 0.3 }), P('ring', '元素戒', { burnOnHit: 1, vsStatus: 15 }),
      P('amulet', '稜鏡', { colorAdv: 20 })],
      3: { aoeSplash: 20 }, 5: { colorAdv: 30, ultDmg: 25 } },
    guardian: { name: '不落城牆', flavor: '城可以老，牆不會倒。', pieces: [
      P('armor', '城牆鎧', { dr: 12 }), P('helmet', '塔盔', { thorns: 20 }),
      P('boots', '錨靴', { unmovedDmg: 20, iceWalk: 1 }), P('ring', '堅守戒', { counter: 40 }),
      P('amulet', '城徽', { guardAlly: 15 })],
      3: { thorns: 20, def: 20 }, 5: { guardAlly: 20, reviveOnce: 1 } },
  };
  DH.CLASS_SET_SLOTS = ['armor', 'helmet', 'boots', 'ring', 'amulet'];
  DH.EXCL_LEVEL_MAX = 5;
  DH.exclScale = lv => 1 + 0.15 * ((lv || 1) - 1);
  DH.exclPct = lv => 0.15 + 0.02 * ((lv || 1) - 1);

  let uidN = 1;
  const newUid = () => 'x' + (uidN++) + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  DH.makeClassPiece = function (classKey, slot) {
    const cs = DH.CLASS_SETS[classKey]; slot = slot || DH.CLASS_SET_SLOTS[Math.floor(Math.random() * 5)];
    const p = cs.pieces.find(x => x.slot === slot), sd = DH.GEAR_SLOTS.find(s => s.key === slot);
    return { uid: newUid(), slot, rarity: 'exclusive', name: p.name, stat: sd.stat, pct: DH.exclPct(1), classKey, level: 1 };
  };
  DH.classPieceOf = g => g.rarity === 'exclusive' ? DH.CLASS_SETS[g.classKey].pieces.find(p => p.slot === g.slot) : null;

  // 匯總一位英雄身上所有裝備的效果：回傳 { fx, sets:[{name,count,tiers:[...],active}] }
  DH.gearFxOf = function (gears) {
    const fx = {}, add = (o, sc) => { for (const [k, v] of Object.entries(o)) fx[k] = BOOL.has(k) ? 1 : (fx[k] || 0) + v * (sc || 1); };
    const setCount = {}, clsCount = {};
    for (const g of gears) {
      if (!g) continue;
      if (g.affixes) for (const [k, v] of g.affixes) add({ [k]: v });
      if (g.set) setCount[g.set] = (setCount[g.set] || 0) + 1;
      if (g.rarity === 'exclusive') { add(DH.classPieceOf(g).fx, DH.exclScale(g.level)); clsCount[g.classKey] = (clsCount[g.classKey] || 0) + 1; }
    }
    const sets = [];
    for (const [k, n] of Object.entries(setCount)) {
      const S = DH.GEAR_SETS[k]; const tiers = [2, 4].filter(t => n >= t);
      for (const t of tiers) add(S[t]);
      sets.push({ key: k, name: S.name + '套裝', color: S.color, count: n, tiers: [2, 4], active: tiers });
    }
    for (const [k, n] of Object.entries(clsCount)) {
      const S = DH.CLASS_SETS[k]; const tiers = [3, 5].filter(t => n >= t);
      for (const t of tiers) add(S[t]);
      sets.push({ key: k, name: `${S.name}（${DH.CLASSES[k].cls}專屬）`, color: DH.RARITIES.exclusive.color, count: n, tiers: [3, 5], active: tiers, exclusive: true });
    }
    return { fx, sets };
  };
  DH.setBonusText = (s, t) => (s.exclusive ? DH.CLASS_SETS[s.key][t] : DH.GEAR_SETS[s.key][t]);
})(window.DH);
