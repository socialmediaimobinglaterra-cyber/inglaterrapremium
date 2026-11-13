// A valid storage URL is not itself authorization to publish its contents.
export function validPrivateBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.search && !url.hash &&
      /^[a-z0-9-]+\.(?:private|public)\.blob\.vercel-storage\.com$/.test(url.hostname) && url.pathname.length > 1;
  } catch { return false; }
}
export function blobResponseHeaders(contentType: string) {
  const inline = /^image\/(jpeg|png|webp|avif|gif)$/.test(contentType.toLowerCase());
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Content-Type": contentType,
    "Content-Disposition": inline ? "inline" : "attachment",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Vary": "Cookie",
  };
}
