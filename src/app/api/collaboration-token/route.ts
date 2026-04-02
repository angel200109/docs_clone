import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { signCollaborationToken } from "@/lib/collaboration-token";

export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = new URL(request.url).searchParams.get("documentId") as Id<"documents"> | null;
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
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
  const collaborationToken = await signCollaborationToken({
    documentId,
    role: access.role,
    sub: userId,
  });

  return NextResponse.json({
    role: access.role,
    token: collaborationToken,
    url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? null,
  });
}
