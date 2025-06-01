# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

# 添加所有需要包含的资源文件
added_files = [
    ('src/assets/icons/*', 'src/assets/icons'),
    ('src/ui/styles/*', 'src/ui/styles'),  # 包含样式表文件
    ('src/config/*.py', 'src/config'),  # 包含配置模块
    ('picture/*.png', 'picture'),  # 包含图片资源
]

a = Analysis(
    ['start.py'],  # 使用start.py作为入口点
    pathex=[],
    binaries=[],
    datas=added_files,
    # 不需要手动添加二进制文件，将使用更完整的导入方式
    hiddenimports=[
        # 核心Qt模块 - 增加全面的PySide6依赖
        'PySide6',
        'PySide6.QtCore', 
        'PySide6.QtGui', 
        'PySide6.QtWidgets',
        'PySide6.QtSvg',  # 支持SVG图标
        'PySide6.QtCharts',
        'PySide6.QtUiTools',
        
        # 数据处理模块
        'pandas',  # 处理表格数据
        'openpyxl',  # Excel支持
        'json',  # JSON文件支持
        
        # 项目自有模块
        'src.config.settings',
        'src.ui.main_window',
        'src.ui.settings_dialog',
    ],
    hookspath=['.'],  # 从当前目录加载hook文件
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(
    a.pure, 
    a.zipped_data,
    cipher=block_cipher
)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='RandomPeople',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # 设置为False以隐藏控制台窗口
    # 暂时移除图标设置以解决格式问题
    # icon='src/icon.ico',  # PNG格式不被Windows平台支持，需要.ico格式
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='RandomPeople',
)
