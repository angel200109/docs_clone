import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { LEFT_MARGIN_DEFUALT, RIGHT_MARGIN_DEFUALT } from "@/constants/margin";
// 1、获取文档（支持分页和搜索）
export const get = query({
  args: {
    paginationOpts: paginationOptsValidator, // 分页参数校验器
    search: v.optional(v.string()), // 可选的搜索关键词
  },
  handler: async (ctx, args) => {
    const { paginationOpts, search } = args;
    // 获取当前登录用户
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized"); // 如果没有用户，抛出未授权错误
    }

    // 情况1：用户输入了搜索词
    if (search) {
      return await ctx.db
        .query("documents")
        .withSearchIndex(
          "search_title",
          (q) => q.search("title", search).eq("ownerId", user.subject) // 搜索标题并限定为用户个人文档
        )
        .paginate(paginationOpts);
    }

    // 情况2:返回当前用户的所有个人文档
    return await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", user.subject)) // 查询用户本人创建的文档
      .paginate(paginationOpts);
  },
});

// 2、新增文档
export const create = mutation({
  args: {
    title: v.optional(v.string()),
    documentContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    return await ctx.db.insert("documents", {
      title: args.title ?? "Untitled document",
      ownerId: user.subject,
      documentContent: args.documentContent,
      leftMargin: LEFT_MARGIN_DEFUALT,
      rightMargin: RIGHT_MARGIN_DEFUALT,
    });
  },
});

// 3、删除文档
export const removeById = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // 1. 身份验证：获取当前用户身份
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized"); // 未登录用户无权操作
    }

    // 2. 检查文档是否存在：根据ID查询文档
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new ConvexError("Document not found"); // 文档不存在
    }
    // 3. 权限验证：检查当前用户是否是文档的所有者
    const isOwner = document.ownerId === user.subject;
    if (!isOwner) {
      throw new ConvexError("Unauthorized");
    }
    // 4. 执行删除操作：删除指定ID的文档
    return ctx.db.delete(args.id);
  },
});

// 4、修改文档名字
export const renameById = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new ConvexError("Document not found");
    }
    const isOwner = document.ownerId === user.subject;
    if (!isOwner) {
      throw new ConvexError("Unauthorized");
    }
    return await ctx.db.patch(args.id, { title: args.title });
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const document = await ctx.db.get(id);
    if (!document) {
      throw new ConvexError("Document Not Found");
    }
    console.log(id);

    console.log(document);

    return document;
  },
});

export const updateContentById = mutation({
  args: {
    id: v.id("documents"),
    documentContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, documentContent } = args;
    // 获取当前用户身份
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    // 检查文档是否存在且用户有权限修改
    const existingDoc = await ctx.db.get(id);
    if (!existingDoc) {
      throw new Error("Document not found");
    }
    // 检查用户是否是文档所有者
    if (existingDoc.ownerId !== identity.subject) {
      throw new Error("Not authorized to update this document");
    }
    // 只更新 documentContent 字段
    await ctx.db.patch(id, { documentContent });
    return {
      success: true,
      id,
      updated: !!documentContent, // 返回是否进行了更新
    };
  },
});

// 获取当前文档边距
export const getMargins = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");
    return {
      leftMargin: doc.leftMargin,
      rightMargin: doc.rightMargin,
    };
  },
});

// 更新文档边距
export const updateMargins = mutation({
  args: {
    id: v.id("documents"),
    leftMargin: v.number(),
    rightMargin: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      leftMargin: args.leftMargin,
      rightMargin: args.rightMargin,
    });
  },
});
