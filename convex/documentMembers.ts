import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireDocumentOwner, requireDocumentRole } from "./lib/documentPermissions";

const editableRoleValidator = v.union(v.literal("editor"), v.literal("viewer"));

export const listByDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const { document } = await requireDocumentRole(ctx, args.documentId, [
      "owner",
      "editor",
      "viewer",
    ]);

    const members = await ctx.db
      .query("documentMembers")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .collect();

    const normalizedMembers = new Map<string, {
      memberId: string | null;
      userId: string;
      role: "owner" | "editor" | "viewer";
      invitedBy: string;
      createdAt: number;
      updatedAt: number;
    }>();

    for (const member of members) {
      normalizedMembers.set(member.userId, {
        memberId: member._id,
        userId: member.userId,
        role: member.role,
        invitedBy: member.invitedBy,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    }

    if (!normalizedMembers.has(document.ownerId)) {
      normalizedMembers.set(document.ownerId, {
        memberId: null,
        userId: document.ownerId,
        role: "owner",
        invitedBy: document.ownerId,
        createdAt: document._creationTime,
        updatedAt: document._creationTime,
      });
    }

    return Array.from(normalizedMembers.values()).sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      return a.userId.localeCompare(b.userId);
    });
  },
});

export const upsertMemberRole = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    role: editableRoleValidator,
  },
  handler: async (ctx, args) => {
    const { userId: currentUserId, document } = await requireDocumentOwner(
      ctx,
      args.documentId
    );

    if (args.userId === document.ownerId) {
      throw new ConvexError("Use ownership transfer for owner changes");
    }

    const existing = await ctx.db
      .query("documentMembers")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", args.userId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("documentMembers", {
      documentId: args.documentId,
      userId: args.userId,
      role: args.role,
      invitedBy: currentUserId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeMember = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { document } = await requireDocumentOwner(ctx, args.documentId);

    if (args.userId === document.ownerId) {
      throw new ConvexError("Cannot remove the document owner");
    }

    const existing = await ctx.db
      .query("documentMembers")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", args.userId)
      )
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const transferOwnership = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId: currentUserId, document } = await requireDocumentOwner(
      ctx,
      args.documentId
    );

    if (args.userId === document.ownerId) {
      return document._id;
    }

    const now = Date.now();
    const nextOwnerMembership = await ctx.db
      .query("documentMembers")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", args.userId)
      )
      .unique();

    if (nextOwnerMembership) {
      await ctx.db.patch(nextOwnerMembership._id, {
        role: "owner",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("documentMembers", {
        documentId: args.documentId,
        userId: args.userId,
        role: "owner",
        invitedBy: currentUserId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const currentOwnerMembership = await ctx.db
      .query("documentMembers")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", document.ownerId)
      )
      .unique();

    if (currentOwnerMembership) {
      await ctx.db.patch(currentOwnerMembership._id, {
        role: "editor",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("documentMembers", {
        documentId: args.documentId,
        userId: document.ownerId,
        role: "editor",
        invitedBy: currentUserId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.documentId, {
      ownerId: args.userId,
    });

    return args.documentId;
  },
});
