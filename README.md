# JYGit

> 基于Electron+React技术栈的桌面Git可视化管理工具  
> 100%复刻腾讯Ugit的完整功能

## 项目简介

JYGit是一个功能完整的Git可视化管理工具,提供直观的界面来管理Git仓库,包括:

- 📦 仓库克隆与管理
- 🌿 分支创建、切换、合并
- 📝 提交历史可视化
- 🔀 冲突解决与合并
- 📊 差异对比查看
- 🏷️ 标签管理
- 🌐 远程仓库管理

## 技术栈

- **主框架**: electron-vite
- **UI层**: React 18+ (函数组件 + Hooks)
- **样式**: TailwindCSS 3+
- **工具库**: ahooks
- **日期处理**: dayjs
- **路由**: react-router-dom v6
- **Git操作**: simple-git
- **开发语言**: TypeScript 5+

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git >= 2.30.0

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

### 构建

```bash
# 构建所有平台
pnpm build

# 构建特定平台
pnpm build:win   # Windows
pnpm build:mac   # macOS
pnpm build:linux # Linux
```

## 文档

完整的开发文档位于`/docs/mds`目录:

- [00-开发指南.md](./docs/mds/00-开发指南.md) - **必读** 快速开始和开发流程
- [01-架构设计.md](./docs/mds/01-架构设计.md) - **必读** 整体架构和设计原则
- [02-核心功能模块接口设计.md](./docs/mds/02-核心功能模块接口设计.md) - 所有功能模块的接口定义
- [03-关键页面组件结构说明.md](./docs/mds/03-关键页面组件结构说明.md) - UI组件实现指南
- [04-GitSDK设计文档.md](./docs/mds/04-GitSDK设计文档.md) - Git SDK详细设计

## 项目结构

```
JYGit/
├── docs/               # 📚 文档
│   ├── imgs/          # 设计图
│   └── mds/           # 开发文档
├── src/
│   ├── main/          # 🔧 主进程
│   ├── renderer/      # 🎨 渲染进程
│   ├── sdk/           # 📦 Git SDK
│   └── preload/       # ⚡ 预加载脚本
├── package.json
└── README.md
```

## 开发规范

### Git提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具变动
```

### 代码规范

- 使用TypeScript严格模式
- 使用ahooks的useReactive管理状态(禁止useState)
- 使用useMemoizedFn优化函数
- 使用TailwindCSS编写样式
- 遵循SOLID原则

## 性能目标

- 提交历史加载: <1.2s (1000+提交)
- 文件树渲染: <500ms (10000+文件)
- 冲突合并响应: <500ms
- 内存占用峰值: <200MB (1000+文件仓库)

## License

MIT

---

**Made with ❤️ by 老王**
