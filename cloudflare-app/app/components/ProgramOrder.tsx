import { useMemo, useState } from "react";
import { Link } from "react-router";

type Program = { slug: string; name: string; status?: string; id?: string };

function statusLabel(status?: string) {
  return status && status !== "active" ? status : "active";
}

export function ProgramOrder({
  initial,
  programs,
  csrf
}: {
  initial: string[];
  programs: Program[];
  csrf: string;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState("");
  const [error, setError] = useState("");
  const byId = useMemo(() => new Map(programs.map((p) => [String(p.id || p.slug), p])), [programs]);
  const statusFor = (program: Program) =>
    statuses[String(program.id || program.slug)] ?? program.status;
  const available = programs.filter(
    (program) =>
      !selected.includes(String(program.id || program.slug)) &&
      `${program.name} ${program.slug}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const suggestions = query.trim() ? available.slice(0, 8) : [];

  const add = (id: string) => {
    setSelected((current) => [...current, id]);
    setQuery("");
    setError("");
  };

  const move = (index: number, step: number) =>
    setSelected((current) => {
      const next = [...current];
      const target = index + step;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const activate = async (program: Program) => {
    const id = String(program.id || program.slug);
    setActivating(id);
    setError("");
    try {
      const body = new FormData();
      body.set("csrf", csrf);
      body.set("ids", id);
      body.set("status", "active");
      const response = await fetch("/admin/program-quick-status", {
        method: "POST",
        body,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Could not activate this program.");
      setStatuses((current) => ({ ...current, [id]: "active" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not activate this program.");
    } finally {
      setActivating("");
    }
  };

  return (
    <section className="col-12 program-order" aria-label="Associated programs">
      <input type="hidden" name="program_ids" value={selected.join("\n")} />
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
        <div>
          <h2 className="h6 mb-1">
            Associated programs <span className="text-secondary">({selected.length})</span>
          </h2>
          <p className="small text-secondary mb-0">
            Search and add programs, then use the order controls. Activation and editing are
            available without leaving this destination.
          </p>
        </div>
      </div>
      <div className="program-order-picker">
        <label className="form-label small fw-semibold" htmlFor="program-picker">
          Add a program
        </label>
        <div className="program-order-search">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            id="program-picker"
            className="form-control"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls="program-picker-results"
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Search programs by name or ID…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="program-order-results" id="program-picker-results" role="listbox">
            {suggestions.map((program) => {
              const id = String(program.id || program.slug);
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="program-order-option"
                  key={id}
                  onClick={() => add(id)}
                >
                  <span>
                    <strong>{program.name}</strong>
                    <small>{program.slug}</small>
                  </span>
                  <span
                    className={`admin-status admin-status-${statusFor(program) === "active" ? "success" : "neutral"}`}
                  >
                    {statusLabel(statusFor(program))}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {query.trim() && suggestions.length === 0 && (
          <p className="small text-secondary mb-0 mt-2">
            No unassigned programs match that search.
          </p>
        )}
      </div>
      {error && (
        <p className="small text-danger mt-2" role="alert">
          {error}
        </p>
      )}
      <div className="program-order-list">
        {selected.map((id, index) => {
          const program = byId.get(id);
          const status = program ? statusFor(program) : "missing";
          return (
            <div className="program-order-row" key={id}>
              <span className="program-order-index">{index + 1}</span>
              <span className="program-order-name">
                <strong>{program?.name || id}</strong>
                <small>{program?.slug || "missing record"}</small>
              </span>
              <span
                className={`admin-status admin-status-${status === "active" ? "success" : status === "missing" ? "danger" : "neutral"}`}
              >
                {statusLabel(status)}
              </span>
              {program && (
                <>
                  {status !== "active" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      disabled={activating === id}
                      onClick={() => activate(program)}
                    >
                      {activating === id ? "Activating…" : "Activate"}
                    </button>
                  )}
                  <Link
                    to={`/admin/catalog/program/${program.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Edit <i className="bi bi-box-arrow-up-right ms-1" />
                  </Link>
                </>
              )}
              <div className="program-order-move">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  aria-label={`Move ${program?.name || id} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <i className="bi bi-arrow-up" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  aria-label={`Move ${program?.name || id} down`}
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <i className="bi bi-arrow-down" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  aria-label={`Remove ${program?.name || id}`}
                  onClick={() => setSelected((current) => current.filter((value) => value !== id))}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
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
