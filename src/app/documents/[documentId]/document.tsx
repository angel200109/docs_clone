"use client";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import Editor from "./editor";
import { FullscreenLoader } from "@/components/fullscreen-loader";
// import { lazy, Suspense } from "react";
// const LazyEditor = lazy(() => import("./editor"));
interface DocumentProps {
    preloadDocument: Preloaded<typeof api.documents.getById>;
}
// 必须是客户端组件
const Document = ({ preloadDocument }: DocumentProps) => {
    // const document = useQuery(api.documents.getById, { id: documentId as Id<"documents"> });
    // if (!document) {
    //     throw new Error("Document Not Found"); // ← 就是这里
    // } // 会报错
    const document = usePreloadedQuery(preloadDocument);
    if (document === undefined) return <FullscreenLoader label="Document loading..." />;
    if (document === null) return <p>Document not found</p>;
    return (
        <div className="min-h-screen bg-[#FAFBFD]">
            <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 right-0 z-10 bg-[#FAFBFD] print:hidden">
                <Navbar data={document} />
                <Toolbar />
            </div>
            <div className="pt-[114px] print:pt-0">
                <Editor documentContent={document.documentContent} id={document._id} />

                {/* <Suspense fallback={<FullscreenLoader label="Loading editor..." />}>
                    <LazyEditor documentContent={document.documentContent} id={document._id} />
                </Suspense> */}
            </div>
        </div>
    );
}

export default Document;