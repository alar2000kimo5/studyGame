// 克制關係
//   顏色：紅 > 綠 > 藍 > 紅，光與暗互克（×1.5 / 被克 ×0.75）
//   職業：攻擊方式三角 近戰 > 遠程 > 魔法 > 近戰（×1.2 / 被克 ×0.85），加上職業對特定怪物種族的專精
//   種族：英雄種族 vs 怪物種族，互相克制（×1.2 / 被克 ×0.85）
(function (DH) {
  DH.KIND_BEATS = { melee: 'ranged', ranged: 'magic', magic: 'melee' };
  DH.KIND_ADV = 1.2; DH.KIND_DIS = 0.85;
  // 職業專精：對該怪物種族傷害加成
  DH.CLASS_VS_RACE = {
    knight: ['goblinoid', 0.20], warrior: ['beast', 0.20], archer: ['demon', 0.25], mage: ['construct', 0.25], cleric: ['undead', 0.30],
    rogue: ['goblinoid', 0.25], barbarian: ['construct', 0.20], paladin: ['undead', 0.25], druid: ['construct', 0.25], witch: ['dragon', 0.20],
    hunter: ['beast', 0.30], bard: ['goblinoid', 0.15], princess: ['dragon', 0.15], elementalist: ['demon', 0.30], guardian: ['dragon', 0.25],
  };
  // 英雄種族：beats = 克制的怪物種族（攻擊 ×1.2、受其攻擊 ×0.85），weak = 被克制（攻擊 ×0.85、受其攻擊 ×1.2）
  DH.SPECIES_VS_RACE = {
    human:     { beats: 'goblinoid', weak: 'demon' },
    elf:       { beats: 'beast',     weak: 'goblinoid' },
    dwarf:     { beats: 'construct', weak: 'dragon' },
    orc:       { beats: 'beast',     weak: 'undead' },
    dragonkin: { beats: 'dragon',    weak: 'construct' },
    halfling:  { beats: 'demon',     weak: 'beast' },
    angel:     { beats: 'undead',    weak: 'dragon' },
  };
  DH.RACE_ADV = 1.2; DH.RACE_DIS = 0.85;
  DH.kindLabel = k => ({ melee: '近戰', ranged: '遠程', magic: '魔法' }[k]);
})(window.DH);
