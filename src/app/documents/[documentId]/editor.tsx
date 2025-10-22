/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { FontSizeExtension } from "@/app/extensions/font-size";
import { LineHeightExtension } from "@/app/extensions/line-height";
import { useEditorState } from "@/store/use-editor-store";
import { Ruler } from "./ruler";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";
import { useDocumentStatus } from "@/store/use-document-status";
import { useEffect } from "react";
import { useRulerStore } from "@/store/use-ruler-store";

interface EditorProps {
    documentContent?: string | undefined;
    id?: Id<"documents">;
}

const Editor = ({ documentContent, id }: EditorProps) => {
    const { setEditor } = useEditorState();
    const { setStatus, resetStatusAfterSave } = useDocumentStatus();
    const updateContentById = useMutation(api.documents.updateContentById);
    const { leftMargin, rightMargin } = useRulerStore();
    const margins = useQuery(api.documents.getMargins, { id: id! });
    useEffect(() => {
        editor?.commands.setContent(documentContent || "");
    }, [documentContent])

    useEffect(() => {
        if (margins) {
            useRulerStore.setState({
                leftMargin: margins.leftMargin,
                rightMargin: margins.rightMargin,
            });
        }
    }, [margins]);

    const saveContent = useDebounce(async (html: string) => {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 5000) // 5秒超时
        );
        try {
            setStatus("saving");
            const result = await Promise.race([updateContentById({ id: id!, documentContent: html }), timeout]);
            console.log(result);

            resetStatusAfterSave();
            localStorage.removeItem(`unsaved-${id}`); // 成功保存后移除未保存内容，防止只是请求慢
            console.log("成功存");
        } catch (err) {
            console.log("超时了");
            console.error("Save failed:", err);
            localStorage.setItem(`unsaved-${id}`, html);
            resetStatusAfterSave();
        }
    }, 2000);  // 停止输入 2 秒后触发


    // 用于恢复未保存的内容
    useEffect(() => {
        const unsavedContent = localStorage.getItem(`unsaved-${id}`);
        if (unsavedContent) {
            saveContent(unsavedContent);
            editor?.commands.setContent(unsavedContent);// 要加，不然第二次刷新才有内容
            localStorage.removeItem(`unsaved-${id}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const editor = useEditor({
        autofocus: true,
        immediatelyRender: false,
        onCreate({ editor }) {
            setEditor(editor);
        },
        onDestroy() {
            setEditor(null);
        },
        onUpdate({ editor }) {
            setEditor(editor);
            const html = editor.getHTML();
            setStatus("typing");
            saveContent(html);
        },
        onSelectionUpdate({ editor }) {
            setEditor(editor);
        },
        onTransaction({ editor }) {
            setEditor(editor);
        },
        onFocus({ editor }) {
            setEditor(editor);
        },
        onBlur({ editor }) {
            setEditor(editor);
        },
        onContentError({ editor }) {
            setEditor(editor);
        },
        editorProps: {
            // 直接映射到编辑区域的属性（DOM props）
            attributes: {
                style: `padding-left:${leftMargin}px;padding-right:${rightMargin}px`, // 内联样式
                // 类名
                class:
                    "focus:outline-none bg-white border border-[#C7C7C7] print:border-0 flex flex-col min-h-[1054px] w-[816px] pt-5 pr-14 pb-10 cursor-text",
            },
        },
        extensions: [
            StarterKit.configure({
                history: false
            }),
            LineHeightExtension.configure({
                types: ["heading", "paragraph"],
                defaultLineHeight: "normal",
            }),
            FontSizeExtension,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: "https",
            }),
            Color,
            Highlight.configure({ multicolor: true }),
            TextStyle,
            FontFamily,
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image,
            ImageResize,
        ], // 基础编辑器功能集合
        content: documentContent,
    });

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            // 在离开页面前执行同步保存操作
            const html = editor?.getHTML();
            saveContent(html as string); // 使用最新的内容进行保存
            event.returnValue = "";  // 显示浏览器默认的离开提示框
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        // 清理事件监听器
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const handleSaveShortcut = async (e: KeyboardEvent) => {
            // 检测是否按下 Ctrl+S 或 Cmd+S
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault(); // 阻止浏览器默认行为
                if (!editor) return;
                try {
                    setStatus("saving");
                    const html = editor.getHTML();
                    await updateContentById({ id: id!, documentContent: html });
                    resetStatusAfterSave();
                } catch (err) {
                    console.error("Manual save failed:", err);
                    localStorage.setItem(`unsaved-${id}`, editor.getHTML());
                    resetStatusAfterSave();
                }
            }
        };
        window.addEventListener("keydown", handleSaveShortcut);
        return () => window.removeEventListener("keydown", handleSaveShortcut);
    }, [editor, id, setStatus, resetStatusAfterSave, updateContentById]);


    return (
        <div className="size-full overflow-y-hidden overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible ">
            <Ruler id={id as Id<"documents">} />
            <div className="min-w-max flex justify-center w-[816px] py-4 print:py-0 mx-auto print:w-full print:min-w-0">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

export default Editor;