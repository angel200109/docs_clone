import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 定义了一个名为 "documents" 的数据表
  documents: defineTable({
    // 表字段定义
    title: v.string(),
    documentContent: v.optional(v.string()),
    ownerId: v.string(),
    leftMargin: v.optional(v.float64()),
    rightMargin: v.optional(v.float64()),
  })
    // 索引配置(用于快速查询)
    .index("by_owner_id", ["ownerId"])
    .searchIndex("search_title", {
      searchField: "title", // 对 title 字段进行全文搜索
      filterFields: ["ownerId"], // 在搜索时对 ownerId 进行过滤
    }),
});
