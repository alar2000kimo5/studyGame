// 大絕招：4★ 與 5★ 英雄各一招（依職業機制，每位英雄有自己的招式名）；5★ 威力 ×1.25
// 能量：0～100，來源見 DH.ENERGY
(function (DH) {
  DH.ENERGY = {
    attack: 15, extraTarget: 5, hit: 10, kill: 20, dragged: 10, swapped: 10, crystal: 30, allyKill: 5, waveStart: 10,
    sigBonus: 0.25,        // 裝備專武：獲得量 +25%，開場 30
    sigStart: 30,
    focusBonus: 0.5,       // 天賦「蓄能」：獲得量 +50%
    dragonkinBonus: 0.15,  // 龍裔：獲得量 +15%
  };
  const P = (m, p) => Math.round(m * p);
  // 職業招式：desc(power) 說明；effect 由 battle 實作
  DH.ULT_CLASS = {
    knight:       { key: 'shield_charge', desc: p => `全隊獲得 ${P(25, p)}% 最大 HP 的護盾，並對相鄰所有怪物造成 ${P(200, p)}% 攻擊力傷害` },
    warrior:      { key: 'whirl',         desc: p => `對周圍八格所有怪物造成 ${P(260, p)}% 攻擊力傷害` },
    archer:       { key: 'arrow_rain',    desc: p => `對全場所有怪物各造成 ${P(120, p)}% 攻擊力傷害` },
    mage:         { key: 'meteor',        desc: p => `對全場所有怪物造成 ${P(150, p)}% 攻擊力傷害並灼燒 2 回合` },
    cleric:       { key: 'holy_heal',     desc: p => `全隊回復 ${P(40, p)}% 最大 HP 並解除中毒與灼燒` },
    rogue:        { key: 'assassinate',   desc: p => `對 HP 最低的怪物造成 ${P(400, p)}% 攻擊力傷害，非巨型怪物 HP 低於 30% 直接處決` },
    barbarian:    { key: 'quake',         desc: p => `對同一列與同一行的所有怪物造成 ${P(220, p)}% 攻擊力傷害並擊退 1 格` },
    paladin:      { key: 'judgment',      desc: p => `全隊回復 ${P(25, p)}% 最大 HP，對所有怪物造成 ${P(120, p)}%（亡靈與惡魔 ${P(220, p)}%）攻擊力傷害` },
    druid:        { key: 'natures_wrath', desc: p => `全場怪物中毒 3 回合（每回合 ${P(25, p)}% 攻擊力），全隊回復 ${P(20, p)}% 最大 HP` },
    witch:        { key: 'curse',         desc: p => `全場怪物造成 ${P(100, p)}% 攻擊力傷害，並詛咒 1 回合：攻擊力 -30%、受到傷害 +30%` },
    hunter:       { key: 'mark',          desc: p => `對 HP 最高的怪物造成 ${P(350, p)}% 攻擊力傷害並標記：下回合全隊對牠傷害 +50%` },
    bard:         { key: 'war_song',      desc: p => `全隊攻擊力 +${P(40, p)}% 一回合，並讓其他英雄獲得 ${P(30, p)} 能量` },
    princess:     { key: 'royal_decree',  desc: p => `全隊獲得 ${P(30, p)}% 最大 HP 的護盾，本回合全隊傷害 +${P(30, p)}%` },
    elementalist: { key: 'storm',         desc: p => `對全場怪物造成 ${P(180, p)}% 攻擊力傷害，隨機附加灼燒、減速或暈眩` },
    guardian:     { key: 'roar',          desc: p => `所有怪物下回合必須攻擊自己；一回合內自身受傷 -50% 並反彈 ${P(50, p)}% 傷害` },
  };
  // 每位 4★/5★ 英雄的招式名
  DH.HERO_ULT = {
    knight4: '背棄者的誓約', knight5: '龍息聖盾',
    warrior4: '逆族月斬', warrior5: '不滅戰神',
    archer4: '藍焰箭雨', archer5: '支柱天落', archer6: '光羽群星',
    mage4: '圖騰怒吼', mage5: '摘星隕落', mage6: '晨星墜落',
    cleric4: '玫瑰聖詠', cleric5: '骨歌復生', cleric6: '天界聖歌',
    rogue4: '巨影暗殺', rogue5: '雙生之影',
    barbarian4: '不合理地裂', barbarian5: '推山裂地',
    paladin: '刻名審判', paladin5: '熾信審判', paladin6: '天啟審判',
    druid4: '沼澤之怒', druid5: '開花之怒',
    witch: '大鍋詛咒', witch5: '血巫契約',
    hunter4: '嗅跡標記', hunter5: '獵龍標記',
    bard4: '崩坑戰歌', bard5: '龍吟戰歌',
    princess: '王國號令', princess5: '黑焰號令', princess6: '天界號令',
    elementalist: '八方風暴', elementalist5: '影之風暴',
    guardian: '不動咆哮', guardian5: '守門咆哮',
  };
  DH.ultimateFor = function (def) {
    if (!def || def.stars < 4) return null;
    const cls = DH.ULT_CLASS[def.classKey]; if (!cls) return null;
    const power = def.stars >= 5 ? 1.25 : 1;
    return { name: DH.HERO_ULT[def.id] || `${def.name}的絕招`, key: cls.key, power, desc: cls.desc(power) };
  };
})(window.DH);
