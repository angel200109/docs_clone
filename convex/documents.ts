import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { LEFT_MARGIN_DEFUALT, RIGHT_MARGIN_DEFUALT } from "@/constants/margin";
import {
  getCurrentUserIdOrThrow,
  requireDocumentOwner,
  requireDocumentRole,
} from "./lib/documentPermissions";

const editableRoles = ["owner", "editor"] as const;
const readableRoles = ["owner", "editor", "viewer"] as const;

export const get = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrThrow(ctx);
    const { paginationOpts, search } = args;

    if (search) {
      return await ctx.db
        .query("documents")
        .withSearchIndex("search_title", (q) =>
          q.search("title", search).eq("ownerId", userId)
        )
        .paginate(paginationOpts);
    }

    return await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", userId))
      .paginate(paginationOpts);
  },
});

export const listAccessible = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrThrow(ctx);
    const normalizedSearch = args.search?.trim().toLowerCase();

    const ownedDocuments = await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", userId))
      .collect();

    const memberships = await ctx.db
      .query("documentMembers")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const accessibleDocuments = new Map<string, {
      document: (typeof ownedDocuments)[number];
      role: "owner" | "editor" | "viewer";
      source: "owned" | "shared";
    }>();

    for (const document of ownedDocuments) {
      accessibleDocuments.set(document._id, {
        document,
        role: "owner",
        source: "owned",
      });
    }

    for (const membership of memberships) {
      const existing = accessibleDocuments.get(membership.documentId);
      if (existing) {
        if (membership.role === "owner") {
          existing.role = "owner";
          existing.source = "owned";
        }
        continue;
      }

      const document = await ctx.db.get(membership.documentId);
      if (!document) {
        continue;
      }

      accessibleDocuments.set(document._id, {
        document,
        role: membership.role,
        source: document.ownerId === userId ? "owned" : "shared",
      });
    }

    return Array.from(accessibleDocuments.values())
      .filter(({ document }) => {
        if (!normalizedSearch) {
          return true;
        }

        return document.title.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => b.document._creationTime - a.document._creationTime)
      .map(({ document, role, source }) => ({
        ...document,
        accessRole: role,
        isOwner: role === "owner",
        source,
      }));
  },
});

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    documentContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrThrow(ctx);
    const now = Date.now();

    const documentId = await ctx.db.insert("documents", {
      title: args.title ?? "Untitled document",
      ownerId: userId,
      documentContent: args.documentContent,
      leftMargin: LEFT_MARGIN_DEFUALT,
      rightMargin: RIGHT_MARGIN_DEFUALT,
    });

    await ctx.db.insert("documentMembers", {
      documentId,
      userId,
      role: "owner",
      invitedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

export const removeById = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    await requireDocumentOwner(ctx, args.id);

    const members = await ctx.db
      .query("documentMembers")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.id))
      .collect();

    await Promise.all(members.map((member) => ctx.db.delete(member._id)));
    return ctx.db.delete(args.id);
  },
});

export const renameById = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    await requireDocumentRole(ctx, args.id, [...editableRoles]);
    return await ctx.db.patch(args.id, { title: args.title });
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const { document } = await requireDocumentRole(ctx, id, [...readableRoles]);
    return document;
  },
});

export const getAccessById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const { role } = await requireDocumentRole(ctx, id, [...readableRoles]);

    return {
      role,
      canEdit: role === "owner" || role === "editor",
      canManageMembers: role === "owner",
      canDelete: role === "owner",
    };
  },
});

export const getCollaborationStateById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const { document } = await requireDocumentRole(ctx, id, [...readableRoles]);

    return {
      yjsState: document.yjsState,
      yjsStateUpdatedAt: document.yjsStateUpdatedAt,
      documentContent: document.documentContent,
    };
  },
});

export const updateContentById = mutation({
  args: {
    id: v.id("documents"),
    documentContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireDocumentRole(ctx, args.id, [...editableRoles]);
    await ctx.db.patch(args.id, { documentContent: args.documentContent });

    return {
      success: true,
      id: args.id,
      updated: !!args.documentContent,
    };
  },
});

export const updateCollaborationStateById = mutation({
  args: {
    id: v.id("documents"),
    yjsState: v.string(),
    documentContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireDocumentRole(ctx, args.id, [...editableRoles]);
    const now = Date.now();

    await ctx.db.patch(args.id, {
      yjsState: args.yjsState,
      yjsStateUpdatedAt: now,
      documentContent: args.documentContent,
    });

    return {
      success: true,
      id: args.id,
      updatedAt: now,
    };
  },
});

export const getMargins = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const { document } = await requireDocumentRole(ctx, args.id, [...readableRoles]);

    return {
      leftMargin: document.leftMargin,
      rightMargin: document.rightMargin,
    };
  },
});

export const updateMargins = mutation({
  args: {
    id: v.id("documents"),
    leftMargin: v.number(),
    rightMargin: v.number(),
  },
  handler: async (ctx, args) => {
    await requireDocumentRole(ctx, args.id, [...editableRoles]);
    await ctx.db.patch(args.id, {
      leftMargin: args.leftMargin,
      rightMargin: args.rightMargin,
    });
  },
});
