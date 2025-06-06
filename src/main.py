"""随机抽奖应用程序入口文件"""
import logging
import sys
from pathlib import Path

from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QIcon

# 添加项目根目录到系统路径，确保能正确导入模块
sys.path.insert(0, str(Path(__file__).parent.parent))

# 导入日志工具
from src.utils.log_utils import setup_logging, clean_old_logs

# 导入主窗口
from src.ui.main_window import MainWindow


def main():
    """主函数"""
    # 设置日志
    setup_logging()
    
    # 清理旧日志
    clean_old_logs()
    
    # 创建应用程序
    app = QApplication(sys.argv)
    app.setApplicationName("随机抽奖系统")
    
    # 设置应用图标
    icon_path = Path(__file__).parent / 'icon.png'
    app_icon = QIcon(str(icon_path))
    app.setWindowIcon(app_icon)
    
    # 创建主窗口
    window = MainWindow()
    window.setWindowIcon(app_icon)
    window.show()
    
    # 运行应用程序
    exit_code = app.exec()
    
    # 记录退出信息
    logging.info(f"应用程序退出，代码: {exit_code}")
    
    # 返回退出代码
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
