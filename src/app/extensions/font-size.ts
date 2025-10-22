// font-size.ts
import { Extension } from "@tiptap/react";
import "@tiptap/extension-text-style";

/**
 * 为 TipTap 增加两个命令：
 * - editor.commands.setFontSize("16px")
 * - editor.commands.unsetFontSize()
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /** 设置选中文本的字号（例如 "12px" | "1.2rem" | "120%"） */
      setFontSize: (size: string) => ReturnType;
      /** 清除字号（恢复为继承样式） */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSizeExtension = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
