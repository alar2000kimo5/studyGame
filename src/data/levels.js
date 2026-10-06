// 關卡：8 章 × 20 關 = 160 關，由種子亂數生成（固定種子，每次開啟都一樣）
//   地形字元：. 地板  # 牆  R 岩石  I 冰  F 火  M 泥  W 河  B 橋  X 虛空（戰場外）
//   陷阱：S 尖刺  P 毒霧  E 炸彈  T 傳送門（成對）  Q 能量水晶（回合開始站在上面 +30 能量）
//   每章一種地形主題與怪物池，第 20 關為 Boss 關
(function (DH) {
  const COLS = DH.CONFIG.COLS, ROWS = DH.CONFIG.ROWS;
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  DH.CHAPTERS = [
    { id: 1, name: '幽暗森林', theme: 'forest', desc: '林間小徑與哥布林。學會拖曳、交換與行動順序。', pool: ['goblin', 'goblin_archer', 'bat', 'hound'], elite: ['orc'], boss: 'orc', features: { rock: 2, mud: 1, spike: 1 } },
    { id: 2, name: '哥布林營地', theme: 'camp', desc: '木柵牆擋住射線，泥地讓怪物變慢。', pool: ['goblin', 'goblin_archer', 'shaman', 'hound'], elite: ['orc'], boss: 'goblin_king', features: { wall: 2, mud: 2, bomb: 1 } },
    { id: 3, name: '荒廢墓場', theme: 'grave', desc: '墓碑與石牆之間，骷髏兵與食屍鬼成群出沒。', pool: ['skeleton', 'ghoul', 'bat', 'shaman'], elite: ['orc'], boss: 'lich', features: { rock: 3, wall: 1, poison: 2, portal: 1 } },
    { id: 4, name: '毒沼泥地', theme: 'swamp', desc: '大片泥地與水窪，水蛇會從河面上飛過來。', pool: ['spider', 'toad', 'naga', 'hound'], elite: ['ghoul'], boss: 'hydra', features: { mud: 3, water: 1, rock: 1, poison: 2 } },
    { id: 5, name: '雪原冰地', theme: 'tundra', desc: '踩上冰面會一路滑到底，冰原狼速度極快。', pool: ['ice_wolf', 'yeti', 'harpy', 'bat'], elite: ['yeti'], boss: 'frost_dragon', features: { ice: 3, wall: 1, spike: 2 } },
    { id: 6, name: '熔岩火山', theme: 'volcano', desc: '回合結束站在火上會被灼燒，飛行單位不受影響。', pool: ['fire_elemental', 'imp', 'orc', 'lava_golem'], elite: ['lava_golem'], boss: 'magma_lord', features: { fire: 3, rock: 2, bomb: 2 } },
    { id: 7, name: '長河峽谷', theme: 'river', desc: '河川把戰場切成兩半，只有橋和飛行單位能過。', pool: ['crocodile', 'river_naga', 'harpy', 'goblin_archer'], elite: ['crocodile'], boss: 'river_god', features: { river: 1, mud: 1, wall: 1, portal: 1, spike: 1 } },
    { id: 8, name: '龍王巢穴', theme: 'lair', desc: '火焰、石牆與龍族。最後等著你的是龍王。', pool: ['whelp', 'imp', 'golem', 'orc'], elite: ['lava_golem', 'yeti'], boss: 'dragon', finalBoss: 'dragon_king', features: { fire: 2, wall: 2, rock: 1, bomb: 2, spike: 1, portal: 1 } },
  ];
  const TERRAIN_NAMES = { '.': '地板', '#': '牆', 'R': '岩石', 'I': '冰', 'F': '火', 'M': '泥', 'W': '河', 'B': '橋', 'X': '虛空', 'S': '尖刺', 'P': '毒霧', 'E': '炸彈', 'T': '傳送門', 'Q': '能量水晶' };
  DH.TERRAIN_NAMES = TERRAIN_NAMES;
  DH.TERRAIN_DESC = { '#': '牆：擋住移動與射線', 'R': '岩石：擋住移動與射線', 'I': '冰：踩上去會往同方向滑到底', 'F': '火：回合結束站在上面受 10% 最大 HP 傷害並灼燒', 'M': '泥：怪物經過移動力 -1，英雄拖曳經過扣 0.5 秒', 'W': '河：地面單位不能進入，不擋射線', 'B': '橋：可通行的河面', 'X': '虛空：戰場之外，任何單位都不能進入，射線可以穿過', 'S': '尖刺陷阱：停在上面的單位受 15% 最大 HP 傷害', 'P': '毒霧陷阱：回合結束站在上面會中毒 3 回合', 'E': '炸彈陷阱：踩到就爆炸，自己與周圍八格的單位受 20% 最大 HP 傷害，之後消失', 'T': '傳送門：停在上面會被傳送到另一個傳送門', 'Q': '能量水晶：回合開始時站在上面的英雄獲得 30 大絕招能量' };
  DH.TRAPS = 'SPET';

  // 戰場形狀：回傳要變成虛空的格子
  const SHAPES = [
    (R) => [],
    (R) => [[0, 0], [6, 0], [0, 7], [6, 7]],
    (R) => [[0, 0], [1, 0], [0, 1], [5, 0], [6, 0], [6, 1], [0, 6], [0, 7], [1, 7], [6, 6], [6, 7], [5, 7]],
    (R) => [[0, 3], [0, 4], [6, 3], [6, 4], [0, 2], [6, 5]],
    (R) => [[0, 3], [1, 3], [5, 4], [6, 4], [0, 4], [6, 3]],
    (R) => [[3, 3], [3, 4]],
    (R) => [[2, 3], [4, 4], [2, 4], [4, 3]].slice(0, 2 + Math.floor(R() * 3)),
    (R) => [[0, 1], [0, 2], [1, 1], [6, 5], [6, 6], [5, 6]],
    (R) => [[0, 0], [6, 0], [3, 2], [3, 5], [0, 7], [6, 7]],
    (R) => [[0, 2], [1, 2], [0, 3], [6, 2], [5, 2], [6, 3], [0, 5], [6, 5]],
    (R) => { const o = []; for (let r = 1; r < 7; r++) { if (r % 2 === 1) o.push([0, r]); else o.push([6, r]); } return o; },
    (R) => [[1, 0], [5, 0], [0, 1], [6, 1], [0, 6], [6, 6], [1, 7], [5, 7]],
    (R) => [[2, 2], [4, 2], [2, 5], [4, 5]],
    (R) => [[0, 4], [1, 4], [2, 4], [6, 3], [5, 3], [4, 3]],
    (R) => [[6, 0], [6, 1], [6, 2], [0, 5], [0, 6], [0, 7]],
  ];

  function genTerrain(ch, index, R) {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
    const inten = 0.5 + index / 19;                         // 章內後段地形更多
    const f = ch.features;
    // 形狀：第一章前幾關保持方形，之後隨機版型
    const shapeIdx = (ch.id === 1 && index < 3) ? 0 : Math.floor(R() * SHAPES.length);
    for (const [c, r] of SHAPES[shapeIdx](R)) g[r][c] = 'X';
    const cnt = (base) => Math.round(base * inten * (0.7 + R() * 0.6));
    const midRows = [2, 3, 4, 5];
    const put = (ch2, n, rows) => { let tries = 0; while (n > 0 && tries++ < 60) { const r = rows[Math.floor(R() * rows.length)], c = Math.floor(R() * COLS); if (g[r][c] === '.') { g[r][c] = ch2; n--; } } };
    const trapRows = [2, 3, 4, 5, 6];
    const patch = (ch2, n) => { let tries = 0; while (n > 0 && tries++ < 40) { const r = 2 + Math.floor(R() * 3), c = Math.floor(R() * (COLS - 1)); if (g[r][c] === '.' && g[r][c + 1] === '.') { g[r][c] = ch2; g[r][c + 1] = ch2; if (R() < 0.5 && r + 1 <= 5 && g[r + 1][c] === '.') g[r + 1][c] = ch2; n--; } } };
    if (f.rock) put('R', cnt(f.rock), midRows);
    if (f.wall) { const n = cnt(f.wall); for (let i = 0; i < n; i++) { const r = 2 + Math.floor(R() * 4), c = Math.floor(R() * (COLS - 2)), len = 2 + Math.floor(R() * 2); for (let k = 0; k < len; k++) if (g[r][c + k] === '.') g[r][c + k] = '#'; } }
    if (f.mud) patch('M', cnt(f.mud));
    if (f.ice) patch('I', cnt(f.ice) + 1);
    if (f.fire) patch('F', cnt(f.fire));
    if (f.water) patch('W', cnt(f.water));
    // 陷阱（章內越後面越多）
    if (f.spike && index >= 2) put('S', cnt(f.spike), trapRows);
    if (f.poison && index >= 2) put('P', cnt(f.poison), trapRows);
    if (f.bomb && index >= 3) put('E', Math.max(1, cnt(f.bomb)), trapRows);
    if (f.portal && index >= 4 && R() < 0.7) put('T', 2, [1, 2, 3, 4, 5, 6]);
    if (ch.id >= 2 && index >= 3 && R() < 0.6) put('Q', 1, [3, 4, 5, 6]);
    if (f.river && index >= 1) {
      const r = 3 + Math.floor(R() * 2);
      for (let c = 0; c < COLS; c++) if (g[r][c] !== 'X') g[r][c] = 'W';
      let b1 = Math.floor(R() * COLS); while (g[r][b1] === 'X') b1 = (b1 + 1) % COLS; g[r][b1] = 'B';
      if (index < 10 || R() < 0.5) { let b2 = Math.floor(R() * COLS); if (b2 === b1) b2 = (b2 + 3) % COLS; g[r][b2] = 'B'; }
    }
    // 英雄列與出生列保持乾淨（虛空保留）
    for (let c = 0; c < COLS; c++) { if (g[7][c] !== 'X') g[7][c] = '.'; if (g[0][c] !== 'X') g[0][c] = '.'; if (g[1][c] !== '.' && g[1][c] !== 'M' && g[1][c] !== 'X') g[1][c] = '.'; if ('#RWSPET'.includes(g[6][c])) g[6][c] = '.'; }
    // 傳送門必須成對
    const portals = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g[r][c] === 'T') portals.push([c, r]);
    if (portals.length !== 2) for (const [c, r] of portals) g[r][c] = '.';
    // 連通性：地面單位從第 7 列要能走到第 0 列，否則打通
    const passable = (r, c) => !'#RWX'.includes(g[r][c]);
    const connected = () => {
      const seen = new Set(); const q = []; for (let c = 0; c < COLS; c++) if (passable(7, c)) { q.push([c, 7]); seen.add(c + ',7'); }
      while (q.length) { const [c, r] = q.shift(); if (r === 0) return true; for (const [dc, dr] of DH.Grid.ALL) { const nc = c + dc, nr = r + dr; if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue; const k = nc + ',' + nr; if (seen.has(k) || !passable(nr, nc)) continue; seen.add(k); q.push([nc, nr]); } }
      return false;
    };
    let guard = 0;
    while (!connected() && guard++ < 30) { const r = 1 + Math.floor(R() * 6), c = Math.floor(R() * COLS); if (g[r][c] === 'W') g[r][c] = 'B'; else if (g[r][c] === '#' || g[r][c] === 'R') g[r][c] = '.'; else if (g[r][c] === 'X' && guard > 15) g[r][c] = '.'; }
    return g.map(row => row.join(''));
  }

  function genLevel(ch, index, salt) {
    const id = (ch.id - 1) * 20 + index + 1;
    const R = rng(id * 7919 + 13 + (salt || 0) * 104729);
    const terrain = genTerrain(ch, index, R);
    const isBoss = index === 19, isMidBoss = index === 9;
    const waves = isBoss ? 3 : 1 + Math.floor(index / 7);
    const perWave = 2 + Math.floor(index / 5);
    const scale = { hp: 1 + 0.035 * (id - 1), atk: 1 + 0.022 * (id - 1) };
    const spawnCells = [];
    for (let r = 0; r <= 2; r++) for (let c = 0; c < COLS; c++) if ('.M'.includes(terrain[r][c])) spawnCells.push([c, r]);
    if (spawnCells.length < 7) for (let c = 0; c < COLS; c++) if ('.M'.includes(terrain[3][c])) spawnCells.push([c, 3]);
    const pick = arr => arr[Math.floor(R() * arr.length)];
    const stages = [];
    for (let w = 0; w < waves; w++) {
      const cells = spawnCells.slice(), mons = [];
      const n = Math.min(cells.length, perWave + (w === waves - 1 ? 1 : 0));
      for (let i = 0; i < n; i++) {
        const ci = Math.floor(R() * cells.length); const pos = cells.splice(ci, 1)[0];
        let mid;
        if (isBoss && w === waves - 1 && i === 0) mid = (ch.finalBoss && index === 19 && ch.id === 8) ? ch.finalBoss : ch.boss;
        else if (isMidBoss && w === waves - 1 && i === 0) mid = pick(ch.elite);
        else if (index >= 12 && R() < 0.2) mid = pick(ch.elite);
        else mid = pick(ch.pool);
        mons.push({ id: mid, pos });
      }
      // Boss 放中間
      const bi = mons.findIndex(m => DH.MONSTERS[m.id].boss);
      if (bi >= 0) { const center = cells.concat(mons.map(m => m.pos)).find(p => p[0] === 3 && p[1] === 0) || mons[bi].pos; mons[bi].pos = center; for (let k = 0; k < mons.length; k++) if (k !== bi && mons[k].pos[0] === center[0] && mons[k].pos[1] === center[1]) mons[k].pos = cells.pop() || [0, 0]; }
      stages.push(mons);
    }
    const bossName = isBoss ? DH.MONSTERS[(ch.finalBoss && ch.id === 8) ? ch.finalBoss : ch.boss].name : null;
    return {
      id, chapter: ch.id, index: index + 1, theme: ch.theme,
      name: isBoss ? `首領：${bossName}` : isMidBoss ? `${ch.name} ${index + 1}（精英）` : `${ch.name} ${index + 1}`,
      desc: isBoss ? `${ch.name}的首領現身。${ch.desc}` : ch.desc,
      terrain, stages, scale, boss: isBoss, heroes: ['knight', 'warrior', 'archer'],
    };
  }

  DH.DUNGEONS = [];
  const seenTerrain = new Set();
  for (const ch of DH.CHAPTERS) for (let i = 0; i < 20; i++) {
    let salt = 0, lv = genLevel(ch, i, 0);
    while (seenTerrain.has(lv.terrain.join('/')) && salt < 20) lv = genLevel(ch, i, ++salt);   // 每關地形都不同
    seenTerrain.add(lv.terrain.join('/'));
    DH.DUNGEONS.push(lv);
  }
  DH.CHAPTER = { name: DH.CHAPTERS[0].name };
  DH.levelsOf = chId => DH.DUNGEONS.filter(d => d.chapter === chId);
  // 故事戰鬥：依章節主題生成地形，怪物用故事指定的清單，強度隨章節提高
  DH.genStoryLevel = function (story, idx) {
    const ch = story.chapters[idx], chapDef = DH.CHAPTERS.find(c => c.theme === ch.theme) || DH.CHAPTERS[0];
    const seed = (story.heroId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 131 + idx * 977) >>> 0;
    const R = rng(seed);
    const terrain = genTerrain(chapDef, 6 + idx * 3, R);
    const spawnCells = [];
    for (let r = 0; r <= 2; r++) for (let c = 0; c < COLS; c++) if ('.M'.includes(terrain[r][c])) spawnCells.push([c, r]);
    const cells = spawnCells.slice(), mons = [];
    for (const mid of ch.monsters) { if (!cells.length) break; const ci = Math.floor(R() * cells.length); mons.push({ id: mid, pos: cells.splice(ci, 1)[0] }); }
    const bi = mons.findIndex(m => DH.MONSTERS[m.id].boss);
    if (bi >= 0) { const center = mons.find(m => m.pos[0] === 3 && m.pos[1] === 0) ? null : [3, 0]; if (center && '.M'.includes(terrain[0][3])) { const other = mons.find(m => m.pos[0] === 3 && m.pos[1] === 0); if (!other) mons[bi].pos = center; } }
    const scale = { hp: 1 + 0.35 * idx, atk: 1 + 0.25 * idx };
    return { id: 'story_' + story.heroId + '_' + idx, chapter: 0, index: idx + 1, theme: ch.theme, name: `${story.title}・${ch.title}`, desc: ch.intro, terrain, stages: [mons], scale, boss: !!ch.boss, heroes: ['knight', 'warrior', 'archer'], story: { heroId: story.heroId, idx } };
  };
  DH.terrainTypes = d => [...new Set(d.terrain.join('').split('').filter(c => c !== '.'))];
})(window.DH);
