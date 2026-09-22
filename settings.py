# ── 視窗 ──────────────────────────────────────────────
SCREEN_WIDTH  = 1024
SCREEN_HEIGHT = 768
FPS           = 60
TITLE         = "Dragons & Heroes"

# ── 格子 ──────────────────────────────────────────────
GRID_COLS     = 8
GRID_ROWS     = 6
CELL_SIZE     = 80          # 每格像素大小
GRID_OFFSET_X = (SCREEN_WIDTH  - GRID_COLS * CELL_SIZE) // 2
GRID_OFFSET_Y = 80

# ── 顏色 ──────────────────────────────────────────────
C_BG          = (10,  18,  35)
C_GRID_LINE   = (68,  87, 120)
C_CELL_NORMAL = (23,  38,  66)
C_CELL_HOVER  = (48,  81, 122)
C_CELL_SELECT = (74, 143, 197)
C_CELL_MOVE   = (40, 120,  60)   # 可移動範圍
C_CELL_ATTACK = (160, 50,  50)   # 攻擊範圍

C_WHITE       = (255, 255, 255)
C_BLACK       = (  0,   0,   0)
C_RED         = (220,  60,  60)
C_GREEN       = ( 60, 200,  60)
C_BLUE        = ( 60, 120, 220)
C_YELLOW      = (240, 200,  50)
C_PURPLE      = (160,  60, 220)
C_ORANGE      = (230, 130,  40)
C_GOLD        = (201, 163,  79)
C_PANEL       = (17,  29,  51)
C_PANEL_DARK  = (10,  19,  36)
C_TEXT_MUTED  = (160, 180, 205)

# ── 英雄 placeholder 顏色（對應不同職業）──────────────
HERO_COLORS = {
    "warrior":  (60,  130, 220),
    "mage":     (160,  60, 220),
    "healer":   (60,  200, 100),
    "ranger":   (230, 180,  40),
    "tank":     (180,  80,  40),
}

ENEMY_COLOR  = (220,  60,  60)
BOSS_COLOR   = (220,  30, 120)

# ── 戰鬥數值 ─────────────────────────────────────────
HERO_MOVE_RANGE  = 3     # 每回合可移動格數
ENEMY_MOVE_RANGE = 2

# ── UI ────────────────────────────────────────────────
HUD_HEIGHT    = SCREEN_HEIGHT - GRID_ROWS * CELL_SIZE - GRID_OFFSET_Y - 10
FONT_SIZE_LG  = 28
FONT_SIZE_MD  = 20
FONT_SIZE_SM  = 14
