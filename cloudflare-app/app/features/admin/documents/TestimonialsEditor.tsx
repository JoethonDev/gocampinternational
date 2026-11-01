import { RichTextInput } from "../../../components/RichTextInput";
import type { DocumentItem } from "./shared";
import { asDocument, asDocumentText, asVisibleBoolean } from "./shared";

export function TestimonialsEditor({
  value,
  onChange
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const document = asDocument(value);
  const items = Array.isArray(document.items) ? (document.items as DocumentItem[]) : [];

  const patchDocument = (next: DocumentItem) => onChange({ ...document, ...next });
  const patchItem = (index: number, next: DocumentItem) =>
    onChange({
      ...document,
      items: items.map((item, current) => (current === index ? { ...item, ...next } : item))
    });
  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...document, items: next });
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="testimonials-title">
          Section title
        </label>
        <input
          id="testimonials-title"
          className="form-control"
          value={asDocumentText(document.title)}
          placeholder="What Families Say"
          onChange={(event) => patchDocument({ title: event.target.value })}
        />
      </div>
      <div className="mb-4">
        <label className="form-label fw-semibold" htmlFor="testimonials-intro">
          Optional introduction
        </label>
        <textarea
          id="testimonials-intro"
          className="form-control"
          rows={2}
          value={asDocumentText(document.intro)}
          placeholder="A short line shown under the section title"
          onChange={(event) => patchDocument({ intro: event.target.value })}
        />
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="h5 mb-1">Testimonials ({items.length})</h2>
          <p className="small text-secondary mb-0">
            Active testimonials appear below the homepage categories. Use the quote toolbar to
            highlight phrases.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() =>
            onChange({
              ...document,
              items: [...items, { name: "", flag: "", quote: "<p></p>", is_active: true }]
            })
          }
        >
          <i className="bi bi-plus-lg me-1" /> Add testimonial
        </button>
      </div>
      <div className="testimonial-admin-list">
        {items.map((item, index) => (
          <section className="card border mb-3" key={index}>
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <strong className="small text-secondary">Testimonial #{index + 1}</strong>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <label className="form-check form-check-inline mb-0 me-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={asVisibleBoolean(item.is_active ?? true)}
                      onChange={(event) => patchItem(index, { is_active: event.target.checked })}
                    />
                    <span className="form-check-label small">Active</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      onChange({
                        ...document,
                        items: items.filter((_, current) => current !== index)
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="form-label" htmlFor={`testimonial-name-${index}`}>
                    Name
                  </label>
                  <input
                    id={`testimonial-name-${index}`}
                    className="form-control"
                    value={asDocumentText(item.name)}
                    placeholder="e.g. Maria & Family"
                    onChange={(event) => patchItem(index, { name: event.target.value })}
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label" htmlFor={`testimonial-flag-${index}`}>
                    Flag or country code
                  </label>
                  <input
                    id={`testimonial-flag-${index}`}
                    className="form-control"
                    value={asDocumentText(item.flag)}
                    placeholder="e.g. CH or 🇨🇭"
                    onChange={(event) => patchItem(index, { flag: event.target.value })}
                  />
                </div>
              </div>
              <div className="mt-2">
                <RichTextInput
                  label={`Testimonial #${index + 1} quote`}
                  initial={asDocumentText(item.quote)}
                  externalValue={asDocumentText(item.quote)}
                  onChange={(quote) => patchItem(index, { quote })}
                />
              </div>
            </div>
          </section>
        ))}
        {items.length === 0 && (
          <div className="admin-empty-state border rounded-3">
            <i className="bi bi-chat-quote" />
            <strong>No testimonials yet</strong>
            <span>Use Add testimonial to create the first card.</span>
          </div>
        )}
      </div>
    </>
  );
}
