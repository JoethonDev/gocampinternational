import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFetcher } from "react-router";
import sourceMedia from "../legacy-media.json";

const STATIC_PATHS = (sourceMedia as Array<{ path: string }>).map((item) => item.path);
type UploadFile = { id: string; path: string; name: string };
type NamedMedia = { path: string; name: string };
type UploadResult = {
  success?: boolean;
  files?: UploadFile[];
  path?: string;
  error?: string;
  errors?: { name: string; message: string }[];
};

export function MediaSelector({
  id,
  label,
  name,
  initial,
  uploaded = [],
  externalValue,
  onChange,
  csrf
}: {
  id: string;
  label: string;
  name?: string;
  initial: string;
  uploaded?: string[];
  externalValue?: string;
  onChange?: (value: string) => void;
  csrf: string;
}) {
  const [local, setLocal] = useState(initial);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [displayCount, setDisplayCount] = useState(48);
  const [extraUploads, setExtraUploads] = useState<string[]>([]);
  const [namedMedia, setNamedMedia] = useState<NamedMedia[]>([]);
  const [namesRefresh, setNamesRefresh] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [queued, setQueued] = useState(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultsContainer = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploader = useFetcher<UploadResult>();
  const value = externalValue ?? local;

  const setValue = (next: string) => {
    if (externalValue === undefined) setLocal(next);
    onChange?.(next);
  };

  const nameByPath = useMemo(
    () => new Map(namedMedia.map((item) => [item.path, item.name])),
    [namedMedia]
  );
  const all = useMemo(
    () => [...new Set([...extraUploads, ...namedMedia.map((item) => item.path), ...uploaded, ...STATIC_PATHS])],
    [extraUploads, namedMedia, uploaded]
  );
  const matching = useMemo(() => {
    const query = search.trim().toLowerCase();
    return all.filter((path) =>
      path.toLowerCase().includes(query) || (nameByPath.get(path) || "").toLowerCase().includes(query)
    );
  }, [all, search, nameByPath]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    // Media assets use /media/<uuid> URLs, so resolve their actual filenames
    // through the authenticated D1 media registry for searching in this modal.
    void fetch("/admin/media/names", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal
    }).then(async (response) => {
      if (!response.ok) throw new Error("Cannot retrieve media names");
      return response.json() as Promise<{ items: NamedMedia[] }>;
    }).then((result) => {
      if (!controller.signal.aborted && Array.isArray(result.items)) setNamedMedia(result.items);
    }).catch(() => {
      // Legacy paths and images already passed from the editor remain usable.
    });
    return () => controller.abort();
  }, [open, namesRefresh]);
  const choices = useMemo(() => matching.slice(0, displayCount), [matching, displayCount]);

  // The grid already has the complete image path list. Render it progressively as
  // the user scrolls INSIDE the modal rather than displaying page controls.
  useEffect(() => {
    if (!open) return;
    setDisplayCount(48);
    if (resultsContainer.current) resultsContainer.current.scrollTop = 0;
  }, [open, search]);

  useEffect(() => {
    if (!open || choices.length >= matching.length) return;
    const container = resultsContainer.current;
    if (container && container.scrollHeight <= container.clientHeight + 24) {
      setDisplayCount((count) => Math.min(count + 48, matching.length));
    }
  }, [open, choices.length, matching.length]);

  const loadOnScroll = () => {
    const container = resultsContainer.current;
    if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 140) {
      setDisplayCount((count) => Math.min(count + 48, matching.length));
    }
  };
  const previewSrc =
    !value || value.startsWith("/") || /^https?:\/\//i.test(value)
      ? value
      : `/images/${encodeURIComponent(value)}`;

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    searchInput.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      returnFocus.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!uploader.data?.success || !uploader.data.files?.length) return;
    const files = uploader.data.files;
    const paths = files.map((file) => file.path);
    setExtraUploads((current) => [...paths, ...current.filter((item) => !paths.includes(item))]);
    setNamesRefresh((count) => count + 1);
    setValue(paths[0]);
    setSearch("");
    setUploadMessage(
      `${paths.length} image${paths.length === 1 ? "" : "s"} uploaded. ${
        paths.length === 1 ? "The image is" : "The first image is"
      } selected.`
    );
    if (fileInput.current) fileInput.current.value = "";
    setQueued(0);
  }, [uploader.data]);

  const upload = () => {
    const files = Array.from(fileInput.current?.files || []);
    if (!files.length) {
      setUploadMessage("Choose at least one image first.");
      return;
    }
    const form = new FormData();
    form.set("csrf", csrf);
    form.set("operation", "upload");
    files.forEach((file) => form.append("files", file));
    setUploadMessage("");
    uploader.submit(form, {
      method: "post",
      action: "/admin/media/upload",
      encType: "multipart/form-data"
    });
  };

  return (
    <div>
      <label className="form-label" htmlFor={id}>
        {label.replaceAll("_", " ")}
      </label>
      <div className="d-flex gap-2">
        <input
          className="form-control"
          id={id}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={2048}
          placeholder="/images/..."
        />
        <button
          type="button"
          className="btn btn-outline-secondary text-nowrap"
          onClick={() => setOpen(true)}
        >
          Browse
        </button>
      </div>
      {previewSrc && (
        <img
          src={previewSrc}
          alt={`Preview: ${label}`}
          className="rounded border mt-2 media-selector-preview"
          loading="lazy"
        />
      )}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="media-selector-backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Choose image for ${label}`}
              className="card shadow-lg border-0 media-selector-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="card-header media-selector-header">
                <div>
                  <h3 className="h6 m-0">Choose {label.replaceAll("_", " ")} image</h3>
                  <p className="small text-secondary mb-0">
                    Browse the library or upload new images.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close media selector"
                  onClick={() => setOpen(false)}
                />
              </div>
              <div className="card-body media-selector-body">
                <div className="media-selector-upload">
                  <div className="flex-grow-1">
                    <label className="form-label small fw-semibold" htmlFor={`${id}-upload`}>
                      Upload new images
                    </label>
                    <input
                      ref={fileInput}
                      id={`${id}-upload`}
                      className="form-control form-control-sm"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      multiple
                      onChange={(event) => setQueued(event.target.files?.length || 0)}
                    />
                    <span className="small text-secondary">Choose up to 12 images, 3 MB each.</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={upload}
                    disabled={uploader.state !== "idle"}
                  >
                    {uploader.state !== "idle"
                      ? "Uploading…"
                      : `Upload${queued ? ` (${queued})` : ""}`}
                  </button>
                </div>
                {uploadMessage && (
                  <p className="small text-secondary mb-2" role="status">
                    {uploadMessage}
                  </p>
                )}
                {uploader.data?.error && (
                  <p className="small text-danger mb-2" role="alert">
                    {uploader.data.error}
                  </p>
                )}
                {!!uploader.data?.errors?.length && (
                  <ul className="small text-danger mb-2 ps-3" role="alert">
                    {uploader.data.errors.map((error) => (
                      <li key={error.name + error.message}>
                        {error.name}: {error.message}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="media-selector-search">
                  <i className="bi bi-search" aria-hidden="true" />
                  <input
                    ref={searchInput}
                    className="form-control form-control-sm"
                    aria-label="Search image paths"
                    placeholder="Search images by filename…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="media-selector-results" ref={resultsContainer} onScroll={loadOnScroll} aria-label="Image results">
                  <div className="media-selector-grid">
                    {choices.map((path) => (
                      <button
                        type="button"
                        className={
                          "media-selector-card" +
                          (path === value ? " media-selector-card-selected" : "")
                        }
                        key={path}
                        aria-pressed={path === value}
                        onClick={() => {
                          setValue(path);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <img src={path} alt="" loading="lazy" />
                        <span title={nameByPath.get(path) || path}>{nameByPath.get(path) || path.split("/").at(-1)}</span>
                      </button>
                    ))}
                  </div>
                  {matching.length === 0 && (
                    <p className="text-secondary small mb-0 p-3">No images match that search.</p>
                  )}
                </div>
                <p className="small text-secondary mb-0 mt-2" role="status">
                  Showing {choices.length} of {matching.length} matching images.
                  {choices.length < matching.length ? " Scroll within the image grid for more." : ""}
                </p>
              </div>
              <div className="card-footer media-selector-footer">
                <a
                  className="btn btn-sm btn-outline-primary"
                  href="/admin/media"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage library
                </a>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.querySelector(".admin-workspace") || document.body
        )}
    </div>
  );
}
