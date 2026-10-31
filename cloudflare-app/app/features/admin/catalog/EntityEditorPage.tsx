import { Form, Link, useNavigation } from "react-router";
import { AdminFormActions } from "../../../components/admin/AdminFormActions";
import { AdminFormSection } from "../../../components/admin/AdminFormSection";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { VisibilityOverrides } from "../../../components/VisibilityOverrides";
import { CATALOG_KIND_META, CATALOG_STATUS_OPTIONS } from "../../../config/catalog";
import { asString, type CategoryRecord, type ProgramRecord } from "../../../lib/domain";
import { CategoryFields } from "./CategoryFields";
import { DestinationFields } from "./DestinationFields";
import { ProgramFields } from "./ProgramFields";

type Kind = "program" | "destination" | "category";

export function EntityEditorPage({
  session,
  kind,
  slug,
  isNew,
  item,
  revision,
  categories,
  programs,
  uploadedMedia,
  saved
}: {
  session: { username: string; csrf: string };
  kind: Kind;
  slug: string;
  isNew: boolean;
  item: Record<string, unknown>;
  revision: number;
  categories: CategoryRecord[];
  programs: ProgramRecord[];
  uploadedMedia: string[];
  saved: boolean;
}) {
  const navigation = useNavigation();
  const meta = CATALOG_KIND_META[kind];
  const currentStatus = asString(item.status) || "active";
  const title = isNew ? `New ${meta.singular.toLowerCase()}` : String(item.name || slug);

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <div>
          <Link to={`/admin/catalog/${kind}`} className="admin-back-link">
            <i className="bi bi-arrow-left" /> Back to {meta.label.toLowerCase()}
          </Link>
          <h1 className="h3 mb-1">{title}</h1>
          <p className="text-secondary small mb-0">
            {isNew ? "Create a new record." : `Editing ${kind} · ${slug}`}
          </p>
        </div>
        {!isNew && <StatusBadge status={currentStatus} />}
      </div>
      {saved && (
        <div className="alert alert-success" role="status">
          Saved successfully.
        </div>
      )}
      <Form method="post" className="admin-editor-form">
        <input type="hidden" name="csrf" value={session.csrf} />
        <input type="hidden" name="revision" value={revision} />
        <AdminFormSection
          title="Identity"
          description="The stable record ID, display name and publication state."
        >
          <div className="col-md-6">
            <label className="form-label" htmlFor="entitySlug">
              ID / Slug
            </label>
            <input
              className="form-control"
              id="entitySlug"
              name="slug"
              required
              maxLength={160}
              pattern="[a-z0-9][a-z0-9_-]*"
              defaultValue={isNew ? "" : slug}
            />
            <div className="form-text">Changing this updates saved references to the record.</div>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="entityName">
              Name
            </label>
            <input
              required
              className="form-control"
              id="entityName"
              name="name"
              maxLength={160}
              defaultValue={asString(item.name)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="entityStatus">
              Status
            </label>
            <select
              className="form-select"
              id="entityStatus"
              name="status"
              defaultValue={currentStatus}
            >
              {CATALOG_STATUS_OPTIONS[kind].map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </AdminFormSection>
        {kind === "program" && (
          <ProgramFields item={item} categories={categories} uploadedMedia={uploadedMedia} />
        )}
        {kind === "destination" && (
          <DestinationFields item={item} programs={programs} uploadedMedia={uploadedMedia} />
        )}
        {kind === "category" && <CategoryFields item={item} uploadedMedia={uploadedMedia} />}
        <VisibilityOverrides
          kind={kind}
          initial={(item.visibility_overrides as Record<string, unknown> | undefined) || {}}
        />
        <AdminFormActions>
          <button disabled={navigation.state !== "idle"} className="btn btn-primary px-4">
            {navigation.state !== "idle" ? "Saving..." : "Save changes"}
          </button>
          {!isNew && (
            <button
              disabled={navigation.state !== "idle"}
              className="btn btn-outline-secondary"
              name="intent"
              value="duplicate"
              formNoValidate
              onClick={(event) => {
                if (!window.confirm("Create an active copy of this record?")) {
                  event.preventDefault();
                }
              }}
            >
              Duplicate as active copy
            </button>
          )}
          <span className="small text-secondary ms-auto">Revision {revision}</span>
        </AdminFormActions>
      </Form>
    </div>
  );
}
