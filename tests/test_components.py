import os
import unittest

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")

import pygame

from ui.components import draw_health_bar


class DrawHealthBarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        pygame.init()

    @classmethod
    def tearDownClass(cls):
        pygame.quit()

    def test_draws_gold_frame_and_health_fill_for_partial_health(self):
        """Catches a panel health bar losing its visual state distinction."""
        surface = pygame.Surface((120, 24))
        draw_health_bar(surface, pygame.Rect(10, 8, 100, 8), current=25, maximum=100)

        self.assertEqual(surface.get_at((10, 11))[:3], (201, 163, 79))
        self.assertEqual(surface.get_at((30, 11))[:3], (78, 190, 126))
        self.assertEqual(surface.get_at((80, 11))[:3], (37, 52, 75))

    def test_allows_enemy_bars_to_use_a_danger_fill(self):
        """Catches enemy health bars becoming indistinguishable from allied ones."""
        surface = pygame.Surface((120, 24))
        draw_health_bar(surface, pygame.Rect(10, 8, 100, 8), current=25, maximum=100,
                        fill_color=(197, 72, 82))

        self.assertEqual(surface.get_at((30, 11))[:3], (197, 72, 82))


if __name__ == "__main__":
    unittest.main()
