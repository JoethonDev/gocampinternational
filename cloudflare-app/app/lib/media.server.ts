import { verifyAdminPost } from "./admin.server";
import { optimizeStoredMedia } from "./media-optimization.server";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 12;

type ImageType = { type: string; extension: string };
export type UploadedMedia = { id: string; path: string; name: string };
type UploadFailure = { name: string; message: string };

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { type: "image/webp", extension: "webp" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 137 &&
    ascii(bytes, 1, 3) === "PNG" &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  ) {
    return { type: "image/png", extension: "png" };
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return { type: "image/jpeg", extension: "jpg" };
  }
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(ascii(bytes, 0, 6))) {
    return { type: "image/gif", extension: "gif" };
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 4, 4) === "ftyp" &&
    ["avif", "avis"].includes(ascii(bytes, 8, 4))
  ) {
    return { type: "image/avif", extension: "avif" };
  }
  return null;
}


async function hashBytes(bytes: ArrayBuffer) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function uploadOne(file: File, env: Env, ctx?: ExecutionContext): Promise<UploadedMedia> {
  if (!file.size || file.size > MAX_UPLOAD_BYTES) {
    throw new Response("Choose an image up to 3 MB", { status: 413 });
  }
  const source = await file.arrayBuffer();
  const imageType = detectImageType(new Uint8Array(source));
  if (!imageType) {
    throw new Response("Unsupported or invalid image format", { status: 415 });
  }

  const sourceSha = await hashBytes(source);
  const displayName = file.name.slice(0, 180).replace(/[\u0000-\u001f]/g, "");
  // Content hash is the upload cache key. Changed bytes with the same name never
  // collide, and byte-identical uploads with different names reuse one media ID.
  const objectKey = "images/optimized-upload/" + sourceSha.slice(0, 2) +
    "/" + sourceSha + "-webp86-v1.webp";
  const existing = await env.DB.prepare(
    "SELECT id,object_key,mime_type FROM media_assets WHERE object_key=? AND is_public=1 LIMIT 1"
  ).bind(objectKey).first<{ id: string; object_key: string; mime_type: string }>();
  if (existing) {
    ctx?.waitUntil(optimizeStoredMedia(env, existing).catch(() => undefined));
    return { id: existing.id, path: "/media/" + existing.id, name: displayName };
  }
  // Existing WebP assets already registered under a different key are also reusable.
  if (imageType.type === "image/webp") {
    const shared = await env.DB.prepare(
      "SELECT id,object_key,mime_type FROM media_assets WHERE sha256=? AND mime_type='image/webp' AND is_public=1 LIMIT 1"
    ).bind(sourceSha).first<{ id: string; object_key: string; mime_type: string }>();
    if (shared) {
      ctx?.waitUntil(optimizeStoredMedia(env, shared).catch(() => undefined));
      return { id: shared.id, path: "/media/" + shared.id, name: displayName };
    }
  }

  let saved = source;
  const TWO_MB = 2 * 1024 * 1024;
  if (imageType.type !== "image/webp" || source.byteLength > TWO_MB) {
    const run = async (quality: number) => {
      const response = (await env.IMAGES.input(new Blob([source]).stream())
        .transform({ width: 2560, fit: "scale-down" })
        .output({ format: "image/webp", quality, anim: true })).response();
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/webp")) {
        throw new Response("WebP conversion failed", { status: 502 });
      }
      return response.arrayBuffer();
    };
    saved = await run(86);
    if (saved.byteLength > TWO_MB) saved = await run(76);
    if (saved.byteLength > TWO_MB) saved = await run(66);
    if (saved.byteLength > TWO_MB) {
      throw new Response("Optimized image still exceeds 2 MB", { status: 413 });
    }
  }
  const checksum = await hashBytes(saved);
  const existingWebp = await env.DB.prepare(
    "SELECT id,object_key,mime_type FROM media_assets WHERE sha256=? AND mime_type='image/webp' AND is_public=1 LIMIT 1"
  ).bind(checksum).first<{ id: string; object_key: string; mime_type: string }>();
  if (existingWebp) {
    ctx?.waitUntil(optimizeStoredMedia(env, existingWebp).catch(() => undefined));
    return { id: existingWebp.id, path: "/media/" + existingWebp.id, name: displayName };
  }
  const alreadyStored = Boolean(await env.MEDIA.head(objectKey));
  if (!alreadyStored) {
    await env.MEDIA.put(objectKey, saved, {
      httpMetadata: {
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: { sha256: checksum, source_sha256: sourceSha, pipeline: "webp86-v1" }
    });
  }
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(
      "INSERT INTO media_assets (id,object_key,display_name,mime_type,bytes,sha256,is_public) VALUES(?,?,?,'image/webp',?,?,1)"
    ).bind(id, objectKey, displayName, saved.byteLength, checksum).run();
  } catch (error) {
    // Do not remove a content-addressed R2 key that another concurrent request may use.
    const raced = await env.DB.prepare(
      "SELECT id FROM media_assets WHERE object_key=? AND is_public=1 LIMIT 1"
    ).bind(objectKey).first<{ id: string }>();
    if (raced) return { id: raced.id, path: "/media/" + raced.id, name: displayName };
    throw error;
  }
  ctx?.waitUntil(
    optimizeStoredMedia(env, { id, object_key: objectKey, mime_type: "image/webp" })
      .catch(() => undefined)
  );
  return { id, path: "/media/" + id, name: displayName };
}

