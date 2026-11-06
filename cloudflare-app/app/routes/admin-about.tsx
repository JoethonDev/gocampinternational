import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/admin-about";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminFormActions } from "../components/admin/AdminFormActions";
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
  const db = context.cloudflare.env.DB;
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

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
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
        description="Edit the director profile, company sections, images and gallery. Changes are stored in staging D1."
      />
      {saved && (
        <div className="alert alert-success" role="status">
          About Us content saved.
        </div>
      )}
      <Form method="post">
        <input type="hidden" name="csrf" value={session.csrf} />
        <input type="hidden" name="revision" value={revision} />
        <input type="hidden" name="content" value={JSON.stringify(about)} />
        <section className="card mb-4">
          <div className="card-body">
            <h2 className="h4">Director profile</h2>
            <label className="form-label" htmlFor="about-profile-name">
              Name
            </label>
            <input
              className="form-control mb-3"
              id="about-profile-name"
              value={about.profile.name}
              onChange={(event) => setProfile("name", event.target.value)}
              maxLength={160}
              required
            />
            <label className="form-label" htmlFor="about-profile-title">
              Position
            </label>
            <input
              className="form-control mb-3"
              id="about-profile-title"
              value={about.profile.title}
              onChange={(event) => setProfile("title", event.target.value)}
              maxLength={160}
              required
            />
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
        </section>
        {about.sections.map((section, index) => (
          <section className="card mb-4" key={index}>
            <div className="card-body">
              <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
                <h2 className="h4 m-0">Section {index + 1}</h2>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    type="button"
                    disabled={index === 0}
                    onClick={() => shift(index, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    type="button"
                    disabled={index === about.sections.length - 1}
                    onClick={() => shift(index, 1)}
                  >
                    Move down
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    type="button"
                    disabled={about.sections.length === 1}
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
              </div>
              <label className="form-label" htmlFor={`about-title-${index}`}>
                Title
              </label>
              <input
                className="form-control mb-3"
                id={`about-title-${index}`}
                required
                maxLength={180}
                value={section.title}
                onChange={(event) => setSection(index, { title: event.target.value })}
              />
              <label className="form-label" htmlFor={`about-image-${index}`}>
                Image path (R2 /media/… or /images/…)
              </label>
              <input
                className="form-control mb-3"
                id={`about-image-${index}`}
                value={section.image}
                onChange={(event) => setSection(index, { image: event.target.value })}
              />
              <label className="form-label" htmlFor={`about-body-${index}`}>
                Paragraphs (separate with a blank line)
              </label>
              <textarea
                className="form-control mb-3"
                id={`about-body-${index}`}
                rows={6}
                value={section.body.join("\n\n")}
                onChange={(event) =>
                  setSection(index, { body: event.target.value.split(/\n\s*\n/).filter(Boolean) })
                }
              />
              <label className="d-flex align-items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={Boolean(section.reverse)}
                  onChange={(event) => setSection(index, { reverse: event.target.checked })}
                />{" "}
                Reverse image and text
              </label>
              {section.gallery?.map((photo, photoIndex) => (
                <div className="border rounded p-3 mb-2" key={photoIndex}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Gallery image {photoIndex + 1}</strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() =>
                        setSection(index, {
                          gallery: section.gallery?.filter((_, i) => i !== photoIndex)
                        })
                      }
                    >
                      Remove image
                    </button>
                  </div>
                  {(["image", "caption", "alt"] as const).map((field) => (
                    <label key={field} className="form-label d-block text-capitalize">
                      {field}
                      <input
                        className="form-control mb-2"
                        value={photo[field]}
                        onChange={(event) => setPhoto(index, photoIndex, field, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
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
          </section>
        ))}
        <button
          type="button"
          className="btn btn-outline-primary mb-4"
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
          Add About section
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
