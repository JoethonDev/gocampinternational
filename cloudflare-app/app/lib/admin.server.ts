import { redirect } from "react-router";
import { constantTimeEqual, randomHex, sha256Hex } from "./crypto.server";

type AdminEnv = Env & {
  ADMIN_PASSWORD_SHA256?: string;
  ADMIN_USERNAME?: string;
};

const SESSION_COOKIE = "__Host-gc_admin";
const SESSION_TTL_SECONDS = 30 * 60;
const DEFAULT_USERNAME = "gocamp-admin";
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_ATTEMPTS = 5;

export type AdminSession = {
  username: string;
  csrf: string;
  token: string;
};

type SessionRow = {
  username: string;
  csrf_hash: string;
  expires_at: number;
};

function tokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const escaped = SESSION_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([a-f0-9]{64})(?:;|$)`))?.[1] || null;
}

export function secureCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  const site = request.headers.get("Sec-Fetch-Site");
  if (!origin || origin !== new URL(request.url).origin || site === "cross-site") {
    throw new Response("Invalid request origin", { status: 403 });
  }
}

export async function getAdmin(request: Request, db: D1Database): Promise<AdminSession | null> {
  const token = tokenFromRequest(request);
  if (!token) return null;

  const sessionHash = await sha256Hex(token);
  const row = await db
    .prepare(
      "SELECT username,csrf_hash,expires_at FROM admin_sessions WHERE session_hash=? AND expires_at>?"
    )
    .bind(sessionHash, Math.floor(Date.now() / 1000))
    .first<SessionRow>();
  if (!row) return null;

  const csrf = await sha256Hex(`csrf:${token}`);
  if (!constantTimeEqual(await sha256Hex(csrf), row.csrf_hash)) return null;
  return { username: row.username, csrf, token };
}

export async function requireAdmin(request: Request, db: D1Database): Promise<AdminSession> {
  const session = await getAdmin(request, db);
  if (!session) throw redirect("/admin/login");
  return session;
}

export async function verifyAdminPost(
  request: Request,
  db: D1Database,
  form: FormData
): Promise<AdminSession> {
  requireSameOrigin(request);
  const session = await requireAdmin(request, db);
  const csrf = form.get("csrf");
  if (typeof csrf !== "string" || !constantTimeEqual(csrf, session.csrf)) {
    throw new Response("Invalid CSRF token", { status: 403 });
  }
  return session;
}

async function withinLoginRateLimit(request: Request, db: D1Database): Promise<boolean> {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Math.floor(Date.now() / 1000);
  const addressHash = await sha256Hex(`admin-login:${ip}`);
  const row = await db
    .prepare(
      `INSERT INTO submission_limits(scope,address_hash,window_start,attempts)
       VALUES('admin-login',?,?,1)
       ON CONFLICT(scope,address_hash) DO UPDATE SET
         attempts=CASE WHEN window_start <= ? THEN 1 ELSE attempts+1 END,
         window_start=CASE WHEN window_start <= ? THEN ? ELSE window_start END
       WHERE window_start <= ? OR attempts < 5
       RETURNING attempts`
    )
    .bind(
      addressHash,
      now,
      now - LOGIN_WINDOW_SECONDS,
      now - LOGIN_WINDOW_SECONDS,
      now,
      now - LOGIN_WINDOW_SECONDS
    )
    .first<{ attempts: number }>();
  return Boolean(row);
}

export async function login(request: Request, db: D1Database, env: AdminEnv, form: FormData) {
  requireSameOrigin(request);
  if (!(await withinLoginRateLimit(request, db))) {
    return { error: "Too many login attempts. Try again in 15 minutes.", status: 429 };
  }

  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");
  const expected = env.ADMIN_PASSWORD_SHA256;
  if (!expected || !/^[a-f0-9]{64}$/i.test(expected)) {
    return { error: "Admin login is not configured in this environment.", status: 503 };
  }
  if (password.length > 512) {
    return { error: "Invalid login.", status: 401 };
  }

  const digest = await sha256Hex(password);
  const validUsername = username === (env.ADMIN_USERNAME || DEFAULT_USERNAME);
  if (!validUsername || !constantTimeEqual(digest, expected.toLowerCase())) {
    return { error: "Invalid login.", status: 401 };
  }

  const token = randomHex();
  const csrf = await sha256Hex(`csrf:${token}`);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      "INSERT INTO admin_sessions(session_hash,username,csrf_hash,expires_at) VALUES(?,?,?,?)"
    )
    .bind(await sha256Hex(token), username, await sha256Hex(csrf), now + SESSION_TTL_SECONDS)
    .run();
  return { cookie: secureCookie(token), username };
}

export async function logout(request: Request, db: D1Database, form: FormData): Promise<string> {
  const session = await verifyAdminPost(request, db, form);
  await db
    .prepare("DELETE FROM admin_sessions WHERE session_hash=?")
    .bind(await sha256Hex(session.token))
    .run();
  return clearCookie();
}
