"""
主窗口模块，实现应用程序的主界面。
"""
import csv
import json
import logging
import random
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

from PySide6.QtCore import QEasingCurve, QPropertyAnimation, QSize, Qt, Signal, Slot, QTimer
from PySide6.QtGui import QAction, QIcon, QKeySequence
from PySide6.QtWidgets import (
    QApplication, QComboBox, QDialog, QFileDialog, QFrame, QHBoxLayout, QInputDialog,
    QLabel, QListWidget, QMainWindow, QMenu, QMenuBar, QMessageBox, 
    QPushButton, QScrollArea, QSizePolicy, QSplitter, QSpinBox, QStatusBar, 
    QToolBar, QVBoxLayout, QWidget, QLineEdit, QListWidgetItem, QGroupBox, QCheckBox, QTextEdit
)

from src.config.constants import DrawMode, FileType, APP_NAME, APP_VERSION, APP_AUTHOR
from src.config.settings import app_settings
from src.utils.data_parser import DataParser
from src.utils.lottery_engine import LotteryEngine
from src.utils.validator import is_valid_url
from src.ui.settings_dialog import SettingsDialog
from src.ui.styles.themes import THEMES, get_theme, PyOneDarkTheme
from src.ui.styles import resources  # 导入资源文件
from src.ui.widgets.number_display import NumberDisplay, ResultDisplay

logger = logging.getLogger(__name__)


