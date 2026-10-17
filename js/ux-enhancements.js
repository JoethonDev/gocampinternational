/* UX enhancements — no theme changes. Nav shadow, active link, back-to-top, lazy images. */
(function () {
  // Sticky nav shadow
  var nav = document.querySelector(".navbar.fixed-top");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
    var btn = document.getElementById("backToTop");
    if (btn) btn.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Active nav link from current path (pretty-URL aware)
  try {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".navbar .nav-link").forEach(function (a) {
      var href = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      if (href !== "#" && href === path) a.classList.add("active");
    });
  } catch (e) { /* no-op */ }

  // Back-to-top
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("#backToTop");
    if (!btn) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  // Lazy-load below-the-fold images (skip first hero/banner image)
  try {
    var imgs = document.querySelectorAll("img:not([loading])");
    imgs.forEach(function (img, i) {
      if (i === 0) return;
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
    });
  } catch (e) { /* no-op */ }

  // Image fade-in: only touch images that are still loading (cached ones
  // stay as-is, so there is never a flash of hidden content). No infinite
  // animations — those jank scrolling when dozens run at once.
  try {
    document.querySelectorAll("img").forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) return;
      img.classList.add("ux-fading");
      function done() { img.classList.add("img-loaded"); }
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  } catch (e) { /* no-op */ }

  // Theme-safe lightbox for gallery links + gallery images (Bootstrap modal)
  try {
    var lightboxEl = document.getElementById("imgLightbox");
    var lightboxImg = document.getElementById("imgLightboxImg");
    function openLightbox(src, alt) {
      if (!lightboxEl || !lightboxImg || !src) return;
      lightboxImg.src = src;
      lightboxImg.alt = alt || "Gallery image";
      if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(lightboxEl).show();
      } else {
        window.open(src, "_blank", "noopener");
      }
    }
    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest('a[data-toggle="lightbox"]');
      if (link) {
        e.preventDefault();
        var img = link.querySelector("img");
        openLightbox(link.getAttribute("href"), img ? img.alt : "");
        return;
      }
      var gimg = e.target.closest && e.target.closest("#destination-gallery img");
      if (gimg && gimg.currentSrc) openLightbox(gimg.currentSrc || gimg.src, gimg.alt);
    });
  } catch (e) { /* no-op */ }

  // Forms: honeypot spam abort + submitting state (server ignores .hp-field too)
  try {
    ["leadForm", "contactForm", "landingPageForm"].forEach(function (id) {
      var form = document.getElementById(id);
      if (!form) return;
      form.addEventListener("submit", function (ev) {
        var hp = form.querySelector('[name="website"]');
        if (hp && hp.value) {
          // Likely bot: stop submission silently.
          if (ev) ev.preventDefault();
          return false;
        }
        form.classList.add("is-submitting");
        var btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = true;
          setTimeout(function () {
            form.classList.remove("is-submitting");
            btn.disabled = false;
          }, 15000);
        }
      });
    });
  } catch (e) { /* no-op */ }
})();
