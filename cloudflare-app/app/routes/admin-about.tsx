import { getCloudflare } from "../lib/cloudflare-context";
import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin-about";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminFormSection } from "../components/admin/AdminFormSection";
import { AdminFormActions } from "../components/admin/AdminFormActions";
import { MediaSelector } from "../components/MediaSelector";
import { ABOUT_PAGE_DEFAULT, SITE, type AboutPageContent, type AboutSection } from "../config/site";
import type { SiteSettings } from "../lib/domain";

export function meta() {
  return [
    { title: "Edit About Us | GoCamp Admin" },
    { name: "robots", content: "noindex,nofollow" }
  ];
}

function readAbout(settings: SiteSettings): AboutPageContent {
  const value = settings.about_page as AboutPageContent | undefined;
  return value && Array.isArray(value.sections) && value.profile ? value : ABOUT_PAGE_DEFAULT;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  const session = await requireAdmin(request, db);
  const row = await db
    .prepare("SELECT content_json,revision FROM site_documents WHERE key='site_settings'")
    .first<{ content_json: string; revision: number }>();
  if (!row) throw new Response("Site settings are missing", { status: 404 });
  return {
    session,
    about: readAbout(JSON.parse(row.content_json) as SiteSettings),
    revision: row.revision,
    saved: new URL(request.url).searchParams.has("saved")
  };
}

function validImage(image: string): boolean {
  return !image || /^\/(?:media|images|uploads)\/[a-zA-Z0-9_/.%+-]+$/.test(image);
}

function validateAbout(value: unknown): value is AboutPageContent {
  if (!value || typeof value !== "object") return false;
  const page = value as AboutPageContent;
  const p = page.profile;
  const validText = (text: unknown, max: number) => typeof text === "string" && text.length <= max;
  return Boolean(
    p &&
    validText(p.name, 160) &&
    validText(p.title, 160) &&
    validText(p.body, 5000) &&
    Array.isArray(page.sections) &&
    page.sections.length > 0 &&
    page.sections.length <= 12 &&
    page.sections.every(
      (s) =>
        s &&
        validText(s.title, 180) &&
        validText(s.image, 1000) &&
        validImage(s.image) &&
        (s.visible === undefined || typeof s.visible === "boolean") &&
        Array.isArray(s.body) &&
        s.body.length <= 12 &&
        s.body.every((paragraph) => validText(paragraph, 3500)) &&
        (s.gallery === undefined ||
          (Array.isArray(s.gallery) &&
            s.gallery.length <= 20 &&
            s.gallery.every(
              (photo) =>
                photo &&
                validText(photo.image, 1000) &&
                validImage(photo.image) &&
                validText(photo.caption, 300) &&
                validText(photo.alt, 300)
            )))
    )
  );
}

function AboutImageField({
  id,
  label,
  value,
  csrf,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  csrf: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-12">
      <MediaSelector
        id={id}
        label={label}
        initial={value}
        externalValue={value}
        onChange={onChange}
        csrf={csrf}
      />
    </div>
  );
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = getCloudflare(context).env.DB;
  const form = await request.formData();
  await verifyAdminPost(request, db, form);
  const revision = Number(form.get("revision"));
  const raw = String(form.get("content") || "");
  if (raw.length > 90000 || !Number.isSafeInteger(revision) || revision < 0)
    throw new Response("Invalid About Us submission", { status: 400 });
  let about: unknown;
  try {
    about = JSON.parse(raw);
  } catch {
    throw new Response("Invalid About Us JSON", { status: 400 });
  }
  if (!validateAbout(about)) throw new Response("Invalid About Us content", { status: 400 });
  const row = await db
    .prepare("SELECT content_json,revision FROM site_documents WHERE key='site_settings'")
    .first<{ content_json: string; revision: number }>();
  if (!row || row.revision !== revision)
    throw new Response("Content changed; reload before saving", { status: 409 });
  const settings = JSON.parse(row.content_json) as SiteSettings;
  const next = { ...settings, about_page: about };
  const result = await db
    .prepare(
      "UPDATE site_documents SET content_json=?,revision=revision+1,updated_at=unixepoch() WHERE key='site_settings' AND revision=?"
    )
    .bind(JSON.stringify(next), revision)
    .run();
  if (result.meta.changes !== 1)
    throw new Response("Content changed; reload before saving", { status: 409 });
  return redirect("/admin/about?saved=1");
}

