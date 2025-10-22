// import { BsCloudCheck } from "react-icons/bs";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { useDocumentStatus } from "@/store/use-document-status";
import { LoaderIcon } from "lucide-react";
// import { LoaderIcon } from "lucide-react";

interface DocumentInputProps {
    title: string;
    id: Id<"documents">;
}

export const DocumentInput = ({ title, id }: DocumentInputProps) => {
    // const status = useStatus();
    const [value, setValue] = useState(title);
    const [, setIsPending] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // const showLoader = isPending || status == "connecting";
    // const showError = status === "disconnected";
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const debouncedUpdate = useDebounce((newValue: string) => {
        if (newValue === title) return;
        setIsPending(true);
        mutate({ id, title: newValue })
            .then(() => {
                toast.success("Document updated");
            })
            .catch(() => toast.error("Something went wrong"))
            .finally(() => setIsPending(false))
    })
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue); // 立刻更新value值
        // debouncedUpdate(newValue); // 防抖更新数据库的title值，但感觉这个效果不要更好
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        mutate({ id, title: value })
            .then(() => {
                setIsEditing(false);
                toast.success("Document updated");
            })
            .catch(() => toast.error("Something went wrong"))
            .finally(() => setIsPending(false))
    }

    return (
        <div className="flex items-center gap-2">
            {isEditing ? (
                <form
                    onSubmit={handleSubmit}
                    className="relative w-fit max-w-[50ch]"
                >
                    <span className="invisible whitespace-pre px-1.5 text-lg">
                        {value || " "}
                    </span>
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={onChange}
                        onBlur={handleSubmit}
                        className="absolute inset-0 text-lg text-black px-1.5 bg-transparent truncate"
                    />
                </form>
            ) : (
                <>
                    <span
                        onClick={() => {
                            setIsEditing(true);
                            setTimeout(() => {
                                inputRef.current?.focus()
                            }, 0)
                        }}
                        className="text-lg px-1.5 cursor-pointer truncate"
                    >
                        {title}
                    </span>
                </>
            )}
            {getStatusText() == "loadingIcon" ? <LoaderIcon className="ml-12 size-4 text-muted-foreground animate-spin" /> : <div className="text-sm text-gray-500 ml-10">{getStatusText()}</div>
            }

            {/* 
            {showError && <BsCloudCheck className="size-4" />}
            {!showLoader && !showError && <BsCloudCheck className="size-4" />}
            {showLoader && <LoaderIcon className="size-4 animate-spin text-muted-foreground red" />} */}
        </div>
    );

};
