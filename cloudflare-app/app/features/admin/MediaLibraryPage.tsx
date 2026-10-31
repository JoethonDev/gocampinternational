import { Form, useNavigation } from "react-router";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Pagination } from "../../components/ui/Pagination";
import type { MediaAsset } from "../../lib/domain";
import type { MediaLibraryData, MediaUsage, StaticMedia } from "./media.server";

function MediaSearch({ query, folder }: { query: string; folder: string }) {
  return (
    <Form method="get" className="row g-2 align-items-end mb-3" role="search">
      <div className="col-md-6">
        <label className="form-label" htmlFor="media-search">
          Find image
        </label>
        <input
          id="media-search"
          className="form-control"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search filenames"
        />
      </div>
      <div className="col-md-3">
        <label className="form-label" htmlFor="media-folder">
          Folder
        </label>
        <select id="media-folder" className="form-select" name="folder" defaultValue={folder}>
          <option value="all">All images</option>
          <option value="images">/images</option>
          <option value="uploads">/uploads</option>
        </select>
      </div>
      <div className="col-md-3">
        <button className="btn btn-primary w-100" type="submit">
          Search
        </button>
      </div>
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
    <Form method="post" encType="multipart/form-data" className="card shadow-sm mb-4">
      <div className="card-body d-flex flex-wrap align-items-end gap-3">
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="operation" value="upload" />
        <div>
          <label htmlFor="mediaFile" className="form-label">
            Upload image (up to 3 MB)
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
        <button className="btn btn-primary" disabled={navigation.state !== "idle"}>
          Upload to R2
        </button>
      </div>
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
      {data.items.length === 0 ? (
        <div className="alert alert-light border">No images match the current filters.</div>
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
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        ariaLabel="Image library pages"
        href={(page) => {
          const params = new URLSearchParams();
          if (data.q) params.set("q", data.q);
          if (data.folder !== "all") params.set("folder", data.folder);
          params.set("page", String(page));
          return `/admin/media?${params.toString()}`;
        }}
      />
      <p className="text-center text-secondary small">
        Page {data.page} of {data.totalPages} · showing {data.items.length} of {data.total} images
      </p>

      <hr className="my-5" />
      <section id="uploads">
        <div className="mb-3">
          <h2 className="h4 mb-1">R2 uploads</h2>
          <p className="text-secondary mb-0">
            New images are stored privately in R2. Only published media is served by its immutable
            ID.
          </p>
        </div>
        <MediaUploadForm csrf={csrf} />
        <div className="row g-3">
          {data.rows.map((asset) => (
            <R2MediaCard key={asset.id} asset={asset} csrf={csrf} />
          ))}
        </div>
        {data.rows.length === 0 && <p className="text-secondary">No R2 uploads yet.</p>}
      </section>
    </>
  );
}
