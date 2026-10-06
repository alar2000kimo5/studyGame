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
    if (attacker.buffAtk > 0) { mult += 0.2 + (attacker.supportAtk || 0); notes.push('鼓舞'); }
    if (attacker.swapBuff > 0) { mult += attacker.swapBuff; notes.push('換位'); }
    if (attacker.iceBuff > 0) { mult += attacker.iceBuff; notes.push('滑行'); }
    let cm = colorMult(attacker.element, defender.element);
    // ── 專武 ──
    if (attacker.sig) {
      const sc = attacker.sig.scale, sp = attacker.sigSpecies;
      if (sp === 'orc' && attacker.rage > 0) { mult += Math.min(attacker.rage * 8, 40) * sc / 100; notes.push('血怒'); }
      if (sp === 'elf' && ctx.elfReady) { mult += 0.30 * sc; notes.push('疾影'); }
      const k = attacker.hasSig.bind(attacker), P = i => attacker.sigPct(i);
      if (k('multi_bonus') && (ctx.targets || 1) >= attacker.sigParam(0)) { mult += attacker.sigParam(1) * sc / 100; notes.push('連擊'); }
      if (k('single_bonus') && (ctx.targets || 1) === 1) { mult += P(0); notes.push('專注'); }
      if (k('vs_tag') && defender.has(attacker.sigParam(0))) { mult += attacker.sigParam(1) * sc / 100; notes.push('剋星'); }
      if (k('first_strike') && ctx.orderIndex === 0) { mult += P(0); notes.push('先手'); }
      if (k('last_strike') && ctx.orderLast) { mult += P(0); notes.push('殿後'); }
      if (k('unmoved_bonus') && ctx.moved === false) { mult += P(0); notes.push('不動'); }
      if (k('moved_bonus') && ctx.moved === true) { mult += P(0); notes.push('突進'); }
      if (k('low_hp_dmg') && attacker.hpRatio < 0.5) { mult += P(0); notes.push('背水'); }
      if (k('turn1_bonus') && ctx.turn === 1) { mult += P(0); notes.push('首擊'); }
      if (k('poison_amp') && defender.status.poison) { mult += P(0); notes.push('毒傷'); }
      if (k('burn_amp') && defender.status.burn) { mult += P(0); notes.push('焚傷'); }
      if (k('boss_slayer') && defender.boss) { mult += P(0); notes.push('屠龍'); }
      if (k('hp_to_atk')) { mult += Math.floor((1 - attacker.hpRatio) * 10) * P(0); }
      if (k('fire_walker') && attacker.onFire) { mult += P(0); notes.push('烈焰'); }
      if (k('color_adv_up') && cm > 1) cm = 1.5 + attacker.sigParam(0) * sc;
      if (k('ignore_resist') && cm < 1) cm = 1;
    }
    if (cm > 1) { notes.push('克制'); if (attacker.has('rune')) { mult += 0.25; notes.push('符文'); } }
    else if (cm < 1) notes.push('抗性');
    let base = attacker.atk * mult * cm;
    let crit = false;
    let critChance = attacker.has('critical') ? 0.25 : 0;
    if (attacker.sig && attacker.sigSpecies === 'halfling') critChance += 0.25 * attacker.sig.scale;
    if (!ctx.noRoll && critChance > 0 && Math.random() < critChance) { base *= 1.5; crit = true; notes.push('會心'); }
    base *= 100 / (100 + (defender.defense || 0));
    // 防守方專武
    if (defender.sig) {
      if (defender.hasSig('low_hp_def') && defender.hpRatio < 0.5) base *= 1 - defender.sigPct(0);
      if (defender.hasSig('boss_slayer') && attacker.boss) base *= 1 - defender.sigPct(1);
    }
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
