import { RichTextInput } from "../../../components/RichTextInput";
import type { DocumentItem } from "./shared";
import { asDocumentText } from "./shared";

export function FaqEditor({
  entries,
  onChange
}: {
  entries: DocumentItem[];
  onChange: (next: DocumentItem[]) => void;
}) {
  const patch = (index: number, value: DocumentItem) =>
    onChange(entries.map((entry, current) => (current === index ? { ...entry, ...value } : entry)));

  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <>
      <p className="text-secondary small">
        Questions appear in this order. Answers may contain the source HTML for formatting.
      </p>
      {entries.map((entry, index) => (
        <section className="border rounded-3 p-3 mb-3" key={index}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong>Question {index + 1}</strong>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onChange(entries.filter((_, current) => current !== index))}
            >
              Remove
            </button>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" htmlFor={`faq-question-${index}`}>
              Question
            </label>
            <input
              id={`faq-question-${index}`}
              className="form-control"
              value={asDocumentText(entry.question)}
              onChange={(event) => patch(index, { question: event.target.value })}
            />
          </div>
          <RichTextInput
            label={`Answer ${index + 1}`}
            initial={asDocumentText(entry.answer)}
            externalValue={asDocumentText(entry.answer)}
            onChange={(value) => patch(index, { answer: value })}
          />
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              Move up
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={index === entries.length - 1}
              onClick={() => move(index, 1)}
            >
              Move down
            </button>
          </div>
        </section>
      ))}
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={() => onChange([...entries, { question: "", answer: "" }])}
      >
        + Add FAQ
      </button>
    </>
  );
}
