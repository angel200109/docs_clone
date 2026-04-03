import { loadEnvConfig } from "@next/env";
import { Server } from "@hocuspocus/server";

import {
  loadDocumentFromConvex,
  storeDocumentToConvex,
} from "./persistence";
import { verifyCollaborationToken } from "../src/lib/collaboration-token";

loadEnvConfig(process.cwd());

const port = Number(process.env.HOCUSPOCUS_PORT ?? 1234);

console.log("[hocuspocus] env loaded", {
  hasCollaborationSecret: !!process.env.COLLABORATION_SECRET,
  hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
  hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL,
  hasConvexAdminKey:
    !!process.env.HOCUSPOCUS_CONVEX_ADMIN_KEY || !!process.env.CONVEX_ADMIN_KEY,
  port,
});

const server = new Server({
  name: "docs-clone-collaboration",
  port,
  quiet: false,
  debounce: 2000,
  maxDebounce: 10000,
  // 做鉴权
  async onAuthenticate(data) {
    const payload = await verifyCollaborationToken(data.token);

    if (payload.documentId !== data.documentName) {
      throw new Error("Document mismatch");
    }

    data.connectionConfig.readOnly = payload.role === "viewer";
    data.context.user = {
      id: payload.sub,
      role: payload.role,
    };

    console.log("[hocuspocus] authenticated", {
      documentId: payload.documentId,
      role: payload.role,
      userId: payload.sub,
      readOnly: data.connectionConfig.readOnly,
    });
  },
  // 记录连接日志
  async onConnect(data) {
    console.log("[hocuspocus] connect", {
      documentId: data.documentName,
      socketId: data.socketId,
    });
  },
  // 文档加载时触发
  async onLoadDocument(data) {
    const stored = await loadDocumentFromConvex(data.documentName);

    console.log("[hocuspocus] load document", {
      documentId: data.documentName,
      restoredFromConvex: !!stored,
      updatedAt: stored?.updatedAt ?? null,
    });

    return stored?.ydoc;
  },
  // 文档变更时触发
  async onChange(data) {
    console.log("[hocuspocus] change", {
      documentId: data.documentName,
      clientsCount: data.clientsCount,
      user: data.context.user,
    });
  },
  async onStoreDocument(data) {
    await storeDocumentToConvex(data.documentName, data.document);

    console.log("[hocuspocus] store document", {
      documentId: data.documentName,
      clientsCount: data.clientsCount,
    });
  },
});

server.listen().then(() => {
  console.log("[hocuspocus] server ready", {
    port,
    url: server.webSocketURL,
  });
});
