import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Document from "./document";

interface DocumentIdPageProps {
  params: Promise<{ documentId: Id<"documents"> }>;
}

const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
  const requestStart = Date.now();
  const { documentId } = await params;

  console.log("[documents/page] start", {
    documentId,
    at: new Date(requestStart).toISOString(),
  });

  const { getToken } = await auth();
  const tokenStart = Date.now();
  const token = (await getToken({ template: "convex" })) ?? undefined;

  console.log("[documents/page] token ready", {
    documentId,
    durationMs: Date.now() - tokenStart,
    hasToken: !!token,
  });

  if (!token) {
    throw new Error("Unauthorized");
  }

  const preloadStart = Date.now();
  const preloadDocument = await preloadQuery(
    api.documents.getById,
    { id: documentId },
    { token }
  );

  console.log("[documents/page] preload ready", {
    documentId,
    durationMs: Date.now() - preloadStart,
    totalDurationMs: Date.now() - requestStart,
  });

  return <Document preloadDocument={preloadDocument} />;
};

export default DocumentIdPage;