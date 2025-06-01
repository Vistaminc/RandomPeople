"""
输入验证工具模块，提供各种输入验证函数。
"""
import re
from typing import Any, Dict, List, Optional, Tuple, Union


def is_valid_url(url: str) -> bool:
    """
    验证URL是否有效
    
    Args:
        url: 需要验证的URL字符串
        
    Returns:
        如果URL有效则返回True，否则返回False
    """
    # 简单的URL验证正则表达式
    url_pattern = re.compile(
        r'^(https?://)'  # http:// 或 https://
        r'([a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,63})'  # 域名
        r'(:[0-9]{1,5})?'  # 可选的端口
        r'(/[^/\s]*)*$'  # 路径
    )
    return bool(url_pattern.match(url))


def is_valid_file_path(path: str) -> bool:
    """
    验证文件路径是否有效（不确认文件是否存在，只检查格式）
    
    Args:
        path: 文件路径
        
    Returns:
        如果路径格式有效返回True，否则返回False
    """
    # Windows路径格式
    win_path_pattern = re.compile(
        r'^([a-zA-Z]:)?'  # 可选的盘符
        r'(\\[^\\/:*?"<>|\r\n]+)*'  # 路径分隔符和有效的路径组件
        r'\\?$'  # 可选的末尾分隔符
    )
    
    # Unix路径格式
    unix_path_pattern = re.compile(
        r'^(/[^/\0:*?"<>|\r\n]+)*'  # 路径分隔符和有效的路径组件
        r'/?$'  # 可选的末尾分隔符
    )
    
    return bool(win_path_pattern.match(path) or unix_path_pattern.match(path))


def is_positive_integer(value: Union[str, int, float]) -> bool:
    """
    验证值是否为正整数
    
    Args:
        value: 需要验证的值
        
    Returns:
        如果值是正整数返回True，否则返回False
    """
    try:
        num = int(value)
        return num > 0
    except (ValueError, TypeError):
        return False


def is_non_negative_integer(value: Union[str, int, float]) -> bool:
    """
    验证值是否为非负整数
    
    Args:
        value: 需要验证的值
        
    Returns:
        如果值是非负整数返回True，否则返回False
    """
    try:
        num = int(value)
        return num >= 0
    except (ValueError, TypeError):
        return False


def is_positive_float(value: Union[str, int, float]) -> bool:
    """
    验证值是否为正浮点数
    
    Args:
        value: 需要验证的值
        
    Returns:
        如果值是正浮点数返回True，否则返回False
    """
    try:
        num = float(value)
        return num > 0
    except (ValueError, TypeError):
        return False


def is_valid_weight(value: Union[str, int, float]) -> bool:
    """
    验证值是否为有效的权重值（非负数）
    
    Args:
        value: 需要验证的值
        
    Returns:
        如果值是有效的权重值返回True，否则返回False
    """
    try:
        num = float(value)
        return num >= 0
    except (ValueError, TypeError):
        return False


def is_valid_name(name: str) -> bool:
    """
    验证姓名是否有效（不为空且不含特殊字符）
    
    Args:
        name: 需要验证的姓名
        
    Returns:
        如果姓名有效返回True，否则返回False
    """
    if not name or not name.strip():
        return False
    
    # 姓名中不应含有的特殊字符
    invalid_chars = r'[<>/\\:*?"|\x00-\x1F\x7F]'
    
    return not bool(re.search(invalid_chars, name))


def is_valid_csv_format(header: List[str]) -> bool:
    """
    验证CSV文件的表头格式是否有效
    
    Args:
        header: CSV文件的表头列表
        
    Returns:
        如果表头格式有效返回True，否则返回False
    """
    # 至少需要有一个字段（名称）
    if not header or len(header) == 0:
        return False
    
    # 如果有两个字段，第二个应该是权重
    if len(header) >= 2:
        # 只做简单检查，不强制要求特定的名称
        return True
    
    return True


def format_name_for_display(name: str, max_length: int = 10) -> str:
    """
    格式化名称以便在UI中显示
    
    Args:
        name: 原始名称
        max_length: 最大显示长度
        
    Returns:
        格式化后的名称
    """
    if len(name) <= max_length:
        return name
    
    return name[:max_length] + '...'
