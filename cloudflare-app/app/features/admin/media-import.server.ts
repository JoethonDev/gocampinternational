import legacy from "../../legacy-media.json";

export type LegacyImage = { path: string; bytes: number; folder: string };
export const BATCH_SIZE = 8;
export const LEGACY_IMAGES = (legacy as LegacyImage[]).filter(
  (item) => item.path.startsWith("/images/") || item.path.startsWith("/uploads/")
);
export function requireStaging(env: Env) {
  if (env.GOCAMP_ENV !== "staging") throw new Response("Not found", { status: 404 });
}

// Read-only check. Optimized legacy URLs still resolve by their original path,
// while their D1 registration may point to a content-addressed WebP object.
export async function importLegacyImage(item: LegacyImage, _request: Request, env: Env) {
  const originalKey = item.path.slice(1);
  const registered = await env.DB.prepare(
    "SELECT id,object_key,mime_type,bytes,sha256 FROM media_assets WHERE legacy_path=? LIMIT 1"
  ).bind(item.path).first<{
    id: string; object_key: string; mime_type: string;
    bytes: number; sha256: string;
  }>();
  if (!registered) throw new Error("Legacy path missing from D1");
  const [original, active] = await Promise.all([
    env.MEDIA.head(originalKey),
    env.MEDIA.head(registered.object_key)
  ]);
  if (!original || !active) throw new Error("Missing original or optimized R2 object");
  if (original.size !== item.bytes) {
    throw new Error("Original asset size differs from legacy manifest");
  }
  if (registered.object_key === originalKey) {
    if (active.size !== registered.bytes || active.customMetadata?.sha256 !== registered.sha256) {
      throw new Error("R2 and D1 original metadata differ");
    }
  } else {
    if (!registered.object_key.endsWith(".webp") || registered.mime_type !== "image/webp") {
      throw new Error("Unexpected legacy asset conversion format");
    }
    if (active.size !== registered.bytes || active.customMetadata?.sha256 !== registered.sha256) {
      throw new Error("Optimized WebP metadata differs from D1");
    }
  }
  return "already-present" as const;
}
