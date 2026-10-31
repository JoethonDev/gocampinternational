import { Form, Link, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import { AdminRowActions } from "../../../components/admin/AdminRowActions";
import { AdminTable, type AdminTableColumn } from "../../../components/admin/AdminTable";
import { AdminToolbar, AdminToolbarField } from "../../../components/admin/AdminToolbar";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { CATALOG_KIND_META, CATALOG_STATUS_OPTIONS } from "../../../config/catalog";
import type { CategoryRecord, CatalogRecord, DestinationRecord } from "../../../lib/domain";

type Kind = "program" | "destination" | "category";

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
  const meta = CATALOG_KIND_META[kind];
  const statuses = CATALOG_STATUS_OPTIONS[kind];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

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

  const selectVisible = (checked: boolean) =>
    setSelected((previous) =>
      checked
        ? [...new Set([...previous, ...visible.map((item) => item.slug)])]
        : previous.filter((id) => !visible.some((item) => item.slug === id))
    );

  const columns: AdminTableColumn<CatalogRecord>[] = [
    {
      key: "select",
      label: "",
      className: "admin-select-cell",
      render: (item) => (
        <input
          type="checkbox"
          className="form-check-input"
          name="ids"
          value={item.slug}
          checked={selected.includes(item.slug)}
          onChange={(event) => select(item.slug, event.target.checked)}
          aria-label={`Select ${item.name}`}
        />
      )
    },
    {
      key: "name",
      label: "Name",
      render: (item) => (
        <div className="admin-table-primary">
          <span className={`admin-table-icon admin-table-icon-${meta.accent}`}>
            <i className={`bi ${meta.icon}`} />
          </span>
          <span>
            <strong>{item.name}</strong>
            {kind === "program" && item.category_slug && (
              <span className="d-block small text-secondary">
                {categories.find((category) => category.slug === item.category_slug)?.name ||
                  item.category_slug}
              </span>
            )}
          </span>
        </div>
      )
    },
    { key: "slug", label: "ID", render: (item) => <code>{item.slug}</code> },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "edit",
      label: "",
      className: "text-end",
      render: (item) => (
        <AdminRowActions>
          <Link
            to={`/admin/catalog/${kind}/${item.slug}`}
            className="btn btn-sm btn-outline-primary"
          >
            Edit <i className="bi bi-arrow-right ms-1" />
          </Link>
        </AdminRowActions>
      )
    }
  ];

  return (
    <>
      <AdminPageHeader
        title={meta.label}
        description={`Create, preview and publish ${meta.label.toLowerCase()} across the public site.`}
        aside={
          <Link className="btn btn-primary" to={`/admin/catalog/${kind}/new`}>
            <i className="bi bi-plus-lg me-1" /> New {meta.singular.toLowerCase()}
          </Link>
        }
      />
      {updated && (
        <div className="alert alert-success" role="status">
          {updated} item(s) updated.
        </div>
      )}
      <AdminToolbar
        actions={
          <span className="admin-badge-soft">
            {visible.length} shown / {records.length} total
          </span>
        }
      >
        <AdminToolbarField label="Search" htmlFor="catalog-search">
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
        </AdminToolbarField>
        <AdminToolbarField label="Status" htmlFor="catalog-status">
          <select
            id="catalog-status"
            className="form-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setSelected([]);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </AdminToolbarField>
        {kind === "program" && (
          <>
            <AdminToolbarField label="Category" htmlFor="catalog-category">
              <select
                id="catalog-category"
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
            </AdminToolbarField>
            <AdminToolbarField label="Destination" htmlFor="catalog-destination">
              <select
                id="catalog-destination"
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
            </AdminToolbarField>
          </>
        )}
      </AdminToolbar>
      <Form method="post">
        <input type="hidden" name="csrf" value={csrf} />
        <AdminPanel
          title={`${meta.label} catalog`}
          description="Select records for a scoped bulk status change."
          action={
            <div className="d-flex flex-wrap align-items-center gap-2">
              <select
                aria-label="Bulk status"
                className="form-select form-select-sm bulk-status-select"
                name="status"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Bulk action
                </option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                disabled={navigation.state !== "idle" || selected.length === 0}
                className="btn btn-sm btn-outline-primary"
              >
                Apply ({selected.length})
              </button>
            </div>
          }
        >
          <AdminTable
            columns={columns}
            rows={visible}
            rowKey={(item) => item.slug}
            ariaLabel={`${meta.label} catalog`}
            emptyTitle={`No ${meta.label.toLowerCase()} found`}
            emptyDescription="Try a different search or filter, or create a new record."
            rowClassName={(item) => (item.status === "trash" ? "is-muted" : undefined)}
          />
          <div className="admin-table-footer">
            <label className="form-check d-flex align-items-center gap-2 mb-0">
              <input
                type="checkbox"
                className="form-check-input"
                checked={
                  visible.length > 0 && visible.every((item) => selected.includes(item.slug))
                }
                onChange={(event) => selectVisible(event.target.checked)}
              />
              <span className="small">Select all visible</span>
            </label>
            <span className="small text-secondary">{selected.length} selected</span>
          </div>
        </AdminPanel>
      </Form>
    </>
  );
}
