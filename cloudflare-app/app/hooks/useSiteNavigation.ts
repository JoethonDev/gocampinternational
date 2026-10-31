import { useEffect } from "react";
import { useLocation } from "react-router";

type Bootstrap = {
  Collapse?: { getOrCreateInstance: (element: Element) => { hide: () => void } };
  Dropdown?: {
    getOrCreateInstance: (element: Element) => { show: () => void; hide: () => void };
  };
  Modal?: { getOrCreateInstance: (element: Element) => { show: () => void } };
};

const getBootstrap = () => (window as Window & { bootstrap?: Bootstrap }).bootstrap;

const isReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useSiteNavigation() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".navbar.fixed-top");
    const backToTop = document.getElementById("backToTop");
    const collapse = nav?.querySelector<HTMLElement>(".navbar-collapse");
    const toggler = nav?.querySelector<HTMLElement>(".navbar-toggler");

    const onScroll = () => {
      nav?.classList.toggle("scrolled", window.scrollY > 8);
      nav?.classList.toggle("navbar-scrolled", window.scrollY > 100);
      backToTop?.classList.toggle("show", window.scrollY > 600);
    };

    const currentPath = pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll<HTMLAnchorElement>(".navbar .nav-link").forEach((link) => {
      const href = (link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      link.classList.toggle("active", href !== "#" && href === currentPath);
    });

    const preventHashJump = (event: MouseEvent) => {
      if ((event.target as Element).closest("a.dropdown-toggle[href='#']")) {
        event.preventDefault();
      }
    };

    const closeMobile = () => {
      if (window.innerWidth >= 1200 || !collapse?.classList.contains("show")) return;
      const api = getBootstrap()?.Collapse?.getOrCreateInstance(collapse);
      if (api) api.hide();
      else toggler?.click();
    };

    const onClickOutside = (event: MouseEvent) => {
      if (collapse?.classList.contains("show") && nav && !nav.contains(event.target as Node)) {
        closeMobile();
      }
    };

    const onNavLink = (event: Event) => {
      const anchor = (event.target as Element).closest("a");
      if (anchor && !anchor.classList.contains("dropdown-toggle")) closeMobile();
    };

    const dropdowns = Array.from(nav?.querySelectorAll<HTMLElement>(".nav-item.dropdown") || []);
    const hoverOpened = new WeakSet<HTMLElement>();

    const isDropdownOpen = (toggle: HTMLElement) =>
      Boolean(toggle.closest(".dropdown")?.querySelector(".dropdown-menu.show"));

    const hideDropdown = (toggle: HTMLElement) => {
      hoverOpened.delete(toggle);
      const instance = getBootstrap()?.Dropdown?.getOrCreateInstance(toggle);
      if (instance) instance.hide();
      else {
        toggle.setAttribute("aria-expanded", "false");
        toggle.closest(".dropdown")?.querySelector(".dropdown-menu")?.classList.remove("show");
      }
    };

    const hideOtherDropdowns = (current: HTMLElement) => {
      for (const item of dropdowns) {
        const toggle = item.querySelector<HTMLElement>(".dropdown-toggle");
        if (toggle && toggle !== current) hideDropdown(toggle);
      }
    };

    const hideAllDropdowns = () => {
      for (const item of dropdowns) {
        const toggle = item.querySelector<HTMLElement>(".dropdown-toggle");
        if (toggle) hideDropdown(toggle);
      }
    };

    const onDropdownShow = (event: Event) => {
      const toggle =
        event.target instanceof HTMLElement
          ? event.target.closest<HTMLElement>(".dropdown-toggle")
          : null;
      if (toggle) hideOtherDropdowns(toggle);
    };

    const cleanups: Array<() => void> = [];
    for (const item of dropdowns) {
      const toggle = item.querySelector<HTMLElement>(".dropdown-toggle");
      let delay: ReturnType<typeof setTimeout> | undefined;

      const open = () => {
        if (window.innerWidth < 1200 || !toggle) return;
        if (delay) clearTimeout(delay);
        hideOtherDropdowns(toggle);
        if (isDropdownOpen(toggle)) return;
        getBootstrap()?.Dropdown?.getOrCreateInstance(toggle).show();
        hoverOpened.add(toggle);
      };

      const leave = () => {
        if (window.innerWidth < 1200 || !toggle) return;
        delay = setTimeout(() => hideDropdown(toggle), 180);
      };

      item.addEventListener("mouseenter", open);
      item.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        item.removeEventListener("mouseenter", open);
        item.removeEventListener("mouseleave", leave);
        if (toggle) hoverOpened.delete(toggle);
        if (delay) clearTimeout(delay);
      });
    }

    const onDropdownClick = (event: MouseEvent) => {
      const toggle = (event.target as Element | null)?.closest<HTMLElement>(
        ".navbar .dropdown-toggle"
      );
      if (!toggle) return;
      event.preventDefault();
      event.stopPropagation();
      hideOtherDropdowns(toggle);
      if (isDropdownOpen(toggle)) {
        if (hoverOpened.has(toggle)) {
          hoverOpened.delete(toggle);
          return;
        }
        hideDropdown(toggle);
        return;
      }
      hoverOpened.delete(toggle);
      getBootstrap()?.Dropdown?.getOrCreateInstance(toggle).show();
    };

    const onLinkSelect = (event: MouseEvent) => {
      if ((event.target as Element).closest("a.dropdown-item")) hideAllDropdowns();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hideAllDropdowns();
    };

    const onResize = () => {
      if (window.innerWidth < 1200) hideAllDropdowns();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClickOutside);
    collapse?.addEventListener("click", onNavLink);
    nav?.addEventListener("show.bs.dropdown", onDropdownShow);
    nav?.addEventListener("click", preventHashJump);
    // Capture phase: Bootstrap's data-api and the collapse handler must not
    // also toggle the same click, otherwise the second menu closes again.
    nav?.addEventListener("click", onDropdownClick, true);
    nav?.addEventListener("click", onLinkSelect);
    nav?.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onResize);

    onScroll();
    hideAllDropdowns();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClickOutside);
      collapse?.removeEventListener("click", onNavLink);
      nav?.removeEventListener("show.bs.dropdown", onDropdownShow);
      nav?.removeEventListener("click", preventHashJump);
      nav?.removeEventListener("click", onDropdownClick, true);
      nav?.removeEventListener("click", onLinkSelect);
      nav?.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onResize);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [pathname, search]);
}

export { isReducedMotion };
