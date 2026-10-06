// 自動戰鬥：搜尋「拖哪個英雄、走哪條路（含交換）」能讓全隊這回合打出最高分
//   評分 = 預期傷害（含擊殺獎勵）＋ 治療價值 － 怪物下回合可能造成的威脅 － 站在火上的懲罰
(function (DH) {
  const G = DH.Grid, C = DH.CONFIG;
  const MAX_DEPTH = 4;

  DH.planAutoTurn = function (b) {
    const heroes = b.aliveHeroes(), monsters = b.aliveMonsters();
    if (!heroes.length || !monsters.length) return null;
    const overlay = new Map();                                   // uid → [c,r]（模擬位置）
    const posOf = u => overlay.get(u.uid) || u.pos;
    const unitAt = (c, r) => { for (const u of heroes) { const p = posOf(u); if (p[0] === c && p[1] === r) return u; } for (const m of monsters) if (m.col === c && m.row === r) return m; return null; };
    const blocksLine = (c, r) => b.isObstacle(c, r);
    const seen = new Set();
    let best = { score: -Infinity, hero: null, path: [] };

    const evaluate = (mover, swapped) => {
      let score = 0; const dmgOn = new Map();
      const movedSet = new Set([mover, ...swapped]);
      for (const h of heroes) {
        const p = posOf(h), elf = h.sig && h.sigSpecies === 'elf';
        const res = DH.resolveTargets(h.pattern, p,
          (c, r) => { const u = unitAt(c, r); return !!u && u.side === 'monster'; },
          (c, r) => { if (elf) return false; const u = unitAt(c, r); return !!u && u.side === 'hero' && u !== h; }, blocksLine);
        const targets = res.targets.map(q => unitAt(q[0], q[1]));
        for (const t of targets) {
          const r = DH.calcDamage(h, t, { noRoll: true, dirsHit: res.dirsHit, targets: targets.length, moved: movedSet.has(h), turn: b.turn });
          const before = dmgOn.get(t) || 0, after = before + r.expected;
          dmgOn.set(t, after);
          score += Math.min(r.expected, Math.max(0, t.hp + t.shieldHp - before));
          if (before < t.hp + t.shieldHp && after >= t.hp + t.shieldHp) score += 40 + t.atk * 2 + (t.boss ? 80 : 0);
        }
        if (h.support && (h.has('heal') || h.has('delayed_heal'))) {
          const r2 = DH.resolveTargets(h.support, p, (c, r) => { const u = unitAt(c, r); return !!u && u.side === 'hero' && u !== h; }, () => false, blocksLine);
          for (const q of r2.targets.map(q => unitAt(q[0], q[1])).concat([h])) score += Math.min(q.maxHp - q.hp, q.maxHp * 0.12) * 0.8;
        }
      }
      // 威脅：還活著的怪物下回合能打到誰
      for (const m of monsters) {
        if ((dmgOn.get(m) || 0) >= m.hp + m.shieldHp) continue;
        const reach = m.speed + (m.pattern.kind === 'melee' ? 1 : 4);
        let near = heroes.filter(h => G.chebyshev(posOf(h), m.pos) <= reach);
        for (const h of near) score -= m.atk * (h.hpRatio < 0.4 ? 0.9 : 0.35) / near.length;
      }
      // 地形
      const mp = posOf(mover);
      if (b.tAt(mp[0], mp[1]) === 'F' && !b.ignoresTerrain(mover) && !mover.hasSig('fire_walker')) score -= 120;
      for (const s of swapped) { const sp = posOf(s); if (b.tAt(sp[0], sp[1]) === 'F' && !b.ignoresTerrain(s)) score -= 120; }
      return score;
    };

    for (const hero of heroes) {
      const dfs = (pos, path, swapped, depth) => {
        if (path.length) {
          const key = hero.uid + '|' + pos.join(',') + '|' + swapped.map(s => s.uid + ':' + posOf(s).join(',')).sort().join(';');
          if (!seen.has(key)) {
            seen.add(key);
            const sc = evaluate(hero, swapped) - path.length * 0.5;
            if (sc > best.score) best = { score: sc, hero, path: path.slice() };
          }
        }
        if (depth === 0) return;
        for (const [dc, dr] of G.ALL) {
          const next = [pos[0] + dc, pos[1] + dr];
          if (!b.canEnter(hero, next[0], next[1])) continue;
          if (b.tAt(next[0], next[1]) === 'I' && !b.ignoresTerrain(hero)) continue;
          if (path.some(p => p[0] === next[0] && p[1] === next[1])) continue;
          const u = unitAt(next[0], next[1]);
          if (u && u.side === 'monster') continue;
          if (u) {                                               // 交換
            if (b.tAt(pos[0], pos[1]) === 'I' && !b.ignoresTerrain(u)) continue;
            const prevU = posOf(u);
            overlay.set(u.uid, pos); overlay.set(hero.uid, next);
            path.push(next); dfs(next, path, swapped.concat([u]), depth - 1); path.pop();
            overlay.set(u.uid, prevU);
          } else {
            overlay.set(hero.uid, next);
            path.push(next); dfs(next, path, swapped, depth - 1); path.pop();
          }
        }
        overlay.set(hero.uid, pos);
      };
      overlay.clear();
      dfs(hero.pos, [], [], MAX_DEPTH);
      overlay.clear();
    }
    return best.hero ? best : null;
  };
})(window.DH);
