import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    documentContent: v.optional(v.string()),
    ownerId: v.string(),
    leftMargin: v.optional(v.float64()),
    rightMargin: v.optional(v.float64()),
    yjsState: v.optional(v.string()),
    yjsStateUpdatedAt: v.optional(v.number()),
  })
    .index("by_owner_id", ["ownerId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["ownerId"],
    }),
  documentMembers: defineTable({
    documentId: v.id("documents"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    invitedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_document_id", ["documentId"])
    .index("by_user_id", ["userId"])
    .index("by_document_and_user", ["documentId", "userId"]),
});
