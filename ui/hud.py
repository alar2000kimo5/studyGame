"""戰鬥 HUD：顯示回合資訊、行動日誌、英雄狀態"""
import pygame
from settings import (
    SCREEN_WIDTH, SCREEN_HEIGHT, GRID_ROWS, GRID_OFFSET_Y, CELL_SIZE,
    C_BG, C_WHITE, C_YELLOW, C_RED, C_GREEN,
    FONT_SIZE_LG, FONT_SIZE_MD, FONT_SIZE_SM,
)


class HUD:
    def __init__(self):
        pygame.font.init()
        self.font_lg = pygame.font.SysFont("Arial", FONT_SIZE_LG, bold=True)
        self.font_md = pygame.font.SysFont("Arial", FONT_SIZE_MD)
        self.font_sm = pygame.font.SysFont("Arial", FONT_SIZE_SM)
        # 嘗試載入支援中文的字型
        try:
            self.font_lg = pygame.font.SysFont("microsoftyahei", FONT_SIZE_LG, bold=True)
            self.font_md = pygame.font.SysFont("microsoftyahei", FONT_SIZE_MD)
            self.font_sm = pygame.font.SysFont("microsoftyahei", FONT_SIZE_SM)
        except Exception:
            pass

        self.log_y = GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE + 10

    def draw(self, surface: pygame.Surface, turn_mgr, heroes: list, enemies: list):
        # ── 頂部：回合標題 ──────────────────────────────
        title = self.font_lg.render(
            f"第 {turn_mgr.turn} 回合  |  {turn_mgr.phase_label}", True, C_YELLOW
        )
        surface.blit(title, (20, 10))

        # ── 底部面板背景 ────────────────────────────────
        panel_rect = pygame.Rect(0, self.log_y - 5, SCREEN_WIDTH, SCREEN_HEIGHT - self.log_y + 5)
        pygame.draw.rect(surface, (10, 15, 30), panel_rect)
        pygame.draw.line(surface, (50, 70, 110), (0, self.log_y - 5), (SCREEN_WIDTH, self.log_y - 5), 1)

        # ── 行動日誌 ────────────────────────────────────
        for i, msg in enumerate(turn_mgr.action_log):
            color = C_YELLOW if msg.startswith("──") else C_WHITE
            if "勝利" in msg:
                color = C_GREEN
            elif "失敗" in msg:
                color = C_RED
            surf = self.font_sm.render(msg, True, color)
            surface.blit(surf, (20, self.log_y + i * 18))

        # ── 英雄狀態欄（右側）──────────────────────────
        rx = SCREEN_WIDTH - 260
        surface.blit(self.font_sm.render("我方英雄", True, C_YELLOW), (rx, self.log_y))
        for i, h in enumerate(heroes):
            color = C_WHITE if h.alive else (80, 80, 80)
            acted  = " ✓" if h.has_moved and h.alive else ""
            text = f"{h.name}  {h.hp}/{h.max_hp} HP{acted}"
            surf = self.font_sm.render(text, True, color)
            surface.blit(surf, (rx, self.log_y + (i + 1) * 18))

        # ── 操作提示 ────────────────────────────────────
        hint = "[拖曳英雄] 移動（每回合一次）   [ESC] 取消"
        surf = self.font_sm.render(hint, True, (130, 150, 180))
        surface.blit(surf, (20, SCREEN_HEIGHT - 22))
