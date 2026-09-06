# Docs Clone — 实时协作文档

## 📖 项目介绍

Docs Clone 是一个现代化的在线文档协作平台，专为个人与团队打造。它不仅是一个文档编辑器，更是一个支持多人实时协作、离线编辑与断线重连的完整文档工作台。基于 TipTap 提供丰富的富文本编辑能力，通过 Yjs 与 Hocuspocus 实现毫秒级的协同同步，配合完善的角色权限体系，让文档的创建、分享与协作高效流畅。

## 🎯 核心特色

📝 富文本编辑 - 标题、字体字号、颜色高亮、对齐方式、列表、表格、可缩放图片、链接，一应俱全
👥 实时协作编辑 - 多人同时编辑同一文档，协作光标实时展示每位协作者的位置与姓名
🔐 分享与权限 - 邮件邀请协作者，支持 owner / editor / viewer 三种角色，viewer 服务端强制只读
🚀 离线编辑与恢复 - y-indexeddb 本地缓存，断线后编辑不丢失，重连自动合并增量
🗄 双通道持久化 - 内容同时写入 Convex（HTML 快照 + Yjs state 双备份），随时可恢复
📐 类 Docs 页面排版 - 页眉导航栏、工具栏、标尺拖拽调节左右页边距、页宽限制
🔍 全文搜索与模板库 - 快速检索文档，内置多种模板一键建文
🎨 现代化界面 - 响应式设计、优雅交互，认证路由全程保护

## 🛠 技术栈

| 领域 | 技术 |
| --- | --- |
| 框架 | Next.js 15 (App Router) + React 19 |
| 编辑器 | TipTap 2 + `@tiptap/extension-collaboration` |
| 协同 | Yjs 13 + Hocuspocus 3 (WebSocket) |
| 认证 | Clerk |
| 后端 | Convex (含全文搜索索引) |
| 状态管理 | Zustand |
| 本地持久化 | y-indexeddb (IndexedDB) |
| 样式 / UI | Tailwind CSS + Radix UI + shadcn 风格组件 |
| URL 状态 | nuqs |

## 🏗 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 前端                                                │
│  ┌──────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │ TipTap 编辑器 │  │ 协作光标/用户列表 │  │ 首页/文档列表/模板/搜索 │ │
│  └─────┬────┘  └───────┬───────┘  └──────────┬────────────┘ │
│        │                │                     │              │
└────────┼────────────────┼─────────────────────┼──────────────┘
         │ WS (鉴权 token)  │                     │ HTTP
         ▼                 ▼                     ▼
┌──────────────────────┐            ┌─────────────────────────┐
│ Hocuspocus 协同服务器 │            │ Convex(数据库/鉴权/全文搜索)│
│ (独立进程, port 1234) │            │ · documents             │
│ · onLoadDocument     │◄─── 存取 ───│ · documentMembers       │
│ · onStoreDocument    │ Yjs state  │ · 文档元数据 + HTML 快照  │
└──────────────────────┘            └─────────────────────────┘
         ▲
         │ 同一浏览器内
┌────────┴─────────┐
│ y-indexeddb 本地缓存│  ← 离线编辑,重连后自动 merge
└──────────────────┘
```

**协同流程**:多个客户端通过 WebSocket 连接到 Hocuspocus 服务器,各自持有 Yjs 文档的本地副本(同时镜像到 IndexedDB)。任一客户端编辑产生 CRDT 更新,经 WebSocket 广播给其他人;服务器定期将完整 Yjs state 快照写入 Convex;客户端离线时本地编辑暂存 IndexedDB,重连后与服务端 state 自动合并。

> 更深入的设计说明见 [`文档/`](文档/) 目录下的多篇中文笔记(协同实现、离线与数据恢复、断线重连与增量同步、Hocuspocus + Yjs 说明等)。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- 一个 [Clerk](https://clerk.com) 应用
- 一个 [Convex](https://convex.dev) 项目(开发模式可直接本地运行)

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制以下变量到 `.env.local`:

```bash
# ---- Clerk 认证 ----
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# ---- Convex ----
NEXT_PUBLIC_CONVEX_URL=
CONVEX_ADMIN_KEY=            # 协服务器写库需要(或使用 HOCUSPOCUS_CONVEX_ADMIN_KEY)

# ---- 协同(签名 WebSocket 连接 token 用,前后端必须一致)----
COLLABORATION_SECRET=

# ---- Hocuspocus 协同服务器 ----
NEXT_PUBLIC_HOCUSPOCUS_URL=ws://localhost:1234
HOCUSPOCUS_PORT=1234         # 可选,默认 1234
HOCUSPOCUS_CONVEX_ADMIN_KEY= # 可选,不设置时回退到 CONVEX_ADMIN_KEY
```

### 3. 启动三个进程

| 进程 | 命令 | 说明 |
| --- | --- | --- |
| Convex | `npx convex dev` | 本地后端 + schema 部署 |
| 协同服务器 | `npm run collab:dev` | Hocuspocus WebSocket 服务器(独立 Node 进程) |
| Next.js | `npm run dev` | 前端应用,打开 http://localhost:3000 |

## 📁 目录结构

```
├── src/
│   ├── app/
│   │   ├── (home)/                  # 首页:文档列表、搜索、模板库
│   │   ├── documents/[documentId]/  # 文档编辑页
│   │   │   ├── editor.tsx           # TipTap 编辑器与协同接入
│   │   │   ├── toolbar.tsx          # 工具栏
│   │   │   ├── ruler.tsx            # 页边距标尺
│   │   │   ├── navbar.tsx           # 顶部导航(标题、协作者、分享)
│   │   │   ├── share-dialog.tsx     # 分享/权限对话框
│   │   │   ├── document.tsx / page.tsx
│   │   ├── api/                     # 路由 API(分享、协作 token 等)
│   │   ├── extensions/              # 自定义 TipTap 扩展(字号、行高)
│   │   ├── layout.tsx               # nuqs URL 状态适配
│   │   └── middleware.ts            # Clerk 路由保护(实际位于 src/)
│   ├── components/                  # 共享组件 + Radix UI 组件库
│   ├── hooks/                       # use-debounce / use-toast 等
│   ├── store/                       # Zustand:编辑器、标尺、文档状态
│   └── lib/
│       ├── collaboration-token.ts   # 协同 WS token 签发/校验(JWT)
│       └── yjs-local-persistence.ts # IndexedDB 本地持久化与恢复
├── convex/
│   ├── schema.ts                    # documents + documentMembers
│   ├── documents.ts                 # 文档 CRUD API
│   ├── documentMembers.ts           # 成员/分享 API
│   └── lib/documentPermissions.ts   # 权限检查
├── hocuspocus/
│   ├── server.ts                    # Hocuspocus 服务器(鉴权/加载/存储)
│   └── persistence.ts               # Yjs state ↔ Convex 存取
└── 文档/                             # 各阶段实现笔记
```


## 📜 常用命令

```bash
npm run dev          # 开发服务器 (http://localhost:3000)
npm run collab:dev   # 启动 Hocuspocus 协同服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
```
