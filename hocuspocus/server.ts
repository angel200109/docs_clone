import { loadEnvConfig } from "@next/env";
import { Server } from "@hocuspocus/server";

import { verifyCollaborationToken } from "../src/lib/collaboration-token";

loadEnvConfig(process.cwd());

const port = Number(process.env.HOCUSPOCUS_PORT ?? 1234);

console.log("[hocuspocus] env loaded", {
  hasCollaborationSecret: !!process.env.COLLABORATION_SECRET,
  hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
  port,
});

const server = new Server({
  name: "docs-clone-collaboration",
  port,
  quiet: false,
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
  async onConnect(data) {
    console.log("[hocuspocus] connect", {
      documentId: data.documentName,
      socketId: data.socketId,
    });
  },
  async onLoadDocument(data) {
    console.log("[hocuspocus] load document", {
      documentId: data.documentName,
    });
  },
  async onChange(data) {
    console.log("[hocuspocus] change", {
      documentId: data.documentName,
      clientsCount: data.clientsCount,
      user: data.context.user,
    });
  },
});

server.listen().then(() => {
  console.log("[hocuspocus] server ready", {
    port,
    url: server.webSocketURL,
  });
});
