export function readPage(url: URL): number {
  const raw = url.searchParams.get("page") || "1";
  const page = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(page) || page < 1) {
    throw new Response("Invalid page cursor", { status: 400 });
  }
  return page;
}
