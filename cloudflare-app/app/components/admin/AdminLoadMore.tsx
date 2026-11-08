export function AdminLoadMore({
  shown,
  total,
  itemLabel,
  onLoadMore,
  hasMore,
  loading = false,
  error
}: {
  shown: number;
  total: number;
  itemLabel: string;
  onLoadMore: () => void;
  hasMore?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const canLoadMore = hasMore ?? shown < total;

  return (
    <div className="admin-load-more" aria-live="polite" aria-busy={loading}>
      <span className="admin-pagination-summary">
        Showing {shown} of {total} {itemLabel}.
        {error && (
          <span className="admin-load-more-error" role="alert">
            {error}
          </span>
        )}
      </span>
      {canLoadMore && (
        <button
          className="btn btn-sm btn-outline-primary"
          type="button"
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Loading…
            </>
          ) : (
            <>
              <i className="bi bi-arrow-down-circle me-1" aria-hidden="true" />
              {error ? "Retry" : "Load more"}
            </>
          )}
        </button>
      )}
    </div>
  );
}
