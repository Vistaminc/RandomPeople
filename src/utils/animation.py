"""
动画效果工具模块，提供各种UI动画实现。
"""
import random
from typing import Any, Callable, List, Optional, Union

from PySide6.QtCore import (QAbstractAnimation, QEasingCurve, QObject,
                           QParallelAnimationGroup, QPropertyAnimation,
                           QSequentialAnimationGroup, QTimer, Property, Signal,
                           Slot)
from PySide6.QtGui import QColor
from PySide6.QtWidgets import QLabel, QWidget

from ..config.constants import ANIMATION_DURATION, ANIMATION_FPS, ROLL_DURATION


class NumberRollAnimation(QObject):
    """
    数字滚动动画效果，用于随机抽奖过程中的数字滚动显示。
    
    提供从随机数字滚动最终定格到目标数字的动画效果。
    """
    
    # 定义信号
    animation_finished = Signal()  # 动画完成信号
    value_changed = Signal(str)    # 值变化信号
    
    def __init__(self, 
                 target_widget: QLabel, 
                 duration: int = ROLL_DURATION, 
                 fps: int = ANIMATION_FPS) -> None:
        """
        初始化数字滚动动画
        
        Args:
            target_widget: 目标显示控件
            duration: 动画持续时间（毫秒）
            fps: 动画帧率
        """
        super().__init__()
        
        self.target_widget = target_widget  # 目标显示控件
        self.duration = duration        # 动画持续时间
        self.interval = 1000 // fps     # 帧间隔时间（毫秒）
        
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._update_value)
        
        self._target_value = ""         # 最终显示值
        self._values_pool = []          # 随机值池
        self._elapsed_time = 0          # 已经过时间
        self._is_rolling = False        # 是否正在滚动
        
    def start_roll(self, target_value: str, values_pool: Optional[List[str]] = None) -> None:
        """
        开始滚动动画
        
        Args:
            target_value: 最终显示的目标值
            values_pool: 随机值池，如果为None则自动生成
        """
        self._target_value = target_value
        
        # 如果没有提供值池，则根据目标值类型生成
        if values_pool is None:
            try:
                # 尝试解析为数字
                float(target_value)
                # 生成数字值池
                self._values_pool = [str(i) for i in range(100)]
            except ValueError:
                # 非数字类型，使用字母值池
                self._values_pool = [chr(i) for i in range(65, 91)] + [chr(i) for i in range(97, 123)]
        else:
            self._values_pool = values_pool
        
        # 确保目标值在值池中
        if target_value not in self._values_pool:
            self._values_pool.append(target_value)
        
        self._elapsed_time = 0
        self._is_rolling = True
        
        # 启动定时器
        self._timer.start(self.interval)
        
    def stop_roll(self) -> None:
        """
        停止滚动动画
        """
        if self._is_rolling:
            self._timer.stop()
            self._is_rolling = False
            
            # 设置为目标值
            self.target_widget.setText(self._target_value)
            self.value_changed.emit(self._target_value)
            self.animation_finished.emit()
    
    @Slot()
    def _update_value(self) -> None:
        """
        更新显示值
        """
        self._elapsed_time += self.interval
        
        # 控制动画进度
        progress = min(self._elapsed_time / self.duration, 1.0)
        
        # 根据进度决定是否继续滚动或停止
        if progress >= 1.0:
            self.stop_roll()
            return
        
        # 随机选择一个值
        random_value = random.choice(self._values_pool)
        
        # 最后阶段有更大概率显示目标值
        if progress > 0.7:
            if random.random() < progress * 0.5:
                random_value = self._target_value
        
        # 更新显示
        self.target_widget.setText(random_value)
        self.value_changed.emit(random_value)


class FadeAnimation:
    """
    淡入淡出动画效果
    """
    
    @staticmethod
    def fade_in(widget: QWidget, duration: int = 500) -> QPropertyAnimation:
        """
        淡入动画
        
        Args:
            widget: 需要应用动画的控件
            duration: 动画持续时间（毫秒）
            
        Returns:
            QPropertyAnimation: 动画对象
        """
        # 确保控件可见但透明
        widget.setVisible(True)
        widget.setWindowOpacity(0)
        
        # 创建动画
        animation = QPropertyAnimation(widget, b"windowOpacity")
        animation.setDuration(duration)
        animation.setStartValue(0.0)
        animation.setEndValue(1.0)
        animation.setEasingCurve(QEasingCurve.OutCubic)
        animation.start(QAbstractAnimation.DeleteWhenStopped)
        
        return animation
    
    @staticmethod
    def fade_out(widget: QWidget, duration: int = 500) -> QPropertyAnimation:
        """
        淡出动画
        
        Args:
            widget: 需要应用动画的控件
            duration: 动画持续时间（毫秒）
            
        Returns:
            QPropertyAnimation: 动画对象
        """
        # 创建动画
        animation = QPropertyAnimation(widget, b"windowOpacity")
        animation.setDuration(duration)
        animation.setStartValue(1.0)
        animation.setEndValue(0.0)
        animation.setEasingCurve(QEasingCurve.InCubic)
        
        # 动画结束后隐藏控件
        animation.finished.connect(lambda: widget.setVisible(False))
        animation.start(QAbstractAnimation.DeleteWhenStopped)
        
        return animation


class HighlightAnimation(QObject):
    """
    高亮动画效果
    """
    
    def __init__(self, parent: Optional[QObject] = None) -> None:
        """初始化高亮动画对象"""
        super().__init__(parent)
        self._color = QColor(255, 255, 255)
    
    @Property(QColor)
    def color(self) -> QColor:
        """获取当前颜色"""
        return self._color
    
    @color.setter
    def color(self, color: QColor) -> None:
        """设置当前颜色"""
        self._color = color
    
    @staticmethod
    def highlight_widget(widget: QWidget, 
                       start_color: QColor, 
                       end_color: QColor, 
                       duration: int = 500,
                       property_name: str = "styleSheet") -> QPropertyAnimation:
        """
        高亮控件动画
        
        Args:
            widget: 需要应用动画的控件
            start_color: 起始颜色
            end_color: 结束颜色
            duration: 动画持续时间（毫秒）
            property_name: 要动画的属性名
            
        Returns:
            QPropertyAnimation: 动画对象
        """
        # 创建动画
        animation = QPropertyAnimation(widget, property_name.encode())
        animation.setDuration(duration)
        animation.setStartValue(f"background-color: rgb({start_color.red()}, {start_color.green()}, {start_color.blue()});")
        animation.setEndValue(f"background-color: rgb({end_color.red()}, {end_color.green()}, {end_color.blue()});")
        animation.setEasingCurve(QEasingCurve.InOutQuad)
        animation.start(QAbstractAnimation.DeleteWhenStopped)
        
        return animation
