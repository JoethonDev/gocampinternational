import { RichTextInput } from "../../../components/RichTextInput";
import { DragHandle } from "../../../components/ui/DragHandle";
import { moveItem, useDragReorder } from "../../../hooks/useDragReorder";
import type { DocumentItem } from "./shared";
import { asDocumentText } from "./shared";

export function FaqEditor({
  entries,
  onChange
}: {
  entries: DocumentItem[];
  onChange: (next: DocumentItem[]) => void;
}) {
  const drag = useDragReorder((from, to) => onChange(moveItem(entries, from, to)));
  const patch = (index: number, value: DocumentItem) =>
    onChange(entries.map((entry, current) => (current === index ? { ...entry, ...value } : entry)));

  const move = (index: number, step: number) => onChange(moveItem(entries, index, index + step));

  return (
    <>
      <p className="text-secondary small">
        Questions appear in this order. Answers may contain the source HTML for formatting.
      </p>
      {entries.map((entry, index) => (
        <section
          className={
            "border rounded-3 p-3 mb-3 sortable-item" +
            (drag.draggingIndex === index ? " is-dragging" : "") +
            (drag.overIndex === index ? " is-drop-target" : "")
          }
          key={index}
          {...drag.itemProps(index)}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <DragHandle label={`question ${index + 1}`} {...drag.handleProps(index)} />
              <strong>Question {index + 1}</strong>
            </div>
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
