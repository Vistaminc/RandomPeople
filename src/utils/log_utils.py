"""日志工具模块，提供日志清理和管理功能。"""
import logging
import os
import sys
import datetime
import time
from pathlib import Path


def setup_logging():
    """设置日志系统"""
    # 创建日志目录
    log_dir = Path(__file__).parent.parent.parent / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    # 配置日志格式
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # 创建日志处理器
    file_handler = logging.FileHandler(log_dir / 'app.log', encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # 减少第三方库的日志级别
    logging.getLogger('matplotlib').setLevel(logging.WARNING)
    logging.getLogger('PIL').setLevel(logging.WARNING)
    
    # 记录启动信息
    logging.info("应用程序启动")


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
    
    # 遍历日志目录中的所有文件
    for log_file in log_dir.glob('*.log*'):
        # 获取文件修改时间
        file_mtime = log_file.stat().st_mtime
        file_age_days = (current_time - file_mtime) / (60 * 60 * 24)
        
        # 如果文件超过了指定的天数，则删除
        if file_age_days > clean_days:
            try:
                # 对于当前正在使用的主日志文件，需要特殊处理
                if log_file.name == 'app.log':
                    # 记录将要清理app.log的信息
                    logging.info("正在清理当前使用的app.log文件")
                    # 关闭所有日志处理器
                    for handler in logging.root.handlers[:]:
                        handler.close()
                        logging.root.removeHandler(handler)
                    # 删除文件
                    log_file.unlink()
                    # 重新设置日志系统
                    setup_logging()
                    logging.info("已重新创建app.log文件")
                else:
                    # 删除其他日志文件
                    log_file.unlink()
                
                deleted_count += 1
                logging.debug(f"已删除旧日志文件: {log_file.name}")
            except Exception as e:
                logging.error(f"删除日志文件 {log_file.name} 失败: {str(e)}")
    
    # 更新上次清理时间
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    app_settings.set_last_log_clean_time(current_time_str)
    
    logging.info(f"日志清理完成，共删除 {deleted_count} 个旧日志文件")


def clean_all_logs():
    """清除所有日志文件
    
    删除logs目录下的所有日志文件，包括当前正在使用的app.log
    """
    from src.config.settings import app_settings
    
    # 获取日志目录
    log_dir = Path(__file__).parent.parent.parent / 'logs'
    if not log_dir.exists():
        logging.warning("日志目录不存在，无法清理")
        return False
    
    deleted_count = 0
    error_count = 0
    
    # 遍历日志目录中的所有文件
    for log_file in log_dir.glob('*.log*'):
        try:
            log_file.unlink()
            deleted_count += 1
            logging.debug(f"已删除日志文件: {log_file.name}")
        except Exception as e:
            error_count += 1
            logging.error(f"删除日志文件 {log_file.name} 失败: {str(e)}")
    
    # 更新上次清理时间
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    app_settings.set_last_log_clean_time(current_time_str)
    
    # 重新创建主日志文件
    setup_logging()
    
    logging.info(f"日志清理完成，共删除 {deleted_count} 个日志文件，失败 {error_count} 个")
    
    return deleted_count > 0