# Hocuspocus + Yjs 协同说明

## 这套协同是怎么工作的

当前项目的协同链路是：

- `Clerk`
  - 负责登录和用户身份
- `Convex`
  - 负责文档数据
  - 负责 `owner / editor / viewer` 权限
- `Next.js API`
  - 负责生成 collaboration token
- `Hocuspocus`
  - 负责 WebSocket 协同服务
  - 负责连接鉴权
  - 负责只读/可写控制
- `Yjs`
  - 负责文档 CRDT 状态
  - 负责多人实时同步和冲突合并
- `TipTap`
  - 负责编辑器界面

## 如何启动协同

先在 [.env.local](d:/Code/Frontend/docs-clone/.env.local) 中配置：

```env
NEXT_PUBLIC_HOCUSPOCUS_URL=ws://localhost:1234
COLLABORATION_SECRET=docs-clone-local-collab-secret-2026-04-02
```

然后分别启动：

```bash
npm run dev
npm run collab:dev
```

其中：

- `npm run dev`
  - 启动 Next.js 应用
- `npm run collab:dev`
  - 启动 Hocuspocus 协同服务

## 如何验证协同是否正常

1. 用两个不同登录态打开同一个文档
2. 给第二个用户分配 `editor` 或 `viewer`
3. 两边进入同一个 `/documents/[documentId]`

如果协同正常：

- 浏览器控制台会看到：
  - `fetching collaboration token`
  - `collaboration token ready`
  - `collaboration authenticated`
  - `collaboration synced`
- Hocuspocus 终端会看到：
  - `connect`
  - `authenticated`
  - `load document`
  - `change`

## 权限如何生效

- `owner`
  - 可连接
  - 可写
- `editor`
  - 可连接
  - 可写
- `viewer`
  - 可连接
  - 只读，`readOnly: true`

权限判断不是只在前端做的，而是：

- Convex 先判断文档角色
- Next.js 生成 token
- Hocuspocus 再根据 token 角色决定只读/可写

## 为什么不能只用 HTML 快照

HTML 快照能解决的只是：

- 页面恢复内容
- 导出/展示
- 搜索或调试

但 HTML 快照不是协同主数据，原因是：

1. 它只保存“结果”，不保存协同文档本体
2. 它不能完整表达 `Yjs` 的 CRDT 状态
3. 服务重启后只能恢复一份静态内容，不能恢复协同内部状态
4. 未来做版本、离线恢复、增量同步时能力不足

简单说：

- HTML 快照更像“渲染结果”
- Yjs 状态才是“协同原始数据”

## 为什么要做真正的 Yjs 持久化

真正的 Yjs 持久化是把：

- `Y.Doc` 的状态
- 或 `Yjs update`

保存到数据库里。

这样做的价值是：

1. Hocuspocus 重启后可以恢复真正的协同状态
2. 多人编辑后的结果不会只停留在内存里
3. 未来可以继续扩展更完整的协同能力
4. 数据模型更符合协同编辑的真实结构

## 当前项目里的落地方式

现在 `documents` 里同时保存两份数据：

- `yjsState`
  - 真正的协同主状态
- `documentContent`
  - HTML 快照

这套设计的含义是：

- 主真相：`yjsState`
- 辅助快照：`documentContent`

## 最推荐的理解方式

可以把两者理解成：

- `Yjs state`
  - 给协同系统自己用
- `HTML snapshot`
  - 给页面展示、导出和兜底恢复用

所以不是二选一，而是：

**协同主数据存 Yjs，页面快照存 HTML。**
