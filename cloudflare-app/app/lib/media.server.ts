import { verifyAdminPost } from "./admin.server";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

type ImageType = { type: string; extension: string };

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

export async function uploadMedia(request: Request, env: Env, form: FormData): Promise<string> {
  await verifyAdminPost(request, env.DB, form);
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > MAX_UPLOAD_BYTES) {
    throw new Response("Choose an image up to 3 MB", { status: 413 });
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const imageType = detectImageType(bytes);
  if (!imageType) {
    throw new Response("Unsupported or invalid image format", { status: 415 });
  }

  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
  const checksum = Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
  const existing = await env.DB.prepare(
    "SELECT id FROM media_assets WHERE sha256=? AND is_public=1 LIMIT 1"
  )
    .bind(checksum)
    .first<{ id: string }>();
  if (existing) return existing.id;

  const objectKey = `images/${checksum.slice(0, 2)}/${checksum}.${imageType.extension}`;
  const existed = Boolean(await env.MEDIA.head(objectKey));
  if (!existed) {
    await env.MEDIA.put(objectKey, buffer, {
      httpMetadata: {
        contentType: imageType.type,
        cacheControl: "public,max-age=86400"
      }
    });
  }

  const id = crypto.randomUUID();
  const displayName = file.name.slice(0, 180).replace(/[\u0000-\u001f]/g, "");
  try {
    await env.DB.prepare(
      `INSERT INTO media_assets
           (id,object_key,display_name,mime_type,bytes,sha256,is_public)
         VALUES(?,?,?,?,?,?,1)`
    )
      .bind(id, objectKey, displayName, imageType.type, buffer.byteLength, checksum)
      .run();
  } catch (error) {
    if (!existed) await env.MEDIA.delete(objectKey).catch(() => undefined);
    throw error;
  }
  return id;
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

    const result = await env.DB.prepare("DELETE FROM media_assets WHERE id=?").bind(id).run();
    if (result.meta.changes !== 1) {
      throw new Response("Media changed. Reload.", { status: 409 });
    }
    await env.MEDIA.delete(row.object_key);
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
