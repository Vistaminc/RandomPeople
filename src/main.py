"""
随机抽奖应用程序入口文件
"""
import logging
import os
import sys
from pathlib import Path

from PySide6.QtWidgets import QApplication

# 添加项目根目录到系统路径，确保能正确导入模块
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ui.main_window import MainWindow


# 设置日志记录
def setup_logging():
    """设置日志系统"""
    # 创建日志目录
    log_dir = Path(__file__).parent.parent / 'logs'
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


def main():
    """主函数"""
    # 设置日志
    setup_logging()
    
    # 创建应用程序
    app = QApplication(sys.argv)
    app.setApplicationName("随机抽奖系统")
    
    # 创建主窗口
    window = MainWindow()
    window.show()
    
    # 运行应用程序
    exit_code = app.exec()
    
    # 记录退出信息
    logging.info(f"应用程序退出，代码: {exit_code}")
    
    # 返回退出代码
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
