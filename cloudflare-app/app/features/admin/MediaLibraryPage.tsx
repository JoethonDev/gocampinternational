import { Form, useNavigation } from "react-router";
import { AdminEmptyState } from "../../components/admin/AdminEmptyState";
import { AdminFormSection } from "../../components/admin/AdminFormSection";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel } from "../../components/admin/AdminPanel";
import { AdminRowActions } from "../../components/admin/AdminRowActions";
import { AdminToolbar, AdminToolbarField } from "../../components/admin/AdminToolbar";
import { Pagination } from "../../components/ui/Pagination";
import type { MediaAsset } from "../../lib/domain";
import type { MediaLibraryData, MediaUsage, StaticMedia } from "./media.server";

function MediaSearch({ query, folder }: { query: string; folder: string }) {
  return (
    <Form method="get" role="search">
      <AdminToolbar
        actions={
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        }
      >
        <AdminToolbarField label="Find image" htmlFor="media-search">
          <input
            id="media-search"
            className="form-control"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search filenames"
          />
        </AdminToolbarField>
        <AdminToolbarField label="Folder" htmlFor="media-folder">
          <select id="media-folder" className="form-select" name="folder" defaultValue={folder}>
            <option value="all">All images</option>
            <option value="images">/images</option>
            <option value="uploads">/uploads</option>
          </select>
        </AdminToolbarField>
      </AdminToolbar>
    </Form>
  );
}

