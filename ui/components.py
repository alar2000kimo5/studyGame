"""Reusable visual elements for the battle interface."""
import pygame


GOLD = (201, 163, 79)
HEALTH = (78, 190, 126)
HEALTH_TRACK = (37, 52, 75)


def draw_health_bar(surface: pygame.Surface, rect: pygame.Rect,
                    current: int, maximum: int,
                    fill_color: tuple[int, int, int] = HEALTH) -> None:
    """Draw a framed health bar with a safe, clamped fill amount."""
    pygame.draw.rect(surface, GOLD, rect, border_radius=3)
    inner = rect.inflate(-2, -2)
    pygame.draw.rect(surface, HEALTH_TRACK, inner, border_radius=2)
    ratio = 0 if maximum <= 0 else max(0, min(current / maximum, 1))
    if ratio:
        fill = inner.copy()
        fill.width = max(1, round(inner.width * ratio))
        pygame.draw.rect(surface, fill_color, fill, border_radius=2)
