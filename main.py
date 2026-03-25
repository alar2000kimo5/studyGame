"""遊戲入口"""
import pygame
import sys
from settings import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, TITLE, C_BG
from scenes.map    import MapScene
from scenes.battle import BattleScene
from scenes.levels import get_level


def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption(TITLE)
    clock = pygame.time.Clock()

    scene_map    = MapScene(screen)
    scene_battle = None
    current      = "map"   # "map" | "battle"

    while True:
        dt = clock.tick(FPS) / 1000.0

        # ── 事件 ──────────────────────────────────────
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if current == "map":
                scene_map.handle_event(event)
            elif current == "battle":
                scene_battle.handle_event(event)
                # 戰鬥結束後按 ENTER 返回選關
                if (event.type == pygame.KEYDOWN
                        and event.key == pygame.K_RETURN
                        and scene_battle.turn_mgr.phase.name == "BATTLE_END"):
                    scene_map    = MapScene(screen)
                    scene_battle = None
                    current      = "map"

        # ── 場景切換 ────────────────────────────────
        if current == "map":
            lvl_id = scene_map.get_next_level()
            if lvl_id is not None:
                level_data   = get_level(lvl_id)
                scene_battle = BattleScene(screen, level_data)
                current      = "battle"

        # ── 更新 & 繪製 ─────────────────────────────
        if current == "map":
            scene_map.draw()
        elif current == "battle":
            scene_battle.update(dt)
            scene_battle.draw()

        pygame.display.flip()


if __name__ == "__main__":
    main()
