import { verifyAdminPost } from "./admin.server";
import {
  CATALOG_STATUSES,
  ensureCatalogKind,
  formText,
  isValidCatalogId,
  readCatalogFields,
  type CatalogFormKind
} from "./catalog-fields.server";

export type Kind = CatalogFormKind;

export const ensureKind = ensureCatalogKind;

export async function saveEntity(
  request: Request,
  db: D1Database,
  kind: Kind,
  form: FormData,
  originalSlug?: string
): Promise<string> {
  await verifyAdminPost(request, db, form);
  const slug = formText(form.get("slug"), 160).toLowerCase();
  if (!isValidCatalogId(slug)) {
    throw new Response("Invalid ID / slug", { status: 400 });
  }

  const original = originalSlug || slug;
  const renamed = Boolean(originalSlug && slug !== originalSlug);
  const row = await db
    .prepare(
      "SELECT content_json,revision,sort_order FROM catalog_entities WHERE kind=? AND slug=?"
    )
    .bind(kind, original)
    .first<{ content_json: string; revision: number; sort_order: number }>();
  const previous = row ? (JSON.parse(row.content_json) as Record<string, unknown>) : {};
  const data = readCatalogFields(form, kind, previous);
  if (kind === "program") data.id = slug;
  if (kind === "destination") data.slug = slug;
  if (kind === "category") data.slug = slug;

  const revision = Number(form.get("revision") || 0);
  const category = kind === "program" ? String(data.category_slug || "") : null;
  const order =
    kind === "program" && data.order !== null && data.order !== undefined
      ? Number(data.order)
      : (row?.sort_order ?? 0);

  if (renamed) {
    const exists = await db
      .prepare("SELECT 1 AS found FROM catalog_entities WHERE kind=? AND slug=?")
      .bind(kind, slug)
      .first();
    if (exists) {
      throw new Response("Another record already uses this ID / slug", { status: 409 });
    }
  }

  const jobs: D1PreparedStatement[] = [];
  if (kind === "destination") {
    const ids = [...new Set((data.program_ids as string[]) || [])];
    data.program_ids = ids;
    const valid = ids.length
      ? await db
          .prepare(
            "SELECT slug FROM catalog_entities WHERE kind='program' AND slug IN (" +
              ids.map(() => "?").join(",") +
              ")"
          )
          .bind(...ids)
          .all<{ slug: string }>()
      : { results: [] as Array<{ slug: string }> };
    if (valid.results.length !== ids.length) {
      throw new Response("Destination references an unknown program", { status: 400 });
    }
  }

  if (row) {
    if (revision !== row.revision) {
      throw new Response("This record was changed by another editor. Reload before saving.", {
        status: 409
      });
    }
    jobs.push(
      db
        .prepare(
          `UPDATE catalog_entities
           SET slug=?,name=?,status=?,category_slug=?,sort_order=?,content_json=?,
               revision=revision+1,updated_at=unixepoch()
           WHERE kind=? AND slug=? AND revision=?`
        )
        .bind(
          slug,
          data.name,
          data.status,
          category,
          order,
          JSON.stringify(data),
          kind,
          original,
          revision
        )
    );
  } else {
    jobs.push(
      db
        .prepare(
          `INSERT INTO catalog_entities
             (kind,slug,name,status,category_slug,sort_order,content_json,revision)
           VALUES(?,?,?,?,?,?,?,0)`
        )
        .bind(kind, slug, data.name, data.status, category, order, JSON.stringify(data))
    );
  }

  if (kind === "destination") {
    const ids = (data.program_ids as string[]) || [];
    if (renamed) {
      jobs.push(
        db
          .prepare("UPDATE destination_programs SET destination_slug=? WHERE destination_slug=?")
          .bind(slug, original)
      );
    }
    jobs.push(db.prepare("DELETE FROM destination_programs WHERE destination_slug=?").bind(slug));
    jobs.push(
      ...ids.map((id, position) =>
        db
          .prepare(
            "INSERT INTO destination_programs(destination_slug,program_slug,position) VALUES(?,?,?)"
          )
          .bind(slug, id, position)
      )
    );
  }

  if (renamed && kind === "program") {
    const oldIds = new Set([original, String(previous.id || original)]);
    jobs.push(
      db
        .prepare("UPDATE destination_programs SET program_slug=? WHERE program_slug=?")
        .bind(slug, original)
    );
    const destinations = await db
      .prepare(
        "SELECT slug,content_json,revision FROM catalog_entities WHERE kind='destination' AND instr(content_json,?)>0"
      )
      .bind(original)
      .all<{ slug: string; content_json: string; revision: number }>();
    for (const destination of destinations.results || []) {
      const payload = JSON.parse(destination.content_json) as Record<string, unknown>;
      if (!Array.isArray(payload.program_ids)) continue;
      const next = (payload.program_ids as unknown[]).map((value) =>
        oldIds.has(String(value)) ? slug : value
      );
      if (JSON.stringify(next) === JSON.stringify(payload.program_ids)) continue;
      payload.program_ids = next;
      jobs.push(
        db
          .prepare(
            `UPDATE catalog_entities
             SET content_json=?,revision=revision+1,updated_at=unixepoch()
             WHERE kind='destination' AND slug=? AND revision=?`
          )
          .bind(JSON.stringify(payload), destination.slug, destination.revision)
      );
    }
  }

  if (renamed && kind === "category") {
    const programs = await db
      .prepare(
        "SELECT slug,content_json,revision FROM catalog_entities WHERE kind='program' AND category_slug=?"
      )
      .bind(original)
      .all<{ slug: string; content_json: string; revision: number }>();
    for (const program of programs.results || []) {
      const payload = JSON.parse(program.content_json) as Record<string, unknown>;
      payload.category_slug = slug;
      jobs.push(
        db
          .prepare(
            `UPDATE catalog_entities
             SET category_slug=?,content_json=?,revision=revision+1,updated_at=unixepoch()
             WHERE kind='program' AND slug=? AND revision=?`
          )
          .bind(slug, JSON.stringify(payload), program.slug, program.revision)
      );
    }
  }

  const results = await db.batch(jobs);
  if (results[0].meta.changes !== 1) {
    throw new Response("Concurrent update or duplicate ID", { status: 409 });
  }
  return slug;
}