function StaticMediaCard({ item, usage }: { item: StaticMedia; usage: MediaUsage }) {
  const filename = item.path.split("/").at(-1) || item.path;
  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article className="card border-0 shadow-sm h-100">
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${item.path}`}
        >
          <img
            src={item.path}
            alt={filename}
            loading="lazy"
            className="w-100 rounded-top static-media-preview"
          />
        </a>
        <div className="card-body d-flex flex-column">
          <p className="fw-bold small mb-1 text-break">{filename}</p>
          <div className="small text-secondary text-break mb-2">
            {item.folder} · {(item.bytes / 1024).toFixed(1)} KB
          </div>
          <details className="mb-3">
            <summary className="small">
              {usage.count} saved reference{usage.count === 1 ? "" : "s"}
            </summary>
            {usage.refs.length ? (
              <ul className="small ps-3 mt-2 mb-0">
                {usage.refs.map((ref) => (
                  <li className="text-break" key={ref}>
                    {ref}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small text-secondary mt-2 mb-0">No references in saved content.</p>
            )}
          </details>
          <div className="mt-auto">
            <code className="small d-block text-break mb-2">{item.path}</code>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary w-100"
              onClick={() => navigator.clipboard?.writeText(item.path).catch(() => undefined)}
            >
              Copy path
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function MediaUploadForm({ csrf }: { csrf: string }) {
  const navigation = useNavigation();
  return (
    <Form method="post" encType="multipart/form-data" className="mb-4">
      <AdminFormSection
        title="Upload an image"
        description="JPEG, PNG, WebP, AVIF or GIF up to 3 MB. New files are stored privately in R2."
      >
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="operation" value="upload" />
        <div className="col-md-8">
          <label htmlFor="mediaFile" className="form-label">
            Image file
          </label>
          <input
            className="form-control"
            type="file"
            name="file"
            id="mediaFile"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            required
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-primary w-100" disabled={navigation.state !== "idle"}>
            <i className="bi bi-cloud-arrow-up me-1" /> Upload to R2
          </button>
        </div>
      </AdminFormSection>
    </Form>
  );
}

function R2MediaCard({ asset, csrf }: { asset: MediaAsset; csrf: string }) {
  return (
    <div className="col-md-6 col-xl-4">
      <div className="card h-100 shadow-sm">
        <div className="card-body">
          <img
            alt={asset.display_name}
            className="w-100 rounded mb-3 r2-media-preview"
            src={asset.is_public ? `/media/${asset.id}` : `/admin/media/preview/${asset.id}`}
          />
          <p className="small text-secondary mb-1">
            {Math.round(asset.bytes / 1024)} KB · {asset.is_public ? "Published" : "Hidden"}
          </p>
          <Form method="post" className="d-flex gap-2 align-items-end flex-wrap">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="id" value={asset.id} />
            <div className="flex-grow-1">
              <label className="form-label" htmlFor={`media-name-${asset.id}`}>
                Name
              </label>
              <input
                id={`media-name-${asset.id}`}
                name="display_name"
                defaultValue={asset.display_name}
                className="form-control form-control-sm"
              />
            </div>
            <AdminRowActions>
              <button name="operation" value="rename" className="btn btn-sm btn-outline-primary">
                Rename
              </button>
              <button
                name="operation"
                value={asset.is_public ? "hide" : "show"}
                className="btn btn-sm btn-outline-secondary"
              >
                {asset.is_public ? "Hide" : "Publish"}
              </button>
              <button
                type="submit"
                name="operation"
                value="delete"
                className="btn btn-sm btn-outline-danger"
                onClick={(event) => {
                  if (
                    !window.confirm(
                      "Delete this image permanently from R2? Referenced images cannot be deleted."
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </AdminRowActions>
          </Form>
          <div className="small mt-2 text-secondary">/media/{asset.id}</div>
        </div>
      </div>
    </div>
  );
}

export function MediaLibraryPage({
  data,
  csrf,
  uploaded,
  updated,
  staging
}: {
  data: MediaLibraryData;
  csrf: string;
  uploaded: boolean;
  updated: boolean;
  staging: boolean;
}) {
  return (
    <>
      <AdminPageHeader
        title="Media Library"
        description={`Browse the ${data.totalStatic} committed site images and published R2 uploads. Search, inspect references and reuse paths in any editor.`}
        aside={
          <span className="badge bg-secondary rounded-pill fs-6">{data.total} matching images</span>
        }
      />
      {(uploaded || updated) && (
        <div className="alert alert-success" role="status">
          Media saved.
        </div>
      )}
      {staging && (
        <div className="alert alert-info d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <span>
            Staging: import committed legacy images into private Cloudflare R2 before switching off
            static copies.
          </span>
          <a className="btn btn-sm btn-primary" href="/admin/media/import">
            Import images to R2
          </a>
        </div>
      )}
      <MediaSearch query={data.q} folder={data.folder} />
      <AdminPanel
        title="Committed site images"
        description="Referenced by the public site and available to every editor."
      >
        {data.items.length === 0 ? (
          <AdminEmptyState
            icon="bi-images"
            title="No images match the current filters"
            description="Try a different filename or folder."
          />
        ) : (
          <div className="row g-3">
            {data.items.map((item) => (
              <StaticMediaCard
                key={item.path}
                item={item}
                usage={data.usage[item.path] || { count: 0, refs: [] }}
              />
            ))}
          </div>
        )}
      </AdminPanel>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        ariaLabel="Image library pages"
        summary={`Showing ${data.items.length} of ${data.total} · page ${data.page} of ${data.totalPages}`}
        href={(page) => {
          const params = new URLSearchParams();
          if (data.q) params.set("q", data.q);
          if (data.folder !== "all") params.set("folder", data.folder);
          params.set("page", String(page));
          return `/admin/media?${params.toString()}`;
        }}
      />

      <div className="mt-5" id="uploads">
        <AdminPanel
          title="R2 uploads"
          description="New images are stored privately in R2. Only published media is served by its immutable ID."
        >
          <MediaUploadForm csrf={csrf} />
          {data.rows.length === 0 ? (
            <AdminEmptyState
              icon="bi-cloud-arrow-up"
              title="No R2 uploads yet"
              description="Upload an image above to start the media library."
            />
          ) : (
            <div className="row g-3">
              {data.rows.map((asset) => (
                <R2MediaCard key={asset.id} asset={asset} csrf={csrf} />
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </>
  );
}
