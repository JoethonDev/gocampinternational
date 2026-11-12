import { useState } from "react";
import { MediaSelector } from "../../../components/MediaSelector";
import { resolveCatalogSeo, truncateSeoDescription } from "../../../lib/seo";

type CatalogPageKind = "destination" | "category";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function SeoEditor({
  kind,
  slug,
  item,
  uploadedMedia,
  csrf
}: {
  kind: CatalogPageKind;
  slug: string;
  item: Record<string, unknown>;
  uploadedMedia: string[];
  csrf: string;
}) {
  const storedSeo = record(item.seo);
  const [title, setTitle] = useState(string(storedSeo.title));
  const [description, setDescription] = useState(string(storedSeo.description));
  const [imagePath, setImagePath] = useState(
    storedSeo.og_image_id ? `/media/${string(storedSeo.og_image_id)}` : ""
  );
  const [imageAlt, setImageAlt] = useState(string(storedSeo.og_image_alt));
  const [noindex, setNoindex] = useState(storedSeo.noindex === true);
  const [structuredDataEnabled, setStructuredDataEnabled] = useState(
    storedSeo.structured_data_enabled !== false
  );
  const fallbackDescription = item.tagline || item.intro_text || item.intro || "";
  const fallbackImage = item.banner || item.image || "/images/banner.webp";
  const imageId = imagePath.match(/^\/media\/([a-zA-Z0-9_-]{1,160})$/)?.[1] || "";
  const preview = resolveCatalogSeo(kind, item.name, fallbackDescription, fallbackImage, {
    title,
    description,
    og_image_id: imageId,
    og_image_alt: imageAlt,
    noindex
  });
  const canonicalPath =
    kind === "destination"
      ? `/destinations/${encodeURIComponent(slug || "new")}`
      : `/program/category?category=${encodeURIComponent(slug || "new")}`;

  return (
    <section className="card mb-4" aria-labelledby="catalog-seo-title">
      <div className="card-body">
        <h2 className="h5" id="catalog-seo-title">
          Search and sharing preview
        </h2>
        <p className="text-secondary small mb-3">
          These optional overrides update page metadata from D1 when you save this record. The
          canonical URL is fixed to this page's existing route.
        </p>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label" htmlFor="seo-title">
              Search title
            </label>
            <input
              className="form-control"
              id="seo-title"
              name="seoTitle"
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={preview.title}
            />
            <div className="form-text">Leave blank to use the automatic title for this page.</div>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="seo-description">
              Search description
            </label>
            <textarea
              className="form-control"
              id="seo-description"
              name="seoDescription"
              rows={3}
              maxLength={320}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={truncateSeoDescription(fallbackDescription, 320)}
            />
            <div className="form-text">
              Use a factual summary. The page preview is capped at 160 characters and avoids cutting
              a word in half.
            </div>
          </div>
          <div className="col-12">
            <MediaSelector
              id="seo-image"
              name="seoOgImage"
              label="Social sharing image"
              initial={imagePath}
              externalValue={imagePath}
              onChange={setImagePath}
              uploaded={uploadedMedia}
              includeStaticPaths={false}
              csrf={csrf}
            />
            <label className="form-label mt-3" htmlFor="seo-image-alt">
              Image description
            </label>
            <input
              className="form-control"
              id="seo-image-alt"
              name="seoOgImageAlt"
              maxLength={200}
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder={preview.imageAlt}
            />
          </div>
          <div className="col-md-6">
            <label className="d-flex gap-2 align-items-center" htmlFor="seo-noindex">
              <input
                id="seo-noindex"
                className="form-check-input mt-0"
                type="checkbox"
                name="seoNoindex"
                value="true"
                checked={noindex}
                onChange={(event) => setNoindex(event.target.checked)}
              />
              Hide this page from search engines
            </label>
            <div className="form-text">Inactive and coming-soon pages stay noindex regardless.</div>
          </div>
          <div className="col-md-6">
            <label
              className="d-flex gap-2 align-items-center"
              htmlFor="seo-disable-structured-data"
            >
              <input
                id="seo-disable-structured-data"
                className="form-check-input mt-0"
                type="checkbox"
                name="seoDisableStructuredData"
                value="true"
                checked={!structuredDataEnabled}
                onChange={(event) => setStructuredDataEnabled(!event.target.checked)}
              />
              Disable this page's collection structured data
            </label>
          </div>
        </div>
        <div className="border rounded-3 bg-light p-3 mt-4" aria-live="polite">
          <div className="small text-success text-truncate">
            gocampinternational.net{canonicalPath}
          </div>
          <div className="fw-semibold text-primary mt-1">{preview.title}</div>
          <div className="small text-secondary mt-1">
            {truncateSeoDescription(description || fallbackDescription)}
          </div>
          <div className="small text-secondary mt-2">
            Canonical: https://gocampinternational.net{canonicalPath}
          </div>
          {(noindex || item.status !== "active") && (
            <div className="small text-warning-emphasis mt-1">
              This record is configured to be noindex.
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-link px-0 mt-2"
          onClick={() => {
            setTitle("");
            setDescription("");
            setImagePath("");
            setImageAlt("");
            setNoindex(false);
            setStructuredDataEnabled(true);
          }}
        >
          Reset SEO overrides to automatic defaults
        </button>
      </div>
    </section>
  );
}
