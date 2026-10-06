// 全域設定：畫布尺寸、棋盤、規則、配色
window.DH = window.DH || {};
(function (DH) {
  DH.CONFIG = {
    W: 540, H: 960,                 // 邏輯畫布尺寸（直向 9:16）
    COLS: 7, ROWS: 8, CELL: 70,
    BOARD_X: 25, BOARD_Y: 118,
    MOVE_TIME: 5.0,                 // 拖曳時限（秒）
    COLOR_ADV: 1.5, COLOR_DIS: 0.75,
    DEF_MULT: 0.8,                  // 每層防禦 ×0.8
    HERO_ROW: 7,
  };

  // 顏色屬性：藍 > 紅 > 綠 > 藍，光／暗中立
  DH.ELEMENTS = {
    red:   { name: '紅', color: '#e2483c', dark: '#8f2a22', light: '#ff8a7a' },
    green: { name: '綠', color: '#4cba54', dark: '#2a7a33', light: '#8fe596' },
    blue:  { name: '藍', color: '#408cec', dark: '#24559c', light: '#8dc0ff' },
    light: { name: '光', color: '#f4d66e', dark: '#a98a2c', light: '#fff0b3' },
    dark:  { name: '暗', color: '#8c52c8', dark: '#55307c', light: '#c79af0' },
  };
  DH.BEATS = { blue: 'red', red: 'green', green: 'blue' };

  DH.PALETTE = {
    bgTop: '#1b1626', bgBottom: '#0b0912',
    frame: '#4a3a2c', frameDark: '#2b2018', frameLight: '#6e573f',
    panel: '#211b2e', panelLight: '#2f2742', panelEdge: '#4a3f63',
    text: '#efe9f6', textDim: '#a79fbf', gold: '#f6c64a', goldDark: '#a97d1c',
    hpHero: '#5ad45f', hpMonster: '#e64e42', hpBg: '#1a141f',
    highlight: '#7ac8ff', preview: '#ff6e5a', heal: '#7af096',
    melee: '#f0a040', ranged: '#6fd36f', magic: '#6fa8ff',
  };

  // 關卡主題（棋盤石板配色）
  DH.THEMES = {
    forest: { a: '#6f7a62', b: '#64705a', edge: '#3f4a38', hi: '#8d9a7e', bg1: '#182218', bg2: '#0a100a', deco: '#55803f' },
    camp:   { a: '#7d7262', b: '#71675a', edge: '#4a4236', hi: '#9c9080', bg1: '#2a2016', bg2: '#110c08', deco: '#a06a32' },
    grave:  { a: '#6a6c78', b: '#5f616d', edge: '#3c3e4a', hi: '#8a8c9a', bg1: '#161a26', bg2: '#080a10', deco: '#7d8bb0' },
    den:    { a: '#78665c', b: '#6b5b52', edge: '#453730', hi: '#978478', bg1: '#241a16', bg2: '#0e0907', deco: '#b57850' },
    cave:   { a: '#5d6878', b: '#535d6c', edge: '#333b47', hi: '#7b8798', bg1: '#121a26', bg2: '#060a10', deco: '#4fa0d8' },
    lair:   { a: '#6f5250', b: '#634846', edge: '#3f2a28', hi: '#92706c', bg1: '#2a1212', bg2: '#100505', deco: '#e2602c' },
  };
})(window.DH);
