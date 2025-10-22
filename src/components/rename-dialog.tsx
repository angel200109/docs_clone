"use client";

import { useMutation } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface RenameDialogProps {
    documentId: Id<"documents">;
    initialTitle: string,
    children: React.ReactNode;
}

export const RenameDialog = ({ documentId, initialTitle, children }: RenameDialogProps) => {
    const update = useMutation(api.documents.renameById);
    const [isUpdating, setIsUpdating] = useState(false); // 标记是否正在更新中
    const [title, setTitle] = useState(initialTitle);    // 文档标题输入框的值
    const [open, setOpen] = useState(false);             // 控制对话框的打开状态

    // 表单提交处理函数
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // 阻止表单默认提交行为（页面刷新）
        setIsUpdating(true); // 开始更新，设置加载状态
        // 调用更新 mutation，trim() 去除首尾空格，如果为空则使用 "Untitled"
        update({
            id: documentId,
            title: title.trim() || "Untitled"
        })
            .then(() => toast.success("Document renamed"))
            .catch(() => toast.error("Something Went Wrong"))
            .finally(() => {
                // 无论成功失败，都执行以下操作
                setIsUpdating(false); // 结束加载状态
                setOpen(false);       // 关闭对话框
            });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Rename document</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-4">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Document name"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isUpdating}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating}
                            onClick={(e) => e.stopPropagation()}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
};
