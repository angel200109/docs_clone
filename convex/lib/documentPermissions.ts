import { ConvexError } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

export type DocumentRole = "owner" | "editor" | "viewer";
type AuthCtx = QueryCtx | MutationCtx;

async function getCurrentUserId(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  return identity.subject;
}

export async function getCurrentUserIdOrThrow(ctx: AuthCtx) {
  return getCurrentUserId(ctx);
}

export async function getDocumentOrThrow(ctx: AuthCtx, documentId: Id<"documents">) {
  const document = await ctx.db.get(documentId);
  if (!document) {
    throw new ConvexError("Document not found");
  }

  return document;
}

export async function getDocumentRole(
  ctx: AuthCtx,
  document: Doc<"documents">,
  userId: string
): Promise<DocumentRole | null> {
  const membership = await ctx.db
    .query("documentMembers")
    .withIndex("by_document_and_user", (q) =>
      q.eq("documentId", document._id).eq("userId", userId)
    )
    .unique();

  if (membership) {
    return membership.role;
  }

  if (document.ownerId === userId) {
    return "owner";
  }

  return null;
}

export async function requireDocumentRole(
  ctx: AuthCtx,
  documentId: Id<"documents">,
  roles: DocumentRole[]
) {
  const userId = await getCurrentUserId(ctx);
  const document = await getDocumentOrThrow(ctx, documentId);
  const role = await getDocumentRole(ctx, document, userId);

  if (!role || !roles.includes(role)) {
    throw new ConvexError("Unauthorized");
  }

  return { userId, document, role };
}

export async function requireDocumentOwner(
  ctx: AuthCtx,
  documentId: Id<"documents">,
) {
  return requireDocumentRole(ctx, documentId, ["owner"]);
}
