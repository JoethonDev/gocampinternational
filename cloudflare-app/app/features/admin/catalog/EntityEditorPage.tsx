import { Form, Link, useNavigation } from "react-router";
import { VisibilityOverrides } from "../../../components/VisibilityOverrides";
import { asString, type CategoryRecord, type ProgramRecord } from "../../../lib/domain";
import { CategoryFields } from "./CategoryFields";
import { DestinationFields } from "./DestinationFields";
import { ProgramFields } from "./ProgramFields";

type Kind = "program" | "destination" | "category";

const STATUS_OPTIONS: Record<Kind, string[]> = {
  program: ["active", "inactive", "trash"],
  destination: ["active", "inactive", "coming-soon", "trash"],
  category: ["active", "inactive", "trash"]
};

const KIND_LABELS: Record<Kind, string> = {
  program: "program",
  destination: "destination",
  category: "category"
};

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
  const label = KIND_LABELS[kind];
  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to={`/admin/catalog/${kind}`}>← Back</Link>
        <h1 className="h3 mb-0">
          {isNew ? "Create" : "Edit"} {label}
        </h1>
      </div>
      {saved && (
        <div className="alert alert-success" role="status">
          Saved successfully.
        </div>
      )}
      <Form method="post" className="card shadow-sm">
        <div className="card-body row g-3">
          <input type="hidden" name="csrf" value={session.csrf} />
          <input type="hidden" name="revision" value={revision} />
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
              defaultValue={asString(item.status) || "active"}
            >
              {STATUS_OPTIONS[kind].map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
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
          <div className="col-12 d-flex flex-wrap gap-2">
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
          </div>
        </div>
      </Form>
    </>
  );
}
