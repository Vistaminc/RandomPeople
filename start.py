"""
随机抽奖应用程序启动脚本
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
current_dir = Path(__file__).parent
src_dir = current_dir / 'src'
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(src_dir))

# 导入主程序
from src.main import main

if __name__ == "__main__":
    sys.exit(main())
