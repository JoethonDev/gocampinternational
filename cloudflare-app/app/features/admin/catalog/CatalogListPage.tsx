import { Form, Link, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import type { CategoryRecord, CatalogRecord, DestinationRecord } from "../../../lib/domain";

type Kind = "program" | "destination" | "category";

const TITLES: Record<Kind, string> = {
  program: "Programs",
  destination: "Destinations",
  category: "Program Categories"
};

function statusOptions(kind: Kind) {
  return kind === "destination"
    ? ["active", "inactive", "coming-soon", "trash"]
    : ["active", "inactive", "trash"];
}

export function CatalogListPage({
  kind,
  records,
  categories,
  destinations,
  updated,
  csrf
}: {
  kind: Kind;
  records: CatalogRecord[];
  categories: CategoryRecord[];
  destinations: DestinationRecord[];
  updated: string | null;
  csrf: string;
}) {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const options = statusOptions(kind);

  const visible = useMemo(
    () =>
      records.filter((item) => {
        const haystack =
          `${item.name} ${item.slug} ${String(item.category_slug || "")}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (statusFilter && item.status !== statusFilter) return false;
        if (kind === "program" && categoryFilter && item.category_slug !== categoryFilter)
          return false;
        if (kind === "program" && destinationFilter) {
          const linked = destinations.some(
            (destination) =>
              destination.slug === destinationFilter &&
              Array.isArray(destination.program_ids) &&
              destination.program_ids.includes(String(item.id || item.slug))
          );
          if (!linked) return false;
        }
        return true;
      }),
    [records, search, statusFilter, kind, categoryFilter, destinationFilter, destinations]
  );

  const select = (slug: string, checked: boolean) =>
    setSelected((previous) =>
      checked ? [...new Set([...previous, slug])] : previous.filter((value) => value !== slug)
    );

  return (
    <>
      <AdminPageHeader
        title={TITLES[kind]}
        aside={
          <Link className="btn btn-primary" to={`/admin/catalog/${kind}/new`}>
            + Create
          </Link>
        }
      />
      {updated && (
        <div className="alert alert-success" role="status">
          {updated} item(s) updated.
        </div>
      )}
      <div className="row g-2 mb-3 align-items-end">
        <div className="col-md-4">
          <label htmlFor="catalog-search" className="form-label small fw-semibold">
            Search
          </label>
          <input
            id="catalog-search"
            className="form-control"
            placeholder="Name, ID or category"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelected([]);
            }}
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label small fw-semibold">Status</label>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setSelected([]);
            }}
            className="form-select"
          >
            <option value="">All statuses</option>
            {options.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        {kind === "program" && (
          <>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold">Category</label>
              <select
                aria-label="Filter by category"
                className="form-select"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setSelected([]);
                }}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option value={category.slug} key={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold">Destination</label>
              <select
                aria-label="Filter by destination"
                className="form-select"
                value={destinationFilter}
                onChange={(event) => {
                  setDestinationFilter(event.target.value);
                  setSelected([]);
                }}
              >
                <option value="">All destinations</option>
                {destinations.map((destination) => (
                  <option value={destination.slug} key={destination.slug}>
                    {destination.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
      <Form method="post" className="card shadow-sm">
        <input type="hidden" name="csrf" value={csrf} />
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <label htmlFor="bulk-status" className="form-label mb-0">
              Bulk action
            </label>
            <select
              id="bulk-status"
              className="form-select bulk-status-select"
              name="status"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select status
              </option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              disabled={navigation.state !== "idle" || selected.length === 0}
              className="btn btn-outline-primary"
            >
              Apply to {selected.length} selected
            </button>
            <span className="small text-secondary">
              {visible.length} of {records.length} records
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      aria-label="Select all visible"
                      checked={
                        visible.length > 0 && visible.every((item) => selected.includes(item.slug))
                      }
                      onChange={(event) =>
                        setSelected((previous) =>
                          event.target.checked
                            ? [...new Set([...previous, ...visible.map((item) => item.slug)])]
                            : previous.filter((id) => !visible.some((item) => item.slug === id))
                        )
                      }
                    />
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">ID</th>
                  <th scope="col">Status</th>
                  <th scope="col">Edit</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.slug}>
                    <td>
                      <input
                        type="checkbox"
                        name="ids"
                        value={item.slug}
                        checked={selected.includes(item.slug)}
                        onChange={(event) => select(item.slug, event.target.checked)}
                        aria-label={`Select ${item.name}`}
                      />
                    </td>
                    <td>{item.name}</td>
                    <td>
                      <code>{item.slug}</code>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <Link
                        to={`/admin/catalog/${kind}/${item.slug}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <p className="p-3">No matching records.</p>}
          </div>
        </div>
      </Form>
    </>
  );
}