export async function duplicateEntity(
  request: Request,
  db: D1Database,
  kind: Kind,
  form: FormData,
  slug: string
): Promise<string> {
  await verifyAdminPost(request, db, form);
  if (!isValidCatalogId(slug)) {
    throw new Response("Invalid source ID", { status: 400 });
  }
  const row = await db
    .prepare(
      "SELECT name,status,category_slug,sort_order,content_json FROM catalog_entities WHERE kind=? AND slug=?"
    )
    .bind(kind, slug)
    .first<{
      name: string;
      status: string;
      category_slug: string | null;
      sort_order: number;
      content_json: string;
    }>();
  if (!row) throw new Response("Record not found", { status: 404 });

  const existing = await db
    .prepare("SELECT slug FROM catalog_entities WHERE kind=? AND slug LIKE ?")
    .bind(kind, `${slug}-copy%`)
    .all<{ slug: string }>();
  const used = new Set((existing.results || []).map((item) => item.slug));
  let next = `${slug}-copy`;
  let suffix = 2;
  while (used.has(next)) next = `${slug}-copy-${suffix++}`;

  const data: Record<string, unknown> = {
    ...(JSON.parse(row.content_json) as Record<string, unknown>),
    name: `${row.name} (Copy)`,
    status: "active"
  };
  if (kind === "program") data.id = next;
  else data.slug = next;

  const jobs: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO catalog_entities
           (kind,slug,name,status,category_slug,sort_order,content_json,revision)
         VALUES(?,?,?,?,?,?,?,0)`
      )
      .bind(
        kind,
        next,
        data.name,
        "active",
        kind === "program" ? String(data.category_slug || "") : null,
        row.sort_order,
        JSON.stringify(data)
      )
  ];

  if (kind === "destination") {
    const links = await db
      .prepare(
        "SELECT program_slug,position FROM destination_programs WHERE destination_slug=? ORDER BY position"
      )
      .bind(slug)
      .all<{ program_slug: string; position: number }>();
    jobs.push(
      ...(links.results || []).map((link) =>
        db
          .prepare(
            "INSERT INTO destination_programs(destination_slug,program_slug,position) VALUES(?,?,?)"
          )
          .bind(next, link.program_slug, link.position)
      )
    );
  }

  const results = await db.batch(jobs);
  if (results[0].meta.changes !== 1) {
    throw new Response("Could not duplicate this record", { status: 409 });
  }
  return next;
}

export async function changeBulkStatus(
  request: Request,
  db: D1Database,
  kind: Kind,
  form: FormData
): Promise<number> {
  await verifyAdminPost(request, db, form);
  const status = formText(form.get("status"), 40);
  if (!CATALOG_STATUSES[kind].includes(status)) {
    throw new Response("Invalid status", { status: 400 });
  }
  const ids = form
    .getAll("ids")
    .map((value) => String(value))
    .filter(isValidCatalogId);
  if (ids.length === 0 || ids.length > 100) {
    throw new Response("Select 1 to 100 records", { status: 400 });
  }
  const unique = [...new Set(ids)];
  const rows = await db
    .prepare(
      "SELECT slug,content_json,revision FROM catalog_entities WHERE kind=? AND slug IN (" +
        unique.map(() => "?").join(",") +
        ")"
    )
    .bind(kind, ...unique)
    .all<{ slug: string; content_json: string; revision: number }>();
  if (rows.results.length !== unique.length) {
    throw new Response("One or more records are unavailable", { status: 409 });
  }
  const jobs = rows.results.map((row) => {
    const data = { ...(JSON.parse(row.content_json) as Record<string, unknown>), status };
    return db
      .prepare(
        `UPDATE catalog_entities
         SET status=?,content_json=?,revision=revision+1,updated_at=unixepoch()
         WHERE kind=? AND slug=? AND revision=?`
      )
      .bind(status, JSON.stringify(data), kind, row.slug, row.revision);
  });
  const results = await db.batch(jobs);
  if (results.some((result) => result.meta.changes !== 1)) {
    throw new Response("Concurrent update detected", { status: 409 });
  }
  return results.length;
}

export async function saveDocument(
  request: Request,
  db: D1Database,
  key: "site_settings" | "camp_memories" | "faq",
  form: FormData
): Promise<void> {
  await verifyAdminPost(request, db, form);
  const raw = formText(form.get("content"), 250000);
  if (raw.length > 250000) {
    throw new Response("Document too large", { status: 413 });
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
  if (key === "faq") {
    if (
      !Array.isArray(value) ||
      value.length > 500 ||
      value.some(
        (entry) => !entry || typeof entry.question !== "string" || typeof entry.answer !== "string"
      )
    ) {
      throw new Response("Invalid FAQ entries", { status: 400 });
    }
  }
  if (key === "camp_memories") {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      !Array.isArray((value as { items?: unknown }).items)
    ) {
      throw new Response("Invalid memories data", { status: 400 });
    }
  }
  if (key === "site_settings") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Response("Invalid settings data", { status: 400 });
    }
  }
  const revision = Number(form.get("revision") || 0);
  const result = await db
    .prepare(
      "UPDATE site_documents SET content_json=?,revision=revision+1,updated_at=unixepoch() WHERE key=? AND revision=?"
    )
    .bind(JSON.stringify(value), key, revision)
    .run();
  if (result.meta.changes !== 1) {
    throw new Response("Document changed; reload to avoid overwriting", { status: 409 });
  }
}
