import { useState } from "react";
import { Link } from "react-router";
import { MediaSelector } from "../../../components/MediaSelector";
import { PUBLIC_CONTENT_FIELDS } from "../../../config/public-content-fields";
import { asDocument } from "./shared";

const GROUP_LABELS: Record<string, string> = {
  site: "Site identity, contact & images",
  home: "Homepage",
  about: "About page",
  contact: "Contact page",
  faq: "FAQ page",
  landing: "Landing page",
  category: "Category pages",
  destination: "Destination pages",
  header: "Navigation",
  footer: "Footer",
  booking: "Booking form",
  social: "Social panels",
  testimonials: "Testimonials",
  program: "Program cards",
  memories: "Memories",
  seo: "Search and sharing previews",
  errors: "Not found and error pages"
};

export function PublicContentEditor({
  value,
  onChange,
  csrf,
  uploadedMedia
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  csrf: string;
  uploadedMedia: string[];
}) {
  const [group, setGroup] = useState("home");
  const document = asDocument(value);
  const content = asDocument(document.public_content);
  const overrides = asDocument(content[group]);
  const change = (key: string, next: string | boolean | undefined) => {
    const entries = { ...overrides };
    if (next === undefined) delete entries[key];
    else entries[key] = next;
    onChange({ ...document, public_content: { ...content, [group]: entries } });
  };
  return (
    <section className="mb-5">
      <h2 className="h4">Public page content</h2>
      <p className="text-secondary">
        Edit text, images, links and section visibility while keeping the current layouts. Reset
        restores the original value. Changes become public when you save.
      </p>
      <p className="small">
        Use the <Link to="/admin/about">About editor</Link> for About copy and the catalog, FAQ,
        memories and testimonial editors for their records.
      </p>
      <label className="form-label" htmlFor="public-content-group">
        Page or shared component
      </label>
      <select
        id="public-content-group"
        className="form-select mb-4"
        value={group}
        onChange={(event) => setGroup(event.target.value)}
      >
        {Object.keys(PUBLIC_CONTENT_FIELDS).map((key) => (
          <option key={key} value={key}>
            {GROUP_LABELS[key] || key}
          </option>
        ))}
      </select>
      <div className="row g-3" key={group}>
        {Object.entries(PUBLIC_CONTENT_FIELDS[group]).map(([key, field]) => {
          const current = overrides[key] ?? field.value;
          const id = `content-${group}-${key.replaceAll(".", "-")}`;
          const label = key
            .replace(
              /^slides\.(\d+)\.(image|title)$/,
              (_match, index, part) => `Hero slide ${Number(index) + 1} ${part}`
            )
            .replaceAll("images.", "")
            .replaceAll("-", " ")
            .replaceAll(".", " / ")
            .slice(0, 90);
          return (
            <div className="col-12" key={key}>
              <div className="border rounded-3 p-3">
                {field.kind === "visibility" ? (
                  <label className="d-flex gap-2 align-items-center" htmlFor={id}>
                    <input
                      id={id}
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={current === true}
                      onChange={(event) => change(key, event.target.checked)}
                    />
                    {label}
                  </label>
                ) : field.kind === "image" ? (
                  <MediaSelector
                    id={id}
                    label={label}
                    initial={String(current)}
                    externalValue={String(current)}
                    onChange={(next) => change(key, next)}
                    uploaded={uploadedMedia}
                    csrf={csrf}
                  />
                ) : (
                  <>
                    <label htmlFor={id} className="form-label">
                      {label}
                    </label>
                    {field.kind === "text" && String(field.value).length > 120 ? (
                      <textarea
                        id={id}
                        className="form-control"
                        rows={3}
                        maxLength={5000}
                        value={String(current)}
                        onChange={(event) => change(key, event.target.value)}
                      />
                    ) : (
                      <input
                        id={id}
                        className="form-control"
                        type="text"
                        maxLength={5000}
                        value={String(current)}
                        onChange={(event) => change(key, event.target.value)}
                      />
                    )}
                    {(field.kind === "link" || field.kind === "external") && (
                      <div className="form-text">
                        {field.kind === "external"
                          ? "Enter an HTTPS address."
                          : "Use a site path, HTTPS URL, mailto: or tel: link."}
                      </div>
                    )}
                  </>
                )}
                {Object.hasOwn(overrides, key) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link px-0 mt-1"
                    onClick={() => change(key, undefined)}
                  >
                    Reset to original
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
