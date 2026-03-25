"""回合管理器"""
from enum import Enum, auto


class Phase(Enum):
    PLAYER_SELECT  = auto()   # 等待玩家選取英雄
    PLAYER_MOVE    = auto()   # 顯示可移動格，等待玩家點擊目標
    ENEMY_TURN     = auto()   # 敵人 AI 行動中
    BATTLE_END     = auto()   # 戰鬥結束


class TurnManager:
    def __init__(self):
        self.turn:       int   = 1
        self.phase:      Phase = Phase.PLAYER_SELECT
        self.selected_hero     = None
        self.action_log: list[str] = []

    # ── Phase 切換 ────────────────────────────────────
    def select_hero(self, hero):
        self.selected_hero = hero
        self.phase = Phase.PLAYER_MOVE

    def cancel_select(self):
        self.selected_hero = None
        self.phase = Phase.PLAYER_SELECT

    def end_player_turn(self):
        self.selected_hero = None
        self.phase = Phase.ENEMY_TURN

    def end_enemy_turn(self, heroes: list, enemies: list):
        for h in heroes:
            h.reset_turn()
        self.turn += 1
        self.phase = Phase.PLAYER_SELECT
        self.log(f"── 第 {self.turn} 回合 ──")

        # 勝負檢查
        if all(not e.alive for e in enemies):
            self.phase = Phase.BATTLE_END
            self.log("🏆 勝利！所有敵人已被消滅！")
        elif all(not h.alive for h in heroes):
            self.phase = Phase.BATTLE_END
            self.log("💀 失敗！所有英雄陣亡！")

    def check_end(self, heroes: list, enemies: list) -> bool:
        if all(not e.alive for e in enemies):
            self.phase = Phase.BATTLE_END
            self.log("🏆 勝利！所有敵人已被消滅！")
            return True
        if all(not h.alive for h in heroes):
            self.phase = Phase.BATTLE_END
            self.log("💀 失敗！所有英雄陣亡！")
            return True
        return False

    def all_heroes_acted(self, heroes: list) -> bool:
        return all(h.has_moved or not h.alive for h in heroes)

    # ── Log ───────────────────────────────────────────
    def log(self, msg: str):
        self.action_log.append(msg)
        if len(self.action_log) > 6:
            self.action_log.pop(0)

    @property
    def phase_label(self) -> str:
        labels = {
            Phase.PLAYER_SELECT: "選取英雄",
            Phase.PLAYER_MOVE:   "選擇移動目標",
            Phase.ENEMY_TURN:    "敵人行動中…",
            Phase.BATTLE_END:    "戰鬥結束",
        }
        return labels.get(self.phase, "")
