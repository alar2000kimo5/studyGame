// 怪物圖鑑
//   ai: charge 衝鋒 / tactician 戰術 / assassin 刺客 / unpredictable 莫測 / evade 迴避
//   talents 含 flying 的怪物無視地形（不能穿牆）；colors 覆寫造型配色
(function (DH) {
  const M = (id, name, element, pattern, hp, atk, speed, ai, armor, talents, shape, extra) =>
    Object.assign({ id, name, element, pattern, hp, atk, speed, ai, armor, talents, shape }, extra || {});
  DH.MONSTERS = {
    // 第一章 森林 / 第二章 營地
    goblin:        M('goblin', '哥布林', 'green', 'melee_cross', 90, 22, 2, 'charge', 0, [], 'goblin', { race: 'goblinoid' }),
    goblin_archer: M('goblin_archer', '哥布林弓手', 'green', 'ranged_cross', 70, 20, 2, 'evade', 0, [], 'goblin_archer', { race: 'goblinoid' }),
    bat:           M('bat', '洞穴蝙蝠', 'dark', 'melee_cross', 60, 18, 4, 'unpredictable', 0, ['flying'], 'bat', { race: 'beast' }),
    hound:         M('hound', '餓狼', 'red', 'melee_cross', 100, 28, 3, 'assassin', 0, ['beast'], 'hound', { race: 'beast' }),
    shaman:        M('shaman', '哥布林巫師', 'blue', 'magic_cross', 120, 30, 2, 'evade', 0, [], 'shaman', { race: 'goblinoid' }),
    orc:           M('orc', '獸人戰士', 'red', 'melee_all', 200, 34, 2, 'tactician', 1, ['armor', 'fury'], 'orc', { race: 'goblinoid' }),
    goblin_king:   M('goblin_king', '哥布林王', 'green', 'melee_all', 520, 40, 2, 'tactician', 1, ['armor', 'big', 'fury'], 'goblin', { race: 'goblinoid', boss: true, colors: { skin: '#4f8f3a', accent: '#f6c64a' }, size: 1.5 }),
    // 第三章 墓場
    skeleton:      M('skeleton', '骷髏兵', 'dark', 'melee_all', 110, 26, 2, 'charge', 1, ['armor'], 'skeleton', { race: 'undead' }),
    ghoul:         M('ghoul', '食屍鬼', 'dark', 'melee_cross', 140, 30, 3, 'assassin', 0, ['venom'], 'skeleton', { race: 'undead', colors: { bone: '#9fbf8a', boneD: '#6f8f5a' } }),
    lich:          M('lich', '巫妖', 'dark', 'magic_all', 600, 46, 2, 'evade', 1, ['armor', 'big'], 'shaman', { race: 'undead', boss: true, colors: { robe: '#2a1a4a', skin: '#c8c0d8', glow: '#c84cff' }, size: 1.5 }),
    // 第四章 沼澤
    spider:        M('spider', '毒蛛', 'green', 'melee_all', 85, 20, 3, 'unpredictable', 0, ['beast', 'venom'], 'spider', { race: 'beast' }),
    naga:          M('naga', '沼澤水蛇', 'blue', 'ranged_cross', 150, 32, 3, 'evade', 0, ['flying'], 'whelp', { race: 'dragon', colors: { body: '#3a9a8a', dark: '#1f5f55', belly: '#bfe8d8' } }),
    toad:          M('toad', '毒沼蟾蜍', 'green', 'melee_cross', 180, 26, 2, 'charge', 0, ['beast', 'venom'], 'spider', { race: 'beast', colors: { body: '#5a7a2a', accent: '#c8e050' } }),
    hydra:         M('hydra', '沼澤九頭蛇', 'green', 'magic_cross', 700, 44, 2, 'tactician', 1, ['armor', 'big', 'venom'], 'dragon', { race: 'dragon', boss: true, colors: { body: '#3f8f4a', dark: '#245a2c', belly: '#c8e8a0' }, size: 1.6 }),
    // 第五章 雪原
    ice_wolf:      M('ice_wolf', '冰原狼', 'blue', 'melee_cross', 130, 32, 4, 'assassin', 0, ['beast'], 'hound', { race: 'beast', colors: { fur: '#cfe6f6', furD: '#8fb6cc' } }),
    yeti:          M('yeti', '雪怪', 'blue', 'melee_all', 260, 38, 2, 'tactician', 1, ['armor', 'beast'], 'orc', { race: 'goblinoid', colors: { skin: '#e8f2fa', skinD: '#a8c4d8' } }),
    harpy:         M('harpy', '鷹身女妖', 'light', 'melee_cross', 110, 30, 4, 'unpredictable', 0, ['flying'], 'bat', { race: 'demon', colors: { body: '#d8c48a', bodyD: '#9a8a5a', eye: '#3a6aff' } }),
    frost_dragon:  M('frost_dragon', '霜龍', 'blue', 'magic_all', 850, 52, 2, 'tactician', 1, ['armor', 'big', 'flying'], 'dragon', { race: 'dragon', boss: true, colors: { body: '#6fb8e8', dark: '#2f6fa0', belly: '#e8f6ff' }, size: 1.6 }),
    // 第六章 火山
    fire_elemental:M('fire_elemental', '火元素', 'red', 'magic_cross', 160, 36, 3, 'evade', 0, ['flying'], 'golem', { race: 'construct', colors: { rock: '#ff8a3a', rockD: '#c0401a', glow: '#fff0a0' } }),
    lava_golem:    M('lava_golem', '熔岩魔像', 'red', 'melee_cross', 380, 44, 1, 'charge', 2, ['armor', 'big'], 'golem', { race: 'construct', colors: { rock: '#5a2a22', rockD: '#3a1a14', glow: '#ff6a2a' } }),
    imp:           M('imp', '小惡魔', 'red', 'melee_all', 90, 26, 4, 'unpredictable', 0, ['flying'], 'bat', { race: 'demon', colors: { body: '#c83a2a', bodyD: '#7a1a12', eye: '#ffe36a' } }),
    magma_lord:    M('magma_lord', '熔岩領主', 'red', 'melee_all', 900, 58, 2, 'tactician', 2, ['armor', 'big', 'fury'], 'orc', { race: 'demon', boss: true, colors: { skin: '#3a1a14', skinD: '#ff6a2a' }, size: 1.6 }),
    // 第七章 河谷
    crocodile:     M('crocodile', '河鱷', 'green', 'melee_cross', 320, 42, 2, 'charge', 1, ['armor', 'beast'], 'hound', { race: 'beast', colors: { fur: '#4f7a3a', furD: '#2f4f22' }, size: 1.2 }),
    river_naga:    M('river_naga', '河蛇祭司', 'blue', 'magic_cross', 170, 36, 3, 'evade', 0, ['flying'], 'whelp', { race: 'dragon', colors: { body: '#4a8ad8', dark: '#244a88', belly: '#d8ecff' } }),
    river_god:     M('river_god', '河神巨鱷', 'blue', 'melee_all', 950, 56, 3, 'assassin', 1, ['armor', 'big', 'beast'], 'hound', { race: 'dragon', boss: true, colors: { fur: '#2f7a8a', furD: '#1a4a58' }, size: 1.7 }),
    // 第八章 龍巢
    golem:         M('golem', '石魔像', 'light', 'melee_cross', 320, 40, 1, 'charge', 2, ['armor', 'big'], 'golem', { race: 'construct' }),
    whelp:         M('whelp', '幼龍', 'red', 'magic_cross', 240, 36, 2, 'tactician', 0, ['flying'], 'whelp', { race: 'dragon' }),
    dragon:        M('dragon', '赤焰巨龍', 'red', 'magic_all', 900, 55, 2, 'tactician', 1, ['armor', 'big', 'flying'], 'dragon', { race: 'dragon', boss: true }),
    dragon_king:   M('dragon_king', '龍王', 'dark', 'magic_all', 1600, 70, 3, 'tactician', 2, ['armor', 'big', 'flying', 'fury'], 'dragon', { race: 'dragon', boss: true, colors: { body: '#2a2440', dark: '#120e22', belly: '#f6c64a' }, size: 1.9 }),
  };
  DH.RACE_NAMES = { goblinoid: '獸人族', beast: '野獸', undead: '亡靈', dragon: '龍族', construct: '魔像', demon: '惡魔' };
  DH.AI_NAMES = { charge: '衝鋒', tactician: '戰術', assassin: '刺客', unpredictable: '莫測', evade: '迴避' };
})(window.DH);
