# Yjs + Hocuspocus 接入草案

## 目标

在当前 `Next.js + Clerk + Convex + TipTap` 项目上增加最小可用协同编辑能力：

- 多用户同时编辑同一文档
- `owner / editor` 可写
- `viewer` 只读
- 保留现有 `Convex` 文档权限模型

## 当前边界

当前项目已经具备：

- `Clerk` 登录
- `Convex` 文档与成员权限
- `owner / editor / viewer`
- 单人编辑器和自动保存

当前还不具备：

- `Yjs` 文档同步
- `Hocuspocus` 协同服务
- 协同连接鉴权
- 多人同时编辑与冲突合并

## 推荐架构

```text
Clerk
  -> 用户登录
  -> 提供当前用户身份

Convex
  -> documents
  -> documentMembers
  -> owner/editor/viewer 权限判断

Next.js API / server route
  -> 生成协同连接 token

Hocuspocus
  -> WebSocket 协同服务
  -> 连接鉴权
  -> 只读/可写控制
  -> Yjs 文档持久化

TipTap + Yjs
  -> 富文本编辑
  -> 实时同步
  -> 冲突自动合并
```

## 最小版本的职责分工

### Clerk

- 确认“当前是谁”
- 给 Next.js 服务端提供 session 身份

### Convex

- 确认“当前用户对这个文档有什么角色”
- 继续作为文档业务数据层
- 继续维护 `documentMembers`

### Next.js 服务端接口

- 接收当前用户请求
- 查询 Convex 权限
- 签发一个短时协同 token 给前端

### Hocuspocus

- 校验短时 token
- 判断当前用户是否允许进入文档房间
- 根据角色决定：
  - `owner/editor`：可写
  - `viewer`：只读

### TipTap + Yjs

- 将当前编辑器内容转为协同文档
- 用 provider 连接到 Hocuspocus

## 目录建议

建议新增：

```text
src/
  app/
    api/
      collaboration-token/
        route.ts

hocuspocus/
  server.ts
  auth.ts
  persistence.ts
```

说明：

- `src/app/api/collaboration-token/route.ts`
  - 负责签发协同 token
- `hocuspocus/server.ts`
  - 启动 Hocuspocus 服务
- `hocuspocus/auth.ts`
  - 负责 token 校验和权限判断
- `hocuspocus/persistence.ts`
  - 负责文档状态持久化

## 连接流程

```text
1. 用户打开文档页
2. 前端通过 Clerk 维持登录态
3. 前端请求 /api/collaboration-token?documentId=...
4. 服务端读取当前用户身份
5. 服务端调用 Convex，确认文档角色
6. 服务端签发短时 token
7. 前端用 token 连接 Hocuspocus
8. Hocuspocus 验证 token
9. Hocuspocus 根据角色设置只读/可写
10. TipTap 通过 Yjs 同步内容
```

## Token 内容建议

建议 token 至少包含：

- `documentId`
- `userId`
- `role`
- `exp`

注意：

- `role` 虽然可以写进 token，但 Hocuspocus 最稳妥的做法仍然是二次校验
- token 过期时间建议很短，例如 5 到 10 分钟

## 持久化策略

最小版本建议：

- 协同主数据存到 `Yjs document`
- 继续保留 `documents.documentContent`
- 在文档空闲或定时同步时，把协同内容导出一份 HTML 快照回写到 `documents.documentContent`

原因：

- 兼容当前页面逻辑
- 出问题时还能回退
- 迁移成本最低

## 前端改造重点

### 现有 [editor.tsx](d:/Code/Frontend/docs-clone/src/app/documents/[documentId]/editor.tsx)

当前：

- `content: documentContent`
- `onUpdate` 后 debounce 保存 HTML

未来：

- 由 `Y.Doc` 驱动内容
- `Collaboration` 扩展替换当前单人保存流
- 保留 HTML 快照更新逻辑，但降级为辅助持久化

### 可分两步改

第一步：

- 接入 `Yjs + Hocuspocus provider`
- 先让多人同步跑起来
- 暂时保留现有 `documentContent` 作为初始化内容

第二步：

- 去掉“每次输入都直接写 `documentContent`”
- 改为从协同状态导出快照

## 权限控制要求

必须同时做两层：

### 1. Convex 层

- `viewer` 禁止修改内容
- `editor/owner` 才能写

### 2. Hocuspocus 层

- `viewer` 连接成功但只读
- `editor/owner` 可写
- 非成员拒绝连接

## 第一阶段落地目标

先做一个最小协同版本：

- 同一文档两个浏览器可同时编辑
- 内容能实时同步
- viewer 只读
- editor/owner 可编辑

暂时不做：

- 评论
- 历史版本
- 复杂 presence
- 协同光标美化

## 下一步实现建议

建议代码顺序：

1. 安装 `yjs`、`@hocuspocus/provider`
2. 新增 `/api/collaboration-token`
3. 搭建 `hocuspocus/server.ts`
4. 在 `editor.tsx` 里接 provider
5. 验证 owner/editor/viewer 三种权限
