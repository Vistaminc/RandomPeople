"""日志工具模块，提供日志清理和管理功能。"""
import logging
import os
import sys
import datetime
import time
from pathlib import Path


def setup_logging():
    """设置日志系统，按日期分类记录"""
    # 创建日志目录
    log_dir = Path(__file__).parent.parent.parent / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    # 创建按日期分类的子目录
    today = datetime.datetime.now()
    daily_log_dir = log_dir / today.strftime('%Y') / today.strftime('%Y-%m')
    daily_log_dir.mkdir(parents=True, exist_ok=True)
    
    # 配置日志格式
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # 创建当日日志文件名
    today_log_file = daily_log_dir / f"app_{today.strftime('%Y-%m-%d')}.log"
    
    # 创建日志处理器
    file_handler = logging.FileHandler(today_log_file, encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    
    # 清除已有的处理器
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # 减少第三方库的日志级别
    logging.getLogger('matplotlib').setLevel(logging.WARNING)
    logging.getLogger('PIL').setLevel(logging.WARNING)
    
    # 记录启动信息
    logging.info(f"应用程序启动 - 日志文件: {today_log_file}")


def clean_old_logs():
    """清理旧的日志文件
    
    根据设置检查并删除超过指定天数的日志文件
    """
    from src.config.settings import app_settings
    
    # 检查是否启用了日志自动清理
    if not app_settings.is_auto_clean_logs_enabled():
        logging.debug("日志自动清理功能已禁用")
        return
    
    # 获取上次清理时间
    last_clean_time = app_settings.get_last_log_clean_time()
    
    # 如果有上次清理时间，检查是否需要清理
    if last_clean_time:
        try:
            # 解析上次清理时间
            last_clean_date = datetime.datetime.strptime(last_clean_time, "%Y-%m-%d %H:%M:%S")
            current_date = datetime.datetime.now()
            
            # 如果距离上次清理不到一天，则不进行清理
            if (current_date - last_clean_date).days < 1:
                logging.debug(f"上次日志清理时间为 {last_clean_time}，不需要清理")
                return
        except ValueError:
            # 如果日期格式错误，继续执行清理
            logging.warning(f"上次日志清理时间格式错误: {last_clean_time}")
    
    # 获取日志目录
    log_dir = Path(__file__).parent.parent.parent / 'logs'
    if not log_dir.exists():
        logging.warning("日志目录不存在，无法清理")
        return
    
    # 获取清理周期（天数）
    clean_days = app_settings.get_log_clean_days()
    logging.info(f"开始清理 {clean_days} 天前的日志文件")
    
    # 获取当前时间
    current_time = time.time()
    deleted_count = 0
    
    # 递归遍历日志目录中的所有文件
    for log_file in log_dir.rglob('*.log'):
        # 获取文件修改时间
        file_mtime = log_file.stat().st_mtime
        file_age_days = (current_time - file_mtime) / (60 * 60 * 24)
        
        # 如果文件超过了指定的天数，则删除
        if file_age_days > clean_days:
            try:
                log_file.unlink()
                deleted_count += 1
                logging.debug(f"已删除旧日志文件: {log_file}")
            except Exception as e:
                logging.error(f"删除日志文件 {log_file.name} 失败: {str(e)}")
    
    # 清理空的日期目录
    _cleanup_empty_directories(log_dir)
    
    # 更新上次清理时间
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    app_settings.set_last_log_clean_time(current_time_str)
    
    logging.info(f"日志清理完成，共删除 {deleted_count} 个旧日志文件")


def _cleanup_empty_directories(log_dir: Path):
    """清理空的日期目录"""
    try:
        # 遍历年份目录
        for year_dir in log_dir.glob('[0-9][0-9][0-9][0-9]'):
            if year_dir.is_dir():
                # 遍历月份目录
                for month_dir in year_dir.glob('[0-9][0-9][0-9][0-9]-[0-9][0-9]'):
                    if month_dir.is_dir() and not any(month_dir.iterdir()):
                        # 如果月份目录为空，删除它
                        month_dir.rmdir()
                        logging.debug(f"已删除空的月份目录: {month_dir}")
                
                # 如果年份目录为空，也删除它
                if not any(year_dir.iterdir()):
                    year_dir.rmdir()
                    logging.debug(f"已删除空的年份目录: {year_dir}")
    except Exception as e:
        logging.warning(f"清理空目录时出错: {str(e)}")


def clean_all_logs():
    """清除所有日志文件
    
    删除logs目录下的所有日志文件，包括按日期分类的文件
    """
    from src.config.settings import app_settings
    
    # 获取日志目录
    log_dir = Path(__file__).parent.parent.parent / 'logs'
    if not log_dir.exists():
        logging.warning("日志目录不存在，无法清理")
        return False
    
    deleted_count = 0
    error_count = 0
    
    # 递归遍历日志目录中的所有文件
    for log_file in log_dir.rglob('*.log'):
        try:
            log_file.unlink()
            deleted_count += 1
            logging.debug(f"已删除日志文件: {log_file}")
        except Exception as e:
            error_count += 1
            logging.error(f"删除日志文件 {log_file.name} 失败: {str(e)}")
    
    # 清理空的日期目录
    _cleanup_empty_directories(log_dir)
    
    # 更新上次清理时间
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    app_settings.set_last_log_clean_time(current_time_str)
    
    # 重新创建主日志文件
    setup_logging()
    
    logging.info(f"日志清理完成，共删除 {deleted_count} 个日志文件，失败 {error_count} 个")
    
    return deleted_count > 0


def get_log_statistics():
    """获取日志统计信息
    
    Returns:
        dict: 包含日志统计信息的字典
    """
    log_dir = Path(__file__).parent.parent.parent / 'logs'
    if not log_dir.exists():
        return {'total_files': 0, 'total_size': 0, 'oldest_date': None, 'newest_date': None}
    
    stats = {
        'total_files': 0,
        'total_size': 0,
        'oldest_date': None,
        'newest_date': None,
        'by_month': {}
    }
    
    # 遍历所有日志文件
    for log_file in log_dir.rglob('*.log'):
        if log_file.is_file():
            stats['total_files'] += 1
            stats['total_size'] += log_file.stat().st_size
            
            # 获取文件修改时间
            file_time = datetime.datetime.fromtimestamp(log_file.stat().st_mtime)
            
            # 更新最早和最晚日期
            if stats['oldest_date'] is None or file_time < stats['oldest_date']:
                stats['oldest_date'] = file_time
            if stats['newest_date'] is None or file_time > stats['newest_date']:
                stats['newest_date'] = file_time
            
            # 按月份统计
            month_key = file_time.strftime('%Y-%m')
            if month_key not in stats['by_month']:
                stats['by_month'][month_key] = {'files': 0, 'size': 0}
            stats['by_month'][month_key]['files'] += 1
            stats['by_month'][month_key]['size'] += log_file.stat().st_size
    
    return stats