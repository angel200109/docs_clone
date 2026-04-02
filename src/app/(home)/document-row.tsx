import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiGoogledocs } from "react-icons/si";
import { DocumentMenu } from "./document-menu";
import { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";

interface DocumentRowProps {
  document: FunctionReturnType<typeof api.documents.listAccessible>[number];
}

const roleLabel: Record<DocumentRowProps["document"]["accessRole"], string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

export const DocumentRow = ({ document }: DocumentRowProps) => {
  const router = useRouter();
  const href = `/documents/${document._id}`;

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  const handlePrefetch = () => {
    console.log("[home/document-row] prefetch", {
      documentId: document._id,
      title: document.title,
      atMs: performance.now(),
    });
    router.prefetch(href);
  };

  const handleOpenDocument = () => {
    const clickAtMs = performance.now();
    (window as Window & { __docsDebugNavStart?: number }).__docsDebugNavStart = clickAtMs;
    console.log("[home/document-row] row click", {
      documentId: document._id,
      title: document.title,
      clickAtMs,
    });
    router.push(href);
  };

  return (
    <TableRow
      onClick={handleOpenDocument}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className="cursor-pointer"
    >
      <TableCell className="w-[50px]">
        <SiGoogledocs className="size-6 fill-blue-500" />
      </TableCell>
      <TableCell className="font-medium md:w-[45%]">{document.title}</TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Badge variant={document.accessRole === "viewer" ? "secondary" : "default"}>
            {roleLabel[document.accessRole]}
          </Badge>
          <span>{document.source === "owned" ? "Owned by me" : "Shared with me"}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">
        {format(new Date(document._creationTime), "MMM dd, yyyy")}
      </TableCell>
      <TableCell className="flex justify-end">
        <DocumentMenu
          documentId={document._id}
          title={document.title}
          canEdit={document.accessRole !== "viewer"}
          canDelete={document.accessRole === "owner"}
          onNewTab={() => window.open(`/documents/${document._id}`, "_blank")}
        />
      </TableCell>
    </TableRow>
  );
};
