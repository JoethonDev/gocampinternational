import {
  analyticsPageContext,
  type AnalyticsEventName,
  type AnalyticsEventV1
} from "./analytics";

function createEvent(
  eventName: AnalyticsEventName,
  elementId: string
): AnalyticsEventV1 | null {
  const context = analyticsPageContext(window.location.pathname, window.location.search);
  if (!context) return null;
  return {
    version: 1,
    eventId: crypto.randomUUID(),
    eventName,
    occurredAt: new Date().toISOString(),
    ...context,
    elementId
  };
}

/** Sends only allowlisted business intent; analytics failures never affect navigation or forms. */
export function trackBusinessEvent(
  eventName: AnalyticsEventName,
  elementId: string,
  targetHref?: string
) {
  if (
    typeof window === "undefined" ||
    document.documentElement.dataset.analyticsEnabled !== "true" ||
    window.location.pathname.startsWith("/admin")
  ) {
    return;
  }

  if (eventName === "whatsapp_click") {
    try {
      const target = new URL(targetHref || "");
      if (target.protocol !== "https:" || !["wa.me", "api.whatsapp.com"].includes(target.hostname))
        return;
    } catch {
      return;
    }
  }
  if (eventName === "contact_cta_click") {
    try {
      if (new URL(targetHref || "").protocol !== "tel:") return;
    } catch {
      return;
    }
  }

  const event = createEvent(eventName, elementId);
  if (!event) return;
  const body = JSON.stringify({ events: [event] });
  try {
    const beaconBody = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/analytics/events", beaconBody)) return;
    void fetch("/api/analytics/events", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true
    }).catch(() => undefined);
  } catch {
    // Telemetry is deliberately best effort.
  }
}
