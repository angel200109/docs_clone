import { Id } from "../../../../convex/_generated/dataModel";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { useDocumentStatus } from "@/store/use-document-status";
import { LoaderIcon } from "lucide-react";

interface DocumentInputProps {
  title: string;
  id: Id<"documents">;
  disabled?: boolean;
}

export const DocumentInput = ({ title, id, disabled = false }: DocumentInputProps) => {
  const [value, setValue] = useState(title);
  const [, setIsPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mutate = useMutation(api.documents.renameById);
  const { status } = useDocumentStatus();

  const getStatusText = () => {
    switch (status) {
      case "typing":
        return "saving...";
      case "saving":
        return "loadingIcon";
      case "saved":
        return "saved";
      default:
        return "";
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    setValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled) {
      setIsEditing(false);
      return;
    }

    setIsPending(true);
    mutate({ id, title: value })
      .then(() => {
        setIsEditing(false);
        toast.success("Document updated");
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setIsPending(false));
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing && !disabled ? (
        <form onSubmit={handleSubmit} className="relative w-fit max-w-[50ch]">
          <span className="invisible whitespace-pre px-1.5 text-lg">{value || " "}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={onChange}
            onBlur={handleSubmit}
            className="absolute inset-0 text-lg text-black px-1.5 bg-transparent truncate"
          />
        </form>
      ) : (
        <span
          onClick={() => {
            if (disabled) {
              return;
            }

            setIsEditing(true);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }}
          className={`text-lg px-1.5 truncate ${disabled ? "cursor-default" : "cursor-pointer"}`}
        >
          {title}
        </span>
      )}
      {getStatusText() === "loadingIcon" ? (
        <LoaderIcon className="ml-12 size-4 text-muted-foreground animate-spin" />
      ) : (
        <div className="text-sm text-gray-500 ml-10">{getStatusText()}</div>
      )}
    </div>
  );
};
