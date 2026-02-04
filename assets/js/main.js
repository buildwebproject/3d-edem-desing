async function loadComponent(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const url = container.dataset.componentUrl;
  if (!url) return;
  if (container.children.length > 0) return;

  try {
    const res = await fetch(new URL(url, window.location.href), {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    container.innerHTML = await res.text();
  } catch (err) {
    console.error(err);
  }
}

function initHeader(container) {
  if (!container) return;

  const toggle = container.querySelector(".site-header__menu-toggle");
  const menu = container.querySelector(".site-header__menu");
  const backdrop = container.querySelector(".site-header__backdrop");
  const closeBtn = container.querySelector(".site-header__drawer-close");
  const searchToggle = container.querySelector(".site-header__search-toggle");
  const searchBackdrop = container.querySelector(
    ".site-header__search-modal-backdrop"
  );
  const searchModal = container.querySelector(".site-header__search-modal");
  const searchClose = container.querySelector(".site-header__search-modal-close");
  const searchInput = container.querySelector("#site-search-modal-input");
  if (!toggle || !menu) return;

  const lockScroll = () => {
    if (document.body.dataset.prevOverflow === undefined) {
      document.body.dataset.prevOverflow = document.body.style.overflow || "";
    }
    document.body.style.overflow = "hidden";
  };

  const unlockScroll = () => {
    const prev = document.body.dataset.prevOverflow;
    document.body.style.overflow = prev ?? "";
    delete document.body.dataset.prevOverflow;
  };

  const isSearchOpen = () => container.classList.contains("is-search-open");
  const isMenuOpen = () => container.classList.contains("is-menu-open");
  const syncScrollLock = () => {
    if (isMenuOpen() || isSearchOpen()) lockScroll();
    else unlockScroll();
  };

  const closeMenu = () => {
    container.classList.remove("is-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    syncScrollLock();
  };

  const openMenu = () => {
    closeSearch();
    container.classList.add("is-menu-open");
    toggle.setAttribute("aria-expanded", "true");
    syncScrollLock();
  };

  function closeSearch() {
    container.classList.remove("is-search-open");
    if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
    syncScrollLock();
  }

  function openSearch() {
    closeMenu();
    container.classList.add("is-search-open");
    if (searchToggle) searchToggle.setAttribute("aria-expanded", "true");
    syncScrollLock();
    if (searchInput && typeof searchInput.focus === "function") {
      setTimeout(() => searchInput.focus(), 0);
    }
  }

  toggle.addEventListener("click", () => {
    const isOpen = container.classList.contains("is-menu-open");
    if (isOpen) closeMenu();
    else openMenu();
  });

  container.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closeSearch();
    }
  });

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMenu);
  }

  if (searchToggle) {
    searchToggle.addEventListener("click", () => {
      if (isSearchOpen()) closeSearch();
      else openSearch();
    });
  }

  if (searchBackdrop) {
    searchBackdrop.addEventListener("click", closeSearch);
  }

  if (searchClose) {
    searchClose.addEventListener("click", closeSearch);
  }

  menu.addEventListener("click", (e) => {
    const target = e.target;
    if (target instanceof Element && target.closest("a")) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeMenu();
      closeSearch();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    const header = document.querySelector("#site-header");
    await loadComponent("#site-header");
    initHeader(header);
  })();
});
