"""選關畫面"""
import pygame
from settings import SCREEN_WIDTH, SCREEN_HEIGHT, C_BG, C_WHITE, C_YELLOW, C_GREEN
from scenes.levels import LEVELS


class MapScene:
    def __init__(self, screen: pygame.Surface):
        self.screen     = screen
        self.selected   = 0
        self._next_level = None

        try:
            self.font_title = pygame.font.SysFont("microsoftyahei", 36, bold=True)
            self.font_item  = pygame.font.SysFont("microsoftyahei", 24)
            self.font_desc  = pygame.font.SysFont("microsoftyahei", 18)
        except Exception:
            self.font_title = pygame.font.SysFont("Arial", 36, bold=True)
            self.font_item  = pygame.font.SysFont("Arial", 24)
            self.font_desc  = pygame.font.SysFont("Arial", 18)

    def get_next_level(self) -> int | None:
        lvl = self._next_level
        self._next_level = None
        return lvl

    def handle_event(self, event: pygame.event.Event):
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_UP, pygame.K_w):
                self.selected = (self.selected - 1) % len(LEVELS)
            elif event.key in (pygame.K_DOWN, pygame.K_s):
                self.selected = (self.selected + 1) % len(LEVELS)
            elif event.key in (pygame.K_RETURN, pygame.K_SPACE):
                self._next_level = LEVELS[self.selected]["id"]

    def draw(self):
        self.screen.fill(C_BG)
        title = self.font_title.render("選擇關卡", True, C_YELLOW)
        self.screen.blit(title, title.get_rect(center=(SCREEN_WIDTH // 2, 60)))

        start_y = 130
        for i, lvl in enumerate(LEVELS):
            is_sel = (i == self.selected)
            color  = C_YELLOW if is_sel else C_WHITE
            prefix = "▶ " if is_sel else "  "

            item = self.font_item.render(f"{prefix}{lvl['name']}", True, color)
            self.screen.blit(item, (SCREEN_WIDTH // 2 - 220, start_y + i * 70))

            if is_sel:
                desc = self.font_desc.render(lvl["description"], True, (160, 200, 160))
                self.screen.blit(desc, (SCREEN_WIDTH // 2 - 220, start_y + i * 70 + 28))

        hint = self.font_desc.render("↑↓ 選關   ENTER 進入", True, (130, 150, 180))
        self.screen.blit(hint, hint.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 30)))
