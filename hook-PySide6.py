# PyInstaller hook文件，用于正确处理PySide6依赖
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# 收集PySide6所有子模块
hiddenimports = collect_submodules('PySide6')

# 收集所有数据文件
datas = collect_data_files('PySide6')
