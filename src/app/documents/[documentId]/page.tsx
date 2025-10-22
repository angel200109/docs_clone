import { auth } from "@clerk/nextjs/server";
import { Id } from "../../../../convex/_generated/dataModel";
import Document from "./document";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
interface DocumentIdPageProps {
    params: Promise<{ documentId: Id<"documents"> }>;
}
// 必须是服务器组件
const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
    const { documentId } = await params;
    const { getToken } = await auth(); // Clerk 身份验证
    const token = await getToken({ template: "convex" }) ?? undefined;
    if (!token) {
        throw new Error("Unauthorized");
    }
    const preloadDocument = await preloadQuery(
        api.documents.getById,
        { id: documentId },
        { token }
    );
    return (
        <Document preloadDocument={preloadDocument} />
    );
}

export default DocumentIdPage;