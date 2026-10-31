import type { CatalogKind } from "./domain";

export type CatalogFormKind = CatalogKind;

export const CATALOG_STATUSES: Record<CatalogFormKind, readonly string[]> = {
  program: ["active", "inactive", "trash"],
  destination: ["active", "inactive", "coming-soon", "trash"],
  category: ["active", "inactive", "trash"]
};

export const isValidCatalogId = (value: string) => /^[a-z0-9][a-z0-9_-]{0,159}$/.test(value);

export const formText = (value: FormDataEntryValue | null, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max + 1) : "";

export function ensureCatalogKind(raw: string): CatalogFormKind {
  if (raw !== "program" && raw !== "destination" && raw !== "category") {
    throw new Response("Not Found", { status: 404 });
  }
  return raw;
}

type FieldDefinition = readonly [name: string, maxLength: number];
type JsonFieldDefinition = readonly [name: string, maxLength: number, type: "string" | "boolean"];

const TEXT_FIELDS: Record<CatalogFormKind, readonly FieldDefinition[]> = {
  program: [
    ["category_slug", 160],
    ["image", 2048],
    ["tagline", 1500],
    ["price", 120],
    ["level", 160],
    ["color", 60],
    ["description", 50000]
  ],
  destination: [
    ["banner", 2048],
    ["tagline", 1500],
    ["intro_text", 50000],
    ["intro_image", 2048],
    ["color", 60]
  ],
  category: [
    ["banner", 2048],
    ["intro", 50000],
    ["intro_image", 2048],
    ["color", 60]
  ]
};

export function readCatalogFields(
  form: FormData,
  kind: CatalogFormKind,
  previous: Record<string, unknown>
): Record<string, unknown> {
  const name = formText(form.get("name"), 160);
  const status = formText(form.get("status"), 40);
  if (!name || name.length > 160 || !CATALOG_STATUSES[kind].includes(status)) {
    throw new Response("Invalid name or status", { status: 400 });
  }

  const data: Record<string, unknown> = { ...previous, name, status };
  for (const [field, maxLength] of TEXT_FIELDS[kind]) {
    const value = formText(form.get(field), maxLength);
    if (value.length > maxLength) {
      throw new Response("Field exceeds maximum length", { status: 400 });
    }
    if (value === "" && !Object.hasOwn(previous, field)) continue;
    data[field] = value;
  }

  const stringArray = (field: string): string[] | null => {
    let values: string[] | null = null;
    const json = form.get(`json_${field}`);
    if (json !== null) {
      if (typeof json !== "string" || json.length > 120000) {
        throw new Response("Structured field too large", { status: 413 });
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new Response("Invalid structured field", { status: 400 });
      }
      if (!Array.isArray(parsed) || parsed.length > 150) {
        throw new Response("Invalid list length", { status: 400 });
      }
      values = parsed
        .map((entry) => {
          if (typeof entry !== "string" || entry.length > 5000) {
            throw new Response("Invalid list item", { status: 400 });
          }
          return entry.trim();
        })
        .filter(Boolean);
    } else if (form.has(field)) {
      const raw = formText(form.get(field), 25000);
      if (raw.length > 25000) {
        throw new Response("Field too large", { status: 400 });
      }
      values = raw
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 150);
    }
    return values;
  };

  const jsonList = (field: string, allowed: readonly JsonFieldDefinition[]) => {
    const raw = form.get(`json_${field}`);
    if (raw === null) return null;
    if (typeof raw !== "string" || raw.length > 120000) {
      throw new Response("Structured field too large", { status: 413 });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Response("Invalid structured field", { status: 400 });
    }
    if (!Array.isArray(parsed) || parsed.length > 150) {
      throw new Response("Invalid list length", { status: 400 });
    }
    return parsed.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Response("Invalid list item", { status: 400 });
      }
      const row = entry as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const [name, maxLength, type] of allowed) {
        if (type === "boolean") {
          cleaned[name] = row[name] !== false;
          continue;
        }
        const value = String(row[name] ?? "").trim();
        if (value.length > maxLength) {
          throw new Response("Field too long", { status: 400 });
        }
        cleaned[name] = value;
      }
      return cleaned;
    });
  };

  if (kind === "program") {
    const order = formText(form.get("order"), 12);
    const duration = formText(form.get("duration"), 12);
    const min = formText(form.get("ages_min"), 3);
    const max = formText(form.get("ages_max"), 3);
    if ([order, duration, min, max].some((value) => value && !/^\d+$/.test(value))) {
      throw new Response("Invalid numeric field", { status: 400 });
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      throw new Response("Invalid ages", { status: 400 });
    }
    data.order = order === "" ? null : Number(order);
    data.duration = duration === "" ? null : Number(duration);
    if (form.get("price") === "" && Object.hasOwn(previous, "price")) {
      data.price = null;
    }
    data.ages = {
      min: min === "" ? null : Number(min),
      max: max === "" ? null : Number(max)
    };
    for (const field of ["highlights", "includes", "excludes", "badges", "gallery"]) {
      const values = stringArray(field);
      if (values !== null) data[field] = values;
    }
    const schedule = jsonList("schedule", [
      ["time", 100, "string"],
      ["description", 3000, "string"]
    ]);
    if (schedule) {
      const scheduled = schedule.filter((entry) => entry.time);
      if (scheduled.length) {
        data.schedule = Object.fromEntries(
          scheduled.map((entry) => [entry.time, entry.description])
        );
      } else if (Array.isArray(previous.schedule)) {
        data.schedule = [];
      } else if (Object.hasOwn(previous, "schedule")) {
        data.schedule = {};
      } else {
        delete data.schedule;
      }
    }
    data.id = String(previous.id || form.get("slug") || "");
  }

  if (kind === "destination") {
    const ids = formText(form.get("program_ids"), 20000);
    data.program_ids = ids
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 150);
    const highlights = jsonList("highlights", [
      ["icon", 160, "string"],
      ["text", 3000, "string"]
    ]);
    if (highlights) data.highlights = highlights;
    const stats = jsonList("stats", [
      ["number", 100, "string"],
      ["suffix", 100, "string"],
      ["label", 300, "string"],
      ["icon", 160, "string"]
    ]);
    if (stats) data.stats = stats;
    const faq = jsonList("faq", [
      ["q", 3000, "string"],
      ["a", 20000, "string"]
    ]);
    if (faq) data.faq = faq;
    const gallery = stringArray("gallery");
    if (gallery !== null) data.gallery = gallery;
  }

  if (kind === "category") {
    data.section_visibility = previous.section_visibility || {};
    const sections = jsonList("sections", [
      ["title", 500, "string"],
      ["content", 40000, "string"],
      ["image", 2048, "string"],
      ["is_active", 0, "boolean"]
    ]);
    if (sections) data.sections = sections;
    const gallery = stringArray("gallery");
    if (gallery !== null) data.gallery = gallery;
  }

  const overrides = formText(form.get("visibility_overrides"), 25000);
  if (overrides) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(overrides);
    } catch {
      throw new Response("Invalid visibility JSON", { status: 400 });
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Response("Visibility overrides must be an object", { status: 400 });
    }
    data.visibility_overrides = parsed;
  }

  return data;
}
