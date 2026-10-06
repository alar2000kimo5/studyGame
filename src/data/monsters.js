// 怪物圖鑑
//   ai: charge 衝鋒 / tactician 戰術 / assassin 刺客 / unpredictable 莫測 / evade 迴避
(function (DH) {
  DH.MONSTERS = {
    goblin:        { id: 'goblin',        name: '哥布林',   element: 'green', pattern: 'melee_cross',  hp: 90,  atk: 22, speed: 2, ai: 'charge',        armor: 0, talents: [],          shape: 'goblin' },
    goblin_archer: { id: 'goblin_archer', name: '哥布林弓手', element: 'green', pattern: 'ranged_cross', hp: 70,  atk: 20, speed: 2, ai: 'evade',         armor: 0, talents: [],          shape: 'goblin_archer' },
    skeleton:      { id: 'skeleton',      name: '骷髏兵',   element: 'dark',  pattern: 'melee_all',    hp: 110, atk: 26, speed: 2, ai: 'charge',        armor: 1, talents: ['armor'],   shape: 'skeleton' },
    bat:           { id: 'bat',           name: '洞穴蝙蝠', element: 'dark',  pattern: 'melee_cross',  hp: 60,  atk: 18, speed: 4, ai: 'unpredictable', armor: 0, talents: [],          shape: 'bat' },
    hound:         { id: 'hound',         name: '餓狼',     element: 'red',   pattern: 'melee_cross',  hp: 100, atk: 28, speed: 3, ai: 'assassin',      armor: 0, talents: ['beast'],   shape: 'hound' },
    spider:        { id: 'spider',        name: '毒蛛',     element: 'green', pattern: 'melee_all',    hp: 85,  atk: 20, speed: 3, ai: 'unpredictable', armor: 0, talents: ['beast', 'venom'], shape: 'spider' },
    orc:           { id: 'orc',           name: '獸人戰士', element: 'red',   pattern: 'melee_all',    hp: 200, atk: 34, speed: 2, ai: 'tactician',     armor: 1, talents: ['armor', 'fury'], shape: 'orc' },
    shaman:        { id: 'shaman',        name: '哥布林巫師', element: 'blue',  pattern: 'magic_cross',  hp: 120, atk: 30, speed: 2, ai: 'evade',         armor: 0, talents: [],          shape: 'shaman' },
    golem:         { id: 'golem',         name: '石魔像',   element: 'light', pattern: 'melee_cross',  hp: 320, atk: 40, speed: 1, ai: 'charge',        armor: 2, talents: ['armor', 'big'], shape: 'golem' },
    whelp:         { id: 'whelp',         name: '幼龍',     element: 'red',   pattern: 'magic_cross',  hp: 240, atk: 36, speed: 2, ai: 'tactician',     armor: 0, talents: [],          shape: 'whelp' },
    dragon:        { id: 'dragon',        name: '赤焰巨龍', element: 'red',   pattern: 'magic_all',    hp: 900, atk: 55, speed: 2, ai: 'tactician',     armor: 1, talents: ['armor', 'big'], shape: 'dragon', boss: true },
  };
  DH.AI_NAMES = { charge: '衝鋒', tactician: '戰術', assassin: '刺客', unpredictable: '莫測', evade: '迴避' };
})(window.DH);
