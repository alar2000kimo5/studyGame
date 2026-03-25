"""關卡定義：每個關卡包含英雄初始位置與敵人配置"""
from entities.heroes.all_heroes import Warrior, Mage, Healer, Ranger, Tank
from entities.enemy import Enemy

# ── 輔助：快速建立英雄隊伍 ────────────────────────────
def default_party():
    return [
        Warrior(1, 5),
        Mage   (2, 5),
        Healer (3, 5),
        Ranger (4, 5),
        Tank   (5, 5),
    ]

# ── 關卡資料 ──────────────────────────────────────────
LEVELS = [
    {
        "id": 1,
        "name": "關卡 1：初戰練習",
        "description": "2 隻基本哥布林，適合熟悉操作。",
        "heroes": lambda: [Warrior(1,5), Mage(2,5), Healer(3,5)],
        "enemies": lambda: [
            Enemy("哥布", 3, 1, hp=50, atk=12),
            Enemy("哥布", 5, 2, hp=50, atk=12),
        ],
    },
    {
        "id": 2,
        "name": "關卡 2：圍攻",
        "description": "3 隻敵人從兩側包夾，需要策略走位。",
        "heroes": lambda: [Warrior(1,5), Mage(2,5), Healer(3,5), Ranger(4,5)],
        "enemies": lambda: [
            Enemy("骷髏", 1, 0, hp=60, atk=15),
            Enemy("骷髏", 4, 0, hp=60, atk=15),
            Enemy("骷髏", 7, 1, hp=60, atk=15),
        ],
    },
    {
        "id": 3,
        "name": "關卡 3：精英守衛",
        "description": "1 隻精英 + 2 隻雜兵，精英防禦高。",
        "heroes": lambda: [Warrior(1,5), Mage(2,5), Healer(3,5), Ranger(4,5), Tank(5,5)],
        "enemies": lambda: [
            Enemy("精英",    3, 0, hp=120, atk=20, defense=8),
            Enemy("雜兵A",   1, 1, hp=50,  atk=12),
            Enemy("雜兵B",   5, 1, hp=50,  atk=12),
        ],
    },
    {
        "id": 4,
        "name": "關卡 4：惡龍之爪",
        "description": "Boss 登場！龍爪有大量 HP。",
        "heroes": lambda: default_party(),
        "enemies": lambda: [
            Enemy("龍爪",  3, 0, hp=200, atk=25, defense=10, is_boss=True),
            Enemy("爪兵A", 1, 0, hp=60,  atk=15),
            Enemy("爪兵B", 5, 0, hp=60,  atk=15),
        ],
    },
    {
        "id": 5,
        "name": "關卡 5：最終決戰",
        "description": "巨龍覺醒！帶領你的英雄隊伍取得最終勝利！",
        "heroes": lambda: default_party(),
        "enemies": lambda: [
            Enemy("巨龍",  3, 0, hp=350, atk=35, defense=15, is_boss=True,
                  move_range=3),
            Enemy("龍衛A", 0, 1, hp=80,  atk=18),
            Enemy("龍衛B", 7, 1, hp=80,  atk=18),
            Enemy("龍衛C", 3, 2, hp=70,  atk=15),
        ],
    },
]


def get_level(level_id: int) -> dict:
    """取得關卡資料，英雄和敵人都是新建的實例"""
    data = next(l for l in LEVELS if l["id"] == level_id)
    return {
        "id":          data["id"],
        "name":        data["name"],
        "description": data["description"],
        "heroes":      data["heroes"](),
        "enemies":     data["enemies"](),
    }
