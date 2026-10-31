import { Link } from "react-router";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import type { DashboardMedia } from "./types";

export function StagingStatus({
  environment,
  source,
  media
}: {
  environment: string;
  source: string;
  media: DashboardMedia;
}) {
  return (
    <AdminPanel title="Staging status" className="admin-staging-panel">
      <dl className="admin-status-list mb-0">
        <div>
          <dt>Environment</dt>
          <dd>
            <span className="badge bg-warning text-dark">{environment}</span>
          </dd>
        </div>
        <div>
          <dt>Indexing</dt>
          <dd>Noindex, nofollow</dd>
        </div>
        <div>
          <dt>Source commit</dt>
          <dd>
            <code>{source.slice(0, 12)}</code>
          </dd>
        </div>
        <div>
          <dt>Media library</dt>
          <dd>
            {media.published} published / {media.count} total
          </dd>
        </div>
        <div>
          <dt>Media storage</dt>
          <dd>{(media.bytes / (1024 * 1024)).toFixed(1)} MB</dd>
        </div>
      </dl>
      <Link
        className="btn btn-sm btn-outline-secondary w-100 mt-3"
        to="/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="bi bi-box-arrow-up-right me-1" /> Open public site
      </Link>
    </AdminPanel>
  );
}
