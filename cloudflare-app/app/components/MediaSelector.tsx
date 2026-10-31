import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import sourceMedia from "../legacy-media.json";

const STATIC_PATHS = (sourceMedia as Array<{ path: string }>).map((item) => item.path);
type UploadResult = { success?: boolean; path?: string; error?: string };

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
  const [extraUploads, setExtraUploads] = useState<string[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploader = useFetcher<UploadResult>();
  const value = externalValue ?? local;

  const setValue = (next: string) => {
    if (externalValue === undefined) setLocal(next);
    onChange?.(next);
  };

  const all = useMemo(
    () => [...new Set([...extraUploads, ...uploaded, ...STATIC_PATHS])],
    [extraUploads, uploaded]
  );
  const choices = useMemo(
    () => all.filter((path) => path.toLowerCase().includes(search.toLowerCase())).slice(0, 48),
    [all, search]
  );
  const previewSrc =
    !value || value.startsWith("/") || /^https?:\/\//i.test(value)
      ? value
      : `/images/${encodeURIComponent(value)}`;

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    searchInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocus.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!uploader.data?.success || !uploader.data.path) return;
    const path = uploader.data.path;
    setExtraUploads((current) => [path, ...current.filter((item) => item !== path)]);
    setValue(path);
    setSearch("");
    setUploadMessage("Image uploaded and selected.");
    if (fileInput.current) fileInput.current.value = "";
  }, [uploader.data]);

  const upload = () => {
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setUploadMessage("Choose an image file first.");
      return;
    }
    setUploadMessage("");
    const form = new FormData();
    form.set("csrf", csrf);
    form.set("operation", "upload");
    form.set("file", file);
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
      {open && (
        <div className="media-selector-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Choose image for ${label}`}
            className="card shadow-lg border-0 w-100 media-selector-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header d-flex justify-content-between align-items-center gap-3">
              <h3 className="h5 m-0">Choose {label.replaceAll("_", " ")} image</h3>
              <button
                type="button"
                className="btn-close"
                aria-label="Close media selector"
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="card-body overflow-auto">
              <div className="media-selector-upload">
                <div className="flex-grow-1">
                  <label className="form-label small fw-semibold" htmlFor={`${id}-upload`}>
                    Upload a new image
                  </label>
                  <input
                    ref={fileInput}
                    id={`${id}-upload`}
                    className="form-control form-control-sm"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={upload}
                  disabled={uploader.state !== "idle"}
                >
                  {uploader.state !== "idle" ? "Uploading…" : "Upload"}
                </button>
              </div>
              {uploadMessage && <p className="small text-secondary mb-2">{uploadMessage}</p>}
              {uploader.data?.error && (
                <p className="small text-danger mb-2" role="alert">
                  {uploader.data.error}
                </p>
              )}
              <input
                ref={searchInput}
                className="form-control form-control-sm mb-3"
                aria-label="Search image paths"
                placeholder="Search file names"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-2">
                {choices.map((path) => (
                  <div className="col" key={path}>
                    <button
                      type="button"
                      className="card p-2 text-start w-100 h-100 border"
                      onClick={() => {
                        setValue(path);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <img
                        src={path}
                        alt=""
                        className="media-selector-option-image"
                        loading="lazy"
                      />
                      <span className="small text-break media-selector-filename">
                        {path.split("/").at(-1)}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              {choices.length === 0 && <p className="text-secondary">No matches.</p>}
              {all.length > choices.length && (
                <p className="small text-secondary mt-3">
                  Displaying up to 48 of {all.length} assets. Search to refine.
                </p>
              )}
            </div>
            <div className="card-footer d-flex justify-content-between">
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
        </div>
      )}
    </div>
  );
}
