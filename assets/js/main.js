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

function initFilterCarousel() {
  const carousels = Array.from(
    document.querySelectorAll("[data-filter-carousel]")
  );
  if (carousels.length === 0) return;

  for (const carousel of carousels) {
    const scroller = carousel.querySelector(".filter__scroller");
    const prev = carousel.querySelector('[data-filter-nav="prev"]');
    const next = carousel.querySelector('[data-filter-nav="next"]');
    if (
      !(scroller instanceof HTMLElement) ||
      !(prev instanceof HTMLButtonElement) ||
      !(next instanceof HTMLButtonElement)
    ) {
      continue;
    }

    const getStep = () => Math.max(160, Math.round(scroller.clientWidth * 0.75));

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
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleUpdate);
      observer.observe(scroller);
      const row = scroller.querySelector(".filter__row");
      if (row instanceof HTMLElement) observer.observe(row);
    }

    update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initFilterCarousel();
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
  const isMultiSelect = (root) =>
    root.dataset.filterDropdownMulti === "true";
  const isStrictSingle = (root) =>
    root.dataset.filterDropdownStrictSingle === "true";

  const getParts = (root) => {
    const button = root.querySelector("[data-filter-dropdown-button]");
    const menu = root.querySelector("[data-filter-dropdown-menu]");
    const items = Array.from(root.querySelectorAll("[data-filter-dropdown-item]"));
    const buttonLabel = root.querySelector("[data-filter-dropdown-button-label]");
    const buttonIcon = root.querySelector("[data-filter-dropdown-button-icon]");
    const buttonIconImg =
      buttonIcon instanceof HTMLElement ? buttonIcon.querySelector("img") : null;
    const focusTarget = menu?.querySelector("[data-filter-dropdown-focus-target]");

    if (
      !(button instanceof HTMLButtonElement) ||
      !(menu instanceof HTMLElement) ||
      !(buttonLabel instanceof HTMLElement)
    ) {
      return null;
    }

    const defaultLabel =
      (
        button.dataset.filterDropdownDefaultLabel ||
        buttonLabel.textContent ||
        "FORMAT"
      ).trim() || "FORMAT";
    const keepLabel = button.dataset.filterDropdownKeepLabel === "true";
    const dynamicIcon = button.dataset.filterDropdownDynamicIcon !== "false";

    if (
      dynamicIcon &&
      (!(buttonIcon instanceof HTMLElement) ||
        !(buttonIconImg instanceof HTMLImageElement))
    ) {
      return null;
    }

    return {
      button,
      buttonLabel,
      buttonIcon,
      buttonIconImg,
      menu,
      items,
      focusTarget: focusTarget instanceof HTMLElement ? focusTarget : null,
      defaultLabel,
      keepLabel,
      dynamicIcon,
      multiSelect: isMultiSelect(root),
      strictSingle: isStrictSingle(root),
    };
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

  const getItemSwatchColor = (item) => {
    const swatch = item.querySelector(".filter-color__swatch");
    if (!(swatch instanceof HTMLElement)) return null;
    const custom = swatch.style.getPropertyValue("--swatch").trim();
    if (custom) return custom;
    const computed = window.getComputedStyle(swatch).backgroundColor;
    return computed && computed !== "rgba(0, 0, 0, 0)" ? computed : null;
  };

  const normalizeBrandValue = (value) => value.trim().replace(/\s+/g, " ");

  const getBrandInput = (root) => {
    const input = root.querySelector(".filter-brand__input");
    return input instanceof HTMLInputElement ? input : null;
  };

  const syncColorPreview = (root, selectedItems = []) => {
    if (!root.classList.contains("filter-dropdown--color")) return;
    const preview = root.querySelector(".filter-chip__color-preview");
    const button = root.querySelector("[data-filter-dropdown-button]");
    if (!(preview instanceof HTMLElement)) return;

    const colors = selectedItems
      .map((item) => getItemSwatchColor(item))
      .filter((color) => typeof color === "string" && color.trim().length > 0);

    preview.textContent = "";
    for (const color of colors) {
      const dot = document.createElement("span");
      dot.className = "filter-chip__color-dot";
      dot.style.backgroundColor = color;
      preview.appendChild(dot);
    }

    if (button instanceof HTMLElement) {
      if (colors.length > 0) {
        button.dataset.colorCount = String(colors.length);
      } else {
        button.removeAttribute("data-color-count");
      }
    }
  };

  const syncMaterialPreview = (root, selectedItems = []) => {
    if (!root.classList.contains("filter-dropdown--material")) return;
    const preview = root.querySelector(".filter-chip__material-preview");
    const button = root.querySelector("[data-filter-dropdown-button]");
    if (!(preview instanceof HTMLElement)) return;

    const iconSources = selectedItems
      .map((item) => getItemIconSrc(item))
      .filter((src) => typeof src === "string" && src.trim().length > 0);

    preview.textContent = "";
    for (const src of iconSources) {
      const dot = document.createElement("span");
      dot.className = "filter-chip__material-dot";
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.decoding = "async";
      dot.appendChild(img);
      preview.appendChild(dot);
    }

    if (button instanceof HTMLElement) {
      if (iconSources.length > 0) {
        button.dataset.materialCount = String(iconSources.length);
      } else {
        button.removeAttribute("data-material-count");
      }
    }
  };

  const syncShapePreview = (root, selectedItem = null) => {
    if (!root.classList.contains("filter-dropdown--shape")) return;
    const preview = root.querySelector(".filter-chip__shape-preview");
    if (!(preview instanceof HTMLElement)) return;

    const shapeSrc =
      selectedItem instanceof HTMLElement
        ? getItemIconSrc(selectedItem)
        : null;

    preview.textContent = "";

    if (shapeSrc) {
      const img = document.createElement("img");
      img.className = "filter-chip__shape-preview-img";
      img.src = shapeSrc;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.decoding = "async";
      preview.appendChild(img);
      return;
    }
  };

  const syncButtonFromSelected = (root) => {
    const parts = getParts(root);
    if (!parts) return;

    if (root.classList.contains("filter-dropdown--brand")) {
      const brandInput = getBrandInput(root);
      const candidate = root.dataset.brandValue || brandInput?.value || "";
      const brandValue = normalizeBrandValue(candidate);

      if (brandInput && brandInput.value !== brandValue) {
        brandInput.value = brandValue;
      }

      if (brandValue) {
        root.dataset.brandValue = brandValue;
        parts.buttonLabel.textContent = brandValue.toUpperCase();
        parts.button.classList.add("is-selected");
      } else {
        root.removeAttribute("data-brand-value");
        parts.buttonLabel.textContent = parts.defaultLabel;
        parts.button.classList.remove("is-selected");
      }
      return;
    }

    const selectedItems = parts.items.filter(
      (item) => item.getAttribute("aria-checked") === "true"
    );
    const selected = selectedItems[0] || null;

    if (parts.items.length === 0) {
      parts.buttonLabel.textContent = parts.defaultLabel;
      parts.button.classList.remove("is-selected");
      if (
        parts.dynamicIcon &&
        parts.buttonIcon instanceof HTMLElement &&
        parts.buttonIconImg instanceof HTMLImageElement
      ) {
        parts.buttonIcon.hidden = true;
        parts.buttonIconImg.removeAttribute("src");
        parts.button.classList.remove("has-icon");
      }
      syncColorPreview(root);
      syncMaterialPreview(root);
      syncShapePreview(root);
      return;
    }

    if (!selected) {
      parts.buttonLabel.textContent = parts.defaultLabel;
      parts.button.classList.remove("is-selected");
      if (
        parts.dynamicIcon &&
        parts.buttonIcon instanceof HTMLElement &&
        parts.buttonIconImg instanceof HTMLImageElement
      ) {
        parts.buttonIcon.hidden = true;
        parts.buttonIconImg.removeAttribute("src");
        parts.button.classList.remove("has-icon");
      }
      syncColorPreview(root);
      syncMaterialPreview(root);
      syncShapePreview(root);
      return;
    }

    const label = parts.keepLabel
      ? parts.defaultLabel
      : parts.multiSelect
        ? `${selectedItems.length} selected`
        : getItemLabel(selected) || parts.defaultLabel;

    parts.buttonLabel.textContent = label;
    parts.button.classList.add("is-selected");
    syncColorPreview(root, selectedItems);
    syncMaterialPreview(root, selectedItems);
    syncShapePreview(root, selected);

    if (
      parts.dynamicIcon &&
      parts.buttonIcon instanceof HTMLElement &&
      parts.buttonIconImg instanceof HTMLImageElement
    ) {
      const iconSrc = getItemIconSrc(selected);
      if (iconSrc) {
        parts.buttonIcon.hidden = false;
        parts.buttonIconImg.setAttribute("src", iconSrc);
        parts.button.classList.add("has-icon");
      } else {
        parts.buttonIcon.hidden = true;
        parts.buttonIconImg.removeAttribute("src");
        parts.button.classList.remove("has-icon");
      }
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
    if (items.length === 0) return;
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
      if (parts.items.length > 0) {
        const selected =
          parts.items.find((item) => item.getAttribute("aria-checked") === "true") ||
          parts.items[0];
        selected.focus();
      } else if (parts.focusTarget) {
        parts.focusTarget.focus();
      }
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

  const toggleSelected = (root, next) => {
    const parts = getParts(root);
    if (!parts) return;
    const isChecked = next.getAttribute("aria-checked") === "true";
    next.setAttribute("aria-checked", isChecked ? "false" : "true");
    syncRovingTabIndex(parts.items);
    syncButtonFromSelected(root);
  };

  const clearSelected = (root) => {
    const parts = getParts(root);
    if (!parts) return;
    for (const item of parts.items) {
      item.setAttribute("aria-checked", "false");
    }
    syncRovingTabIndex(parts.items);
    syncButtonFromSelected(root);
  };

  for (const root of dropdowns) {
    const parts = getParts(root);
    if (!parts) continue;
    const multiSelect = parts.multiSelect;
    const strictSingle = parts.strictSingle;

    if (multiSelect) {
      for (const item of parts.items) {
        item.setAttribute("role", "menuitemcheckbox");
      }
    }

    syncRovingTabIndex(parts.items);
    syncButtonFromSelected(root);

    if (root.classList.contains("filter-dropdown--brand")) {
      const brandInput = getBrandInput(root);
      if (brandInput) {
        brandInput.addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          e.stopPropagation();

          const value = normalizeBrandValue(brandInput.value);
          if (value) {
            root.dataset.brandValue = value;
          } else {
            root.removeAttribute("data-brand-value");
          }

          syncButtonFromSelected(root);
          closeDropdown(root, { focusButton: true });
        });
      }
    }

    parts.button.addEventListener("click", () => {
      if (isOpen(root)) closeDropdown(root);
      else openDropdown(root, { focusSelected: true });
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
        if (multiSelect) {
          toggleSelected(root, current);
          current.focus();
          positionMenu(root);
        } else {
          setSelected(root, current);
          closeDropdown(root, { focusButton: true });
        }
      }
    });

    for (const item of parts.items) {
      item.addEventListener("click", () => {
        if (multiSelect) {
          toggleSelected(root, item);
          item.focus();
          positionMenu(root);
          return;
        }

        if (item.getAttribute("aria-checked") === "true") {
          if (strictSingle) {
            setSelected(root, item);
            closeDropdown(root);
            return;
          }
          clearSelected(root);
          item.focus();
          positionMenu(root);
          return;
        }
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
    const gap = 9;

    const menuWidth = parts.menu.offsetWidth || 320;
    const desiredHeight = parts.menu.scrollHeight || 0;

    let left = rect.left;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - menuWidth - viewportPadding)
    );

    const topBelow = rect.bottom + gap;
    const availableBelow = window.innerHeight - topBelow - viewportPadding;
    const maxViewportHeight = window.innerHeight - viewportPadding * 2;
    const minMenuHeight = Number.parseInt(parts.menu.dataset.minHeight || "56", 10);
    const safeMinMenuHeight = Number.isFinite(minMenuHeight) ? minMenuHeight : 56;
    const keepAnchoredBelow = root.classList.contains("filter-dropdown--material");

    let top = topBelow;
    let fitHeight = desiredHeight;

    if (desiredHeight <= availableBelow) {
      // Content fits below trigger: keep natural height.
      fitHeight = desiredHeight;
    } else if (!keepAnchoredBelow && desiredHeight <= maxViewportHeight) {
      // Content can fit on screen: shift upward to preserve natural height.
      fitHeight = desiredHeight;
      const maxTop = window.innerHeight - viewportPadding - fitHeight;
      top = Math.max(viewportPadding, maxTop);
    } else {
      // Very tall content (e.g. FORMAT): keep menu anchored below and scroll.
      fitHeight = Math.max(
        safeMinMenuHeight,
        Math.min(availableBelow, maxViewportHeight)
      );
      if (availableBelow < safeMinMenuHeight) {
        top = Math.max(
          viewportPadding,
          window.innerHeight - viewportPadding - fitHeight
        );
      }
    }

    parts.menu.style.maxHeight = `${Math.round(fitHeight)}px`;

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
