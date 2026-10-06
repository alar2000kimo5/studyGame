// 關卡（地牢）：每個地牢有多個波次，清光怪物後下一波從上方出現
(function (DH) {
  const M = (id, c, r) => ({ id, pos: [c, r] });
  DH.CHAPTER = { name: '第一章：幽暗森林' };
  DH.DUNGEONS = [
    { id: 1, name: '林間小徑', theme: 'forest', desc: '兩隻哥布林擋路。熟悉拖曳、交換與行動順序。',
      heroes: ['knight', 'warrior', 'archer'], obstacles: [],
      stages: [
        [M('goblin', 2, 1), M('goblin', 4, 1)],
        [M('goblin', 1, 0), M('goblin_archer', 3, 0), M('bat', 5, 1)],
      ] },
    { id: 2, name: '哥布林營地', theme: 'camp', desc: '哥布林成群結隊，弓手會躲在後排放箭。',
      heroes: ['knight', 'warrior', 'archer', 'mage'], obstacles: [[0, 3], [6, 3]],
      stages: [
        [M('goblin', 1, 1), M('goblin', 3, 1), M('goblin', 5, 1), M('goblin_archer', 3, 0)],
        [M('orc', 3, 0), M('goblin', 1, 1), M('goblin', 5, 1), M('goblin_archer', 0, 0), M('goblin_archer', 6, 0)],
      ] },
    { id: 3, name: '荒廢墳場', theme: 'grave', desc: '骷髏兵有重甲，墓碑會擋住箭矢。牧師加入隊伍。',
      heroes: ['knight', 'warrior', 'archer', 'mage', 'cleric'], obstacles: [[1, 3], [5, 3], [3, 4]],
      stages: [
        [M('skeleton', 1, 1), M('skeleton', 3, 1), M('skeleton', 5, 1)],
        [M('skeleton', 2, 1), M('skeleton', 4, 1), M('shaman', 3, 0), M('bat', 0, 0), M('bat', 6, 0)],
        [M('skeleton', 1, 0), M('skeleton', 3, 0), M('skeleton', 5, 0), M('shaman', 2, 2), M('shaman', 4, 2)],
      ] },
    { id: 4, name: '餓狼之穴', theme: 'den', desc: '野獸對近戰有抗性，速度極快且專挑殘血英雄。盜賊加入。',
      heroes: ['knight', 'rogue', 'archer', 'mage', 'cleric'], obstacles: [[3, 2]],
      stages: [
        [M('hound', 1, 1), M('hound', 5, 1), M('bat', 3, 0)],
        [M('hound', 0, 0), M('hound', 2, 0), M('hound', 4, 0), M('hound', 6, 0)],
        [M('spider', 2, 1), M('spider', 4, 1), M('hound', 3, 0), M('bat', 0, 2), M('bat', 6, 2)],
      ] },
    { id: 5, name: '沉默石窟', theme: 'cave', desc: '石魔像又慢又硬，巨型怪物無法被推動。蠻族加入。',
      heroes: ['knight', 'barbarian', 'archer', 'mage', 'cleric'], obstacles: [[0, 2], [6, 2], [2, 4], [4, 4]],
      stages: [
        [M('golem', 3, 1), M('skeleton', 1, 1), M('skeleton', 5, 1)],
        [M('golem', 2, 0), M('golem', 4, 0), M('shaman', 3, 2), M('bat', 0, 0), M('bat', 6, 0)],
      ] },
    { id: 6, name: '赤焰龍巢', theme: 'lair', desc: '巨龍的魔法火焰可穿透八個方向。藍色英雄對紅色有加成。',
      heroes: ['knight', 'warrior', 'rogue', 'mage', 'cleric'], obstacles: [[1, 3], [5, 3]],
      stages: [
        [M('whelp', 2, 1), M('whelp', 4, 1), M('orc', 0, 0), M('orc', 6, 0)],
        [M('dragon', 3, 0), M('whelp', 1, 1), M('whelp', 5, 1)],
      ] },
  ];
})(window.DH);
