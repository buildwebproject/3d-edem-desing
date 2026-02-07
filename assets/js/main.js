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
  const accountMenu = container.querySelector(".site-header__account");
  const langSelects = Array.from(
    container.querySelectorAll(".site-header__lang-select")
  );
  if (!toggle || !menu) return;

  const applyLang = (value) => {
    if (!value) return;
    document.documentElement.lang = value;
    try {
      window.localStorage.setItem("lang", value);
    } catch {
      // ignore
    }
    for (const select of langSelects) {
      if (select.value !== value) select.value = value;
    }
  };

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
    if (accountMenu) accountMenu.removeAttribute("open");
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
    if (accountMenu) accountMenu.removeAttribute("open");
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
      if (accountMenu) accountMenu.removeAttribute("open");
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

  if (accountMenu) {
    accountMenu.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof Element && target.closest("a")) {
        accountMenu.removeAttribute("open");
      }
    });

    document.addEventListener(
      "click",
      (e) => {
        if (!accountMenu.hasAttribute("open")) return;
        const target = e.target;
        if (target instanceof Node && !accountMenu.contains(target)) {
          accountMenu.removeAttribute("open");
        }
      },
      { capture: true }
    );
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeMenu();
      closeSearch();
    }
  });

  for (const select of langSelects) {
    select.addEventListener("change", (e) => {
      const target = e.target;
      if (target instanceof HTMLSelectElement) applyLang(target.value);
    });
  }

  try {
    const saved = window.localStorage.getItem("lang");
    if (saved) applyLang(saved);
  } catch {
    // ignore
  }
}

document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    const header = document.querySelector("#site-header");
    await loadComponent("#site-header");
    initHeader(header);
  })();
});

function initSpacesCarousels() {
  const carousels = Array.from(document.querySelectorAll("[data-spaces-carousel]"));
  if (carousels.length === 0) return;

  for (const carousel of carousels) {
    const scroller = carousel.querySelector(".spaces__scroller");
    const prev = carousel.querySelector('[data-spaces-nav="prev"]');
    const next = carousel.querySelector('[data-spaces-nav="next"]');
    if (!(scroller instanceof HTMLElement) || !(prev instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)) {
      continue;
    }

    const getStep = () => Math.max(180, Math.round(scroller.clientWidth * 0.75));

    const update = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      carousel.dataset.overflow = hasOverflow ? "true" : "false";
      prev.disabled = !hasOverflow || scroller.scrollLeft <= 1;
      next.disabled = !hasOverflow || scroller.scrollLeft >= maxScrollLeft - 1;
    };

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    prev.addEventListener("click", () => {
      scroller.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      scroller.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    scroller.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSpacesCarousels();
});

function initMainCatCarousels() {
  const carousels = Array.from(
    document.querySelectorAll("[data-main-cat-carousel]")
  );
  if (carousels.length === 0) return;

  for (const carousel of carousels) {
    const scroller = carousel.querySelector(".main-cat__scroller");
    const prev = carousel.querySelector('[data-main-cat-nav="prev"]');
    const next = carousel.querySelector('[data-main-cat-nav="next"]');
    if (
      !(scroller instanceof HTMLElement) ||
      !(prev instanceof HTMLButtonElement) ||
      !(next instanceof HTMLButtonElement)
    ) {
      continue;
    }

    const getStep = () => Math.max(220, Math.round(scroller.clientWidth * 0.75));

    const update = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      carousel.dataset.overflow = hasOverflow ? "true" : "false";
      prev.disabled = !hasOverflow || scroller.scrollLeft <= 1;
      next.disabled =
        !hasOverflow || scroller.scrollLeft >= maxScrollLeft - 1;
    };

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    prev.addEventListener("click", () => {
      scroller.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      scroller.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    scroller.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initMainCatCarousels();
});

function initCatStrips() {
  const carousels = Array.from(document.querySelectorAll("[data-cat-carousel]"));
  if (carousels.length === 0) return;

  for (const carousel of carousels) {
    const scroller = carousel.querySelector(".cat-strip__scroller");
    const prev = carousel.querySelector('[data-cat-nav="prev"]');
    const next = carousel.querySelector('[data-cat-nav="next"]');
    if (
      !(scroller instanceof HTMLElement) ||
      !(prev instanceof HTMLButtonElement) ||
      !(next instanceof HTMLButtonElement)
    ) {
      continue;
    }

    const getStep = () => Math.max(200, Math.round(scroller.clientWidth * 0.75));

    const update = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      carousel.dataset.overflow = hasOverflow ? "true" : "false";
      prev.disabled = !hasOverflow || scroller.scrollLeft <= 1;
      next.disabled = !hasOverflow || scroller.scrollLeft >= maxScrollLeft - 1;
    };

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    prev.addEventListener("click", () => {
      scroller.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      scroller.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    scroller.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCatStrips();
});

function initSubCatStrips() {
  const carousels = Array.from(
    document.querySelectorAll("[data-sub-cat-carousel]")
  );
  if (carousels.length === 0) return;

  for (const carousel of carousels) {
    const scroller = carousel.querySelector(".sub-cat__scroller");
    const prev = carousel.querySelector('[data-sub-cat-nav="prev"]');
    const next = carousel.querySelector('[data-sub-cat-nav="next"]');
    if (
      !(scroller instanceof HTMLElement) ||
      !(prev instanceof HTMLButtonElement) ||
      !(next instanceof HTMLButtonElement)
    ) {
      continue;
    }

    const getStep = () => Math.max(260, Math.round(scroller.clientWidth * 0.75));

    const update = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      carousel.dataset.overflow = hasOverflow ? "true" : "false";
      prev.disabled = !hasOverflow || scroller.scrollLeft <= 1;
      next.disabled = !hasOverflow || scroller.scrollLeft >= maxScrollLeft - 1;
    };

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    prev.addEventListener("click", () => {
      scroller.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      scroller.scrollBy({ left: getStep(), behavior: "smooth" });
    });

    scroller.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSubCatStrips();
});
