"""英雄基底類別"""
import pygame
from settings import CELL_SIZE, HERO_MOVE_RANGE, C_WHITE, C_RED, C_GREEN, FONT_SIZE_SM


class Hero:
    def __init__(self, name: str, col: int, row: int, color: tuple,
                 hp: int = 100, atk: int = 20, defense: int = 5,
                 move_range: int = HERO_MOVE_RANGE):
        self.name        = name
        self.col         = col
        self.row         = row
        self.color       = color
        self.max_hp      = hp
        self.hp          = hp
        self.atk         = atk
        self.defense     = defense
        self.move_range  = move_range
        self.has_moved   = False   # 本回合是否已行動
        self.alive       = True

    @property
    def pos(self) -> tuple[int, int]:
        return (self.col, self.row)

    def move_to(self, col: int, row: int):
        self.col = col
        self.row = row
        self.has_moved = True

    def take_damage(self, amount: int):
        dmg = max(1, amount - self.defense)
        self.hp = max(0, self.hp - dmg)
        if self.hp == 0:
            self.alive = False
        return dmg

    def heal(self, amount: int):
        self.hp = min(self.max_hp, self.hp + amount)

    def reset_turn(self):
        self.has_moved = False

    def on_swap(self, other: "Hero"):
        """當此英雄與 other 交換位置時觸發（子類別覆寫實作技能）"""
        pass

    def draw(self, surface: pygame.Surface, font: pygame.font.Font):
        if not self.alive:
            return
        from systems.grid import cell_to_pixel
        x, y = cell_to_pixel(self.col, self.row)
        cx, cy = x + CELL_SIZE // 2, y + CELL_SIZE // 2
        r = CELL_SIZE // 2 - 6

        # 本體圓形
        pygame.draw.circle(surface, self.color, (cx, cy), r)
        # 灰邊（已行動）or 白邊
        border = (120, 120, 120) if self.has_moved else C_WHITE
        pygame.draw.circle(surface, border, (cx, cy), r, 2)

        # 名字縮寫
        label = font.render(self.name[:2], True, C_WHITE)
        surface.blit(label, label.get_rect(center=(cx, cy)))

        # HP 條
        bar_w = CELL_SIZE - 12
        bar_h = 5
        bx, by = x + 6, y + CELL_SIZE - 10
        pygame.draw.rect(surface, C_RED,   (bx, by, bar_w, bar_h))
        fill_w = int(bar_w * self.hp / self.max_hp)
        pygame.draw.rect(surface, C_GREEN, (bx, by, fill_w, bar_h))
