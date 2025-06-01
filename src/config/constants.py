"""
常量定义文件，存储应用程序中使用的所有常量。
"""
from enum import Enum
from pathlib import Path


# 文件路径相关常量
APP_ROOT = Path(__file__).parent.parent.parent.absolute()
ASSETS_DIR = Path(__file__).parent.parent / 'assets'
ICONS_DIR = ASSETS_DIR / 'icons'
SOUNDS_DIR = ASSETS_DIR / 'sounds'


# 应用程序相关常量
APP_NAME = '随机抽奖系统'
APP_VERSION = '2.0.0'
APP_AUTHOR = 'WindsurfUser'


# 文件类型相关常量
class FileType(Enum):
    """支持的文件类型枚举"""
    CSV = 'CSV文件 (*.csv)'
    TXT = '文本文件 (*.txt)'
    EXCEL = 'Excel文件 (*.xlsx *.xls)'
    JSON = 'JSON文件 (*.json)'
    ALL = '所有文件 (*.*)'


# 抽奖模式相关常量
class DrawMode(Enum):
    """抽奖模式枚举"""
    EQUAL = '等概率模式'
    WEIGHTED = '权重模式'


# 网络超时设置
REQUEST_TIMEOUT = 5  # 秒


# 动画相关常量
ANIMATION_DURATION = 3000  # 毫秒
ANIMATION_FPS = 60
ROLL_DURATION = 2000  # 毫秒，滚动动画持续时间


# 默认设置
DEFAULT_DRAW_COUNT = 1
DEFAULT_DRAW_MODE = DrawMode.EQUAL
DEFAULT_USE_ANIMATION = True
DEFAULT_SOUND_ENABLED = True
