"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  label: string;
  value: string; // HTML
  onChange: (html: string) => void;
  hint?: string;
}

function ToolbarButton({
  editor,
  label,
  title,
  active,
  onClick,
}: {
  editor: Editor;
  label: React.ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={!editor.isEditable}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus
      onClick={onClick}
      style={{
        minWidth: 30,
        height: 28,
        padding: "0 7px",
        fontSize: 13,
        fontWeight: 600,
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-xs)",
        cursor: "pointer",
        backgroundColor: active ? "var(--color-flame-tint, #FFEAE2)" : "var(--color-surface)",
        color: active ? "var(--color-flame-700, #CE3611)" : "var(--color-ink-2)",
      }}
    >
      {label}
    </button>
  );
}

// RichTextEditor is a small WYSIWYG (Tiptap StarterKit) that reads/writes HTML.
// Output is sanitized at render time (components/ui/RichText.tsx), not here.
export default function RichTextEditor({ label, value, onChange, hint }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: value,
    // Next.js SSR: initialize client-side only to avoid hydration mismatch.
    immediatelyRender: false,
    // Re-render on every transaction so toolbar active states stay in sync.
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div style={{ border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-surface)", overflow: "hidden" }}>
        {editor && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: 6, borderBottom: "1px solid var(--color-line)", backgroundColor: "var(--color-paper)" }}>
            <ToolbarButton editor={editor} label={<strong>B</strong>} title="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolbarButton editor={editor} label={<em>I</em>} title="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolbarButton editor={editor} label={<s>S</s>} title="Coret" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
            <ToolbarButton editor={editor} label="H2" title="Judul" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolbarButton editor={editor} label="H3" title="Subjudul" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
            <ToolbarButton editor={editor} label="• —" title="Daftar poin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolbarButton editor={editor} label="1." title="Daftar bernomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolbarButton editor={editor} label="↺" title="Urungkan" onClick={() => editor.chain().focus().undo().run()} />
            <ToolbarButton editor={editor} label="↻" title="Ulangi" onClick={() => editor.chain().focus().redo().run()} />
          </div>
        )}
        <EditorContent editor={editor} className="richtext richtext-editor" />
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
