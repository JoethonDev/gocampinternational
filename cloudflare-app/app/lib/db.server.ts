/** Leave room for fixed parameters when constructing D1 IN queries. */
export function chunksOf<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size)
    chunks.push(items.slice(index, index + size));
  return chunks;
}

/** A zero-row optimistic update must fail inside the batch, not after it commits. */
export function checkedWrite(
  db: D1Database,
  statement: D1PreparedStatement
): D1PreparedStatement[] {
  return [
    statement,
    db.prepare(
      // SQLite's abs(INT64_MIN) raises integer overflow. CASE evaluates it only on
      // a conflict, causing D1 to roll back the entire transaction without a guard table.
      "SELECT CASE WHEN changes() = 1 THEN 1 ELSE abs(-9223372036854775808) END AS write_checked"
    )
  ];
}

export async function runAtomicBatch(
  db: D1Database,
  statements: D1PreparedStatement[]
): Promise<void> {
  try {
    await db.batch(statements);
  } catch (error) {
    let cause: unknown = error;
    for (let depth = 0; depth < 4 && cause instanceof Error; depth++, cause = cause.cause) {
      if (
        /integer overflow|UNIQUE constraint failed: catalog_entities\.kind, catalog_entities\.slug/i.test(
          cause.message
        )
      ) {
        throw new Response("Content changed or ID already exists. Reload before saving.", {
          status: 409
        });
      }
    }
    throw error;
  }
}
