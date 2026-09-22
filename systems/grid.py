"""格子系統：渲染 + 座標轉換 + 可達格計算"""
import pygame
from settings import (
    GRID_COLS, GRID_ROWS, CELL_SIZE,
    GRID_OFFSET_X, GRID_OFFSET_Y,
    C_GRID_LINE, C_CELL_NORMAL, C_CELL_HOVER,
    C_CELL_SELECT, C_CELL_MOVE, C_CELL_ATTACK,
)


def cell_to_pixel(col: int, row: int) -> tuple[int, int]:
    """格子座標 → 螢幕像素（左上角）"""
    return (
        GRID_OFFSET_X + col * CELL_SIZE,
        GRID_OFFSET_Y + row * CELL_SIZE,
    )


def pixel_to_cell(x: int, y: int) -> tuple[int, int] | None:
    """螢幕像素 → 格子座標，超出範圍回傳 None"""
    col = (x - GRID_OFFSET_X) // CELL_SIZE
    row = (y - GRID_OFFSET_Y) // CELL_SIZE
    if 0 <= col < GRID_COLS and 0 <= row < GRID_ROWS:
        return (col, row)
    return None


def get_reachable(start: tuple, move_range: int, blocked: set[tuple]) -> set[tuple]:
    """BFS 計算從 start 出發、步數 ≤ move_range 且不經過 blocked 的所有格子"""
    visited = {start}
    frontier = {start}
    for _ in range(move_range):
        next_frontier = set()
        for col, row in frontier:
            for dc, dr in [(1,0),(-1,0),(0,1),(0,-1)]:
                nc, nr = col + dc, row + dr
                if (0 <= nc < GRID_COLS and 0 <= nr < GRID_ROWS
                        and (nc, nr) not in visited
                        and (nc, nr) not in blocked):
                    visited.add((nc, nr))
                    next_frontier.add((nc, nr))
        frontier = next_frontier
    visited.discard(start)
    return visited


def get_adjacent(pos: tuple) -> list[tuple]:
    """回傳上下左右相鄰的合法格子"""
    col, row = pos
    result = []
    for dc, dr in [(1,0),(-1,0),(0,1),(0,-1)]:
        nc, nr = col + dc, row + dr
        if 0 <= nc < GRID_COLS and 0 <= nr < GRID_ROWS:
            result.append((nc, nr))
    return result


class Grid:
    def __init__(self):
        self.hovered: tuple | None = None
        self.selected: tuple | None = None
        self.move_tiles:   set[tuple] = set()
        self.attack_tiles: set[tuple] = set()
        self.drag_target:  tuple | None = None   # 拖曳中的目標格
        self.drag_valid:   bool = False          # 目標格是否合法

    def update(self, mouse_pos: tuple):
        self.hovered = pixel_to_cell(*mouse_pos)

    def set_move_tiles(self, tiles: set[tuple]):
        self.move_tiles = tiles

    def set_attack_tiles(self, tiles: set[tuple]):
        self.attack_tiles = tiles

    def clear_highlights(self):
        self.selected     = None
        self.move_tiles   = set()
        self.attack_tiles = set()
        self.drag_target  = None
        self.drag_valid   = False

    def draw(self, surface: pygame.Surface):
        board = pygame.Rect(GRID_OFFSET_X - 8, GRID_OFFSET_Y - 8,
                            GRID_COLS * CELL_SIZE + 16, GRID_ROWS * CELL_SIZE + 16)
        pygame.draw.rect(surface, (12, 23, 43), board, border_radius=10)
        pygame.draw.rect(surface, (201, 163, 79), board, 2, border_radius=10)
        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                pos = (col, row)
                x, y = cell_to_pixel(col, row)
                rect = pygame.Rect(x, y, CELL_SIZE, CELL_SIZE)

                if pos == self.selected:
                    color = C_CELL_SELECT
                elif pos == self.hovered:
                    color = C_CELL_HOVER
                else:
                    color = C_CELL_NORMAL

                pygame.draw.rect(surface, color, rect, border_radius=4)
                pygame.draw.rect(surface, C_GRID_LINE, rect, 1, border_radius=4)
