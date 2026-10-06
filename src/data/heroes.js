// 英雄名冊：15 個職業 × 5 位（星級 1～5 各一位）＝ 75 位
//   每個職業有一份模板（攻擊模式、輔助模式、職業天賦、天賦池、武器、外觀、隊長加成、基礎屬性）
//   每位英雄再指定名字、種族、顏色、星級、髮型髮色膚色與介紹；屬性依星級放大
(function (DH) {
  DH.SPECIES = { human: '人類', elf: '精靈', dwarf: '矮人', orc: '獸人', dragonkin: '龍裔', halfling: '半身人' };
  const SPECIES_KEYS = ['human', 'elf', 'dwarf', 'orc', 'dragonkin', 'halfling'];
  const ELEMENT_KEYS = ['red', 'green', 'blue', 'light', 'dark'];
  // 種族外觀特徵
  const SPECIES_LOOK = {
    human: {}, elf: { ears: true }, dwarf: { beard: true, stout: true }, orc: { tusks: true }, dragonkin: { horns: true }, halfling: { small: true },
  };
  const SPECIES_SKIN = {
    human: ['#f3c9a6', '#e8b48e', '#d9a97c', '#f6d2b4', '#c98f6a'],
    elf: ['#f6dcc8', '#f0cfb0', '#e9c9a4', '#f8e2d0', '#d8b89a'],
    dwarf: ['#e2b08c', '#e8b48e', '#d8a078', '#f0c4a0', '#c9906a'],
    orc: ['#6f9a5a', '#5f8f4a', '#7aa06a', '#8a9a60', '#5a7a4a'],
    dragonkin: ['#9fc8e8', '#d87a5a', '#8fbf9a', '#d9b0e0', '#e0c080'],
    halfling: ['#d9a97c', '#f6d6bc', '#e8c0a0', '#f0cfb0', '#c9a080'],
  };
  const HAIR_COLORS = ['#c9a04a', '#5a3220', '#d8742c', '#e8e8f0', '#f3e3b0', '#2a2430', '#1e1410', '#4e7a2e', '#4a2a6a', '#8c3a2a', '#f4c35a', '#2a4a8a', '#3a1a10', '#b03a5a', '#7a7a8a'];
  const HAIR_STYLES = ['short', 'long', 'spiky', 'ponytail', 'mohawk'];

  const CLASSES = {
    knight:       { cls: '騎士',     pattern: 'melee_cross',  hp: 300, atk: 32, def: 20, classTalent: 'shield',         pool: ['taunt', 'iron_skin', 'parry', 'vigor', 'might'],            weapon: 'sword',   flags: { helmet: true, shield: true },    leader: { atk: 0.05, def: 0.10 } },
    warrior:      { cls: '戰士',     pattern: 'melee_all',    hp: 260, atk: 38, def: 10, classTalent: 'whirlwind',      pool: ['might', 'berserk', 'critical', 'vigor', 'finishing_blow'],  weapon: 'axe',     flags: {},                               leader: { atk: 0.10, def: 0.05 } },
    archer:       { cls: '弓手',     pattern: 'ranged_cross', hp: 190, atk: 36, def: 5,  classTalent: 'finishing_blow', pool: ['critical', 'hunter', 'prepare', 'might', 'swift'],          weapon: 'bow',     flags: { hood: true },                   leader: { atk: 0.10, def: 0.05 } },
    mage:         { cls: '法師',     pattern: 'magic_cross',  hp: 170, atk: 34, def: 0,  classTalent: 'burn',           pool: ['rune', 'prepare', 'might', 'critical', 'vigor'],            weapon: 'staff',   flags: { hat: true },                    leader: { atk: 0.15, def: 0 } },
    cleric:       { cls: '牧師',     pattern: 'magic_cross',  support: 'magic_cross', hp: 210, atk: 22, def: 8, classTalent: 'heal', pool: ['delayed_heal', 'vigor', 'regen', 'barrier', 'iron_skin'], weapon: 'mace', flags: { veil: true },          leader: { atk: 0, def: 0.15 } },
    rogue:        { cls: '盜賊',     pattern: 'melee_all',    hp: 210, atk: 36, def: 5,  classTalent: 'tumble',         pool: ['poison', 'critical', 'swift', 'finishing_blow', 'might'],   weapon: 'dagger',  flags: { mask: true },                   leader: { atk: 0.10, def: 0.05 } },
    barbarian:    { cls: '蠻族',     pattern: 'melee_cross',  hp: 290, atk: 42, def: 5,  classTalent: 'push',           pool: ['berserk', 'might', 'whirlwind', 'vigor', 'critical'],       weapon: 'club',    flags: { warpaint: true },               leader: { atk: 0.12, def: 0 } },
    paladin:      { cls: '聖騎士',   pattern: 'melee_cross',  support: 'melee_all',   hp: 320, atk: 34, def: 22, classTalent: 'heal', pool: ['shield', 'parry', 'vigor', 'iron_skin', 'taunt'], weapon: 'mace', flags: { helmet: true, shield: true }, leader: { atk: 0.08, def: 0.12 } },
    druid:        { cls: '德魯伊',   pattern: 'magic_diag',   support: 'magic_diag',  hp: 220, atk: 28, def: 6,  classTalent: 'delayed_heal', pool: ['regen', 'poison', 'vigor', 'hunter', 'rune'], weapon: 'staff', flags: { antlers: true },           leader: { atk: 0.05, def: 0.10 } },
    witch:        { cls: '女巫',     pattern: 'magic_cross',  hp: 190, atk: 40, def: 2,  classTalent: 'lifedrain',      pool: ['poison', 'rune', 'prepare', 'might', 'burn'],               weapon: 'staff',   flags: { witchHat: true },               leader: { atk: 0.15, def: 0 } },
    hunter:       { cls: '獵人',     pattern: 'ranged_diag',  hp: 200, atk: 38, def: 6,  classTalent: 'hunter',         pool: ['finishing_blow', 'critical', 'prepare', 'swift', 'might'],  weapon: 'bow',     flags: { hood: true },                   leader: { atk: 0.10, def: 0.05 } },
    bard:         { cls: '吟遊詩人', pattern: 'ranged_cross', support: 'magic_cross', hp: 200, atk: 26, def: 8, classTalent: 'inspire', pool: ['swift', 'vigor', 'critical', 'heal', 'regen'], weapon: 'lute',  flags: { beret: true },                leader: { atk: 0.12, def: 0.03 } },
    princess:     { cls: '公主',     pattern: 'ranged_cross', support: 'magic_all',   hp: 240, atk: 30, def: 12, classTalent: 'barrier', pool: ['inspire', 'heal', 'vigor', 'might', 'regen'], weapon: 'scepter', flags: { crown: true },             leader: { atk: 0.15, def: 0.15 } },
    elementalist: { cls: '元素使',   pattern: 'magic_all',    hp: 200, atk: 44, def: 4,  classTalent: 'burn',           pool: ['rune', 'prepare', 'might', 'critical', 'lifedrain'],        weapon: 'orb',     flags: {},                               leader: { atk: 0.20, def: 0 } },
    guardian:     { cls: '守護者',   pattern: 'melee_cross',  hp: 360, atk: 30, def: 28, classTalent: 'thorns',         pool: ['taunt', 'parry', 'iron_skin', 'vigor', 'shield'],           weapon: 'hammer',  flags: { helmet: true, bigShield: true }, leader: { atk: 0, def: 0.20 } },
  };

  // 每位英雄：[id, 名字, 種族, 顏色, 星級, 髮型, 髮色索引, 膚色索引, 介紹, 額外外觀]
  // 每個職業第一位沿用舊版 id，確保舊存檔相容
  const ROWS = {
    knight: [
      ['knight', '艾倫', 'human', 'light', 1, 'short', 0, 0, '誓言守護村莊的年輕騎士，盾比劍還擦得亮。'],
      ['knight2', '羅德', 'dwarf', 'red', 2, 'short', 1, 1, '礦坑守衛出身，盾牌是用礦車門板改的。'],
      ['knight3', '伊芙琳', 'elf', 'blue', 3, 'long', 4, 0, '精靈騎士團的旗手，站姿比旗桿還直。', { beard: false }],
      ['knight4', '莫洛克', 'orc', 'dark', 4, 'mohawk', 5, 0, '背叛部落投奔王國的獸人騎士，盾上還有舊傷。'],
      ['knight5', '塞拉芬', 'dragonkin', 'green', 5, 'spiky', 11, 2, '龍裔聖劍士，傳說他的盾能擋下龍息。'],
    ],
    warrior: [
      ['warrior', '布倫', 'dwarf', 'red', 2, 'spiky', 1, 1, '矮人礦坑出身，一把斧頭砍過的岩石比樹還多。'],
      ['warrior2', '卡拉', 'human', 'green', 1, 'ponytail', 9, 1, '傭兵團裡最年輕的斧手，薪水全拿去買磨刀石。', { beard: false }],
      ['warrior3', '格魯姆', 'orc', 'blue', 3, 'mohawk', 6, 1, '獸人戰士，相信「八個方向都砍」才叫公平。'],
      ['warrior4', '塔莉亞', 'elf', 'dark', 4, 'long', 4, 1, '放棄弓箭改拿雙手斧的精靈，族人至今不解。', { beard: false }],
      ['warrior5', '伊格尼', 'dragonkin', 'light', 5, 'spiky', 10, 4, '龍裔戰神，斧刃上有永不熄滅的火紋。'],
    ],
    archer: [
      ['archer', '莉亞', 'elf', 'green', 2, 'ponytail', 2, 0, '森林守衛，箭從不落空，只是偶爾射到自己的帽子。'],
      ['archer2', '皮普', 'halfling', 'light', 1, 'short', 9, 0, '半身人弓手，個子小到敵人常常找不到他。'],
      ['archer3', '韋恩', 'human', 'red', 3, 'short', 1, 2, '前皇家獵場看守，專打會動的東西。'],
      ['archer4', '薇拉', 'dragonkin', 'blue', 4, 'long', 11, 0, '龍裔神射手，箭矢出手時會帶一道藍焰。', { beard: false }],
      ['archer5', '索林', 'dwarf', 'dark', 5, 'spiky', 6, 3, '矮人長弓大師，弓是用整根礦坑支柱做的。'],
    ],
    mage: [
      ['mage', '梅林', 'human', 'blue', 3, 'long', 3, 1, '塔裡最老的法師，鬍子裡藏著三本沒還的書。', { beard: true }],
      ['mage2', '諾拉', 'halfling', 'red', 1, 'ponytail', 2, 1, '半身人學徒，火球術常常只燒到自己的早餐。'],
      ['mage3', '艾瑟', 'elf', 'light', 2, 'long', 3, 3, '精靈光術士，念咒時整個人會微微發亮。'],
      ['mage4', '祖格', 'orc', 'green', 4, 'mohawk', 5, 2, '獸人裡少見的法師，咒語喊得比誰都大聲。'],
      ['mage5', '阿斯特拉', 'dragonkin', 'dark', 5, 'spiky', 8, 3, '龍裔大法師，據說能把星星拉下來當武器。'],
    ],
    cleric: [
      ['cleric', '瑟拉', 'human', 'light', 3, 'long', 4, 3, '修道院派來的治療師，禱告比誰都快。'],
      ['cleric2', '布麗', 'halfling', 'green', 1, 'short', 9, 1, '半身人見習牧師，繃帶永遠包得太多圈。'],
      ['cleric3', '歐里', 'dwarf', 'blue', 2, 'short', 7, 0, '矮人牧師，用啤酒祝福傷口，意外地有效。'],
      ['cleric4', '莉莎貝', 'elf', 'red', 4, 'long', 10, 2, '精靈高階祭司，治療術帶著玫瑰香氣。'],
      ['cleric5', '烏爾加', 'orc', 'dark', 5, 'mohawk', 5, 3, '獸人薩滿牧師，歌聲低沉卻能讓骨頭重新長好。'],
    ],
    rogue: [
      ['rogue', '奇洛', 'halfling', 'dark', 3, 'short', 5, 0, '半身人盜賊，手腳比話還快，從不解釋錢包去哪了。'],
      ['rogue2', '瑪拉', 'human', 'blue', 1, 'ponytail', 13, 1, '街頭扒手轉職冒險者，仍然改不掉順手牽羊。'],
      ['rogue3', '賽斯', 'elf', 'red', 2, 'short', 2, 4, '精靈刺客，認為自己的影子都太吵。'],
      ['rogue4', '克魯格', 'orc', 'light', 4, 'mohawk', 6, 4, '體型巨大卻無聲無息的獸人盜賊，沒人知道怎麼辦到的。'],
      ['rogue5', '夜鱗', 'dragonkin', 'green', 5, 'spiky', 5, 3, '龍裔暗影，據說同時出現在兩個地方過。'],
    ],
    barbarian: [
      ['barbarian', '戈登', 'orc', 'red', 2, 'mohawk', 6, 1, '北境獸人，覺得門都是用來撞的。'],
      ['barbarian2', '烏娜', 'human', 'dark', 1, 'spiky', 8, 2, '凍土部落的女戰士，冬天只穿一件背心。'],
      ['barbarian3', '杜林', 'dwarf', 'green', 3, 'mohawk', 9, 2, '矮人狂戰士，木棍是他自己拔的樹。'],
      ['barbarian4', '芬恩', 'halfling', 'light', 4, 'spiky', 0, 2, '半身人蠻族，力氣跟身高完全不成比例。'],
      ['barbarian5', '卡爾蒙', 'dragonkin', 'blue', 5, 'mohawk', 12, 2, '龍裔蠻王，推開的怪物通常飛得比預期遠。'],
    ],
    paladin: [
      ['paladin', '賽琳', 'human', 'light', 4, 'long', 4, 3, '聖光騎士團團長，盾牌上的刻痕每一道都有名字。'],
      ['paladin2', '托比', 'halfling', 'blue', 1, 'short', 0, 1, '半身人見習聖騎士，盔甲是訂做的兒童尺寸。'],
      ['paladin3', '布羅姆', 'dwarf', 'dark', 2, 'short', 1, 2, '矮人聖騎士，鬍子裡編著聖徽。'],
      ['paladin4', '艾拉妮', 'elf', 'green', 3, 'ponytail', 3, 0, '精靈聖騎士，治療時盾牌會散發柔光。', { beard: false }],
      ['paladin5', '格拉斯', 'dragonkin', 'red', 5, 'spiky', 10, 1, '龍裔聖騎，信仰與火焰同樣熾熱。'],
    ],
    druid: [
      ['druid', '歐文', 'elf', 'green', 3, 'long', 7, 2, '會和樹說話的精靈，樹通常不回答。'],
      ['druid2', '米莉', 'halfling', 'red', 1, 'ponytail', 2, 3, '半身人德魯伊，養的松鼠比朋友多。'],
      ['druid3', '哈根', 'dwarf', 'light', 2, 'short', 7, 4, '矮人德魯伊，擅長和蘑菇溝通。'],
      ['druid4', '席爾瓦', 'human', 'dark', 4, 'long', 7, 1, '沼澤隱士，延遲治癒是因為她做事慢。'],
      ['druid5', '翠鱗', 'dragonkin', 'blue', 5, 'spiky', 7, 2, '龍裔自然祭司，走過的地方會開花。'],
    ],
    witch: [
      ['witch', '娜薇', 'human', 'dark', 4, 'long', 8, 3, '沼澤女巫，大鍋裡煮的東西連她自己都不太確定。'],
      ['witch2', '佩姬', 'halfling', 'green', 1, 'ponytail', 9, 1, '半身人小女巫，掃帚還飛不高。'],
      ['witch3', '伊索德', 'elf', 'blue', 2, 'long', 3, 2, '精靈月巫，只在夜晚施咒。'],
      ['witch4', '葛蕾塔', 'dwarf', 'red', 3, 'long', 1, 0, '矮人火巫，煉金爐炸過三次後反而更厲害。', { beard: false }],
      ['witch5', '夏爾莎', 'orc', 'light', 5, 'mohawk', 5, 1, '獸人血巫，汲取生命的方式令人不敢直視。'],
    ],
    hunter: [
      ['hunter', '塔隆', 'dwarf', 'green', 2, 'short', 9, 0, '矮人獵人，斜角射擊是他唯一會的角度。'],
      ['hunter2', '黎恩', 'human', 'blue', 1, 'short', 1, 3, '邊境村莊的獵戶，第一次看到龍就想獵。'],
      ['hunter3', '瓦洛克', 'orc', 'red', 3, 'mohawk', 6, 2, '獸人獵頭者，專門對付野獸。'],
      ['hunter4', '芮妮', 'elf', 'dark', 4, 'ponytail', 13, 1, '精靈追獵者，能從三格外聞到怪物。', { beard: false }],
      ['hunter5', '霜牙', 'dragonkin', 'light', 5, 'spiky', 3, 0, '龍裔獵龍人，自己也是龍這件事讓他很矛盾。'],
    ],
    bard: [
      ['bard', '菲歐', 'halfling', 'blue', 3, 'short', 9, 1, '唱歌走音但士氣加成真的有效的半身人詩人。'],
      ['bard2', '莉莉', 'human', 'light', 1, 'ponytail', 10, 3, '酒館駐唱，只會三首歌但觀眾不在意。'],
      ['bard3', '艾爾文', 'elf', 'green', 2, 'long', 0, 0, '精靈琴手，琴聲讓隊友忘記自己受傷。'],
      ['bard4', '岡姆', 'dwarf', 'dark', 4, 'short', 6, 1, '矮人戰歌手，歌聲像礦坑崩塌一樣震撼。'],
      ['bard5', '鳴鱗', 'dragonkin', 'red', 5, 'spiky', 8, 3, '龍裔吟遊詩人，一聲龍吟抵得上整支軍樂隊。'],
    ],
    princess: [
      ['princess', '艾莉絲', 'human', 'light', 5, 'long', 10, 3, '王國的公主，比王國的將軍更懂得排兵布陣。'],
      ['princess2', '小豆', 'halfling', 'green', 1, 'ponytail', 2, 1, '半身人村的「公主」，頭銜是村民投票選的。'],
      ['princess3', '艾爾瑞', 'elf', 'blue', 2, 'long', 3, 0, '精靈王女，離家出走來體驗冒險。'],
      ['princess4', '布琳希', 'dwarf', 'red', 3, 'long', 0, 1, '矮人山脈的公主，王冠是純鐵打的。', { beard: false }],
      ['princess5', '夜焰', 'dragonkin', 'dark', 4, 'long', 8, 3, '龍裔公主，守護結界由黑焰構成。'],
    ],
    elementalist: [
      ['elementalist', '澤恩', 'dragonkin', 'blue', 5, 'spiky', 11, 0, '龍裔元素使，八個方向同時起火不是意外，是風格。'],
      ['elementalist2', '提奧', 'human', 'green', 1, 'short', 0, 4, '剛學會控制元素的少年，偶爾會下室內雨。'],
      ['elementalist3', '琳恩', 'elf', 'light', 2, 'long', 4, 3, '精靈光元素使，發光的程度看心情。'],
      ['elementalist4', '沙克', 'orc', 'red', 3, 'mohawk', 6, 3, '獸人火元素使，脾氣跟火球一樣大。'],
      ['elementalist5', '梅芙', 'halfling', 'dark', 4, 'ponytail', 8, 2, '半身人暗元素使，影子會自己走動。'],
    ],
    guardian: [
      ['guardian', '霍克', 'dragonkin', 'red', 4, 'short', 12, 1, '龍裔守護者，站著不動就是他的攻擊方式。'],
      ['guardian2', '班尼', 'halfling', 'blue', 1, 'short', 1, 3, '半身人守衛，盾牌比他本人還高。'],
      ['guardian3', '約納', 'human', 'green', 2, 'short', 5, 0, '城門守衛二十年，從沒讓人不排隊進城。'],
      ['guardian4', '塔格', 'orc', 'light', 3, 'mohawk', 6, 4, '獸人守護者，荊棘盾讓敵人後悔動手。'],
      ['guardian5', '岩鬚', 'dwarf', 'dark', 5, 'short', 14, 2, '矮人山脈的守門人，據說從沒有人成功推開他。'],
    ],
  };

  const HEROES = {};
  for (const [key, tpl] of Object.entries(CLASSES)) {
    ROWS[key].forEach(([id, name, species, element, stars, hairStyle, hairIdx, skinIdx, flavor, extra]) => {
      const k = 1 + 0.10 * (stars - 1);
      const look = Object.assign({}, tpl.flags, SPECIES_LOOK[species], {
        skin: SPECIES_SKIN[species][skinIdx % 5], hair: HAIR_COLORS[hairIdx % HAIR_COLORS.length], hairStyle, weapon: tpl.weapon,
      }, extra || {});
      HEROES[id] = {
        id, name, cls: tpl.cls, element, species, stars, pattern: tpl.pattern, support: tpl.support || null,
        hp: Math.round(tpl.hp * k), atk: Math.round(tpl.atk * k), def: tpl.def + 2 * (stars - 1),
        talents: [tpl.classTalent].concat(tpl.pool), ascendedTalent: 'ascended_power',
        leader: tpl.leader, flavor, look, classKey: key,
      };
    });
  }
  DH.HEROES = HEROES;
  DH.CLASSES = CLASSES;
  DH.STARTER_HEROES = ['knight', 'warrior', 'archer'];
})(window.DH);
