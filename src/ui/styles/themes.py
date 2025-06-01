"""
主题定义文件，实现 PyOneDark 主题以及相关样式配置。
"""
from enum import Enum
import colorsys
from typing import Dict, Any, Tuple


class PyOneDarkPalette:
    """PyOneDark 主题调色板"""
    # 主色调
    BACKGROUND = '#282c34'
    FOREGROUND = '#abb2bf'
    
    # 强调色
    CYAN = '#56b6c2'
    BLUE = '#61afef'
    PURPLE = '#c678dd'
    GREEN = '#98c379'
    RED = '#e06c75'
    YELLOW = '#e5c07b'
    ORANGE = '#d19a66'
    
    # 界面元素
    BORDER = '#3b4048'
    SELECTION = '#3e4451'
    COMMENT = '#5c6370'
    HIGHLIGHT = '#2c313c'
    
    # 状态颜色
    SUCCESS = '#98c379'
    WARNING = '#e5c07b'
    ERROR = '#e06c75'
    INFO = '#61afef'
    
    # 文本颜色
    TEXT_COLOR = '#abb2bf'  # 默认文本颜色
    NAME_COLOR = '#61afef'  # 名称文本颜色


class PyOneDarkTheme:
    """PyOneDark 主题配置"""
    # 数字/名称显示样式
    NUMBER_DISPLAY_STYLE = f"""
        QLabel {{
            background-color: {PyOneDarkPalette.SELECTION};
            color: {PyOneDarkPalette.NAME_COLOR};
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-radius: 5px;
            padding: 10px;
        }}
    """
    
    # 结果显示样式
    RESULT_DISPLAY_STYLE = f"""
        QTextEdit {{
            background-color: {PyOneDarkPalette.SELECTION};
            color: {PyOneDarkPalette.TEXT_COLOR};
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-radius: 5px;
            padding: 10px;
        }}
    """
    
    # 应用整体样式表
    GLOBAL_STYLE = f"""
        QWidget {{
            background-color: {PyOneDarkPalette.BACKGROUND};
            color: {PyOneDarkPalette.FOREGROUND};
            font-family: "Microsoft YaHei", "Segoe UI", "Noto Sans", sans-serif;
            font-size: 12px;
        }}
        
        QMainWindow, QDialog {{
            background-color: {PyOneDarkPalette.BACKGROUND};
        }}
        
        QLabel {{
            color: {PyOneDarkPalette.FOREGROUND};
        }}
        
        QPushButton {{
            background-color: {PyOneDarkPalette.BLUE};
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
        }}
        
        QPushButton:hover {{
            background-color: #70b8ff;
        }}
        
        QPushButton:pressed {{
            background-color: #528bbc;
        }}
        
        QPushButton:disabled {{
            background-color: {PyOneDarkPalette.BORDER};
            color: {PyOneDarkPalette.COMMENT};
        }}
        
        QLineEdit, QTextEdit, QPlainTextEdit, QComboBox, QSpinBox, QDoubleSpinBox {{
            background-color: {PyOneDarkPalette.SELECTION};
            border: 1px solid {PyOneDarkPalette.BORDER};
            color: {PyOneDarkPalette.FOREGROUND};
            padding: 4px;
            border-radius: 3px;
        }}
        
        QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, QComboBox:focus {{
            border: 1px solid {PyOneDarkPalette.BLUE};
        }}
        
        QComboBox::drop-down {{
            border: none;
            width: 20px;
        }}
        
        QComboBox::down-arrow {{
            image: url(:/icons/chevron-down.png);
            width: 12px;
            height: 12px;
        }}
        
        QComboBox QAbstractItemView {{
            background-color: {PyOneDarkPalette.SELECTION};
            border: 1px solid {PyOneDarkPalette.BORDER};
            selection-background-color: {PyOneDarkPalette.BLUE};
        }}
        
        QCheckBox, QRadioButton {{
            color: {PyOneDarkPalette.FOREGROUND};
        }}
        
        QCheckBox::indicator, QRadioButton::indicator {{
            width: 18px;
            height: 18px;
        }}
        
        QCheckBox::indicator:unchecked {{
            border: 2px solid {PyOneDarkPalette.BORDER};
            background-color: {PyOneDarkPalette.BACKGROUND};
        }}
        
        QCheckBox::indicator:checked {{
            border: 2px solid {PyOneDarkPalette.BLUE};
            background-color: {PyOneDarkPalette.BLUE};
        }}
        
        QScrollBar:vertical {{
            border: none;
            background-color: {PyOneDarkPalette.BACKGROUND};
            width: 10px;
            margin: 0;
        }}
        
        QScrollBar::handle:vertical {{
            background-color: {PyOneDarkPalette.BORDER};
            border-radius: 5px;
            min-height: 20px;
        }}
        
        QScrollBar::handle:vertical:hover {{
            background-color: {PyOneDarkPalette.BLUE};
        }}
        
        QScrollBar:horizontal {{
            border: none;
            background-color: {PyOneDarkPalette.BACKGROUND};
            height: 10px;
            margin: 0;
        }}
        
        QScrollBar::handle:horizontal {{
            background-color: {PyOneDarkPalette.BORDER};
            border-radius: 5px;
            min-width: 20px;
        }}
        
        QScrollBar::handle:horizontal:hover {{
            background-color: {PyOneDarkPalette.BLUE};
        }}
        
        QProgressBar {{
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-radius: 3px;
            text-align: center;
            background-color: {PyOneDarkPalette.SELECTION};
        }}
        
        QProgressBar::chunk {{
            background-color: {PyOneDarkPalette.BLUE};
        }}
        
        QTabWidget::pane {{
            border: 1px solid {PyOneDarkPalette.BORDER};
        }}
        
        QTabBar::tab {{
            background-color: {PyOneDarkPalette.BACKGROUND};
            color: {PyOneDarkPalette.FOREGROUND};
            padding: 8px 16px;
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-bottom: none;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            margin-right: 2px;
        }}
        
        QTabBar::tab:selected {{
            background-color: {PyOneDarkPalette.SELECTION};
            border-bottom: 2px solid {PyOneDarkPalette.BLUE};
        }}
        
        QTabBar::tab:hover {{
            background-color: {PyOneDarkPalette.HIGHLIGHT};
        }}
        
        QMenuBar {{
            background-color: {PyOneDarkPalette.BACKGROUND};
            border-bottom: 1px solid {PyOneDarkPalette.BORDER};
        }}
        
        QMenuBar::item {{
            background: transparent;
            padding: 8px 12px;
        }}
        
        QMenuBar::item:selected {{
            background-color: {PyOneDarkPalette.SELECTION};
        }}
        
        QMenu {{
            background-color: {PyOneDarkPalette.BACKGROUND};
            border: 1px solid {PyOneDarkPalette.BORDER};
            padding: 4px;
        }}
        
        QMenu::item {{
            padding: 6px 24px 6px 12px;
        }}
        
        QMenu::item:selected {{
            background-color: {PyOneDarkPalette.SELECTION};
        }}
        
        QToolTip {{
            background-color: {PyOneDarkPalette.SELECTION};
            color: {PyOneDarkPalette.FOREGROUND};
            border: 1px solid {PyOneDarkPalette.BORDER};
            padding: 4px;
        }}
        
        QGroupBox {{
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-radius: 4px;
            margin-top: 16px;
            font-weight: bold;
            padding-top: 8px;
        }}
        
        QGroupBox::title {{
            subcontrol-origin: margin;
            subcontrol-position: top left;
            left: 10px;
            padding: 0 5px;
        }}
        
        QStatusBar {{
            background-color: {PyOneDarkPalette.BACKGROUND};
            color: {PyOneDarkPalette.COMMENT};
            border-top: 1px solid {PyOneDarkPalette.BORDER};
        }}
        
        QListView, QTreeView, QTableView {{
            background-color: {PyOneDarkPalette.SELECTION};
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-radius: 3px;
            outline: none;
        }}
        
        QListView::item, QTreeView::item, QTableView::item {{
            padding: 4px;
        }}
        
        QListView::item:selected, QTreeView::item:selected, QTableView::item:selected {{
            background-color: {PyOneDarkPalette.BLUE};
            color: white;
        }}
        
        QHeaderView::section {{
            background-color: {PyOneDarkPalette.BACKGROUND};
            padding: 4px;
            border: 1px solid {PyOneDarkPalette.BORDER};
            border-left: none;
            border-top: none;
        }}
        
        QHeaderView::section:checked {{
            background-color: {PyOneDarkPalette.BLUE};
            color: white;
        }}
    """
    
    # 特定组件的样式
    NUMBER_DISPLAY_STYLE = f"""
        QLabel {{
            background-color: {PyOneDarkPalette.SELECTION};
            color: {PyOneDarkPalette.YELLOW};
            font-size: 48px;
            font-weight: bold;
            border: 2px solid {PyOneDarkPalette.BLUE};
            border-radius: 8px;
            padding: 12px;
            qproperty-alignment: AlignCenter;
        }}
    """
    
    RESULT_DISPLAY_STYLE = f"""
        QLabel {{
            background-color: {PyOneDarkPalette.SELECTION};
            color: {PyOneDarkPalette.GREEN};
            font-size: 24px;
            font-weight: bold;
            border: 1px solid {PyOneDarkPalette.GREEN};
            border-radius: 4px;
            padding: 8px;
            qproperty-alignment: AlignCenter;
        }}
    """
    
    HEADER_LABEL_STYLE = f"""
        QLabel {{
            color: {PyOneDarkPalette.CYAN};
            font-size: 18px;
            font-weight: bold;
            padding: 6px;
        }}
    """
    
    # 按钮样式变体
    PRIMARY_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneDarkPalette.BLUE};
            color: white;
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #70b8ff;
        }}
        
        QPushButton:pressed {{
            background-color: #528bbc;
        }}
    """
    
    SUCCESS_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneDarkPalette.GREEN};
            color: white;
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #a9d489;
        }}
        
        QPushButton:pressed {{
            background-color: #89b46c;
        }}
    """
    
    DANGER_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneDarkPalette.RED};
            color: white;
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #f27983;
        }}
        
        QPushButton:pressed {{
            background-color: #cc6169;
        }}
    """
    
    WARNING_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneDarkPalette.YELLOW};
            color: {PyOneDarkPalette.BACKGROUND};
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #f0d28a;
        }}
        
        QPushButton:pressed {{
            background-color: #ccac6c;
        }}
    """


