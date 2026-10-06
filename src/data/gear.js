// 裝備：六個部位，四種稀有度；每件依稀有度加成一項屬性（攻擊／生命／防禦）
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
  };
  const NAMES = {
    weapon: ['鐵刃', '獵風', '龍牙', '星辰'],
    armor:  ['皮甲', '鏈甲', '龍鱗甲', '聖輝甲'],
    helmet: ['皮帽', '鐵盔', '角盔', '王冠盔'],
    boots:  ['草鞋', '旅靴', '疾風靴', '天行靴'],
    ring:   ['銅戒', '銀戒', '血玉戒', '星輝戒'],
    amulet: ['木符', '骨符', '龍心符', '聖光符'],
  };
  const RARITY_ORDER = ['magic', 'epic', 'mythic', 'legendary'];
  let gearUid = 1;

  DH.rollRarity = function (bias) {
    // bias 越高，稀有度越高（地牢編號）
    const w = RARITY_ORDER.map((k, i) => DH.RARITIES[k].weight * Math.pow(1 + 0.25 * (bias || 0), i));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return RARITY_ORDER[i]; }
    return 'magic';
  };
  DH.makeGear = function (slotKey, rarity) {
    const slot = DH.GEAR_SLOTS.find(s => s.key === slotKey) || DH.GEAR_SLOTS[Math.floor(Math.random() * 6)];
    rarity = rarity || DH.rollRarity(0);
    const ri = RARITY_ORDER.indexOf(rarity);
    return { uid: 'g' + (gearUid++) + '_' + Date.now().toString(36), slot: slot.key, rarity, name: NAMES[slot.key][ri], stat: slot.stat, pct: DH.RARITIES[rarity].pct };
  };
  DH.gearLabel = g => `${DH.RARITIES[g.rarity].name}·${g.name}`;
  DH.gearStatLabel = g => `${{ atk: '攻擊', hp: '生命', def: '防禦' }[g.stat]} +${Math.round(g.pct * 100)}%`;
  DH.RARITY_ORDER = RARITY_ORDER;
})(window.DH);
