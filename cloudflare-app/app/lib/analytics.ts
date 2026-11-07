export const ANALYTICS_PAGE_TYPES = [
  "home",
  "destination",
  "category",
  "about",
  "faq",
  "contact",
  "landing"
] as const;

export type AnalyticsPageType = (typeof ANALYTICS_PAGE_TYPES)[number];
export type AnalyticsEventName =
  | "lead_form_open"
  | "whatsapp_click"
  | "contact_cta_click";
export type AnalyticsEntityKind = "destination" | "category";

export type AnalyticsPageContext = {
  pagePath: string;
  pageType: AnalyticsPageType;
  entityKind?: AnalyticsEntityKind;
  entitySlug?: string;
};

export type AnalyticsEventV1 = AnalyticsPageContext & {
  version: 1;
  eventId: string;
  eventName: AnalyticsEventName;
  occurredAt: string;
  elementId: string;
};

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVENT_ID = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const EVENT_ELEMENTS: Record<AnalyticsEventName, readonly string[]> = {
  lead_form_open: ["header_book_now", "mobile_book_now"],
  whatsapp_click: ["contact_whatsapp"],
  contact_cta_click: ["contact_phone", "mobile_phone"]
};

type AnalyticsEnvironment = {
  GOCAMP_ENV: string;
  ANALYTICS_ENABLED?: string;
  ANALYTICS_PRIVACY_NOTICE_PUBLISHED?: string;
  WEB_ANALYTICS_SITE_TAG?: string;
};

/** Collection is deliberately closed by default and limited to the canonical production host. */
export function isAnalyticsCollectionEnabled(
  env: AnalyticsEnvironment,
  url: URL
): boolean {
  return (
    env.GOCAMP_ENV === "production" &&
    env.ANALYTICS_ENABLED === "true" &&
    env.ANALYTICS_PRIVACY_NOTICE_PUBLISHED === "true" &&
    url.protocol === "https:" &&
    url.hostname === "gocampinternational.net" &&
    !url.port
  );
}

export function webAnalyticsSiteTag(
  env: AnalyticsEnvironment,
  url: URL
): string | undefined {
  if (!isAnalyticsCollectionEnabled(env, url)) return undefined;
  return configuredWebAnalyticsSiteTag(env);
}

export function configuredWebAnalyticsSiteTag(
  env: AnalyticsEnvironment
): string | undefined {
  const tag = env.WEB_ANALYTICS_SITE_TAG;
  return tag && /^[a-zA-Z0-9_-]{16,128}$/.test(tag) ? tag : undefined;
}

function validSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 80 && SAFE_SLUG.test(value);
}

function decodedPath(path: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//") || /[?#\\\u0000-\u001f\u007f]/u.test(path)) {
    return null;
  }
  try {
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

/** Converts a browser location into bounded route context without retaining query strings. */
export function analyticsPageContext(
  pathname: string,
  search = ""
): AnalyticsPageContext | null {
  const path = decodedPath(pathname);
  if (path === null) return null;
  if (path === "/") return { pagePath: "/", pageType: "home" };

  const destination = /^\/destinations\/([^/]+)$/.exec(path);
  if (destination && validSlug(destination[1])) {
    return {
      pagePath: pathname,
      pageType: "destination",
      entityKind: "destination",
      entitySlug: destination[1]
    };
  }

  if (path === "/program/category") {
    const slug = new URLSearchParams(search).get("category");
    if (!validSlug(slug)) return null;
    return {
      pagePath: "/program/category",
      pageType: "category",
      entityKind: "category",
      entitySlug: slug
    };
  }

  const staticPages: Record<string, AnalyticsPageType> = {
    "/about": "about",
    "/faq": "faq",
    "/contact": "contact",
    "/landing": "landing"
  };
  const pageType = staticPages[path];
  return pageType ? { pagePath: path, pageType } : null;
}

function validEventPageContext(
  pagePath: unknown,
  pageType: unknown,
  entityKind: unknown,
  entitySlug: unknown
): AnalyticsPageContext | null {
  if (typeof pagePath !== "string" || typeof pageType !== "string") return null;
  const path = decodedPath(pagePath);
  if (path === null) return null;

  const destination = /^\/destinations\/([^/]+)$/.exec(path);
  if (destination) {
    if (
      !validSlug(destination[1]) ||
      pageType !== "destination" ||
      entityKind !== "destination" ||
      entitySlug !== destination[1]
    ) {
      return null;
    }
    return {
      pagePath,
      pageType: "destination",
      entityKind: "destination",
      entitySlug: destination[1]
    };
  }

  if (path === "/program/category") {
    if (pageType !== "category" || entityKind !== "category" || !validSlug(entitySlug)) {
      return null;
    }
    return { pagePath, pageType: "category", entityKind: "category", entitySlug };
  }

  const staticPages: Record<string, AnalyticsPageType> = {
    "/": "home",
    "/about": "about",
    "/faq": "faq",
    "/contact": "contact",
    "/landing": "landing"
  };
  if (
    staticPages[path] !== pageType ||
    (entityKind !== undefined && entityKind !== "") ||
    (entitySlug !== undefined && entitySlug !== "")
  ) {
    return null;
  }
  return { pagePath: path, pageType: pageType as AnalyticsPageType };
}

/** Strictly accepts the small Tier-C event subset; free text and unknown fields are rejected. */
export function validateAnalyticsEvent(
  value: unknown,
  now = Date.now()
): AnalyticsEventV1 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const allowedKeys = new Set([
    "version",
    "eventId",
    "eventName",
    "occurredAt",
    "pagePath",
    "pageType",
    "entityKind",
    "entitySlug",
    "elementId"
  ]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) return null;
  if (
    input.version !== 1 ||
    typeof input.eventId !== "string" ||
    !EVENT_ID.test(input.eventId) ||
    typeof input.occurredAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.occurredAt)
  ) {
    return null;
  }
  const occurredAt = Date.parse(input.occurredAt);
  if (!Number.isFinite(occurredAt) || Math.abs(now - occurredAt) > 15 * 60 * 1000) return null;

  const eventName = input.eventName;
  if (
    eventName !== "lead_form_open" &&
    eventName !== "whatsapp_click" &&
    eventName !== "contact_cta_click"
  ) {
    return null;
  }
  if (
    typeof input.elementId !== "string" ||
    !EVENT_ELEMENTS[eventName].includes(input.elementId)
  ) {
    return null;
  }
  const context = validEventPageContext(
    input.pagePath,
    input.pageType,
    input.entityKind,
    input.entitySlug
  );
  if (!context || (eventName === "whatsapp_click" && context.pagePath !== "/contact")) {
    return null;
  }

  return {
    version: 1,
    eventId: input.eventId,
    eventName,
    occurredAt: input.occurredAt,
    ...context,
    elementId: input.elementId
  };
}
