"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { api } from "@/lib/api";
import {
  compressEventImage,
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_TYPES,
  formatImageSize,
} from "@/lib/image-upload";
import type { ApiResponse, EventDescriptionImage } from "@/lib/types.gen";

interface RichTextEditorProps {
  label: string;
  value: string; // HTML
  onChange: (html: string) => void;
  hint?: string;
  eventId?: string;
}

function ToolbarButton({
  editor,
  label,
  title,
  active,
  disabled = false,
  onClick,
}: {
  editor: Editor;
  label: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={!editor.isEditable || disabled}
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
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        backgroundColor: active
          ? "var(--color-gold-soft)"
          : "var(--color-surface)",
        color: active
          ? "var(--color-gold-deep)"
          : "var(--color-ink-2)",
      }}
    >
      {label}
    </button>
  );
}

// RichTextEditor is a small WYSIWYG (Tiptap StarterKit) that reads/writes HTML.
// Output is sanitized at render time (components/ui/RichText.tsx), not here.
export default function RichTextEditor({
  label,
  value,
  onChange,
  hint,
  eventId,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      // resizable off: column-width drags produce colwidth attrs that the
      // sanitized public render would drop anyway.
      TableKit.configure({ table: { resizable: false } }),
      Image.configure({ allowBase64: false, inline: false }),
    ],
    content: value,
    // Next.js SSR: initialize client-side only to avoid hydration mismatch.
    immediatelyRender: false,
    // Re-render on every transaction so toolbar active states stay in sync.
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  async function chooseImage(file: File | null) {
    setImageError(null);
    setImageFile(null);
    setImageAlt("");
    if (!file) return;
    if (!EVENT_IMAGE_TYPES.includes(file.type)) {
      setImageError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    const compressed = await compressEventImage(file);
    if (compressed.size > EVENT_IMAGE_MAX_BYTES) {
      setImageError(
        `Ukuran file ${formatImageSize(compressed.size)} setelah kompresi masih melebihi batas 10 MB.`,
      );
      return;
    }
    setImageFile(compressed);
  }

  function resetImageUpload() {
    setImageFile(null);
    setImageAlt("");
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage() {
    if (!eventId || !editor || !imageFile || !imageAlt.trim()) return;
    setIsUploadingImage(true);
    setImageError(null);
    try {
      const form = new FormData();
      form.append("file", imageFile);
      const response = await api.postForm<ApiResponse<EventDescriptionImage>>(
        `/api/v1/events/${eventId}/description-images`,
        form,
      );
      editor
        .chain()
        .focus()
        .setImage({ src: response.data.url, alt: imageAlt.trim() })
        .run();
      resetImageUpload();
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Gambar gagal diunggah.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div
        style={{
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--color-surface)",
          overflow: "hidden",
        }}
      >
        {editor && (
          <>
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              padding: 6,
              borderBottom: "1px solid var(--color-line)",
              backgroundColor: "var(--color-paper)",
            }}
          >
            <ToolbarButton
              editor={editor}
              label={<strong>B</strong>}
              title="Tebal"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              editor={editor}
              label={<em>I</em>}
              title="Miring"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              editor={editor}
              label={<s>S</s>}
              title="Coret"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <ToolbarButton
              editor={editor}
              label="H2"
              title="Judul"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            />
            <ToolbarButton
              editor={editor}
              label="H3"
              title="Subjudul"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            />
            <ToolbarButton
              editor={editor}
              label="• —"
              title="Daftar poin"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              editor={editor}
              label="1."
              title="Daftar bernomor"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => void chooseImage(event.target.files?.[0] ?? null)}
            />
            <ToolbarButton
              editor={editor}
              label="▧ Gambar"
              title={eventId ? "Sisipkan gambar" : "Simpan draft event terlebih dahulu"}
              disabled={!eventId || isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
            />
            {editor.isActive("image") && (
              <>
                <input
                  aria-label="Teks alternatif gambar terpilih"
                  value={editor.getAttributes("image").alt ?? ""}
                  onChange={(event) =>
                    editor
                      .chain()
                      .updateAttributes("image", { alt: event.target.value })
                      .run()
                  }
                  placeholder="Teks alternatif"
                  style={{
                    width: 150,
                    height: 28,
                    padding: "0 7px",
                    border: "1px solid var(--color-line)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: 13,
                  }}
                />
                <ToolbarButton
                  editor={editor}
                  label="Hapus gambar"
                  title="Hapus gambar dari deskripsi"
                  onClick={() => editor.chain().focus().deleteSelection().run()}
                />
              </>
            )}
            <ToolbarButton
              editor={editor}
              label="⊞"
              title="Sisipkan tabel 3×3"
              active={editor.isActive("table")}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            />
            {editor.isActive("table") && (
              <>
                <ToolbarButton
                  editor={editor}
                  label="+Baris"
                  title="Tambah baris di bawah"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                />
                <ToolbarButton
                  editor={editor}
                  label="−Baris"
                  title="Hapus baris ini"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                />
                <ToolbarButton
                  editor={editor}
                  label="+Kolom"
                  title="Tambah kolom di kanan"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                />
                <ToolbarButton
                  editor={editor}
                  label="−Kolom"
                  title="Hapus kolom ini"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                />
                <ToolbarButton
                  editor={editor}
                  label="✕ Tabel"
                  title="Hapus tabel"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                />
              </>
            )}
            <ToolbarButton
              editor={editor}
              label="↺"
              title="Urungkan"
              onClick={() => editor.chain().focus().undo().run()}
            />
            <ToolbarButton
              editor={editor}
              label="↻"
              title="Ulangi"
              onClick={() => editor.chain().focus().redo().run()}
            />
          </div>
          {imageFile && (
            <div className="richtext-image-upload">
              <span style={{ fontSize: 13, color: "var(--color-ink-2)" }}>
                {imageFile.name} · {formatImageSize(imageFile.size)}
              </span>
              <input
                className="field-input"
                aria-label="Teks alternatif gambar"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Teks alternatif gambar (wajib)"
                disabled={isUploadingImage}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!imageAlt.trim() || isUploadingImage}
                onClick={() => void uploadImage()}
              >
                {isUploadingImage ? "Mengunggah…" : "Unggah & sisipkan"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={isUploadingImage}
                onClick={resetImageUpload}
              >
                Batal
              </button>
            </div>
          )}
          {imageError && (
            <div className="field-error" role="alert" style={{ padding: "8px 10px" }}>
              {imageError}
            </div>
          )}
          </>
        )}
        <EditorContent editor={editor} className="richtext richtext-editor" />
      </div>
      {hint && <span className="field-hint">{hint}</span>}
      {!eventId && (
        <span className="field-hint">
          Buat dan simpan draft event terlebih dahulu untuk menambahkan gambar.
        </span>
      )}
    </div>
  );
}
