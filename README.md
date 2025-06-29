<div align="center">

# 🌟 StarRandom - 星抽奖系统

<img src="icons/icon.png" width="128" height="128" alt="StarRandom Logo">

*一个基于 Tauri + Next.js + React 构建的现代化跨平台抽奖应用*

[![Version](https://img.shields.io/badge/Version-1.0.7-brightgreen?style=flat-square)](https://github.com/vistaminc/StarRandom)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0.html)
[![Tauri](https://img.shields.io/badge/Tauri-2.5.0-orange?style=flat-square&logo=tauri)](https://tauri.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[🚀 下载应用](#-下载安装) • [📖 使用指南](#-使用指南) • [🛠️ 开发文档](#-开发环境) • [🤝 贡献代码](#-贡献指南)

</div>

---

## 📋 项目简介

**StarRandom（星抽奖系统）** 是一个功能强大的现代化抽奖应用程序，专为各类抽奖活动设计。无论是课堂点名、活动抽奖、团队分组还是游戏娱乐，StarRandom 都能为您提供公平、高效、美观的抽奖体验。

### 🎯 核心特色

- **🎲 多种抽奖模式** - 支持等概率抽奖、权重抽奖、可重复抽取等多种模式
- **📱 跨平台支持** - 基于 Tauri 构建，支持 Windows、macOS、Linux 系统
- **🎨 现代化界面** - 基于 Next.js + React + Tailwind CSS，提供流畅的用户体验
- **📊 灵活数据源** - 支持 CSV、TXT、JSON 等多种文件格式
- **🔒 数据安全** - 本地存储，保护用户隐私
- **⚡ 高性能** - 使用 Rust 后端，确保应用快速响应

---

## ✨ 功能特点

### 🎪 抽奖功能
- **等概率抽奖** - 每个参与者拥有相同的中奖概率
- **权重抽奖** - 根据设定的权重值调整中奖概率
- **批量抽奖** - 支持一次抽取多个获奖者
- **重复抽取** - 可选择是否允许重复中奖
- **实时统计** - 显示剩余人数和抽奖进度

### 📁 数据管理
- **多格式支持** - CSV、TXT、JSON 文件导入
- **智能解析** - 自动识别姓名和权重数据
- **小组管理** - 创建和管理多个参与者组
- **历史记录** - 保存抽奖历史和结果

### 🎨 界面体验
- **响应式设计** - 适配不同屏幕尺寸
- **主题切换** - 支持明暗主题切换
- **动画效果** - 流畅的抽奖动画和过渡效果
- **教育布局** - 专为课堂大屏幕（seewo等）优化的显示模式

### 🔧 高级设置
- **自定义配置** - 灵活的抽奖参数设置
- **数据导出** - 支持结果导出功能
- **快捷操作** - 便捷的快捷键和操作方式
- **安全保护** - 可选的密码保护功能

---

## 🚀 下载安装

### 系统要求

| 系统 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Windows | Windows 10 | Windows 11 |
| macOS | macOS 10.15 | macOS 12+ |
| Linux | Ubuntu 18.04 | Ubuntu 20.04+ |

### 安装方式

#### 方式一：下载预编译版本
1. 访问 [Releases 页面](https://github.com/vistaminc/StarRandom/releases)
2. 下载适合您系统的安装包
3. 按照安装向导完成安装

#### 方式二：从源码构建
```bash
# 克隆仓库
git clone https://github.com/vistaminc/StarRandom.git
cd StarRandom

# 安装依赖
pnpm install

# 开发模式运行
pnpm run tauri:dev

# 构建生产版本
pnpm run tauri:build
```

---

## 📖 使用指南

### 快速开始

1. **启动应用** - 双击桌面图标或从开始菜单启动
2. **导入数据** - 点击"上传文件"按钮选择参与者名单
3. **配置抽奖** - 设置抽奖人数和抽奖模式
4. **开始抽奖** - 点击"开始抽奖"按钮开始抽奖
5. **查看结果** - 查看抽奖结果并可选择导出

### 文件格式说明

#### CSV 格式示例
```csv
姓名,权重
张三,10
李四,5
王五,8
```

#### TXT 格式示例
```txt
张三 10
李四 5
王五 8
```

#### JSON 格式示例
```json
{
  "张三": 10,
  "李四": 5,
  "王五": 8
}
```

或者简单数组格式：
```json
["张三", "李四", "王五"]
```

### 高级功能

#### 小组管理
- 创建多个参与者小组
- 快速切换不同小组
- 保存小组配置

#### 历史记录
- 自动保存抽奖历史
- 按日期分类管理
- 支持历史记录导出

#### 自定义设置
- 界面主题切换
- 抽奖动画设置
- 音效开关控制

---

## 🛠️ 开发环境

### 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **前端框架** | Next.js 15.1.5 | React 全栈框架 |
| **UI 库** | React 18.2.0 | 用户界面库 |
| **样式框架** | Tailwind CSS 3.3.0 | 原子化 CSS 框架 |
| **桌面框架** | Tauri 2.5.0 | 跨平台桌面应用框架 |
| **后端语言** | Rust | 高性能系统编程语言 |
| **包管理器** | pnpm | 快速、节省磁盘空间的包管理器 |
| **类型检查** | TypeScript 5.0 | JavaScript 的超集 |

### 开发依赖

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.5.0",
    "next": "15.1.5",
    "react": "18.2.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.5.0",
    "typescript": "^5",
    "tailwindcss": "^3.3.0"
  }
}
```

### 本地开发

```bash
# 克隆项目
git clone https://github.com/vistaminc/StarRandom.git
cd StarRandom

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 启动 Tauri 开发模式
pnpm run tauri:dev

# 构建生产版本
pnpm run build
pnpm run tauri:build
```

### 项目结构

```
StarRandom/
├── src/                    # 前端源代码
│   ├── app/               # Next.js 应用路由
│   ├── components/        # React 组件
│   ├── lib/              # 工具库和配置
│   └── types/            # TypeScript 类型定义
├── src-tauri/            # Tauri 后端代码
│   ├── src/              # Rust 源代码
│   ├── icons/            # 应用图标
│   └── tauri.conf.json   # Tauri 配置文件
├── public/               # 静态资源
├── icons/                # 应用图标资源
└── package.json          # 项目配置
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告问题、提出建议还是提交代码，都对项目的发展有很大帮助。

### 贡献方式

1. **报告问题** - 在 [Issues](https://github.com/vistaminc/StarRandom/issues) 页面报告 Bug
2. **功能建议** - 提出新功能的想法和建议
3. **代码贡献** - 提交 Pull Request 改进代码
4. **文档完善** - 帮助改进项目文档

### 开发流程

1. **Fork 项目** - 点击右上角的 Fork 按钮
2. **创建分支** - `git checkout -b feature/your-feature-name`
3. **提交更改** - `git commit -m 'Add some feature'`
4. **推送分支** - `git push origin feature/your-feature-name`
5. **创建 PR** - 在 GitHub 上创建 Pull Request

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 提交前运行 `pnpm run lint` 检查代码
- 编写清晰的提交信息

---

## 📄 许可证

本项目采用 **GNU General Public License v3.0** 许可证。

### 许可证摘要

- ✅ **商业使用** - 允许商业使用
- ✅ **分发** - 允许分发
- ✅ **修改** - 允许修改
- ✅ **专利使用** - 提供专利使用权
- ✅ **私人使用** - 允许私人使用
- ❌ **责任** - 不承担责任
- ❌ **保证** - 不提供保证
- ⚠️ **披露源码** - 分发时必须披露源码
- ⚠️ **许可证和版权声明** - 必须包含许可证和版权声明
- ⚠️ **相同许可证** - 衍生作品必须使用相同许可证

详细许可证内容请查看 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

感谢以下开源项目和贡献者：

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Lucide React](https://lucide.dev/) - 图标库
- [Framer Motion](https://www.framer.com/motion/) - 动画库

---

## 📞 联系我们

- **项目主页**: [https://github.com/vistaminc/StarRandom](https://github.com/vistaminc/StarRandom)
- **问题反馈**: [GitHub Issues](https://github.com/vistaminc/StarRandom/issues)
- **开发者**: [vistamin/vistaminc](https://github.com/vistaminc)
- **版权所有**: © 2025 河南星熠寻光科技有限公司 & vistamin

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by [vistamin](https://github.com/vistaminc)

</div>
