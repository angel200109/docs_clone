import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, FilePenIcon, MoreVertical, TrashIcon } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RemoveDialog } from "@/components/remove-dialog";
import { RenameDialog } from "@/components/rename-dialog";

interface DocumentMenuProps {
  documentId: Id<"documents">;
  title: string;
  canEdit: boolean;
  canDelete: boolean;
  onNewTab: (id: Id<"documents">) => void;
}

export const DocumentMenu = ({
  documentId,
  title,
  canEdit,
  canDelete,
  onNewTab,
}: DocumentMenuProps) => {
  const handleOpenInNewTab = () => {
    const clickAtMs = performance.now();
    (window as Window & { __docsDebugNavStart?: number }).__docsDebugNavStart = clickAtMs;
    console.log("[home/document-menu] open in new tab", {
      documentId,
      title,
      clickAtMs,
    });
    onNewTab(documentId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {canEdit ? (
          <RenameDialog documentId={documentId} initialTitle={title}>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <FilePenIcon className="size-4 mr-2" />
              Rename
            </DropdownMenuItem>
          </RenameDialog>
        ) : null}

        {canDelete ? (
          <RemoveDialog documentId={documentId}>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <TrashIcon className="size-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </RemoveDialog>
        ) : null}

        <DropdownMenuItem onClick={handleOpenInNewTab}>
          <ExternalLinkIcon className="size-4 mr-2" />
          Open in a new tab
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
