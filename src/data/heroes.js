// 英雄名冊
(function (DH) {
  DH.HEROES = {
    knight:    { id: 'knight',    name: '艾倫', cls: '騎士', element: 'light', pattern: 'melee_cross',  hp: 380, atk: 40, armor: 1, talents: ['shield', 'taunt'],
                 look: { skin: '#f3c9a6', hair: '#c9a04a', hairStyle: 'short', helmet: true, weapon: 'sword', shield: true } },
    warrior:   { id: 'warrior',   name: '布倫', cls: '戰士', element: 'red',   pattern: 'melee_all',    hp: 320, atk: 46, armor: 0, talents: ['whirlwind'],
                 look: { skin: '#e8b48e', hair: '#5a3220', hairStyle: 'spiky', beard: true, weapon: 'axe' } },
    archer:    { id: 'archer',    name: '莉亞', cls: '弓手', element: 'green', pattern: 'ranged_cross', hp: 220, atk: 44, armor: 0, talents: ['finishing_blow'],
                 look: { skin: '#f6d2b4', hair: '#d8742c', hairStyle: 'ponytail', hood: true, weapon: 'bow' } },
    mage:      { id: 'mage',      name: '梅林', cls: '法師', element: 'blue',  pattern: 'magic_cross',  hp: 200, atk: 40, armor: 0, talents: ['burn'],
                 look: { skin: '#f0cfb0', hair: '#e8e8f0', hairStyle: 'long', beard: true, hat: true, weapon: 'staff' } },
    cleric:    { id: 'cleric',    name: '瑟拉', cls: '牧師', element: 'light', pattern: 'magic_cross',  hp: 240, atk: 26, armor: 0, talents: ['heal'],
                 look: { skin: '#f8dcc4', hair: '#f3e3b0', hairStyle: 'long', veil: true, weapon: 'mace' } },
    rogue:     { id: 'rogue',     name: '奇洛', cls: '盜賊', element: 'dark',  pattern: 'melee_all',    hp: 250, atk: 42, armor: 0, talents: ['tumble', 'poison'],
                 look: { skin: '#d9a97c', hair: '#2a2430', hairStyle: 'short', mask: true, weapon: 'dagger' } },
    barbarian: { id: 'barbarian', name: '戈登', cls: '蠻族', element: 'red',   pattern: 'melee_cross',  hp: 340, atk: 50, armor: 0, talents: ['push', 'berserk'],
                 look: { skin: '#d8a078', hair: '#1e1410', hairStyle: 'mohawk', warpaint: true, weapon: 'club' } },
  };
})(window.DH);
