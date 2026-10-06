// 專屬武器效果
//   種族效果：同種族共通（裝備專武即啟動）
//   武器特性：每位英雄獨有一條
//   專武等級 1～5：基礎加成與效果數值皆隨等級成長（每級 +15%）
(function (DH) {
  DH.SIG_LEVEL_MAX = 5;
  DH.sigScale = lvl => 1 + 0.15 * ((lvl || 1) - 1);
  const pct = (v, lvl) => Math.round(v * DH.sigScale(lvl));

  DH.SIG_SPECIES = {
    human:     { name: '多才',   desc: lvl => `額外獲得一個天賦槽；擔任隊長時，隊長加成改為給全隊（不限顏色）` },
    elf:       { name: '疾影',   desc: lvl => `上一個怪物回合沒有被打中時，攻擊力 +${pct(30, lvl)}%；遠程與魔法攻擊不會被友方擋線` },
    dwarf:     { name: '礦心',   desc: lvl => `每場戰鬥第一次受到致命傷害時保留 1 HP；防禦 +${pct(20, lvl)}` },
    orc:       { name: '血怒',   desc: lvl => `每擊殺一隻怪物，本場攻擊力 +${pct(8, lvl)}%（最多 +${pct(40, lvl)}%）` },
    dragonkin: { name: '龍息',   desc: lvl => `攻擊時對目標相鄰的怪物造成 ${pct(40, lvl)}% 攻擊力的濺射傷害並附加灼燒` },
    halfling:  { name: '幸運',   desc: lvl => `會心機率 +${pct(25, lvl)}%；怪物攻擊有 ${pct(20, lvl)}% 機率落空` },
    angel:     { name: '聖翼',   desc: lvl => `行動時治療輔助模式（無輔助模式則為相鄰格）內友方 ${pct(8, lvl)}% 最大 HP；被攻擊時 ${pct(30, lvl)}% 機率無效化` },
  };

  // 特性原型：key → desc(params, lvl)
  const T = DH.SIG_TRAITS = {
    kill_heal:     (p, l) => `擊殺怪物時回復 ${pct(p[0], l)}% 最大 HP`,
    kill_shield:   (p, l) => `擊殺怪物時獲得 ${pct(p[0], l)}% 最大 HP 的護盾`,
    hit_poison:    (p, l) => `命中的怪物中毒 ${p[0]} 回合（每回合 ${pct(p[1], l)}% 攻擊力）`,
    hit_burn:      (p, l) => `命中的怪物灼燒 ${p[0]} 回合（每回合 ${pct(p[1], l)}% 攻擊力）`,
    hit_slow:      (p, l) => `命中的怪物下回合速度 -${p[0]}`,
    hit_stun:      (p, l) => `命中時有 ${pct(p[0], l)}% 機率使怪物下回合無法行動（巨型除外）`,
    multi_bonus:   (p, l) => `同時命中 ${p[0]} 個以上目標時傷害 +${pct(p[1], l)}%`,
    single_bonus:  (p, l) => `只命中 1 個目標時傷害 +${pct(p[0], l)}%`,
    vs_tag:        (p, l) => `對${{ beast: '野獸', big: '巨型怪物', armor: '重甲怪物', flying: '飛行怪物' }[p[0]]}傷害 +${pct(p[1], l)}%`,
    color_adv_up:  (p, l) => `顏色克制倍率提升到 ${(1.5 + p[0] * DH.sigScale(l)).toFixed(2)} 倍`,
    ignore_resist: (p, l) => `無視顏色被克制的減免`,
    first_strike:  (p, l) => `行動順序第 1 位時傷害 +${pct(p[0], l)}%`,
    last_strike:   (p, l) => `行動順序最後一位時傷害 +${pct(p[0], l)}%`,
    unmoved_bonus: (p, l) => `這回合沒有移動時傷害 +${pct(p[0], l)}%`,
    moved_bonus:   (p, l) => `這回合有移動（被拖曳或交換）時傷害 +${pct(p[0], l)}%`,
    low_hp_dmg:    (p, l) => `HP 低於 50% 時傷害 +${pct(p[0], l)}%`,
    low_hp_def:    (p, l) => `HP 低於 50% 時受到的傷害 -${pct(p[0], l)}%`,
    execute:       (p, l) => `攻擊後 HP 低於 ${pct(p[0], l)}% 的非巨型怪物直接倒下`,
    counter:       (p, l) => `被近戰攻擊時反擊 ${pct(p[0], l)}% 攻擊力`,
    reflect:       (p, l) => `被攻擊時反彈 ${pct(p[0], l)}% 傷害`,
    regen_turn:    (p, l) => `每回合開始回復 ${pct(p[0], l)}% 最大 HP`,
    heal_boost:    (p, l) => `輔助治療量 +${pct(p[0], l)}%`,
    support_atk:   (p, l) => `輔助模式內的友方下回合攻擊力 +${pct(p[0], l)}%`,
    support_def:   (p, l) => `輔助模式內的友方獲得 ${pct(p[0], l)}% 最大 HP 的護盾`,
    shield_start:  (p, l) => `每波開始時獲得 ${pct(p[0], l)}% 最大 HP 的護盾`,
    drag_time:     (p, l) => `拖曳時限 +${(p[0] * DH.sigScale(l)).toFixed(1)} 秒`,
    pattern_all:   (p, l) => `攻擊模式升級為八方`,
    range_pierce:  (p, l) => `遠程攻擊改為穿透整條線`,
    grant:         (p, l) => `獲得天賦【${DH.TALENTS[p[0]].name}】：${DH.TALENTS[p[0]].desc}`,
    dodge:         (p, l) => `怪物攻擊有 ${pct(p[0], l)}% 機率落空`,
    lifesteal:     (p, l) => `回復造成傷害 ${pct(p[0], l)}% 的 HP`,
    chain:         (p, l) => `攻擊後對最近的另一隻怪物造成 ${pct(p[0], l)}% 攻擊力傷害`,
    turn1_bonus:   (p, l) => `第 1 回合傷害 +${pct(p[0], l)}%`,
    terrain_immune:(p, l) => `無視冰、火、泥地形`,
    fire_walker:   (p, l) => `免疫火地形，站在火上時攻擊力 +${pct(p[0], l)}%`,
    ice_skater:    (p, l) => `冰上滑行後的下一次攻擊傷害 +${pct(p[0], l)}%`,
    poison_amp:    (p, l) => `對中毒的怪物傷害 +${pct(p[0], l)}%`,
    burn_amp:      (p, l) => `對灼燒的怪物傷害 +${pct(p[0], l)}%`,
    swap_heal:     (p, l) => `被交換位置時回復 ${pct(p[0], l)}% 最大 HP`,
    swap_buff:     (p, l) => `被交換位置時下次攻擊傷害 +${pct(p[0], l)}%`,
    push_far:      (p, l) => `推擠可把怪物推 2 格，被推到牆或單位時受 ${pct(p[0], l)}% 攻擊力傷害`,
    hp_to_atk:     (p, l) => `每損失 10% HP，攻擊力 +${pct(p[0], l)}%`,
    def_to_atk:    (p, l) => `每 10 點防禦提供 ${pct(p[0], l)}% 攻擊力`,
    team_def:      (p, l) => `全隊防禦 +${pct(p[0], l)}`,
    team_atk:      (p, l) => `全隊攻擊力 +${pct(p[0], l)}%`,
    boss_slayer:   (p, l) => `對 Boss 傷害 +${pct(p[0], l)}%，Boss 對自己的傷害 -${pct(p[1], l)}%`,
    wave_heal:     (p, l) => `每波開始時全隊回復 ${pct(p[0], l)}% 最大 HP`,
  };

  // 每位英雄獨有的武器特性：heroId → [特性名, 原型, 參數]
  DH.HERO_SIG = {
    // 騎士
    knight:        ['守護誓言', 'team_def', [8]],
    knight2:       ['礦車衝撞', 'counter', [60]],
    knight3:       ['旗手號令', 'support_def', [12]],
    knight4:       ['背棄者的怒', 'low_hp_dmg', [40]],
    knight5:       ['龍息盾擊', 'reflect', [35]],
    // 戰士
    warrior:       ['礦坑劈砍', 'multi_bonus', [2, 30]],
    warrior2:      ['磨刀石', 'turn1_bonus', [50]],
    warrior3:      ['八方皆敵', 'pattern_all', []],
    warrior4:      ['逆族月斬', 'single_bonus', [45]],
    warrior5:      ['不滅火紋', 'fire_walker', [30]],
    // 弓手
    archer:        ['林語穿心', 'execute', [15]],
    archer2:       ['矮影狙擊', 'first_strike', [40]],
    archer3:       ['獵場看守', 'vs_tag', ['beast', 60]],
    archer4:       ['藍焰箭雨', 'hit_burn', [2, 20]],
    archer5:       ['支柱重射', 'range_pierce', []],
    // 法師
    mage:          ['藏書智慧', 'color_adv_up', [0.5]],
    mage2:         ['焦餐爆炸', 'chain', [50]],
    mage3:         ['微光祝福', 'regen_turn', [6]],
    mage4:         ['吼咒震懾', 'hit_stun', [25]],
    mage5:         ['摘星隕落', 'multi_bonus', [3, 50]],
    // 牧師
    cleric:        ['晨禱', 'heal_boost', [50]],
    cleric2:       ['繃帶之術', 'wave_heal', [15]],
    cleric3:       ['麥酒祝福', 'support_atk', [20]],
    cleric4:       ['玫瑰庇護', 'support_def', [15]],
    cleric5:       ['骨歌共鳴', 'lifesteal', [40]],
    // 盜賊
    rogue:         ['無聲潛行', 'dodge', [25]],
    rogue2:        ['順手一刀', 'moved_bonus', [35]],
    rogue3:        ['影語毒刃', 'poison_amp', [60]],
    rogue4:        ['巨影壓制', 'hit_slow', [1]],
    rogue5:        ['雙生暗殺', 'execute', [20]],
    // 蠻族
    barbarian:     ['破門推擊', 'push_far', [50]],
    barbarian2:    ['凍土之心', 'terrain_immune', []],
    barbarian3:    ['拔根狂力', 'hp_to_atk', [6]],
    barbarian4:    ['不合理怪力', 'single_bonus', [50]],
    barbarian5:    ['推山', 'vs_tag', ['big', 60]],
    // 聖騎士
    paladin:       ['刻名誓約', 'team_def', [10]],
    paladin2:      ['兒童尺寸的勇氣', 'shield_start', [20]],
    paladin3:      ['聖徽加護', 'heal_boost', [40]],
    paladin4:      ['柔光護盾', 'support_def', [18]],
    paladin5:      ['熾信審判', 'boss_slayer', [40, 25]],
    // 德魯伊
    druid:         ['不語之樹', 'regen_turn', [8]],
    druid2:        ['松鼠突襲', 'chain', [40]],
    druid3:        ['蘑菇孢子', 'hit_poison', [3, 25]],
    druid4:        ['沼澤慢行', 'hit_slow', [1]],
    druid5:        ['開花之地', 'wave_heal', [20]],
    // 女巫
    witch:         ['大鍋詛咒', 'poison_amp', [50]],
    witch2:        ['掃帚低飛', 'drag_time', [1.5]],
    witch3:        ['月之凝視', 'hit_stun', [30]],
    witch4:        ['三炸爐火', 'burn_amp', [60]],
    witch5:        ['血巫契約', 'lifesteal', [60]],
    // 獵人
    hunter:        ['斜角弩擊', 'vs_tag', ['flying', 70]],
    hunter2:       ['邊境獵術', 'vs_tag', ['beast', 70]],
    hunter3:       ['獵首', 'execute', [18]],
    hunter4:       ['嗅跡追獵', 'ignore_resist', []],
    hunter5:       ['獵龍', 'boss_slayer', [50, 20]],
    // 吟遊詩人
    bard:          ['走音戰歌', 'support_atk', [25]],
    bard2:         ['三首歌', 'wave_heal', [12]],
    bard3:         ['忘痛之曲', 'heal_boost', [60]],
    bard4:         ['崩坑戰歌', 'team_atk', [8]],
    bard5:         ['龍吟', 'team_atk', [12]],
    // 公主
    princess:      ['布陣號令', 'drag_time', [2]],
    princess2:     ['投票結界', 'support_def', [20]],
    princess3:     ['出走的勇氣', 'moved_bonus', [40]],
    princess4:     ['純鐵王冠', 'team_def', [12]],
    princess5:     ['黑焰結界', 'reflect', [40]],
    // 元素使
    elementalist:  ['八方火球', 'multi_bonus', [3, 45]],
    elementalist2: ['室內雨', 'hit_slow', [1]],
    elementalist3: ['心情光球', 'color_adv_up', [0.6]],
    elementalist4: ['脾氣火球', 'burn_amp', [50]],
    elementalist5: ['走動的影子', 'dodge', [30]],
    // 守護者
    guardian:      ['不動如山', 'unmoved_bonus', [50]],
    guardian2:     ['高過本人之盾', 'shield_start', [25]],
    guardian3:     ['排隊', 'grant', ['taunt']],
    guardian4:     ['荊棘巨錘', 'reflect', [45]],
    guardian5:     ['推不開', 'low_hp_def', [40]],
    // 天使
    paladin6:      ['天啟審判', 'boss_slayer', [45, 30]],
    cleric6:       ['聖歌', 'wave_heal', [25]],
    archer6:       ['光羽箭', 'hit_stun', [30]],
    princess6:     ['天界結界', 'support_def', [25]],
    mage6:         ['晨星', 'chain', [60]],
  };

  DH.sigTraitFor = function (heroId) {
    const row = DH.HERO_SIG[heroId]; if (!row) return null;
    return { name: row[0], key: row[1], params: row[2] };
  };
  DH.sigTraitDesc = function (heroId, lvl) { const t = DH.sigTraitFor(heroId); return t ? T[t.key](t.params, lvl || 1) : ''; };
  DH.sigSpeciesDesc = function (species, lvl) { const s = DH.SIG_SPECIES[species]; return s ? s.desc(lvl || 1) : ''; };
  DH.sigBasePct = lvl => 0.20 + 0.04 * ((lvl || 1) - 1);
  DH.sigHpPct = lvl => 0.10 + 0.02 * ((lvl || 1) - 1);
})(window.DH);
