# JYGit - 桌面 Git 可视化管理工具

## 项目简介

JYGit 是一个基于 Electron + React + TypeScript 开发的桌面 Git 可视化管理工具，旨在提供简洁、高效的 Git 操作体验。

## 技术栈

- **框架**: Electron 28.x
- **前端**: React 18 + TypeScript
- **构建工具**: Electron Vite
- **样式**: TailwindCSS
- **Git 操作**: simple-git
- **UI 组件**: 自定义组件
- **路由**: React Router DOM
- **Hooks**: ahooks

## 功能特性

### 已实现功能
- 项目基础架构搭建

### 计划功能
- [ ] 仓库管理（打开、创建、克隆）
- [ ] 文件变更查看
- [ ] 暂存区操作
- [ ] 提交历史查看
- [ ] 分支管理
- [ ] 远程仓库操作
- [ ] 差异对比
- [ ] 冲突解决
- [ ] 标签管理
- [ ] 主题切换

## 开发指南

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 打包应用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 项目结构

```
JYGit/
├── src/
│   ├── main/              # 主进程
│   │   └── index.ts
│   ├── preload/           # 预加载脚本
│   │   ├── index.ts
│   │   └── index.d.ts
│   └── renderer/          # 渲染进程
│       ├── src/
│       │   ├── main.tsx   # 入口文件
│       │   ├── App.tsx    # 根组件
│       │   └── assets/    # 静态资源
│       └── tsconfig.json
├── index.html             # HTML 模板
├── electron.vite.config.ts # Electron Vite 配置
├── tsconfig.json          # TypeScript 配置
├── tsconfig.node.json     # Node TypeScript 配置
├── tailwind.config.js     # TailwindCSS 配置
├── postcss.config.js      # PostCSS 配置
└── package.json
```

## 开发进度

详见 [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

老王

## 更新日志

### v1.0.0 (开发中)
- 初始化项目
- 搭建基础架构
