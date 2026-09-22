"""戰鬥 HUD：顯示回合資訊、行動日誌、英雄狀態"""
import pygame
from settings import (
    SCREEN_WIDTH, SCREEN_HEIGHT, GRID_ROWS, GRID_OFFSET_Y, CELL_SIZE,
    C_BG, C_WHITE, C_YELLOW, C_RED, C_GREEN, C_GOLD, C_PANEL, C_PANEL_DARK, C_TEXT_MUTED,
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
        # ── 頂部：回合旗幟 ──────────────────────────────
        header = pygame.Rect(16, 14, SCREEN_WIDTH - 32, 48)
        pygame.draw.rect(surface, C_PANEL, header, border_radius=9)
        pygame.draw.rect(surface, C_GOLD, header, 1, border_radius=9)
        title = self.font_lg.render(f"第 {turn_mgr.turn} 回合", True, C_GOLD)
        surface.blit(title, (32, 21))
        phase = self.font_md.render(turn_mgr.phase_label, True, C_WHITE)
        surface.blit(phase, (190, 27))
        brand = self.font_sm.render("DRAGONS & HEROES", True, C_TEXT_MUTED)
        surface.blit(brand, brand.get_rect(midright=(SCREEN_WIDTH - 32, 38)))

        # ── 底部面板背景 ────────────────────────────────
        panel_rect = pygame.Rect(0, self.log_y - 5, SCREEN_WIDTH, SCREEN_HEIGHT - self.log_y + 5)
        pygame.draw.rect(surface, C_PANEL_DARK, panel_rect)
        pygame.draw.line(surface, C_GOLD, (20, self.log_y - 5), (SCREEN_WIDTH - 20, self.log_y - 5), 1)

        # ── 行動日誌 ────────────────────────────────────
        log_title = self.font_sm.render("戰 鬥 紀 錄", True, C_GOLD)
        surface.blit(log_title, (20, self.log_y + 2))
        for i, msg in enumerate(turn_mgr.action_log):
            color = C_YELLOW if msg.startswith("──") else C_WHITE
            if "勝利" in msg:
                color = C_GREEN
            elif "失敗" in msg:
                color = C_RED
            surf = self.font_sm.render(msg, True, color)
            surface.blit(surf, (20, self.log_y + 20 + i * 18))

        # ── 英雄狀態欄（右側）──────────────────────────
        rx = SCREEN_WIDTH - 260
        surface.blit(self.font_sm.render("我 方 英 雄", True, C_GOLD), (rx, self.log_y + 2))
        for i, h in enumerate(heroes):
            color = C_WHITE if h.alive else (80, 80, 80)
            acted  = " ✓" if h.has_moved and h.alive else ""
            text = f"{h.name}  {h.hp}/{h.max_hp} HP{acted}"
            surf = self.font_sm.render(text, True, color)
            surface.blit(surf, (rx, self.log_y + 20 + i * 18))

        # ── 操作提示 ────────────────────────────────────
        hint = "[拖曳英雄] 移動（每回合一次）   [ESC] 取消"
        surf = self.font_sm.render(hint, True, C_TEXT_MUTED)
        surface.blit(surf, (20, SCREEN_HEIGHT - 22))
