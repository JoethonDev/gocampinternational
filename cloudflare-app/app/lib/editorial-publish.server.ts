import { loadDocument } from "./catalog.server";

const SNAPSHOT_KEY = "__seo/editorial-published-v1.json";
type EditorialKey = "site_settings" | "faq";

type PublishedEditorial = {
  version: 1;
  publishedAt: string;
  documents: Record<EditorialKey, unknown>;
};

function isPublishedEditorial(value: unknown): value is PublishedEditorial {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const documents = candidate.documents;
  return (
    candidate.version === 1 &&
    typeof candidate.publishedAt === "string" &&
    !!documents &&
    typeof documents === "object" &&
    !Array.isArray(documents) &&
    Object.hasOwn(documents, "site_settings") &&
    Object.hasOwn(documents, "faq")
  );
}

async function readPublished(env: Env): Promise<PublishedEditorial | null> {
  const object = await env.MEDIA.get(SNAPSHOT_KEY);
  if (!object) return null;
  let parsed: unknown;
  try {
    parsed = await object.json();
  } catch {
    throw new Response("Published editorial content is invalid", { status: 503 });
  }
  if (!isPublishedEditorial(parsed)) {
    throw new Response("Published editorial content is invalid", { status: 503 });
  }
  return parsed;
}

/**
 * Editorial copy is frozen to the R2-published snapshot. Until the initial
 * publish, existing D1 content remains readable for a safe migration.
 * Live catalog routes continue to query D1 separately.
 */
export async function loadPublishedDocument<T>(env: Env, key: EditorialKey): Promise<T | null> {
  const published = await readPublished(env);
  if (published) return (published.documents[key] ?? null) as T | null;
  return loadDocument<T>(env.DB, key);
}

export async function editorialPublishedAt(env: Env): Promise<string | null> {
  return (await readPublished(env))?.publishedAt || null;
}

/**
 * One R2 object stores both editorial documents, avoiding a partly published
 * version if an editor publishes while another request is being rendered.
 * Existing R2 data is not deleted, and this key is not public media.
 */
export async function publishEditorialDocuments(env: Env): Promise<string> {
  const [settings, faq] = await Promise.all([
    loadDocument<unknown>(env.DB, "site_settings"),
    loadDocument<unknown>(env.DB, "faq")
  ]);
  if (!settings || !faq) {
    throw new Response("Editorial documents are incomplete", { status: 409 });
  }

  const publishedAt = new Date().toISOString();
  const snapshot: PublishedEditorial = {
    version: 1,
    publishedAt,
    documents: { site_settings: settings, faq }
  };
  await env.MEDIA.put(SNAPSHOT_KEY, JSON.stringify(snapshot), {
    httpMetadata: { contentType: "application/json" }
  });
  return publishedAt;
}
