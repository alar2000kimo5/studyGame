// 攻擊模式：近戰／遠程／魔法 × 十字／斜向／八方
//   近戰：打相鄰格的敵人
//   遠程：每條線上「第一個」單位，若是友方則被擋住
//   魔法：穿透整條線，打到所有敵人（友方不擋，但障礙物擋）
(function (DH) {
  const G = DH.Grid;
  const P = (key, label, kind, dirs) => ({ key, label, kind, dirs,
    kindLabel: { melee: '近戰', ranged: '遠程', magic: '魔法' }[kind] });

  DH.PATTERNS = {
    melee_cross:  P('melee_cross',  '近戰·十字', 'melee',  G.CARDINAL),
    melee_all:    P('melee_all',    '近戰·八方', 'melee',  G.ALL),
    ranged_cross: P('ranged_cross', '遠程·十字', 'ranged', G.CARDINAL),
    ranged_diag:  P('ranged_diag',  '遠程·斜向', 'ranged', G.DIAGONAL),
    ranged_all:   P('ranged_all',   '遠程·八方', 'ranged', G.ALL),
    magic_cross:  P('magic_cross',  '魔法·十字', 'magic',  G.CARDINAL),
    magic_diag:   P('magic_diag',   '魔法·斜向', 'magic',  G.DIAGONAL),
    magic_all:    P('magic_all',    '魔法·八方', 'magic',  G.ALL),
  };

  // 回傳 { targets:[[c,r]], allies:[[c,r]], dirsHit }
  DH.resolveTargets = function (pattern, pos, isEnemy, isAlly, isBlocked) {
    const targets = [], allies = [];
    let dirsHit = 0;
    for (const [dc, dr] of pattern.dirs) {
      let c = pos[0] + dc, r = pos[1] + dr, hit = false;
      if (pattern.kind === 'melee') {
        if (G.inBounds(c, r) && isEnemy(c, r)) { targets.push([c, r]); hit = true; }
      } else {
        while (G.inBounds(c, r) && !isBlocked(c, r)) {
          if (isEnemy(c, r)) { targets.push([c, r]); hit = true; if (pattern.kind === 'ranged') break; }
          else if (isAlly(c, r)) { allies.push([c, r]); if (pattern.kind === 'ranged') break; }
          c += dc; r += dr;
        }
      }
      if (hit) dirsHit++;
    }
    return { targets, allies, dirsHit };
  };

  // 預覽用：模式從 pos 出發覆蓋的格子（遠程在第一個單位處停）
  DH.patternCells = function (pattern, pos, isBlocked, isUnit) {
    const cells = [];
    for (const [dc, dr] of pattern.dirs) {
      let c = pos[0] + dc, r = pos[1] + dr;
      if (pattern.kind === 'melee') { if (G.inBounds(c, r) && !isBlocked(c, r)) cells.push([c, r]); continue; }
      while (G.inBounds(c, r) && !isBlocked(c, r)) {
        cells.push([c, r]);
        if (pattern.kind === 'ranged' && isUnit(c, r)) break;
        c += dc; r += dr;
      }
    }
    return cells;
  };
})(window.DH);
