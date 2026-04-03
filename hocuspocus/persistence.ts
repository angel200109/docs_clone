import { ConvexHttpClient } from "convex/browser";
import { createHash } from "node:crypto";
import * as Y from "yjs";
import type { FunctionReference } from "convex/server";

import { internal } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type CollaborationStateRecord = {
  id: Id<"documents">;
  yjsState?: string;
  yjsStateBytes?: number;
  yjsStateHash?: string;
  yjsStateUpdatedAt?: number;
  yjsStateVersion?: number;
  documentContent?: string;
} | null;

type GetCollaborationStateForServerRef = FunctionReference<
  "query",
  "internal",
  { id: Id<"documents"> },
  CollaborationStateRecord
>;

type StoreCollaborationStateFromServerRef = FunctionReference<
  "mutation",
  "internal",
  {
    id: Id<"documents">;
    yjsState: string;
    yjsStateBytes: number;
    yjsStateHash: string;
  },
  {
    success: boolean;
    id: Id<"documents">;
    version: number;
    updatedAt: number;
  }
>;

type InternalCapableConvexClient = ConvexHttpClient & {
  setAdminAuth: (token: string) => void;
  query: <Query extends FunctionReference<"query", "internal">>(
    query: Query,
    args: Query["_args"]
  ) => Promise<Query["_returnType"]>;
  mutation: <Mutation extends FunctionReference<"mutation", "internal">>(
    mutation: Mutation,
    args: Mutation["_args"]
  ) => Promise<Mutation["_returnType"]>;
};

function base64ToUint8Array(base64: string) {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function uint8ArrayToBase64(uint8Array: Uint8Array) {
  return Buffer.from(uint8Array).toString("base64");
}

function getConvexUrl() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  return convexUrl;
}

function getConvexAdminToken() {
  const adminToken =
    process.env.HOCUSPOCUS_CONVEX_ADMIN_KEY ||
    process.env.CONVEX_ADMIN_KEY;

  if (!adminToken) {
    throw new Error("Missing HOCUSPOCUS_CONVEX_ADMIN_KEY or CONVEX_ADMIN_KEY");
  }

  return adminToken;
}

function createConvexServerClient() {
  const convex = new ConvexHttpClient(getConvexUrl());
  const internalConvex = convex as InternalCapableConvexClient;
  internalConvex.setAdminAuth(getConvexAdminToken());
  return internalConvex;
}

export async function loadDocumentFromConvex(documentId: string) {
  const convex = createConvexServerClient();
  const stored = await convex.query(
    internal.documents
      .getCollaborationStateForServer as unknown as GetCollaborationStateForServerRef,
    {
      id: documentId as Id<"documents">,
    }
  );

  if (!stored?.yjsState) {
    return null;
  }

  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, base64ToUint8Array(stored.yjsState));

  return {
    hash: stored.yjsStateHash ?? null,
    ydoc,
    version: stored.yjsStateVersion ?? null,
    updatedAt: stored.yjsStateUpdatedAt ?? null,
  };
}

export async function storeDocumentToConvex(documentId: string, ydoc: Y.Doc) {
  const convex = createConvexServerClient();
  const encodedState = Y.encodeStateAsUpdate(ydoc);
  const yjsState = uint8ArrayToBase64(encodedState);
  const yjsStateHash = createHash("sha256").update(encodedState).digest("hex");

  return convex.mutation(
    internal.documents
      .storeCollaborationStateFromServer as unknown as StoreCollaborationStateFromServerRef,
    {
      id: documentId as Id<"documents">,
      yjsState,
      yjsStateBytes: encodedState.byteLength,
      yjsStateHash,
    }
  );
}
