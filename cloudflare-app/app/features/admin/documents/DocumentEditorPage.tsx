import { Form, useNavigation } from "react-router";
import { useState } from "react";
import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { FaqEditor } from "./FaqEditor";
import { MemoriesEditor } from "./MemoriesEditor";
import { SiteSettingsEditor } from "./SiteSettingsEditor";
import type { DocumentItem, DocumentKey } from "./shared";
import { asDocument, asDocumentArray } from "./shared";

const TITLES: Record<DocumentKey, string> = {
  site_settings: "Site Visibility and Settings",
  faq: "Global FAQs",
  camp_memories: "GoCamp Memories"
};

export function DocumentEditorPage({
  documentKey,
  content,
  revision,
  saved,
  uploadedMedia,
  csrf
}: {
  documentKey: DocumentKey;
  content: string;
  revision: number;
  saved: boolean;
  uploadedMedia: string[];
  csrf: string;
}) {
  const navigation = useNavigation();
  const parsed = JSON.parse(content) as unknown;
  const [value, setValue] = useState<unknown>(parsed);
  const [advanced, setAdvanced] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(parsed, null, 2));
  const [errors, setErrors] = useState("");

  const update = (next: unknown) => {
    setValue(next);
    setRaw(JSON.stringify(next, null, 2));
    setErrors("");
  };

  const document = asDocument(value);
  const entries = asDocumentArray(value);
  const memories = asDocument(value);
  const items = asDocumentArray(memories.items);

  return (
    <>
      <AdminPageHeader
        title={TITLES[documentKey]}
        description="Edit content visually. Existing fields, ordering and unpublished records are preserved."
        aside={
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setAdvanced((current) => !current);
              setErrors("");
            }}
          >
            {advanced ? "Visual editor" : "Advanced JSON editor"}
          </button>
        }
      />
      {saved && (
        <p className="alert alert-success" role="status">
          Changes saved. Your staging site reflects the updated content.
        </p>
      )}
      {errors && (
        <p className="alert alert-danger" role="alert">
          {errors}
        </p>
      )}
      <Form
        method="post"
        className="card border-0 shadow-sm"
        onSubmit={(event) => {
          if (!advanced) return;
          try {
            setValue(JSON.parse(raw));
          } catch {
            event.preventDefault();
            setErrors("JSON is invalid. Correct it before saving.");
          }
        }}
      >
        <div className="card-body p-3 p-md-4">
          <input type="hidden" name="csrf" value={csrf} />
          <input type="hidden" name="revision" value={revision} />
          <input type="hidden" name="content" value={advanced ? raw : JSON.stringify(value)} />
          {advanced ? (
            <>
              <div className="alert alert-info">
                Advanced editor preserves all document keys. Use the visual editor for everyday
                changes.
              </div>
              <textarea
                className="form-control font-monospace"
                rows={24}
                spellCheck={false}
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                aria-label="Document JSON"
              />
            </>
          ) : documentKey === "site_settings" ? (
            <SiteSettingsEditor value={value} onChange={update} />
          ) : documentKey === "faq" ? (
            <FaqEditor entries={entries} onChange={update} />
          ) : (
            <MemoriesEditor
              document={memories}
              items={items}
              uploadedMedia={uploadedMedia}
              onChangeDocument={(next) => update({ ...document, ...next })}
              onChangeItems={(next) => update({ ...document, items: next })}
            />
          )}
        </div>
        <div className="card-footer bg-white d-flex align-items-center gap-3 px-4 py-3">
          <button
            disabled={navigation.state !== "idle"}
            type="submit"
            className="btn btn-primary px-4"
          >
            {navigation.state !== "idle" ? "Saving changes…" : "Save changes"}
          </button>
          <span className="small text-secondary">
            Revision {revision}; conflicting edits are rejected automatically.
          </span>
        </div>
      </Form>
    </>
  );
}
