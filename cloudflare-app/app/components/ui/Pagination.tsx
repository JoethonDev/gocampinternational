import { Link } from "react-router";

function pageWindow(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((value) => values.add(value));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((value) => values.add(value));
  return [...values].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  href,
  ariaLabel = "Pagination"
}: {
  page: number;
  totalPages: number;
  href: (page: number) => string;
  ariaLabel?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  return (
    <nav className="mt-4" aria-label={ariaLabel}>
      <ul className="pagination justify-content-center flex-wrap">
        <li className={`page-item${page <= 1 ? " disabled" : ""}`}>
          <Link className="page-link" to={href(Math.max(1, page - 1))} aria-label="Previous page">
            «
          </Link>
        </li>
        {pages.map((value, index) => (
          <li className={`page-item${value === page ? " active" : ""}`} key={value}>
            {index > 0 && pages[index - 1] !== value - 1 && (
              <span className="page-link disabled">…</span>
            )}
            <Link
              className="page-link"
              to={href(value)}
              aria-current={value === page ? "page" : undefined}
            >
              {value}
            </Link>
          </li>
        ))}
        <li className={`page-item${page >= totalPages ? " disabled" : ""}`}>
          <Link
            className="page-link"
            to={href(Math.min(totalPages, page + 1))}
            aria-label="Next page"
          >
            »
          </Link>
        </li>
      </ul>
    </nav>
  );
}
