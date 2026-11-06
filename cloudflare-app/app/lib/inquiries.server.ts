import { consumeRateLimit } from "./rate-limit.server";
import { limitRequestBody } from "./request.server";

export type InquiryKind = "contact" | "lead" | "newsletter";
type FormValues = Record<string, unknown>;

const noStore = { "cache-control": "no-store" };
const fail = (message: string, status = 400) =>
  Response.json({ success: false, error: message }, { status, headers: noStore });

const clean = (value: unknown, maxLength: number) =>
  typeof value === "string"
    ? value
        .replace(/[\r\n]/g, "")
        .replace(/%0[ad]/gi, "")
        .trim()
        .slice(0, maxLength + 1)
    : "";

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANDING_INTERESTS = new Set(["Sports", "Language", "Leadership", "Academic"]);

function readBody(
  request: Request,
  kind: InquiryKind,
  forceLanding: boolean
): Promise<FormValues | Response> {
  return (async () => {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const input = await request.json();
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          return fail("Invalid request");
        }
        return input as FormValues;
      }
      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const form = await request.formData();
        const values: FormValues = Object.fromEntries(form.entries());
        if (kind === "lead" && (forceLanding || values.source === "Landing Page")) {
          values["interests[]"] = form.getAll("interests[]");
        }
        return values;
      }
      return fail("Unsupported format", 415);
    } catch {
      return fail("Invalid request");
    }
  })();
}

function validateLanding(values: FormValues): { extra: Record<string, string> } | Response {
  const age = clean(values.age, 3);
  const gender = clean(values.gender, 10);
  const interests = values["interests[]"];
  const choices = Array.isArray(interests) ? interests : interests ? [interests] : [];
  if (
    !/^(?:[7-9]|1[0-8])$/.test(age) ||
    !["Male", "Female"].includes(gender) ||
    !["on", "1", "yes"].includes(String(values.privacyConsent || "")) ||
    choices.length > 4 ||
    choices.some((choice) => typeof choice !== "string" || !LANDING_INTERESTS.has(choice))
  ) {
    return fail("Please enter the child's age, gender, and privacy consent correctly");
  }
  return {
    extra: {
      age,
      gender,
      interests: choices.join(", "),
      privacyConsent: "yes"
    }
  };
}

export async function submitInquiry(
  request: Request,
  db: D1Database,
  kind: InquiryKind,
  forceLanding = false
): Promise<Response> {
  if (request.method !== "POST") return fail("Method not allowed", 405);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return fail("Invalid request origin", 403);
  }
  try {
    request = await limitRequestBody(request, 16384);
  } catch (error) {
    if (error instanceof Response && error.status === 413) return fail("Request too large", 413);
    throw error;
  }

  const values = await readBody(request, kind, forceLanding);
  if (values instanceof Response) return values;
  if (forceLanding) values.source = "Landing Page";

  // Honeypot: accept the request without persisting it.
  if (values.website) {
    return Response.json({ success: true, message: "Request received" }, { headers: noStore });
  }

  const name = clean(values.name, 100);
  const email = clean(values.email, 254);
  const phone = clean(values.phone, 30);
  if (
    !VALID_EMAIL.test(email) ||
    email.length > 254 ||
    (kind !== "newsletter" && (name.length === 0 || name.length > 100))
  ) {
    return fail("Invalid name or email");
  }
  if (kind === "lead" && (phone.length === 0 || phone.length > 30)) {
    return fail("Invalid phone");
  }

  const extra: Record<string, string> = {};
  if (kind === "contact") {
    for (const [key, max] of [
      ["country", 100],
      ["subject", 200],
      ["message", 5000]
    ] as const) {
      const value = typeof values[key] === "string" ? values[key].trim() : "";
      if (value.length > max) return fail("Field too long");
      extra[key] = value;
    }
  }

  if (kind === "contact" && !extra.message) {
    return fail("Please include a message describing your enquiry");
  }

  if (kind === "lead") {
    for (const [key, max] of [
      ["interest", 5000],
      ["source", 5000]
    ] as const) {
      const value = clean(values[key], max);
      if (value.length > max) return fail("Field too long");
      extra[key] = value;
    }
    if (values.source === "Landing Page") {
      const landing = validateLanding(values);
      if (landing instanceof Response) return landing;
      Object.assign(extra, landing.extra);
    }
  }

  if (phone.length > 30) return fail("Invalid phone");
  if (!(await consumeRateLimit(db, request, kind, kind === "newsletter" ? 600 : 60, 5))) {
    return fail("Too many requests, try again later", 429);
  }

  const id = crypto.randomUUID();
  const payload = { name, email, phone, ...extra };
  await db
    .prepare(
      "INSERT INTO inquiries(id,kind,name,email,phone,status,content_json) VALUES(?,?,?,?,?,'new',?)"
    )
    .bind(id, kind, name, email, phone, JSON.stringify(payload))
    .run();
  return Response.json(
    {
      success: true,
      message: kind === "newsletter" ? "Subscribed successfully" : "Message saved successfully"
    },
    { headers: noStore }
  );
}
