# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

一个基于 Next.js 15 构建的 Google Docs 克隆，使用 TipTap 编辑器实现实时协作编辑，通过 Clerk 进行身份认证，后端由 Convex 驱动。

## 开发命令

```bash
npm run dev       # 启动开发服务器 (http://localhost:3000)
npm run build     # 构建生产版本
npm run start     # 启动生产服务器
npm run lint      # 运行 ESLint
```

## 架构

### 技术栈
- **框架**: Next.js 15 with App Router
- **编辑器**: TipTap (富文本编辑器，支持协作扩展)
- **认证**: Clerk (认证中间件位于 `src/middleware.ts`)
- **后端**: Convex (schema 在 `convex/schema.ts`，文档 API 在 `convex/documents.ts`)
- **状态管理**: Zustand stores (`src/store/`)
- **UI**: Radix UI 组件 (`src/components/ui/`) + Tailwind CSS
- **URL 状态**: nuqs 管理搜索参数

### 关键目录
- `src/app/(home)/` - 首页，包含文档列表和模板库
- `src/app/documents/[documentId]/` - 文档编辑页面，包含工具栏、导航栏、标尺
- `src/app/extensions/` - 自定义 TipTap 扩展（字号、行高）
- `src/components/` - 共享组件和 UI 组件库
- `src/store/` - Zustand 状态存储（编辑器状态、标尺状态、文档状态）
- `src/hooks/` - 自定义 hooks（use-debounce、use-search-param、use-toast）
- `convex/` - 后端 schema、认证配置和文档操作

### 数据模型
文档存储在 Convex 中，包含字段：`title`、`documentContent`（HTML）、`ownerId`、`leftMargin`、`rightMargin`。在 `ownerId` 上建立索引用户查询，在 `title` 上建立全文搜索索引。

### 编辑器架构
- TipTap 编辑器配置位于 `src/app/documents/[documentId]/editor.tsx`
- 自定义字号和行高扩展位于 `src/app/extensions/`
- 标尺组件用于调整每篇文档的页边距
- 防抖自动保存（2秒），支持手动 Ctrl+S 快捷键，localStorage 作为回退
- 全局编辑器状态通过 `src/store/use-editor-store.ts` 管理

### 认证流程
- Clerk 中间件保护所有路由 (`src/middleware.ts`)
- `ConvexClientProvider` 包裹应用，集成 Clerk 认证与 Convex
- 未认证用户看到登录页面；认证用户可访问应用

### URL 状态管理
- `src/app/layout.tsx` 中的 nuqs adapter 实现 URL 状态同步
- 自定义 `useSearchParam` hook 用于搜索功能
