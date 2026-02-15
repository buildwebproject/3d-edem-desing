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

function initModelsGrids() {
  const grids = Array.from(document.querySelectorAll("[data-models-grid]"));
  if (grids.length === 0) return;

  const createCard = ({ src, name, price, index }) => {
    const li = document.createElement("li");
    li.className = "model-card";

    const link = document.createElement("a");
    link.className = "model-card__link";
    link.href = "#";
    link.setAttribute("aria-label", `${name} model ${index} - ${price}`);

    const swatches = document.createElement("span");
    swatches.className = "model-card__swatches";
    swatches.setAttribute("aria-hidden", "true");

    const swatchColors = ["#6b4f2a", "#9ca3af", "#111827"];
    for (const color of swatchColors) {
      const swatch = document.createElement("span");
      swatch.className = "model-card__swatch";
      swatch.style.setProperty("--swatch", color);
      swatches.appendChild(swatch);
    }

    const media = document.createElement("span");
    media.className = "model-card__media";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `${name} model ${index}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => li.remove());
    media.appendChild(img);

    const meta = document.createElement("span");
    meta.className = "model-card__meta";

    const nameEl = document.createElement("span");
    nameEl.className = "model-card__name";
    nameEl.textContent = name;

    const priceEl = document.createElement("span");
    priceEl.className = "model-card__price";
    priceEl.textContent = price;

    meta.appendChild(nameEl);
    meta.appendChild(priceEl);

    link.appendChild(swatches);
    link.appendChild(media);
    link.appendChild(meta);
    li.appendChild(link);
    return li;
  };

  for (const grid of grids) {
    const start = Number.parseInt(grid.dataset.modelsStart || "7", 10);
    const end = Number.parseInt(grid.dataset.modelsEnd || "42", 10);
    const safeStart = Number.isFinite(start) ? start : 7;
    const safeEnd = Number.isFinite(end) ? end : safeStart;

    const name = "Table wood";
    const price = "7 $";

    for (let i = safeStart; i <= safeEnd; i += 1) {
      const filename = `Image (${i}).png`;
      const src = `assets/images/models/${encodeURIComponent(filename)}`;
      grid.appendChild(createCard({ src, name, price, index: i }));
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initModelsGrids();
});

function initFilterDropdowns() {
  const dropdowns = Array.from(
    document.querySelectorAll("[data-filter-dropdown]")
  );
  if (dropdowns.length === 0) return;

  const getParts = (root) => {
    const button = root.querySelector("[data-filter-dropdown-button]");
    const menu = root.querySelector("[data-filter-dropdown-menu]");
    const items = Array.from(root.querySelectorAll("[data-filter-dropdown-item]"));
    const buttonLabel = root.querySelector("[data-filter-dropdown-button-label]");
    const buttonIcon = root.querySelector("[data-filter-dropdown-button-icon]");
    const buttonIconImg =
      buttonIcon instanceof HTMLElement ? buttonIcon.querySelector("img") : null;
    if (
      !(button instanceof HTMLButtonElement) ||
      !(menu instanceof HTMLElement) ||
      !(buttonLabel instanceof HTMLElement) ||
      !(buttonIcon instanceof HTMLElement) ||
      !(buttonIconImg instanceof HTMLImageElement) ||
      items.length === 0
    ) {
      return null;
    }
    return { button, buttonLabel, buttonIcon, buttonIconImg, menu, items };
  };

  const getItemLabel = (item) => {
    const el = item.querySelector(".filter-dropdown__item-label");
    if (!(el instanceof HTMLElement)) return "";
    return (el.textContent || "").trim();
  };

  const getItemIconSrc = (item) => {
    const img = item.querySelector(".filter-dropdown__item-icon-img");
    if (!(img instanceof HTMLImageElement)) return null;
    const src = img.getAttribute("src");
    return src && src.trim() ? src : null;
  };

  const syncButtonFromSelected = (root) => {
    const parts = getParts(root);
    if (!parts) return;

    const selected =
      parts.items.find((item) => item.getAttribute("aria-checked") === "true") ||
      parts.items[0];
    if (!selected) return;

    const label = getItemLabel(selected) || "FORMAT";
    const iconSrc = getItemIconSrc(selected);

    parts.buttonLabel.textContent = label;
    parts.button.classList.toggle("is-selected", label !== "FORMAT");

    if (iconSrc) {
      parts.buttonIcon.hidden = false;
      parts.buttonIconImg.setAttribute("src", iconSrc);
      parts.button.classList.add("has-icon");
    } else {
      parts.buttonIcon.hidden = true;
      parts.buttonIconImg.removeAttribute("src");
      parts.button.classList.remove("has-icon");
    }
  };

  const isOpen = (root) => {
    const parts = getParts(root);
    if (!parts) return false;
    return parts.button.getAttribute("aria-expanded") === "true";
  };

  const closeDropdown = (root, { focusButton = false } = {}) => {
    const parts = getParts(root);
    if (!parts) return;
    root.classList.remove("is-open");
    parts.button.setAttribute("aria-expanded", "false");
    parts.menu.hidden = true;
    if (focusButton) parts.button.focus();
  };

  const closeAll = (exceptRoot = null) => {
    for (const root of dropdowns) {
      if (exceptRoot && root === exceptRoot) continue;
      if (isOpen(root)) closeDropdown(root);
    }
  };

  const syncRovingTabIndex = (items) => {
    const selected =
      items.find((item) => item.getAttribute("aria-checked") === "true") ||
      items[0];
    for (const item of items) item.tabIndex = item === selected ? 0 : -1;
  };

  const openDropdown = (root, { focusSelected = false } = {}) => {
    const parts = getParts(root);
    if (!parts) return;
    closeAll(root);
    root.classList.add("is-open");
    parts.button.setAttribute("aria-expanded", "true");
    parts.menu.hidden = false;
    positionMenu(root);
    syncRovingTabIndex(parts.items);
    if (focusSelected) {
      const selected =
        parts.items.find((item) => item.getAttribute("aria-checked") === "true") ||
        parts.items[0];
      selected.focus();
    }
  };

  const setSelected = (root, next) => {
    const parts = getParts(root);
    if (!parts) return;
    for (const item of parts.items) {
      item.setAttribute("aria-checked", item === next ? "true" : "false");
    }
    syncRovingTabIndex(parts.items);
    syncButtonFromSelected(root);
  };

  for (const root of dropdowns) {
    const parts = getParts(root);
    if (!parts) continue;

    syncRovingTabIndex(parts.items);
    syncButtonFromSelected(root);

    parts.button.addEventListener("click", () => {
      if (isOpen(root)) closeDropdown(root);
      else openDropdown(root);
    });

    parts.button.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown(root, { focusSelected: true });
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isOpen(root)) closeDropdown(root, { focusButton: true });
        else openDropdown(root, { focusSelected: false });
      }
    });

    parts.menu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown(root, { focusButton: true });
        return;
      }

      const items = parts.items;
      const active = document.activeElement;
      const currentIndex = items.findIndex((item) => item === active);
      if (currentIndex === -1) return;

      const moveFocus = (index) => {
        const clamped = (index + items.length) % items.length;
        items[clamped].focus();
      };

      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(currentIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(currentIndex - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        moveFocus(0);
      } else if (e.key === "End") {
        e.preventDefault();
        moveFocus(items.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const current = items[currentIndex];
        setSelected(root, current);
        closeDropdown(root, { focusButton: true });
      }
    });

    for (const item of parts.items) {
      item.addEventListener("click", () => {
        setSelected(root, item);
        closeDropdown(root);
      });
    }
  }

  function positionMenu(root) {
    const parts = getParts(root);
    if (!parts) return;
    if (parts.menu.hidden) return;

    const rect = parts.button.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 16;

    const menuWidth = parts.menu.offsetWidth || 320;
    const desiredHeight = parts.menu.scrollHeight || 0;

    let left = rect.left;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - menuWidth - viewportPadding)
    );

    // Always open below the chip (no "flip to top").
    let top = rect.bottom + gap;
    const availableBelow = window.innerHeight - top - viewportPadding;
    const fitHeight = Math.max(140, Math.min(desiredHeight, availableBelow));
    parts.menu.style.maxHeight = `${Math.round(fitHeight)}px`;
    if (availableBelow < 40) {
      top = Math.max(viewportPadding, window.innerHeight - viewportPadding - fitHeight);
    }

    parts.menu.style.left = `${Math.round(left)}px`;
    parts.menu.style.top = `${Math.round(top)}px`;
  }

  let raf = 0;
  const scheduleReposition = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      const openRoot = dropdowns.find((root) => isOpen(root));
      if (openRoot) positionMenu(openRoot);
    });
  };

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      for (const root of dropdowns) {
        if (!isOpen(root)) continue;
        if (root.contains(target)) continue;
        closeDropdown(root);
      }
    },
    { capture: true }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAll();
  });

  window.addEventListener("resize", scheduleReposition);
  document.addEventListener("scroll", scheduleReposition, {
    capture: true,
    passive: true,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFilterDropdowns();
});
