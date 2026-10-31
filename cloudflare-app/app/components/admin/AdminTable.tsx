import type { ReactNode } from "react";
import { AdminEmptyState } from "./AdminEmptyState";

export type AdminTableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  ariaLabel,
  rowClassName,
  density = "default"
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  ariaLabel?: string;
  rowClassName?: (row: T) => string | undefined;
  density?: "default" | "compact";
}) {
  return (
    <div className={"admin-table-wrap" + (density === "compact" ? " admin-table-compact" : "")}>
      <div className="table-responsive">
        <table className="table admin-table align-middle mb-0" aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" className={column.className} key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className={rowClassName?.(row)} key={rowKey(row)}>
                {columns.map((column) => (
                  <td className={column.className} data-label={column.label} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <AdminEmptyState title={emptyTitle} description={emptyDescription} />}
    </div>
  );
}