class PyOneLightPalette:
    """亮色主题调色板"""
    # 主色调
    BACKGROUND = '#f5f5f5'
    FOREGROUND = '#383a42'
    
    # 强调色
    CYAN = '#0184bc'
    BLUE = '#4078f2'
    PURPLE = '#a626a4'
    GREEN = '#50a14f'
    RED = '#e45649'
    YELLOW = '#c18401'
    ORANGE = '#cf8e25'
    
    # 界面元素
    BORDER = '#e1e1e1'
    SELECTION = '#e2e2e2'
    COMMENT = '#a0a1a7'
    HIGHLIGHT = '#ededed'
    
    # 状态颜色
    SUCCESS = '#50a14f'
    WARNING = '#c18401'
    ERROR = '#e45649'
    INFO = '#4078f2'
    
    # 文本颜色
    TEXT_COLOR = '#383a42'  # 默认文本颜色
    NAME_COLOR = '#4078f2'  # 名称文本颜色


class PyOneLightTheme:
    """亮色主题配置"""
    # 数字/名称显示样式
    NUMBER_DISPLAY_STYLE = f"""
        QLabel {{
            background-color: white;
            color: {PyOneLightPalette.NAME_COLOR};
            border: 1px solid {PyOneLightPalette.BORDER};
            border-radius: 5px;
            padding: 10px;
        }}
    """
    
    # 结果显示样式
    RESULT_DISPLAY_STYLE = f"""
        QTextEdit {{
            background-color: white;
            color: {PyOneLightPalette.TEXT_COLOR};
            border: 1px solid {PyOneLightPalette.BORDER};
            border-radius: 5px;
            padding: 10px;
        }}
    """
    
    # 应用整体样式表
    GLOBAL_STYLE = f"""
        QWidget {{
            background-color: {PyOneLightPalette.BACKGROUND};
            color: {PyOneLightPalette.FOREGROUND};
            font-family: "Microsoft YaHei", "Segoe UI", "Noto Sans", sans-serif;
            font-size: 12px;
        }}
        
        QMainWindow, QDialog {{
            background-color: {PyOneLightPalette.BACKGROUND};
        }}
        
        QLabel {{
            color: {PyOneLightPalette.FOREGROUND};
        }}
        
        QPushButton {{
            background-color: {PyOneLightPalette.BLUE};
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
        }}
        
        QPushButton:hover {{
            background-color: #6291f4;
        }}
        
        QPushButton:pressed {{
            background-color: #3564cc;
        }}
        
        QPushButton:disabled {{
            background-color: {PyOneLightPalette.BORDER};
            color: {PyOneLightPalette.COMMENT};
        }}
        
        QLineEdit, QTextEdit, QPlainTextEdit, QComboBox, QSpinBox, QDoubleSpinBox {{
            background-color: white;
            border: 1px solid {PyOneLightPalette.BORDER};
            color: {PyOneLightPalette.FOREGROUND};
            padding: 4px;
            border-radius: 3px;
        }}
        
        QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, QComboBox:focus {{
            border: 1px solid {PyOneLightPalette.BLUE};
        }}
        
        QComboBox::drop-down {{
            border: none;
            width: 20px;
        }}
        
        QComboBox::down-arrow {{
            image: url(:/icons/chevron-down.png);
            width: 12px;
            height: 12px;
        }}
        
        QComboBox QAbstractItemView {{
            background-color: white;
            border: 1px solid {PyOneLightPalette.BORDER};
            selection-background-color: {PyOneLightPalette.BLUE};
            selection-color: white;
        }}
        
        QCheckBox, QRadioButton {{
            color: {PyOneLightPalette.FOREGROUND};
        }}
        
        QCheckBox::indicator, QRadioButton::indicator {{
            width: 18px;
            height: 18px;
        }}
        
        QCheckBox::indicator:unchecked {{
            border: 2px solid {PyOneLightPalette.BORDER};
            background-color: white;
        }}
        
        QCheckBox::indicator:checked {{
            border: 2px solid {PyOneLightPalette.BLUE};
            background-color: {PyOneLightPalette.BLUE};
        }}
        
        QScrollBar:vertical {{
            border: none;
            background-color: {PyOneLightPalette.BACKGROUND};
            width: 10px;
            margin: 0;
        }}
        
        QScrollBar::handle:vertical {{
            background-color: {PyOneLightPalette.BORDER};
            border-radius: 5px;
            min-height: 20px;
        }}
        
        QScrollBar::handle:vertical:hover {{
            background-color: {PyOneLightPalette.BLUE};
        }}
        
        QScrollBar:horizontal {{
            border: none;
            background-color: {PyOneLightPalette.BACKGROUND};
            height: 10px;
            margin: 0;
        }}
        
        QScrollBar::handle:horizontal {{
            background-color: {PyOneLightPalette.BORDER};
            border-radius: 5px;
            min-width: 20px;
        }}
        
        QScrollBar::handle:horizontal:hover {{
            background-color: {PyOneLightPalette.BLUE};
        }}
        
        QGroupBox {{
            border: 1px solid {PyOneLightPalette.BORDER};
            border-radius: 4px;
            margin-top: 16px;
            font-weight: bold;
            padding-top: 8px;
        }}
        
        QGroupBox::title {{
            subcontrol-origin: margin;
            subcontrol-position: top left;
            left: 10px;
            padding: 0 5px;
        }}
        
        QStatusBar {{
            background-color: {PyOneLightPalette.BACKGROUND};
            color: {PyOneLightPalette.COMMENT};
            border-top: 1px solid {PyOneLightPalette.BORDER};
        }}
        
        QListView, QTreeView, QTableView {{
            background-color: white;
            border: 1px solid {PyOneLightPalette.BORDER};
            border-radius: 3px;
            outline: none;
        }}
        
        QListView::item, QTreeView::item, QTableView::item {{
            padding: 4px;
        }}
        
        QListView::item:selected, QTreeView::item:selected, QTableView::item:selected {{
            background-color: {PyOneLightPalette.BLUE};
            color: white;
        }}
        
        QHeaderView::section {{
            background-color: {PyOneLightPalette.BACKGROUND};
            padding: 4px;
            border: 1px solid {PyOneLightPalette.BORDER};
            border-left: none;
            border-top: none;
        }}
        
        QHeaderView::section:checked {{
            background-color: {PyOneLightPalette.BLUE};
            color: white;
        }}
    """
    
    # 特定组件的样式
    NUMBER_DISPLAY_STYLE = f"""
        QLabel {{
            background-color: white;
            color: {PyOneLightPalette.YELLOW};
            font-size: 48px;
            font-weight: bold;
            border: 2px solid {PyOneLightPalette.BLUE};
            border-radius: 8px;
            padding: 12px;
            qproperty-alignment: AlignCenter;
        }}
    """
    
    RESULT_DISPLAY_STYLE = f"""
        QLabel {{
            background-color: white;
            color: {PyOneLightPalette.GREEN};
            font-size: 24px;
            font-weight: bold;
            border: 1px solid {PyOneLightPalette.GREEN};
            border-radius: 4px;
            padding: 8px;
            qproperty-alignment: AlignCenter;
        }}
    """
    
    HEADER_LABEL_STYLE = f"""
        QLabel {{
            color: {PyOneLightPalette.CYAN};
            font-size: 18px;
            font-weight: bold;
            padding: 6px;
        }}
    """
    
    # 按钮样式变体
    PRIMARY_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneLightPalette.BLUE};
            color: white;
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #6291f4;
        }}
        
        QPushButton:pressed {{
            background-color: #3564cc;
        }}
    """
    
    SUCCESS_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneLightPalette.GREEN};
            color: white;
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #68b167;
        }}
        
        QPushButton:pressed {{
            background-color: #428a41;
        }}
    """
    
    DANGER_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneLightPalette.RED};
            color: white;
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #e8756b;
        }}
        
        QPushButton:pressed {{
            background-color: #c2483e;
        }}
    """
    
    WARNING_BUTTON = f"""
        QPushButton {{
            background-color: {PyOneLightPalette.YELLOW};
            color: {PyOneLightPalette.FOREGROUND};
            font-weight: bold;
        }}
        
        QPushButton:hover {{
            background-color: #d2991a;
        }}
        
        QPushButton:pressed {{
            background-color: #a37001;
        }}
    """


# 颜色处理辅助函数
def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """将十六进制颜色代码转换为RGB元组"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def _rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """将RGB元组转换为十六进制颜色代码"""
    return f'#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}'

def _lighten_color(hex_color: str, amount: float = 0.1) -> str:
    """
    使颜色变亮
    
    Args:
        hex_color: 十六进制颜色代码
        amount: 变亮的量，0-1之间
        
    Returns:
        变亮后的十六进制颜色代码
    """
    # 转换为RGB
    r, g, b = _hex_to_rgb(hex_color)
    
    # 转换为HSL（色相、饱和度、亮度）
    h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
    
    # 增加亮度，但不超过1
    l = min(1, l + amount)
    
    # 转回RGB
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    
    # 转换为整数并返回十六进制
    return _rgb_to_hex((int(r*255), int(g*255), int(b*255)))

def _darken_color(hex_color: str, amount: float = 0.1) -> str:
    """
    使颜色变暗
    
    Args:
        hex_color: 十六进制颜色代码
        amount: 变暗的量，0-1之间
        
    Returns:
        变暗后的十六进制颜色代码
    """
    # 转换为RGB
    r, g, b = _hex_to_rgb(hex_color)
    
    # 转换为HSL
    h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
    
    # 减少亮度，但不小于0
    l = max(0, l - amount)
    
    # 转回RGB
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    
    # 转换为整数并返回十六进制
    return _rgb_to_hex((int(r*255), int(g*255), int(b*255)))

# 导出可用主题
THEMES = {
    'dark': PyOneDarkTheme,
    'light': PyOneLightTheme
}


def get_theme(theme_mode: str, custom_colors: dict = None):
    """
    获取当前主题，支持自定义颜色
    
    Args:
        theme_mode: 主题模式，'dark' 或 'light'
        custom_colors: 可选的自定义颜色字典，格式为 {'primary_color': '#color', 'success_color': '#color', 'text_color': '#color', 'name_color': '#color'}
        
    Returns:
        主题类，包含自定义颜色
    """
    if theme_mode not in THEMES:
        # 默认使用暗色主题
        theme_mode = 'dark'
    
    # 获取基础主题
    theme_class = THEMES[theme_mode]
    
    # 如果没有自定义颜色，直接返回基础主题
    if not custom_colors:
        return theme_class
    
    # 创建主题副本，以便修改而不影响原始主题
    class CustomizedTheme:
        pass
    
    # 复制原始主题的所有属性
    for attr_name in dir(theme_class):
        if not attr_name.startswith('__'):
            setattr(CustomizedTheme, attr_name, getattr(theme_class, attr_name))
    
    # 应用自定义颜色
    # 获取对应的调色板类
    palette_class = PyOneDarkPalette if theme_mode == 'dark' else PyOneLightPalette
    
    # 定义颜色映射表，将设置键名映射到调色板属性名
    color_mapping = {
        'primary_color': 'BLUE',
        'success_color': 'SUCCESS',
        'warning_color': 'WARNING',
        'error_color': 'ERROR',
        'text_color': 'TEXT_COLOR',
        'name_color': 'NAME_COLOR'
    }
    
    # 创建修改后的按钮样式和显示样式
    for color_key, color_value in custom_colors.items():
        if color_key in color_mapping and color_value and color_value.startswith('#'):
            # 生成自定义按钮样式
            if color_key == 'primary_color':
                primary_button_style = f"""
                QPushButton {{
                    background-color: {color_value};
                    color: white;
                    font-weight: bold;
                }}
                
                QPushButton:hover {{
                    background-color: {_lighten_color(color_value, 0.2)};
                }}
                
                QPushButton:pressed {{
                    background-color: {_darken_color(color_value, 0.2)};
                }}
                """
                setattr(CustomizedTheme, 'PRIMARY_BUTTON', primary_button_style)
            
            elif color_key == 'success_color':
                success_button_style = f"""
                QPushButton {{
                    background-color: {color_value};
                    color: white;
                    font-weight: bold;
                }}
                
                QPushButton:hover {{
                    background-color: {_lighten_color(color_value, 0.2)};
                }}
                
                QPushButton:pressed {{
                    background-color: {_darken_color(color_value, 0.2)};
                }}
                """
                setattr(CustomizedTheme, 'SUCCESS_BUTTON', success_button_style)
            
            elif color_key == 'warning_color':
                warning_button_style = f"""
                QPushButton {{
                    background-color: {color_value};
                    color: {palette_class.FOREGROUND};
                    font-weight: bold;
                }}
                
                QPushButton:hover {{
                    background-color: {_lighten_color(color_value, 0.2)};
                }}
                
                QPushButton:pressed {{
                    background-color: {_darken_color(color_value, 0.2)};
                }}
                """
                setattr(CustomizedTheme, 'WARNING_BUTTON', warning_button_style)
            
            elif color_key == 'error_color':
                danger_button_style = f"""
                QPushButton {{
                    background-color: {color_value};
                    color: white;
                    font-weight: bold;
                }}
                
                QPushButton:hover {{
                    background-color: {_lighten_color(color_value, 0.2)};
                }}
                
                QPushButton:pressed {{
                    background-color: {_darken_color(color_value, 0.2)};
                }}
                """
                setattr(CustomizedTheme, 'DANGER_BUTTON', danger_button_style)
                
            # 处理自定义文本颜色
            elif color_key == 'text_color':
                # 创建结果显示样式
                result_display_style = f"""
                QTextEdit {{
                    background-color: {palette_class.SELECTION if theme_mode == 'dark' else 'white'};
                    color: {color_value};
                    border: 1px solid {palette_class.BORDER};
                    border-radius: 5px;
                    padding: 10px;
                }}
                """
                setattr(CustomizedTheme, 'RESULT_DISPLAY_STYLE', result_display_style)
                
            elif color_key == 'name_color':
                # 创建名称显示样式
                number_display_style = f"""
                QLabel {{
                    background-color: {palette_class.SELECTION if theme_mode == 'dark' else 'white'};
                    color: {color_value};
                    border: 1px solid {palette_class.BORDER};
                    border-radius: 5px;
                    padding: 10px;
                }}
                """
                setattr(CustomizedTheme, 'NUMBER_DISPLAY_STYLE', number_display_style)
    
    return CustomizedTheme
