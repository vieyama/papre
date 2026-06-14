import "server-only";

import sanitizeHtml from "sanitize-html";

export const MAX_PAGE_CONTENT_LENGTH = 1_000_000;

const allowedTags = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "ul",
  "ol",
  "li",
  "a",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  "caption",
  "div",
  "span",
  "figure",
  "figcaption",
  "img",
  "audio",
  "video",
  "source",
];

export function sanitizePageContent(content: string) {
  return sanitizeHtml(content, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title", "width", "height"],
      audio: ["src", "controls"],
      video: ["src", "controls", "width", "height", "poster"],
      source: ["src", "type"],
      ol: ["start"],
      li: ["value"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      col: ["span"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      audio: ["http", "https"],
      video: ["http", "https"],
      source: ["http", "https"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src", "poster"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}
