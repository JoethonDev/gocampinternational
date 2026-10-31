import { useState } from "react";
import { MediaSelector } from "./MediaSelector";
export function StringList({
  name,
  title,
  initial,
  media = false,
  uploaded = [],
  placeholder = "",
  addLabel = "Add item",
  csrf
}: {
  name: string;
  title: string;
  initial: string[];
  media?: boolean;
  uploaded?: string[];
  placeholder?: string;
  addLabel?: string;
  csrf: string;
}) {
  const [rows, setRows] = useState<string[]>(initial.length ? initial : []);
  const edit = (index: number, value: string) =>
    setRows((old) => old.map((row, i) => (i === index ? value : row)));
  const move = (index: number, step: number) =>
    setRows((old) => {
      const next = [...old],
        target = index + step;
      if (target < 0 || target >= next.length) return old;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  return (
    <section className="col-12 border rounded-3 p-3 mt-3" aria-label={title}>
      <input
        type="hidden"
        name={"json_" + name}
        value={JSON.stringify(rows.map((v) => v.trim()).filter(Boolean))}
      />
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="h6 mb-0">
          {title} <span className="text-secondary">({rows.length})</span>
        </h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setRows((old) => [...old, ""])}
        >
          {addLabel}
        </button>
      </div>
      {rows.map((row, index) => (
        <div className="border rounded-3 p-3 mb-2" key={index}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong className="small text-secondary">
              {title} #{index + 1}
            </strong>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => setRows((old) => old.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
          {media ? (
            <MediaSelector
              id={name + "-" + index}
              label={title + " image"}
              initial={row}
              externalValue={row}
              uploaded={uploaded}
              csrf={csrf}
              onChange={(next) => edit(index, next)}
            />
          ) : (
            <input
              className="form-control"
              aria-label={title + " item " + (index + 1)}
              value={row}
              placeholder={placeholder}
              onChange={(e) => edit(index, e.target.value)}
            />
          )}
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
      ))}
      {rows.length === 0 && (
        <p className="small text-secondary mb-0">
          No entries. Use {addLabel} to create the first one.
        </p>
      )}
    </section>
  );
}
