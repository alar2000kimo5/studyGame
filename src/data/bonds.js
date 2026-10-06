// 緣份：英雄之間的關係加成
//   type: team   同隊時生效（正緣或負緣）
//         sig    對方裝備專武時生效（partner 指持有專武的一方）
//         death  對方（或任一隊友）陣亡時觸發，持續整場
//         forbid 不能同隊
//         combo  合體大絕招：兩人能量都滿時，施放其中一人的大絕招會改放合體技
//   stats: { heroId 或 'all': { atk:%, hp:%, def:+, energy:%, crit:%, heal:%, dodge:%, vsBeast:%, poisonAmp:%, supportAtk:%, iceImmune:true } }
(function (DH) {
  const B = (id, name, type, heroes, desc, extra) => Object.assign({ id, name, type, heroes, desc }, extra || {});
  DH.BONDS = [
    // ── 組隊（正緣，多為高星帶低星）──
    B('b01', '村莊的誓約', 'team', ['knight', 'princess'], '公主親自冊封的騎士。艾倫 攻擊 +20%、生命 +20%；艾莉絲 防禦 +10', { stats: { knight: { atk: 20, hp: 20 }, princess: { def: 10 } } }),
    B('b02', '礦坑兄弟', 'team', ['warrior', 'knight2', 'cleric3'], '三個矮人一起長大。全員 生命 +15%、防禦 +8', { stats: { all: { hp: 15, def: 8 } } }),
    B('b03', '森林守衛', 'team', ['archer', 'druid'], '同一片森林的守衛。莉亞 攻擊 +15%；歐文 能量獲得 +25%', { stats: { archer: { atk: 15 }, druid: { energy: 25 } } }),
    B('b04', '塔中師徒', 'team', ['mage', 'mage2'], '梅林唯一肯收的學徒。諾拉 攻擊 +30%、生命 +20%；梅林 能量獲得 +20%', { stats: { mage2: { atk: 30, hp: 20 }, mage: { energy: 20 } } }),
    B('b05', '修道院同窗', 'team', ['cleric', 'cleric2'], '一起包過太多圈繃帶。兩人治療量 +30%；布麗 生命 +20%', { stats: { all: { heal: 30 }, cleric2: { hp: 20 } } }),
    B('b06', '街頭搭檔', 'team', ['rogue', 'rogue2'], '偷同一條街的錢包。兩人會心機率 +15%；瑪拉 攻擊 +25%', { stats: { all: { crit: 15 }, rogue2: { atk: 25 } } }),
    B('b07', '北境雙雄', 'team', ['barbarian', 'barbarian2'], '凍土上的撞門二人組。兩人 攻擊 +15%；烏娜 生命 +25%', { stats: { all: { atk: 15 }, barbarian2: { hp: 25 } } }),
    B('b08', '聖光騎士團', 'team', ['paladin', 'paladin2', 'knight'], '團長帶著兩個新人。托比、艾倫 防禦 +15、生命 +20%；賽琳 能量獲得 +20%', { stats: { paladin2: { def: 15, hp: 20 }, knight: { def: 15, hp: 20 }, paladin: { energy: 20 } } }),
    B('b09', '天界使者', 'team', ['paladin6', 'cleric6', 'archer6', 'princess6', 'mage6', 'clericL'], '兩位以上天使同隊時，每位天使 生命 +10%、能量獲得 +15%', { need: 2, stats: { all: { hp: 10, energy: 15 } } }),
    B('b10', '龍裔血脈', 'team', ['elementalist', 'guardian'], '一攻一守的龍裔。澤恩 攻擊 +15%；霍克 防禦 +15', { stats: { elementalist: { atk: 15 }, guardian: { def: 15 } } }),
    B('b11', '半身人村', 'team', ['princess2', 'archer2', 'guardian2'], '全村最有名的三個人。全員 攻擊 +25%、生命 +25%、防禦 +10', { stats: { all: { atk: 25, hp: 25, def: 10 } } }),
    B('b12', '酒館樂團', 'team', ['bard2', 'bard'], '兩把琴一起走音。莉莉 攻擊 +30%；兩人鼓舞效果 +10%', { stats: { bard2: { atk: 30 }, all: { supportAtk: 10 } } }),
    B('b13', '獵人同盟', 'team', ['hunter', 'hunter2', 'archer3'], '邊境獵戶的聚會。全員對野獸 +20%；黎恩 攻擊 +25%', { stats: { all: { vsBeast: 20 }, hunter2: { atk: 25 } } }),
    B('b14', '元素學徒', 'team', ['elementalist2', 'mageL'], '伏爾特看上了這個會下室內雨的少年。提奧 攻擊 +40%、能量獲得 +30%；伏爾特 能量獲得 +10%', { stats: { elementalist2: { atk: 40, energy: 30 }, mageL: { energy: 10 } } }),
    B('b15', '沼澤姐妹', 'team', ['witch', 'druid4'], '同一片沼澤的隱士。兩人中毒傷害 +50%、攻擊 +10%', { stats: { all: { poisonAmp: 50, atk: 10 } } }),
    B('b16', '王女與女王', 'team', ['princess', 'princessL'], '兩位王室同台。全隊能量獲得 +20%', { stats: { team: { energy: 20 } } }),
    B('b17', '礦山父女', 'team', ['archer5', 'princess4'], '索林的弓是為女兒做的。布琳希 生命 +30%、防禦 +15；索林 攻擊 +10%', { stats: { princess4: { hp: 30, def: 15 }, archer5: { atk: 10 } } }),
    B('b18', '冰原同行', 'team', ['hunter5', 'witch3'], '一起橫越雪原的夥伴。伊索德 攻擊 +30%；兩人在冰上不會滑行', { stats: { witch3: { atk: 30 }, all: { iceImmune: true } } }),
    B('b19', '邊境守望', 'team', ['guardian3', 'hunter2', 'warrior2'], '守同一道城門的三個普通人。全員 防禦 +12、生命 +15%', { stats: { all: { def: 12, hp: 15 } } }),
    B('b20', '精靈王室', 'team', ['princess3', 'paladin4', 'knight3'], '出走的王女和兩位追來的護衛。全員 防禦 +10；艾爾瑞 攻擊 +25%', { stats: { all: { def: 10 }, princess3: { atk: 25 } } }),
    B('b21', '三鱗', 'team', ['rogue5', 'druid5', 'bard5'], '名字都帶鱗的龍裔三人組。全員 攻擊 +12%、能量獲得 +15%', { stats: { all: { atk: 12, energy: 15 } } }),
    B('b22', '獸人部落', 'team', ['warrior3', 'hunter3', 'elementalist4'], '同一個部落的戰士、獵頭者與火術士。全員 攻擊 +15%、生命 +10%', { stats: { all: { atk: 15, hp: 10 } } }),
    B('b23', '鬍子協會', 'team', ['warrior', 'bard4', 'guardian5'], '矮人鬍子協會的三位幹部。全員 防禦 +10、生命 +10%；布倫 攻擊 +20%', { stats: { all: { def: 10, hp: 10 }, warrior: { atk: 20 } } }),
    B('b24', '龍之女與龍', 'team', ['princess5', 'elementalist'], '夜焰的黑焰結界與澤恩的火球。兩人 攻擊 +10%、能量獲得 +20%', { stats: { all: { atk: 10, energy: 20 } } }),
    B('b25', '新兵與團長', 'team', ['warrior2', 'warriorL'], '瑞克斯說卡拉是他見過最有潛力的新兵。卡拉 攻擊 +40%、生命 +30%', { stats: { warrior2: { atk: 40, hp: 30 } } }),
    // ── 專武緣：對方裝備專武時 ──
    B('b26', '鑄劍師的徒弟', 'sig', ['knight2', 'knightL'], '塞巴斯的劍是羅德鑄的。塞巴斯裝備專武時，羅德 攻擊 +25%、防禦 +10', { partner: 'knightL', stats: { knight2: { atk: 25, def: 10 } } }),
    B('b27', '弓之傳承', 'sig', ['archer2', 'archerL'], '希爾維亞教皮普拉弓。希爾維亞裝備專武時，皮普 攻擊 +35%、會心 +15%', { partner: 'archerL', stats: { archer2: { atk: 35, crit: 15 } } }),
    B('b28', '借閱的法杖', 'sig', ['mage2', 'mage'], '梅林裝備專武時，諾拉能借到另一本書。諾拉 攻擊 +30%、能量獲得 +20%', { partner: 'mage', stats: { mage2: { atk: 30, energy: 20 } } }),
    B('b29', '聖錘的祝福', 'sig', ['paladin2', 'paladin'], '賽琳裝備專武時，托比 生命 +30%、治療量 +20%', { partner: 'paladin', stats: { paladin2: { hp: 30, heal: 20 } } }),
    B('b30', '影之師', 'sig', ['rogue2', 'rogueL'], '零裝備專武時，瑪拉學會了消失。瑪拉 閃避 +20%、攻擊 +15%', { partner: 'rogueL', stats: { rogue2: { dodge: 20, atk: 15 } } }),
    B('b31', '戰鼓與斧', 'sig', ['warrior', 'bard4'], '岡姆裝備專武時鼓聲更響。布倫 攻擊 +20%、能量獲得 +20%', { partner: 'bard4', stats: { warrior: { atk: 20, energy: 20 } } }),
    // ── 遺志緣：陣亡觸發 ──
    B('b32', '復仇之火', 'death', ['warrior2', '*'], '任一隊友陣亡時，卡拉 攻擊 +40%（整場）', { on: '*', to: 'warrior2', effect: { atk: 40 } }),
    B('b33', '守護的誓言', 'death', ['knight', 'princess'], '艾莉絲陣亡時，艾倫 攻擊 +50%、防禦 +20、能量 +50', { on: 'princess', to: 'knight', effect: { atk: 50, def: 20, energy: 50 } }),
    B('b34', '悲歌', 'death', ['bard2', '*'], '任一隊友陣亡時，莉莉為全隊回復 15% 最大 HP', { on: '*', to: 'bard2', effect: { teamHeal: 15 } }),
    B('b35', '北境之怒', 'death', ['barbarian', 'barbarian2'], '烏娜陣亡時，戈登 攻擊 +60%', { on: 'barbarian2', to: 'barbarian', effect: { atk: 60 } }),
    B('b36', '最後的祈禱', 'death', ['cleric2', 'cleric'], '瑟拉陣亡時，布麗治療量 +100%、能量 +100', { on: 'cleric', to: 'cleric2', effect: { heal: 100, energy: 100 } }),
    B('b37', '師父的遺志', 'death', ['mage2', 'mage'], '梅林陣亡時，諾拉 攻擊 +60%、能量 +50', { on: 'mage', to: 'mage2', effect: { atk: 60, energy: 50 } }),
    // ── 負緣 ──
    B('b38', '宿敵', 'team', ['knight4', 'warrior3'], '叛離部落的騎士與部落戰士互看不順眼。同隊時兩人 攻擊 -15%', { negative: true, stats: { all: { atk: -15 } } }),
    B('b39', '信仰不合', 'team', ['witch', 'cleric'], '女巫與牧師吵個不停。同隊時兩人治療量 -30%', { negative: true, stats: { all: { heal: -30 } } }),
    B('b40', '搶鋒頭', 'team', ['warriorL', 'barbarianL'], '兩個都想先衝。同隊時兩人能量獲得 -30%', { negative: true, stats: { all: { energy: -30 } } }),
    B('b41', '噪音', 'team', ['bard4', 'witch3'], '月巫需要安靜，矮人戰歌手不懂。伊索德 攻擊 -20%', { negative: true, stats: { witch3: { atk: -20 } } }),
    B('b42', '龍與獵龍人', 'team', ['hunter5', 'elementalist'], '霜牙總是盯著澤恩看。同隊時兩人 防禦 -10', { negative: true, stats: { all: { def: -10 } } }),
    B('b43', '同一個人？', 'forbid', ['rogueL', 'rogue'], '零和奇洛從沒同時出現過，不能同隊', {}),
    B('b44', '天與地', 'forbid', ['cleric5', 'clericL'], '獸人薩滿與天使牧師的歌互相抵消，不能同隊', {}),
    // ── 合體大絕招 ──
    B('b45', '王國的誓約', 'combo', ['princess', 'paladin'], '合體技「聖王號令」：全隊護盾 40%、回復 30%，全場亡靈與惡魔 300%、其他 180% 攻擊力傷害', { combo: 'royal_judgment', comboName: '聖王號令' }),
    B('b46', '龍焰壁壘', 'combo', ['elementalist', 'guardian'], '合體技「龍焰壁壘」：全場 250% 傷害並灼燒；所有怪物下回合必須攻擊霍克，霍克反彈 80%', { combo: 'dragon_wall', comboName: '龍焰壁壘' }),
    B('b47', '雙星', 'combo', ['mage5', 'mageL'], '合體技「雷霆隕石」：全場 350% 傷害，50% 機率暈眩', { combo: 'thunder_meteor', comboName: '雷霆隕石' }),
    B('b48', '天界合唱', 'combo', ['paladin6', 'cleric6', 'princess6'], '任兩位合體技「天界聖詠」：全隊回滿、護盾 50%，全場 150% 傷害', { need: 2, combo: 'heaven_choir', comboName: '天界聖詠' }),
    B('b49', '影之雙殺', 'combo', ['rogueL', 'rogue5'], '合體技「雙影處決」：對 HP 最低的兩隻怪物 500% 傷害，HP 低於 40% 直接處決', { combo: 'twin_shadow', comboName: '雙影處決' }),
    B('b50', '狂瀾安可', 'combo', ['bardL', 'warriorL'], '合體技「狂瀾安可」：瑞克斯立刻攻擊兩輪，全隊攻擊 +50% 一回合', { combo: 'encore_rush', comboName: '狂瀾安可' }),
  ];
  DH.bondsOf = heroId => DH.BONDS.filter(b => b.heroes.includes(heroId) || b.heroes.includes('*'));
})(window.DH);
