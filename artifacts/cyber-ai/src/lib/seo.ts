/** Set per-page meta + OG tags. Call in useEffect(() => setSeo({...}), [route]) */
export interface SeoInput {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
}
function upsert(sel: string, attr: string, key: string, val: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
  return el;
}
export function setSeo({ title, description, image, url, type = "website" }: SeoInput) {
  document.title = title;
  upsert(`meta[name="description"]`, "name", "description", "", description);
  upsert(`meta[property="og:title"]`, "property", "og:title", "", title);
  upsert(`meta[property="og:description"]`, "property", "og:description", "", description);
  upsert(`meta[property="og:type"]`, "property", "og:type", "", type);
  if (image) upsert(`meta[property="og:image"]`, "property", "og:image", "", image);
  if (url)   upsert(`meta[property="og:url"]`, "property", "og:url", "", url);
  upsert(`meta[name="twitter:card"]`, "name", "twitter:card", "", image ? "summary_large_image" : "summary");
  upsert(`meta[name="twitter:title"]`, "name", "twitter:title", "", title);
  upsert(`meta[name="twitter:description"]`, "name", "twitter:description", "", description);
  if (image) upsert(`meta[name="twitter:image"]`, "name", "twitter:image", "", image);
  // canonical
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = url ?? window.location.href;
}
