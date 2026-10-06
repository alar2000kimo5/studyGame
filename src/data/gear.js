// 裝備：六個部位，四種稀有度；每件依稀有度加成一項屬性（攻擊／生命／防禦）
// 專屬武器：每位英雄一把，只有本人能裝備，攻擊 +20%、生命 +10%，只能從武器召喚取得
(function (DH) {
  DH.GEAR_SLOTS = [
    { key: 'weapon', name: '武器', stat: 'atk' },
    { key: 'armor',  name: '護甲', stat: 'hp' },
    { key: 'helmet', name: '頭盔', stat: 'def' },
    { key: 'boots',  name: '靴子', stat: 'hp' },
    { key: 'ring',   name: '戒指', stat: 'atk' },
    { key: 'amulet', name: '護符', stat: 'def' },
  ];
  DH.RARITIES = {
    magic:     { name: '魔法', color: '#5aa0ff', pct: 0.05, weight: 60, price: 60 },
    epic:      { name: '史詩', color: '#b464ff', pct: 0.08, weight: 28, price: 200 },
    mythic:    { name: '神話', color: '#ff7a3a', pct: 0.12, weight: 10, price: 750 },
    legendary: { name: '傳說', color: '#ffd24a', pct: 0.16, weight: 2,  price: 1500 },
    signature: { name: '專屬', color: '#ff6ad5', pct: 0.20, weight: 0,  price: 3000 },
  };
  const NAMES = {
    weapon: ['鐵刃', '獵風', '龍牙', '星辰'],
    armor:  ['皮甲', '鏈甲', '龍鱗甲', '聖輝甲'],
    helmet: ['皮帽', '鐵盔', '角盔', '王冠盔'],
    boots:  ['草鞋', '旅靴', '疾風靴', '天行靴'],
    ring:   ['銅戒', '銀戒', '血玉戒', '星輝戒'],
    amulet: ['木符', '骨符', '龍心符', '聖光符'],
  };
  // 專屬武器名稱：依職業，順序對應該職業的五位英雄（1★→5★ 的名冊順序）
  const SIGNATURE_NAMES = {
    knight:       ['誓約之劍', '礦心重劍', '銀葉騎士劍', '背棄者之刃', '龍息聖劍'],
    warrior:      ['礦坑劈斧', '磨刀石戰斧', '蠻顎雙斧', '逆族月斧', '不滅火紋斧'],
    archer:       ['林語長弓', '矮影短弓', '獵場硬弓', '藍焰龍弓', '支柱巨弓', '光羽弓'],
    mage:         ['藏書杖', '焦餐法杖', '微光杖', '吼咒圖騰杖', '摘星杖', '晨星杖'],
    cleric:       ['晨禱錘', '繃帶錘', '麥酒聖錘', '玫瑰祝福錘', '骨歌錘', '聖歌錘'],
    rogue:        ['無聲雙刃', '順手匕首', '影語刺刀', '巨影雙刃', '雙生暗刃'],
    barbarian:    ['破門巨棒', '凍土棍', '拔根樹棍', '不合理巨棒', '推山王棍'],
    paladin:      ['刻名聖錘', '兒童尺寸聖錘', '聖徽鬚錘', '柔光盾錘', '熾信聖錘', '天啟聖錘'],
    druid:        ['不語樹杖', '松鼠杖', '蘑菇杖', '沼澤慢杖', '開花龍鱗杖'],
    witch:        ['大鍋攪杖', '低飛掃帚杖', '月巫杖', '三炸爐杖', '血巫杖'],
    hunter:       ['斜角弩弓', '邊境獵弓', '獵首弓', '嗅跡追獵弓', '矛盾獵龍弓'],
    bard:         ['走音魯特琴', '三首歌之琴', '忘痛琴', '崩坑戰歌琴', '龍吟琴'],
    princess:     ['布陣權杖', '投票權杖', '出走王女杖', '純鐵王冠杖', '黑焰結界杖', '天界翼杖'],
    elementalist: ['八方火球', '室內雨之球', '心情光球', '脾氣火球', '走動影球'],
    guardian:     ['不動戰錘', '高過本人之錘', '排隊守門錘', '荊棘巨錘', '推不開之錘'],
  };
  const RARITY_ORDER = ['magic', 'epic', 'mythic', 'legendary'];
  let gearUid = 1;
  const newUid = () => 'g' + (gearUid++) + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  DH.rarityRank = r => r === 'signature' ? 4 : RARITY_ORDER.indexOf(r);
  DH.rollRarity = function (bias) {
    const w = RARITY_ORDER.map((k, i) => DH.RARITIES[k].weight * Math.pow(1 + 0.25 * (bias || 0), i));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return RARITY_ORDER[i]; }
    return 'magic';
  };
  DH.makeGear = function (slotKey, rarity) {
    const slot = DH.GEAR_SLOTS.find(s => s.key === slotKey) || DH.GEAR_SLOTS[Math.floor(Math.random() * 6)];
    rarity = rarity || DH.rollRarity(0);
    const ri = RARITY_ORDER.indexOf(rarity);
    return { uid: newUid(), slot: slot.key, rarity, name: NAMES[slot.key][ri], stat: slot.stat, pct: DH.RARITIES[rarity].pct };
  };
  DH.signatureName = function (heroId) {
    const d = DH.HEROES[heroId]; if (!d) return '專屬武器';
    const idx = Object.values(DH.HEROES).filter(h => h.classKey === d.classKey).findIndex(h => h.id === heroId);
    return (SIGNATURE_NAMES[d.classKey] || [])[idx] || `${d.name}的專屬武器`;
  };
  DH.makeSignature = function (heroId) {
    return { uid: newUid(), slot: 'weapon', rarity: 'signature', name: DH.signatureName(heroId), stat: 'atk', pct: 0.20, bonus: { hp: 0.10 }, heroId, level: 1 };
  };
  DH.gearLabel = g => `${DH.RARITIES[g.rarity].name}·${g.name}${g.rarity === 'signature' ? ` Lv.${g.level || 1}` : ''}`;
  // 專武依等級的實際數值
  DH.gearEffective = g => g.rarity === 'signature' ? { pct: DH.sigBasePct(g.level), bonus: { hp: DH.sigHpPct(g.level) } } : { pct: g.pct, bonus: g.bonus };
  DH.gearStatLabel = g => {
    const e = DH.gearEffective(g);
    const main = `${{ atk: '攻擊', hp: '生命', def: '防禦' }[g.stat]} +${Math.round(e.pct * 100)}%`;
    if (e.bonus) return main + Object.entries(e.bonus).map(([k, v]) => `、${{ atk: '攻擊', hp: '生命', def: '防禦' }[k]} +${Math.round(v * 100)}%`).join('');
    return main;
  };
  DH.RARITY_ORDER = RARITY_ORDER;
})(window.DH);
