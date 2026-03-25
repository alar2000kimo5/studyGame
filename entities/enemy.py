"""敵人類別"""
import pygame
from settings import CELL_SIZE, ENEMY_MOVE_RANGE, ENEMY_COLOR, C_WHITE, C_RED, C_GREEN, BOSS_COLOR
from entities.hero import Hero
from systems.grid import get_reachable, get_adjacent


class Enemy(Hero):
    def __init__(self, name: str, col: int, row: int,
                 hp: int = 60, atk: int = 15, defense: int = 2,
                 move_range: int = ENEMY_MOVE_RANGE, is_boss: bool = False):
        color = BOSS_COLOR if is_boss else ENEMY_COLOR
        super().__init__(name, col, row, color, hp, atk, defense, move_range)
        self.is_boss = is_boss
        self.attack_range = 1  # 攻擊鄰接格

    def draw(self, surface: pygame.Surface, font: pygame.font.Font):
        if not self.alive:
            return
        from systems.grid import cell_to_pixel
        x, y = cell_to_pixel(self.col, self.row)
        cx, cy = x + CELL_SIZE // 2, y + CELL_SIZE // 2
        r = CELL_SIZE // 2 - 6

        # 敵人用正方形
        rect = pygame.Rect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12)
        pygame.draw.rect(surface, self.color, rect, border_radius=4)
        pygame.draw.rect(surface, C_WHITE,    rect, 2, border_radius=4)

        label = font.render(self.name[:2], True, C_WHITE)
        surface.blit(label, label.get_rect(center=(cx, cy)))

        # HP 條
        bar_w = CELL_SIZE - 12
        bar_h = 5
        bx, by = x + 6, y + CELL_SIZE - 10
        pygame.draw.rect(surface, C_RED,   (bx, by, bar_w, bar_h))
        fill_w = int(bar_w * self.hp / self.max_hp)
        pygame.draw.rect(surface, (200, 50, 50), (bx, by, fill_w, bar_h))

    def ai_action(self, heroes: list, all_entities: list) -> list[str]:
        """簡單 AI：移向最近英雄，若鄰接則攻擊。回傳 log 訊息。"""
        log = []
        alive_heroes = [h for h in heroes if h.alive]
        if not alive_heroes:
            return log

        # 找最近英雄（曼哈頓距離）
        target = min(alive_heroes, key=lambda h: abs(h.col - self.col) + abs(h.row - self.row))

        # 已佔格子（排除自己）
        blocked = {e.pos for e in all_entities if e.alive and e is not self}

        # 嘗試移動
        reachable = get_reachable(self.pos, self.move_range, blocked)
        if reachable:
            # 選擇最靠近目標的格子
            best = min(reachable, key=lambda p: abs(p[0] - target.col) + abs(p[1] - target.row))
            self.move_to(*best)
            log.append(f"{self.name} 移動到 {best}")

        # 攻擊鄰接英雄
        for adj in get_adjacent(self.pos):
            for h in alive_heroes:
                if h.pos == adj:
                    dmg = h.take_damage(self.atk)
                    log.append(f"{self.name} 攻擊 {h.name} 造成 {dmg} 傷害")
                    break

        return log