export default function AdminAbout({ loaderData }: Route.ComponentProps) {
  const { session, about: initial, revision, saved } = loaderData;
  const [about, setAbout] = useState<AboutPageContent>(initial);
  const navigation = useNavigation();
  const setProfile = (field: keyof AboutPageContent["profile"], value: string) =>
    setAbout((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  const setSection = (index: number, patch: Partial<AboutSection>) =>
    setAbout((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, ...patch } : section
      )
    }));
  const shift = (index: number, direction: -1 | 1) =>
    setAbout((prev) => {
      const next = [...prev.sections];
      const other = index + direction;
      if (other >= 0 && other < next.length)
        [next[index], next[other]] = [next[other], next[index]];
      return { ...prev, sections: next };
    });
  const setPhoto = (
    sectionIndex: number,
    photoIndex: number,
    field: "image" | "caption" | "alt",
    value: string
  ) => {
    const next = [...(about.sections[sectionIndex].gallery || [])];
    next[photoIndex] = { ...next[photoIndex], [field]: value };
    setSection(sectionIndex, { gallery: next });
  };
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="About Us"
        description="Edit the director profile, company sections, images and gallery. Changes are saved to the site content database."
      />
      {saved && (
        <div className="alert alert-success" role="status">
          About Us content saved.
        </div>
      )}
      <Form method="post" className="admin-about-form">
        <input type="hidden" name="csrf" value={session.csrf} />
        <input type="hidden" name="revision" value={revision} />
        <input type="hidden" name="content" value={JSON.stringify(about)} />
        <AdminFormSection
          title="Director profile"
          description="The introduction shown on the public About page."
          className="admin-about-section"
        >
          <div className="col-md-6">
            <label className="form-label" htmlFor="about-profile-name">
              Name
            </label>
            <input
              className="form-control"
              id="about-profile-name"
              value={about.profile.name}
              onChange={(event) => setProfile("name", event.target.value)}
              maxLength={160}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="about-profile-title">
              Position
            </label>
            <input
              className="form-control"
              id="about-profile-title"
              value={about.profile.title}
              onChange={(event) => setProfile("title", event.target.value)}
              maxLength={160}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="about-profile-body">
              Professional introduction
            </label>
            <textarea
              className="form-control"
              id="about-profile-body"
              rows={5}
              value={about.profile.body}
              onChange={(event) => setProfile("body", event.target.value)}
              maxLength={5000}
            />
          </div>
        </AdminFormSection>
        {about.sections.map((section, index) => (
          <AdminFormSection
            key={index}
            title={`Section ${index + 1}`}
            description="Edit this public section or change its order."
            className="admin-about-section"
            action={
              <div className="admin-row-actions">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  disabled={index === 0}
                  aria-label={`Move section ${index + 1} up`}
                  onClick={() => shift(index, -1)}
                >
                  <i className="bi bi-arrow-up" aria-hidden="true" /> <span>Up</span>
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  disabled={index === about.sections.length - 1}
                  aria-label={`Move section ${index + 1} down`}
                  onClick={() => shift(index, 1)}
                >
                  <i className="bi bi-arrow-down" aria-hidden="true" /> <span>Down</span>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  type="button"
                  disabled={about.sections.length === 1}
                  aria-label={`Remove section ${index + 1}`}
                  onClick={() =>
                    setAbout((prev) => ({
                      ...prev,
                      sections: prev.sections.filter((_, i) => i !== index)
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            }
          >
            <div className="col-12">
              <label
                className="form-check admin-about-visibility"
                htmlFor={`about-visible-${index}`}
              >
                <input
                  id={`about-visible-${index}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={section.visible !== false}
                  onChange={(event) => setSection(index, { visible: event.target.checked })}
                />
                <span className="form-check-label">Show this section on the public page</span>
              </label>
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor={`about-title-${index}`}>
                Title
              </label>
              <input
                className="form-control"
                id={`about-title-${index}`}
                required
                maxLength={180}
                value={section.title}
                onChange={(event) => setSection(index, { title: event.target.value })}
              />
            </div>
            <AboutImageField
              id={`about-image-${index}`}
              label={`Section ${index + 1}`}
              value={section.image}
              csrf={session.csrf}
              onChange={(image) => setSection(index, { image })}
            />
            <div className="col-12">
              <label className="form-label" htmlFor={`about-body-${index}`}>
                Paragraphs (separate with a blank line)
              </label>
              <textarea
                className="form-control"
                id={`about-body-${index}`}
                rows={6}
                value={section.body.join("\n\n")}
                onChange={(event) =>
                  setSection(index, { body: event.target.value.split(/\n\s*\n/).filter(Boolean) })
                }
              />
            </div>
            <div className="col-12">
              <label className="form-check admin-about-visibility">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={Boolean(section.reverse)}
                  onChange={(event) => setSection(index, { reverse: event.target.checked })}
                />
                <span className="form-check-label">Reverse image and text</span>
              </label>
            </div>
            {section.gallery?.length ? (
              <div className="col-12">
                <h3 className="h6 mb-3">Gallery images</h3>
                <div className="admin-about-gallery">
                  {section.gallery?.map((photo, photoIndex) => (
                    <section className="admin-about-gallery-item" key={photoIndex}>
                      <div className="admin-about-gallery-heading">
                        <strong>Image {photoIndex + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          aria-label={`Remove gallery image ${photoIndex + 1} from section ${index + 1}`}
                          onClick={() =>
                            setSection(index, {
                              gallery: section.gallery?.filter((_, i) => i !== photoIndex)
                            })
                          }
                        >
                          Remove image
                        </button>
                      </div>
                      <AboutImageField
                        id={`about-gallery-${index}-${photoIndex}`}
                        label={`Gallery ${photoIndex + 1}`}
                        value={photo.image}
                        csrf={session.csrf}
                        onChange={(image) => setPhoto(index, photoIndex, "image", image)}
                      />
                      <label
                        className="form-label"
                        htmlFor={`about-gallery-caption-${index}-${photoIndex}`}
                      >
                        Caption
                        <input
                          id={`about-gallery-caption-${index}-${photoIndex}`}
                          className="form-control mt-1"
                          value={photo.caption}
                          onChange={(event) =>
                            setPhoto(index, photoIndex, "caption", event.target.value)
                          }
                          maxLength={300}
                        />
                      </label>
                      <label
                        className="form-label"
                        htmlFor={`about-gallery-alt-${index}-${photoIndex}`}
                      >
                        Alt text
                        <input
                          id={`about-gallery-alt-${index}-${photoIndex}`}
                          className="form-control mt-1"
                          value={photo.alt}
                          onChange={(event) =>
                            setPhoto(index, photoIndex, "alt", event.target.value)
                          }
                          maxLength={300}
                        />
                      </label>
                    </section>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="col-12">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                disabled={(section.gallery?.length || 0) >= 20}
                aria-label={`Add image to section ${index + 1} gallery`}
                onClick={() =>
                  setSection(index, {
                    gallery: [
                      ...(section.gallery || []),
                      { image: SITE.images.placeholder, caption: "", alt: "" }
                    ]
                  })
                }
              >
                Add gallery image
              </button>
            </div>
          </AdminFormSection>
        ))}
        <button
          type="button"
          className="btn btn-outline-primary admin-about-add-section"
          disabled={about.sections.length >= 12}
          onClick={() =>
            setAbout((prev) => ({
              ...prev,
              sections: [
                ...prev.sections,
                { title: "New section", image: SITE.images.placeholder, body: [""] }
              ]
            }))
          }
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true" /> Add About section
        </button>
        <AdminFormActions>
          <button className="btn btn-primary" type="submit" disabled={navigation.state !== "idle"}>
            {navigation.state === "idle" ? "Save About Us" : "Saving…"}
          </button>
          <span className="text-secondary small ms-auto">Revision {revision}</span>
        </AdminFormActions>
      </Form>
    </AdminShell>
  );
}
