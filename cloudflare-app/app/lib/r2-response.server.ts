/** Shared HTTP behavior for legacy image URLs and the media registry. */
export function r2Response(
  request: Request,
  object: R2Object | R2ObjectBody,
  cacheControl: string,
  contentType?: string
): Response {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Cache-Control", cacheControl);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("ETag", object.httpEtag);
  headers.set("X-GoCamp-Media-Source", "r2");
  const condition = request.headers.get("If-None-Match");
  if (
    condition?.split(",").some((value) => {
      const tag = value.trim().replace(/^W\//, "");
      return tag === "*" || tag === object.httpEtag;
    })
  ) {
    if ("body" in object) void object.body.cancel().catch(() => undefined);
    return new Response(null, { status: 304, headers });
  }
  headers.set("Content-Length", String(object.size));
  return new Response(request.method === "HEAD" || !("body" in object) ? null : object.body, {
    headers
  });
}
