"use client";

import DOMPurify from "isomorphic-dompurify";

// RichText renders organizer-authored HTML (event description) safely.
// Sanitization happens here — the backend stores the HTML as-is.
export default function RichText({ html, className = "" }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`richtext ${className}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
