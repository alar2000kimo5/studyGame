// 傷害計算
(function (DH) {
  const C = DH.CONFIG;
  function colorMult(att, def) {
    if (DH.BEATS[att] === def) return C.COLOR_ADV;
    if (DH.BEATS[def] === att) return C.COLOR_DIS;
    return 1;
  }
  // 回傳 { dmg, mult, notes[] }
  DH.calcDamage = function (attacker, defender, ctx) {
    ctx = ctx || {};
    let mult = 1; const notes = [];
    if (attacker.has('whirlwind') && (ctx.dirsHit || 0) >= 3) { mult += 0.25; notes.push('旋風'); }
    if (attacker.has('finishing_blow') && defender.hpRatio < 0.5) { mult += 0.5; notes.push('致命'); }
    if (attacker.has('berserk') && attacker.hpRatio < 0.5) { mult += 0.3; notes.push('狂暴'); }
    if (attacker.has('fury') && attacker.hp === attacker.maxHp) { mult += 0.25; notes.push('怒火'); }
    const cm = colorMult(attacker.element, defender.element);
    if (cm > 1) notes.push('克制'); else if (cm < 1) notes.push('抗性');
    let base = attacker.atk * mult * cm;
    let layers = defender.armor + (defender.has('shield') ? 1 : 0);
    base *= Math.pow(C.DEF_MULT, layers);
    if (defender.has('beast') && attacker.pattern.kind === 'melee') { base *= 0.5; notes.push('野獸'); }
    const roll = ctx.noRoll ? 1 : (0.92 + Math.random() * 0.16);
    const dmg = Math.max(1, Math.round(base * roll));
    return { dmg, cm, notes, expected: Math.max(1, Math.round(base)) };
  };
  DH.colorMult = colorMult;
})(window.DH);
