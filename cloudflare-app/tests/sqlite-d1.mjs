import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

/** Real SQLite transactions, plus the D1 limits relevant to these regressions. */
export class SqliteD1 {
  sql = new DatabaseSync(":memory:");
  maxBindings = 0;
  beforeWriteBatch;
  beforeRun;

  constructor() {
    for (const migration of [
      "0001_catalog",
      "0002_submission_limits",
      "0004_testimonials",
      "0005_media_variants"
    ]) {
      this.sql.exec(
        readFileSync(new URL(`../server/db/migrations/${migration}.sql`, import.meta.url), "utf8")
      );
    }
  }

  prepare(sql) {
    const db = this;
    return {
      sql,
      values: [],
      bind(...values) {
        db.maxBindings = Math.max(db.maxBindings, values.length);
        if (values.length > 100) throw new Error("D1 parameter limit exceeded");
        if (/\bLIKE\s*\?/i.test(sql) && Buffer.byteLength(values.at(-1)) > 50) {
          throw new Error("D1 LIKE pattern limit exceeded");
        }
        this.values = values;
        return this;
      },
      execute() {
        const statement = db.sql.prepare(sql);
        if (/^\s*(SELECT|PRAGMA)\b/i.test(sql)) {
          return {
            results: statement.all(...this.values).map((row) => ({ ...row })),
            meta: { changes: 0 }
          };
        }
        const result = statement.run(...this.values);
        return { results: [], meta: { changes: Number(result.changes) } };
      },
      async first() {
        return this.execute().results[0] || null;
      },
      async all() {
        return this.execute();
      },
      async run() {
        db.beforeRun?.(this);
        return this.execute();
      }
    };
  }

  async batch(statements) {
    if (
      statements.some(({ sql }) => /^\s*(INSERT|UPDATE|DELETE)\b/i.test(sql)) &&
      this.beforeWriteBatch
    ) {
      const interleave = this.beforeWriteBatch;
      this.beforeWriteBatch = undefined;
      interleave();
    }
    this.sql.exec("BEGIN");
    try {
      const results = statements.map((statement) => statement.execute());
      this.sql.exec("COMMIT");
      return results;
    } catch (error) {
      this.sql.exec("ROLLBACK");
      throw error;
    }
  }
}

export function entity(db, kind, slug, data = {}, revision = 0) {
  const content = { slug, id: slug, name: slug, status: "active", ...data };
  db.sql
    .prepare(
      "INSERT INTO catalog_entities(kind,slug,name,status,category_slug,content_json,revision) VALUES(?,?,?,?,?,?,?)"
    )
    .run(
      kind,
      slug,
      content.name,
      content.status,
      content.category_slug || null,
      JSON.stringify(content),
      revision
    );
}

const token = "a".repeat(64);
const hash = async (value) =>
  Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))).toString(
    "hex"
  );
export async function admin(db, entries = {}) {
  const csrf = await hash(`csrf:${token}`);
  db.sql
    .prepare(
      "INSERT OR IGNORE INTO admin_sessions(session_hash,username,csrf_hash,expires_at) VALUES(?,?,?,?)"
    )
    .run(await hash(token), "test-admin", await hash(csrf), Math.floor(Date.now() / 1000) + 1800);
  const form = new FormData();
  form.set("csrf", csrf);
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) form.append(key, item);
  }
  const headers = { Origin: "https://example.test", Cookie: `__Host-gc_admin=${token}` };
  return {
    form,
    headers,
    request: new Request("https://example.test/admin", { method: "POST", headers })
  };
}

export const statusIs = (status) => (error) => error instanceof Response && error.status === status;
