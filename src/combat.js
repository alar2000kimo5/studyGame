// 傷害計算
//   基礎攻擊 × 天賦加成 × 顏色克制 × 會心 → 防禦減免（100/(100+防禦)）× 每層重甲 0.8 × 格擋／野獸
(function (DH) {
  const C = DH.CONFIG;
  function colorMult(att, def) {
    if (DH.BEATS[att] === def) return C.COLOR_ADV;
    if (DH.BEATS[def] === att) return C.COLOR_DIS;
    return 1;
  }
  // ctx: { dirsHit, moved, noRoll }
  DH.calcDamage = function (attacker, defender, ctx) {
    ctx = ctx || {};
    let mult = 1; const notes = [];
    if (attacker.has('whirlwind') && (ctx.dirsHit || 0) >= 3) { mult += 0.25; notes.push('旋風'); }
    if (attacker.has('finishing_blow') && defender.hpRatio < 0.5) { mult += 0.5; notes.push('致命'); }
    if (attacker.has('berserk') && attacker.hpRatio < 0.5) { mult += 0.3; notes.push('狂暴'); }
    if (attacker.has('fury') && attacker.hp === attacker.maxHp) { mult += 0.25; notes.push('怒火'); }
    if (attacker.has('prepare') && ctx.moved === false) { mult += 0.25; notes.push('蓄勢'); }
    if (attacker.has('hunter') && defender.has('beast')) { mult += 0.5; notes.push('獵殺'); }
    if (attacker.buffAtk > 0) { mult += 0.2; notes.push('鼓舞'); }
    const cm = colorMult(attacker.element, defender.element);
    if (cm > 1) { notes.push('克制'); if (attacker.has('rune')) { mult += 0.25; notes.push('符文'); } }
    else if (cm < 1) notes.push('抗性');
    let base = attacker.atk * mult * cm;
    let crit = false;
    if (!ctx.noRoll && attacker.has('critical') && Math.random() < 0.25) { base *= 1.5; crit = true; notes.push('會心'); }
    base *= 100 / (100 + (defender.defense || 0));
    const layers = defender.armor + (defender.has('shield') ? 1 : 0);
    base *= Math.pow(C.DEF_MULT, layers);
    if (attacker.pattern.kind === 'melee') {
      if (defender.has('beast')) { base *= 0.5; notes.push('野獸'); }
      if (defender.has('parry')) { base *= 0.75; notes.push('格擋'); }
    }
    const roll = ctx.noRoll ? 1 : (0.92 + Math.random() * 0.16);
    const dmg = Math.max(1, Math.round(base * roll));
    return { dmg, cm, notes, crit, expected: Math.max(1, Math.round(base)) };
  };
  DH.colorMult = colorMult;
})(window.DH);
