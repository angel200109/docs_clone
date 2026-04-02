"use client";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { lazy, Suspense, useEffect, useRef } from "react";

import { api } from "../../../../convex/_generated/api";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";

const LazyEditor = lazy(() => import("./editor"));

interface DocumentProps {
  preloadDocument: Preloaded<typeof api.documents.getById>;
}

const Document = ({ preloadDocument }: DocumentProps) => {
  const mountAtRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const document = usePreloadedQuery(preloadDocument);
  const access = useQuery(
    api.documents.getAccessById,
    document ? { id: document._id } : "skip"
  );

  useEffect(() => {
    const navStart = (window as Window & { __docsDebugNavStart?: number }).__docsDebugNavStart;
    console.log("[documents/document] mounted", {
      mountAtMs: mountAtRef.current,
      sinceClickMs: navStart ? Math.round(mountAtRef.current - navStart) : null,
    });
  }, []);

  useEffect(() => {
    if (document) {
      console.log("[documents/document] document ready", {
        documentId: document._id,
        title: document.title,
        elapsedMs: Math.round(performance.now() - mountAtRef.current),
      });
    }
  }, [document]);

  useEffect(() => {
    if (access && document) {
      console.log("[documents/document] access ready", {
        documentId: document._id,
        role: access.role,
        canEdit: access.canEdit,
        elapsedMs: Math.round(performance.now() - mountAtRef.current),
      });
    }
  }, [access, document]);

  if (document === undefined || access === undefined) {
    return <FullscreenLoader label="Document loading..." />;
  }

  if (document === null) {
    return <p>Document not found</p>;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 right-0 z-10 bg-[#FAFBFD] print:hidden">
        <Navbar data={document} access={access} />
        {access.canEdit ? <Toolbar /> : null}
      </div>
      <div className="pt-[114px] print:pt-0">
        {!access.canEdit ? (
          <div className="mx-auto max-w-[816px] px-4 py-3 text-sm text-muted-foreground">
            当前为只读模式，你拥有 `viewer` 权限。
          </div>
        ) : null}
        <Suspense fallback={<FullscreenLoader label="Loading content..." />}>
          <LazyEditor
            canEdit={access.canEdit}
            documentContent={document.documentContent}
            id={document._id}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Document;
