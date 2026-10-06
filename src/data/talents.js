// 天賦：自動觸發的被動技能
(function (DH) {
  DH.TALENTS = {
    shield:         { name: '護盾',   icon: '盾', desc: '受到的傷害 -20%' },
    taunt:          { name: '嘲諷',   icon: '吼', desc: '能攻擊到此英雄的怪物會優先攻擊他' },
    whirlwind:      { name: '旋風',   icon: '旋', desc: '同時攻擊 3 個以上方向時傷害 +25%' },
    finishing_blow: { name: '致命一擊', icon: '斬', desc: '對 HP 低於 50% 的怪物傷害 +50%' },
    burn:           { name: '灼燒',   icon: '焰', desc: '命中的怪物灼燒 2 回合，每回合受 15% 攻擊力傷害' },
    heal:           { name: '治癒',   icon: '癒', desc: '攻擊時同時治療攻擊線上的友方（攻擊力 ×1.5）' },
    tumble:         { name: '翻滾',   icon: '翻', desc: '拖曳時可與怪物交換位置' },
    poison:         { name: '毒刃',   icon: '毒', desc: '命中的怪物中毒 3 回合，每回合受 20% 攻擊力傷害' },
    push:           { name: '推擠',   icon: '推', desc: '拖曳時可將怪物向前推一格' },
    berserk:        { name: '狂暴',   icon: '狂', desc: 'HP 低於 50% 時傷害 +30%' },
    // 怪物天賦
    armor:          { name: '重甲',   icon: '甲', desc: '受到的傷害 -20%（每層）' },
    beast:          { name: '野獸',   icon: '獸', desc: '受到的近戰傷害 -50%' },
    fury:           { name: '怒火',   icon: '怒', desc: 'HP 全滿時攻擊力 +25%' },
    venom:          { name: '劇毒',   icon: '毒', desc: '命中的英雄中毒 2 回合' },
    big:            { name: '巨型',   icon: '巨', desc: '不受嘲諷、推擠與翻滾影響' },
  };
})(window.DH);
