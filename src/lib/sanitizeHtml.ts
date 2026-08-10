/**
 * Minimal HTML sanitizer used for article bodies.
 *
 * Article content is stored as HTML and rendered as markup, so it has to be
 * cleaned before it reaches the page: an allowlist of tags and attributes,
 * with scripts, event handlers, embedded objects and javascript: URLs removed.
 */

const ALLOWED_TAGS = new Set([
  "P", "BR", "HR", "STRONG", "B", "EM", "I", "U", "S", "SMALL", "SUP", "SUB",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "CODE",
  "A", "IMG", "FIGURE", "FIGCAPTION",
  "TABLE", "THEAD", "TBODY", "TR", "TH", "TD",
  "SPAN", "DIV", "SECTION", "ARTICLE",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "title", "target", "rel"]),
  IMG: new Set(["src", "alt", "title", "width", "height", "loading"]),
  TD: new Set(["colspan", "rowspan"]),
  TH: new Set(["colspan", "rowspan", "scope"]),
};

const GLOBAL_ATTRS = new Set(["class", "id"]);

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().replace(/[\u0000-\u001f]/g, "").toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
    // data: images are rejected too: they are the common bypass for svg payloads.
    return false;
  }
  return true;
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  if (typeof document === "undefined") return "";

  const template = document.createElement("template");
  template.innerHTML = dirty;

  const walk = (node: ParentNode) => {
    // Copy the list first: the loop removes nodes as it goes.
    const children = Array.from(node.children);
    for (const child of children) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.remove();
        continue;
      }

      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const allowedForTag = ALLOWED_ATTRS[child.tagName];
        const permitted =
          GLOBAL_ATTRS.has(name) || (allowedForTag ? allowedForTag.has(name) : false);

        if (!permitted || name.startsWith("on")) {
          child.removeAttribute(attr.name);
          continue;
        }

        if ((name === "href" || name === "src") && !isSafeUrl(attr.value)) {
          child.removeAttribute(attr.name);
        }
      }

      if (child.tagName === "A") {
        child.setAttribute("rel", "noopener noreferrer nofollow");
      }

      walk(child);
    }
  };

  walk(template.content);

  const out = document.createElement("div");
  out.appendChild(template.content.cloneNode(true));
  return out.innerHTML;
}
