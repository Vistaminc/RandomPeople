"""
应用程序设置管理模块，提供设置的加载、保存和访问功能。
使用INI配置文件存储配置。
"""
import configparser
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from PySide6.QtCore import QObject, Signal

from .constants import APP_NAME, APP_ROOT, DEFAULT_DRAW_COUNT, DEFAULT_DRAW_MODE, DEFAULT_SOUND_ENABLED, DEFAULT_USE_ANIMATION


logger = logging.getLogger(__name__)


class Settings(QObject):
    """应用程序设置管理类，使用INI文件存储配置"""
    
    # 定义信号
    settings_changed = Signal(str, object)  # 当设置发生变化时发出信号，参数为设置名和新值
    
    def __init__(self) -> None:
        """初始化设置管理器"""
        super().__init__()
        
        # 配置文件路径使用 %APPDATA% 目录
        appdata_path = os.environ.get('APPDATA')
        if appdata_path:
            self.config_file = Path(appdata_path) / 'random_v.ini'
        else:
            # 如果无法获取 APPDATA，则使用默认路径
            self.config_file = APP_ROOT / 'random_config.ini'
            logger.warning('无法获取 APPDATA 环境变量，使用默认配置文件路径')
        
        # 创建配置解析器
        self._config = configparser.ConfigParser()
        
        # 如果配置文件存在，则读取
        if self.config_file.exists():
            self._config.read(self.config_file, encoding='utf-8')
        
        # 确保主要配置节点存在
        self._ensure_sections()
        
        # 读取设置或设置默认值
        self._load_defaults()
        
    def _ensure_sections(self) -> None:
        """确保配置文件中的节点存在"""
        sections = ['General', 'Files', 'DrawSettings', 'UI', 'CustomParams', 'Security', 'Logging']
        for section in sections:
            if not self._config.has_section(section):
                self._config.add_section(section)
        
    def _load_defaults(self) -> None:
        """加载默认设置"""
        # 文件相关设置
        if not self.get('last_file_directory', section='Files'):
            self.set('last_file_directory', str(Path.home()), section='Files')
            
        # 名单相关设置
        if not self.get('name_files', section='Files'):
            self.set('name_files', [], section='Files')
        
        # 抽奖相关设置
        if not self.get('draw_count', section='DrawSettings'):
            self.set('draw_count', DEFAULT_DRAW_COUNT, section='DrawSettings')
            
        if not self.get('draw_mode', section='DrawSettings'):
            self.set('draw_mode', DEFAULT_DRAW_MODE.value, section='DrawSettings')
            
        if not self.get('allow_repeat', section='DrawSettings'):
            self.set('allow_repeat', False, section='DrawSettings')
            
        if not self.get('accumulate_results', section='DrawSettings'):
            self.set('accumulate_results', False, section='DrawSettings')
            
        # 远程文件URL列表
        if not self.get('remote_urls', section='Files'):
            self.set('remote_urls', [], section='Files')
            
        # UI相关设置
        if not self.get('use_animation', section='UI'):
            self.set('use_animation', DEFAULT_USE_ANIMATION, section='UI')
            
        if not self.get('sound_enabled', section='UI'):
            self.set('sound_enabled', DEFAULT_SOUND_ENABLED, section='UI')
            
        if not self.get('theme_mode', section='UI'):
            self.set('theme_mode', 'dark', section='UI')  # 默认使用暗色主题
            
        # 自定义参数
        custom_params = self.get('custom_parameters', section='CustomParams')
        if custom_params is None:
            self.set('custom_parameters', {}, section='CustomParams')
            
        # 日志设置
        if not self.get('auto_clean_logs', section='Logging'):
            self.set('auto_clean_logs', True, section='Logging')  # 默认启用日志自动清理
            
        if not self.get('log_clean_days', section='Logging'):
            self.set('log_clean_days', 7, section='Logging')  # 默认7天清理一次
            
        if not self.get('last_log_clean_time', section='Logging'):
            self.set('last_log_clean_time', '', section='Logging')  # 上次清理时间，初始为空
            
        # 保存配置到文件
        self._save_config()
            
        logger.debug('默认设置已加载')
            
    def _save_config(self) -> None:
        """保存配置到文件"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            self._config.write(f)
    
    def get(self, key: str, default: Any = None, section: str = 'General') -> Any:
        """
        获取设置值
        
        Args:
            key: 设置键名
            default: 如果设置不存在时返回的默认值
            section: 配置节点名，默认为'General'
            
        Returns:
            设置值
        """
        # 检查节点是否存在
        if not self._config.has_section(section):
            return default
            
        # 检查键是否存在
        if not self._config.has_option(section, key):
            return default
            
        # 获取值
        value = self._config.get(section, key)
        
        # 处理特定类型的数据
        if value.startswith('[') and value.endswith(']'):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                pass
        elif value.startswith('{') and value.endswith('}'):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                pass
        
        # 处理布尔值
        if value.lower() == 'true':
            return True
        elif value.lower() == 'false':
            return False
            
        # 尝试解析数字
        try:
            if '.' in value:
                return float(value)
            elif value.isdigit():
                return int(value)
        except ValueError:
            pass
                
        return value
    
    def set(self, key: str, value: Any, section: str = 'General') -> None:
        """
        设置值
        
        Args:
            key: 设置键名
            value: 设置值
            section: 配置节点名，默认为'General'
        """
        # 确保节点存在
        if not self._config.has_section(section):
            self._config.add_section(section)
            
        # 对于复杂类型，如列表和字典，转换为JSON字符串
        if isinstance(value, (list, dict)):
            value = json.dumps(value)
        elif isinstance(value, bool):
            value = str(value).lower()
        elif isinstance(value, (int, float)):
            value = str(value)
            
        # 设置值
        self._config.set(section, key, value)
        
        # 保存到文件
        self._save_config()
        
        # 发出设置已更改信号
        self.settings_changed.emit(key, value)
        
    def add_name_file(self, file_path: str) -> None:
        """
        添加一个名单文件到设置
        
        Args:
            file_path: 文件路径
        """
        name_files = self.get('name_files', [], section='Files')
        
        # 如果文件路径已存在，则不添加
        if file_path not in name_files:
            name_files.append(file_path)
            self.set('name_files', name_files, section='Files')
            logger.debug(f'添加名单文件: {file_path}')
            
    def remove_name_file(self, file_path: str) -> None:
        """
        从设置中删除一个名单文件
        
        Args:
            file_path: 文件路径
        """
        name_files = self.get('name_files', [], section='Files')
        
        if file_path in name_files:
            name_files.remove(file_path)
            self.set('name_files', name_files, section='Files')
            logger.debug(f'移除名单文件: {file_path}')
            
    def add_remote_url(self, url: str) -> None:
        """
        添加一个远程文件URL到设置
        
        Args:
            url: 远程文件URL
        """
        remote_urls = self.get('remote_urls', [], section='Files')
        
        if url not in remote_urls:
            remote_urls.append(url)
            self.set('remote_urls', remote_urls, section='Files')
            logger.debug(f'添加远程URL: {url}')
            
    def remove_remote_url(self, url: str) -> None:
        """
        从设置中删除一个远程文件URL
        
        Args:
            url: 远程文件URL
        """
        remote_urls = self.get('remote_urls', [], section='Files')
        
        if url in remote_urls:
            remote_urls.remove(url)
            self.set('remote_urls', remote_urls, section='Files')
            logger.debug(f'移除远程URL: {url}')
            
    def set_custom_parameter(self, name: str, value: Any) -> None:
        """
        设置自定义参数
        
        Args:
            name: 参数名
            value: 参数值
        """
        # 自定义参数直接保存在CustomParams节点下
        self.set(name, value, section='CustomParams')
        logger.debug(f'设置自定义参数 {name}: {value}')
        
    def remove_custom_parameter(self, name: str) -> None:
        """
        移除自定义参数
        
        Args:
            name: 参数名
        """
        if self._config.has_option('CustomParams', name):
            self._config.remove_option('CustomParams', name)
            self._save_config()
            logger.debug(f'移除自定义参数: {name}')
            
    def get_custom_parameter(self, name: str, default: Any = None) -> Any:
        """
        获取自定义参数值
        
        Args:
            name: 参数名
            default: 默认值
            
        Returns:
            参数值或默认值
        """
        return self.get(name, default, section='CustomParams')
        
    def clear(self) -> None:
        """
        清除所有设置
        """
        for section in self._config.sections():
            self._config.remove_section(section)
            
        self._ensure_sections()
        self._load_defaults()
        logger.debug('所有设置已重置为默认值')
        
    def set_theme_mode(self, mode: str) -> None:
        """
        设置主题模式
        
        Args:
            mode: 主题模式，'dark' 或 'light'
        """
        if mode not in ['dark', 'light']:
            raise ValueError(f"Invalid theme mode: {mode}. Must be 'dark' or 'light'.")
            
        self.set('theme_mode', mode, section='UI')
        logger.debug(f'主题模式已设置为: {mode}')
        
    def get_theme_mode(self) -> str:
        """
        获取当前主题模式
        
        Returns:
            主题模式，'dark' 或 'light'
        """
        return self.get('theme_mode', 'dark', section='UI')
    
    def is_password_protected(self) -> bool:
        """
        检查是否启用了密码保护
        
        Returns:
            是否启用密码保护
        """
        return self.get('password_enabled', False, section='Security')
    
    def set_password_protection(self, enabled: bool) -> None:
        """
        设置是否启用密码保护
        
        Args:
            enabled: 是否启用密码保护
        """
        self.set('password_enabled', enabled, section='Security')
        logger.debug(f'密码保护已{"启用" if enabled else "禁用"}')
    
    def set_password(self, password: str) -> None:
        """
        设置密码
        
        Args:
            password: 设置密码字符串
        """
        import hashlib
        # 对密码进行简单的哈希处理以增加安全性
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        self.set('password_hash', hashed_password, section='Security')
        logger.debug('密码已更新')
    
    def verify_password(self, password: str) -> bool:
        """
        验证密码是否正确
        
        Args:
            password: 输入的密码字符串
            
        Returns:
            密码是否正确
        """
        import hashlib
        # 如果没有启用密码保护，直接返回 True
        if not self.is_password_protected():
            return True
            
        stored_hash = self.get('password_hash', '', section='Security')
        if not stored_hash:
            return True  # 如果没有设置密码，也返回 True
            
        input_hash = hashlib.sha256(password.encode()).hexdigest()
        return input_hash == stored_hash


    def is_auto_clean_logs_enabled(self) -> bool:
        """
        检查是否启用了日志自动清理
        
        Returns:
            是否启用日志自动清理
        """
        return self.get('auto_clean_logs', True, section='Logging')
    
    def set_auto_clean_logs(self, enabled: bool) -> None:
        """
        设置是否启用日志自动清理
        
        Args:
            enabled: 是否启用日志自动清理
        """
        self.set('auto_clean_logs', enabled, section='Logging')
        logger.debug(f'日志自动清理已{"启用" if enabled else "禁用"}')
    
    def get_log_clean_days(self) -> int:
        """
        获取日志清理周期（天数）
        
        Returns:
            日志清理周期天数
        """
        return self.get('log_clean_days', 7, section='Logging')
    
    def set_log_clean_days(self, days: int) -> None:
        """
        设置日志清理周期（天数）
        
        Args:
            days: 日志清理周期天数
        """
        self.set('log_clean_days', days, section='Logging')
        logger.debug(f'日志清理周期已设置为: {days}天')
    
    def get_last_log_clean_time(self) -> str:
        """
        获取上次日志清理时间
        
        Returns:
            上次日志清理时间字符串
        """
        return self.get('last_log_clean_time', '', section='Logging')
    
    def set_last_log_clean_time(self, time_str: str) -> None:
        """
        设置上次日志清理时间
        
        Args:
            time_str: 时间字符串
        """
        self.set('last_log_clean_time', time_str, section='Logging')
        logger.debug(f'上次日志清理时间已更新: {time_str}')
        
    def get_last_selected_group(self) -> str:
        """
        获取上次选择的小组名称
        
        Returns:
            上次选择的小组名称
        """
        return self.get('last_selected_group', '', section='UI')
    
    def set_last_selected_group(self, group_name: str) -> None:
        """
        设置上次选择的小组名称
        
        Args:
            group_name: 小组名称
        """
        self.set('last_selected_group', group_name, section='UI')
        logger.debug(f'已记住选择的小组: {group_name}')
        
    def get_group_selection_history(self) -> List[str]:
        """
        获取小组选择历史记录
        
        Returns:
            小组选择历史记录列表
        """
        history = self.get('group_selection_history', [], section='UI')
        return history if isinstance(history, list) else []
    
    def add_to_group_selection_history(self, group_name: str) -> None:
        """
        添加小组到选择历史记录
        
        Args:
            group_name: 小组名称
        """
        history = self.get_group_selection_history()
        
        # 如果已经存在，先移除
        if group_name in history:
            history.remove(group_name)
        
        # 添加到最前面
        history.insert(0, group_name)
        
        # 只保留最近的10个记录
        history = history[:10]
        
        self.set('group_selection_history', history, section='UI')
        logger.debug(f'已添加小组到选择历史: {group_name}')
        
    def clear_group_selection_history(self) -> None:
        """清除小组选择历史记录"""
        self.set('group_selection_history', [], section='UI')
        logger.debug('已清除小组选择历史记录')


# 创建全局设置实例
app_settings = Settings()
