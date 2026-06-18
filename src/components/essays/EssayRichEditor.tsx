"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";
import { countCharacters, countWords, stripHtml } from "@/lib/essayLimits";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: () => any }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => any }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

export type EssayEditorSelection = { from: number; to: number; text: string };

type Props = {
  content: string;
  onChange: (html: string, plainText: string, wordCount: number, charCount: number) => void;
  onBlur?: () => void;
  onSelectionChange?: (sel: EssayEditorSelection | null) => void;
  activeCommentId?: string | null;
  readOnly?: boolean;
};

const FONT_FAMILIES = ["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "24px"];

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={["essay-toolbar-btn", active ? "essay-toolbar-btn--active" : ""].join(" ")}
    >
      {children}
    </button>
  );
}

export default function EssayRichEditor({
  content,
  onChange,
  onBlur,
  onSelectionChange,
  readOnly,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Start writing your essay…" }),
      TextStyle,
      FontFamily,
      FontSize,
    ],
    content: content || "<p></p>",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const plain = stripHtml(html);
      onChange(html, plain, countWords(plain), countCharacters(plain));
    },
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[50vh]",
      },
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from === to) {
        onSelectionChange?.(null);
        return;
      }
      onSelectionChange?.({ from, to, text: ed.state.doc.textBetween(from, to, " ") });
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const next = content?.trim() ? content : "<p></p>";
    const current = editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-primary" />
      </div>
    );
  }

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-container-low">
      {!readOnly ? (
        <div className="essay-toolbar flex flex-wrap items-center gap-1 border-b px-4 py-2">
          <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} title="Highlight">
            H
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border-subtle" />
          <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            • List
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            1. List
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("link")} onClick={setLink} title="Link">
            Link
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border-subtle" />
          <select
            className="input-base !w-auto !border-0 !bg-transparent !py-1 !text-xs !shadow-none"
            value={editor.getAttributes("textStyle").fontFamily ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontFamily(v).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
          >
            <option value="">Font</option>
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            className="input-base !w-auto !border-0 !bg-transparent !py-1 !text-xs !shadow-none"
            value={editor.getAttributes("textStyle").fontSize ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) (editor.chain().focus() as any).setFontSize(v).run();
              else (editor.chain().focus() as any).unsetFontSize().run();
            }}
          >
            <option value="">Size</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s.replace("px", "")}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="essay-doc-paper mx-auto min-h-[calc(100vh-16rem)] max-w-3xl rounded-xl border border-border-subtle px-8 py-10 sm:px-12 sm:py-12">
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:min-h-[50vh] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-3 [&_.ProseMirror]:font-sans [&_.ProseMirror]:text-[15px] [&_.ProseMirror]:leading-[1.75] [&_.ProseMirror]:text-text-primary [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-muted"
          />
        </div>
      </div>
    </div>
  );
}
