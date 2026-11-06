import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { getPlatformProxy } from "wrangler";
import { loadTypeScript } from "./load-typescript.mjs";

const { checkedWrite, runAtomicBatch } = await loadTypeScript("../app/lib/db.server.ts");

test(
  "real local D1 commits successful checked writes and rolls back a later conflict",
  { timeout: 30000 },
  async () => {
    const proxy = await getPlatformProxy({
      configPath: fileURLToPath(new URL("./fixtures/wrangler.json", import.meta.url)),
      persist: false,
      remoteBindings: false,
      envFiles: []
    });
    try {
      const db = proxy.env.DB;
      await db
        .prepare("CREATE TABLE records(id TEXT PRIMARY KEY,value TEXT,revision INTEGER)")
        .run();
      await db.batch([
        db.prepare("INSERT INTO records VALUES('one','original',0)"),
        db.prepare("INSERT INTO records VALUES('two','concurrent',1)")
      ]);
      await assert.rejects(
        runAtomicBatch(db, [
          ...checkedWrite(
            db,
            db.prepare(
              "UPDATE records SET value='stale',revision=revision+1 WHERE id='one' AND revision=0"
            )
          ),
          ...checkedWrite(
            db,
            db.prepare(
              "UPDATE records SET value='stale',revision=revision+1 WHERE id='two' AND revision=0"
            )
          )
        ]),
        (error) => error instanceof Response && error.status === 409
      );
      assert.equal(
        (await db.prepare("SELECT value FROM records WHERE id='one'").first()).value,
        "original"
      );
      await runAtomicBatch(
        db,
        checkedWrite(
          db,
          db.prepare(
            "UPDATE records SET value='saved',revision=revision+1 WHERE id='one' AND revision=0"
          )
        )
      );
      assert.equal(
        (await db.prepare("SELECT value FROM records WHERE id='one'").first()).value,
        "saved"
      );
    } finally {
      await proxy.dispose();
    }
  }
);
