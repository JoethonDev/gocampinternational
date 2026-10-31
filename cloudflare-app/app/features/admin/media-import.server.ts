import legacy from "../../legacy-media.json";

export type LegacyImage = { path: string; bytes: number; folder: string };

export const BATCH_SIZE = 8;
export const LEGACY_IMAGES = (legacy as LegacyImage[]).filter((item) =>
  item.path.startsWith("/images/")
);

const FORMATS: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon"
};

export function requireStaging(env: Env) {
  if (env.GOCAMP_ENV !== "staging") throw new Response("Not found", { status: 404 });
}

export async function importLegacyImage(item: LegacyImage, request: Request, env: Env) {
  const key = item.path.slice(1);
  const ext = key.split(".").at(-1)?.toLowerCase() || "";
  const mime = FORMATS[ext];
  if (!mime) throw new Error("Unsupported extension");
  const assetResponse = await env.ASSETS.fetch(
    new Request(new URL(item.path, request.url), { method: "GET" })
  );
  if (!assetResponse.ok) {
    throw new Error("Source asset returned HTTP " + assetResponse.status);
  }
  const buffer = await assetResponse.arrayBuffer();
  if (buffer.byteLength !== item.bytes) {
    throw new Error("Source length differs from repository inventory");
  }
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const stored = await env.MEDIA.head(key);
  if (stored) {
    if (stored.size !== buffer.byteLength || stored.customMetadata?.sha256 !== hash) {
      throw new Error("Existing R2 object differs from source; refusing to overwrite");
    }
    return "already-present" as const;
  }
  await env.MEDIA.put(key, buffer, {
    httpMetadata: { contentType: mime, cacheControl: "public, max-age=86400" },
    customMetadata: { sha256: hash }
  });
  const verified = await env.MEDIA.head(key);
  if (
    !verified ||
    verified.size !== buffer.byteLength ||
    verified.customMetadata?.sha256 !== hash
  ) {
    throw new Error("R2 verification failed");
  }
  return "uploaded" as const;
}
