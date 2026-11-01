import type { Route } from "./+types/admin-media-upload";
import { MAX_UPLOAD_FILES, uploadMediaFiles } from "../lib/media.server";

const noStore = { "cache-control": "no-store" };

export function loader() {
  throw new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const form = await request.formData();
    const result = await uploadMediaFiles(request, context.cloudflare.env, form);
    return Response.json(
      {
        success: result.uploaded.length > 0,
        files: result.uploaded,
        path: result.uploaded[0]?.path,
        errors: result.errors,
        error:
          result.uploaded.length === 0
            ? `No images were uploaded. ${result.errors[0]?.message || "Try again."}`
            : undefined,
        limit: MAX_UPLOAD_FILES
      },
      { status: result.uploaded.length > 0 ? 200 : 422, headers: noStore }
    );
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