class MainWindow(QMainWindow):
    """
    应用程序主窗口，包含所有UI元素和业务逻辑。
    """
    
    @staticmethod
    def get_default_db_path() -> Path:
        """获取默认数据库路径 - 使用 %appdata%/random_db.yaml"""
        import os
        appdata = os.environ.get('APPDATA', str(Path.home()))
        return Path(appdata) / 'random_db.yaml'
    
    def __init__(self) -> None:
        """初始化主窗口"""
        super().__init__()
        
        # 设置窗口属性
        self.setWindowTitle(APP_NAME)
        self.setMinimumSize(800, 600)
        
        # 创建抽奖引擎
        self._lottery_engine = LotteryEngine()
        
        # 创建UI组件
        self._create_ui()
        
        # 创建工具栏
        self._create_toolbar()
        
        # 创建菜单
        self._create_menu()
        
        # 创建状态栏
        self._create_status_bar()
        
        # 加载设置
        self._load_settings()
        
        # 应用主题
        self._apply_theme()
        
        # 初始化状态
        self._is_drawing = False
        
        # 初始化定时器
        self._roll_timer = QTimer(self)
        self._roll_timer.timeout.connect(self._update_roll_display)
        
        # 记录当前动画状态
        self._current_animation = None
        
        # 显示欢迎信息
        self.statusBar().showMessage("欢迎使用随机抽奖系统")
        
        logger.info("主窗口已初始化")
    
    def _create_ui(self) -> None:
        """创建UI组件，采用简洁设计"""
        # 创建中心部件
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        
        # 主布局
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)
        
        # 抽奖信息区域只保留最简单的信息
        info_layout = QHBoxLayout()
        
        # 候选人数和抽取人数显示
        counters_layout = QHBoxLayout()
        counters_layout.setSpacing(30)
        
        # 候选人数
        counter_widget = QWidget()
        counter_inner = QVBoxLayout(counter_widget)
        counter_inner.setContentsMargins(0, 0, 0, 0)
        
        total_label = QLabel("候选人数")
        total_label.setAlignment(Qt.AlignCenter)
        counter_inner.addWidget(total_label)
        
        self.total_count_label = QLabel("0")
        self.total_count_label.setAlignment(Qt.AlignCenter)
        self.total_count_label.setStyleSheet("font-size: 24px; font-weight: bold;")
        counter_inner.addWidget(self.total_count_label)
        
        counters_layout.addWidget(counter_widget)
        
        # 剩余人数
        remaining_widget = QWidget()
        remaining_inner = QVBoxLayout(remaining_widget)
        remaining_inner.setContentsMargins(0, 0, 0, 0)
        
        remaining_label = QLabel("剩余人数")
        remaining_label.setAlignment(Qt.AlignCenter)
        remaining_inner.addWidget(remaining_label)
        
        self.remaining_count_label = QLabel("0")
        self.remaining_count_label.setAlignment(Qt.AlignCenter)
        self.remaining_count_label.setStyleSheet("font-size: 24px; font-weight: bold;")
        remaining_inner.addWidget(self.remaining_count_label)
        
        counters_layout.addWidget(remaining_widget)
        
        # 不再添加抽取人数控件，这个控件将只在抽奖区域中保留
        
        info_layout.addLayout(counters_layout)
        info_layout.addStretch(1)  # 添加弹性空间
        
        main_layout.addLayout(info_layout)
        
        # 中部是抽奖显示区域
        self.draw_area = self._create_draw_area()
        main_layout.addWidget(self.draw_area)
        
        # 底部是结果显示区
        results_layout = QVBoxLayout()
        
        results_label = QLabel("抽奖系统-v2.0.1 by Vistamin")
        results_label.setAlignment(Qt.AlignCenter)
        results_layout.addWidget(results_label)
        
        # 注意：结果显示区控件已在_create_draw_area方法中创建
        
        main_layout.addLayout(results_layout)
        
        # 设置布局比例
        main_layout.setStretch(0, 1)  # 信息区域
        main_layout.setStretch(1, 3)  # 抽奖区
        main_layout.setStretch(2, 2)  # 结果区
    
    def _create_toolbar(self) -> None:
        """创建工具栏"""
        # 创建工具栏
        toolbar = QToolBar(self)
        toolbar.setMovable(False)  # 禁止移动
        toolbar.setIconSize(QSize(24, 24))  # 设置图标大小
        self.addToolBar(toolbar)
        
        # 添加一个空白器
        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        toolbar.addWidget(spacer)
    
    def _create_menu(self) -> None:
        """创建菜单栏"""
        # 创建菜单栏
        menu_bar = QMenuBar(self)
        self.setMenuBar(menu_bar)
        
        # 文件菜单（仅保留导出和退出功能）
        file_menu = QMenu("文件", self)
        menu_bar.addMenu(file_menu)
        
        # 导出抽奖结果动作
        export_results_action = QAction("导出抽奖结果", self)
        export_results_action.triggered.connect(self._export_results)
        file_menu.addAction(export_results_action)
        
        file_menu.addSeparator()
        
        # 退出动作
        exit_action = QAction("退出", self)
        exit_action.setShortcut(QKeySequence("Alt+F4"))
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # 小组管理菜单
        group_menu = QMenu("小组管理", self)
        menu_bar.addMenu(group_menu)
        
        # 打开小组管理动作
        manage_groups_action = QAction("管理小组", self)
        manage_groups_action.triggered.connect(self._open_settings)  # 打开设置对话框到小组管理页面
        group_menu.addAction(manage_groups_action)
        
        # 任务菜单
        task_menu = QMenu("任务名单", self)
        menu_bar.addMenu(task_menu)
        
        # 创建新任务动作
        create_task_action = QAction("创建新任务", self)
        create_task_action.triggered.connect(self._create_task)
        task_menu.addAction(create_task_action)
        
        # 查看所有任务动作
        view_tasks_action = QAction("查看所有任务", self)
        view_tasks_action.triggered.connect(self._view_tasks)
        task_menu.addAction(view_tasks_action)
        

        
        # 抽奖菜单
        draw_menu = QMenu("抽奖", self)
        menu_bar.addMenu(draw_menu)
        
        # 开始抽奖动作
        start_action = QAction("开始抽奖", self)
        start_action.setShortcut(QKeySequence("Ctrl+D"))
        start_action.triggered.connect(self._start_draw)
        draw_menu.addAction(start_action)
        
        # 重置动作
        reset_action = QAction("重置", self)
        reset_action.setShortcut(QKeySequence("Ctrl+R"))
        reset_action.triggered.connect(self._reset_lottery)
        draw_menu.addAction(reset_action)
        
        # 设置菜单
        settings_menu = QMenu("设置", self)
        menu_bar.addMenu(settings_menu)
        
        # 打开设置对话框
        settings_action = QAction("应用设置", self)
        settings_action.setShortcut(QKeySequence("Ctrl+,"))
        settings_action.triggered.connect(self._open_settings)
        settings_menu.addAction(settings_action)
        
        # 清除所有日志功能已移至设置对话框中
        
        # 设置主题子菜单
        theme_menu = QMenu("切换主题", self)
        settings_menu.addMenu(theme_menu)
        
        # 深色主题
        dark_theme_action = QAction("深色主题", self)
        dark_theme_action.triggered.connect(lambda: self._quick_change_theme("dark"))
        theme_menu.addAction(dark_theme_action)
        
        # 浅色主题
        light_theme_action = QAction("浅色主题", self)
        light_theme_action.triggered.connect(lambda: self._quick_change_theme("light"))
        theme_menu.addAction(light_theme_action)
        
        # 帮助菜单
        help_menu = QMenu("帮助", self)
        menu_bar.addMenu(help_menu)
        
        # 关于动作
        about_action = QAction("关于", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)
    
    def _create_status_bar(self) -> None:
        """创建状态栏"""
        status_bar = QStatusBar(self)
        self.setStatusBar(status_bar)
        
        # 添加状态标签
        self.status_label = QLabel()
        status_bar.addWidget(self.status_label)
    
    def _create_draw_area(self) -> QWidget:
        """创建抽奖显示区域"""
        # 创建抽奖显示区域容器
        draw_area = QWidget()
        draw_layout = QVBoxLayout(draw_area)
        draw_layout.setContentsMargins(10, 10, 10, 10)
        draw_layout.setSpacing(15)
        
        # 创建抽奖数字显示控件
        self.number_display = NumberDisplay()
        self.number_display.setMinimumHeight(120)  # 增加高度使其更明显
        self.number_display.setMinimumWidth(250)   # 设置最小宽度
        self.number_display.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        self.number_display.set_placeholder("等待抽奖...")
        self.number_display.setVisible(True)  # 确保控件可见
        logger.info("创建了NumberDisplay控件")
        draw_layout.addWidget(self.number_display)
        
        # 创建结果显示区域
        self.result_display = ResultDisplay()
        self.result_display.setMinimumHeight(120)
        self.result_display.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        logger.info("创建了ResultDisplay控件")
        draw_layout.addWidget(self.result_display)
        
        # 上方控制区域 - 小组选择和抽取数量
        top_control_layout = QHBoxLayout()
        
        # 小组选择下拉框
        group_layout = QHBoxLayout()
        group_label = QLabel("选择小组:")
        group_label.setStyleSheet("font-size: 14px; font-weight: bold;")
        group_layout.addWidget(group_label)
        
        self.group_combo = QComboBox()
        self.group_combo.setEditable(True)  # 允许打字筛选
        self.group_combo.setMinimumWidth(250)
        self.group_combo.setMinimumHeight(30)
        self.group_combo.setStyleSheet("font-size: 14px;")
        
        # 小组选中事件
        self.group_combo.currentIndexChanged.connect(self._on_group_selected)
        
        # 添加回车键加载功能
        self.group_combo.lineEdit().returnPressed.connect(self._on_group_filter_enter)
        
        group_layout.addWidget(self.group_combo)
        
        top_control_layout.addLayout(group_layout)
        top_control_layout.addStretch(1)
        
        # 抽取数量设置
        count_layout = QHBoxLayout()
        draw_count_label = QLabel("抽取人数:")
        draw_count_label.setStyleSheet("font-size: 14px; font-weight: bold;")
        count_layout.addWidget(draw_count_label)
        
        self.draw_count_spin = QSpinBox()
        self.draw_count_spin.setMinimum(1)
        self.draw_count_spin.setMaximum(100)
        self.draw_count_spin.setValue(app_settings.get('draw_count', 1))
        self.draw_count_spin.setMinimumHeight(30)  # 增加高度
        self.draw_count_spin.setMinimumWidth(100)  # 增加宽度
        # 不再设置硬编码的样式，以便适配主题
        count_layout.addWidget(self.draw_count_spin)
        
        top_control_layout.addLayout(count_layout)
        

        
        draw_layout.addLayout(top_control_layout)
        
        # 底部按钮区域
        button_layout = QHBoxLayout()  
        button_layout.addStretch(1)
        
        # 导出名单按钮
        self.export_button = QPushButton("导出名单")
        self.export_button.setIcon(QIcon(":/icons/export.png"))
        self.export_button.clicked.connect(self._export_results)
        self.export_button.setEnabled(False)  # 初始禁用
        button_layout.addWidget(self.export_button)
        
        # 开始抽奖按钮
        self.draw_button = QPushButton("开始抽奖")
        self.draw_button.setIcon(QIcon(":/icons/draw.png"))
        self.draw_button.clicked.connect(self._on_draw_button_clicked)
        self.draw_button.setEnabled(False)  # 初始禁用
        button_layout.addWidget(self.draw_button)
        
        # 重置按钮
        self.reset_button = QPushButton("重置")
        self.reset_button.setIcon(QIcon(":/icons/reset.png"))
        self.reset_button.clicked.connect(self._reset_lottery)
        self.reset_button.setEnabled(False)  # 初始禁用
        button_layout.addWidget(self.reset_button)
        
        draw_layout.addLayout(button_layout)
        
        return draw_area
    
    def _load_settings(self) -> None:
        """加载设置"""
        # 加载抽奖设置
        draw_count = app_settings.get('draw_count', 1)
        if hasattr(self, 'draw_count_spin'):
            self.draw_count_spin.setValue(draw_count)
        
        # 加载小组设置并填充下拉框
        self._load_groups()
    
    def _update_file_sources(self) -> None:
        """更新文件来源（在设置对话框中管理）"""
        # 该方法保留但功能已移至设置对话框
        pass
    
    @Slot(int)
    def _on_group_selected(self, index: int) -> None:
        """小组选择改变事件
        
        Args:
            index: 选中的小组索引
        """
        if index < 0 or not hasattr(self, 'group_combo'):
            return
        
        # 获取选中的项目数据
        selected_data = self.group_combo.itemData(index)
        if not selected_data:
            logger.warning(f"选中的小组没有数据: 索引 {index}")
            return
            
        # 获取文件路径
        selected_name = selected_data.get('name', '')
        file_path = selected_data.get('file_path', '')
        
        # 记住选择的小组
        app_settings.set_last_selected_group(selected_name)
        app_settings.add_to_group_selection_history(selected_name)
        
        # 加载对应的名单文件
        if file_path:
            self._load_file(file_path)
            if selected_name == "当前文件":
                self.statusBar().showMessage(f"已加载当前文件名单", 3000)
            else:
                self.statusBar().showMessage(f"已加载小组 '{selected_name}' 的名单", 3000)
            logger.info(f"已通过小组选择加载文件: {file_path}, 小组: {selected_name}")
        else:
            error_msg = f"小组 '{selected_name}' 没有指定文件路径"
            logger.warning(error_msg)
            QMessageBox.warning(self, "小组文件路径缺失", error_msg + "，请在设置中为该小组指定有效的名单文件。")
            self.statusBar().showMessage(error_msg, 5000)
    
    def _load_groups(self) -> None:
        """加载小组设置并填充下拉框"""
        if not hasattr(self, 'group_combo'):
            return
            
        # 保存当前选中的小组
        current_text = self.group_combo.currentText() if self.group_combo.count() > 0 else ""
        
        # 清空下拉框
        self.group_combo.clear()
        
        # 获取小组设置
        groups = app_settings.get('group_settings', [])
        
        # 获取小组选择历史记录
        selection_history = app_settings.get_group_selection_history()
        
        # 将历史记录中的小组排在前面（如果存在）
        groups_dict = {group['name']: group for group in groups}
        ordered_groups = []
        
        # 先添加历史记录中的小组
        for history_name in selection_history:
            if history_name in groups_dict:
                ordered_groups.append(groups_dict[history_name])
                del groups_dict[history_name]
        
        # 再添加其余小组
        ordered_groups.extend(groups_dict.values())
        
        # 添加小组到下拉框
        for group in ordered_groups:
            # 如果是最近使用过的小组，在名称前加上星号标记
            display_name = group['name']
            if group['name'] in selection_history[:3]:  # 最近3个小组
                display_name = f"★ {group['name']}"
            
            self.group_combo.addItem(display_name, group)
            logger.debug(f"添加小组: {group['name']}")
        
        # 恢复上次选择的小组
        last_selected = app_settings.get_last_selected_group()
        if last_selected:
            # 查找匹配的小组（忽略星号标记）
            for i in range(self.group_combo.count()):
                item_data = self.group_combo.itemData(i)
                if item_data and item_data.get('name') == last_selected:
                    self.group_combo.setCurrentIndex(i)
                    # 手动触发选择事件来加载文件
                    self._on_group_selected(i)
                    logger.info(f"已恢复上次选择的小组: {last_selected}")
                    break
        elif current_text:
            # 如果没有上次选择记录，尝试恢复之前的选择
            for i in range(self.group_combo.count()):
                item_data = self.group_combo.itemData(i)
                if item_data and item_data.get('name') == current_text:
                    self.group_combo.setCurrentIndex(i)
                    # 手动触发选择事件来加载文件
                    self._on_group_selected(i)
                    logger.debug(f"恢复之前选中的小组: {current_text}")
                    break
        
        # 支持打字筛选
        self.group_combo.setEditable(True)
        self.group_combo.setInsertPolicy(QComboBox.NoInsert)  # 防止添加新项
        
        # 添加提示
        history_tip = ""
        if selection_history:
            history_tip = f"\n★ 标记为最近使用的小组"
        
        self.group_combo.setToolTip("选择小组或输入文字筛选"
                               "\n按回车键加载选中小组名单" + history_tip)
        
        # 启用下拉框
        self.group_combo.setEnabled(True)
        
        logger.info(f"已加载 {len(ordered_groups)} 个小组选项，其中 {len(selection_history)} 个有历史记录")
    
    def _apply_theme(self) -> None:
        """应用当前主题样式，支持用户自定义颜色"""
        # 从设置中获取当前主题模式，默认使用dark
        theme_mode = app_settings.get_theme_mode() or 'dark'
        
        # 获取用户自定义的主题颜色
        custom_colors = app_settings.get('theme_colors', {})
        
        # 获取对应的主题，加入自定义颜色
        theme = get_theme(theme_mode, custom_colors)
        
        # 应用全局样式
        self.setStyleSheet(theme.GLOBAL_STYLE)
        
        # 应用特定组件的样式
        if hasattr(self, 'number_display'):
            self.number_display.setStyleSheet(theme.NUMBER_DISPLAY_STYLE)
            
        if hasattr(self, 'result_display'):
            self.result_display.setStyleSheet(theme.RESULT_DISPLAY_STYLE)
        
        # 应用颜色到抽奖按钮
        if hasattr(self, 'draw_button'):
            self.draw_button.setStyleSheet(theme.PRIMARY_BUTTON)
            
        if hasattr(self, 'reset_button'):
            self.reset_button.setStyleSheet(theme.WARNING_BUTTON)
            
        # 使用现代的图标
        if hasattr(self, 'toolbar'):
            self._update_toolbar_icons()
            
        # 记录日志
        if custom_colors:
            logger.info(f"已应用自定义主题颜色: {custom_colors}")
        else:
            logger.info(f"已应用标准{theme_mode}主题")
        
    def _update_toolbar_icons(self) -> None:
        """
        根据当前主题更新工具栏图标
        """
        # 获取当前主题
        theme_mode = app_settings.get_theme_mode() or 'dark'
        
        # 根据主题模式使用不同的图标前缀
        icon_prefix = "dark" if theme_mode == "light" else "light"
        
        # 更新工具栏图标
        if hasattr(self, 'action_open'):
            self.action_open.setIcon(QIcon(f":icons/{icon_prefix}_open_file.png"))
        
        if hasattr(self, 'action_export'):
            self.action_export.setIcon(QIcon(f":icons/{icon_prefix}_export.png"))
            
        if hasattr(self, 'action_settings'):
            self.action_settings.setIcon(QIcon(f":icons/{icon_prefix}_settings.png"))
            
        if hasattr(self, 'action_theme'):
            self.action_theme.setIcon(QIcon(f":icons/{icon_prefix}_theme.png"))
            
        logger.debug(f"已更新工具栏图标为{icon_prefix}模式")
    
    @Slot(str)
    def _quick_change_theme(self, theme_mode: str) -> None:
        """快速切换主题
        
        Args:
            theme_mode: 主题模式，"light"或"dark"
        """
        # 更新主题设置
        if theme_mode not in ["light", "dark"]:
            logger.warning(f"未知的主题模式: {theme_mode}")
            return
        
        # 设置主题模式
        app_settings.set_theme_mode(theme_mode)
        
        # 获取用户自定义的主题颜色
        custom_colors = app_settings.get('theme_colors', {})
        
        # 应用主题
        self._apply_theme()
        
        # 获取当前主题实例，用于更新按钮样式
        current_theme = get_theme(theme_mode, custom_colors)
        
        # 更新状态栏
        theme_name = "浅色主题" if theme_mode == "light" else "深色主题"
        status_message = f"已切换到{theme_name}"
        if custom_colors:
            status_message += "(带自定义颜色)"
        self.statusBar().showMessage(status_message, 3000)
        
        # 更新按钮样式
        if hasattr(self, 'draw_button') and hasattr(current_theme, 'PRIMARY_BUTTON'):
            self.draw_button.setStyleSheet(current_theme.PRIMARY_BUTTON)
        
        if hasattr(self, 'reset_button') and hasattr(current_theme, 'WARNING_BUTTON'):
            self.reset_button.setStyleSheet(current_theme.WARNING_BUTTON)
        
        # 应用文本显示样式
        if hasattr(self, 'number_display') and hasattr(current_theme, 'NUMBER_DISPLAY_STYLE'):
            self.number_display.setStyleSheet(current_theme.NUMBER_DISPLAY_STYLE)
        
        if hasattr(self, 'result_display') and hasattr(current_theme, 'RESULT_DISPLAY_STYLE'):
            self.result_display.setStyleSheet(current_theme.RESULT_DISPLAY_STYLE)
        
        # 记录到日志
        logger.info(f"已应用{theme_mode}主题" + ("(带自定义颜色)" if custom_colors else ""))
        
        # 记录名称颜色信息
        if 'name_color' in custom_colors:
            logger.debug(f"已应用自定义名称颜色: {custom_colors.get('name_color', '默认')}")


    
    @Slot()
    def _on_group_filter_enter(self) -> None:
        """处理小组筛选框按回车键事件"""
        if not hasattr(self, 'group_combo'):
            return
            
        # 获取当前输入文字
        current_text = self.group_combo.currentText()
        if not current_text.strip():
            return
            
        # 查找匹配项
        index = self.group_combo.findText(current_text, Qt.MatchContains)
        if index >= 0:
            # 如果找到了匹配项，选中并加载
            self.group_combo.setCurrentIndex(index)
            logger.info(f"通过筛选选择小组: {current_text}")
            # 不需要再调用_on_group_selected，因为设置索引会触发currentIndexChanged信号
        else:
            # 如果没有找到匹配项，展示所有选项
            self.group_combo.showPopup()
            self.statusBar().showMessage(f"没有找到匹配的小组: {current_text}", 3000)
            logger.info(f"筛选未找到匹配小组: {current_text}")
    
    def _on_settings_saved(self) -> None:
        """设置保存后的处理"""
        # 更新抽奖设置
        draw_count = app_settings.get('draw_count', 1)
        self.draw_count_spin.setValue(draw_count)
        
        # 重新加载小组设置
        self._load_groups()
        
        # 重新加载候选名单
        file_path = app_settings.get('current_name_file', '')
        if file_path:
            self._load_file(file_path)
        
        # 应用当前主题
        self._apply_theme()
        
        # 更新状态栏信息
        self.statusBar().showMessage("设置已更新", 3000)
    
    def _open_settings(self) -> None:
        """打开设置对话框"""
        # 检查是否启用了密码保护
        if app_settings.is_password_protected():
            # 弹出密码输入对话框
            password, ok = QInputDialog.getText(
                self,
                "密码验证",
                "请输入设置密码：",
                QLineEdit.Password
            )
            
            # 如果用户取消或密码错误，则不打开设置
            if not ok or not app_settings.verify_password(password):
                if ok:  # 用户输入了密码但验证失败
                    QMessageBox.warning(self, "密码错误", "密码验证失败，无法打开设置")
                return
        
        # 密码验证通过或未启用密码保护，创建设置对话框
        settings_dialog = SettingsDialog(self)
        
        # 连接设置保存信号
        settings_dialog.settings_saved.connect(self._on_settings_saved)
        
        # 显示设置对话框
        settings_dialog.exec()
        
        logger.debug("已打开设置对话框")
    
    @Slot()
    def _select_file(self) -> None:
        """选择文件对话框"""
        # 获取上次使用的目录
        last_dir = app_settings.get('last_file_directory', str(Path.home()))
        
        # 打开文件选择对话框
        file_dialog = QFileDialog(self)
        file_path, _ = file_dialog.getOpenFileName(
            self,
            "选择名单文件",
            last_dir,
            f"{FileType.CSV.value};;{FileType.TXT.value};;{FileType.EXCEL.value};;{FileType.JSON.value};;{FileType.ALL.value}"
        )
        
        if file_path:
            # 保存当前目录
            app_settings.set('last_file_directory', str(Path(file_path).parent))
            
            # 加载文件
            self._load_file(file_path)
            
            # 添加到设置
            app_settings.add_name_file(file_path)
            
            # 更新文件来源
            self._update_file_sources()
            
            # 选择新添加的文件
            index = self.file_source_combo.findData(file_path)
            if index >= 0:
                self.file_source_combo.setCurrentIndex(index)
    
    @Slot()
    def _load_name_file(self) -> None:
        """加载名单文件"""
        # 获取当前选择的文件或URL
        current_index = self.file_source_combo.currentIndex()
        
        if current_index <= 0:
            # 如果没有选择文件，打开文件选择对话框
            self._select_file()
            return
            
        # 获取文件路径或URL
        file_path_or_url = self.file_source_combo.currentData()
        
        if not file_path_or_url:
            return
            
        # 加载文件
        self._load_file(file_path_or_url)
    
    def _load_file(self, file_path_or_url: str) -> None:
        """
        加载文件内容
        
        Args:
            file_path_or_url: 文件路径或URL
        """
        try:
            # 显示加载中状态
            self.statusBar().showMessage(f"正在加载 {file_path_or_url}...")
            QApplication.processEvents()
            
            # 解析文件
            names, weights = DataParser.parse_file(file_path_or_url)
            
            if not names:
                QMessageBox.warning(self, "空文件", "文件不包含有效的名单数据")
                self.statusBar().showMessage("加载失败：空文件")
                return
            
            # 加载到抽奖引擎
            self._lottery_engine.load_data(names, weights)
            
            # 更新界面信息
            self.total_count_label.setText(f"总人数: {self._lottery_engine.get_total_count()}")
            self.remaining_count_label.setText(f"剩余人数: {self._lottery_engine.get_remaining_count()}")
            
            # 更新当前文件路径
            app_settings.set('current_name_file', file_path_or_url)
            
            # 清空结果显示
            if hasattr(self, 'number_display'):
                self.number_display.clear_result()
            if hasattr(self, 'result_display'):
                self.result_display.clear_results()
            
            # 更新状态栏
            self.statusBar().showMessage(f"已加载 {len(names)} 个候选者", 3000)
            logger.info(f"已加载文件: {file_path_or_url}, 共 {len(names)} 个候选者")
            
            # 启用抽奖按钮和导出按钮
            if hasattr(self, 'draw_button'):
                self.draw_button.setEnabled(True)
            if hasattr(self, 'export_button'):
                self.export_button.setEnabled(True)
            
            self._stop_draw()
            return
        except Exception as e:
            QMessageBox.critical(self, "加载失败", f"无法加载文件: {str(e)}")
            self.statusBar().showMessage(f"加载失败: {str(e)}")
            logger.error(f"加载文件失败: {file_path_or_url}, 错误: {str(e)}")
    
    @Slot()
    def _on_draw_button_clicked(self) -> None:
        """处理抽奖按钮点击事件，根据当前状态决定是开始还是停止抽奖"""
        if self._is_drawing:
            # 如果正在抽奖，则停止抽奖
            logger.info("抽奖按钮点击：当前正在抽奖，执行停止操作")
            self._stop_draw()
        else:
            # 如果没有在抽奖，则开始抽奖
            logger.info("抽奖按钮点击：当前未在抽奖，执行开始操作")
            self._start_draw()
    
    @Slot()
    def _start_draw(self) -> None:
        """开始抽奖"""
        # 检查是否加载了名单
        total_count = self._lottery_engine.get_total_count()
        if total_count == 0:
            QMessageBox.warning(self, "未加载名单", "请先加载名单或选择小组后再进行抽奖")
            self.statusBar().showMessage("需要先加载有效名单")
            return
        
        # 每次抽奖前清空之前的结果显示
        if hasattr(self, 'result_display'):
            self.result_display.clear_results()
        if hasattr(self, 'number_display'):
            self.number_display.clear_result()
        
        # 检查剩余可用候选者
        if self._lottery_engine.get_remaining_count() == 0:
            # 如果没有剩余候选者，自动重置
            self._lottery_engine.reset_exclusions()
            self.statusBar().showMessage("所有候选者已抽取完毕，已自动重置名单", 3000)
        
        # 开始抽奖
        self._is_drawing = True
        
        # 更改按钮文本
        self.draw_button.setText("结束抽奖")
        
        # 使用当前主题的按钮样式
        theme = get_theme(app_settings.get_theme_mode())
        self.draw_button.setStyleSheet(theme.DANGER_BUTTON)
        
        # 从设置中获取抽奖模式
        draw_mode = app_settings.get('draw_mode', DrawMode.EQUAL.value)
        use_weight = draw_mode == DrawMode.WEIGHTED.value
        # 从设置中获取是否允许重复抽取
        allow_repeat = app_settings.get('allow_repeat', False)
        
        # 获取抽取数量
        draw_count = 1
        if hasattr(self, 'draw_count_spin'):
            draw_count = self.draw_count_spin.value()
        
        # 预先抽取所有获奖者，但不显示，等用户点击停止后才显示结果
        if draw_count > 1:
            self._current_winners = self._lottery_engine.draw_multiple(
                draw_count, use_weight=use_weight, allow_repeat=allow_repeat
            )
        else:
            # 单个抽奖
            winner = self._lottery_engine.draw_one(use_weight=use_weight, allow_repeat=allow_repeat)
            if winner:
                self._current_winners = [winner]
            else:
                self._current_winners = []
                
        logger.info(f"已预先抽取结果，但不显示，等待停止按钮: {self._current_winners}")
        
        # 开始持续滚动动画，直到用户手动停止
        if hasattr(self, '_current_winners') and self._current_winners:
            # 启动无限滚动动画，直到用户手动停止
            self._start_infinite_roll_animation()
        else:
            self.statusBar().showMessage("没有有效的抽奖结果")
            self._is_drawing = False
            self._update_ui_after_draw()
    
    @Slot()
    def _create_task(self) -> None:
        """创建新任务，同时作为导出名单功能"""
        if self._lottery_engine.get_total_count() == 0:
            QMessageBox.warning(self, "无数据", "请先加载名单文件")
            return
            
        # 创建任务配置对话框
        task_dialog = QDialog(self)
        task_dialog.setWindowTitle("创建新任务")
        task_dialog.setMinimumWidth(400)
        
        dialog_layout = QVBoxLayout(task_dialog)
        
        # 任务名称
        name_layout = QHBoxLayout()
        name_label = QLabel("任务名称:")
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        default_name = f"抽奖任务_{timestamp}"
        name_edit = QLineEdit(default_name)
        name_layout.addWidget(name_label)
        name_layout.addWidget(name_edit)
        dialog_layout.addLayout(name_layout)
        
        # 加密选项
        encrypt_layout = QHBoxLayout()
        encrypt_check = QCheckBox("加密任务数据")
        encrypt_check.setToolTip("启用后，任务数据将使用密码加密存储")
        password_edit = QLineEdit()
        password_edit.setPlaceholderText("输入加密密码（可选）")
        password_edit.setEchoMode(QLineEdit.Password)
        password_edit.setEnabled(False)
        
        def on_encrypt_toggled(checked):
            password_edit.setEnabled(checked)
            if not checked:
                password_edit.clear()
        
        encrypt_check.toggled.connect(on_encrypt_toggled)
        encrypt_layout.addWidget(encrypt_check)
        encrypt_layout.addWidget(password_edit)
        dialog_layout.addLayout(encrypt_layout)
        
        # 按钮
        button_layout = QHBoxLayout()
        ok_button = QPushButton("创建")
        cancel_button = QPushButton("取消")
        button_layout.addWidget(ok_button)
        button_layout.addWidget(cancel_button)
        dialog_layout.addLayout(button_layout)
        
        # 连接信号
        ok_button.clicked.connect(task_dialog.accept)
        cancel_button.clicked.connect(task_dialog.reject)
        
        # 显示对话框
        if task_dialog.exec() != QDialog.Accepted:
            return
            
        task_name = name_edit.text().strip()
        if not task_name:
            QMessageBox.warning(self, "输入错误", "任务名称不能为空")
            return
            
        # 获取当前抽奖结果
        results = []
        if hasattr(self, 'result_display'):
            results = self.result_display.get_results_as_list()
        
        # 获取当前名单
        candidates = []
        if hasattr(self, '_lottery_engine') and hasattr(self._lottery_engine, '_names'):
            candidates = self._lottery_engine._names.copy()
        
        # 创建任务记录
        task_record = {
            "name": task_name,
            "timestamp": datetime.now().isoformat(),
            "file": app_settings.get('current_name_file', ''),
            "total_count": self._lottery_engine.get_total_count(),
            "results": results,
            "candidates": candidates,
            "encrypted": encrypt_check.isChecked()
        }
        
        # 如果选择加密
        if encrypt_check.isChecked():
            password = password_edit.text()
            if not password:
                QMessageBox.warning(self, "密码错误", "加密任务需要设置密码")
                return
            
            try:
                # 加密敏感数据
                encrypted_data = self._encrypt_task_data(task_record, password)
                task_record.update(encrypted_data)
                logger.info(f"任务 '{task_name}' 已加密")
            except Exception as e:
                QMessageBox.critical(self, "加密失败", f"无法加密任务数据: {str(e)}")
                return
        
        # 保存任务
        existing_tasks = app_settings.get('task_records', [])
        existing_tasks.append(task_record)
        app_settings.set('task_records', existing_tasks)
        app_settings._save_config()
        
        self.statusBar().showMessage(f"任务 '{task_name}' 已保存", 3000)
        logger.info(f"已创建新任务: {task_name}")
        
        # 生成默认文件名（任务名称+时间）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        default_file_name = f"{task_name}_{timestamp}"
        
        # 查找刚创建的任务在数据库中的索引
        try:
            tasks_path = Path(app_settings.get('tasks_file', str(self.get_default_db_path())))
            if tasks_path.exists():
                with open(tasks_path, 'r', encoding='utf-8') as f:
                    all_tasks = json.load(f)
                # 新任务是最后一个
                new_task_index = len(all_tasks) - 1
            else:
                new_task_index = -1
        except:
            new_task_index = -1
            
        # 弹出导出格式选择对话框
        self._export_list_with_format(task_record, default_file_name, new_task_index)
            
        # 检查是否需要清空之前的结果
        accumulate_results = app_settings.get('accumulate_results', False)
        if not accumulate_results and hasattr(self, 'result_display'):
            self.result_display.clear_results()
    
    def _encrypt_task_data(self, task_record: dict, password: str) -> dict:
        """加密任务数据"""
        import hashlib
        import json
        import base64
        
        # 创建密钥
        key = hashlib.sha256(password.encode()).digest()
        
        # 要加密的数据
        sensitive_data = {
            'candidates': task_record.get('candidates', []),
            'results': task_record.get('results', [])
        }
        
        # 转换为JSON字符串
        json_data = json.dumps(sensitive_data, ensure_ascii=False)
        
        # 简单的XOR加密（仅作演示，实际应用建议使用更强的加密算法）
        encrypted_bytes = []
        json_bytes = json_data.encode('utf-8')
        for i, byte_val in enumerate(json_bytes):
            encrypted_bytes.append(byte_val ^ key[i % len(key)])
        
        # 编码为base64
        encrypted_data = base64.b64encode(bytes(encrypted_bytes)).decode('utf-8')
        
        return {
            'candidates': task_record.get('candidates', []),  # 保留明文数据用于导出
            'results': task_record.get('results', []),         # 保留明文数据用于导出
            'encrypted_data': encrypted_data,
            'data_hash': hashlib.sha256(json_data.encode()).hexdigest(),
            'requires_password': True,  # 标记需要密码查看详情
            'encrypted': True
        }
    
    def _decrypt_task_data(self, task_record: dict, password: str) -> dict:
        """解密任务数据"""
        import hashlib
        import json
        import base64
        
        if not task_record.get('encrypted') or not task_record.get('encrypted_data'):
            return task_record
        
        try:
            # 创建密钥
            key = hashlib.sha256(password.encode()).digest()
            
            # 解码base64
            encrypted_bytes = base64.b64decode(task_record['encrypted_data'])
            
            # XOR解密
            decrypted_chars = []
            for i, byte in enumerate(encrypted_bytes):
                decrypted_chars.append(chr(byte ^ key[i % len(key)]))
            
            json_data = ''.join(decrypted_chars)
            
            # 验证数据完整性
            data_hash = hashlib.sha256(json_data.encode()).hexdigest()
            if data_hash != task_record.get('data_hash'):
                raise ValueError("数据完整性验证失败")
            
            # 解析JSON
            sensitive_data = json.loads(json_data)
            
            # 更新任务记录
            decrypted_record = task_record.copy()
            decrypted_record.update(sensitive_data)
            
            return decrypted_record
            
        except Exception as e:
            logger.error(f"解密任务数据失败: {str(e)}")
            raise ValueError("解密失败，可能是密码错误或数据损坏")
            
    def _animate_results(self, results: List[str]) -> None:
        """
        动画显示抽奖结果
        
        Args:
            results: 抽奖结果列表
        """
        logger.info(f"准备显示抽奖结果，共{len(results)}个结果")
        
        # 清空之前的结果显示
        if hasattr(self, 'result_display'):
            self.result_display.clear_results()
            
        # 如果有多个结果，依次显示
        if len(results) > 1:
            # 直接显示所有结果，不需要一个一个滚动
            # 先做一次单个的动画效果，然后显示所有结果
            logger.info("多人抽奖模式，一次性显示所有结果")
            
            # 记录当前结果供后续处理
            self._current_winners = results
            
            # 显示第一个结果的动画，但不会因此触发下一个动画
            self._start_roll_animation("多人抽奖完成")
            
            # 直接将所有结果显示到结果区域
            if hasattr(self, 'result_display'):
                for winner in results:
                    self.result_display.add_result(winner)
                logger.info(f"所有{len(results)}个结果已添加到结果显示区")
            else:
                logger.error("找不到result_display控件")
        else:
            # 只有一个结果，使用原来的滚动动画
            logger.info("单人抽奖模式，使用滚动动画")
            if results:
                self._start_roll_animation(results[0])
            else:
                # 没有结果，停止动画
                self.statusBar().showMessage("抽奖失败：没有有效结果")
                self._is_drawing = False
                self._update_ui_after_draw()

    def _show_next_result(self) -> None:
        """显示下一个结果（用于多结果动画）"""
        if not hasattr(self, '_current_winners') or not self._current_winners:
            return
            
        # 获取当前索引的结果
        if self._winner_index < len(self._current_winners):
            result = self._current_winners[self._winner_index]
            self._start_roll_animation(result)
            self._winner_index += 1
        else:
            # 所有结果都已显示完成
            self._is_drawing = False
            
            # 更新按钮状态
            self._update_ui_after_draw()

    def _start_roll_animation(self, target_value: str) -> None:
        """
        开始滚动动画
        
        Args:
            target_value: 目标显示值
        """
        # 设置状态
        self.statusBar().showMessage("正在抽取...", 1000)
        logger.info(f"开始滚动动画，目标值: {target_value}")
        
        # 获取所有候选名单用于动画
        all_names = self._lottery_engine.get_all_names()
        logger.info(f"获取到候选者名称列表，共 {len(all_names)} 个")
        
        if not all_names:
            logger.warning("候选者名单为空，无法启动动画")
            # 如果没有名单，直接显示结果
            if hasattr(self, 'number_display'):
                # 确保定时器没有在运行
                if self._roll_timer.isActive():
                    self._roll_timer.stop()
                self._roll_timer.start(self._animation_speed)
                logger.info(f"定时器启动，间隔: {self._animation_speed}ms")
    
    def _update_roll_display(self) -> None:
        """更新滚动显示（用于定时器）"""
        if not hasattr(self, '_animation_names') or not self._animation_names:
            logger.error("动画名称列表不存在或为空")
            self._roll_timer.stop()
            return
        
        # 随机选择一个名称并显示
        index = random.randint(0, len(self._animation_names) - 1)
        random_name = self._animation_names[index]
        self.number_display.set_result(random_name)
        
        # 检查是否是无限滚动模式
        if hasattr(self, '_is_infinite_rolling') and self._is_infinite_rolling:
            # 无限滚动模式，仅更新计数器，不停止
            self._animation_counter += 1
            logger.debug(f"无限滚动动画: [{self._animation_counter}] {random_name}")
            
            # 每50次随机调整速度
            if self._animation_counter % 50 == 0:
                speed_change = random.choice([-20, -10, 10, 20])
                new_speed = max(50, min(180, self._animation_speed + speed_change))
                self._animation_speed = new_speed
                self._roll_timer.setInterval(self._animation_speed)
                logger.debug(f"调整无限滚动速度: {new_speed}ms")
            return
        
        # 普通模式（非无限滚动）
        self._animation_counter += 1
        logger.debug(f"动画显示: [{self._animation_counter}/{self._animation_max_counter}] {random_name}")
        
        # 逐渐减慢速度
        if self._animation_counter > self._animation_max_counter * 0.5:
            self._animation_speed = 150
        if self._animation_counter > self._animation_max_counter * 0.7:
            self._animation_speed = 250
        if self._animation_counter > self._animation_max_counter * 0.9:
            self._animation_speed = 350
        
        # 更新定时器间隔
        if hasattr(self, '_roll_timer'):
            self._roll_timer.setInterval(self._animation_speed)
        
        # 检查是否达到最大计数
        if self._animation_counter >= self._animation_max_counter:
            logger.info("动画达到最大计数，准备显示最终结果")
            # 停止定时器
            if hasattr(self, '_roll_timer'):
                self._roll_timer.stop()
                logger.info("定时器已停止")
            
            # 显示最终结果
            if hasattr(self, 'number_display') and hasattr(self, '_animation_target'):
                self.number_display.set_result(self._animation_target)
                logger.info(f"显示最终结果: {self._animation_target}")
                # 触发动画完成事件
                self._on_roll_animation_finished()
            
            # 重置状态
            self._is_drawing = False
            logger.info("多人抽奖完成，重置抽奖状态")
            self._update_ui_after_draw()
            return
        
        # 单人抽奖完成，显示结果并更新结果区域
        if hasattr(self, 'result_display'):
            # 将结果添加到结果显示区
            self.result_display.add_result(self._animation_target)
            logger.info(f"结果已添加到结果显示区: {self._animation_target}")
        else:
            logger.error("找不到result_display控件")
        
        # 更新剩余人数显示
        remaining = self._lottery_engine.get_remaining_count()
        self.remaining_count_label.setText(f"剩余人数: {remaining}")
        logger.info(f"更新剩余人数: {remaining}")
        
        # 如果是多个结果需要通过滚动动画逐个显示，显示下一个
        if hasattr(self, '_winner_index') and hasattr(self, '_current_winners'):
            if self._winner_index < len(self._current_winners):
                logger.info(f"还有更多结果需要显示，当前索引: {self._winner_index}/{len(self._current_winners)}")
                self._show_next_result()
                return
            else:
                logger.info("所有结果已显示完毕")
        
        # 所有结果都已显示，重置状态
        self._is_drawing = False
        logger.info("抽奖完成，重置抽奖状态")
        self._update_ui_after_draw()
    
    def _start_infinite_roll_animation(self) -> None:
        """开始无限滚动动画，直到用户手动停止"""
        logger.info("开始无限滚动动画，直到用户点击停止")
        
        # 清除可能的前一个定时器
        if hasattr(self, '_roll_timer') and self._roll_timer.isActive():
            self._roll_timer.stop()
            
        # 获取候选者名称列表用于滚动显示
        self._animation_names = self._lottery_engine.get_all_names()
        logger.info(f"获取到候选者名称列表，共 {len(self._animation_names)} 个")
        
        if not self._animation_names:
            logger.error("没有可用的候选者名称")
            self._is_drawing = False
            self._update_ui_after_draw()
            return
            
        # 设置初始动画速度
        self._animation_speed = 100  # 毫秒
        
        # 无限滚动模式，不设置终止条件
        self._animation_counter = 0
        self._animation_max_counter = None  # 无限滚动，终止条件由停止按钮触发
        
        # 标记这是无限滚动模式
        self._is_infinite_rolling = True
        
        # 开始定时器
        self._roll_timer.start(self._animation_speed)
        logger.info(f"定时器启动，间隔: {self._animation_speed}ms")
    
    def _stop_draw(self) -> None:
        """停止抽奖动画并显示结果"""
        logger.info("用户点击停止抽奖")
        
        # 停止定时器
        if hasattr(self, '_roll_timer') and self._roll_timer.isActive():
            self._roll_timer.stop()
            logger.info("定时器已停止")
        
        # 如果是无限滚动模式，显示预先抽取的结果
        if hasattr(self, '_is_infinite_rolling') and self._is_infinite_rolling:
            logger.info("无限滚动模式停止，显示所有抽奖结果")
            
            # 清除标记
            self._is_infinite_rolling = False
            
            # 预先抽取的结果是否存在
            if not hasattr(self, '_current_winners') or not self._current_winners:
                logger.error("找不到预先抽取的结果")
                self._is_drawing = False
                self._update_ui_after_draw()
                return
                
            # 如果有多个结果
            if len(self._current_winners) > 1:
                # 在累加模式下，不清空结果区域
                    
                # 直接将所有结果显示到结果区域
                if hasattr(self, 'result_display'):
                    for winner in self._current_winners:
                        self.result_display.add_result(winner)
                    logger.info(f"所有{len(self._current_winners)}个结果已添加到结果显示区")
                else:
                    logger.error("找不到result_display控件")
                    
                # 在NumberDisplay中显示第一个结果
                if hasattr(self, 'number_display'):
                    self.number_display.set_result(self._current_winners[0])
                    logger.info(f"在NumberDisplay中显示第一个结果: {self._current_winners[0]}")
            else:
                # 单个结果
                winner = self._current_winners[0]
                # 在NumberDisplay中显示结果
                if hasattr(self, 'number_display'):
                    self.number_display.set_result(winner)
                    logger.info(f"在NumberDisplay中显示结果: {winner}")
                
                # 在结果区域显示结果
                if hasattr(self, 'result_display'):
                    self.result_display.add_result(winner)
                    logger.info(f"结果已添加到结果显示区: {winner}")
            
            # 更新剩余人数显示
            remaining = self._lottery_engine.get_remaining_count()
            self.remaining_count_label.setText(f"剩余人数: {remaining}")
            logger.info(f"更新剩余人数: {remaining}")
        else:
            # 常规模式，仅清理定时器
            logger.info("正常模式停止抽奖")
            
            # 显示当前动画目标
            if hasattr(self, '_animation_target') and hasattr(self, 'number_display'):
                self.number_display.set_result(self._animation_target)
            
            # 显示所有待显示的结果
            if hasattr(self, '_pending_results') and self._pending_results and hasattr(self, 'result_display'):
                for result in self._pending_results:
                    self.result_display.add_result(result)
                self._pending_results = []
        
        # 重置状态
        self._is_drawing = False
        self._update_ui_after_draw()
    
    def _update_ui_after_draw(self) -> None:
        """更新抽奖完成后的UI状态"""
        self.draw_button.setText("开始抽奖")
        theme = get_theme(app_settings.get_theme_mode())
        self.draw_button.setStyleSheet(theme.PRIMARY_BUTTON)
        
        # 启用控制区域
        if hasattr(self, 'draw_count_spin'):
            self.draw_count_spin.setEnabled(True)
        if hasattr(self, 'export_button'):
            self.export_button.setEnabled(True)
            
        # 根据情况启用重置按钮
        if hasattr(self, 'reset_button'):
            # 如果已经抽取过候选人，则启用重置按钮
            if (self._lottery_engine.get_total_count() > 0 and 
                self._lottery_engine.get_remaining_count() < self._lottery_engine.get_total_count()):
                self.reset_button.setEnabled(True)
            else:
                self.reset_button.setEnabled(False)
    

    

    @Slot()
    def _reset_lottery(self) -> None:
        """重置抽奖状态"""
        # 重置抽奖引擎（清空已排除的索引）
        self._lottery_engine.reset_exclusions()
        
        # 更新状态显示
        self.total_count_label.setText(f"总人数: {self._lottery_engine.get_total_count()}")
        self.remaining_count_label.setText(f"剩余人数: {self._lottery_engine.get_remaining_count()}")
        
        # 清空结果显示
        if hasattr(self, 'number_display'):
            self.number_display.clear_result()
        if hasattr(self, 'result_display'):
            self.result_display.clear_results()
            
        # 更新状态栏
        self.statusBar().showMessage("抽奖已重置", 3000)
        
        # 更新按钮状态
        if hasattr(self, 'reset_button'):
            self.reset_button.setEnabled(False)
    
    @Slot()
    def _export_results(self) -> None:
        """导出抽奖结果"""
        # 检查是否有抽奖结果
        if not hasattr(self, 'result_display') or not self.result_display.has_results():
            QMessageBox.warning(self, "无法导出", "当前没有抽奖结果可导出")
            return
        
        # 获取抽奖结果
        raw_results = self.result_display.get_results_as_list()
        logger.info(f"原始抽奖结果: {raw_results}")
        
        # 确保结果是简单的字符串列表
        results = []
        for result in raw_results:
            if isinstance(result, str):
                results.append(result.strip())
            elif isinstance(result, dict) and 'name' in result:
                results.append(str(result['name']).strip())
            else:
                results.append(str(result).strip())
        
        logger.info(f"处理后的抽奖结果: {results}")
        
        # 创建导出配置对话框
        export_dialog = QDialog(self)
        export_dialog.setWindowTitle("导出名单配置")
        export_dialog.setMinimumWidth(400)
        
        dialog_layout = QVBoxLayout(export_dialog)
        
        # 任务名称输入
        name_layout = QHBoxLayout()
        name_label = QLabel("任务名称:")
        name_edit = QLineEdit()
        name_edit.setText(f"抽奖任务 {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        name_layout.addWidget(name_label)
        name_layout.addWidget(name_edit)
        dialog_layout.addLayout(name_layout)
        
        # 导出格式选择
        format_layout = QHBoxLayout()
        format_label = QLabel("导出格式:")
        format_combo = QComboBox()
        format_combo.addItem("CSV 文件 (*.csv)", ".csv")
        format_combo.addItem("文本文件 (*.txt)", ".txt")
        format_combo.addItem("JSON 文件 (*.json)", ".json")
        format_layout.addWidget(format_label)
        format_layout.addWidget(format_combo)
        dialog_layout.addLayout(format_layout)
        
        # 编辑密码设置
        password_group = QGroupBox("编辑保护")
        password_layout = QVBoxLayout(password_group)
        
        password_check = QCheckBox("设置编辑密码")
        password_check.setToolTip("启用后，编辑此名单时需要输入密码")
        password_layout.addWidget(password_check)
        
        password_input_layout = QHBoxLayout()
        password_label = QLabel("编辑密码:")
        password_edit = QLineEdit()
        password_edit.setPlaceholderText("输入编辑密码")
        password_edit.setEchoMode(QLineEdit.Password)
        password_edit.setEnabled(False)
        password_input_layout.addWidget(password_label)
        password_input_layout.addWidget(password_edit)
        password_layout.addLayout(password_input_layout)
        
        def on_password_toggled(checked):
            password_edit.setEnabled(checked)
            if not checked:
                password_edit.clear()
        
        password_check.toggled.connect(on_password_toggled)
        dialog_layout.addWidget(password_group)
        
        # 结果预览
        preview_group = QGroupBox("结果预览")
        preview_layout = QVBoxLayout(preview_group)
        
        results_list = QListWidget()
        for result in results:
            results_list.addItem(result)
        preview_layout.addWidget(results_list)
        
        count_label = QLabel(f"共 {len(results)} 个结果")
        count_label.setAlignment(Qt.AlignRight)
        preview_layout.addWidget(count_label)
        
        dialog_layout.addWidget(preview_group)
        
        # 按钮区域
        buttons_layout = QHBoxLayout()
        cancel_button = QPushButton("取消")
        export_button = QPushButton("导出")
        export_button.setDefault(True)
        
        buttons_layout.addStretch()
        buttons_layout.addWidget(cancel_button)
        buttons_layout.addWidget(export_button)
        dialog_layout.addLayout(buttons_layout)
        
        # 绑定事件
        cancel_button.clicked.connect(export_dialog.reject)
        export_button.clicked.connect(export_dialog.accept)
        
        # 显示对话框
        if export_dialog.exec_() != QDialog.Accepted:
            return
        
        # 获取用户输入
        task_name = name_edit.text().strip()
        if not task_name:
            task_name = f"抽奖任务 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        selected_format = format_combo.currentData()
        use_edit_password = password_check.isChecked()
        edit_password = password_edit.text().strip()
        
        # 验证编辑密码
        if use_edit_password and not edit_password:
            QMessageBox.warning(self, "密码错误", "启用编辑保护时必须输入密码")
            return
            
        # 抽奖结果导出始终为明文
        
        # 获取当前时间
        timestamp = datetime.now().isoformat()
        time_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        default_dir = app_settings.get('last_file_directory', str(Path.home()))
        
        # 构建文件名
        file_name = f"{task_name}_{time_str}{selected_format}"
        file_name = file_name.replace(":", "-").replace(" ", "_")  # 替换非法字符
        
        # 选择保存路径
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "保存文件",
            str(Path(default_dir) / file_name),
            f"文件 (*{selected_format});;所有文件 (*.*)"
        )
        
        if not file_path:
            return
        
        try:
            # 保存当前目录
            app_settings.set('last_file_directory', str(Path(file_path).parent))
            
            # 根据文件类型生成内容
            ext = Path(file_path).suffix.lower()
            content = ""
            
            if ext == '.csv':
                import io
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(['序号', '抽奖结果'])
                for i, result in enumerate(results, 1):
                    writer.writerow([i, result])
                content = output.getvalue()
            elif ext == '.txt':
                content = f"抽奖结果\n"
                content += f"任务名称: {task_name}\n"
                content += f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                content += f"总人数: {len(results)}\n\n"
                content += "抽奖结果列表:\n"
                for i, result in enumerate(results, 1):
                    content += f"{i}. {result}\n"
            elif ext == '.json':
                export_data = {
                    "task_name": task_name,
                    "export_time": datetime.now().isoformat(),
                    "total_count": len(results),
                    "results": results
                }
                content = json.dumps(export_data, ensure_ascii=False, indent=2)
            
            # 始终保存明文内容
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            status_msg = f"已导出 {len(results)} 个抽奖结果到 {file_path}"
            
            # 将任务保存到历史记录，包含编辑密码信息
            edit_password_info = {'use_edit_password': use_edit_password, 'edit_password': edit_password} if use_edit_password else None
            self._save_task_to_history(task_name, results, timestamp, file_path, edit_password_info)
            
            self.statusBar().showMessage(status_msg, 3000)
            logger.info(f"已导出抽奖结果到 {file_path}, 并添加到历史任务")
            
            # 如果设置了编辑密码，显示成功消息
            if use_edit_password:
                QMessageBox.information(self, "设置成功", "已成功设置编辑密码，下次编辑名单时需要输入密码。")
        except Exception as e:
            QMessageBox.critical(self, "导出失败", f"无法导出结果: {str(e)}")
            logger.error(f"导出抽奖结果失败: {str(e)}")

    def _save_task_to_history(self, task_name: str, results: list, timestamp: str, file_path: str, edit_password_info: dict = None) -> None:
        """将抽奖任务保存到历史记录
        
        Args:
            task_name: 任务名称
            results: 抽奖结果列表
            timestamp: 时间戳
            file_path: 导出文件路径
            edit_password_info: 编辑密码信息，包含use_edit_password和edit_password
        """
        # 读取现有任务文件
        tasks_path = Path(app_settings.get('tasks_file', str(self.get_default_db_path())))
        
        # 创建目录（如果不存在）
        tasks_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 读取现有任务
        tasks = []
        if tasks_path.exists():
            try:
                with open(tasks_path, 'r', encoding='utf-8') as f:
                    tasks = json.load(f)
            except Exception as e:
                logger.error(f"读取任务文件失败: {str(e)}")
                # 如果文件损坏，创建新文件
                tasks = []
        
        # 创建新任务
        new_task = {
            'name': task_name,
            'results': results,
            'timestamp': timestamp,
            'file_path': file_path,
            'export_time': datetime.now().isoformat(),
            'file': app_settings.get('current_name_file', ''),
            'total_count': len(results)
        }
        
        # 添加编辑密码信息
        if edit_password_info and edit_password_info.get('use_edit_password'):
            new_task['edit_password'] = edit_password_info['edit_password']
            new_task['edit_protected'] = True
        
        # 添加到任务列表顶部
        tasks.insert(0, new_task)
        
        # 保留最新的100个任务
        if len(tasks) > 100:
            tasks = tasks[:100]
        
        # 保存任务文件
        try:
            with open(tasks_path, 'w', encoding='utf-8') as f:
                json.dump(tasks, f, ensure_ascii=False, indent=2)
            logger.info(f"已将任务 '{task_name}' 添加到历史记录")
        except Exception as e:
            logger.error(f"保存任务文件失败: {str(e)}")
            # 继续导出操作，不中断用户流程

    @Slot()
    def _load_history(self) -> None:
        """加载历史抽奖任务"""
        task_name, ok = QInputDialog.getText(
            self, "加载历史任务", "请输入要加载的任务名称:"
        )
        
        if not ok or not task_name:
            return
        
        tasks = app_settings.get('task_records', [])
        
        if not tasks:
            QMessageBox.information(self, "无历史名单", "当前没有历史名单记录。")
            return
    
    # 创建对话框
        history_dialog = QDialog(self)
        history_dialog.setWindowTitle("历史名单")
        history_dialog.setMinimumSize(600, 400)
        
        # 布局
        layout = QVBoxLayout(history_dialog)
        
        # 创建分割器
        splitter = QSplitter(Qt.Horizontal)
        
        # 左侧任务列表
        task_list_widget = QWidget()
        task_list_layout = QVBoxLayout(task_list_widget)
        
        task_list_label = QLabel("任务列表")
        task_list_label.setStyleSheet("font-weight: bold; font-size: 14px;")
        task_list_layout.addWidget(task_list_label)
        
        task_list = QListWidget()
        for task in tasks:
            task_list.addItem(task['name'])
        
        task_list_layout.addWidget(task_list)
        
        # 右侧名单详情
        detail_widget = QWidget()
        detail_layout = QVBoxLayout(detail_widget)
        
        detail_label = QLabel("名单详情")
        detail_label.setStyleSheet("font-weight: bold; font-size: 14px;")
        detail_layout.addWidget(detail_label)
        
        # 创建滚动区域显示详细信息
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_widget = QWidget()
        scroll_layout = QVBoxLayout(scroll_widget)
        scroll_layout.setAlignment(Qt.AlignTop)
        scroll_area.setWidget(scroll_widget)
        detail_layout.addWidget(scroll_area)
        
        # 添加到分割器
        splitter.addWidget(task_list_widget)
        splitter.addWidget(detail_widget)
        splitter.setSizes([200, 400])
        
        layout.addWidget(splitter, 1)  # 1为拉伸因子
        
        # 按钮区域
        button_layout = QHBoxLayout()
        
        export_button = QPushButton("导出选中名单")
        export_button.setEnabled(False)
        
        close_button = QPushButton("关闭")
        
        button_layout.addWidget(export_button)
        button_layout.addStretch(1)
        button_layout.addWidget(close_button)
        
        layout.addLayout(button_layout)
        
        # 列表项选中事件
        def on_task_selected(index):
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                task_time = datetime.fromisoformat(task['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
                
                # 清空当前滚动区域内容
                for i in reversed(range(scroll_layout.count())):
                    widget = scroll_layout.itemAt(i).widget()
                    if widget:
                        widget.deleteLater()
                
                # 添加任务信息
                task_name_label = QLabel(f"任务名称: {task['name']}")
                task_name_label.setStyleSheet("font-weight: bold; font-size: 14px;")
                scroll_layout.addWidget(task_name_label)
                
                scroll_layout.addWidget(QLabel(f"创建时间: {task_time}"))
                scroll_layout.addWidget(QLabel(f"源文件: {task.get('file', '无')}"))
                scroll_layout.addWidget(QLabel(f"总人数: {task.get('total_count', 0)}"))
                
                # 显示名单
                scroll_layout.addWidget(QLabel("名单成员:"))
                
                if 'candidates' in task and task['candidates']:
                    names_text = '\n'.join([f"- {name if isinstance(name, str) else name.get('name', '')}" 
                                        for name in task['candidates'][:100]])
                    names_label = QLabel(names_text)
                    names_label.setWordWrap(True)
                    scroll_layout.addWidget(names_label)
                    
                    if len(task['candidates']) > 100:
                        scroll_layout.addWidget(QLabel(f"... 显示前100项，共{len(task['candidates'])}项"))
                else:
                    scroll_layout.addWidget(QLabel("没有保存名单成员"))
                
                # 如果有抽奖结果，也显示出来
                if 'results' in task and task['results']:
                    scroll_layout.addWidget(QLabel(f"抽奖结果 ({len(task['results'])}):"))
                    results_text = '\n'.join([f"- {result}" for result in task['results'][:50]])
                    results_label = QLabel(results_text)
                    results_label.setWordWrap(True)
                    scroll_layout.addWidget(results_label)
                    
                    if len(task['results']) > 50:
                        scroll_layout.addWidget(QLabel(f"... 显示前50项，共{len(task['results'])}项"))
                
                scroll_layout.addStretch(1)
                export_button.setEnabled('candidates' in task and bool(task['candidates']))
        
        # 导出选中名单
        def export_selected_list():
            index = task_list.currentRow()
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                
                if 'candidates' not in task or not task['candidates']:
                    QMessageBox.information(history_dialog, "无法导出", "选中的任务没有保存名单成员。")
                    return
                
                # 弹出导出格式选择对话框
                self._export_list_with_format(task, "", index)
        
        # 连接信号
        task_list.currentRowChanged.connect(on_task_selected)
        close_button.clicked.connect(history_dialog.accept)
        export_button.clicked.connect(export_selected_list)
        
        # 显示对话框
        history_dialog.exec()
    
    @Slot()
    def _view_tasks(self) -> None:
        """查看所有任务"""
        # 读取任务文件
        tasks_path = Path(app_settings.get('tasks_file', str(self.get_default_db_path())))
        
        if not tasks_path.exists():
            QMessageBox.information(self, "无任务", "当前没有任务记录。")
            return
        
        try:
            with open(tasks_path, 'r', encoding='utf-8') as f:
                tasks = json.load(f)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"无法读取任务文件: {str(e)}")
            return
        
        if not tasks:
            QMessageBox.information(self, "无任务", "当前没有任务记录。")
            return

        # 创建对话框
        task_dialog = QDialog(self)
        task_dialog.setWindowTitle("所有任务")
        task_dialog.setMinimumSize(800, 500)
        
        layout = QVBoxLayout(task_dialog)
        
        # 创建任务列表
        task_list = QListWidget()
        for task in tasks:
            task_time = datetime.fromisoformat(task['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
            encrypted_mark = "🔒 " if task.get('encrypted') else ""
            edit_protected_mark = "✏️🔒 " if task.get('edit_protected') else ""
            task_list.addItem(f"{encrypted_mark}{edit_protected_mark}{task['name']} - {task_time} (结果数: {len(task['results'])})")
        
        # 创建详情显示区
        details_frame = QFrame()
        details_frame.setFrameShape(QFrame.StyledPanel)
        details_layout = QVBoxLayout(details_frame)
        
        # 添加滚动区域
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_widget = QWidget()
        scroll_layout = QVBoxLayout(scroll_widget)
        
        task_info_label = QLabel("选择任务查看详情")
        task_info_label.setAlignment(Qt.AlignCenter)
        scroll_layout.addWidget(task_info_label)
        
        scroll_area.setWidget(scroll_widget)
        details_layout.addWidget(scroll_area)
        
        # 创建按钮
        button_layout = QHBoxLayout()
        close_button = QPushButton("关闭")
        export_button = QPushButton("导出选中任务")
        export_button.setEnabled(False)
        edit_task_button = QPushButton("✏️ 编辑名单")
        edit_task_button.setEnabled(False)
        delete_task_button = QPushButton("🗑️ 删除任务")
        delete_task_button.setEnabled(False)
        
        button_layout.addWidget(export_button)
        button_layout.addWidget(edit_task_button)
        button_layout.addWidget(delete_task_button)
        button_layout.addWidget(close_button)
        
        # 布局组织
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(task_list)
        splitter.addWidget(details_frame)
        splitter.setSizes([200, 400])
        
        layout.addWidget(splitter)
        layout.addLayout(button_layout)
        
        # 任务列表项选中事件
        def on_task_selected(index):
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                
                # 如果任务需要密码保护，先验证密码
                if task.get('encrypted'):
                    password, ok = QInputDialog.getText(
                        task_dialog, 
                        "输入密码", 
                        f"任务 '{task['name']}' 已加密，请输入查看密码:",
                        QLineEdit.Password
                    )
                    
                    if not ok or not password:
                        return
                    
                    try:
                        # 验证密码（尝试解密一小部分数据来验证）
                        test_decrypt = self._decrypt_task_data(task, password)
                        # 如果解密成功，继续显示（但仍显示原始数据，不替换）
                    except Exception as e:
                        QMessageBox.warning(task_dialog, "密码错误", "密码不正确或数据损坏")
                        return
                
                task_time = datetime.fromisoformat(task['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
                
                # 清空当前滚动区域内容
                for i in reversed(range(scroll_layout.count())):
                    widget = scroll_layout.itemAt(i).widget()
                    if widget:
                        widget.deleteLater()
                
                # 添加任务信息
                task_name_label = QLabel(f"任务名称: {task['name']}")
                task_name_label.setStyleSheet("font-weight: bold; font-size: 14px;")
                scroll_layout.addWidget(task_name_label)
                
                scroll_layout.addWidget(QLabel(f"创建时间: {task_time}"))
                scroll_layout.addWidget(QLabel(f"源文件: {task.get('file', '无') or '无'}"))
                scroll_layout.addWidget(QLabel(f"总人数: {task.get('total_count', len(task.get('results', [])))}"))
                
                # 显示名单成员
                if 'candidates' in task and task['candidates']:
                    scroll_layout.addWidget(QLabel("名单成员:"))
                    
                    # 显示名单列表（只读）
                    candidates_text = '\n'.join([f"{i+1}. {name}" for i, name in enumerate(task['candidates']) if isinstance(name, str) or str(name)])
                    candidates_label = QLabel(candidates_text)
                    candidates_label.setWordWrap(True)
                    candidates_label.setStyleSheet("padding: 10px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;")
                    candidates_label.setMaximumHeight(200)
                    candidates_label.setAlignment(Qt.AlignTop)
                    scroll_layout.addWidget(candidates_label)
                    
                    # 编辑名单按钮
                    edit_button = QPushButton("✏️ 编辑名单")
                    edit_button.setToolTip("点击编辑这个任务的名单成员")
                    edit_button.clicked.connect(lambda: show_edit_dialog(index))
                    scroll_layout.addWidget(edit_button)
                else:
                    scroll_layout.addWidget(QLabel("没有保存名单成员"))
                
                # 显示结果
                scroll_layout.addWidget(QLabel(f"抽奖结果 ({len(task.get('results', []))}):"))
                
                if task.get('results'):
                    results_text = '\n'.join(f"- {result}" for result in task['results'])
                    results_label = QLabel(results_text)
                    results_label.setWordWrap(True)
                    scroll_layout.addWidget(results_label)
                else:
                    scroll_layout.addWidget(QLabel("无抽奖结果"))
                
                scroll_layout.addStretch(1)
                export_button.setEnabled(True)
                edit_task_button.setEnabled(True)
                delete_task_button.setEnabled(True)
        
        # 编辑任务功能
        def edit_selected_task():
            index = task_list.currentRow()
            if index >= 0 and index < len(tasks):
                show_edit_dialog(index)
        
        # 删除任务功能
        def delete_selected_task():
            index = task_list.currentRow()
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                reply = QMessageBox.question(
                    task_dialog,
                    "确认删除",
                    f"确定要删除任务 '{task['name']}' 吗？\n\n此操作不可恢复！",
                    QMessageBox.Yes | QMessageBox.No,
                    QMessageBox.No
                )
                
                if reply == QMessageBox.Yes:
                    try:
                        # 删除任务
                        del tasks[index]
                        
                        # 保存到文件
                        with open(tasks_path, 'w', encoding='utf-8') as f:
                            json.dump(tasks, f, ensure_ascii=False, indent=2)
                        
                        # 刷新任务列表
                        task_list.clear()
                        for i, task in enumerate(tasks):
                            task_time = datetime.fromisoformat(task['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
                            encrypted_mark = "🔒 " if task.get('encrypted') else ""
                            edit_protected_mark = "✏️🔒 " if task.get('edit_protected') else ""
                            task_list.addItem(f"{encrypted_mark}{edit_protected_mark}{task['name']} - {task_time} (结果数: {len(task['results'])})")
                        
                        # 清空详情显示
                        for i in reversed(range(scroll_layout.count())):
                            widget = scroll_layout.itemAt(i).widget()
                            if widget:
                                widget.deleteLater()
                        
                        # 禁用按钮
                        export_button.setEnabled(False)
                        edit_task_button.setEnabled(False)
                        delete_task_button.setEnabled(False)
                        
                        QMessageBox.information(task_dialog, "删除成功", "任务已成功删除")
                        logger.info(f"已删除任务: {task['name']}")
                        
                    except Exception as e:
                        QMessageBox.critical(task_dialog, "删除失败", f"无法删除任务: {str(e)}")
                        logger.error(f"删除任务失败: {str(e)}")
        
        # 显示编辑对话框
        def show_edit_dialog(task_index):
            if task_index >= 0 and task_index < len(tasks):
                task = tasks[task_index]
                
                # 如果任务是加密的或设置了编辑密码，先验证密码
                edit_password = None
                if task.get('encrypted') or task.get('edit_protected'):
                    # 获取验证密码提示
                    if task.get('edit_protected'):
                        password_prompt = f"任务 '{task['name']}' 已设置编辑保护，请输入编辑密码:"
                    else:
                        password_prompt = f"任务 '{task['name']}' 已加密，请输入密码:"
                    
                    password, ok = QInputDialog.getText(
                        task_dialog, 
                        "输入密码", 
                        password_prompt,
                        QLineEdit.Password
                    )
                    
                    if not ok or not password:
                        return
                    
                    # 验证密码
                    if task.get('edit_protected'):
                        # 验证编辑密码
                        if password != task.get('edit_password', ''):
                            QMessageBox.warning(task_dialog, "密码错误", "编辑密码不正确")
                            return
                    elif task.get('encrypted'):
                        # 验证加密密码
                        try:
                            test_decrypt = self._decrypt_task_data(task, password)
                            edit_password = password
                        except Exception as e:
                            QMessageBox.warning(task_dialog, "密码错误", "密码不正确或数据损坏")
                            return
                
                # 创建编辑对话框
                edit_dialog = QDialog(task_dialog)
                edit_dialog.setWindowTitle(f"编辑任务名单 - {task['name']}")
                edit_dialog.setMinimumSize(500, 400)
                
                edit_layout = QVBoxLayout(edit_dialog)
                
                # 说明标签
                info_label = QLabel("编辑抽奖结果（每行一个结果）:")
                info_label.setStyleSheet("font-weight: bold;")
                edit_layout.addWidget(info_label)
                
                # 可编辑的文本框 - 编辑抽奖结果
                results_edit = QTextEdit()
                results = task.get('results', [])
                if not results:
                    results_text = ""
                else:
                    results_text = '\n'.join([name if isinstance(name, str) else str(name) for name in results])
                results_edit.setPlainText(results_text)
                results_edit.setToolTip("每行输入一个抽奖结果")
                edit_layout.addWidget(results_edit)
                
                # 按钮区域
                button_layout = QHBoxLayout()
                cancel_button = QPushButton("取消")
                save_button = QPushButton("保存")
                save_button.setDefault(True)
                
                button_layout.addStretch()
                button_layout.addWidget(cancel_button)
                button_layout.addWidget(save_button)
                edit_layout.addLayout(button_layout)
                
                # 绑定事件
                cancel_button.clicked.connect(edit_dialog.reject)
                save_button.clicked.connect(lambda: save_and_close(results_edit.toPlainText()))
                
                def save_and_close(new_results_text):
                    # 解析新的抽奖结果列表
                    new_results = [line.strip() for line in new_results_text.split('\n') if line.strip()]
                    
                    if not new_results:
                        QMessageBox.warning(edit_dialog, "警告", "抽奖结果不能为空！")
                        return
                    
                    # 更新任务数据 - 更新抽奖结果
                    tasks[task_index]['results'] = new_results
                    
                    # 如果任务是加密的，需要重新加密存储
                    if task.get('encrypted') and edit_password:
                        try:
                            # 重新加密更新后的任务数据
                            encrypted_data = self._encrypt_task_data(tasks[task_index], edit_password)
                            tasks[task_index].update(encrypted_data)
                        except Exception as e:
                            QMessageBox.critical(edit_dialog, "加密失败", f"无法重新加密任务数据: {str(e)}")
                            return
                    
                    # 保存到文件
                    try:
                        with open(tasks_path, 'w', encoding='utf-8') as f:
                            json.dump(tasks, f, ensure_ascii=False, indent=2)
                        
                        QMessageBox.information(edit_dialog, "保存成功", f"抽奖结果已更新，共 {len(new_results)} 个结果")
                        logger.info(f"已更新任务 '{tasks[task_index]['name']}' 的抽奖结果")
                        
                        # 关闭编辑对话框
                        edit_dialog.accept()
                        
                        # 刷新主显示
                        on_task_selected(task_index)
                        
                    except Exception as e:
                        QMessageBox.critical(edit_dialog, "保存失败", f"无法保存抽奖结果: {str(e)}")
                        logger.error(f"保存任务抽奖结果失败: {str(e)}")
                
                # 显示编辑对话框
                edit_dialog.exec()
        
        # 导出选中任务
        def export_selected_task():
            index = task_list.currentRow()
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                self._export_list_with_format(task, task['name'], index)
        
        # 连接信号
        task_list.currentRowChanged.connect(on_task_selected)
        close_button.clicked.connect(task_dialog.accept)
        export_button.clicked.connect(export_selected_task)
        edit_task_button.clicked.connect(edit_selected_task)
        delete_task_button.clicked.connect(delete_selected_task)
        
        # 显示对话框
        task_dialog.exec()
    
    @Slot()
    def _view_history_lists(self) -> None:
        """查看历史名单"""
        # 读取任务文件
        tasks_path = Path(app_settings.get('tasks_file', str(self.get_default_db_path())))
        
        if not tasks_path.exists():
            QMessageBox.information(self, "无历史名单", "当前没有历史名单记录。")
            return
        
        try:
            with open(tasks_path, 'r', encoding='utf-8') as f:
                tasks = json.load(f)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"无法读取任务文件: {str(e)}")
            return
        
        if not tasks:
            QMessageBox.information(self, "无历史名单", "当前没有历史名单记录。")
            return
        
        # 创建对话框
        history_dialog = QDialog(self)
        history_dialog.setWindowTitle("历史名单")
        history_dialog.setMinimumSize(600, 400)
        
        # 布局
        layout = QVBoxLayout(history_dialog)
        
        # 创建分割器
        splitter = QSplitter(Qt.Horizontal)
        
        # 左侧任务列表
        task_list_widget = QWidget()
        task_list_layout = QVBoxLayout(task_list_widget)
        
        task_list_label = QLabel("任务列表")
        task_list_label.setStyleSheet("font-weight: bold; font-size: 14px;")
        task_list_layout.addWidget(task_list_label)
        
        task_list = QListWidget()
        for task in tasks:
            task_list.addItem(task['name'])
        
        task_list_layout.addWidget(task_list)
        
        # 右侧名单详情
        detail_widget = QWidget()
        detail_layout = QVBoxLayout(detail_widget)
        
        detail_label = QLabel("名单详情")
        detail_label.setStyleSheet("font-weight: bold; font-size: 14px;")
        detail_layout.addWidget(detail_label)
        
        # 创建滚动区域显示详细信息
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_widget = QWidget()
        scroll_layout = QVBoxLayout(scroll_widget)
        scroll_layout.setAlignment(Qt.AlignTop)
        scroll_area.setWidget(scroll_widget)
        detail_layout.addWidget(scroll_area)
        
        # 添加到分割器
        splitter.addWidget(task_list_widget)
        splitter.addWidget(detail_widget)
        splitter.setSizes([200, 400])
        
        layout.addWidget(splitter, 1)  # 1为拉伸因子
        
        # 按钮区域
        button_layout = QHBoxLayout()
        
        export_button = QPushButton("导出选中名单")
        export_button.setEnabled(False)
        
        close_button = QPushButton("关闭")
        
        button_layout.addWidget(export_button)
        button_layout.addStretch(1)
        button_layout.addWidget(close_button)
        
        layout.addLayout(button_layout)
        
        # 列表项选中事件
        def on_task_selected(index):
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                task_time = datetime.fromisoformat(task['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
                
                # 清空当前滚动区域内容
                for i in reversed(range(scroll_layout.count())):
                    widget = scroll_layout.itemAt(i).widget()
                    if widget:
                        widget.deleteLater()
                
                # 添加任务信息
                task_name_label = QLabel(f"任务名称: {task['name']}")
                task_name_label.setStyleSheet("font-weight: bold; font-size: 14px;")
                scroll_layout.addWidget(task_name_label)
                
                scroll_layout.addWidget(QLabel(f"创建时间: {task_time}"))
                scroll_layout.addWidget(QLabel(f"源文件: {task['file'] or '无'}"))
                scroll_layout.addWidget(QLabel(f"总人数: {task['total_count']}"))
                
                # 显示名单
                scroll_layout.addWidget(QLabel("名单成员:"))
                
                if 'candidates' in task and task['candidates']:
                    names_text = '\n'.join([f"- {name}" for name in task['candidates']])
                    names_label = QLabel(names_text)
                    names_label.setWordWrap(True)
                    scroll_layout.addWidget(names_label)
                else:
                    scroll_layout.addWidget(QLabel("没有保存名单成员"))
                
                # 如果有抽奖结果，也显示出来
                if 'results' in task and task['results']:
                    scroll_layout.addWidget(QLabel(f"抽奖结果 ({len(task['results'])}):"))
                    results_text = '\n'.join([f"- {result}" for result in task['results']])
                    results_label = QLabel(results_text)
                    results_label.setWordWrap(True)
                    scroll_layout.addWidget(results_label)
                
                scroll_layout.addStretch(1)
                export_button.setEnabled(True)
        
        # 导出选中名单
        def export_selected_list():
            index = task_list.currentRow()
            if index >= 0 and index < len(tasks):
                task = tasks[index]
                
                if 'candidates' not in task or not task['candidates']:
                    QMessageBox.information(history_dialog, "无法导出", "选中的任务没有保存名单成员。")
                    return
                
                # 弹出导出格式选择对话框
                self._export_list_with_format(task, "", index)
        
        # 连接信号
        task_list.currentRowChanged.connect(on_task_selected)
        close_button.clicked.connect(history_dialog.accept)
        export_button.clicked.connect(export_selected_list)
        
        # 显示对话框
        history_dialog.exec()
    
    @Slot()
    def _export_list_with_format(self, task: Dict, default_name: str = "", task_index: int = -1) -> None:
        """导出名单到文件
        
        Args:
            task: 任务数据
            default_name: 默认文件名
            task_index: 任务在列表中的索引（用于更新密码）
        """
        # 直接获取任务的基本信息用于导出
        # 不管是否加密，candidates和results字段应该是明文存储的名单列表
        candidates = task.get('candidates', [])
        results = task.get('results', [])
        
        # 如果任务是加密的且需要验证密码，这里只是验证权限，不解密数据
        if task.get('encrypted'):
            password, ok = QInputDialog.getText(
                self, 
                "输入密码", 
                f"任务 '{task['name']}' 已加密，请输入密码以导出名单:",
                QLineEdit.Password
            )
            
            if not ok or not password:
                return
            
            try:
                # 只验证密码是否正确，不需要解密
                self._decrypt_task_data(task, password)
            except Exception as e:
                QMessageBox.warning(self, "密码错误", "密码不正确")
                return
        
        if not candidates and not results:
            QMessageBox.information(self, "无法导出", "选中的任务没有保存名单成员或抽奖结果。")
            return
        
        # 如果没有candidates但有results，可以导出results
        if not candidates and results:
            candidates = results  # 使用抽奖结果作为导出内容
            
        # 创建导出配置对话框
        export_dialog = QDialog(self)
        export_dialog.setWindowTitle("导出名单配置")
        export_dialog.setMinimumWidth(500)
        
        dialog_layout = QVBoxLayout(export_dialog)
        
        # 文件名输入
        name_layout = QHBoxLayout()
        name_label = QLabel("文件名:")
        name_edit = QLineEdit()
        name_edit.setText(default_name or f"{task.get('name', '名单')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        name_layout.addWidget(name_label)
        name_layout.addWidget(name_edit)
        dialog_layout.addLayout(name_layout)
        
        # 导出格式选择
        format_layout = QHBoxLayout()
        format_label = QLabel("导出格式:")
        format_combo = QComboBox()
        format_combo.addItem("CSV 文件 (*.csv)", ".csv")
        format_combo.addItem("文本文件 (*.txt)", ".txt")
        format_combo.addItem("JSON 文件 (*.json)", ".json")
        format_layout.addWidget(format_label)
        format_layout.addWidget(format_combo)
        dialog_layout.addLayout(format_layout)
        
        # 编辑密码设置
        password_group = QGroupBox("编辑保护")
        password_layout = QVBoxLayout(password_group)
        
        password_check = QCheckBox("设置编辑密码")
        password_check.setToolTip("启用后，编辑此名单时需要输入密码")
        password_layout.addWidget(password_check)
        
        password_input_layout = QHBoxLayout()
        password_label = QLabel("编辑密码:")
        password_edit = QLineEdit()
        password_edit.setPlaceholderText("输入编辑密码")
        password_edit.setEchoMode(QLineEdit.Password)
        password_edit.setEnabled(False)
        password_input_layout.addWidget(password_label)
        password_input_layout.addWidget(password_edit)
        password_layout.addLayout(password_input_layout)
        
        def on_password_toggled(checked):
            password_edit.setEnabled(checked)
            if not checked:
                password_edit.clear()
        
        password_check.toggled.connect(on_password_toggled)
        dialog_layout.addWidget(password_group)
        
        # 结果预览
        preview_group = QGroupBox("名单预览")
        preview_layout = QVBoxLayout(preview_group)
        
        results_list = QListWidget()
        preview_candidates = task.get('candidates', [])
        for candidate in preview_candidates[:50]:  # 最多显示50个
            candidate_name = candidate if isinstance(candidate, str) else str(candidate)
            results_list.addItem(candidate_name)
        preview_layout.addWidget(results_list)
        
        count_label = QLabel(f"共 {len(preview_candidates)} 个成员" + (f"（显示前50个）" if len(preview_candidates) > 50 else ""))
        count_label.setAlignment(Qt.AlignRight)
        preview_layout.addWidget(count_label)
        
        dialog_layout.addWidget(preview_group)
        
        # 按钮区域
        buttons_layout = QHBoxLayout()
        cancel_button = QPushButton("取消")
        export_button = QPushButton("导出")
        export_button.setDefault(True)
        
        buttons_layout.addStretch()
        buttons_layout.addWidget(cancel_button)
        buttons_layout.addWidget(export_button)
        dialog_layout.addLayout(buttons_layout)
        
        # 绑定事件
        cancel_button.clicked.connect(export_dialog.reject)
        export_button.clicked.connect(export_dialog.accept)
        
        # 显示对话框
        if export_dialog.exec_() != QDialog.Accepted:
            return
        
        # 获取用户输入
        file_name = name_edit.text().strip()
        if not file_name:
            QMessageBox.warning(self, "输入错误", "文件名不能为空")
            return
        
        selected_format = format_combo.currentData()
        use_edit_password = password_check.isChecked()
        edit_password = password_edit.text().strip()
        
        # 验证编辑密码
        if use_edit_password and not edit_password:
            QMessageBox.warning(self, "密码错误", "启用编辑保护时必须输入密码")
            return
        
        # 构建文件名
        file_name = file_name.replace(":", "-").replace(" ", "_")  # 替换非法字符
        if not file_name.endswith(selected_format):
            file_name += selected_format
        
        # 选择保存路径
        default_dir = app_settings.get('last_file_directory', str(Path.home()))
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "保存文件",
            str(Path(default_dir) / file_name),
            f"文件 (*{selected_format});;所有文件 (*.*)"
        )
        
        if not file_path:
            return
        
        try:
            # 保存当前目录
            app_settings.set('last_file_directory', str(Path(file_path).parent))
            
            # 准备要导出的数据 - 直接使用任务中的明文数据
            final_candidates = candidates if candidates else results
            
            # 转换为字符串列表
            candidates_list = []
            for candidate in final_candidates:
                if isinstance(candidate, str):
                    candidates_list.append(candidate)
                elif isinstance(candidate, dict) and 'name' in candidate:
                    candidates_list.append(candidate['name'])
                else:
                    candidates_list.append(str(candidate))
            
            if not candidates_list:
                QMessageBox.warning(self, "无法导出", "任务中没有找到有效的名单数据")
                return
            
            # 根据文件类型生成内容
            content = ""
            if selected_format == '.csv':
                import csv
                import io
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(['序号', '姓名'])
                for i, name in enumerate(candidates_list, 1):
                    writer.writerow([i, name])
                content = output.getvalue()
            elif selected_format == '.txt':
                content = f"名单文件\n"
                content += f"任务名称: {task.get('name', '未知')}\n"
                content += f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                content += f"总人数: {len(candidates_list)}\n\n"
                content += "名单列表:\n"
                for i, name in enumerate(candidates_list, 1):
                    content += f"{i}. {name}\n"
            elif selected_format == '.json':
                import json
                export_data = {
                    "task_name": task.get('name', '未知'),
                    "export_time": datetime.now().isoformat(),
                    "total_count": len(candidates_list),
                    "candidates": candidates_list
                }
                content = json.dumps(export_data, ensure_ascii=False, indent=2)
            
            # 始终保存明文内容
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            status_msg = f"已导出 {len(candidates_list)} 个名单成员到 {file_path}"
            
            self.statusBar().showMessage(status_msg, 3000)
            logger.info(status_msg)
            
            # 如果设置了编辑密码且提供了任务索引，更新数据库
            if use_edit_password and task_index >= 0:
                try:
                    # 读取任务文件
                    tasks_path = Path(app_settings.get('tasks_file', str(self.get_default_db_path())))
                    if tasks_path.exists():
                        with open(tasks_path, 'r', encoding='utf-8') as f:
                            all_tasks = json.load(f)
                        
                        # 更新任务的编辑密码
                        if task_index < len(all_tasks):
                            all_tasks[task_index]['edit_password'] = edit_password
                            all_tasks[task_index]['edit_protected'] = True
                            
                            # 保存更新后的任务文件
                            with open(tasks_path, 'w', encoding='utf-8') as f:
                                json.dump(all_tasks, f, ensure_ascii=False, indent=2)
                            
                            logger.info(f"已为任务 '{task['name']}' 设置编辑密码")
                            QMessageBox.information(self, "设置成功", "已成功设置编辑密码，下次编辑名单时需要输入密码。")
                except Exception as e:
                    logger.error(f"更新编辑密码失败: {str(e)}")
                    QMessageBox.warning(self, "警告", f"导出成功，但设置编辑密码失败: {str(e)}")
            
        except Exception as e:
            QMessageBox.critical(self, "导出失败", f"无法导出名单: {str(e)}")
            logger.error(f"导出名单失败: {str(e)}")
    
    def _encrypt_text_content(self, content: str, password: str) -> str:
        """加密文本内容
        
        Args:
            content: 要加密的文本内容
            password: 加密密码
            
        Returns:
            加密后的文本
        """
        import hashlib
        import base64
        import json
        
        # 创建密钥
        key = hashlib.sha256(password.encode()).digest()
        
        # 简单的XOR加密
        encrypted_bytes = []
        content_bytes = content.encode('utf-8')
        for i, byte_val in enumerate(content_bytes):
            # 确保XOR结果在0-255范围内
            encrypted_byte = byte_val ^ key[i % len(key)]
            encrypted_bytes.append(encrypted_byte)
        
        # 编码为base64
        encrypted_data = base64.b64encode(bytes(encrypted_bytes)).decode('utf-8')
        
        # 创建加密文件结构
        encrypted_file = {
            "encrypted": True,
            "data": encrypted_data,
            "hash": hashlib.sha256(content.encode()).hexdigest(),
            "timestamp": datetime.now().isoformat()
        }
        
        return json.dumps(encrypted_file, ensure_ascii=False, indent=2)
    
    @Slot()
    def _show_about(self) -> None:
        """显示关于对话框"""
        from PySide6.QtGui import QDesktopServices
        from PySide6.QtCore import QUrl
        
        # 创建自定义关于对话框
        about_dialog = QDialog(self)
        about_dialog.setWindowTitle(f"关于 {APP_NAME}")
        about_dialog.setFixedSize(500, 400)
        
        # 根据当前主题设置样式
        theme_mode = app_settings.get_theme_mode() or 'dark'
        custom_colors = app_settings.get('theme_colors', {})
        current_theme = get_theme(theme_mode, custom_colors)
        
        if theme_mode == 'dark':
            about_dialog.setStyleSheet(f"""
                QDialog {{
                    background-color: #282c34;
                    border-radius: 10px;
                }}
                QLabel {{
                    color: #abb2bf;
                }}
                QPushButton {{
                    background-color: #98c379;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: bold;
                }}
                QPushButton:hover {{
                    background-color: #a9d489;
                }}
                QPushButton#github_btn {{
                    background-color: #61afef;
                }}
                QPushButton#github_btn:hover {{
                    background-color: #70b8ff;
                }}
                QFrame {{
                    color: #3b4048;
                }}
            """)
        else:
            about_dialog.setStyleSheet(f"""
                QDialog {{
                    background-color: #f5f5f5;
                    border-radius: 10px;
                }}
                QLabel {{
                    color: #383a42;
                }}
                QPushButton {{
                    background-color: #50a14f;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: bold;
                }}
                QPushButton:hover {{
                    background-color: #5bb85c;
                }}
                QPushButton#github_btn {{
                    background-color: #4078f2;
                }}
                QPushButton#github_btn:hover {{
                    background-color: #6291f4;
                }}
                QFrame {{
                    color: #e1e1e1;
                }}
            """)
        
        layout = QVBoxLayout(about_dialog)
        layout.setSpacing(20)
        layout.setContentsMargins(30, 30, 30, 30)
        
        # 应用图标和标题
        title_layout = QHBoxLayout()
        
        # 应用名称和版本
        title_label = QLabel(f"{APP_NAME}")
        title_label.setStyleSheet("font-size: 24px; font-weight: bold; color: #2196F3;")
        title_label.setAlignment(Qt.AlignCenter)
        
        version_label = QLabel(f"版本 {APP_VERSION}")
        version_label.setStyleSheet("font-size: 14px; color: #666;")
        version_label.setAlignment(Qt.AlignCenter)
        
        layout.addWidget(title_label)
        layout.addWidget(version_label)
        
        # 分隔线
        line = QFrame()
        line.setFrameShape(QFrame.HLine)
        line.setStyleSheet("color: #ddd;")
        layout.addWidget(line)
        
        # 作者信息
        author_label = QLabel(f"作者: {APP_AUTHOR}")
        author_label.setStyleSheet("font-size: 14px; font-weight: bold;")
        author_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(author_label)
        
        # 描述
        desc_label = QLabel(
            "一个基于 Python 和 PySide6 开发的随机抽奖程序\n\n"
            "主要功能:\n"
            "• 支持多种格式名单导入（CSV、TXT、JSON等）\n"
            "• 权重抽奖和等概率抽奖\n"
            "• 小组管理和历史记录\n"
            "• 任务加密和数据保护\n"
            "• 结果导出和历史查看\n"
            "• 多主题界面和自定义颜色"
        )
        desc_label.setStyleSheet("font-size: 12px; color: #555; line-height: 1.4;")
        desc_label.setWordWrap(True)
        desc_label.setAlignment(Qt.AlignLeft)
        layout.addWidget(desc_label)
        
        # 添加弹性空间
        layout.addStretch()
        
        # 按钮区域
        button_layout = QHBoxLayout()
        
        # GitHub链接按钮
        github_btn = QPushButton("🌟 访问 GitHub")
        github_btn.setObjectName("github_btn")
        github_btn.setToolTip("点击访问项目的GitHub页面")
        github_btn.clicked.connect(lambda: QDesktopServices.openUrl(QUrl("https://github.com/vistaminc/randompeople")))
        
        # 关闭按钮
        close_btn = QPushButton("关闭")
        close_btn.clicked.connect(about_dialog.accept)
        
        button_layout.addWidget(github_btn)
        button_layout.addStretch()
        button_layout.addWidget(close_btn)
        
        layout.addLayout(button_layout)
        
        # 显示对话框
        about_dialog.exec()
        
    # _clear_all_logs方法已移至设置对话框中
    
    def closeEvent(self, event) -> None:
        """
        窗口关闭事件处理
        
        Args:
            event: 关闭事件
        """
        # 如果正在抽奖，停止抽奖
        if self._is_drawing:
            self._stop_draw()
        
        # 保存当前设置
        if hasattr(self, 'draw_count_spin'):
            draw_count = self.draw_count_spin.value()
            app_settings.set('draw_count', draw_count)
        
        # 保存应用设置
        app_settings._save_config()
        
        # 继续关闭
        super().closeEvent(event)

