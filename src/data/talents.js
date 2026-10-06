// 天賦：自動觸發的被動技能
//   每個英雄有 1 個職業天賦（預設解鎖）＋ 依星數可解鎖的基本天賦（用天賦代幣）＋ 昇華後的昇華天賦
(function (DH) {
  DH.TALENTS = {
    // 職業天賦
    shield:         { name: '護盾',     icon: '盾', desc: '受到的傷害 -20%' },
    taunt:          { name: '嘲諷',     icon: '吼', desc: '能攻擊到此英雄的怪物會優先攻擊他' },
    whirlwind:      { name: '旋風',     icon: '旋', desc: '同時攻擊 3 個以上方向時傷害 +25%' },
    finishing_blow: { name: '致命一擊', icon: '斬', desc: '對 HP 低於 50% 的敵人傷害 +50%' },
    burn:           { name: '灼燒',     icon: '焰', desc: '命中的敵人灼燒 2 回合，每回合受 15% 攻擊力傷害' },
    heal:           { name: '治癒',     icon: '癒', desc: '輔助模式內的友方回復 10% 最大 HP' },
    delayed_heal:   { name: '延遲治癒', icon: '延', desc: '輔助模式內的友方在下回合開始時回復 15% 最大 HP' },
    tumble:         { name: '翻滾',     icon: '翻', desc: '拖曳時可與怪物交換位置' },
    poison:         { name: '毒刃',     icon: '毒', desc: '命中的敵人中毒 3 回合，每回合受 20% 攻擊力傷害' },
    push:           { name: '推擠',     icon: '推', desc: '拖曳時可將怪物向前推一格' },
    berserk:        { name: '狂暴',     icon: '狂', desc: 'HP 低於 50% 時傷害 +30%' },
    lifedrain:      { name: '生命汲取', icon: '汲', desc: '回復造成傷害 30% 的 HP' },
    inspire:        { name: '鼓舞',     icon: '鼓', desc: '輔助模式內的友方下回合攻擊力 +20%' },
    barrier:        { name: '結界',     icon: '界', desc: '輔助模式內的友方獲得 15% 最大 HP 的護盾' },
    thorns:         { name: '荊棘',     icon: '荊', desc: '被近戰攻擊時反彈 25% 傷害' },
    // 基本天賦
    might:          { name: '強力',     icon: '力', desc: '攻擊力 +10%' },
    vigor:          { name: '強健',     icon: '健', desc: '最大 HP +10%' },
    iron_skin:      { name: '鐵膚',     icon: '鐵', desc: '防禦 +15' },
    prepare:        { name: '蓄勢',     icon: '蓄', desc: '這回合沒有移動時傷害 +25%' },
    rune:           { name: '符文',     icon: '符', desc: '對被克制顏色的敵人傷害再 +25%' },
    critical:       { name: '會心',     icon: '心', desc: '25% 機率造成 1.5 倍傷害' },
    parry:          { name: '格擋',     icon: '擋', desc: '受到的近戰傷害 -25%' },
    regen:          { name: '再生',     icon: '生', desc: '每回合開始回復 5% 最大 HP' },
    swift:          { name: '迅捷',     icon: '迅', desc: '拖曳時限 +1 秒（隊伍中有一人即可）' },
    hunter:         { name: '獵殺',     icon: '獵', desc: '對野獸傷害 +50%' },
    // 昇華天賦
    ascended_power: { name: '昇華之力', icon: '昇', desc: '攻擊力與最大 HP +15%' },
    // 怪物天賦
    armor:          { name: '重甲',     icon: '甲', desc: '受到的傷害 -20%（每層）' },
    beast:          { name: '野獸',     icon: '獸', desc: '受到的近戰傷害 -50%' },
    fury:           { name: '怒火',     icon: '怒', desc: 'HP 全滿時攻擊力 +25%' },
    venom:          { name: '劇毒',     icon: '毒', desc: '命中的英雄中毒 2 回合' },
    big:            { name: '巨型',     icon: '巨', desc: '不受嘲諷、推擠與翻滾影響' },
  };
})(window.DH);
