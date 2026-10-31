import { Form, useNavigation } from "react-router";
import { useState } from "react";
import { AdminFormActions } from "../../../components/admin/AdminFormActions";
import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import { FaqEditor } from "./FaqEditor";
import { MemoriesEditor } from "./MemoriesEditor";
import { SiteSettingsEditor } from "./SiteSettingsEditor";
import type { DocumentKey } from "./shared";
import { asDocument, asDocumentArray } from "./shared";

const TITLES: Record<DocumentKey, { title: string; description: string }> = {
  site_settings: {
    title: "Visibility & Settings",
    description: "Control global section visibility and per-record inheritance defaults."
  },
  faq: {
    title: "Global FAQs",
    description: "Order the questions and answers shown on the public FAQ page."
  },
  camp_memories: {
    title: "Camp Memories",
    description: "Curate the photo memories carousel and Facebook panel."
  }
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
  const meta = TITLES[documentKey];

  return (
    <div className="admin-document-editor">
      <AdminPageHeader
        title={meta.title}
        description={meta.description}
        aside={
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setAdvanced((current) => !current);
              setErrors("");
            }}
          >
            <i className="bi bi-code-slash me-1" />
            {advanced ? "Visual editor" : "Advanced JSON"}
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
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="revision" value={revision} />
        <input type="hidden" name="content" value={advanced ? raw : JSON.stringify(value)} />
        {advanced ? (
          <AdminPanel
            title="Advanced document JSON"
            description="Preserves every document key. Use the visual editor for everyday changes."
          >
            <textarea
              className="form-control font-monospace"
              rows={24}
              spellCheck={false}
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              aria-label="Document JSON"
            />
          </AdminPanel>
        ) : documentKey === "site_settings" ? (
          <AdminPanel
            title="Global visibility"
            description="These are defaults; individual records can override them."
          >
            <SiteSettingsEditor value={value} onChange={update} />
          </AdminPanel>
        ) : documentKey === "faq" ? (
          <AdminPanel title="Questions" description="Drag-free ordering with move controls.">
            <FaqEditor entries={entries} onChange={update} />
          </AdminPanel>
        ) : (
          <AdminPanel title="Memory photos" description="Active photos can appear in the slider.">
            <MemoriesEditor
              document={memories}
              items={items}
              uploadedMedia={uploadedMedia}
              csrf={csrf}
              onChangeDocument={(next) => update({ ...document, ...next })}
              onChangeItems={(next) => update({ ...document, items: next })}
            />
          </AdminPanel>
        )}
        <AdminFormActions>
          <button
            disabled={navigation.state !== "idle"}
            type="submit"
            className="btn btn-primary px-4"
          >
            {navigation.state !== "idle" ? "Saving changes…" : "Save changes"}
          </button>
          <span className="small text-secondary ms-auto">
            Revision {revision}; conflicting edits are rejected automatically.
          </span>
        </AdminFormActions>
      </Form>
    </div>
  );
}
