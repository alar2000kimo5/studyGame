"""5 個英雄角色，各有獨特的交換技能"""
import pygame
from settings import HERO_COLORS, C_GREEN
from entities.hero import Hero


class Warrior(Hero):
    """戰士：交換後對鄰近敵人造成額外傷害"""
    def __init__(self, col: int, row: int):
        super().__init__("戰士", col, row, HERO_COLORS["warrior"],
                         hp=120, atk=25, defense=8)
        self.skill_name = "衝鋒斬"

    def on_swap(self, other: "Hero") -> str:
        return f"[{self.skill_name}] {self.name} 交換後準備衝鋒！"

    def skill_damage(self) -> int:
        return int(self.atk * 1.5)


class Mage(Hero):
    """法師：交換後對所有敵人造成 AOE 魔法傷害"""
    def __init__(self, col: int, row: int):
        super().__init__("法師", col, row, HERO_COLORS["mage"],
                         hp=70, atk=35, defense=2)
        self.skill_name = "火球爆炸"

    def on_swap(self, other: "Hero") -> str:
        return f"[{self.skill_name}] {self.name} 釋放 AOE！"

    def aoe_damage(self) -> int:
        return int(self.atk * 1.2)


class Healer(Hero):
    """治療師：交換後治療全隊"""
    def __init__(self, col: int, row: int):
        super().__init__("療癒", col, row, HERO_COLORS["healer"],
                         hp=80, atk=10, defense=4)
        self.skill_name = "神聖治癒"
        self.heal_power = 25

    def on_swap(self, other: "Hero") -> str:
        return f"[{self.skill_name}] {self.name} 治療全隊 {self.heal_power} HP！"


class Ranger(Hero):
    """遊俠：交換後對指定敵人造成高額遠程傷害"""
    def __init__(self, col: int, row: int):
        super().__init__("遊俠", col, row, HERO_COLORS["ranger"],
                         hp=85, atk=30, defense=3)
        self.skill_name = "狙擊箭"

    def on_swap(self, other: "Hero") -> str:
        return f"[{self.skill_name}] {self.name} 鎖定最遠目標！"

    def snipe_damage(self) -> int:
        return int(self.atk * 2.0)


class Tank(Hero):
    """坦克：交換後獲得護盾（臨時防禦加成）"""
    def __init__(self, col: int, row: int):
        super().__init__("坦克", col, row, HERO_COLORS["tank"],
                         hp=160, atk=15, defense=15)
        self.skill_name = "鐵壁防禦"
        self.shield = 0

    def on_swap(self, other: "Hero") -> str:
        self.shield = 20
        return f"[{self.skill_name}] {self.name} 獲得護盾 {self.shield}！"

    def take_damage(self, amount: int) -> int:
        if self.shield > 0:
            absorbed = min(self.shield, amount)
            self.shield -= absorbed
            amount -= absorbed
        return super().take_damage(amount) if amount > 0 else 0
