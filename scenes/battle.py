"""主戰鬥場景：整合格子、英雄、敵人、回合系統"""
import pygame
from settings import C_BG, SCREEN_WIDTH, SCREEN_HEIGHT, CELL_SIZE, C_WHITE
from systems.grid import Grid, get_adjacent, pixel_to_cell, cell_to_pixel
from systems.turn_manager import TurnManager, Phase
from ui.hud import HUD


class BattleScene:
    def __init__(self, screen: pygame.Surface, level_data: dict):
        self.screen   = screen
        self.grid     = Grid()
        self.turn_mgr = TurnManager()
        self.hud      = HUD()
        self.font     = self.hud.font_sm

        self.heroes:  list = level_data["heroes"]
        self.enemies: list = level_data["enemies"]

        self.turn_mgr.log("── 第 1 回合 ──")

        self._enemy_timer = 0.0

        # 拖曳狀態
        self._dragging_hero  = None
        self._drag_mouse_pos = (0, 0)
        self._drag_start_pos = None
        self._drag_last_cell = None
        self._swap_log: list = []

    # ── 主循環 ──────────────────────────────────────────
    def handle_event(self, event: pygame.event.Event):
        phase = self.turn_mgr.phase

        if phase == Phase.BATTLE_END:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_RETURN:
                pass  # 由 main.py 處理返回
            return

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._cancel_drag()

        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if phase not in (Phase.PLAYER_SELECT, Phase.PLAYER_MOVE):
                return
            cell = pixel_to_cell(*event.pos)
            if cell is None:
                return
            hero = self._hero_at(cell)
            if hero and hero.alive and not hero.has_moved:
                self._start_drag(hero)

        elif event.type == pygame.MOUSEMOTION:
            self._drag_mouse_pos = event.pos
            if self._dragging_hero:
                self._process_drag_motion(event.pos)

        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            if self._dragging_hero:
                self._end_drag()

    def update(self, dt: float):
        self.grid.update(pygame.mouse.get_pos())

        if self.turn_mgr.phase == Phase.ENEMY_TURN:
            self._enemy_timer += dt
            if self._enemy_timer >= 0.6:
                self._run_enemy_turn()
                self._enemy_timer = 0.0

    def draw(self):
        self.screen.fill(C_BG)
        self.grid.draw(self.screen)
        for e in self.enemies:
            e.draw(self.screen, self.font)
        for h in self.heroes:
            if h is not self._dragging_hero:
                h.draw(self.screen, self.font)
        if self._dragging_hero:
            self._draw_dragged_hero()
        self.hud.draw(self.screen, self.turn_mgr, self.heroes, self.enemies)
        if self.turn_mgr.phase == Phase.BATTLE_END:
            self._draw_end_screen()

    # ── 拖曳邏輯 ────────────────────────────────────────
    def _start_drag(self, hero):
        self._dragging_hero  = hero
        self._drag_mouse_pos = pygame.mouse.get_pos()
        self._drag_start_pos = hero.pos
        self._drag_last_cell = hero.pos
        self._swap_log: list[tuple] = []   # 記錄 (hero_a, hero_b) 交換對，放開後再觸發
        self.turn_mgr.select_hero(hero)

    def _process_drag_motion(self, mouse_pos: tuple):
        """拖曳中只換位置，不觸發技能/攻擊"""
        cell = pixel_to_cell(*mouse_pos)
        if cell is None or cell == self._drag_last_cell:
            return

        hero = self._dragging_hero

        # 不能穿越敵人
        if self._enemy_at(cell) and self._enemy_at(cell).alive:
            return

        prev_cell = self._drag_last_cell
        ally = self._ally_at(cell)
        if ally:
            ally.col, ally.row = prev_cell
            hero.col, hero.row = cell
            self._swap_log.append((hero, ally))   # 先記錄，稍後統一觸發
        else:
            hero.col, hero.row = cell

        self._drag_last_cell = cell

    def _end_drag(self):
        hero = self._dragging_hero
        self._dragging_hero = None

        if hero.pos == self._drag_start_pos:
            self._cancel_drag()
            return

        hero.has_moved = True
        self.grid.clear_highlights()

        # ── 放開後：統一觸發所有技能 ───────────────────
        triggered = set()
        for hero_a, hero_b in self._swap_log:
            for h in (hero_a, hero_b):
                if h not in triggered:
                    triggered.add(h)
                    other = hero_b if h is hero_a else hero_a
                    msg = h.on_swap(other)
                    if msg:
                        self.turn_mgr.log(msg)
                        self._apply_skill(h)

        # ── 所有有移動的英雄都進行攻擊 ─────────────────
        moved_heroes = {hero} | {h for pair in self._swap_log for h in pair}
        for h in moved_heroes:
            if h.alive:
                self._auto_attack(h)

        self._swap_log = []

        if self.turn_mgr.check_end(self.heroes, self.enemies):
            return
        self._finish_player_turn()

    def _cancel_drag(self):
        self._dragging_hero = None
        self._swap_log = []
        self.turn_mgr.cancel_select()
        self.grid.clear_highlights()

    def _draw_dragged_hero(self):
        hero = self._dragging_hero
        mx, my = self._drag_mouse_pos
        r = CELL_SIZE // 2 - 6

        surf = pygame.Surface((CELL_SIZE, CELL_SIZE), pygame.SRCALPHA)
        pygame.draw.circle(surf, (*hero.color, 210), (CELL_SIZE//2, CELL_SIZE//2), r)
        pygame.draw.circle(surf, (*C_WHITE, 210), (CELL_SIZE//2, CELL_SIZE//2), r, 2)
        label = self.font.render(hero.name[:2], True, C_WHITE)
        surf.blit(label, label.get_rect(center=(CELL_SIZE//2, CELL_SIZE//2)))
        self.screen.blit(surf, (mx - CELL_SIZE//2, my - CELL_SIZE//2))

    # ── 技能 ────────────────────────────────────────────
    def _apply_skill(self, hero):
        from entities.heroes.all_heroes import Mage, Healer
        if isinstance(hero, Mage):
            for e in self.enemies:
                if e.alive:
                    dmg = e.take_damage(hero.aoe_damage())
                    self.turn_mgr.log(f"  ↳ AOE 打中 {e.name} -{dmg}")
        elif isinstance(hero, Healer):
            for h in self.heroes:
                if h.alive:
                    h.heal(hero.heal_power)
            self.turn_mgr.log(f"  ↳ 全隊回復 {hero.heal_power} HP")

    def _auto_attack(self, hero):
        for adj in get_adjacent(hero.pos):
            enemy = self._enemy_at(adj)
            if enemy and enemy.alive:
                dmg = enemy.take_damage(hero.atk)
                self.turn_mgr.log(f"{hero.name} 攻擊 {enemy.name} -{dmg} HP")

    # ── 敵人回合 ────────────────────────────────────────
    def _finish_player_turn(self):
        self.turn_mgr.end_player_turn()
        self.grid.clear_highlights()

    def _run_enemy_turn(self):
        all_ents = self.heroes + self.enemies
        for enemy in self.enemies:
            if enemy.alive:
                for msg in enemy.ai_action(self.heroes, all_ents):
                    self.turn_mgr.log(msg)
        if self.turn_mgr.check_end(self.heroes, self.enemies):
            return
        self.turn_mgr.end_enemy_turn(self.heroes, self.enemies)

    # ── 輔助查詢 ─────────────────────────────────────────
    def _hero_at(self, pos: tuple):
        for h in self.heroes:
            if h.alive and h.pos == pos:
                return h
        return None

    def _ally_at(self, pos: tuple):
        """回傳該格的友方英雄（排除正在拖曳的英雄本身）"""
        for h in self.heroes:
            if h.alive and h is not self._dragging_hero and h.pos == pos:
                return h
        return None

    def _enemy_at(self, pos: tuple):
        for e in self.enemies:
            if e.alive and e.pos == pos:
                return e
        return None

    def _all_positions(self, exclude=None) -> set:
        return {e.pos for e in self.heroes + self.enemies
                if e.alive and e is not exclude}

    def _draw_end_screen(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        self.screen.blit(overlay, (0, 0))

        last_log = self.turn_mgr.action_log[-1] if self.turn_mgr.action_log else ""
        color = (80, 220, 80) if "勝利" in last_log else (220, 60, 60)
        text  = self.hud.font_lg.render(last_log, True, color)
        self.screen.blit(text, text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2)))
        hint = self.hud.font_md.render("按 [ENTER] 返回選關畫面", True, (200, 200, 200))
        self.screen.blit(hint, hint.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 + 50)))


