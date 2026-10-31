import { isReducedMotion, useSiteNavigation } from "../hooks/useSiteNavigation";
import { useLightbox } from "../hooks/useLightbox";

export function SiteInteractions() {
  useSiteNavigation();
  useLightbox();

  return (
    <>
      <div className="modal fade" id="imgLightbox" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content bg-transparent border-0 shadow-none">
            <button
              type="button"
              className="btn-close btn-close-white ms-auto mb-2"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
            <img
              id="imgLightboxImg"
              src=""
              alt=""
              className="img-fluid rounded-3 shadow-lg w-100 lightbox-image"
            />
          </div>
        </div>
      </div>
      <button
        id="backToTop"
        type="button"
        aria-label="Back to top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: isReducedMotion() ? "auto" : "smooth"
          })
        }
      >
        <i className="bi bi-arrow-up" aria-hidden="true" />
      </button>
    </>
  );
}
