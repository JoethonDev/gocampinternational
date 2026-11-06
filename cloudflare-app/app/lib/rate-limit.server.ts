import { sha256Hex } from "./crypto.server";

/** Atomically consumes an attempt without extending an existing fixed window. */
export async function consumeRateLimit(
  db: D1Database,
  request: Request,
  scope: string,
  period: number,
  maximum: number
): Promise<boolean> {
  // Cloudflare supplies this header; do not trust client-selected forwarding headers.
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Math.floor(Date.now() / 1000);
  const addressHash = await sha256Hex(`${scope}:${ip}`);
  const cutoff = now - period;
  const row = await db
    .prepare(
      `INSERT INTO submission_limits(scope,address_hash,window_start,attempts)
     VALUES(?,?,?,1)
     ON CONFLICT(scope,address_hash) DO UPDATE SET
       attempts=CASE WHEN window_start <= ? THEN 1 ELSE attempts+1 END,
       window_start=CASE WHEN window_start <= ? THEN ? ELSE window_start END
     WHERE window_start <= ? OR attempts < ?
     RETURNING attempts`
    )
    .bind(scope, addressHash, now, cutoff, cutoff, now, cutoff, maximum)
    .first<{ attempts: number }>();
  return Boolean(row);
}
