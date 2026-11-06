/** Enforces the actual streamed size, including requests without Content-Length. */
export async function limitRequestBody(request: Request, maximum: number): Promise<Request> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum) {
    throw new Response("Request too large", { status: 413 });
  }
  if (!request.body) return request;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new Response("Request too large", { status: 413 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request, { body: bytes });
}

export async function readLimitedForm(request: Request, maximum: number): Promise<FormData> {
  const limited = await limitRequestBody(request, maximum);
  try {
    return await limited.formData();
  } catch {
    throw new Response("Invalid form data", { status: 400 });
  }
}
