// 怪物 AI：依速度 BFS 出可到達的格子，評估每格的攻擊目標後選擇
(function (DH) {
  const G = DH.Grid;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // board 介面：heroes, monsters, obstacles(Set key), unitAt(c,r)
  DH.planMonster = function (m, board) {
    const heroes = board.heroes.filter(h => h.alive);
    if (!heroes.length) return null;
    const ignores = board.ignoresTerrain(m);
    const occupied = new Set();
    for (const u of board.allUnits()) if (u.alive && u !== m) occupied.add(G.key(u.col, u.row));
    const reach = G.reachableCost(m.pos, m.speed, (c, r) => !occupied.has(G.key(c, r)) && board.canEnter(m, c, r) && (ignores || board.tAt(c, r) !== 'E'), (c, r) => board.moveCost(m, c, r));
    const badCell = (c, r) => !ignores && 'IFSPET'.includes(board.tAt(c, r));

    const isHero = (c, r) => { const u = board.unitAt(c, r); return !!u && u.side === 'hero' && u.alive; };
    const isMon = (c, r) => { const u = board.unitAt(c, r); return !!u && u.side === 'monster' && u.alive && u !== m; };
    const isBlk = (c, r) => board.obstacles.has(G.key(c, r));

    const options = [];
    for (const node of reach.values()) {
      const res = DH.resolveTargets(m.pattern, node.pos, isHero, isMon, isBlk);
      const targets = res.targets.map(p => board.unitAt(p[0], p[1]));
      const nearest = Math.min(...heroes.map(h => G.chebyshev(node.pos, h.pos)));
      options.push({ pos: node.pos, dist: node.dist, targets, nearest, dirsHit: res.dirsHit, bad: badCell(node.pos[0], node.pos[1]) });
    }
    // 盡量不要停在冰或火上（除非沒別的選擇）
    const good = options.filter(o => !o.bad);
    const usable = good.length ? good : options;
    let attackable = usable.filter(o => o.targets.length);

    // 嘲諷：若能打到嘲諷英雄，只考慮那些選項（巨型怪免疫）
    if (m.forced && m.forced.alive) { const f = attackable.filter(o => o.targets.includes(m.forced)); if (f.length) attackable = f; }
    else if (!m.has('big')) {
      const taunted = attackable.filter(o => o.targets.some(h => h.has('taunt')));
      if (taunted.length) attackable = taunted;
    }

    const byMinDist = (arr) => { const d = Math.min(...arr.map(o => o.dist)); return arr.filter(o => o.dist === d); };
    let choice = null;
    const ai = (m.ai === 'evade' && (m.idleTurns || 0) >= 2) ? 'charge' : m.ai;
    if (attackable.length) {
      switch (ai) {
        case 'tactician': {
          const mx = Math.max(...attackable.map(o => o.targets.length));
          choice = pick(byMinDist(attackable.filter(o => o.targets.length === mx)));
          break;
        }
        case 'assassin': {
          const minHp = Math.min(...attackable.flatMap(o => o.targets.map(h => h.hp)));
          const good = attackable.filter(o => o.targets.some(h => h.hp === minHp));
          choice = pick(byMinDist(good));
          break;
        }
        case 'unpredictable': choice = pick(attackable); break;
        case 'evade': {
          const far = Math.max(...attackable.map(o => o.nearest));
          choice = pick(attackable.filter(o => o.nearest === far));
          break;
        }
        default: { // charge
          const near = byMinDist(attackable);
          const mx = Math.max(...near.map(o => o.targets.length));
          choice = pick(near.filter(o => o.targets.length === mx));
        }
      }
      return { move: choice.pos, path: G.pathTo(reach, choice.pos), targets: choice.targets, dirsHit: choice.dirsHit };
    }

    // 打不到任何人：依 AI 移動
    let dest;
    if (ai === 'evade') {
      const far = Math.max(...usable.map(o => o.nearest));
      dest = pick(usable.filter(o => o.nearest === far));
    } else if (ai === 'unpredictable') {
      const cur = options.find(o => o.dist === 0);
      const closer = usable.filter(o => o.nearest < cur.nearest);
      dest = closer.length ? pick(closer) : pick(usable);
    } else {
      let goal = heroes;
      if (m.forced && m.forced.alive) goal = [m.forced];
      else if (ai === 'assassin') { const mh = Math.min(...heroes.map(h => h.hp)); goal = heroes.filter(h => h.hp === mh); }
      const scored = usable.map(o => ({ o, d: Math.min(...goal.map(h => G.chebyshev(o.pos, h.pos))) }));
      const best = Math.min(...scored.map(s => s.d));
      dest = pick(byMinDist(scored.filter(s => s.d === best).map(s => s.o)));
    }
    return { move: dest.pos, path: G.pathTo(reach, dest.pos), targets: [], dirsHit: 0 };
  };
})(window.DH);
