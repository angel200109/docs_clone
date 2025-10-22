import Link from "next/link";
const documentHome = () => {
    return (
        <div>
            Link <Link href="/document/123">here</Link> to go to documentId
        </div>
    );
};

export default documentHome;
