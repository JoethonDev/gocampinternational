import { useMemo, useState } from "react";
type Program = { slug: string; name: string; status?: string; id?: string };
export function ProgramOrder({ initial, programs }: { initial: string[]; programs: Program[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const byId = useMemo(() => new Map(programs.map((p) => [String(p.id || p.slug), p])), [programs]);
  const [pick, setPick] = useState("");
  const available = programs.filter((p) => !selected.includes(String(p.id || p.slug)));
  const move = (index: number, step: number) =>
    setSelected((old) => {
      const next = [...old],
        target = index + step;
      if (target < 0 || target >= next.length) return old;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  return (
    <section className="col-12 border rounded-3 p-3 mt-3" aria-label="Associated programs">
      <input type="hidden" name="program_ids" value={selected.join("\n")} />
      <h2 className="h6 mb-1">
        Associated programs <span className="text-secondary">({selected.length})</span>
      </h2>
      <p className="small text-secondary">
        The order below is the order shown on the destination page.
      </p>
      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <div className="flex-grow-1" style={{ minWidth: 240 }}>
          <label className="form-label small" htmlFor="program-picker">
            Add a program
          </label>
          <select
            id="program-picker"
            className="form-select"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">Select a program</option>
            {available.map((p) => {
              const id = String(p.id || p.slug);
              return (
                <option value={id} key={id}>
                  {p.name}
                  {p.status && p.status !== "active" ? " (" + p.status + ")" : ""}
                </option>
              );
            })}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={!pick}
          onClick={() => {
            if (pick) {
              setSelected((old) => [...old, pick]);
              setPick("");
            }
          }}
        >
          Add
        </button>
      </div>
      <div className="list-group">
        {selected.map((id, index) => {
          const p = byId.get(id);
          return (
            <div className="list-group-item d-flex flex-wrap align-items-center gap-2" key={id}>
              <span className="badge bg-secondary">{index + 1}</span>
              <span className="flex-grow-1">
                <strong>{p?.name || id}</strong>
                {!p && <span className="text-danger small ms-2">missing record</span>}
                {p?.status && p.status !== "active" && (
                  <span className="small text-secondary ms-2">({p.status})</span>
                )}
              </span>
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
                disabled={index === selected.length - 1}
                onClick={() => move(index, 1)}
              >
                Down
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setSelected((old) => old.filter((x) => x !== id))}
              >
                Remove
              </button>
            </div>
          );
        })}
        {selected.length === 0 && (
          <p className="small text-secondary mb-0">No programs associated yet.</p>
        )}
      </div>
    </section>
  );
}
