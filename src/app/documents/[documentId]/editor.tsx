/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
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
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import { FontSizeExtension } from "@/app/extensions/font-size";
import { LineHeightExtension } from "@/app/extensions/line-height";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { useEditorState } from "@/store/use-editor-store";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";
import { useDocumentStatus } from "@/store/use-document-status";
import { useRulerStore } from "@/store/use-ruler-store";
import { Ruler } from "./ruler";

interface EditorProps {
  documentContent?: string | undefined;
  id?: Id<"documents">;
  canEdit: boolean;
}

function buildExtensions(
  collaborationDocument: Y.Doc | null
) {
  return [
    StarterKit.configure({
      history: false,
    }),
    ...(collaborationDocument
      ? [
          Collaboration.configure({
            document: collaborationDocument,
          }),
        ]
      : []),
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
  ];
}

function uint8ArrayToBase64(uint8Array: Uint8Array) {
  let binary = "";
  uint8Array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const Editor = ({ documentContent, id, canEdit }: EditorProps) => {
  const mountAtRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const { setEditor } = useEditorState();
  const { setStatus, resetStatusAfterSave } = useDocumentStatus();
  const updateContentById = useMutation(api.documents.updateContentById);
  const updateCollaborationStateById = useMutation(api.documents.updateCollaborationStateById);
  const { leftMargin, rightMargin } = useRulerStore();
  const margins = useQuery(api.documents.getMargins, { id: id! });
  const collaborationState = useQuery(
    api.documents.getCollaborationStateById,
    id ? { id } : "skip"
  );
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const [collaborationToken, setCollaborationToken] = useState<string | null>(null);
  const [collaborationSessionKey, setCollaborationSessionKey] = useState(0);
  const [isLoadingCollaboration, setIsLoadingCollaboration] = useState(false);
  const [collaborationError, setCollaborationError] = useState<string | null>(null);

  const collaborationUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
  const collaborationConfigured = Boolean(collaborationUrl && id);
  const collaborationReady = collaborationConfigured ? collaborationState !== undefined : true;
  const collaborationActive = collaborationConfigured && !!collaborationToken && !!yDocRef.current;

  useEffect(() => {
    console.log("[documents/editor] mounted", {
      documentId: id,
      canEdit,
      hasInitialContent: !!documentContent,
      collaborationConfigured,
    });
  }, []);

  useEffect(() => {
    if (!collaborationConfigured || !collaborationReady) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadToken = async () => {
      try {
        setIsLoadingCollaboration(true);
        setCollaborationError(null);
        console.log("[documents/editor] fetching collaboration token", {
          documentId: id,
        });
        const response = await fetch(`/api/collaboration-token?documentId=${id}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch collaboration token: ${response.status}`);
        }

        const payload = (await response.json()) as {
          token: string;
          role: "owner" | "editor" | "viewer";
          url: string | null;
        };

        if (!cancelled) {
          console.log("[documents/editor] collaboration token ready", {
            documentId: id,
            role: payload.role,
          });
          setCollaborationToken(payload.token);
        }
      } catch (error) {
        if (!cancelled && (error as Error).name !== "AbortError") {
          console.error("[documents/editor] collaboration token failed", error);
          setCollaborationError("Failed to initialize collaboration");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCollaboration(false);
        }
      }
    };

    loadToken();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [collaborationConfigured, collaborationReady, id]);

  useEffect(() => {
    if (!collaborationConfigured || !collaborationToken || !id || !collaborationUrl || !collaborationReady) {
      return;
    }

    providerRef.current?.destroy();
    yDocRef.current?.destroy();

    const ydoc = new Y.Doc();
    if (collaborationState?.yjsState) {
      Y.applyUpdate(ydoc, base64ToUint8Array(collaborationState.yjsState));
      console.log("[documents/editor] collaboration state restored", {
        documentId: id,
        updatedAt: collaborationState.yjsStateUpdatedAt,
      });
    }

    const provider = new HocuspocusProvider({
      url: collaborationUrl,
      name: String(id),
      document: ydoc,
      token: collaborationToken,
      onAuthenticated() {
        console.log("[documents/editor] collaboration authenticated", {
          documentId: id,
        });
      },
      onSynced() {
        console.log("[documents/editor] collaboration synced", {
          documentId: id,
        });
      },
      onStatus(event) {
        console.log("[documents/editor] collaboration status", {
          documentId: id,
          status: event.status,
        });
      },
      onClose(event) {
        console.log("[documents/editor] collaboration closed", {
          documentId: id,
          event,
        });
      },
    });

    providerRef.current = provider;
    yDocRef.current = ydoc;
    setCollaborationSessionKey((value) => value + 1);

    return () => {
      provider.destroy();
      ydoc.destroy();
      providerRef.current = null;
      yDocRef.current = null;
    };
  }, [collaborationConfigured, collaborationToken, collaborationUrl, collaborationReady, id]);

  const saveContent = useDebounce(async (html: string) => {
    if (!canEdit) {
      return;
    }

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 5000)
    );

    try {
      setStatus("saving");
      await Promise.race([updateContentById({ id: id!, documentContent: html }), timeout]);
      resetStatusAfterSave();
      localStorage.removeItem(`unsaved-${id}`);
    } catch (err) {
      console.error("Save failed:", err);
      localStorage.setItem(`unsaved-${id}`, html);
      resetStatusAfterSave();
    }
  }, 2000);

  const persistCollaborationState = useDebounce(async (html: string) => {
    if (!canEdit || !id || !yDocRef.current) {
      return;
    }

    try {
      const encodedState = Y.encodeStateAsUpdate(yDocRef.current);
      await updateCollaborationStateById({
        id,
        yjsState: uint8ArrayToBase64(encodedState),
        documentContent: html,
      });
      console.log("[documents/editor] collaboration state persisted", {
        documentId: id,
        yjsBytes: encodedState.byteLength,
      });
    } catch (error) {
      console.error("[documents/editor] failed to persist collaboration state", error);
    }
  }, 1500);

  const editor = useEditor(
    {
      autofocus: canEdit,
      editable: canEdit,
      immediatelyRender: false,
      onCreate({ editor }) {
        if (collaborationActive) {
          const fragment = yDocRef.current?.getXmlFragment("default") as { length?: number } | undefined;
          const isEmpty = !fragment || (fragment.length ?? 0) === 0;
          const fallbackContent = collaborationState?.documentContent ?? documentContent;
          if (isEmpty && fallbackContent) {
            editor.commands.setContent(fallbackContent);
          }
        }

        console.log("[documents/editor] editor created", {
          documentId: id,
          elapsedMs: Math.round(performance.now() - mountAtRef.current),
          canEdit,
          collaborationActive,
          contentSize: editor.getHTML().length,
        });
        setEditor(editor);
      },
      onDestroy() {
        console.log("[documents/editor] editor destroyed", {
          documentId: id,
        });
        setEditor(null);
      },
      onUpdate({ editor }) {
        if (!canEdit) {
          return;
        }

        setEditor(editor);
        const html = editor.getHTML();
        setStatus("typing");

        if (collaborationActive) {
          persistCollaborationState(html);
          return;
        }

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
        attributes: {
          style: `padding-left:${leftMargin}px;padding-right:${rightMargin}px`,
          class:
            "focus:outline-none bg-white border border-[#C7C7C7] print:border-0 flex flex-col min-h-[1054px] w-[816px] pt-5 pr-14 pb-10 cursor-text",
        },
      },
      extensions: buildExtensions(collaborationActive ? yDocRef.current : null),
      content: collaborationActive ? undefined : documentContent,
    },
    [
      canEdit,
      collaborationSessionKey,
      collaborationActive,
    ],
  );

  useEffect(() => {
    if (collaborationActive) {
      return;
    }

    editor?.commands.setContent(documentContent || "");
    if (editor) {
      console.log("[documents/editor] content hydrated", {
        documentId: id,
        elapsedMs: Math.round(performance.now() - mountAtRef.current),
        contentSize: (documentContent || "").length,
      });
    }
  }, [collaborationActive, documentContent, editor]);

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [canEdit, editor]);

  useEffect(() => {
    if (margins) {
      console.log("[documents/editor] margins ready", {
        documentId: id,
        elapsedMs: Math.round(performance.now() - mountAtRef.current),
        leftMargin: margins.leftMargin,
        rightMargin: margins.rightMargin,
      });
      useRulerStore.setState({
        leftMargin: margins.leftMargin,
        rightMargin: margins.rightMargin,
      });
    }
  }, [id, margins]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    const unsavedContent = localStorage.getItem(`unsaved-${id}`);
    if (unsavedContent) {
      console.log("[documents/editor] restoring unsaved content", {
        documentId: id,
        contentSize: unsavedContent.length,
      });
      if (collaborationActive) {
        persistCollaborationState(unsavedContent);
      } else {
        saveContent(unsavedContent);
      }
      editor?.commands.setContent(unsavedContent);
      localStorage.removeItem(`unsaved-${id}`);
    }
  }, [canEdit, collaborationActive, editor, id, persistCollaborationState, saveContent]);

  useEffect(() => {
    if (!canEdit || collaborationActive) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      const html = editor?.getHTML();
      if (html) {
        saveContent(html);
      }
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [canEdit, collaborationActive, editor, saveContent]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    const handleSaveShortcut = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!editor) return;
        try {
          setStatus("saving");
          const html = editor.getHTML();
          if (collaborationActive && yDocRef.current) {
            const encodedState = Y.encodeStateAsUpdate(yDocRef.current);
            await updateCollaborationStateById({
              id: id!,
              yjsState: uint8ArrayToBase64(encodedState),
              documentContent: html,
            });
          } else {
            await updateContentById({ id: id!, documentContent: html });
          }
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
  }, [
    canEdit,
    collaborationActive,
    editor,
    id,
    resetStatusAfterSave,
    setStatus,
    updateCollaborationStateById,
    updateContentById,
  ]);

  if (collaborationConfigured && (!collaborationReady || (isLoadingCollaboration && !collaborationToken))) {
    return <FullscreenLoader label="Preparing collaboration..." />;
  }

  if (collaborationConfigured && collaborationError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Failed to initialize collaboration.
      </div>
    );
  }

  return (
    <div className="size-full overflow-y-hidden overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible ">
      <Ruler id={id as Id<"documents">} canEdit={canEdit} />
      <div className="min-w-max flex justify-center w-[816px] py-4 print:py-0 mx-auto print:w-full print:min-w-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Editor;
