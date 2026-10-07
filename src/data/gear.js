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
    exclusive: { name: '職業專屬', color: '#3ae0c8', pct: 0.15, weight: 0,  price: 2500 },
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
  const newUid = () => 'g' + (gearUid++) + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  DH.rarityRank = r => (r === 'signature' || r === 'exclusive') ? 4 : RARITY_ORDER.indexOf(r);
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
    const g = { uid: newUid(), slot: slot.key, rarity, name: NAMES[slot.key][ri], stat: slot.stat, pct: DH.RARITIES[rarity].pct };
    if (DH.rollAffixes) { g.affixes = DH.rollAffixes(slot.key, rarity); g.set = DH.rollSet(rarity); }
    return g;
  };
  DH.makeSignature = function (heroId, variant) {
    if (variant === undefined) variant = Math.floor(Math.random() * 3);
    return { uid: newUid(), slot: 'weapon', rarity: 'signature', name: DH.signatureName(heroId, variant), stat: 'atk', pct: 0.20, bonus: { hp: 0.10 }, heroId, variant, level: 1 };
  };
  DH.gearLabel = g => `${g.rarity === 'exclusive' ? DH.CLASSES[g.classKey].cls : DH.RARITIES[g.rarity].name}·${g.name}${g.rarity === 'signature' || g.rarity === 'exclusive' ? ` Lv.${g.level || 1}` : ''}${g.set ? `［${DH.GEAR_SETS[g.set].name}］` : ''}`;
  // 裝備的詞條／專屬效果文字（不含主屬性）
  DH.gearFxLines = g => g.rarity === 'exclusive' ? Object.entries(DH.classPieceOf(g).fx).map(([k, v]) => DH.fxText(k, v * DH.exclScale(g.level))) : (g.affixes || []).map(([k, v]) => DH.fxText(k, v));
  // 專武依等級的實際數值
  DH.gearEffective = g => g.rarity === 'signature' ? { pct: DH.sigBasePct(g.level), bonus: { hp: DH.sigHpPct(g.level) } } : g.rarity === 'exclusive' ? { pct: DH.exclPct(g.level) } : { pct: g.pct, bonus: g.bonus };
  DH.gearStatLabel = g => {
    const e = DH.gearEffective(g);
    const main = `${{ atk: '攻擊', hp: '生命', def: '防禦' }[g.stat]} +${Math.round(e.pct * 100)}%`;
    if (e.bonus) return main + Object.entries(e.bonus).map(([k, v]) => `、${{ atk: '攻擊', hp: '生命', def: '防禦' }[k]} +${Math.round(v * 100)}%`).join('');
    return main;
  };
  DH.RARITY_ORDER = RARITY_ORDER;
})(window.DH);
