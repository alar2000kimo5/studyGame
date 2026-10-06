// 格子座標、方向、BFS
(function (DH) {
  const C = DH.CONFIG;
  const CARDINAL = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const DIAGONAL = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
  const ALL = CARDINAL.concat(DIAGONAL);

  const key = (c, r) => c + ',' + r;
  const inBounds = (c, r) => c >= 0 && c < C.COLS && r >= 0 && r < C.ROWS;
  const cellCenter = (c, r) => ({
    x: C.BOARD_X + c * C.CELL + C.CELL / 2,
    y: C.BOARD_Y + r * C.CELL + C.CELL / 2,
  });
  const cellRect = (c, r) => ({ x: C.BOARD_X + c * C.CELL, y: C.BOARD_Y + r * C.CELL, w: C.CELL, h: C.CELL });
  const pixelToCell = (x, y) => {
    if (x < C.BOARD_X || y < C.BOARD_Y) return null;
    const c = Math.floor((x - C.BOARD_X) / C.CELL), r = Math.floor((y - C.BOARD_Y) / C.CELL);
    return inBounds(c, r) ? [c, r] : null;
  };
  const chebyshev = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  const neighbors8 = (p) => ALL.map(d => [p[0] + d[0], p[1] + d[1]]).filter(q => inBounds(q[0], q[1]));

  // 八方 BFS，回傳 Map key->{dist, prev}
  function reachable(start, steps, blockedSet) {
    const out = new Map();
    out.set(key(...start), { pos: start, dist: 0, prev: null });
    let frontier = [start];
    for (let d = 1; d <= steps && frontier.length; d++) {
      const next = [];
      for (const p of frontier) {
        for (const n of neighbors8(p)) {
          const k = key(...n);
          if (!out.has(k) && !blockedSet.has(k)) {
            out.set(k, { pos: n, dist: d, prev: p });
            next.push(n);
          }
        }
      }
      frontier = next;
    }
    return out;
  }
  // 含成本的可達計算：canEnter(c,r) 布林、cost(c,r) 進入成本（整數）
  function reachableCost(start, steps, canEnter, cost) {
    const out = new Map();
    out.set(key(...start), { pos: start, dist: 0, prev: null });
    const buckets = []; buckets[0] = [start];
    for (let d = 0; d <= steps; d++) {
      const layer = buckets[d] || [];
      for (const p of layer) {
        const cur = out.get(key(...p)); if (!cur || cur.dist !== d) continue;
        for (const n of neighbors8(p)) {
          if (!canEnter(n[0], n[1])) continue;
          const nd = d + (cost(n[0], n[1]) || 1);
          if (nd > steps) continue;
          const k = key(...n), ex = out.get(k);
          if (!ex || ex.dist > nd) { out.set(k, { pos: n, dist: nd, prev: p }); (buckets[nd] = buckets[nd] || []).push(n); }
        }
      }
    }
    return out;
  }
  function pathTo(reach, target) {
    const path = [];
    let node = reach.get(key(...target));
    while (node && node.prev) { path.unshift(node.pos); node = reach.get(key(...node.prev)); }
    return path;
  }

  DH.Grid = { CARDINAL, DIAGONAL, ALL, key, inBounds, cellCenter, cellRect, pixelToCell, chebyshev, neighbors8, reachable, reachableCost, pathTo };
})(window.DH);
