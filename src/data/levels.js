// 關卡：8 章 × 20 關 = 160 關，由種子亂數生成（固定種子，每次開啟都一樣）
//   地形字元：. 地板  # 牆  R 岩石  I 冰  F 火  M 泥  W 河  B 橋
//   每章一種地形主題與怪物池，第 20 關為 Boss 關
(function (DH) {
  const COLS = DH.CONFIG.COLS, ROWS = DH.CONFIG.ROWS;
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  DH.CHAPTERS = [
    { id: 1, name: '幽暗森林', theme: 'forest', desc: '林間小徑與哥布林。學會拖曳、交換與行動順序。', pool: ['goblin', 'goblin_archer', 'bat', 'hound'], elite: ['orc'], boss: 'orc', features: { rock: 2, mud: 1 } },
    { id: 2, name: '哥布林營地', theme: 'camp', desc: '木柵牆擋住射線，泥地讓怪物變慢。', pool: ['goblin', 'goblin_archer', 'shaman', 'hound'], elite: ['orc'], boss: 'goblin_king', features: { wall: 2, mud: 2 } },
    { id: 3, name: '荒廢墓場', theme: 'grave', desc: '墓碑與石牆之間，骷髏兵與食屍鬼成群出沒。', pool: ['skeleton', 'ghoul', 'bat', 'shaman'], elite: ['orc'], boss: 'lich', features: { rock: 3, wall: 1 } },
    { id: 4, name: '毒沼泥地', theme: 'swamp', desc: '大片泥地與水窪，水蛇會從河面上飛過來。', pool: ['spider', 'toad', 'naga', 'hound'], elite: ['ghoul'], boss: 'hydra', features: { mud: 3, water: 1, rock: 1 } },
    { id: 5, name: '雪原冰地', theme: 'tundra', desc: '踩上冰面會一路滑到底，冰原狼速度極快。', pool: ['ice_wolf', 'yeti', 'harpy', 'bat'], elite: ['yeti'], boss: 'frost_dragon', features: { ice: 3, wall: 1 } },
    { id: 6, name: '熔岩火山', theme: 'volcano', desc: '回合結束站在火上會被灼燒，飛行單位不受影響。', pool: ['fire_elemental', 'imp', 'orc', 'lava_golem'], elite: ['lava_golem'], boss: 'magma_lord', features: { fire: 3, rock: 2 } },
    { id: 7, name: '長河峽谷', theme: 'river', desc: '河川把戰場切成兩半，只有橋和飛行單位能過。', pool: ['crocodile', 'river_naga', 'harpy', 'goblin_archer'], elite: ['crocodile'], boss: 'river_god', features: { river: 1, mud: 1, wall: 1 } },
    { id: 8, name: '龍王巢穴', theme: 'lair', desc: '火焰、石牆與龍族。最後等著你的是龍王。', pool: ['whelp', 'imp', 'golem', 'orc'], elite: ['lava_golem', 'yeti'], boss: 'dragon', finalBoss: 'dragon_king', features: { fire: 2, wall: 2, rock: 1 } },
  ];
  const TERRAIN_NAMES = { '.': '地板', '#': '牆', 'R': '岩石', 'I': '冰', 'F': '火', 'M': '泥', 'W': '河', 'B': '橋' };
  DH.TERRAIN_NAMES = TERRAIN_NAMES;
  DH.TERRAIN_DESC = { '#': '牆：擋住移動與射線', 'R': '岩石：擋住移動與射線', 'I': '冰：踩上去會往同方向滑到底', 'F': '火：回合結束站在上面受 10% 最大 HP 傷害並灼燒', 'M': '泥：怪物經過移動力 -1，英雄拖曳經過扣 0.5 秒', 'W': '河：地面單位不能進入，不擋射線', 'B': '橋：可通行的河面' };

  function genTerrain(ch, index, R) {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
    const inten = 0.5 + index / 19;                         // 章內後段地形更多
    const f = ch.features;
    const cnt = (base) => Math.round(base * inten * (0.7 + R() * 0.6));
    const midRows = [2, 3, 4, 5];
    const put = (ch2, n, rows) => { let tries = 0; while (n > 0 && tries++ < 60) { const r = rows[Math.floor(R() * rows.length)], c = Math.floor(R() * COLS); if (g[r][c] === '.') { g[r][c] = ch2; n--; } } };
    const patch = (ch2, n) => { let tries = 0; while (n > 0 && tries++ < 40) { const r = 2 + Math.floor(R() * 3), c = Math.floor(R() * (COLS - 1)); if (g[r][c] === '.' && g[r][c + 1] === '.') { g[r][c] = ch2; g[r][c + 1] = ch2; if (R() < 0.5 && r + 1 <= 5 && g[r + 1][c] === '.') g[r + 1][c] = ch2; n--; } } };
    if (f.rock) put('R', cnt(f.rock), midRows);
    if (f.wall) { const n = cnt(f.wall); for (let i = 0; i < n; i++) { const r = 2 + Math.floor(R() * 4), c = Math.floor(R() * (COLS - 2)), len = 2 + Math.floor(R() * 2); for (let k = 0; k < len; k++) if (g[r][c + k] === '.') g[r][c + k] = '#'; } }
    if (f.mud) patch('M', cnt(f.mud));
    if (f.ice) patch('I', cnt(f.ice) + 1);
    if (f.fire) patch('F', cnt(f.fire));
    if (f.water) patch('W', cnt(f.water));
    if (f.river && index >= 1) {
      const r = 3 + Math.floor(R() * 2);
      for (let c = 0; c < COLS; c++) g[r][c] = 'W';
      const b1 = Math.floor(R() * COLS); g[r][b1] = 'B';
      if (index < 10 || R() < 0.5) { let b2 = Math.floor(R() * COLS); if (b2 === b1) b2 = (b2 + 3) % COLS; g[r][b2] = 'B'; }
    }
    // 英雄列與出生列保持乾淨
    for (let c = 0; c < COLS; c++) { g[7][c] = '.'; g[0][c] = '.'; if (g[1][c] !== '.' && g[1][c] !== 'M') g[1][c] = '.'; if (g[6][c] === '#' || g[6][c] === 'R' || g[6][c] === 'W') g[6][c] = '.'; }
    // 連通性：地面單位從第 7 列要能走到第 0 列，否則打通
    const passable = (r, c) => g[r][c] !== '#' && g[r][c] !== 'R' && g[r][c] !== 'W';
    const connected = () => {
      const seen = new Set(); const q = []; for (let c = 0; c < COLS; c++) { q.push([c, 7]); seen.add(c + ',7'); }
      while (q.length) { const [c, r] = q.shift(); if (r === 0) return true; for (const [dc, dr] of DH.Grid.ALL) { const nc = c + dc, nr = r + dr; if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue; const k = nc + ',' + nr; if (seen.has(k) || !passable(nr, nc)) continue; seen.add(k); q.push([nc, nr]); } }
      return false;
    };
    let guard = 0;
    while (!connected() && guard++ < 20) { const r = 1 + Math.floor(R() * 6), c = Math.floor(R() * COLS); if (g[r][c] === 'W') g[r][c] = 'B'; else if (!passable(r, c)) g[r][c] = '.'; }
    return g.map(row => row.join(''));
  }

  function genLevel(ch, index) {
    const id = (ch.id - 1) * 20 + index + 1;
    const R = rng(id * 7919 + 13);
    const terrain = genTerrain(ch, index, R);
    const isBoss = index === 19, isMidBoss = index === 9;
    const waves = isBoss ? 3 : 1 + Math.floor(index / 7);
    const perWave = 2 + Math.floor(index / 5);
    const scale = { hp: 1 + 0.035 * (id - 1), atk: 1 + 0.022 * (id - 1) };
    const spawnCells = [];
    for (let r = 0; r <= 2; r++) for (let c = 0; c < COLS; c++) if ('.M'.includes(terrain[r][c])) spawnCells.push([c, r]);
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
  for (const ch of DH.CHAPTERS) for (let i = 0; i < 20; i++) DH.DUNGEONS.push(genLevel(ch, i));
  DH.CHAPTER = { name: DH.CHAPTERS[0].name };
  DH.levelsOf = chId => DH.DUNGEONS.filter(d => d.chapter === chId);
  DH.terrainTypes = d => [...new Set(d.terrain.join('').split('').filter(c => c !== '.'))];
})(window.DH);
