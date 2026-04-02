"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const SEARCH_RESULT_LIMIT = 8;

export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const documentId = searchParams.get("documentId") as Id<"documents"> | null;

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Missing Convex URL" }, { status: 500 });
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);

  const access = await convex.query(api.documents.getAccessById, { id: documentId });
  if (!access.canManageMembers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();
  const result = await client.users.getUserList({
    query,
    limit: SEARCH_RESULT_LIMIT,
    orderBy: "-created_at",
  });

  const users = result.data
    .filter((user) => user.id !== userId)
    .map((user) => {
      const primaryEmail =
        user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0];

      return {
        id: user.id,
        fullName:
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || "Unnamed user",
        username: user.username,
        emailAddress: primaryEmail?.emailAddress ?? "",
        imageUrl: user.imageUrl,
      };
    });

  return NextResponse.json({ users });
}
