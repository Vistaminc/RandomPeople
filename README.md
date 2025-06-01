<div align="center">

# 🎲 随机抽奖系统 V2.0.1

<img src="src/assets/icons/app_icon.png" width="128" height="128">

*一个现代化的随机抽奖应用程序，基于 PySide6 和 PyOneDark 主题*

![Python](https://img.shields.io/badge/Python-≥3.10-blue?logo=python&logoColor=white)
![PySide6](https://img.shields.io/badge/PySide6-≥6.5.0-green?logo=qt&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-2.0.0-orange)

</div>

## 📝 功能概述

这是一个功能全面的随机抽奖系统，专为各类抽奖活动设计，包括课堂点名、活动抽奖等多种场景。

## ✨ 功能特点

- **多种抽奖模式** 
  - 🎯 **等概率抽奖**: 每个候选者有相同的概率被抽中
  - ⚖️ **权重抽奖**: 根据设定的权重值决定被抽中的概率
  - 🔄 **可重复抽取**: 可选择是否允许重复抽取已选中的候选者

- **多样化数据源** 
  - 📂 **本地文件导入**: 支持从本地文件导入候选者名单
  - 🌐 **远程URL导入**: 支持从远程URL获取候选者名单
  - 📊 **多种文件格式**: 支持CSV、TXT、Excel、JSON等多种格式

- **用户体验增强** 
  - ✅ **动画效果**: 流畅的滚动和过渡动画增强视觉体验
  - 🔊 **音效反馈**: 抽奖过程中的音效提示
  - 🌓 **暗色/亮色主题**: 支持切换界面主题模式
  - 🎨 **自定义主题颜色**: 可自定义界面主要颜色

- **高级功能** 
  - 🔐 **密码保护**: 可为设置界面设置密码保护
  - ⚙️ **自定义参数**: 支持添加自定义参数扩展功能
  - 👥 **分组管理**: 支持创建和管理多个候选者组
  - 🔒 **离线运行**: 支持在无网络环境下完全正常运行

## 📄 文件格式支持

应用程序支持以下文件格式：

| 格式 | 说明 |
|------|------|
| **CSV** | 第一列为名字，第二列为权重（可选） |
| **TXT** | 每行一个名字，可以用空格、逗号或制表符分隔名字和权重 |
| **Excel** | 第一列为名字，第二列为权重（可选） |
| **JSON** | 支持列表格式 `["名字1", "名字2"]` 或字典格式 `{"名字1": 权重1, "名字2": 权重2}` |

## 🚀 快速开始

1. 确保安装了Python 3.10或更高版本
2. 安装依赖: `pip install -r requirements.txt`
3. 启动应用: `python start.py`

## 🛠️ 设置选项

应用程序提供多种设置选项，可通过点击主界面上的设置按钮访问：

- **文件设置**: 管理本地和远程数据源
- **抽奖设置**: 配置抽奖模式、数量和行为
- **界面设置**: 自定义主题和颜色
- **自定义参数**: 添加扩展参数
- **安全设置**: 配置密码保护

## 📱 截图

<div align="center">
<img src="picture/image.png" alt="应用程序界面截图" width="80%">
<p><i>随机抽奖系统 V2.0 界面预览</i></p>
</div>

## 安装和运行

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行程序

```bash
python start.py
```

## 使用说明

1. **添加名单文件**:
   - 点击"设置"按钮，在"文件设置"选项卡中添加本地文件或远程URL
   - 或者点击主界面的"加载文件"按钮直接选择文件

2. **配置抽奖参数**:
   - 在"抽奖设置"选项卡中选择抽奖模式（等概率或权重模式）
   - 设置抽取人数和是否允许重复抽取

3. **开始抽奖**:
   - 在主界面选择要使用的名单文件
   - 设置抽取人数
   - 点击"开始抽奖"按钮

4. **自定义参数**:
   - 在"自定义参数"选项卡中添加自定义参数和值

## 项目结构

```
random-v2.0/
├── src/                  # 源代码目录
│   ├── main.py           # 主程序入口
│   ├── config/           # 配置文件
│   │   ├── constants.py  # 常量定义
│   │   └── settings.py   # 应用设置
│   ├── ui/               # UI相关
│   │   ├── styles/       # 样式表
│   │   ├── widgets/      # 自定义控件
│   │   ├── main_window.py # 主窗口
│   │   └── settings_dialog.py # 设置对话框
│   └── utils/            # 工具函数
│       ├── animation.py  # 动画效果
│       ├── data_parser.py # 数据解析
│       ├── lottery_engine.py # 抽奖引擎
│       └── validator.py  # 输入验证
├── requirements.txt      # 项目依赖
├── start.py              # 启动脚本
└── README.md             # 项目说明
```

## 💻 开发环境

| 依赖项 | 版本要求 |
|-------|---------|
| Python | ≥ 3.10 |
| PySide6 | ≥ 6.5.0 |
| pandas | ≥ 2.0.0 |
| requests | ≥ 2.28.0 |
| openpyxl | ≥ 3.1.0 |

完整依赖列表请参见 [requirements.txt](requirements.txt)

## 📋 数据格式示例

### CSV 示例

```csv
姓名,权重
张三,10
李四,5
王五,7
```

### JSON 示例

```json
{
  "张三": 10,
  "李四": 5,
  "王五": 7
}
```

```json
["张三", "李四", "王五"]
```


### 其他建议添加的部分

```markdown
## 🔧 常见问题解答

1. **Q: 如何启用密码保护功能？**  
   A: 在设置界面中，切换到"安全设置"选项卡，勾选"启用密码保护"并设置您的密码。

2. **Q: 是否支持分组抽奖？**  
   A: 支持。您可以在设置界面中创建多个候选者组，并在主界面选择使用哪个组进行抽奖。

3. **Q: 如何自定义界面颜色？**  
   A: 在设置界面的"界面设置"选项卡中，您可以点击各个颜色方块来自定义界面主题颜色。

## 🤝 贡献指南

欢迎贡献代码、提交问题报告或功能建议。请遵循以下步骤：

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目基于MIT许可证开源
