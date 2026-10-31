import { Link } from "react-router";

function pageWindow(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((value) => values.add(value));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((value) => values.add(value));
  return [...values].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
}

function PageControl({
  page,
  label,
  active,
  disabled,
  onPageChange,
  href
}: {
  page: number;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPageChange?: (page: number) => void;
  href?: (page: number) => string;
}) {
  const className = "page-item" + (active ? " active" : "") + (disabled ? " disabled" : "");
  return (
    <li className={className}>
      {onPageChange ? (
        <button
          type="button"
          className="page-link"
          onClick={() => onPageChange(page)}
          disabled={disabled}
          aria-current={active ? "page" : undefined}
        >
          {label}
        </button>
      ) : (
        <Link
          className="page-link"
          to={(href || ((value) => `?page=${value}`))(page)}
          aria-current={active ? "page" : undefined}
          aria-disabled={disabled || undefined}
        >
          {label}
        </Link>
      )}
    </li>
  );
}

export function Pagination({
  page,
  totalPages,
  href,
  onPageChange,
  ariaLabel = "Pagination",
  summary
}: {
  page: number;
  totalPages: number;
  href?: (page: number) => string;
  onPageChange?: (page: number) => void;
  ariaLabel?: string;
  summary?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  return (
    <div className="admin-pagination">
      {summary && <span className="admin-pagination-summary">{summary}</span>}
      <nav aria-label={ariaLabel}>
        <ul className="pagination pagination-sm mb-0">
          <PageControl
            page={Math.max(1, page - 1)}
            label="‹"
            onPageChange={onPageChange}
            href={href}
            disabled={page <= 1}
          />
          {pages.map((value, index) => (
            <li className={`page-item${value === page ? " active" : ""}`} key={value}>
              {index > 0 && pages[index - 1] !== value - 1 && (
                <span className="page-link disabled">…</span>
              )}
              {onPageChange ? (
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(value)}
                  aria-current={value === page ? "page" : undefined}
                >
                  {value}
                </button>
              ) : (
                <Link
                  className="page-link"
                  to={(href || ((target) => `?page=${target}`))(value)}
                  aria-current={value === page ? "page" : undefined}
                >
                  {value}
                </Link>
              )}
            </li>
          ))}
          <PageControl
            page={Math.min(totalPages, page + 1)}
            label="›"
            onPageChange={onPageChange}
            href={href}
            disabled={page >= totalPages}
          />
        </ul>
      </nav>
    </div>
  );
}
