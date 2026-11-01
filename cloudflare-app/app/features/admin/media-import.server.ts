import legacy from "../../legacy-media.json";

export type LegacyImage = { path: string; bytes: number; folder: string };

export const BATCH_SIZE = 8;
export const LEGACY_IMAGES = (legacy as LegacyImage[]).filter(
  (item) => item.path.startsWith("/images/") || item.path.startsWith("/uploads/")
);

export function requireStaging(env: Env) {
  if (env.GOCAMP_ENV !== "staging") throw new Response("Not found", { status: 404 });
}

// Post-migration verification only: GitHub binaries and public static copies
// are no longer an upload source. All objects must exist in the bound R2 bucket.
export async function importLegacyImage(item: LegacyImage, _request: Request, env: Env) {
  const key = item.path.slice(1);
  const [object, registered] = await Promise.all([
    env.MEDIA.head(key),
    env.DB.prepare(
      "SELECT id,object_key,bytes,sha256 FROM media_assets WHERE legacy_path=? LIMIT 1"
    )
      .bind(item.path)
      .first<{ id: string; object_key: string; bytes: number; sha256: string }>()
  ]);
  if (!object || !registered) throw new Error("Image missing from R2 or D1");
  if (
    object.size !== item.bytes ||
    object.size !== registered.bytes ||
    object.customMetadata?.sha256 !== registered.sha256 ||
    registered.object_key !== key
  ) {
    throw new Error("R2 and D1 image metadata differ");
  }
  return "already-present" as const;
}