export async function uploadMedia(request: Request, env: Env, form: FormData, ctx?: ExecutionContext): Promise<string> {
  await verifyAdminPost(request, env.DB, form);
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new Response("Choose an image up to 3 MB", { status: 413 });
  }
  return (await uploadOne(file, env, ctx)).id;
}

export async function uploadMediaFiles(
  request: Request,
  env: Env,
  form: FormData,
  ctx?: ExecutionContext
): Promise<{ uploaded: UploadedMedia[]; errors: UploadFailure[] }> {
  await verifyAdminPost(request, env.DB, form);
  const files = [...form.getAll("files"), ...form.getAll("file")].filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );
  if (!files.length) {
    throw new Response("Choose at least one image up to 3 MB each", { status: 413 });
  }
  if (files.length > MAX_UPLOAD_FILES) {
    throw new Response(`Upload at most ${MAX_UPLOAD_FILES} images at once`, { status: 413 });
  }

  const uploaded: UploadedMedia[] = [];
  const errors: UploadFailure[] = [];
  for (const file of files) {
    try {
      uploaded.push(await uploadOne(file, env, ctx));
    } catch (error) {
      errors.push({
        name: file.name.slice(0, 180),
        message:
          error instanceof Response
            ? await error.text().catch(() => "Upload failed")
            : error instanceof Error
              ? error.message
              : "Upload failed"
      });
    }
  }
  return { uploaded, errors };
}

export async function mutateMedia(request: Request, env: Env, form: FormData): Promise<void> {
  await verifyAdminPost(request, env.DB, form);
  const id = String(form.get("id") || "");
  const operation = String(form.get("operation") || "");
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    throw new Response("Invalid media ID", { status: 400 });
  }

  if (operation === "hide" || operation === "show") {
    const result = await env.DB.prepare("UPDATE media_assets SET is_public=? WHERE id=?")
      .bind(operation === "show" ? 1 : 0, id)
      .run();
    if (result.meta.changes !== 1) throw new Response("Media not found", { status: 404 });
    return;
  }

  if (operation === "delete") {
    const row = await env.DB.prepare("SELECT object_key FROM media_assets WHERE id=?")
      .bind(id)
      .first<{ object_key: string }>();
    if (!row) throw new Response("Media not found", { status: 404 });

    const reference = `/media/${id}`;
    const [catalogRefs, documentRefs] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM catalog_entities WHERE instr(content_json,?)>0")
        .bind(reference)
        .first<{ count: number }>(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM site_documents WHERE instr(content_json,?)>0")
        .bind(reference)
        .first<{ count: number }>()
    ]);
    if ((catalogRefs?.count || 0) + (documentRefs?.count || 0) > 0) {
      throw new Response(
        "This image is still referenced by page content. Replace those references before deletion.",
        { status: 409 }
      );
    }

    const variants = await env.DB.prepare(
      "SELECT object_key FROM media_variants WHERE media_id=?"
    ).bind(id).all<{ object_key: string }>();
    const result = await env.DB.prepare("DELETE FROM media_assets WHERE id=?").bind(id).run();
    if (result.meta.changes !== 1) {
      throw new Response("Media changed. Reload.", { status: 409 });
    }
    await Promise.all([
      env.MEDIA.delete(row.object_key),
      ...(variants.results || []).map((variant) => env.MEDIA.delete(variant.object_key))
    ]);
    return;
  }

  if (operation === "rename") {
    const name = String(form.get("display_name") || "")
      .trim()
      .slice(0, 180);
    if (!name) throw new Response("Name required", { status: 400 });
    const result = await env.DB.prepare("UPDATE media_assets SET display_name=? WHERE id=?")
      .bind(name, id)
      .run();
    if (result.meta.changes !== 1) throw new Response("Media not found", { status: 404 });
    return;
  }

  throw new Response("Invalid operation", { status: 400 });
}
