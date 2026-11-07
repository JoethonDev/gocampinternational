import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1 } from "./sqlite-d1.mjs";

const { RATE_LIMIT_RETENTION_SECONDS, pruneExpiredRateLimits } = await loadTypeScript(
  "../app/lib/rate-limit.server.ts"
);

test("rate-limit cleanup removes expired address hashes and retains current windows", async () => {
  const db = new SqliteD1();
  const now = Date.parse("2026-11-07T12:00:00.000Z");
  const nowSeconds = Math.floor(now / 1000);
  const insert = db.sql.prepare(
    "INSERT INTO submission_limits(scope,address_hash,window_start,attempts) VALUES(?,?,?,1)"
  );
  insert.run("contact", "expired-hash", nowSeconds - RATE_LIMIT_RETENTION_SECONDS - 1);
  insert.run("contact", "recent-hash", nowSeconds - 900);

  const result = await pruneExpiredRateLimits(db, now);
  assert.equal(result.meta.changes, 1);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM submission_limits").get().count, 1);
  assert.equal(
    db.sql.prepare("SELECT address_hash FROM submission_limits").get().address_hash,
    "recent-hash"
  );
});
