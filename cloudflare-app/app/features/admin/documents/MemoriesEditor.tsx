import { MediaSelector } from "../../../components/MediaSelector";
import type { DocumentItem } from "./shared";
import { asDocumentText } from "./shared";

export function MemoriesEditor({
  document,
  items,
  uploadedMedia,
  csrf,
  onChangeDocument,
  onChangeItems
}: {
  document: DocumentItem;
  items: DocumentItem[];
  uploadedMedia: string[];
  csrf: string;
  onChangeDocument: (next: DocumentItem) => void;
  onChangeItems: (next: DocumentItem[]) => void;
}) {
  const patch = (index: number, value: DocumentItem) =>
    onChangeItems(items.map((item, current) => (current === index ? { ...item, ...value } : item)));

  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChangeItems(next);
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="memories-title">
          Title
        </label>
        <input
          id="memories-title"
          className="form-control"
          value={asDocumentText(document.title)}
          onChange={(event) => onChangeDocument({ ...document, title: event.target.value })}
        />
      </div>
      <label className="d-flex gap-2 align-items-center mb-4">
        <input
          type="checkbox"
          className="form-check-input"
          checked={document.show_facebook !== false}
          onChange={(event) =>
            onChangeDocument({ ...document, show_facebook: event.target.checked })
          }
        />
        Display Facebook feed beside memories
      </label>
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="h5">Memory photos ({items.length})</h2>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() =>
            onChangeItems([
              ...items,
              { image: "", caption: "", country: "", is_active: true, in_slider: true }
            ])
          }
        >
          + Add photo
        </button>
      </div>
      {items.map((item, index) => (
        <section className="border rounded-3 p-3 mb-3" key={index}>
          <div className="row g-3 align-items-start">
            <div className="col-md-3">
              {Boolean(item.image) && (
                <img
                  src={
                    String(item.image).startsWith("/")
                      ? String(item.image)
                      : `/images/${String(item.image)}`
                  }
                  className="img-fluid rounded memory-editor-preview"
                  alt={asDocumentText(item.caption)}
                  loading="lazy"
                />
              )}
            </div>
            <div className="col-md-9">
              <div className="d-flex justify-content-between mb-2">
                <strong>Photo {index + 1}</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onChangeItems(items.filter((_, current) => current !== index))}
                >
                  Remove
                </button>
              </div>
              <MediaSelector
                id={`memory-image-${index}`}
                label="Image"
                initial={asDocumentText(item.image)}
                externalValue={asDocumentText(item.image)}
                uploaded={uploadedMedia}
                csrf={csrf}
                onChange={(value) => patch(index, { image: value })}
              />
              {(["caption", "country"] as const).map((key) => (
                <div className="mb-3" key={key}>
                  <label className="form-label fw-semibold" htmlFor={`memory-${key}-${index}`}>
                    {key}
                  </label>
                  <input
                    id={`memory-${key}-${index}`}
                    className="form-control"
                    value={asDocumentText(item[key])}
                    onChange={(event) => patch(index, { [key]: event.target.value })}
                  />
                </div>
              ))}
              {(["is_active", "in_slider"] as const).map((key) => (
                <label className="form-check form-check-inline" key={key}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={item[key] !== false}
                    onChange={(event) => patch(index, { [key]: event.target.checked })}
                  />
                  <span className="form-check-label">
                    {key === "is_active" ? "Active" : "In slider"}
                  </span>
                </label>
              ))}
              <div className="mt-2 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑ Up
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓ Down
                </button>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
