import type { Route } from "./+types/admin-media-upload";
import { uploadMedia } from "../lib/media.server";

const noStore = { "cache-control": "no-store" };

export function loader() {
  throw new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const form = await request.formData();
    const id = await uploadMedia(request, context.cloudflare.env, form);
    return Response.json({ success: true, id, path: `/media/${id}` }, { headers: noStore });
  } catch (error) {
    if (error instanceof Response) {
      const message = await error.text().catch(() => "Upload failed");
      return Response.json(
        { success: false, error: message },
        { status: error.status, headers: noStore }
      );
    }
    throw error;
  }
}
