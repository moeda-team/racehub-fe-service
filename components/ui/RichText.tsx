"use client";

import DOMPurify from "isomorphic-dompurify";

const eventImageURL = /^\/api\/v1\/media\/events\/[^/?#]+\.(?:jpe?g|png|webp)$/i;

// Organizer-authored HTML may only load images hosted behind RaceHub's media
// proxy. This avoids third-party tracking pixels and unstable external URLs.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName.toLowerCase() !== "img") return;
  const image = node as Element;
  const src = image.getAttribute("src") ?? "";
  if (!eventImageURL.test(src)) {
    image.remove();
    return;
  }
  image.removeAttribute("style");
  image.removeAttribute("width");
  image.removeAttribute("height");
  image.removeAttribute("srcset");
  image.setAttribute("loading", "lazy");
  image.setAttribute("decoding", "async");
});

// RichText renders organizer-authored HTML (event description) safely.
// Sanitization happens here — the backend stores the HTML as-is.
export default function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  if (!html) return null;
  return (
    <div
      className={`richtext ${className}`}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html, {
          FORBID_ATTR: ["style", "width", "height", "srcset"],
        }),
      }}
    />
  );
}
