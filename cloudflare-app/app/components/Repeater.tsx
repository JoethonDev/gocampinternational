import { useState } from "react";
import { MediaSelector } from "./MediaSelector";
import { RichTextInput } from "./RichTextInput";

export type RepeaterField = {
  key: string;
  label: string;
  kind?: "text" | "long" | "flag" | "media" | "rich";
};

function FieldInput({
  field,
  row,
  index,
  name,
  uploaded,
  onChange
}: {
  field: RepeaterField;
  row: Record<string, unknown>;
  index: number;
  name: string;
  uploaded: string[];
  onChange: (value: unknown) => void;
}) {
  const fieldId = `${name}-${index}-${field.key}`;
  const value = String(row[field.key] ?? "");

  if (field.kind === "media") {
    return (
      <MediaSelector
        id={fieldId}
        label={field.label}
        initial={value}
        externalValue={value}
        uploaded={uploaded}
        onChange={onChange}
      />
    );
  }
  if (field.kind === "flag") {
    return (
      <label className="form-check mt-3">
        <input
          className="form-check-input"
          type="checkbox"
          checked={row[field.key] !== false}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="form-check-label">{field.label}</span>
      </label>
    );
  }
  if (field.kind === "rich") {
    return (
      <RichTextInput
        label={`${field.label} ${index + 1}`}
        initial={value}
        externalValue={value}
        onChange={onChange}
      />
    );
  }
  return (
    <>
      <label className="form-label small" htmlFor={fieldId}>
        {field.label}
      </label>
      {field.kind === "long" ? (
        <textarea
          className="form-control"
          id={fieldId}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="form-control"
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </>
  );
}

export function Repeater({
  name,
  title,
  initial,
  fields,
  uploaded = []
}: {
  name: string;
  title: string;
  initial: Record<string, unknown>[];
  fields: RepeaterField[];
  uploaded?: string[];
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>(initial);

  const edit = (index: number, key: string, value: unknown) =>
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );

  const move = (index: number, step: number) =>
    setRows((current) => {
      const target = index + step;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const add = () =>
    setRows((current) => [
      ...current,
      Object.fromEntries(fields.map((field) => [field.key, field.kind === "flag" ? true : ""]))
    ]);

  return (
    <section className="col-12 border rounded-3 p-3 mt-3" aria-label={title}>
      <input type="hidden" name={`json_${name}`} value={JSON.stringify(rows)} />
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="h6 mb-0">
          {title} <span className="text-secondary">({rows.length})</span>
        </h2>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={add}>
          + Add
        </button>
      </div>
      {rows.map((row, index) => (
        <div className="card border mb-2 shadow-sm" key={index}>
          <div className="card-body p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <strong className="small text-secondary">
                {title} #{index + 1}
              </strong>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
            <div className="row g-2">
              {fields.map((field) => (
                <div
                  className={field.kind === "long" || field.kind === "rich" ? "col-12" : "col-sm-6"}
                  key={field.key}
                >
                  <FieldInput
                    field={field}
                    row={row}
                    index={index}
                    name={name}
                    uploaded={uploaded}
                    onChange={(value) => edit(index, field.key, value)}
                  />
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 mt-2">
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
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                Move down
              </button>
            </div>
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="small text-secondary mb-0">No entries. Use Add to create the first one.</p>
      )}
    </section>
  );
}
