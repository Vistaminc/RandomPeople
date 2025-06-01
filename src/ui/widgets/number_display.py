"""
数字显示控件模块，提供自定义的数字/名称显示控件。
"""
from typing import Optional

from PySide6.QtCore import Property, QSize, Qt, Signal, Slot
from PySide6.QtGui import QFont, QPainter, QPaintEvent
from PySide6.QtWidgets import QLabel, QSizePolicy, QWidget

from src.ui.styles.themes import PyOneDarkTheme


class NumberDisplay(QLabel):
    """
    自定义数字/名称显示控件，用于显示抽奖结果。
    """
    
    def __init__(self, parent: Optional[QWidget] = None) -> None:
        """
        初始化显示控件
        
        Args:
            parent: 父窗口
        """
        super().__init__(parent)
        
        # 设置控件属性
        self.setAlignment(Qt.AlignCenter)
        self.setMinimumSize(200, 80)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        
        # 应用样式
        self.setStyleSheet(PyOneDarkTheme.NUMBER_DISPLAY_STYLE)
        
        # 初始显示占位符
        self.setText("?")
        
        # 设置字体
        font = self.font()
        font.setPointSize(36)
        font.setBold(True)
        self.setFont(font)
        
    def set_result(self, value: str) -> None:
        """
        设置显示结果
        
        Args:
            value: 要显示的值
        """
        self.setText(value)
        
    def clear_result(self) -> None:
        """
        清空显示结果
        """
        self.setText("?")
        
    def set_placeholder(self, text: str = "?") -> None:
        """
        设置占位符文本
        
        Args:
            text: 占位符文本
        """
        self.setText(text)
        
    def paintEvent(self, event: QPaintEvent) -> None:
        """
        绘制控件，增强显示效果
        
        Args:
            event: 绘制事件
        """
        # 使用基类的绘制逻辑
        super().paintEvent(event)


class ResultDisplay(QLabel):
    """
    结果显示控件，用于显示抽奖结果列表。
    """
    
    def __init__(self, parent: Optional[QWidget] = None) -> None:
        """
        初始化结果显示控件
        
        Args:
            parent: 父窗口
        """
        super().__init__(parent)
        
        # 设置控件属性
        self.setAlignment(Qt.AlignCenter)
        self.setMinimumSize(300, 120)
        self.setWordWrap(True)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        # 应用样式
        self.setStyleSheet(PyOneDarkTheme.RESULT_DISPLAY_STYLE)
        
        # 初始显示占位符
        self.setText("等待抽奖结果...")
        
        # 设置字体
        font = self.font()
        font.setPointSize(18)
        self.setFont(font)
        
    def set_results(self, results: list) -> None:
        """
        设置显示结果列表
        
        Args:
            results: 结果列表
        """
        if not results:
            self.setText("未选中任何结果")
            return
            
        # 将结果组合成一个文本显示
        result_text = "、".join(results)
        self.setText(result_text)
        
    def clear_results(self) -> None:
        """
        清空显示结果
        """
        self.setText("等待抽奖结果...")
        
    def add_result(self, result: str) -> None:
        """
        添加单个结果
        
        Args:
            result: 单个结果
        """
        current_text = self.text()
        if current_text == "等待抽奖结果..." or current_text == "未选中任何结果":
            self.setText(result)
        else:
            self.setText(f"{current_text}、{result}")
            
    def get_results_as_list(self) -> list:
        """
        将当前显示的结果转换为列表
        
        Returns:
            结果列表
        """
        text = self.text()
        if text == "等待抽奖结果..." or text == "未选中任何结果":
            return []
            
        return text.split("、")
        
    def has_results(self) -> bool:
        """
        判断是否有抽奖结果
        
        Returns:
            是否有结果
        """
        text = self.text()
        return text != "等待抽奖结果..." and text != "未选中任何结果"
