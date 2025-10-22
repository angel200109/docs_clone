"use client";
import {
  LucideIcon,
  Undo2Icon,
  Redo2Icon,
  PrinterIcon,
  SpellCheckIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  // MessageSquarePlusIcon,
  ListTodoIcon,
  RemoveFormattingIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorState } from "@/store/use-editor-store";
import { Separator } from "@/components/ui/separator";
import {
  FontFamilyButton,
  HeadingLevelButton,
  TextColorButton,
  HighlightColorButton,
  LinkButton,
  ImageButton,
  AlignButton,
  ListButton,
  FontSizeButton,
  LineHeightButton
} from "./toolbarButton";

interface toolbarButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  icon: LucideIcon;
}

// 每个按钮组件
const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
}: toolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex text-sm h-7 min-w-7 items-center justify-center rounded-sm hover:bg-neutral-200/80",
        isActive && "bg-neutral-200/80"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
};

export const Toolbar = () => {
  const { editor } = useEditorState();
  const sections: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    isActive?: boolean;
  }[][] = [
      [
        {
          label: "Undo",
          icon: Undo2Icon,
          onClick: () => editor?.chain().focus().undo().run(),
        },
        {
          label: "Redo",
          icon: Redo2Icon,
          onClick: () => editor?.chain().focus().redo().run(),
        },
        {
          label: "Print",
          icon: PrinterIcon,
          onClick: () => window.print(),
        },
        {
          label: "Spell Check",
          icon: SpellCheckIcon,
          onClick: () => {
            const current = editor?.view.dom.getAttribute("spellcheck");
            editor?.view.dom.setAttribute(
              "spellcheck",
              current === "false" ? "true" : "false"
            );
          },
        },
      ],
      [
        {
          label: "Bold",
          icon: BoldIcon,
          isActive: editor?.isActive("bold"),
          onClick: () => editor?.chain().focus().toggleBold().run(),
        },
        {
          label: "Italic",
          icon: ItalicIcon,
          isActive: editor?.isActive("italic"),
          onClick: () => editor?.chain().focus().toggleItalic().run(),
        },
        {
          label: "Underline",
          icon: UnderlineIcon,
          isActive: editor?.isActive("underline"),
          onClick: () => editor?.chain().focus().toggleUnderline().run(),
        },
      ],
      [
        // {
        //   label: "Comment",
        //   icon: MessageSquarePlusIcon,
        //   isActive: editor?.isActive("liveblocksCommentMark"),
        //   onClick: () => editor?.chain().focus().addPendingComment().run(),
        // },
        {
          label: "List Todo",
          icon: ListTodoIcon,
          isActive: editor?.isActive("taskList"),
          onClick: () => editor?.chain().focus().toggleTaskList().run(),
        },
        {
          label: "Remove Formatting",
          icon: RemoveFormattingIcon,
          onClick: () => editor?.chain().focus().unsetAllMarks().run(),
        },
      ],
    ];

  return (
    <div className="bg-[#F1F4F9] px-2.5 py-0.5 rounded-[24px] min-h-[40px] flex items-center gap-x-0.5 overflow-x-auto">
      {/* 撤回、重做、打印、 拼写错误 (section[0])*/}
      {sections[0].map((item) => {
        return <ToolbarButton key={item.label} {...item} />;
      })}
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />

      {/* 字体 */}
      <FontFamilyButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />

      {/* 标题 */}
      <HeadingLevelButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />

      {/* 字体大小 */}
      <FontSizeButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />

      {/* 加粗 斜体 下划线 */}
      {sections[1].map((item) => {
        return <ToolbarButton key={item.label} {...item} />;
      })}

      {/* 字体颜色 高光颜色 */}
      <TextColorButton />
      <HighlightColorButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />

      {/* 链接 图片 对齐 列表 行高 section[1]*/}
      <LinkButton />
      <ImageButton />
      <AlignButton />
      <ListButton />
      <LineHeightButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />

      {/* 评论 待办事项 移除格式 section[2]*/}
      {sections[2].map((item) => {
        return <ToolbarButton key={item.label} {...item} />;
      })}
    </div>
  );
};
