"""
设置对话框模块，提供应用程序设置界面。
"""
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from PySide6.QtCore import QSize, Qt, Signal, Slot
from PySide6.QtGui import QIcon, QColor
from PySide6.QtWidgets import (QCheckBox, QComboBox, QDialog, QFileDialog,
                               QFormLayout, QGridLayout, QGroupBox, QHBoxLayout,
                               QLabel, QLineEdit, QListWidget, QListWidgetItem, QPushButton, QScrollArea,
                               QSpinBox, QSlider, QTabWidget, QVBoxLayout, QWidget,
                               QMessageBox, QColorDialog, QFrame)

from src.config.constants import DrawMode, FileType
from src.config.settings import app_settings
from src.utils.validator import is_valid_url
from src.ui.styles.themes import THEMES, get_theme, PyOneDarkPalette, PyOneLightPalette

logger = logging.getLogger(__name__)

class SettingsDialog(QDialog):
    """
    应用程序设置对话框，包含文件设置、抽奖设置、界面设置和自定义参数功能。
    """

    # 定义信号
    settings_saved = Signal()  # 设置保存信号

    def __init__(self, parent: Optional[QWidget] = None) -> None:
        """
        初始化设置对话框

        Args:
            parent: 父窗口
        """
        super().__init__(parent)

        # 设置窗口属性
        self.setWindowTitle("应用设置")
        self.setMinimumSize(600, 700)
        self.setModal(True)

        # 创建UI组件
        self._create_ui()

        # 加载设置
        self._load_settings()

    def _create_ui(self) -> None:
        """创建UI组件"""
        # 主布局
        main_layout = QVBoxLayout(self)

        # 创建选项卡
        tab_widget = QTabWidget()

        # 创建各选项卡内容
        file_tab = self._create_file_tab()
        draw_tab = self._create_draw_tab()
        ui_tab = self._create_ui_tab()
        custom_tab = self._create_custom_tab()
        security_tab = self._create_security_tab()

        # 添加选项卡
        tab_widget.addTab(file_tab, "文件设置")
        tab_widget.addTab(draw_tab, "抽奖设置")
        tab_widget.addTab(ui_tab, "界面设置")
        tab_widget.addTab(custom_tab, "自定义参数")
        tab_widget.addTab(security_tab, "安全设置")

        main_layout.addWidget(tab_widget)

        # 创建按钮布局
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        # 保存按钮
        self.save_button = QPushButton("保存")
        theme = get_theme(app_settings.get_theme_mode())
        self.save_button.setStyleSheet(theme.SUCCESS_BUTTON)
        self.save_button.clicked.connect(self._save_settings)
        button_layout.addWidget(self.save_button)

        # 取消按钮
        self.cancel_button = QPushButton("取消")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)

        main_layout.addLayout(button_layout)

    def _create_file_tab(self) -> QWidget:
        """
        创建文件设置选项卡

        Returns:
            文件设置选项卡部件
        """
        file_widget = QWidget()
        file_layout = QVBoxLayout(file_widget)
        
        # 当前文件组
        current_group = QGroupBox("当前文件")
        current_layout = QVBoxLayout(current_group)
        
        # 当前文件选择
        file_selection_layout = QHBoxLayout()
        self.current_file_edit = QLineEdit()
        self.current_file_edit.setReadOnly(True)
        self.current_file_edit.setPlaceholderText("没有选择文件")
        file_selection_layout.addWidget(self.current_file_edit)
        
        self.browse_button = QPushButton("浏览...")
        self.browse_button.clicked.connect(self._select_name_file)
        file_selection_layout.addWidget(self.browse_button)
        
        current_layout.addLayout(file_selection_layout)
        
        file_layout.addWidget(current_group)
        
        # 历史文件组
        history_group = QGroupBox("历史文件")
        history_layout = QVBoxLayout(history_group)
        
        # 本地文件列表
        local_files_layout = QHBoxLayout()
        self.local_file_list = QComboBox()
        self.local_file_list.setMinimumWidth(300)
        local_files_layout.addWidget(self.local_file_list)
        
        load_file_button = QPushButton("加载")
        load_file_button.clicked.connect(self._load_selected_file)
        local_files_layout.addWidget(load_file_button)
        
        remove_file_button = QPushButton("移除")
        remove_file_button.clicked.connect(self._remove_local_file)
        local_files_layout.addWidget(remove_file_button)
        
        history_layout.addLayout(local_files_layout)
        
        # 添加文件按钮
        add_file_layout = QHBoxLayout()
        add_file_button = QPushButton("添加本地文件")
        add_file_button.clicked.connect(self._add_local_file)
        add_file_layout.addWidget(add_file_button)
        add_file_layout.addStretch()
        
        history_layout.addLayout(add_file_layout)
        
        file_layout.addWidget(history_group)
        
        # 远程URL组
        remote_group = QGroupBox("远程URL")
        remote_layout = QVBoxLayout(remote_group)
        
        # 远程URL列表
        remote_urls_layout = QHBoxLayout()
        self.remote_url_list = QComboBox()
        self.remote_url_list.setMinimumWidth(300)
        remote_urls_layout.addWidget(self.remote_url_list)
        
        load_url_button = QPushButton("加载")
        load_url_button.clicked.connect(self._load_selected_url)
        remote_urls_layout.addWidget(load_url_button)
        
        remove_url_button = QPushButton("移除")
        remove_url_button.clicked.connect(self._remove_remote_url)
        remote_urls_layout.addWidget(remove_url_button)
        
        remote_layout.addLayout(remote_urls_layout)
        
        # 输入新URL
        url_input_layout = QHBoxLayout()
        self.remote_url_input = QLineEdit()
        self.remote_url_input.setPlaceholderText("输入URL地址")
        url_input_layout.addWidget(self.remote_url_input)
        
        add_url_button = QPushButton("加载URL")
        add_url_button.clicked.connect(self._load_remote_url)
        url_input_layout.addWidget(add_url_button)
        
        remote_layout.addLayout(url_input_layout)
        
        file_layout.addWidget(remote_group)
        
        # 小组管理组
        group_group = QGroupBox("小组管理")
        group_layout = QVBoxLayout(group_group)
        
        # 小组列表布局
        group_list_layout = QHBoxLayout()
        
        # 小组列表
        self.group_list = QListWidget()
        self.group_list.setSelectionMode(QListWidget.SingleSelection)
        self.group_list.currentRowChanged.connect(self._on_group_selected)
        group_list_layout.addWidget(self.group_list, 2)
        
        # 小组详情和操作面板
        group_detail_widget = QWidget()
        group_detail_layout = QVBoxLayout(group_detail_widget)
        group_detail_layout.setContentsMargins(0, 0, 0, 0)
        
        # 小组名称
        name_layout = QHBoxLayout()
        name_layout.addWidget(QLabel("小组名称:"))
        self.group_name_edit = QLineEdit()
        name_layout.addWidget(self.group_name_edit)
        group_detail_layout.addLayout(name_layout)
        
        # 小组文件路径
        path_layout = QHBoxLayout()
        path_layout.addWidget(QLabel("名单文件:"))
        self.group_path_edit = QLineEdit()
        self.group_path_edit.setReadOnly(True)
        path_layout.addWidget(self.group_path_edit)
        
        browse_group_button = QPushButton("浏览...")
        browse_group_button.clicked.connect(self._browse_group_file)
        path_layout.addWidget(browse_group_button)
        
        group_detail_layout.addLayout(path_layout)
        
        # URL输入
        url_layout = QHBoxLayout()
        url_layout.addWidget(QLabel("或输入URL:"))
        self.group_url_edit = QLineEdit()
        url_layout.addWidget(self.group_url_edit)
        group_detail_layout.addLayout(url_layout)
        
        # 按钮组
        button_layout = QHBoxLayout()
        self.add_group_button = QPushButton("添加小组")
        self.add_group_button.clicked.connect(self._add_group)
        button_layout.addWidget(self.add_group_button)
        
        self.update_group_btn = QPushButton("更新小组")
        self.update_group_btn.clicked.connect(self._update_group)
        self.update_group_btn.setEnabled(False)
        button_layout.addWidget(self.update_group_btn)
        
        self.delete_group_btn = QPushButton("删除小组")
        self.delete_group_btn.clicked.connect(self._delete_group)
        self.delete_group_btn.setEnabled(False)
        button_layout.addWidget(self.delete_group_btn)
        
        group_detail_layout.addLayout(button_layout)
        
        # 排序按钮
        sort_layout = QHBoxLayout()
        self.move_up_btn = QPushButton("上移")
        self.move_up_btn.clicked.connect(self._move_group_up)
        sort_layout.addWidget(self.move_up_btn)
        
        self.move_down_btn = QPushButton("下移")
        self.move_down_btn.clicked.connect(self._move_group_down)
        sort_layout.addWidget(self.move_down_btn)
        
        sort_name_button = QPushButton("按名称排序")
        sort_name_button.clicked.connect(self._sort_groups_by_name)
        sort_layout.addWidget(sort_name_button)
        
        group_detail_layout.addLayout(sort_layout)
        group_detail_layout.addStretch(1)
        
        group_list_layout.addWidget(group_detail_widget, 3)
        group_layout.addLayout(group_list_layout)
        
        file_layout.addWidget(group_group)
        
        # 添加弹性空间
        file_layout.addStretch(1)
        
        return file_widget
    
    def _create_draw_tab(self) -> QWidget:
        """
        创建抽奖设置选项卡
        
        Returns:
            抽奖设置选项卡部件
        """
        draw_widget = QWidget()
        draw_layout = QVBoxLayout(draw_widget)
        
        # 基本设置组
        basic_group = QGroupBox("基本设置")
        basic_form = QFormLayout(basic_group)
        
        # 抽奖数量
        self.draw_count_spin = QSpinBox()
        self.draw_count_spin.setMinimum(1)
        self.draw_count_spin.setMaximum(100)
        basic_form.addRow("抽奖数量:", self.draw_count_spin)
        
        # 抽奖模式
        self.draw_mode_combo = QComboBox()
        for mode in DrawMode:
            self.draw_mode_combo.addItem(mode.value, mode.name)
        basic_form.addRow("抽奖模式:", self.draw_mode_combo)
        
        # 允许重复抽取
        self.allow_repeat_check = QCheckBox("允许重复抽取同一个人")
        basic_form.addRow("", self.allow_repeat_check)
        
        # 抽奖后重置
        self.reset_after_draw_check = QCheckBox("抽奖后重置")
        basic_form.addRow("", self.reset_after_draw_check)
        
        draw_layout.addWidget(basic_group)
        
        # 动画设置组
        animation_group = QGroupBox("动画设置")
        animation_layout = QVBoxLayout(animation_group)
        
        # 滚动速度设置
        speed_layout = QHBoxLayout()
        speed_label = QLabel("名单滚动速度:")
        speed_layout.addWidget(speed_label)
        
        # 滑动条
        self.speed_slider = QSlider(Qt.Horizontal)
        self.speed_slider.setMinimum(1)
        self.speed_slider.setMaximum(10)
        self.speed_slider.setTickPosition(QSlider.TicksBelow)
        self.speed_slider.setTickInterval(1)
        speed_layout.addWidget(self.speed_slider, 1)
        
        # 数字输入框
        self.speed_spin = QSpinBox()
        self.speed_spin.setMinimum(1)
        self.speed_spin.setMaximum(10)
        self.speed_spin.setSuffix(" 级")
        speed_layout.addWidget(self.speed_spin)
        
        # 连接滑动条和数字输入框的信号
        self.speed_slider.valueChanged.connect(self.speed_spin.setValue)
        self.speed_spin.valueChanged.connect(self.speed_slider.setValue)
        
        animation_layout.addLayout(speed_layout)
        
        # 滚动速度说明
        speed_desc = QLabel("注: 1级为最慢，10级为最快")
        speed_desc.setStyleSheet("font-size: 10px; color: gray;")
        animation_layout.addWidget(speed_desc)
        
        draw_layout.addWidget(animation_group)
        
        # 添加弹性空间
        draw_layout.addStretch(1)
        
        return draw_widget
    
    def _create_ui_tab(self) -> QWidget:
        """
        创建界面设置选项卡
        
        Returns:
            界面设置选项卡部件
        """
        ui_widget = QWidget()
        ui_layout = QVBoxLayout(ui_widget)
        
        # 主题设置组
        theme_group = QGroupBox("主题设置")
        theme_layout = QVBoxLayout(theme_group)
        
        # 基础主题选择
        theme_form = QFormLayout()
        self.theme_combo = QComboBox()
        self.theme_combo.addItem("深色主题", "dark")
        self.theme_combo.addItem("浅色主题", "light")
        theme_form.addRow("界面主题:", self.theme_combo)
        theme_layout.addLayout(theme_form)
        
        # 主题颜色自定义
        theme_colors_group = QGroupBox("颜色自定义")
        theme_colors_layout = QGridLayout(theme_colors_group)
        
        # 主要颜色按钮
        self.primary_color_btn = QPushButton()
        self.primary_color_btn.setMinimumWidth(100)
        self.primary_color_btn.clicked.connect(lambda: self._select_color('primary_color'))
        theme_colors_layout.addWidget(QLabel("主要颜色:"), 0, 0)
        theme_colors_layout.addWidget(self.primary_color_btn, 0, 1)
        
        # 成功颜色按钮
        self.success_color_btn = QPushButton()
        self.success_color_btn.setMinimumWidth(100)
        self.success_color_btn.clicked.connect(lambda: self._select_color('success_color'))
        theme_colors_layout.addWidget(QLabel("成功颜色:"), 0, 2)
        theme_colors_layout.addWidget(self.success_color_btn, 0, 3)
        
        # 警告颜色按钮
        self.warning_color_btn = QPushButton()
        self.warning_color_btn.setMinimumWidth(100)
        self.warning_color_btn.clicked.connect(lambda: self._select_color('warning_color'))
        theme_colors_layout.addWidget(QLabel("警告颜色:"), 1, 0)
        theme_colors_layout.addWidget(self.warning_color_btn, 1, 1)
        
        # 错误颜色按钮
        self.error_color_btn = QPushButton()
        self.error_color_btn.setMinimumWidth(100)
        self.error_color_btn.clicked.connect(lambda: self._select_color('error_color'))
        theme_colors_layout.addWidget(QLabel("错误颜色:"), 1, 2)
        theme_colors_layout.addWidget(self.error_color_btn, 1, 3)
        
        # 名称颜色按钮
        self.name_color_btn = QPushButton()
        self.name_color_btn.setMinimumWidth(100)
        self.name_color_btn.clicked.connect(lambda: self._select_color('name_color'))
        theme_colors_layout.addWidget(QLabel("名称颜色:"), 2, 0)
        theme_colors_layout.addWidget(self.name_color_btn, 2, 1)
        
        # 重置颜色按钮
        self.reset_colors_btn = QPushButton("重置为默认颜色")
        self.reset_colors_btn.clicked.connect(self._reset_theme_colors)
        theme_colors_layout.addWidget(self.reset_colors_btn, 3, 0, 1, 4)
        
        theme_layout.addWidget(theme_colors_group)
        
        ui_layout.addWidget(theme_group)
        
        # 动画设置组
        animation_group = QGroupBox("动画设置")
        animation_layout = QFormLayout(animation_group)
        
        # 使用动画效果
        self.use_animation_check = QCheckBox("使用动画效果")
        animation_layout.addRow("", self.use_animation_check)
        
        # 启用声音
        self.sound_enabled_check = QCheckBox("启用声音效果")
        animation_layout.addRow("", self.sound_enabled_check)
        
        # 动画持续时间
        self.animation_duration_spin = QSpinBox()
        self.animation_duration_spin.setMinimum(500)
        self.animation_duration_spin.setMaximum(5000)
        self.animation_duration_spin.setSingleStep(100)
        self.animation_duration_spin.setSuffix(" 毫秒")
        animation_layout.addRow("动画持续时间:", self.animation_duration_spin)
        
        ui_layout.addWidget(animation_group)
        
        # 添加弹性空间
        ui_layout.addStretch(1)
        
        return ui_widget
    
    def _create_custom_tab(self) -> QWidget:
        """
        创建自定义参数选项卡
        
        Returns:
            自定义参数选项卡部件
        """
        custom_widget = QWidget()
        custom_layout = QVBoxLayout(custom_widget)
        
        # 添加参数组
        add_group = QGroupBox("添加自定义参数")
        add_layout = QFormLayout(add_group)
        
        # 参数名输入
        self.param_name_input = QLineEdit()
        add_layout.addRow("参数名:", self.param_name_input)
        
        # 参数值输入
        self.param_value_input = QLineEdit()
        add_layout.addRow("参数值:", self.param_value_input)
        
        # 添加按钮
        add_btn_layout = QHBoxLayout()
        add_btn_layout.addStretch()
        
        self.add_param_btn = QPushButton("添加参数")
        self.add_param_btn.clicked.connect(self._add_custom_parameter)
        add_btn_layout.addWidget(self.add_param_btn)
        
        add_layout.addRow("", add_btn_layout)
        custom_layout.addWidget(add_group)
        
        # 当前参数组
        current_group = QGroupBox("当前自定义参数")
        self.current_params_layout = QVBoxLayout(current_group)
        
        # 初始为空
        self.current_params_layout.addWidget(QLabel("无自定义参数"))
        
        custom_layout.addWidget(current_group)
        custom_layout.addStretch(1)
        
        return custom_widget
        
    def _create_security_tab(self) -> QWidget:
        """
        创建安全设置选项卡，提供密码保护功能
        
        Returns:
            安全设置选项卡部件
        """
        security_widget = QWidget()
        security_layout = QVBoxLayout(security_widget)
        
        # 密码保护组
        password_group = QGroupBox("密码保护设置")
        password_layout = QVBoxLayout(password_group)
        
        # 启用密码保护选项
        self.enable_password_check = QCheckBox("启用密码保护")
        self.enable_password_check.setToolTip("开启后，进入设置界面需要输入密码")
        self.enable_password_check.stateChanged.connect(self._on_password_protection_changed)
        password_layout.addWidget(self.enable_password_check)
        
        # 密码设置区域
        password_form = QFormLayout()
        
        # 当前密码输入（仅在修改密码时需要）
        self.current_password_input = QLineEdit()
        self.current_password_input.setEchoMode(QLineEdit.Password)
        self.current_password_input.setPlaceholderText("输入当前密码（如果已设置）")
        password_form.addRow("当前密码:", self.current_password_input)
        
        # 新密码输入
        self.new_password_input = QLineEdit()
        self.new_password_input.setEchoMode(QLineEdit.Password)
        self.new_password_input.setPlaceholderText("输入新密码")
        password_form.addRow("新密码:", self.new_password_input)
        
        # 确认新密码
        self.confirm_password_input = QLineEdit()
        self.confirm_password_input.setEchoMode(QLineEdit.Password)
        self.confirm_password_input.setPlaceholderText("再次输入新密码")
        password_form.addRow("确认密码:", self.confirm_password_input)
        
        password_layout.addLayout(password_form)
        
        # 设置密码按钮
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        self.set_password_btn = QPushButton("设置密码")
        self.set_password_btn.clicked.connect(self._set_password)
        btn_layout.addWidget(self.set_password_btn)
        
        password_layout.addLayout(btn_layout)
        
        # 添加提示信息
        note_label = QLabel("注意: 密码将保存在 %APPDATA%/random_v.ini 文件中")
        note_label.setStyleSheet("color: gray; font-size: 10px;")
        password_layout.addWidget(note_label)
        
        security_layout.addWidget(password_group)
        
        # 添加弹性空间
        security_layout.addStretch(1)
        
        return security_widget
    
    def _load_settings(self) -> None:
        """加载现有设置"""
        # 当前文件
        current_file = app_settings.get('current_name_file', '')
        self.current_file_edit.setText(current_file)
        
        # 加载本地文件列表
        local_files = app_settings.get('local_files', [])
        self.local_file_list.clear()
        if local_files:
            self.local_file_list.addItems(local_files)
        
        # 加载远程URL列表
        remote_urls = app_settings.get('remote_urls', [])
        self.remote_url_list.clear()
        if remote_urls:
            self.remote_url_list.addItems(remote_urls)
            
        # 加载小组列表
        self._load_group_list()
        
        # 抽奖设置
        draw_count = app_settings.get('draw_count', 1)
        self.draw_count_spin.setValue(draw_count)
        
        draw_mode = app_settings.get('draw_mode', DrawMode.EQUAL.value)
        mode_index = next((i for i, mode in enumerate(DrawMode) if mode.value == draw_mode), 0)
        self.draw_mode_combo.setCurrentIndex(mode_index)
        
        reset_after_draw = app_settings.get('reset_after_draw', True)
        self.reset_after_draw_check.setChecked(reset_after_draw)
        
        # 加载允许重复抽取设置
        allow_repeat = app_settings.get('allow_repeat', False)
        self.allow_repeat_check.setChecked(allow_repeat)
        
        # 名单滚动速度
        scroll_speed = app_settings.get('scroll_speed', 5)
        self.speed_slider.setValue(scroll_speed)
        self.speed_spin.setValue(scroll_speed)
        
        # UI设置
        theme_mode = app_settings.get_theme_mode()
        theme_index = self.theme_combo.findData(theme_mode)
        if theme_index >= 0:
            self.theme_combo.setCurrentIndex(theme_index)
        
        use_animation = app_settings.get('use_animation', True)
        self.use_animation_check.setChecked(use_animation)
        
        sound_enabled = app_settings.get('sound_enabled', True)
        self.sound_enabled_check.setChecked(sound_enabled)
        
        animation_duration = app_settings.get('animation_duration', 3000)
        self.animation_duration_spin.setValue(animation_duration)
        
        # 加载主题自定义颜色设置
        theme_colors = app_settings.get('theme_colors', {})
        
        # 设置默认颜色
        default_colors = {
            'primary_color': '#61afef',  # 蓝色
            'success_color': '#98c379',  # 绿色
            'warning_color': '#e5c07b',  # 黄色
            'error_color': '#e06c75',     # 红色
            # 文本颜色功能已移除
            'name_color': '#c678dd'       # 名称颜色
        }
        
        # 遍历所有颜色设置
        for color_type, default_color in default_colors.items():
            # 使用保存的颜色或默认颜色
            color_code = theme_colors.get(color_type, default_color)
            
            # 设置按钮样式
            if color_code:
                text_color = 'white' if QColor(color_code).lightness() < 128 else 'black'
                button_style = f"background-color: {color_code}; color: {text_color};"
                
                # 根据颜色类型设置相应按钮
                if color_type == 'primary_color':
                    self.primary_color_btn.setStyleSheet(button_style)
                    self.primary_color_btn.setText(color_code)
                elif color_type == 'success_color':
                    self.success_color_btn.setStyleSheet(button_style)
                    self.success_color_btn.setText(color_code)
                elif color_type == 'warning_color':
                    self.warning_color_btn.setStyleSheet(button_style)
                    self.warning_color_btn.setText(color_code)
                elif color_type == 'error_color':
                    self.error_color_btn.setStyleSheet(button_style)
                    self.error_color_btn.setText(color_code)

        
        # 加载自定义参数
        custom_params = app_settings.get('custom_parameters', {})
        self._update_custom_parameters(custom_params)
        
        # 加载密码保护设置
        is_password_protected = app_settings.is_password_protected()
        self.enable_password_check.setChecked(is_password_protected)
    
    def _update_custom_parameters(self, params: Dict) -> None:
        """
        更新自定义参数列表显示
        
        Args:
            params: 参数字典
        """
        # 清空现有参数
        while _update_custom_parameters.rowCount() > 0:
            _update_custom_parameters.removeRow(0)
        
        # 添加参数
        for name, value in params.items():
            param_layout = QHBoxLayout()
            
            value_label = QLabel(str(value))
            param_layout.addWidget(value_label)
            
            remove_button = QPushButton("移除")
            remove_button.setProperty('param_name', name)
            remove_button.clicked.connect(self._remove_custom_parameter)
            param_layout.addWidget(remove_button)
            
            _update_custom_parameters.addRow(f"{name}:", param_layout)
    
    @Slot()
    def _save_settings(self) -> None:
        """保存设置"""
        # 保存当前文件
        current_file = self.current_file_edit.text()
        app_settings.set('current_name_file', current_file)
        
        # 保存本地文件列表
        local_files = [self.local_file_list.item(i).text() for i in range(self.local_file_list.count())]
        app_settings.set('local_files', local_files)
        
        # 保存远程URL列表
        remote_urls = [self.remote_url_list.item(i).text() for i in range(self.remote_url_list.count())]
        app_settings.set('remote_urls', remote_urls)
        
        # 保存小组设置
        # 注意：小组设置在每次操作时就已经保存，此处无需重复保存
        
        # 保存抽奖设置
        draw_count = self.draw_count_spin.value()
        app_settings.set('draw_count', draw_count)
        
        # 从下拉框获取枚举名称字符串并转换为枚举值
        draw_mode_name = self.draw_mode_combo.currentData()
        draw_mode = getattr(DrawMode, draw_mode_name).value
        app_settings.set('draw_mode', draw_mode)
        
        # 保存抽奖后重置设置
        reset_after_draw = self.reset_after_draw_check.isChecked()
        app_settings.set('reset_after_draw', reset_after_draw)
        
        # 保存密码保护设置
        password_protected = self.enable_password_check.isChecked()
        app_settings.set_password_protection(password_protected)
        
        # 保存允许重复抽取设置
        allow_repeat = self.allow_repeat_check.isChecked()
        app_settings.set('allow_repeat', allow_repeat)
        
        # 保存名单滚动速度
        scroll_speed = self.speed_spin.value()
        app_settings.set('scroll_speed', scroll_speed)
        
        # 保存UI设置
        theme_mode = self.theme_combo.currentData()
        app_settings.set_theme_mode(theme_mode)
        
        # 保存主题自定义颜色
        theme_colors = {}
        
        # 获取当前按钮显示的颜色
        if self.primary_color_btn.text():
            theme_colors['primary_color'] = self.primary_color_btn.text()
        if self.success_color_btn.text():
            theme_colors['success_color'] = self.success_color_btn.text()
        if self.warning_color_btn.text():
            theme_colors['warning_color'] = self.warning_color_btn.text()
        if self.error_color_btn.text():
            theme_colors['error_color'] = self.error_color_btn.text()
        if self.name_color_btn.text():
            theme_colors['name_color'] = self.name_color_btn.text()
        
        # 文本颜色功能已移除
        
        app_settings.set('theme_colors', theme_colors)
        
        use_animation = self.use_animation_check.isChecked()
        app_settings.set('use_animation', use_animation)
        
        sound_enabled = self.sound_enabled_check.isChecked()
        app_settings.set('sound_enabled', sound_enabled)
        
        animation_duration = self.animation_duration_spin.value()
        app_settings.set('animation_duration', animation_duration)
        
        # 保存自定义参数已经在添加/移除时处理
        
        # 发送信号
        self.settings_saved.emit()
        
        # 关闭对话框
        self.accept()
        
        logger.info("设置已保存")
    
    def _select_color(self, color_type: str) -> None:
        """
        选择颜色
        
        Args:
            color_type: 颜色类型
        """
        # 获取当前颜色设置
        current_colors = app_settings.get('theme_colors', {})
        current_color = QColor(current_colors.get(color_type, ''))
        
        # 如果当前没有设置颜色或颜色无效，使用默认颜色
        if not current_color.isValid():
            if color_type == 'primary_color':
                current_color = QColor('#61afef')  # 蓝色
            elif color_type == 'success_color':
                current_color = QColor('#98c379')  # 绿色
            elif color_type == 'warning_color':
                current_color = QColor('#e5c07b')  # 黄色
            elif color_type == 'error_color':
                current_color = QColor('#e06c75')  # 红色
        
        # 打开颜色选择对话框
        color = QColorDialog.getColor(current_color, self, "选择颜色")
        
        # 如果用户选择了颜色（未取消）
        if color.isValid():
            # 根据颜色亮度确定文字颜色（深色背景用白色文字，浅色背景用黑色文字）
            text_color = 'white' if color.lightness() < 128 else 'black'
            button_style = f"background-color: {color.name()}; color: {text_color};"
            
            # 更新相应的按钮
            if color_type == 'primary_color':
                self.primary_color_button.setStyleSheet(button_style)
                self.primary_color_button.setText(color.name())
            elif color_type == 'success_color':
                self.success_color_button.setStyleSheet(button_style)
                self.success_color_button.setText(color.name())
            elif color_type == 'warning_color':
                self.warning_color_button.setStyleSheet(button_style)
                self.warning_color_button.setText(color.name())
            elif color_type == 'error_color':
                self.error_color_button.setStyleSheet(button_style)
                self.error_color_button.setText(color.name())
            elif color_type == 'name_color':
                self.name_color_button.setStyleSheet(button_style)
                self.name_color_button.setText(color.name())
            
            # 保存颜色设置
            current_colors[color_type] = color.name()
            app_settings.set('theme_colors', current_colors)
            
            # 通知主窗口更新主题
            self.themeChanged.emit()
    
    def _reset_theme_colors(self) -> None:
        """
        重置主题颜色为默认值
        """
        # 默认颜色
        default_colors = {
            'primary_color': '#61afef',  # 蓝色
            'success_color': '#98c379',  # 绿色
            'warning_color': '#e5c07b',  # 黄色
            'error_color': '#e06c75',    # 红色
            'text_color': '#abb2bf',     # 文本颜色
            'name_color': '#c678dd'      # 名称颜色
        }
        
        # 保存默认颜色设置
        app_settings.set('theme_colors', default_colors)
        
        # 更新按钮显示
        for color_type, color_value in default_colors.items():
            text_color = 'white' if QColor(color_value).lightness() < 128 else 'black'
            button_style = f"background-color: {color_value}; color: {text_color};"
            
            if color_type == 'primary_color':
                self.primary_color_button.setStyleSheet(button_style)
                self.primary_color_button.setText(color_value)
            elif color_type == 'success_color':
                self.success_color_button.setStyleSheet(button_style)
                self.success_color_button.setText(color_value)
            elif color_type == 'warning_color':
                self.warning_color_button.setStyleSheet(button_style)
                self.warning_color_button.setText(color_value)
            elif color_type == 'error_color':
                self.error_color_button.setStyleSheet(button_style)
                self.error_color_button.setText(color_value)
            elif color_type == 'text_color':
                self.text_color_button.setStyleSheet(button_style)
                self.text_color_button.setText(color_value)
            elif color_type == 'name_color':
                self.name_color_button.setStyleSheet(button_style)
                self.name_color_button.setText(color_value)
        
        # 通知主窗口更新主题
        self.themeChanged.emit()
        QMessageBox.information(self, "重置颜色", "所有颜色已重置为默认值。")
        # 确认是否要重置颜色
        reply = QMessageBox.question(
            self,
            '确认重置',
            '确定要重置所有主题颜色设置吗？这将恢复默认颜色。',
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply != QMessageBox.Yes:
            return
            
        # 清空保存的颜色设置
        app_settings.set('theme_colors', {})
        
        # 默认颜色值
        default_colors = {
            'primary_color': '#61afef',  # 蓝色
            'success_color': '#98c379',  # 绿色
            'warning_color': '#e5c07b',  # 黄色
            'error_color': '#e06c75'     # 红色
        }
        
        # 更新所有颜色按钮
        for color_type, color_code in default_colors.items():
            button_style = f"background-color: {color_code}; color: {'white' if QColor(color_code).lightness() < 128 else 'black'};"
            
            if color_type == 'primary_color':
                self.primary_color_btn.setStyleSheet(button_style)
                self.primary_color_btn.setText(color_code)
            elif color_type == 'success_color':
                self.success_color_btn.setStyleSheet(button_style)
                self.success_color_btn.setText(color_code)
            elif color_type == 'warning_color':
                self.warning_color_btn.setStyleSheet(button_style)
                self.warning_color_btn.setText(color_code)
            elif color_type == 'error_color':
                self.error_color_btn.setStyleSheet(button_style)
                self.error_color_btn.setText(color_code)
                
        # 重置名称颜色按钮（清空，使用主题默认值）
        self.name_color_btn.setStyleSheet("")
        self.name_color_btn.setText("")
        
        logger.debug("重置所有颜色为默认值")
    
    def _select_name_file(self) -> None:
        """选择名单文件"""
        file_dialog = QFileDialog(self)
        file_dialog.setNameFilter("文本文件 (*.txt);;CSV文件 (*.csv);;所有文件 (*);")
        file_dialog.setFileMode(QFileDialog.ExistingFile)
        
        if file_dialog.exec_():
            selected_files = file_dialog.selectedFiles()
            if selected_files:
                file_path = selected_files[0]
                self.current_file_edit.setText(file_path)
                
                # 加入本地文件历史记录
                app_settings.add_name_file(file_path)
                
                # 更新下拉列表
                self._load_settings()
                
                logger.debug(f"选择名单文件: {file_path}")
    
    def _update_custom_parameters(self, params: Dict) -> None:
        """
        更新自定义参数列表显示
        
        Args:
            params: 参数字典
        """
        # 清空现有参数
        while self.current_params_layout.count() > 0:
            item = self.current_params_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        
        # 如果没有参数，显示提示文本
        if not params:
            self.current_params_layout.addWidget(QLabel("无自定义参数"))
            return
            
        # 添加参数
        for name, value in params.items():
            param_widget = QWidget()
            param_layout = QHBoxLayout(param_widget)
            param_layout.setContentsMargins(0, 0, 0, 0)
            
            name_label = QLabel(f"{name}:")
            name_label.setStyleSheet("font-weight: bold;")
            param_layout.addWidget(name_label)
            
            value_label = QLabel(str(value))
            param_layout.addWidget(value_label)
            param_layout.addStretch()
            
            remove_button = QPushButton("移除")
            remove_button.setProperty('param_name', name)
            remove_button.clicked.connect(self._remove_custom_parameter)
            param_layout.addWidget(remove_button)
            
            self.current_params_layout.addWidget(param_widget)
    
    def _validate_group_input(self) -> bool:
        """验证小组输入
        
        Returns:
{{ ... }}
            验证是否通过
        """
        group_name = self.group_name_edit.text().strip()
        file_path = self.group_path_edit.text().strip()
        url = self.group_url_edit.text().strip()
        
        if not group_name:
            QMessageBox.warning(self, "小组名称错误", "小组名称不能为空")
            return False
            
        if not file_path and not url:
            QMessageBox.warning(self, "数据源错误", "必须指定文件路径或URL地址")
            return False
            
        return True
    
    def _add_group(self) -> None:
        """添加小组"""
        if not self._validate_group_input():
            return
            
        group_name = self.group_name_edit.text().strip()
        file_path = self.group_path_edit.text().strip()
        url = self.group_url_edit.text().strip()
        
        # 检查名称是否重复
        groups = app_settings.get('group_settings', [])
        if any(g['name'] == group_name for g in groups):
            QMessageBox.warning(self, "小组名称重复", f"小组名称 '{group_name}' 已经存在")
            return
            
        # 创建新小组数据
        new_group = {
            'name': group_name,
            'file_path': file_path,
            'url': url
        }
        
        # 添加到设置中
        groups.append(new_group)
        app_settings.set('group_settings', groups)
        
        # 添加到列表显示
        item = QListWidgetItem(group_name)
        item.setData(Qt.UserRole, new_group)
        self.group_list.addItem(item)
        
        # 清空输入区
        self._clear_group_details()
        
        QMessageBox.information(self, "添加成功", f"小组 '{group_name}' 添加成功")
    
    def _update_group(self) -> None:
        """更新小组"""
        current_row = self.group_list.currentRow()
        if current_row < 0:
            return
            
        if not self._validate_group_input():
            return
            
        # 获取新的小组数据
        group_name = self.group_name_edit.text().strip()
        file_path = self.group_path_edit.text().strip()
        url = self.group_url_edit.text().strip()
        
        # 获取原小组数据
        item = self.group_list.item(current_row)
        old_group = item.data(Qt.UserRole)
        
        # 检查名称是否重复(如果名称改变)
        if group_name != old_group['name']:
            groups = app_settings.get('group_settings', [])
            if any(g['name'] == group_name and g != old_group for g in groups):
                QMessageBox.warning(self, "小组名称重复", f"小组名称 '{group_name}' 已经存在")
                return
        
        # 更新小组数据
        updated_group = {
            'name': group_name,
            'file_path': file_path,
            'url': url
        }
        
        # 更新设置
        groups = app_settings.get('group_settings', [])
        for i, group in enumerate(groups):
            if group == old_group:
                groups[i] = updated_group
                break
                
        app_settings.set('group_settings', groups)
        
        # 更新列表显示
        item.setText(group_name)
        item.setData(Qt.UserRole, updated_group)
        
        QMessageBox.information(self, "更新成功", f"小组 '{group_name}' 更新成功")
    
    def _delete_group(self) -> None:
        """删除小组"""
        current_row = self.group_list.currentRow()
        if current_row < 0:
            return
            
        # 获取要删除的小组
        item = self.group_list.item(current_row)
        group_to_delete = item.data(Qt.UserRole)
        
        # 确认删除
        reply = QMessageBox.question(
            self,
            "确认删除",
            f"确定要删除小组 '{group_to_delete['name']}' 吗？",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply != QMessageBox.Yes:
            return
            
        # 从设置中删除
        groups = app_settings.get('group_settings', [])
        groups = [g for g in groups if g != group_to_delete]
        app_settings.set('group_settings', groups)
        
        # 从列表中删除
        self.group_list.takeItem(current_row)
        
        # 清空详情区
        self._clear_group_details()
        
        # 禁用按钮
        self.update_group_button.setEnabled(False)
        self.delete_group_button.setEnabled(False)
        
        QMessageBox.information(self, "删除成功", f"小组 '{group_to_delete['name']}' 已被删除")
    
    def _move_group_up(self) -> None:
        """将选中的小组上移"""
        current_row = self.group_list.currentRow()
        if current_row <= 0:  # 已经在最上面或未选中
            return
            
        # 从设置中移动
        groups = app_settings.get('group_settings', [])
        groups[current_row], groups[current_row - 1] = groups[current_row - 1], groups[current_row]
        app_settings.set('group_settings', groups)
        
        # 从列表中取出当前项
        current_item = self.group_list.takeItem(current_row)
        # 在新位置插入
        self.group_list.insertItem(current_row - 1, current_item)
        # 选中新位置的项
        self.group_list.setCurrentRow(current_row - 1)
    
    def _move_group_down(self) -> None:
        """将选中的小组下移"""
        current_row = self.group_list.currentRow()
        if current_row < 0 or current_row >= self.group_list.count() - 1:  # 已经在最下面或未选中
            return
            
        # 从设置中移动
        groups = app_settings.get('group_settings', [])
        groups[current_row], groups[current_row + 1] = groups[current_row + 1], groups[current_row]
        app_settings.set('group_settings', groups)
        
        # 从列表中取出当前项
        current_item = self.group_list.takeItem(current_row)
        # 在新位置插入
        self.group_list.insertItem(current_row + 1, current_item)
        # 选中新位置的项
        self.group_list.setCurrentRow(current_row + 1)
    
    def _sort_groups_by_name(self) -> None:
        """按名称对小组进行排序"""
        if self.group_list.count() <= 1:
            return
            
        # 确认排序
        reply = QMessageBox.question(
            self,
            "确认排序",
            "确定要按名称对小组进行排序吗？这将会重新排列您的小组列表。",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply != QMessageBox.Yes:
            return
            
        # 从设置中获取并排序
        groups = app_settings.get('group_settings', [])
        groups.sort(key=lambda x: x['name'])
        app_settings.set('group_settings', groups)
        
        # 重新加载列表
        self._load_group_list()
        
        # 更新显示
        self._update_custom_parameters(custom_params)
        
        # 清空输入
        self.param_name_input.clear()
        self.param_value_input.clear()
        
        logger.debug(f"添加自定义参数: {param_name} = {param_value}")
    
    @Slot()
    def _add_custom_parameter(self) -> None:
        """添加自定义参数"""
        # 获取参数名和值
        param_name = self.param_name_input.text().strip()
        param_value = self.param_value_input.text().strip()
        
        # 验证输入
        if not param_name:
            QMessageBox.warning(self, "输入错误", "参数名不能为空")
            return
            
        if not param_value:
            QMessageBox.warning(self, "输入错误", "参数值不能为空")
            return
            
        # 获取当前自定义参数
        custom_params = app_settings.get('custom_parameters', {})
        
        # 添加或更新参数
        custom_params[param_name] = param_value
        app_settings.set('custom_parameters', custom_params)
        
        # 更新参数列表显示
        self._update_custom_parameters(custom_params)
        
        # 清空输入框
        self.param_name_input.clear()
        self.param_value_input.clear()
        
        logger.debug(f"添加自定义参数: {param_name} = {param_value}")
            
    @Slot()
    def _remove_custom_parameter(self) -> None:
        """移除自定义参数"""
        button = self.sender()
        if not button:
            return
            
        param_name = button.property('param_name')
        if not param_name:
            return
            
        # 获取当前自定义参数
        custom_params = app_settings.get('custom_parameters', {})
        
        # 移除参数
        if param_name in custom_params:
            del custom_params[param_name]
            app_settings.set('custom_parameters', custom_params)
            
            # 更新参数列表显示
            self._update_custom_parameters(custom_params)
            
            logger.debug(f"移除自定义参数: {param_name}")
            
    def _load_group_list(self) -> None:
        """从应用设置中加载小组列表并显示在界面上"""
        # 清空当前列表
        self.group_list.clear()
        
        # 获取小组设置
        groups = app_settings.get('group_settings', [])
        
        # 添加小组到列表
        for group in groups:
            item = QListWidgetItem(group['name'])
            item.setData(Qt.UserRole, group)
            self.group_list.addItem(item)
            
        # 清空输入区
        self._clear_group_details()
        
        logger.debug(f"已加载 {len(groups)} 个小组")
        
    def _clear_group_details(self) -> None:
        """清空小组详情输入区"""
        # 清空输入框
        self.group_name_edit.clear()
        self.group_path_edit.clear()
        self.group_url_edit.clear()
        
        # 禁用相关按钮
        self.update_group_btn.setEnabled(False)
        self.delete_group_btn.setEnabled(False)
        self.move_up_btn.setEnabled(False)
        self.move_down_btn.setEnabled(False)
    
    @Slot()
    def _select_color(self, color_type: str) -> None:
        """
        选择颜色并设置按钮样式
        
        Args:
            color_type: 颜色类型 (primary_color, success_color, warning_color, error_color, text_color, name_color)
        """
        # 获取当前颜色按钮
        button = getattr(self, f"{color_type}_btn", None)
        if not button:
            return
            
        current_color = button.text() if button.text() else "#000000"
        
        # 显示颜色选择对话框
        color = QColorDialog.getColor(QColor(current_color), self, f"选择{color_type}颜色")
        if color.isValid():
            color_code = color.name().upper()
            text_color = "white" if color.lightness() < 128 else "black"
            button_style = f"background-color: {color_code}; color: {text_color};"
            
            button.setStyleSheet(button_style)
            button.setText(color_code)
            
            logger.debug(f"设置{color_type}颜色为: {color_code}")
    
    @Slot()
    def _on_password_protection_changed(self, state: int) -> None:
        """
        处理密码保护状态变化
        
        Args:
            state: 复选框状态 (Qt.Checked 或 Qt.Unchecked)
        """
        is_enabled = state == Qt.Checked
        
        # 如果禁用密码保护，需要确认
        if not is_enabled and app_settings.is_password_protected():
            # 需要先验证密码
            current_password = self.current_password_input.text()
            if not app_settings.verify_password(current_password):
                #QMessageBox.warning(self, "密码错误", "请输入正确的当前密码再进行此操作")
                # 恢复复选框状态
                self.enable_password_check.blockSignals(True)
                self.enable_password_check.setChecked(True)
                self.enable_password_check.blockSignals(False)
                return
                
            # 确认是否要禁用密码保护
            reply = QMessageBox.question(
                self,
                '确认禁用',
                '禁用密码保护后，将不再需要密码即可进入设置界面。确定要禁用吗？',
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            
            if reply != QMessageBox.Yes:
                # 用户取消操作，恢复复选框状态
                self.enable_password_check.blockSignals(True)
                self.enable_password_check.setChecked(True)
                self.enable_password_check.blockSignals(False)
                return
    
    def _set_password(self) -> None:
        """设置或修改密码"""
        # 检查当前密码（如果已启用密码保护）
        if app_settings.is_password_protected():
            current_password = self.current_password_input.text()
            if not app_settings.verify_password(current_password):
                QMessageBox.warning(self, "密码错误", "当前密码输入错误")
                return
                
        # 检查新密码
        new_password = self.new_password_input.text()
        confirm_password = self.confirm_password_input.text()
        
        if not new_password:
            QMessageBox.warning(self, "输入错误", "新密码不能为空")
            return
            
        if new_password != confirm_password:
            QMessageBox.warning(self, "输入错误", "两次输入的密码不一致")
            return
            
        # 设置密码和密码保护状态
        app_settings.set_password(new_password)
        app_settings.set_password_protection(True)
        
        # 更新UI状态
        self.enable_password_check.blockSignals(True)
        self.enable_password_check.setChecked(True)
        self.enable_password_check.blockSignals(False)
        
        # 清空密码输入框
        self.current_password_input.clear()
        self.new_password_input.clear()
        self.confirm_password_input.clear()
        
        QMessageBox.information(self, "设置成功", "密码已成功设置")
        
    def _reset_theme_colors(self) -> None:
        """重置为默认颜色"""
        # 确认是否要重置颜色
        reply = QMessageBox.question(
            self,
            '确认重置',
            '确定要重置所有主题颜色设置吗？这将恢复默认颜色。',
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            # 重置为默认颜色
            default_colors = {
                'primary_color': '#61afef',  # 蓝色
                'success_color': '#98c379',  # 绿色
                'warning_color': '#e5c07b',  # 黄色
                'error_color': '#e06c75',   # 红色
                'text_color': None,          # 使用主题默认值
                'name_color': None           # 使用主题默认值
            }
            
            # 更新按钮显示
            for color_type, color_code in default_colors.items():
                if color_code:
                    button = getattr(self, f"{color_type}_btn", None)
                    if button:
                        text_color = "white" if QColor(color_code).lightness() < 128 else "black"
                        button_style = f"background-color: {color_code}; color: {text_color};"
                        button.setStyleSheet(button_style)
                        button.setText(color_code)
                else:
                    # 文本颜色和名称颜色设为空（使用默认值）
                    button = getattr(self, f"{color_type}_btn", None)
                    if button:
                        button.setStyleSheet("")
                        button.setText("")
            
            logger.debug("重置所有颜色为默认值")
            
    def _load_selected_file(self) -> None:
        """加载选中的本地文件"""
        if self.local_file_list.currentText():
            file_path = self.local_file_list.currentText()
            self.current_file_edit.setText(file_path)
            logger.debug(f"从历史记录中加载文件: {file_path}")
            
    def _load_selected_url(self) -> None:
        """加载选中的远程URL"""
        if self.remote_url_list.currentText():
            url = self.remote_url_list.currentText()
            self.current_file_edit.setText(url)
            logger.debug(f"从历史记录中加载URL: {url}")
            
    def _load_remote_url(self) -> None:
        """加载输入的远程URL"""
        url = self.remote_url_input.text().strip()
        if not url:
            return
            
        if not is_valid_url(url):
            QMessageBox.warning(self, "无效URL", "请输入有效的URL地址")
            return
            
        # 添加到历史记录
        app_settings.add_remote_url(url)
        
        # 设置为当前文件
        self.current_file_edit.setText(url)
        
        # 更新下拉列表
        self._load_settings()
        
        # 清空输入框
        self.remote_url_input.clear()
        
        logger.debug(f"加载远程URL: {url}")
            
    def _add_local_file(self) -> None:
        """添加本地文件到历史记录"""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "选择名单文件",
            str(Path.home()),
            "CSV文件 (*.csv);;文本文件 (*.txt);;所有文件 (*.*)")
            
        if file_path:
            app_settings.add_name_file(file_path)
            self._load_settings()
            logger.debug(f"添加本地文件到历史记录: {file_path}")
            
    def _remove_local_file(self) -> None:
        """从历史记录中移除本地文件"""
        file_path = self.local_file_list.currentText()
        if file_path:
            # 确认删除
            reply = QMessageBox.question(
                self,
                "确认移除",
                f"确定要从历史记录中移除文件 '{file_path}' 吗？",
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                app_settings.remove_name_file(file_path)
                self._load_settings()
                logger.debug(f"从历史记录中移除文件: {file_path}")
                
    def _remove_remote_url(self) -> None:
        """从历史记录中移除远程URL"""
        url = self.remote_url_list.currentText()
        if url:
            # 确认删除
            reply = QMessageBox.question(
                self,
                "确认移除",
                f"确定要从历史记录中移除URL '{url}' 吗？",
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                app_settings.remove_remote_url(url)
                self._load_settings()
                logger.debug(f"从历史记录中移除URL: {url}")
                
    def _on_group_selected(self, row: int) -> None:
        """
        处理小组列表选择变化事件
        
        Args:
            row: 选中的行索引
        """
        # 检查是否有效的选择
        if row < 0:
            # 清空输入框
            self.group_name_edit.clear()
            
            # 禁用相关按钮
            if hasattr(self, 'update_group_btn'):
                self.update_group_btn.setEnabled(False)
            if hasattr(self, 'delete_group_btn'):
                self.delete_group_btn.setEnabled(False)
            if hasattr(self, 'move_up_btn'):
                self.move_up_btn.setEnabled(False)
            if hasattr(self, 'move_down_btn'):
                self.move_down_btn.setEnabled(False)
            return
        
        # 获取选中的小组项目
        item = self.group_list.item(row)
        if not item:
            return
            
        # 获取小组名称
        group_name = item.text()
        
        # 更新输入框
        self.group_name_edit.setText(group_name)
        
        # 启用相关按钮
        if hasattr(self, 'update_group_btn'):
            self.update_group_btn.setEnabled(True)
        if hasattr(self, 'delete_group_btn'):
            self.delete_group_btn.setEnabled(True)
        if hasattr(self, 'move_up_btn'):
            self.move_up_btn.setEnabled(row > 0)
        if hasattr(self, 'move_down_btn'):
            self.move_down_btn.setEnabled(row < self.group_list.count() - 1)
            
        logger.debug(f"已选择小组: {group_name}")
        
    def _browse_group_file(self) -> None:
        """浏览选择小组名单文件"""
        # 使用文件选择对话框
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "选择小组名单文件",
            str(Path.home()),
            "CSV文件 (*.csv);;文本文件 (*.txt);;所有文件 (*.*)")
            
        if file_path:
            # 更新路径显示
            self.group_path_edit.setText(file_path)
            logger.debug(f"已选择小组名单文件: {file_path}")
