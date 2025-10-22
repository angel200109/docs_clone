import Document from "./document";
interface DocumentIdPageProps {
    params: Promise<{ documentId: string }>;
}
// 必须是服务器组件
const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
    const { documentId } = await params;
    return (
        <Document documentId={documentId} />

    );
}

export default DocumentIdPage;